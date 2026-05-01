import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM, SqliteDriver, NodeSqliteDialect, defineConfig, type SqlEntityManager } from '@mikro-orm/sql';

// Importing `MikroORM` and `defineConfig` from `@mikro-orm/sql` must yield a
// SQL-aware EM type — specifically, `orm.em.createQueryBuilder` and the rest
// of `SqlEntityManager` must be reachable via both call paths:
//   1) MikroORM.init({ ... }) directly,
//   2) defineConfig({ ... }) followed by MikroORM.init(config).
// Previously path (2) collapsed the EM to plain `EntityManager<D>` because
// core's generic `defineConfig` defaults `EM = EntityManager<D>`, dropping the
// `D[typeof EntityManagerType]` intersection that `MikroORM.init` requires.

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
  },
});

test('GHx46: defineConfig + MikroORM.init from @mikro-orm/sql preserves SqlEntityManager type', async () => {
  const config = defineConfig({
    driver: SqliteDriver,
    dbName: ':memory:',
    entities: [User],
    driverOptions: new NodeSqliteDialect(':memory:'),
  });

  const orm = await MikroORM.init(config);
  const em: SqlEntityManager = orm.em;
  const qb = em.createQueryBuilder(User);
  expect(typeof qb.getQuery).toBe('function');

  await orm.close();
});

test('GHx46: MikroORM.init from @mikro-orm/sql infers SqlEntityManager directly', async () => {
  const orm = await MikroORM.init({
    driver: SqliteDriver,
    dbName: ':memory:',
    entities: [User],
    driverOptions: new NodeSqliteDialect(':memory:'),
  });

  const em: SqlEntityManager = orm.em;
  const qb = em.createQueryBuilder(User);
  expect(typeof qb.getQuery).toBe('function');

  await orm.close();
});
