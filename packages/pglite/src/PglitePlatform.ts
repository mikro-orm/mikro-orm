import array from 'postgres-array';
import parseDate from 'postgres-date';
import PostgresInterval, { type IPostgresInterval } from 'postgres-interval';
import { BasePostgreSqlPlatform, type EntityManager, type IDatabaseDriver, type MikroORM, Utils } from '@mikro-orm/sql';
import { PgliteSchemaHelper } from './PgliteSchemaHelper.js';
import { PgliteSchemaGenerator } from './PgliteSchemaGenerator.js';
import type { PgliteDriver } from './PgliteDriver.js';

/** Platform implementation for PGlite (PostgreSQL in WASM, single-database). */
export class PglitePlatform extends BasePostgreSqlPlatform {
  protected override readonly schemaHelper: PgliteSchemaHelper = new PgliteSchemaHelper(this);

  /** PGlite uses the extended query protocol — one statement per `query()` call. */
  override supportsMultipleStatements(): boolean {
    return false;
  }

  override lookupExtensions(orm: MikroORM<PgliteDriver>): void {
    PgliteSchemaGenerator.register(orm);
  }

  /* v8 ignore next: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): PgliteSchemaGenerator {
    return new PgliteSchemaGenerator(em ?? (driver as any));
  }

  override convertIntervalToJSValue(value: string): unknown {
    return PostgresInterval(value);
  }

  override convertIntervalToDatabaseValue(value: IPostgresInterval): unknown {
    if (Utils.isObject(value) && 'toPostgres' in value && typeof value.toPostgres === 'function') {
      return value.toPostgres();
    }

    return value;
  }

  override unmarshallArray(value: string): string[] {
    return array.parse(value);
  }

  /**
   * @inheritDoc
   */
  override parseDate(value: string | number): Date {
    // postgres-date returns `null` for a JS ISO string which has the `T` separator
    if (typeof value === 'string' && value.charAt(10) === 'T') {
      return new Date(value);
    }

    /* v8 ignore next */
    if (typeof value === 'number') {
      return new Date(value);
    }

    // @ts-ignore fix wrong type resolution during build
    const parsed = parseDate(value);

    /* v8 ignore next */
    if (parsed === null) {
      return value as unknown as Date;
    }

    return parsed as Date;
  }
}
