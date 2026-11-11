import { MikroORM, wrap } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
@Filter({ name: 'active', cond: { active: true }, default: true })
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  active: boolean = true;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Publisher, { eager: true })
  publisher!: Publisher;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Publisher, Author, Book],
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(Book, { id: 1, publisher: { id: 1, name: 'p' }, author: { id: 1, active: false } });
  em.create(Book, { id: 2, publisher: { id: 2, name: 'p2' } });
  await em.flush();
});

afterAll(() => orm.close(true));

test('findOne loads eager relations even with `populate: false`', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 2, { populate: false });
  expect(wrap(book.publisher).isInitialized()).toBe(true);
});

test('findOne without populate hint loads eager relations', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 2);
  expect(wrap(book.publisher).isInitialized()).toBe(true);
  expect(book.author).toBeNull();
});

test('findOne still respects entity filters on to-one relation targets', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 1);
  expect(book.author).toBeNull();

  const em2 = orm.em.fork();
  const book2 = await em2.findOneOrFail(Book, 1, { filters: false });
  expect(book2.author).toMatchObject({ id: 1 });
});
