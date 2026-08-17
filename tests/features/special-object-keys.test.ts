import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;
}

@Filter({ name: 'notDeleted', cond: { deleted: false }, default: true })
@Entity()
class Article {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  deleted: boolean = false;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book, Article],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
  const em = orm.em.fork();
  em.create(Article, { id: 1, title: 'live', deleted: false });
  em.create(Article, { id: 2, title: 'deleted', deleted: true });
  await em.flush();
});

afterAll(() => orm.close(true));

test('object-shaped populate hint with a special key does not touch Object.prototype', async () => {
  expect(({} as any).children).toBeUndefined();
  await orm.em.fork().find(Book, {}, { populate: [{ field: '__proto__', children: [{ field: 'x' }] }] as any });
  expect(({} as any).children).toBeUndefined();
});

test('canPopulate rejects special property names', () => {
  expect(orm.em.canPopulate(Book, 'author')).toBe(true);
  expect(orm.em.canPopulate(Book, '__proto__')).toBe(false);
  expect(orm.em.canPopulate(Book, 'constructor')).toBe(false);
  expect(orm.em.canPopulate(Book, 'hasOwnProperty')).toBe(false);
  // dotted variant must not throw
  expect(orm.em.canPopulate(Book, '__proto__.x')).toBe(false);
});

test('a special key in the filters option cannot disable a default filter', async () => {
  const filters = JSON.parse('{"__proto__":{"notDeleted":false}}');
  const rows = await orm.em.fork().find(Article, {}, { filters });
  expect(rows.map(r => r.title)).toEqual(['live']);
});
