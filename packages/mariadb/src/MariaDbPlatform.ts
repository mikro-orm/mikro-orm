import { MySqlPlatform, type TransformContext } from '@mikro-orm/mysql';
import { MariaDbSchemaHelper } from './MariaDbSchemaHelper.js';

export class MariaDbPlatform extends MySqlPlatform {

  protected override readonly schemaHelper: MariaDbSchemaHelper = new MariaDbSchemaHelper(this);

  override convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    if (context?.mode === 'hydration') {
      return value;
    }

    return JSON.stringify(value);
  }

  override convertsJsonAutomatically(): boolean {
    return false;
  }

}
