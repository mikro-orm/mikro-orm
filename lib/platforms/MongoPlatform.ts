import { Platform } from './Platform';
import { MongoNamingStrategy, NamingStrategy } from '../naming-strategy';

export class MongoPlatform extends Platform {

  usesPivotTable(): boolean {
    return false;
  }

  supportsTransactions(): boolean {
    return false;
  }

  getNamingStrategy(): { new(): NamingStrategy} {
    return MongoNamingStrategy;
  }

}
