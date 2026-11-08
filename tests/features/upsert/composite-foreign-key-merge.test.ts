import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';

const Pair = defineEntity({
  name: 'Pair',
  properties: {
    a: p.integer().primary(),
    b: p.integer().primary(),
  },
});

const Details = defineEntity({
  name: 'Details',
  embeddable: true,
  properties: {
    // a second cascading path to the same table is refused by MSSQL
    pair: () => p.manyToOne(Pair).ref().nullable().deleteRule('no action').updateRule('no action'),
  },
});

const Holder = defineEntity({
  name: 'Holder',
  properties: {
    id: p.integer().primary(),
    pair: () => p.manyToOne(Pair).ref().nullable(),
    details: () => p.embedded(Details).nullable(),
  },
});

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: { dbName: 'mikro_orm_test_upsert_composite_fk_merge' },
  mysql: { dbName: 'mikro_orm_test_upsert_composite_fk_merge', port: 3308 },
  mariadb: { dbName: 'mikro_orm_test_upsert_composite_fk_merge', port: 3309 },
  mssql: { dbName: 'mikro_orm_test_upsert_composite_fk_merge', password: 'Root.Root' },
  oracledb: {
    dbName: 'mikro_orm_test_upsert_composite_fk_merge',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  },
};

describe.each(Utils.keys(options))('upsert merges every column of a composite FK [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Pair, Holder, Details],
      driver: PLATFORMS[type],
      ...options[type],
    } as any);
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.insertMany(Pair, [
      { a: 1, b: 1 },
      { a: 2, b: 1 },
      { a: 2, b: 2 },
    ]);
    await orm.em.insert(Holder, { id: 1, pair: [1, 1], details: { pair: [1, 1] } });
  });

  afterAll(() => orm.close(true));

  async function pairOf(id: number) {
    const holder = await orm.em.fork().findOneOrFail(Holder, id);
    const pair = holder.pair!.unwrap();
    return [pair.a, pair.b];
  }

  test('em.upsert', async () => {
    const em = orm.em.fork();
    await em.upsert(Holder, { id: 1, pair: em.getReference(Pair, [2, 2]) });
    expect(await pairOf(1)).toEqual([2, 2]);
  });

  test('em.upsertMany', async () => {
    const em = orm.em.fork();
    await em.upsertMany(Holder, [
      { id: 1, pair: em.getReference(Pair, [2, 2]) },
      { id: 2, pair: em.getReference(Pair, [2, 1]) },
    ]);
    expect(await pairOf(1)).toEqual([2, 2]);
    expect(await pairOf(2)).toEqual([2, 1]);
  });

  test('qb.merge() with values and with a property path', async () => {
    const qb = () => orm.em.fork().createQueryBuilder(Holder);
    await qb()
      .insert({ id: 1, pair: [2, 2] })
      .onConflict('id')
      .merge({ pair: [2, 2] })
      .execute();
    expect(await pairOf(1)).toEqual([2, 2]);

    await qb().insert({ id: 1 }).onConflict('id').merge({ pair: null }).execute();
    const holder = await orm.em.fork().findOneOrFail(Holder, 1);
    expect(holder.pair).toBeNull();

    await qb()
      .insert({ id: 1, details: { pair: [2, 2] } })
      .onConflict('id')
      .merge(['details.pair'])
      .execute();
    const details = (await orm.em.fork().findOneOrFail(Holder, 1)).details!.pair!.unwrap();
    expect([details.a, details.b]).toEqual([2, 2]);
  });
});
