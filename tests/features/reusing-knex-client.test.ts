import { MikroORM } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { Car2, CarOwner2, Sandwich, User2 } from '../entities-sql';

test('should allow reusing knex connection', async () => {
  const orm = await MikroORM.init({
    driver: BetterSqliteDriver,
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
  });
  const knex = orm.em.getKnex();

  const orm2 = await MikroORM.init({
    driver: BetterSqliteDriver,
    dbName: ':memory:',
    entities: [Car2, CarOwner2, User2, Sandwich],
    driverOptions: knex,
  });

  await expect(orm.isConnected()).resolves.toBe(true);
  await orm2.close(); // closing orm2 will make orm1 disconnect too as they share knex client
  await expect(orm.isConnected()).resolves.toBe(false);
});
