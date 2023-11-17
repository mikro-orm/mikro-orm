import { ensureDir, writeFile } from 'fs-extra';
import {
  ReferenceKind,
  Utils,
  type EntityMetadata,
  type EntityProperty,
  type GenerateOptions,
  type MikroORM,
  type NamingStrategy,
} from '@mikro-orm/core';
import {
  type AbstractSqlConnection,
  type AbstractSqlDriver,
  type AbstractSqlPlatform,
  type Configuration,
  DatabaseSchema,
  type EntityManager,
  type SchemaHelper,
} from '@mikro-orm/knex';
import { SourceFile } from './SourceFile';
import { EntitySchemaSourceFile } from './EntitySchemaSourceFile';

export class EntityGenerator {

  private readonly config: Configuration;
  private readonly driver: AbstractSqlDriver;
  private readonly platform: AbstractSqlPlatform;
  private readonly helper: SchemaHelper;
  private readonly connection: AbstractSqlConnection;
  private readonly namingStrategy: NamingStrategy;
  private readonly sources: SourceFile[] = [];
  private readonly referencedEntities = new WeakSet<EntityMetadata>();

  constructor(private readonly em: EntityManager) {
    this.config = this.em.config;
    this.driver = this.em.getDriver();
    this.platform = this.driver.getPlatform();
    this.helper = this.platform.getSchemaHelper()!;
    this.connection = this.driver.getConnection();
    this.namingStrategy = this.config.getNamingStrategy();
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/entity-generator', () => new EntityGenerator(orm.em as EntityManager));
  }

  async generate(options: GenerateOptions = {}): Promise<string[]> {
    const baseDir = Utils.normalizePath(options.baseDir ?? (this.config.get('baseDir') + '/generated-entities'));
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config);

    const scalarPropertiesForRelations = this.config.get('entityGenerator').scalarPropertiesForRelations!;

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
        return table.getEntityDeclaration(this.namingStrategy, this.helper, scalarPropertiesForRelations);
      });

    for (const meta of metadata) {
      for (const prop of meta.relations) {
        if (options.skipTables?.includes(prop.referencedTableName)) {
          prop.kind = ReferenceKind.SCALAR;
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
      if (!meta.pivotTable || this.referencedEntities.has(meta)) {
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
      if (metadata.some(m => {
        return m.tableName !== meta.tableName && m.relations.some(
          r => {
            return r.referencedTableName === meta.tableName && (r.kind === ReferenceKind.MANY_TO_ONE || r.kind === ReferenceKind.ONE_TO_ONE);
          });
      })) {
        this.referencedEntities.add(meta);
      }
      if (
        meta.compositePK &&                                                         // needs to have composite PK
        meta.relations.length === 2 &&                                              // there are exactly two relation properties
        !meta.relations.some(rel => !rel.primary || rel.kind !== ReferenceKind.MANY_TO_ONE) && // all relations are m:1 and PKs
        (
          // all properties are relations...
          meta.relations.length === meta.props.length
          // ... or at least all fields involved are only the fields of the relations
          || (new Set<string>(meta.props.flatMap(prop => prop.fieldNames)).size === (new Set<string>(meta.relations.flatMap(rel => rel.fieldNames)).size))
        )
      ) {
        meta.pivotTable = true;
        const owner = metadata.find(m => m.className === meta.relations[0].type);

        if (!owner) {
          continue;
        }

        const name = this.namingStrategy.columnNameToProperty(meta.tableName.replace(new RegExp('^' + owner.tableName + '_'), ''));
        const ownerProp = {
          name,
          kind: ReferenceKind.MANY_TO_MANY,
          pivotTable: meta.tableName,
          type: meta.relations[1].type,
          joinColumns: meta.relations[0].fieldNames,
          inverseJoinColumns: meta.relations[1].fieldNames,
        } as EntityProperty;

        if (this.referencedEntities.has(meta)) {
          ownerProp.pivotEntity = meta.className;
        }
        owner.addProperty(ownerProp);
      }
    }
  }

  private generateBidirectionalRelations(metadata: EntityMetadata[]): void {
    for (const meta of metadata.filter(m => !m.pivotTable || this.referencedEntities.has(m))) {
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

        if (prop.kind === ReferenceKind.MANY_TO_ONE) {
          newProp.kind = ReferenceKind.ONE_TO_MANY;
        } else if (prop.kind === ReferenceKind.ONE_TO_ONE && !prop.mappedBy) {
          newProp.kind = ReferenceKind.ONE_TO_ONE;
          newProp.nullable = true;
        } else if (prop.kind === ReferenceKind.MANY_TO_MANY && !prop.mappedBy) {
          newProp.kind = ReferenceKind.MANY_TO_MANY;
        } else {
          continue;
        }

        targetMeta.addProperty(newProp);
      }
    }
  }

  private generateIdentifiedReferences(metadata: EntityMetadata[]): void {
    for (const meta of metadata.filter(m => !m.pivotTable || this.referencedEntities.has(m))) {
      for (const prop of meta.relations) {
        if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
          prop.ref = true;
        }
      }
    }
  }

}
