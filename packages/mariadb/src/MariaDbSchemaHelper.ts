import type { Type } from '@mikro-orm/core';
import { MySqlSchemaHelper } from '@mikro-orm/mysql-base';

export class MariaDbSchemaHelper extends MySqlSchemaHelper {

  protected wrap(val: string | undefined, _type: Type<unknown>): string | undefined {
    return val;
  }

}
