import type { EntityMetadata, ISchemaGenerator } from '../typings';
import { CommitOrderCalculator } from '../unit-of-work/CommitOrderCalculator';
import type { IDatabaseDriver } from '../drivers/IDatabaseDriver';

export abstract class AbstractSchemaGenerator<D extends IDatabaseDriver> implements ISchemaGenerator {

  protected readonly config = this.driver.config;
  protected readonly metadata = this.driver.getMetadata();
  protected readonly platform: ReturnType<D['getPlatform']> = this.driver.getPlatform() as ReturnType<D['getPlatform']>;
  protected readonly connection: ReturnType<D['getConnection']> = this.driver.getConnection() as ReturnType<D['getConnection']>;

  constructor(protected readonly driver: D) { }

  async generate(): Promise<string> {
    this.notImplemented();
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

  async dropDatabase(name: string): Promise<void> {
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
      return isRootEntity && !meta.embeddable;
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
