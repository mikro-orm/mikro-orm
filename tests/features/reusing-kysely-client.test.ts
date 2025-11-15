import { MikroORM } from '@mikro-orm/sqlite';
import { Car2, CarOwner2, Sandwich, User2 } from '../entities-sql/index.js';

test('should allow reusing kysely connection', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
  });
  await orm.connect();
  const kysely = orm.em.getKysely();

  const orm2 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: kysely,
  });
  await orm2.connect();

  const orm3 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: async () => kysely,
  });
  await orm3.connect();

  const orm4 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: async () => orm3.driver.getConnection().createKyselyDialect({}),
  });
  await orm4.connect();

  await expect(orm.isConnected()).resolves.toBe(true);
  await orm2.close(); // closing orm2 will make orm1 disconnect too as they share kysely client
  await expect(orm.isConnected()).resolves.toBe(false);
});
