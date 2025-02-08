import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { Author, schema } from '../entities';

test('should allow reusing mongo connection', async () => {
  const orm = await MikroORM.init({
    driver: MongoDriver,
    dbName: 'mikro_orm_test',
    entities: [Author, schema],
  });
  const mongo = orm.em.getConnection().getClient();

  const orm2 = await MikroORM.init({
    driver: MongoDriver,
    dbName: 'mikro_orm_test',
    entities: [Author, schema],
    driverOptions: mongo,
  });

  const orm3 = await MikroORM.init({
    driver: MongoDriver,
    dbName: 'mikro_orm_test',
    entities: [Author, schema],
    driverOptions: async () => mongo,
  });

  await expect(orm.em.find(Author, {})).resolves.toHaveLength(0);
  await orm2.close(); // closing orm2 will make orm1 disconnect too as they share mongo client
  await expect(orm.isConnected()).resolves.toBe(false);
  // this works now as we correctly detect the broken connection (as asserted above) and reconnect automatically
  // await expect(orm.em.find(Author, {})).resolves.toEqual([]);
});
