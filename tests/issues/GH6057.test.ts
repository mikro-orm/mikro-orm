import { EntitySchema, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';

const bigint1 = new EntitySchema({
  name: 'entity1',
  properties: { id: { primary: true, type: 'bigint', unsigned: false } },
});
const bigint2 = new EntitySchema({
  name: 'entity2',
  properties: { id: { primary: true, type: 'bigint', unsigned: true } },
});
const bigint3 = new EntitySchema({
  name: 'entity3',
  properties: { id: { primary: true, type: 'bigint' } },
});
const int1 = new EntitySchema({
  name: 'entity4',
  properties: { id: { primary: true, type: 'number', unsigned: false } },
});
const int2 = new EntitySchema({
  name: 'entity5',
  properties: { id: { primary: true, type: 'number', unsigned: true } },
});
const int3 = new EntitySchema({
  name: 'entity6',
  properties: { id: { primary: true, type: 'number' } },
});

describe.each(['mariadb', 'mysql'])('GH 6057 [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [bigint1, bigint2, bigint3, int1, int2, int3],
      dbName: '6057',
      port: type === 'mysql' ? 3308 : 3309,
      driver: type === 'mysql' ? MySqlDriver : MariaDbDriver,
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('check schema', async () => {
    const diff = await orm.schema.getCreateSchemaSQL();
    expect(diff).toMatchSnapshot();
  });
});
