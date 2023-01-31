import type { EntityMetadata, ISchemaGenerator } from '../typings';
import { CommitOrderCalculator } from '../unit-of-work/CommitOrderCalculator';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver';
import type { MetadataStorage } from '../metadata/MetadataStorage';
import type { Configuration } from './Configuration';
import { EntityManager } from '../EntityManager';

export abstract class AbstractSchemaGenerator<D extends IDatabaseDriver> implements ISchemaGenerator {

  protected readonly em?: ReturnType<D['createEntityManager']>;
  protected readonly driver: D;
  protected readonly config: Configuration;
  protected readonly metadata: MetadataStorage;
  protected readonly platform: ReturnType<D['getPlatform']>;
  protected readonly connection: ReturnType<D['getConnection']>;

  constructor(em: D | ReturnType<D['createEntityManager']>) {
    this.em = em instanceof EntityManager ? em : undefined;
    this.driver = em instanceof EntityManager ? em.getDriver() as D : em;
    this.config = this.driver.config;
    this.metadata = this.driver.getMetadata();
    this.platform = this.driver.getPlatform() as ReturnType<D['getPlatform']>;
    this.connection = this.driver.getConnection() as ReturnType<D['getConnection']>;
  }

  async createSchema(): Promise<void> {
    this.notImplemented();
  }

  /**
   * Returns true if the database was created.
   */
  async ensureDatabase(): Promise<boolean> {
    this.notImplemented();
  }

  async refreshDatabase(): Promise<void> {
    await this.ensureDatabase();
    await this.dropSchema();
    await this.createSchema();
  }

  async clearDatabase(options?: { schema?: string }): Promise<void> {
    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      await this.driver.nativeDelete(meta.className, {}, options);
    }

    if (this.em) {
      const allowGlobalContext = this.config.get('allowGlobalContext');
      this.config.set('allowGlobalContext', true);
      this.em.clear();
      this.config.set('allowGlobalContext', allowGlobalContext);
    }
  }

  async getCreateSchemaSQL(): Promise<string> {
    this.notImplemented();
  }

  async dropSchema(): Promise<void> {
    this.notImplemented();
  }

  async getDropSchemaSQL(): Promise<string> {
    this.notImplemented();
  }

  async updateSchema(): Promise<void> {
    this.notImplemented();
  }

  async getUpdateSchemaSQL(): Promise<string> {
    this.notImplemented();
  }

  async getUpdateSchemaMigrationSQL(): Promise<{ up: string; down: string }> {
    this.notImplemented();
  }

  /**
   * creates new database and connects to it
   */
  async createDatabase(name: string): Promise<void> {
    this.notImplemented();
  }

  async dropDatabase(name?: string): Promise<void> {
    this.notImplemented();
  }

  async execute(query: string) {
    this.notImplemented();
  }

  async ensureIndexes() {
    this.notImplemented();
  }

  protected getOrderedMetadata(schema?: string): EntityMetadata[] {
    const metadata = Object.values(this.metadata.getAll()).filter(meta => {
      const isRootEntity = meta.root.className === meta.className;
      return isRootEntity && !meta.embeddable && !meta.virtual;
    });
    const calc = new CommitOrderCalculator();
    metadata.forEach(meta => calc.addNode(meta.root.className));
    let meta = metadata.pop();

    while (meta) {
      for (const prop of meta.props) {
        calc.discoverProperty(prop, meta.root.className);
      }

      meta = metadata.pop();
    }

    return calc.sort()
      .map(cls => this.metadata.find(cls)!)
      .filter(meta => schema ? [schema, '*'].includes(meta.schema!) : meta.schema !== '*');
  }

  protected notImplemented(): never {
    throw new Error(`This method is not supported by ${this.driver.constructor.name} driver`);
  }

}
