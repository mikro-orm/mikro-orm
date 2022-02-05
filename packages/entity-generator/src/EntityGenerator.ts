import { ensureDir, writeFile } from 'fs-extra';
import type { EntityProperty } from '@mikro-orm/core';
import { ReferenceType, Utils } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/knex';
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
    const baseDir = Utils.normalizePath(options.baseDir ?? (this.config.get('baseDir') + '/generated-entities'));
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config);

    const metadata = schema.getTables()
      .filter(table => !options.schema || table.schema === options.schema)
      .map(table => table.getEntityDeclaration(this.namingStrategy, this.helper));

    // detect M:N relations
    for (const meta of metadata) {
      if (
        meta.compositePK &&                                                         // needs to have composite PK
        meta.primaryKeys.length === meta.relations.length &&                        // all relations are PKs
        meta.relations.length === 2 &&                                              // there are exactly two relation properties
        meta.relations.length === meta.props.length &&                              // all properties are relations
        meta.relations.every(prop => prop.reference === ReferenceType.MANY_TO_ONE)  // all relations are m:1
      ) {
        meta.pivotTable = true;
        const owner = metadata.find(m => m.className === meta.relations[0].type)!;
        const name = this.namingStrategy.columnNameToProperty(meta.tableName.replace(new RegExp('^' + owner.tableName + '_'), ''));
        owner.addProperty({
          name,
          reference: ReferenceType.MANY_TO_MANY,
          pivotTable: meta.tableName,
          type: meta.relations[1].type,
          joinColumns: meta.relations[0].fieldNames,
          inverseJoinColumns: meta.relations[1].fieldNames,
        } as EntityProperty);
      }
    }

    for (const meta of metadata) {
      if (!meta.pivotTable) {
        this.sources.push(new SourceFile(meta, this.namingStrategy, this.platform));
      }
    }

    if (options.save) {
      await ensureDir(baseDir);
      await Promise.all(this.sources.map(file => writeFile(baseDir + '/' + file.getBaseName(), file.generate())));
    }

    return this.sources.map(file => file.generate());
  }

}
