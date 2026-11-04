import { MikroORM, Utils, raw, type IDatabaseDriver } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Named {
  @PrimaryKey({ fieldName: 'named_id' })
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Comp {
  @PrimaryKey()
  a!: number;

  @PrimaryKey()
  b!: number;

  @Property()
  name!: string;
}

@Entity()
class Bare {
  @PrimaryKey()
  id!: number;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_insert_many_ids', port: 3308 },
  mariadb: { dbName: 'mikro_orm_insert_many_ids', port: 3309 },
  postgresql: { dbName: 'mikro_orm_insert_many_ids' },
  mssql: { dbName: 'mikro_orm_insert_many_ids', password: 'Root.Root' },
  oracledb: { dbName: 'mikro_orm_insert_many_ids', password: 'oracle123' },
};

describe.each(Utils.keys(options))('em.insertMany returns one primary key per row [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Named, Comp, Bare],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(() => orm.schema.clear());

  afterAll(() => orm.close(true));

  async function storedIds(names: string[]) {
    const users = await orm.em.fork().find(User, { name: { $in: names } });
    return names.map(name => users.find(u => u.name === name)!.id);
  }

  test('generated primary keys', async () => {
    const ids = await orm.em.insertMany(User, [{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
    expect(ids).toEqual(await storedIds(['a', 'b', 'c']));
    expect(await orm.em.insertMany(User, [{ name: 'd' }])).toEqual(await storedIds(['d']));
  });

  test('supplied primary keys', async () => {
    const ids = await orm.em.insertMany(User, [
      { id: 100, name: 'a' },
      { id: 101, name: 'b' },
    ]);
    expect(ids).toEqual([100, 101]);
  });

  // mssql rejects explicit identity values mixed with generated ones; oracle builds multi-row inserts from the first row's columns
  const mixedPks = type === 'mssql' || type === 'oracledb';

  test.skipIf(mixedPks)('mixed generated and supplied primary keys', async () => {
    const ids = await orm.em.insertMany(User, [{ name: 'a' }, { id: 200, name: 'b' }, { name: 'c' }]);
    expect(ids).toEqual(await storedIds(['a', 'b', 'c']));
    expect(ids[1]).toBe(200);
  });

  test.skipIf(mixedPks)('supplied primary key in the first row only', async () => {
    const ids = await orm.em.insertMany(User, [{ id: 200, name: 'a' }, { name: 'b' }]);
    expect(ids).toEqual(await storedIds(['a', 'b']));
    expect(ids[0]).toBe(200);
  });

  test('primary keys from raw expressions', async () => {
    const ids = await orm.em.insertMany(User, [
      { id: raw('100 + 1'), name: 'a' },
      { id: raw('100 + 2'), name: 'b' },
    ]);

    // without `returning` the database never reports what the expression produced, so only the `insertId` fallback is left
    if (type === 'mysql' || type === 'mariadb') {
      expect(ids).toEqual([expect.any(Number)]);
    } else {
      expect(ids).toEqual([101, 102]);
    }
  });

  test('rows without values', async () => {
    const ids = await orm.em.insertMany(Bare, [{}, {}, {}]);
    const stored = await orm.em.fork().find(Bare, {}, { orderBy: { id: 'asc' } });
    expect(ids).toEqual(stored.map(b => b.id));
  });

  test('primary key with a custom field name', async () => {
    const ids = await orm.em.insertMany(Named, [{ name: 'a' }, { name: 'b' }]);
    const stored = await orm.em.fork().find(Named, {}, { orderBy: { name: 'asc' } });
    expect(ids).toEqual(stored.map(n => n.id));
    expect(
      await orm.em.insertMany(Named, [
        { id: 100, name: 'c' },
        { id: 101, name: 'd' },
      ]),
    ).toEqual([100, 101]);
  });

  test('composite primary keys', async () => {
    const ids = await orm.em.insertMany(Comp, [
      { a: 1, b: 2, name: 'a' },
      { a: 3, b: 4, name: 'b' },
    ]);
    expect(ids).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
