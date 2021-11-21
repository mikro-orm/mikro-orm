import type { LoggerNamespace, MikroORM } from '@mikro-orm/core';

export const BASE_DIR = __dirname;
export const TEMP_DIR = process.cwd() + '/temp';

export function mockLogger(orm: MikroORM, debug: LoggerNamespace[] = ['query', 'query-params'], mock = jest.fn()) {
  const logger = orm.config.getLogger();
  Object.assign(logger, { writer: mock });
  orm.config.set('debug', debug);
  logger.setDebugMode(debug);

  return mock;
}
