import { Collection, MikroORM, Ref, ref } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Filter({ name: 'active', cond: { active: true }, default: true })
@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  active: boolean;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  constructor({ id, name, active = true }: { id?: number; name: string; active?: boolean }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
    this.active = active;
  }
}

@Filter({ name: 'published', cond: { published: true }, default: true })
@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @Property()
  published: boolean;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  @ManyToOne(() => Publisher, { ref: true, nullable: true })
  publisher!: Ref<Publisher> | null;

  constructor({
    id,
    title,
    author,
    published = true,
  }: {
    id?: number;
    title: string;
    author: Author | Ref<Author>;
    published?: boolean;
  }) {
    if (id) {
      this.id = id;
    }
    this.title = title;
    this.published = published;
    this.author = ref(author);
  }
}

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.publisher)
  books = new Collection<Book, Publisher>(this);

  constructor({ id, name = 'asd' }: { id?: number; name?: string }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book, Publisher],
  });
  await orm.schema.create();

  const em = orm.em.fork();
  const authors = [
    new Author({ id: 1, name: 'a' }),
    new Author({ id: 2, name: 'b' }),
    new Author({ id: 3, name: 'c' }),
  ];
  em.persist(authors);

  const publishers = [new Publisher({ id: 1, name: 'AAA' }), new Publisher({ id: 2, name: 'BBB' })];
  em.persist(publishers);

  const books = [
    new Book({ id: 1, title: 'One', author: authors[0] }),
    new Book({ id: 2, title: 'Two', author: authors[0] }),
    new Book({ id: 3, title: 'Three', author: authors[1] }),
    new Book({ id: 4, title: 'Four', author: authors[2] }),
    new Book({ id: 5, title: 'Five', author: authors[2] }),
    new Book({ id: 6, title: 'Six', author: authors[2] }),
    new Book({ id: 7, title: 'Draft', author: authors[2], published: false }),
  ];
  books[0].publisher = ref(publishers[0]);
  books[1].publisher = ref(publishers[1]);
  books[2].publisher = ref(publishers[1]);
  books[3].publisher = ref(publishers[1]);
  books[4].publisher = ref(publishers[1]);
  books[5].publisher = ref(publishers[1]);
  em.persist(books);

  await em.flush();
});

afterAll(async () => orm.close(true));

test('em.countBy (single field)', async () => {
  const em = orm.em.fork();
  const counts = await em.countBy(Book, 'author');
  // author 1 has 2 published books, author 2 has 1, author 3 has 3 (draft filtered out)
  expect(counts).toEqual({ '1': 2, '2': 1, '3': 3 });
});

test('em.countBy (composite groupBy with ~~~ separator)', async () => {
  const em = orm.em.fork();
  const counts = await em.countBy(Book, ['author', 'publisher']);
  expect(counts['1~~~1']).toBe(1);
  expect(counts['1~~~2']).toBe(1);
  expect(counts['2~~~2']).toBe(1);
  expect(counts['3~~~2']).toBe(3);
});

test('em.countBy with where filter', async () => {
  const em = orm.em.fork();
  const counts = await em.countBy(Book, 'author', { where: { title: ['One', 'Six'] } as any });
  expect(counts).toEqual({ '1': 1, '3': 1 });
});

test('em.countBy with empty result', async () => {
  const em = orm.em.fork();
  const counts = await em.countBy(Book, 'author', { where: { title: 'nonexistent' } as any });
  expect(counts).toEqual({});
});

test('em.countBy with entity filter disabled', async () => {
  const em = orm.em.fork();
  // With filter disabled, the unpublished draft should be included
  const counts = await em.countBy(Book, 'author', { filters: false });
  // author 3 now has 4 books (3 published + 1 draft)
  expect(counts).toEqual({ '1': 2, '2': 1, '3': 4 });
});

test('repo.countBy', async () => {
  const em = orm.em.fork();
  const repo = em.getRepository(Book);
  const counts = await repo.countBy('author');
  expect(counts).toEqual({ '1': 2, '2': 1, '3': 3 });
});
