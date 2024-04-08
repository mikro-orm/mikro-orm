import { MySqlPlatform, type TransformContext } from '@mikro-orm/knex';
import { MariaDbSchemaHelper } from './MariaDbSchemaHelper';
import { MariaDbExceptionConverter } from './MariaDbExceptionConverter';

export class MariaDbPlatform extends MySqlPlatform {

  protected override readonly schemaHelper: MariaDbSchemaHelper = new MariaDbSchemaHelper(this);
  protected override readonly exceptionConverter = new MariaDbExceptionConverter();

  override getDefaultCharset(): string {
    return 'utf8mb4';
  }

  override convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    return JSON.stringify(value);
  }

}
