import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { Author, schema } from '../entities/index.js';

test('should allow reusing mongo connection', async () => {
  const orm = await MikroORM.init({
    driver: MongoDriver,
    dbName: 'mikro_orm_test',
    entities: [Author, schema],
  });
  await orm.connect();
  const mongo = orm.em.getConnection().getClient();

  const orm2 = await MikroORM.init({
    driver: MongoDriver,
    dbName: 'mikro_orm_test',
    entities: [Author, schema],
    driverOptions: mongo,
  });
  await orm2.connect();

  const orm3 = await MikroORM.init({
    driver: MongoDriver,
    dbName: 'mikro_orm_test',
    entities: [Author, schema],
    driverOptions: async () => mongo,
  });
  await orm3.connect();

  await expect(orm.em.find(Author, {})).resolves.toHaveLength(0);
  await orm2.close(); // closing orm2 will make orm1 disconnect too as they share mongo client
  await expect(orm.isConnected()).resolves.toBe(false);
});
