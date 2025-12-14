import { MikroORM } from '@mikro-orm/sqlite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Car2, CarOwner2, Sandwich, User2 } from '../entities-sql/index.js';

test('should allow reusing kysely connection', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
  });
  const kysely = orm.em.getKysely();
  expect(kysely).toBeDefined();
  await orm.connect();

  const orm2 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: kysely,
  });
  await orm2.connect();

  const orm3 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: () => kysely,
  });
  await orm3.connect();

  const orm4 = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: () => orm3.driver.getConnection().createKyselyDialect({}),
  });
  await orm4.connect();

  await expect(orm.isConnected()).resolves.toBe(true);
  await orm2.close(); // closing orm2 will make orm1 disconnect too as they share kysely client
  await expect(orm.isConnected()).resolves.toBe(false);
});
