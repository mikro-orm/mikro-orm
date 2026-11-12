import type { LoggerNamespace, MikroORM } from '@mikro-orm/core';

export const BASE_DIR = import.meta.dirname;
export const TEMP_DIR = process.cwd() + '/temp';

/** Random database name carrying the run id, so `globalSetup` can drop it even while other runs are active. */
export function randomDbName(): string {
  return `mikro_orm_test_r${process.env.MIKRO_ORM_TEST_RUN_ID ?? 0}_${(Math.random() + 1).toString(36).substring(2)}`;
}

export function mockLogger(orm: MikroORM, debug: LoggerNamespace[] = ['query', 'query-params'], mock = vi.fn()) {
  const logger = orm.config.getLogger();
  Object.assign(logger, { writer: mock });
  orm.config.set('debug', debug);

  return mock;
}
