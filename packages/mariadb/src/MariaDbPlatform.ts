import { MySqlPlatform } from '@mikro-orm/mysql-base';
import { MariaDbSchemaHelper } from './MariaDbSchemaHelper';

export class MariaDbPlatform extends MySqlPlatform {

  protected readonly schemaHelper: MariaDbSchemaHelper = new MariaDbSchemaHelper(this);

}
