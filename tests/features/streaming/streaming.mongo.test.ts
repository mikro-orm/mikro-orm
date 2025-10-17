import { defineEntity, ObjectId, SimpleLogger, MikroORM } from '@mikro-orm/mongodb';

const Author = defineEntity({
  name: 'Author',
  properties: p => ({
    _id: p.type(ObjectId).primary(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
    name: p.string(),
    email: p.string().unique(),
    termsAccepted: p.boolean().name('terms_accepted').onCreate(() => false),
    books: () => p.oneToMany(Book).mappedBy('author'),
  }),
});

const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    _id: p.type(ObjectId).primary(),
    title: p.string(),
    author: p.manyToOne(Author),
    tags: () => p.manyToMany(BookTag),
  }),
});

const BookTag = defineEntity({
  name: 'BookTag',
  properties: p => ({
    _id: p.type(ObjectId).primary(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  }),
});


let orm: MikroORM;

async function createBooksWithTags() {
  const author = orm.em.create(Author, {
    name: 'Jon Snow',
    email: 'snow@wall.st',
    books: [
      { title: 'My Life on The Wall, part 1' },
      { title: 'My Life on The Wall, part 2' },
      { title: 'My Life on The Wall, part 3' },
    ],
  });
  const tag1 = orm.em.create(BookTag, { name: 'silly' });
  const tag2 = orm.em.create(BookTag, { name: 'funny' });
  const tag3 = orm.em.create(BookTag, { name: 'sick' });
  const tag4 = orm.em.create(BookTag, { name: 'strange' });
  const tag5 = orm.em.create(BookTag, { name: 'sexy' });
  author.books[0].tags.add(tag1, tag3);
  author.books[1].tags.add(tag1, tag2, tag5);
  author.books[2].tags.add(tag2, tag4, tag5);
  await orm.em.flush();
  orm.em.clear();
}

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book, BookTag],
    dbName: 'mikro_orm_test_streaming',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
  await orm.em.insertMany(Author, [
    { name: 'a1', email: 'e1', termsAccepted: false },
    { name: 'a2', email: 'e2', termsAccepted: false },
    { name: 'a3', email: 'e3', termsAccepted: false },
    { name: 'a4', email: 'e4', termsAccepted: false },
    { name: 'a5', email: 'e5', termsAccepted: false },
  ]);
  await createBooksWithTags();
});
beforeEach(async () => orm.em.clear());
afterAll(async () => {
  await orm.close(true);
});

test('streaming full entities', async () => {
  const stream = orm.em.stream(Author, {
    orderBy: { _id: 'desc' },
  });
  const authors = [];

  for await (const author of stream) {
    authors.push(author);
  }

  expect(authors).toHaveLength(6);
  expect(authors[0]).toMatchObject({
    _id: expect.any(ObjectId),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
    name: 'Jon Snow',
    email: 'snow@wall.st',
    termsAccepted: false,
  });
});

// TODO add validation for `em.stream` with populate hint
test('streaming row-by-row', async () => {
  const stream = orm.em.stream(Author, {
    orderBy: { _id: 'desc' },
    mergeResults: false,
  });
  const authors = [];

  for await (const author of stream) {
    authors.push(author);
  }

  expect(authors).toHaveLength(6);
  expect(authors[0]).toMatchObject({
    _id: expect.any(ObjectId),
    email: 'snow@wall.st',
    termsAccepted: false,
  });
  expect(authors[1]).toMatchObject({
    _id: expect.any(ObjectId),
    email: 'e5',
    termsAccepted: false,
  });
  expect(authors[2]).toMatchObject({
    _id: expect.any(ObjectId),
    email: 'e4',
    termsAccepted: false,
  });
  expect(authors[3]).toMatchObject({
    _id: expect.any(ObjectId),
    email: 'e3',
    termsAccepted: false,
  });
  expect(authors[4]).toMatchObject({
    _id: expect.any(ObjectId),
    email: 'e2',
    termsAccepted: false,
  });
  expect(authors[5]).toMatchObject({
    _id: expect.any(ObjectId),
    email: 'e1',
    termsAccepted: false,
  });

  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
});

test('streaming raw results', async () => {
  const stream = orm.em.getDriver().stream(Author, {}, {
    orderBy: { _id: -1 },
    rawResults: true,
  });
  const authors = [];

  for await (const author of stream) {
    authors.push(author);
  }

  expect(authors).toHaveLength(6);
  expect(authors[0]).toMatchObject({
    _id: expect.any(ObjectId),
    name: 'Jon Snow',
    email: 'snow@wall.st',
    terms_accepted: false,
  });
  expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toHaveLength(0);
});
