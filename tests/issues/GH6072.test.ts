import { EntitySchema, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';

const entity = new EntitySchema({
  name: 'entity',
  properties: { id: { primary: true, type: 'bigint', unsigned: true } },
});

describe.each(['mariadb', 'mysql'])('GH 6072 [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [entity],
      dbName: '6072',
      port: type === 'mysql' ? 3308 : 3309,
      driver: type === 'mysql' ? MySqlDriver : MariaDbDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('check schema', async () => {
    const property = orm.getMetadata().get('entity').properties.id;

    property.unsigned = false;
    const diff1 = await orm.schema.getUpdateSchemaSQL();
    await orm.schema.execute(diff1);

    property.unsigned = true;
    const diff2 = await orm.schema.getUpdateSchemaSQL();
    await orm.schema.execute(diff2);

    expect(diff1 + diff2).toMatchSnapshot();
  });
});
