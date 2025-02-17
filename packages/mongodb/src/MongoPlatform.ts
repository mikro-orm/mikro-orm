import { ObjectId } from 'mongodb';
import {
  Platform, MongoNamingStrategy, Utils, ReferenceKind, MetadataError, type
    IPrimaryKey, type Primary, type NamingStrategy, type Constructor, type EntityRepository, type EntityProperty, type
    PopulateOptions, type EntityMetadata, type IDatabaseDriver, type EntityManager, type Configuration, type MikroORM,
} from '@mikro-orm/core';
import { MongoExceptionConverter } from './MongoExceptionConverter.js';
import { MongoEntityRepository } from './MongoEntityRepository.js';
import { MongoSchemaGenerator } from './MongoSchemaGenerator.js';

export class MongoPlatform extends Platform {

  protected override readonly exceptionConverter = new MongoExceptionConverter();

  override setConfig(config: Configuration) {
    config.set('autoJoinOneToOneOwner', false);
    config.set('loadStrategy', 'select-in');
    config.get('discovery').inferDefaultValues = false;
    super.setConfig(config);
  }

  override getNamingStrategy(): { new(): NamingStrategy } {
    return MongoNamingStrategy;
  }

  override getRepositoryClass<T extends object>(): Constructor<EntityRepository<T>> {
    return MongoEntityRepository as unknown as Constructor<EntityRepository<T>>;
  }

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    MongoSchemaGenerator.register(orm);
  }

  /** @inheritDoc */
  override getExtension<T>(extensionName: string, extensionKey: string, moduleName: string, em: EntityManager): T {
    if (extensionName === 'EntityGenerator') {
      throw new Error('EntityGenerator is not supported for this driver.');
    }

    if (extensionName === 'Migrator') {
      return super.getExtension('Migrator', '@mikro-orm/migrator', '@mikro-orm/migrations-mongodb', em);
    }

    /* v8 ignore next */
    return super.getExtension(extensionName, extensionKey, moduleName, em);
  }

  /* v8 ignore next 3: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): MongoSchemaGenerator {
    return new MongoSchemaGenerator(em ?? driver as any);
  }

  override normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | ObjectId): T {
    if (Utils.isObjectID(data)) {
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

  override convertsJsonAutomatically(): boolean {
    return true;
  }

  override convertJsonToDatabaseValue(value: unknown): unknown {
    return Utils.copy(value);
  }

  override convertJsonToJSValue(value: unknown, prop: EntityProperty): unknown {
    return value;
  }

  override marshallArray(values: string[]): string {
    return values as unknown as string;
  }

  override cloneEmbeddable<T>(data: T): T {
    const ret = super.cloneEmbeddable(data);
    Utils.dropUndefinedProperties(ret);

    return ret;
  }

  override shouldHaveColumn<T>(prop: EntityProperty<T>, populate: PopulateOptions<T>[], exclude?: string[]): boolean {
    if (super.shouldHaveColumn(prop, populate, exclude)) {
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

  override isAllowedTopLevelOperator(operator: string): boolean {
    return ['$not', '$fulltext'].includes(operator);
  }

  override getDefaultClientUrl(): string {
    return 'mongodb://127.0.0.1:27017';
  }

}
