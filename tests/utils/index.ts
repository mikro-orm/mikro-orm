import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {addSampleData} from '../../src/db';
import {config, useDocker} from '../../src/mikro-orm/config';

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
  return;
}

export async function initORMPostgreSql() {
  const orm = await MikroORM.init({
    ...config,
    debug: false,
  });

  return orm;
}

export async function resetDatabase(
  orm: MikroORM<PostgreSqlDriver>
): Promise<void> {
  return addSampleData({
    orm,
    wrap: useDocker,
    ...(useDocker && {dropDb: config.dbName}),
  });
}
