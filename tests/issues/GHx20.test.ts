import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Book {

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { nullable: true })
  author: Author;

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('default value for relation property', async () => {
  const a = orm.em.create(Author, {
    name: 'Issac',
    books: [{ title: 'Book 1' }, { title: 'Book 2' }],
  });
  const b = orm.em.create(Author, {
    name: 'John',
    books: [{ title: 'Book 3' }, { title: 'Book 4' }],
  });

  await orm.em.flush();
  orm.em.clear();

  const loadedA = await orm.em.findOneOrFail(Author, a.id, {
    populate: ['books'],
  });
  const loadedB = await orm.em.findOneOrFail(Author, b.id, {
    populate: ['books'],
  });
  expect(loadedA.books).toHaveLength(2);
  expect(loadedB.books).toHaveLength(2);

  for (const b1 of loadedA.books) {
    b1.author = loadedB;
  }

  orm.em.remove(loadedA);
  await orm.em.flush();
  orm.em.clear();

  const loadedB2 = await orm.em.findOneOrFail(Author, b.id, {
    populate: ['books'],
  });

  expect(loadedB2.books).toHaveLength(4);
});
