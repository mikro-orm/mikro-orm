import { ensureDir, writeFile } from 'fs-extra';
import type { Dictionary } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';
import type { DatabaseTable, EntityManager } from '@mikro-orm/knex';
import { DatabaseSchema } from '@mikro-orm/knex';
import type { IFile } from './typings';
import { EnumSourceFile } from './EnumSourceFile';
import { SourceFile } from './SourceFile';

export class EntityGenerator {

  private readonly config = this.em.config;
  private readonly driver = this.em.getDriver();
  private readonly platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly sources: IFile[] = [];

  constructor(private readonly em: EntityManager) { }

  async generate(options: { baseDir?: string; save?: boolean; schema?: string } = {}): Promise<string[]> {
    const baseDir = Utils.normalizePath(options.baseDir || this.config.get('baseDir') + '/generated-entities');
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config);
    const sharedEnums = schema.getEnums();

    Object.entries(sharedEnums).forEach(entry => {
      this.sources.push(new EnumSourceFile(this.namingStrategy.getClassName(entry[0], '_'), entry[1]));
    });

    schema.getTables()
      .filter(table => !options.schema || table.schema === options.schema)
      .forEach(table => this.createEntity(table, sharedEnums));

    if (options.save) {
      await ensureDir(baseDir);
      await Promise.all(this.sources.map(file => writeFile(baseDir + '/' + file.getBaseName(), file.generate())));
    }

    return this.sources.map(file => file.generate());
  }

  createEntity(table: DatabaseTable, sharedEnums: Dictionary<string[]>): void {
    const meta = table.getEntityDeclaration(this.namingStrategy, this.helper, sharedEnums);
    this.sources.push(new SourceFile(meta, this.namingStrategy, this.platform));
  }

}
