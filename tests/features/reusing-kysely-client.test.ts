import { MikroORM } from '@mikro-orm/sqlite';
import { Car2, CarOwner2, Sandwich, User2 } from '../entities-sql';

test('should allow reusing kysely connection', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
  });
  const kysely = orm.em.getKysely();

  const orm2 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: kysely,
  });

  const orm3 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: async () => kysely,
  });

  const orm4 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: async () => orm3.driver.getConnection().createKyselyDialect({}),
  });

  await expect(orm.isConnected()).resolves.toBe(true);
  await orm2.close(); // closing orm2 will make orm1 disconnect too as they share kysely client
  await expect(orm.isConnected()).resolves.toBe(false);
});
