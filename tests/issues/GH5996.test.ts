import { EntitySchema, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';

const tinyint = new EntitySchema({
  name: 'entity1',
  properties: { id: { primary: true, type: 'tinyint' } },
});
const smallint = new EntitySchema({
  name: 'entity2',
  properties: { id: { primary: true, type: 'smallint' } },
});
const mediumint = new EntitySchema({
  name: 'entity3',
  properties: { id: { primary: true, type: 'mediumint' } },
});

describe.each(['mariadb', 'mysql'])('GH 5996 [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [tinyint, smallint, mediumint],
      dbName: '5996',
      port: type === 'mysql' ? 3308 : 3309,
      driver: type === 'mysql' ? MySqlDriver : MariaDbDriver,
    });
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('check schema', async () => {
    const diff = await orm.schema.getCreateSchemaSQL();
    expect(diff).toMatchSnapshot();
  });
});
