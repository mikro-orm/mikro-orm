import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json', defaultRaw: `('{"a": 1}')` })
  data!: any;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: `4926`,
    port: 3308,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('default values on json columns', async () => {
  const diff1 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff1).toEqual({
    up: '',
    down: '',
  });
});
