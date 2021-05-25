import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {initORMPostgreSql, resetDatabase, sleep} from './utils';

describe('Backend', () => {
  jest.setTimeout(10e3);
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    await resetDatabase(orm);
  });

  beforeEach(async () => {
    orm.em.clear();
    await sleep(100);
  });

  test('isConnected()', async () => {
    await expect(orm.isConnected()).resolves.toBe(true);
    await orm.close(true);
    await expect(orm.isConnected()).resolves.toBe(false);
    await orm.connect();
    await expect(orm.isConnected()).resolves.toBe(true);
  });

  afterEach(async () => {});

  afterAll(async () => {
    orm.close(true);
    await sleep(100);
  });
});
