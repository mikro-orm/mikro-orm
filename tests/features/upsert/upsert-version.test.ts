import { defineEntity, MikroORM, OptimisticLockError, p, Utils } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';

const Doc = defineEntity({
  name: 'UpsertVersionDoc',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    version: p.integer().version(),
  },
});

const DatedDoc = defineEntity({
  name: 'UpsertVersionDatedDoc',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    version: p.datetime().version(),
  },
});

const options = {
  sqlite: { dbName: ':memory:' },
  postgresql: {},
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  mssql: { password: 'Root.Root' },
  oracledb: {
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  },
};

describe.each(Utils.keys(options))('upsert bumps the version [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Doc, DatedDoc],
      dbName: 'mikro_orm_test_upsert_version',
      driver: PLATFORMS[type] as any,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.fork().insert(Doc, { id: 1, title: 'd1', version: 1 });
  });

  afterAll(() => orm.close(true));

  test('em.upsert() that updates a row bumps its version', async () => {
    const em = orm.em.fork();
    const stale = await em.findOneOrFail(Doc, 1);

    const doc = await orm.em.fork().upsert(Doc, { id: 1, title: 'd2' });
    expect(doc.version).toBe(2);

    stale.title = 'd3';
    await expect(em.flush()).rejects.toThrow(OptimisticLockError);
    const row = await orm.em.fork().findOneOrFail(Doc, 1);
    expect([row.title, row.version]).toEqual(['d2', 2]);
  });

  test('em.upsertMany() bumps the version of the rows it updates only', async () => {
    const docs = await orm.em.fork().upsertMany(Doc, [
      { id: 1, title: 'd2' }, // exists
      { id: 2, title: 'd2' }, // inserts
    ]);
    expect(docs.map(d => d.version)).toEqual([2, 1]);
  });

  test('a version given in the data is kept', async () => {
    await orm.em.fork().upsert(Doc, { id: 1, title: 'd2', version: 7 });

    const row = await orm.em.fork().findOneOrFail(Doc, 1);
    expect([row.title, row.version]).toEqual(['d2', 7]);
  });

  test('qb.merge() with values bumps the version', async () => {
    await orm.em
      .fork()
      .createQueryBuilder(Doc)
      .insert({ id: 1, title: 'd2' })
      .onConflict('id')
      .merge({ title: 'd3' })
      .execute();

    const row = await orm.em.fork().findOneOrFail(Doc, 1);
    expect([row.title, row.version]).toEqual(['d3', 2]);
  });

  test('qb.merge() without fields merges every column and bumps the version', async () => {
    await orm.em.fork().createQueryBuilder(Doc).insert({ id: 1, title: 'd2' }).onConflict('id').merge().execute();

    const row = await orm.em.fork().findOneOrFail(Doc, 1);
    expect([row.title, row.version]).toEqual(['d2', 2]);
  });

  // mysql, mssql and oracle do not support an aliased insert
  test.runIf(type === 'sqlite' || type === 'postgresql')('aliased qb bumps the version', async () => {
    await orm.em
      .fork()
      .createQueryBuilder(Doc, 'd')
      .insert({ id: 1, title: 'd2' })
      .onConflict('id')
      .merge(['title'])
      .execute();

    const row = await orm.em.fork().findOneOrFail(Doc, 1);
    expect([row.title, row.version]).toEqual(['d2', 2]);
  });

  test('em.upsert() refreshes a datetime version', async () => {
    const old = new Date('2020-01-01T00:00:00Z');
    await orm.em.fork().insert(DatedDoc, { id: 1, title: 'd1', version: old });

    const doc = await orm.em.fork().upsert(DatedDoc, { id: 1, title: 'd2' });
    const row = await orm.em.fork().findOneOrFail(DatedDoc, 1);
    expect(row.title).toBe('d2');
    expect(row.version.getTime()).toBeGreaterThan(old.getTime());
    // oracle returns the timestamp without fractional seconds
    expect(Math.floor(doc.version.getTime() / 1000)).toBe(Math.floor(row.version.getTime() / 1000));
  });
});
