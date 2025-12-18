import { Platform, type Constructor, type EntityManager, type EntityProperty, type IPrimaryKey, type PopulateOptions } from '@mikro-orm/core';
import { type Dictionary } from '@mikro-orm/core';
import { Neo4jExceptionConverter } from './Neo4jExceptionConverter';
import { Neo4jSchemaGenerator } from './Neo4jSchemaGenerator';
import { Neo4jEntityRepository } from './Neo4jEntityRepository';

export class Neo4jPlatform extends Platform {

  protected override readonly exceptionConverter = new Neo4jExceptionConverter();

  override usesImplicitTransactions(): boolean {
    return false;
  }

  override supportsTransactions(): boolean {
    return true;
  }

  override getRepositoryClass<T extends object>(): Constructor<any> {
    return Neo4jEntityRepository as unknown as Constructor<any>;
  }

  override lookupExtensions(): void {
    // no-op for now; schema generator registered lazily in driver
  }

  override getExtension<T>(extensionName: string, extensionKey: string, moduleName: string, em: EntityManager): T {
    if (extensionName === 'EntityGenerator') {
      throw new Error('EntityGenerator is not supported for the Neo4j driver.');
    }

    /* istanbul ignore next */
    if (extensionName === 'Migrator') {
      throw new Error('Migrator is not supported for the Neo4j driver.');
    }

    return super.getExtension(extensionName, extensionKey, moduleName, em);
  }

  override getSchemaGenerator(driver: any, em?: EntityManager): Neo4jSchemaGenerator {
    return new Neo4jSchemaGenerator((em ?? driver) as any);
  }

  override normalizePrimaryKey<T extends number | string = string>(data: IPrimaryKey): T {
    return data as T;
  }

  override denormalizePrimaryKey(data: string | number): IPrimaryKey {
    return data;
  }

  override getSerializedPrimaryKeyField(field: string): string {
    return 'id';
  }

  override usesDifferentSerializedPrimaryKey(): boolean {
    return false;
  }

  override isAllowedTopLevelOperator(operator: string): boolean {
    return ['$not'].includes(operator);
  }

  override shouldHaveColumn<T>(prop: EntityProperty<T>, populate: PopulateOptions<T>[], exclude?: string[]): boolean {
    // Graph stores everything as properties on the node; collections are resolved separately
    if (super.shouldHaveColumn(prop, populate, exclude)) {
      return true;
    }

    return prop.kind !== undefined;
  }

  override cloneEmbeddable<T>(data: T): T {
    return data;
  }

  override convertsJsonAutomatically(): boolean {
    return true;
  }

  override convertJsonToDatabaseValue(value: unknown): unknown {
    return value as Dictionary;
  }

  override convertJsonToJSValue(value: unknown): unknown {
    return value;
  }

}
