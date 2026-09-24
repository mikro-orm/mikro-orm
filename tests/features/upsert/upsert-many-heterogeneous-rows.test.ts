import { IDatabaseDriver, MikroORM, Utils } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class Currency {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  code?: string;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_upsert_heterogeneous', port: 3308 },
  mariadb: { dbName: 'mikro_orm_upsert_heterogeneous', port: 3309 },
  postgresql: { dbName: 'mikro_orm_upsert_heterogeneous' },
};

describe.each(Utils.keys(options))('em.upsertMany with heterogeneous rows [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      metadataProvider: ReflectMetadataProvider,
      driver: PLATFORMS[type],
      entities: [Currency],
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('merges columns supplied only by some of the rows', async () => {
    await orm.em.insertMany(Currency, [
      { id: 1, name: 'old 1', code: 'USD' },
      { id: 2, name: 'old 2', code: 'USD' },
    ]);

    const res = await orm.em.fork().upsertMany(Currency, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b', code: 'EUR' },
      { id: 3, name: 'c' },
    ]);
    const expected = [
      { id: 1, name: 'a', code: 'USD' },
      { id: 2, name: 'b', code: 'EUR' },
      { id: 3, name: 'c', code: null },
    ];
    expect(res.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual(expected);

    const rows = await orm.em.fork().findAll(Currency, { orderBy: { id: 'asc' } });
    expect(rows.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual(expected);
  });

  test('returns the stored value of a column only the first row supplies', async () => {
    await orm.em.insertMany(Currency, [
      { id: 1, name: 'old 1', code: 'USD' },
      { id: 2, name: 'old 2', code: 'USD' },
      { id: 3, name: 'old 3', code: 'GBP' },
    ]);

    const input = [
      { id: 1, name: 'a', code: 'EUR' },
      { id: 2, name: 'b' },
      { id: 3, name: 'c' },
      { id: 4, name: 'd' },
    ];
    const res = await orm.em.fork().upsertMany(Currency, input);
    const expected = [
      { id: 1, name: 'a', code: 'EUR' },
      { id: 2, name: 'b', code: 'USD' },
      { id: 3, name: 'c', code: 'GBP' },
      { id: 4, name: 'd', code: null },
    ];
    expect(input[1]).toEqual({ id: 2, name: 'b' });
    expect(res.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual(expected);

    const rows = await orm.em.fork().findAll(Currency, { orderBy: { id: 'asc' } });
    expect(rows.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual(expected);
  });

  test('does not merge an explicit `undefined` into rows that omit the column', async () => {
    await orm.em.insertMany(Currency, [
      { id: 1, name: 'old 1', code: 'USD' },
      { id: 2, name: 'old 2', code: 'USD' },
    ]);

    await orm.em.fork().upsertMany(Currency, [
      { id: 1, name: 'a', code: undefined },
      { id: 2, name: 'b' },
    ]);

    const rows = await orm.em.fork().findAll(Currency, { orderBy: { id: 'asc' } });
    expect(rows.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual([
      { id: 1, name: 'a', code: null },
      { id: 2, name: 'b', code: 'USD' },
    ]);
  });

  test('merges columns set only on some of the entity instances', async () => {
    await orm.em.insertMany(Currency, [
      { id: 1, name: 'old 1', code: 'USD' },
      { id: 2, name: 'old 2', code: 'USD' },
    ]);

    const em = orm.em.fork();
    await em.upsertMany([
      em.create(Currency, { id: 1, name: 'a' }, { persist: false }),
      em.create(Currency, { id: 2, name: 'b', code: 'EUR' }, { persist: false }),
    ]);

    const rows = await orm.em.fork().findAll(Currency, { orderBy: { id: 'asc' } });
    expect(rows.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual([
      { id: 1, name: 'a', code: 'USD' },
      { id: 2, name: 'b', code: 'EUR' },
    ]);
  });

  // postgres rejects a statement that touches the same row twice
  test.runIf(type !== 'postgresql')('returns an entity matched by several rows of a split batch once', async () => {
    await orm.em.insertMany(Currency, [{ id: 1, name: 'old 1', code: 'USD' }]);

    const em = orm.em.fork();
    await em.findAll(Currency);
    const res = await em.upsertMany(Currency, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b', code: 'EUR' },
      { id: 1, name: 'c' },
    ]);
    expect(res.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual([
      { id: 1, name: 'c', code: 'USD' },
      { id: 2, name: 'b', code: 'EUR' },
    ]);
  });

  test.runIf(type !== 'postgresql')('keeps the input order when a split group contains duplicate rows', async () => {
    await orm.em.insertMany(Currency, [{ id: 1, name: 'old 1', code: 'USD' }]);

    const em = orm.em.fork();
    await em.findAll(Currency);
    const res = await em.upsertMany(Currency, [
      { id: 1, name: 'a' },
      { id: 1, name: 'b' },
      { id: 3, name: 'c', code: 'EUR' },
      { id: 2, name: 'd' },
    ]);
    expect(res.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual([
      { id: 1, name: 'b', code: 'USD' },
      { id: 3, name: 'c', code: 'EUR' },
      { id: 2, name: 'd', code: null },
    ]);
  });

  test.runIf(type !== 'postgresql')(
    'keeps the input order when a split group contains the same entity twice',
    async () => {
      await orm.em.insertMany(Currency, [{ id: 1, name: 'old 1', code: 'USD' }]);

      const em = orm.em.fork();
      const a = await em.findOneOrFail(Currency, 1);
      const b = em.create(Currency, { id: 2, name: 'b' }, { persist: false });
      const c = em.create(Currency, { id: 3, name: 'c', code: 'EUR' }, { persist: false });
      const res = await em.upsertMany([a, a, b, c]);
      expect(res).toHaveLength(3);
      [a, b, c].forEach((entity, i) => expect(res[i]).toBe(entity));
    },
  );

  test.runIf(['sqlite', 'postgresql'].includes(type))(
    'maps rows of a split batch with a suppressed conflict',
    async () => {
      await orm.em.insertMany(Currency, [
        { id: 1, name: 'keep', code: 'USD' },
        { id: 2, name: 'old 2', code: 'USD' },
      ]);

      const res = await orm.em.fork().upsertMany(
        Currency,
        [
          { id: 1, name: 'a' },
          { id: 2, name: 'b', code: 'EUR' },
          { id: 3, name: 'c' },
        ],
        { onConflictWhere: { name: { $ne: 'keep' } } },
      );
      const expected = [
        { id: 1, name: 'keep', code: 'USD' },
        { id: 2, name: 'b', code: 'EUR' },
        { id: 3, name: 'c', code: null },
      ];
      expect(res.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual(expected);

      const rows = await orm.em.fork().findAll(Currency, { orderBy: { id: 'asc' } });
      expect(rows.map(r => ({ id: r.id, name: r.name, code: r.code ?? null }))).toEqual(expected);
    },
  );
});
