import { MikroORM } from '@mikro-orm/sqlite';
import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref, ref, LoadStrategy } from '@mikro-orm/core';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany({
    entity: () => Publisher,
    mappedBy: p => p.bestSellingAuthor,
    eager: true,
  })
  publishers = new Collection<Publisher>(this);

  @OneToMany({
    entity: () => Book,
    mappedBy: b => b.author,
  })
  books = new Collection<Book>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne({ entity: () => Author, ref: true, eager: true })
  author: Ref<Author>;

  @ManyToOne(() => Publisher, { ref: true, nullable: true })
  publisher?: Ref<Publisher>;

  constructor({ author, publisher, title }: {
    author: Author;
    publisher: Publisher;
    title: string;
  }) {
    this.author = ref(author);
    this.publisher = ref(publisher);
    this.title = title;
  }

}

@Entity()
class Publisher {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  country!: string;

  @ManyToOne({ entity: () => Author, ref: true })
  bestSellingAuthor: Ref<Author>;

  @OneToMany({
    entity: () => Book,
    mappedBy: a => a.publisher,
    eager: true,
  })
  books = new Collection<Book>(this);

  constructor(name: string, bestSellingAuthor: Author) {
    this.name = name;
    this.bestSellingAuthor = ref(bestSellingAuthor);
  }

}

async function seed(orm: MikroORM) {
  const em = orm.em.fork();
  const author = em.create(Author, {
    name: `God`,
    email: `god@heaven.com`,
  });

  const publisher = em.create(Publisher, {
    name: `pub`,
    country: 'neverland',
    bestSellingAuthor: author,
  });

  for (let i = 0; i < 50; i += 1) {
    em.persist(
      new Book({
        author,
        publisher,
        title: `Bible pt.${i}`,
      }),
    );
  }
  await em.flush();
  em.clear();
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
  await seed(orm);
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close(true));

// should run around 15ms when run separately (M1 Pro 32g)
test('perf: eager loading with cycles (select-in)', async () => {
  console.time('perf: eager loading with cycles');
  const res = await orm.em.find(Book, {}, { strategy: LoadStrategy.SELECT_IN });
  console.timeEnd('perf: eager loading with cycles');

  expect(res).toHaveLength(50);
  expect(res[0].author.unwrap().publishers[0].books[0].title).toBe('Bible pt.0');
  expect(res[0]).toBe(res[0].author.unwrap().publishers[0].books[0]);
});

// should run around 15ms when run separately (M1 Pro 32g)
test('perf: eager loading with cycles (joined)', async () => {
  console.time('perf: eager loading with cycles');
  const res = await orm.em.find(Book, {}, { strategy: LoadStrategy.JOINED });
  console.timeEnd('perf: eager loading with cycles');

  expect(res).toHaveLength(50);
  expect(res[0].author.unwrap().publishers[0].books[0].title).toBe('Bible pt.0');
  expect(res[0]).toBe(res[0].author.unwrap().publishers[0].books[0]);
});
