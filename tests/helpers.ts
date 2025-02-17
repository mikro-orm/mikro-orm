import type { LoggerNamespace, MikroORM } from '@mikro-orm/core';

export const BASE_DIR = import.meta.dirname;
export const TEMP_DIR = process.cwd() + '/temp';

export function mockLogger(orm: MikroORM, debug: LoggerNamespace[] = ['query', 'query-params'], mock = vi.fn()) {
  const logger = orm.config.getLogger();
  Object.assign(logger, { writer: mock });
  orm.config.set('debug', debug);

  return mock;
}
