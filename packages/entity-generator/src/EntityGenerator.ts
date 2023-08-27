import { ensureDir, writeFile } from 'fs-extra';
import type { EntityMetadata, EntityProperty, GenerateOptions, MikroORM } from '@mikro-orm/core';
import { ReferenceType, Utils } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/knex';
import { DatabaseSchema } from '@mikro-orm/knex';
import { SourceFile } from './SourceFile';
import { EntitySchemaSourceFile } from './EntitySchemaSourceFile';

export class EntityGenerator {

  private readonly config = this.em.config;
  private readonly driver = this.em.getDriver();
  private readonly platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly sources: SourceFile[] = [];

  constructor(private readonly em: EntityManager) { }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/entity-generator', new EntityGenerator(orm.em as EntityManager));
  }

  async generate(options: GenerateOptions = {}): Promise<string[]> {
    const baseDir = Utils.normalizePath(options.baseDir ?? (this.config.get('baseDir') + '/generated-entities'));
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config);

    let metadata = schema.getTables()
      .filter(table => !options.schema || table.schema === options.schema)
      .sort((a, b) => a.name!.localeCompare(b.name!))
      .map(table => {
        const skipColumns = options.skipColumns?.[table.getShortestName()];
        if (skipColumns) {
          table.getColumns().forEach(col => {
            if (skipColumns.includes(col.name)) {
              table.removeColumn(col.name);
            }
          });
        }
        return table.getEntityDeclaration(this.namingStrategy, this.helper);
      });

    for (const meta of metadata) {
      for (const prop of meta.relations) {
        if (options.skipTables?.includes(prop.referencedTableName)) {
          prop.reference = ReferenceType.SCALAR;
          const meta2 = metadata.find(m => m.className === prop.type)!;
          prop.type = meta2.getPrimaryProps().map(pk => pk.type).join(' | ');
        }
      }
    }

    metadata = metadata.filter(table => !options.skipTables || !options.skipTables.includes(table.tableName));

    this.detectManyToManyRelations(metadata);

    if (this.config.get('entityGenerator').bidirectionalRelations) {
      this.generateBidirectionalRelations(metadata);
    }

    if (this.config.get('entityGenerator').identifiedReferences) {
      this.generateIdentifiedReferences(metadata);
    }

    const esmImport = this.config.get('entityGenerator').esmImport ?? false;

    for (const meta of metadata) {
      if (!meta.pivotTable) {
        if (this.config.get('entityGenerator').entitySchema) {
          this.sources.push(new EntitySchemaSourceFile(meta, this.namingStrategy, this.platform, esmImport));
        } else {
          this.sources.push(new SourceFile(meta, this.namingStrategy, this.platform, esmImport));
        }
      }
    }

    if (options.save) {
      await ensureDir(baseDir);
      await Promise.all(this.sources.map(file => writeFile(baseDir + '/' + file.getBaseName(), file.generate())));
    }

    return this.sources.map(file => file.generate());
  }

  private detectManyToManyRelations(metadata: EntityMetadata[]): void {
    for (const meta of metadata) {
      if (
        meta.compositePK &&                                                         // needs to have composite PK
        meta.primaryKeys.length === meta.relations.length &&                        // all relations are PKs
        meta.relations.length === 2 &&                                              // there are exactly two relation properties
        meta.relations.length === meta.props.length &&                              // all properties are relations
        meta.relations.every(prop => prop.reference === ReferenceType.MANY_TO_ONE)  // all relations are m:1
      ) {
        meta.pivotTable = true;
        const owner = metadata.find(m => m.className === meta.relations[0].type);

        if (!owner) {
          continue;
        }

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
  }

  private generateBidirectionalRelations(metadata: EntityMetadata[]): void {
    for (const meta of metadata.filter(m => !m.pivotTable)) {
      for (const prop of meta.relations) {
        const targetMeta = metadata.find(m => m.className === prop.type)!;
        const newProp = {
          name: prop.name + 'Inverse',
          type: meta.className,
          joinColumns: prop.fieldNames,
          referencedTableName: meta.tableName,
          referencedColumnNames: Utils.flatten(targetMeta.getPrimaryProps().map(pk => pk.fieldNames)),
          mappedBy: prop.name,
        } as EntityProperty;

        if (prop.reference === ReferenceType.MANY_TO_ONE) {
          newProp.reference = ReferenceType.ONE_TO_MANY;
        } else if (prop.reference === ReferenceType.ONE_TO_ONE && !prop.mappedBy) {
          newProp.reference = ReferenceType.ONE_TO_ONE;
          newProp.nullable = true;
        } else if (prop.reference === ReferenceType.MANY_TO_MANY && !prop.mappedBy) {
          newProp.reference = ReferenceType.MANY_TO_MANY;
        } else {
          continue;
        }

        targetMeta.addProperty(newProp);
      }
    }
  }

  private generateIdentifiedReferences(metadata: EntityMetadata[]): void {
    for (const meta of metadata.filter(m => !m.pivotTable)) {
      for (const prop of meta.relations) {
        if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
          prop.wrappedReference = true;
        }
      }
    }
  }

}
