import { MikroORM, raw } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Item {
  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @Property()
  pk!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Item],
    dbName: 'gh-7749',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

// Reproduces: when raw(qb) wraps a Kysely query that contains a CTE (WITH ...),
// using it as a value in INSERT produces invalid SQL because the WITH clause is
// not parenthesized inside VALUES (...).
test('raw(qb) with kysely CTE wraps WITH in parens inside INSERT VALUES', async () => {
  const kysely = orm.em.getKysely<{ item: { id: number; order: number; pk: string } }>();

  const $order = kysely
    .with('qb', q => q.selectFrom('item').select('item.order'))
    .selectFrom('qb')
    .select(({ fn, eb }) => eb(fn.coalesce(fn.max('qb.order'), eb.lit(0)), '+', 1).as('order'));

  const mock = mockLogger(orm, ['query', 'query-params']);

  const item = orm.em.create(Item, {
    order: raw($order) as unknown as number,
    pk: 'e809c1d7-02a0-4993-b4b1-ea813bdbdfb0',
  });
  orm.em.persist(item);
  await orm.em.flush();

  const insertCall = mock.mock.calls.find(c => /insert into /i.test(c[0]));
  expect(insertCall).toBeDefined();
  const sql: string = insertCall![0];

  // The CTE must be wrapped in parens within the VALUES list, otherwise the
  // generated SQL is invalid (`values (with "qb" as ...)` collides with the
  // outer VALUES tuple delimiters and Postgres throws "syntax error at or
  // near 'with'").
  expect(sql).toMatch(/values\s*\(\s*\(with /i);
});
