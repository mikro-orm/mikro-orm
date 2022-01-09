import { ensureDir, writeFile } from 'fs-extra';
import { Utils } from '@mikro-orm/core';
import type { DatabaseTable, EntityManager } from '@mikro-orm/knex';
import { DatabaseSchema } from '@mikro-orm/knex';
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

  async generate(options: { baseDir?: string; save?: boolean; schema?: string } = {}): Promise<string[]> {
    const baseDir = Utils.normalizePath(options.baseDir || this.config.get('baseDir') + '/generated-entities');
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config);
    schema.getTables()
      .filter(table => !options.schema || table.schema === options.schema)
      .forEach(table => this.createEntity(table));

    if (options.save) {
      await ensureDir(baseDir);
      await Promise.all(this.sources.map(file => writeFile(baseDir + '/' + file.getBaseName(), file.generate())));
    }

    return this.sources.map(file => file.generate());
  }

  createEntity(table: DatabaseTable): void {
    const meta = table.getEntityDeclaration(this.namingStrategy, this.helper);
    this.sources.push(new SourceFile(meta, this.namingStrategy, this.platform));
  }

}
