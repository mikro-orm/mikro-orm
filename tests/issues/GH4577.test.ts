import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { v4 } from 'uuid';
import { mockLogger } from '../helpers.js';

@Entity()
class Customer {

  @PrimaryKey({ type: 'uuid' })
  uuid: string = v4();

  @Property()
  name!: string;

  // autoincrement column cannot have a default, it will be ignored
  @Property({ autoincrement: true, default: 0 })
  number?: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer],
    dbName: `4577`,
    port: 3308,
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('4577', async () => {
  orm.em.create(Customer, { name: 'foo' });
  await orm.em.flush();
  const mock = mockLogger(orm);
  await orm.em.flush();
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
