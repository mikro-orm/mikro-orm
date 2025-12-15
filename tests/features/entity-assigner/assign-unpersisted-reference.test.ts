import {
  MikroORM,
  defineEntity,
  p,
  wrap,
} from '@mikro-orm/sqlite';

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    publisher: () => p.manyToOne(Publisher),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().nullable(),
    age: p.integer().nullable(),
    favoriteBook: () => p.manyToOne(Book).nullable(),
    favoriteBookAssignedAt: p.datetime().nullable(),
    mentor: () => p.manyToOne(Author).nullable(),
  },
});

describe('assign() with getReference() and unpersisted ManyToOne relations', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, Publisher],
      dbName: ':memory:',
    });

    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.clearDatabase());

  test('getReference + assign correctly handles unpersisted relation FK', async () => {
    // Setup: Create existing author in DB
    const author = orm.em.create(Author, { name: 'John Doe' });
    await orm.em.flush();
    const authorId = author.id;
    orm.em.clear();

    // Action: Create new book with unpersisted publisher and assign to author using getReference
    const newPublisher = orm.em.create(Publisher, { name: 'Tech Books Inc' });
    const newBook = orm.em.create(Book, {
      title: 'Learning MikroORM',
      publisher: newPublisher, // Unpersisted publisher
    });

    const authorRef = orm.em.getReference(Author, authorId);
    wrap(authorRef).assign({
      email: 'john.updated@example.com',
      age: 35,
      favoriteBook: newBook, // Unpersisted book with unpersisted publisher
      favoriteBookAssignedAt: new Date('2024-01-15'),
    });

    await orm.em.flush();
    orm.em.clear();

    // Verify: all fields including favoriteBook FK are correctly set
    const result = await orm.em.findOneOrFail(Author, authorId, {
      populate: ['favoriteBook.publisher'],
    });

    // Scalar fields should be updated
    expect(result.email).toBe('john.updated@example.com');
    expect(result.age).toBe(35);
    expect(result.favoriteBookAssignedAt).toEqual(new Date('2024-01-15'));
    // Unpersisted relation should work
    expect(result.favoriteBook).toBeDefined();
    expect(result.favoriteBook?.title).toBe('Learning MikroORM');
    expect(result.favoriteBook?.publisher).toBeDefined();
    expect(result.favoriteBook?.publisher.name).toBe('Tech Books Inc');
  });

  test('workaround: loading entity instead of getReference works', async () => {
    // Setup: Create existing author in DB
    const author = orm.em.create(Author, { name: 'Jane Smith' });
    await orm.em.flush();
    const authorId = author.id;
    orm.em.clear();

    // Action: Create new book with unpersisted publisher and assign to loaded author
    const newPublisher = orm.em.create(Publisher, { name: 'Science Publishers' });
    const newBook = orm.em.create(Book, {
      title: 'Advanced ORM Patterns',
      publisher: newPublisher, // Unpersisted publisher
    });

    // Load entity instead of using getReference
    const loadedAuthor = await orm.em.findOneOrFail(Author, authorId);
    wrap(loadedAuthor).assign({
      email: 'jane.updated@example.com',
      age: 42,
      favoriteBook: newBook, // Works with loaded entity
      favoriteBookAssignedAt: new Date('2024-02-20'),
    });

    await orm.em.flush();
    orm.em.clear();

    // Verify: all fields are correctly set
    const result = await orm.em.findOneOrFail(Author, authorId, {
      populate: ['favoriteBook.publisher'],
    });

    expect(result.email).toBe('jane.updated@example.com');
    expect(result.age).toBe(42);
    expect(result.favoriteBookAssignedAt).toEqual(new Date('2024-02-20'));
    expect(result.favoriteBook).toBeDefined();
    expect(result.favoriteBook?.title).toBe('Advanced ORM Patterns');
    expect(result.favoriteBook?.publisher).toBeDefined();
    expect(result.favoriteBook?.publisher.name).toBe('Science Publishers');
  });

  test('multiple entities in loop with getReference and unpersisted relations', async () => {
    // Setup: Create multiple existing authors
    const author1 = orm.em.create(Author, { name: 'Alice Brown' });
    const author2 = orm.em.create(Author, { name: 'Bob Wilson' });

    await orm.em.flush();
    const authorIds = [author1.id, author2.id];
    orm.em.clear();

    // Action: Create new book with unpersisted publisher and assign to multiple authors in loop
    const sharedPublisher = orm.em.create(Publisher, { name: 'Global Press' });
    const sharedBook = orm.em.create(Book, {
      title: 'TypeScript Mastery',
      publisher: sharedPublisher, // Unpersisted publisher
    });

    for (const [index, authorId] of authorIds.entries()) {
      const authorRef = orm.em.getReference(Author, authorId);
      wrap(authorRef).assign({
        email: `author${index + 1}@example.com`,
        age: 30 + index,
        favoriteBook: sharedBook, // Unpersisted book
        favoriteBookAssignedAt: new Date('2024-03-10'),
      });
    }

    await orm.em.flush();
    orm.em.clear();

    // Verify: Both authors correctly reference the same book
    const results = await orm.em.find(
      Author,
      {
        id: { $in: authorIds },
      },
      {
        populate: ['favoriteBook.publisher'],
      },
    );

    for (const [index, result] of results.entries()) {
      expect(result.email).toBe(`author${index + 1}@example.com`);
      expect(result.age).toBe(30 + index);
      expect(result.favoriteBookAssignedAt).toEqual(new Date('2024-03-10'));
      expect(result.favoriteBook).toBeDefined();
      expect(result.favoriteBook?.title).toBe('TypeScript Mastery');
      expect(result.favoriteBook?.publisher).toBeDefined();
      expect(result.favoriteBook?.publisher.name).toBe('Global Press');
    }
  });

  test('mixing persisted FK (as PK) and unpersisted entity in same assign', async () => {
    // Setup: Create mentor and author in DB
    const mentor = orm.em.create(Author, { name: 'Senior Developer', email: 'mentor@example.com' });
    const author = orm.em.create(Author, { name: 'Junior Developer' });
    await orm.em.flush();
    const authorId = author.id;
    const mentorId = mentor.id;
    orm.em.clear();

    // Action: Assign both a persisted FK (mentor as PK) and unpersisted entity (book)
    const newPublisher = orm.em.create(Publisher, { name: 'Learning Press' });
    const newBook = orm.em.create(Book, {
      title: 'Getting Started',
      publisher: newPublisher,
    });

    const authorRef = orm.em.getReference(Author, authorId);
    wrap(authorRef).assign({
      mentor: mentorId, // Persisted FK as PK value
      favoriteBook: newBook, // Unpersisted entity
      age: 25,
    });

    await orm.em.flush();
    orm.em.clear();

    // Verify: Both relations should be correctly set
    const result = await orm.em.findOneOrFail(Author, authorId, {
      populate: ['mentor', 'favoriteBook.publisher'],
    });

    // Persisted FK should work
    expect(result.mentor).toBeDefined();
    expect(result.mentor?.id).toBe(mentorId);
    expect(result.mentor?.name).toBe('Senior Developer');
    // Unpersisted entity should work
    expect(result.favoriteBook).toBeDefined();
    expect(result.favoriteBook?.title).toBe('Getting Started');
    expect(result.favoriteBook?.publisher).toBeDefined();
    expect(result.favoriteBook?.publisher.name).toBe('Learning Press');
    // Scalar field should work
    expect(result.age).toBe(25);
  });
});
