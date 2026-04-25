import { BasePostgreSqlEntityManager } from '@mikro-orm/sql';
import type { PostgreSqlDriver } from './PostgreSqlDriver.js';

/**
 * @inheritDoc
 */
export class PostgreSqlEntityManager<
  Driver extends PostgreSqlDriver = PostgreSqlDriver,
> extends BasePostgreSqlEntityManager<Driver> {}
