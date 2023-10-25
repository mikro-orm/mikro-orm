import { ObjectId } from 'bson';
import {
 Platform, MongoNamingStrategy, Utils, ReferenceKind, MetadataError, type
  IPrimaryKey, type Primary, type NamingStrategy, type Constructor, type EntityRepository, type EntityProperty, type
  PopulateOptions, type EntityMetadata, type IDatabaseDriver, type EntityManager, type Configuration, type MikroORM } from '@mikro-orm/core';
import { MongoExceptionConverter } from './MongoExceptionConverter';
import { MongoEntityRepository } from './MongoEntityRepository';
import { MongoSchemaGenerator } from './MongoSchemaGenerator';

export class MongoPlatform extends Platform {

  protected override readonly exceptionConverter = new MongoExceptionConverter();

  override setConfig(config: Configuration) {
    config.set('autoJoinOneToOneOwner', false);
    config.get('discovery').inferDefaultValues = false;
    super.setConfig(config);
  }

  override getNamingStrategy(): { new(): NamingStrategy} {
    return MongoNamingStrategy;
  }

  override getRepositoryClass<T extends object>(): Constructor<EntityRepository<T>> {
    return MongoEntityRepository as unknown as Constructor<EntityRepository<T>>;
  }

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    MongoSchemaGenerator.register(orm);
  }

  /* istanbul ignore next: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): MongoSchemaGenerator {
    return new MongoSchemaGenerator(em ?? driver as any);
  }

  override normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | ObjectId): T {
    if (data instanceof ObjectId) {
      return data.toHexString() as T;
    }

    return data as T;
  }

  override denormalizePrimaryKey(data: number | string): IPrimaryKey {
    return new ObjectId(data);
  }

  override getSerializedPrimaryKeyField(field: string): string {
    return 'id';
  }

  override usesDifferentSerializedPrimaryKey(): boolean {
    return true;
  }

  override usesImplicitTransactions(): boolean {
    return false;
  }

  override convertsJsonAutomatically(marshall = false): boolean {
    return true;
  }

  convertJsonToDatabaseValue(value: unknown): unknown {
    return value;
  }

  convertJsonToJSValue(value: unknown): unknown {
    return value;
  }

  marshallArray(values: string[]): string {
    return values as unknown as string;
  }

  override cloneEmbeddable<T>(data: T): T {
    const ret = super.cloneEmbeddable(data);
    Utils.dropUndefinedProperties(ret);

    return ret;
  }

  override shouldHaveColumn<T>(prop: EntityProperty<T>, populate: PopulateOptions<T>[]): boolean {
    if (super.shouldHaveColumn(prop, populate)) {
      return true;
    }

    return prop.kind === ReferenceKind.MANY_TO_MANY && prop.owner;
  }

  override validateMetadata(meta: EntityMetadata): void {
    const pk = meta.getPrimaryProps()[0];

    if (pk && pk.fieldNames?.[0] !== '_id') {
      throw MetadataError.invalidPrimaryKey(meta, pk, '_id');
    }
  }

  override isAllowedTopLevelOperator(operator: string) {
    return ['$not', '$fulltext'].includes(operator);
  }

}
