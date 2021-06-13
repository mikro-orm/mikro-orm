import { ensureDir, writeFile } from 'fs-extra';
import { Utils } from '@mikro-orm/core';
import { DatabaseSchema, DatabaseTable, EntityManager } from '@mikro-orm/knex';
import { SourceFile } from './SourceFile';

export class EntityGenerator {

  private readonly config = this.em.config;
  private readonly driver = this.em.getDriver();
  private readonly platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly sources: SourceFile[] = [];

  constructor(private readonly em: EntityManager) { }

  async generate(options: { baseDir?: string; save?: boolean; schemas?: string[] } = {}): Promise<string[]> {
    const baseDir = Utils.normalizePath(options.baseDir || this.config.get('baseDir') + '/generated-entities');

    const useSchemas = !!options.schemas && this.platform.supportsMultiSchema();
    const schemas = useSchemas && options.schemas ? options.schemas : [this.config.get('dbName')];

    const existingTables: string[] = [];
    for (const schemaName of schemas) {
      const schema = await await DatabaseSchema.create(this.connection, this.platform, this.config, useSchemas ? schemaName : undefined);

      schema.getTables().forEach(table => {
        this.createEntity(table, existingTables.includes(table.name));

        existingTables.push(table.name);
      });
    }

    if (options.save) {
      await ensureDir(baseDir);
      await Promise.all(this.sources.map(file => writeFile(baseDir + '/' + file.getBaseName(), file.generate())));
    }

    return this.sources.map(file => file.generate());
  }

  createEntity(table: DatabaseTable, includeSchemaInName = false): void {
    const meta = table.getEntityDeclaration(this.namingStrategy, this.helper, this.platform.supportsMultiSchema() && this.config.get('explicitSchemaName'), includeSchemaInName);
    this.sources.push(new SourceFile(meta, this.namingStrategy, this.platform, this.helper));
  }

}
