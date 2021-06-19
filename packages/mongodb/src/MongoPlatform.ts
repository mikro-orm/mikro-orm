import { ObjectId } from 'mongodb';
import { IPrimaryKey, Primary, Platform, MongoNamingStrategy, NamingStrategy, Constructor, EntityRepository, Utils } from '@mikro-orm/core';
import { MongoExceptionConverter } from './MongoExceptionConverter';
import { MongoEntityRepository } from './MongoEntityRepository';

export class MongoPlatform extends Platform {

  protected readonly exceptionConverter = new MongoExceptionConverter();

  getNamingStrategy(): { new(): NamingStrategy} {
    return MongoNamingStrategy;
  }

  getRepositoryClass<T>(): Constructor<EntityRepository<T>> {
    return MongoEntityRepository as Constructor<EntityRepository<T>>;
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

  usesDifferentSerializedPrimaryKey(): boolean {
    return true;
  }

  usesImplicitTransactions(): boolean {
    return false;
  }

  convertsJsonAutomatically(marshall = false): boolean {
    return true;
  }

  marshallArray(values: string[]): string {
    return values as unknown as string;
  }

  cloneEmbeddable<T>(data: T): T {
    const ret = super.cloneEmbeddable(data);
    Utils.dropUndefinedProperties(ret);

    return ret;
  }

}
