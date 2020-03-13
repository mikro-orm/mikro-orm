import { ObjectId } from 'mongodb';
import { Platform } from './Platform';
import { MongoNamingStrategy, NamingStrategy } from '../naming-strategy';
import { IPrimaryKey, Primary } from '../typings';
import { SchemaHelper } from '../schema';

export class MongoPlatform extends Platform {

  protected readonly schemaHelper?: SchemaHelper;

  usesPivotTable(): boolean {
    return false;
  }

  getNamingStrategy(): { new(): NamingStrategy} {
    return MongoNamingStrategy;
  }

  normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | ObjectId): T {
    if (data instanceof ObjectId) {
      return data.toHexString() as T;
    }

    return data as T;
  }

  denormalizePrimaryKey(data: number | string): IPrimaryKey {
    return new ObjectId(data);
  }

  getSerializedPrimaryKeyField(field: string): string {
    return 'id';
  }

  usesImplicitTransactions(): boolean {
    return false;
  }

}
