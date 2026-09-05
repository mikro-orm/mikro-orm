import type { Rel } from '@mikro-orm/postgresql';
import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { type AbstractSqlDriver, MikroORM as SqlMikroORM } from '@mikro-orm/sql';
import { PLATFORMS } from '../bootstrap.js';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  active!: boolean;

  @Property({ type: 'json', nullable: true })
  meta?: { tag?: string; nested?: { deep?: string } };

  @Property({ type: 'json', nullable: true })
  items?: { tag: string }[];
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author)
  author!: Rel<Author>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_gh_8192',
    entities: [Author, Book],
  });
  await orm.schema.refresh();

  await orm.em.insert(Author, {
    id: 1,
    active: true,
    meta: { tag: 'x', nested: { deep: 'd' } },
    items: [{ tag: 'x' }],
  });
  await orm.em.insert(Author, { id: 2, active: true, meta: { tag: 'y' }, items: [{ tag: 'y' }] });
  await orm.em.insert(Book, { id: 1, author: 1 });
  await orm.em.insert(Book, { id: 2, author: 2 });
});

afterAll(async () => {
  await orm.close(true);
});

const createQb = () => orm.em.fork().createQueryBuilder(Book, 'b').select('b.*').leftJoin('b.author', 'a');

test('where condition on a JSON property of a joined entity uses the join alias', async () => {
  const qb = createQb().where({ 'a.meta': { tag: 'x' } });
  expect(qb.getFormattedQuery()).toBe(
    `select "b".* from "book" as "b" left join "author" as "a" on "b"."author_id" = "a"."id" where "a"."meta"->>'tag' = 'x'`,
  );
  await expect(qb.getResultList()).resolves.toMatchObject([{ id: 1 }]);
});

test('nested JSON path on a joined entity uses the join alias', async () => {
  const qb = createQb().where({ 'a.meta': { nested: { deep: 'd' } } });
  expect(qb.getFormattedQuery()).toBe(
    `select "b".* from "book" as "b" left join "author" as "a" on "b"."author_id" = "a"."id" where "a"."meta"->'nested'->>'deep' = 'd'`,
  );
  await expect(qb.getResultList()).resolves.toMatchObject([{ id: 1 }]);
});

test('$contains on a JSON property of a joined entity', async () => {
  const qb = createQb().where({ 'a.meta': { $contains: { tag: 'x' } } });
  expect(qb.getFormattedQuery()).toBe(
    `select "b".* from "book" as "b" left join "author" as "a" on "b"."author_id" = "a"."id" where "a"."meta" @> '{"tag":"x"}'`,
  );
  await expect(qb.getResultList()).resolves.toMatchObject([{ id: 1 }]);
});

test('$elemMatch on a JSON array property of a joined entity', async () => {
  const qb = createQb().where({ 'a.items': { $elemMatch: { tag: 'x' } } as never });
  expect(qb.getFormattedQuery()).toBe(
    `select "b".* from "book" as "b" left join "author" as "a" on "b"."author_id" = "a"."id" where exists (select 1 from jsonb_array_elements("a"."items") as "__je0" where "__je0"->>'tag' = 'x')`,
  );
  await expect(qb.getResultList()).resolves.toMatchObject([{ id: 1 }]);
});

test('scalar property of a joined entity keeps working', async () => {
  const qb = createQb().where({ 'a.active': true });
  expect(qb.getFormattedQuery()).toBe(
    `select "b".* from "book" as "b" left join "author" as "a" on "b"."author_id" = "a"."id" where "a"."active" = true`,
  );
  await expect(qb.getResultList()).resolves.toMatchObject([{ id: 1 }, { id: 2 }]);
});

test.each([
  ['sqlite', 'json_extract(`a`.`meta`, '] as const,
  ['mysql', 'json_extract(`a`.`meta`, '] as const,
  ['mariadb', 'json_extract(`a`.`meta`, '] as const,
  ['mssql', 'json_value([a].[meta], '] as const,
  ['oracledb', 'json_value("a"."meta", '] as const,
])('JSON condition uses the explicit join alias [%s]', async (type, fragment) => {
  const orm2 = await SqlMikroORM.init<AbstractSqlDriver>({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    driver: PLATFORMS[type],
    dbName: 'mikro_orm_test_gh_8192',
  });

  try {
    const qb1 = orm2.em
      .fork()
      .createQueryBuilder(Book, 'b')
      .leftJoin('b.author', 'a')
      .where({ 'a.meta': { tag: 'x' } });
    expect(qb1.getFormattedQuery()).toContain(`${fragment}'$.tag') = 'x'`);

    const qb2 = orm2.em
      .fork()
      .createQueryBuilder(Book, 'b')
      .leftJoin('b.author', 'a')
      .where({ 'a.meta': { nested: { deep: 'd' } } });
    expect(qb2.getFormattedQuery()).toContain(`${fragment}'$.nested.deep') = 'd'`);
  } finally {
    await orm2.close(true);
  }
});

test('JSON property condition without explicit alias keeps using the root alias', async () => {
  const qb = orm.em
    .fork()
    .createQueryBuilder(Author, 'a0')
    .where({ meta: { tag: 'x' } });
  expect(qb.getFormattedQuery()).toBe(`select "a0".* from "author" as "a0" where "a0"."meta"->>'tag' = 'x'`);
  await expect(qb.getResultList()).resolves.toMatchObject([{ id: 1 }]);
});
