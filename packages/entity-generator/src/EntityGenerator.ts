import {
  type Dictionary,
  EntityMetadata,
  type EntityProperty,
  type GenerateOptions,
  type MikroORM,
  type NamingStrategy,
  ReferenceKind,
  Utils,
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
import {
  type ClassDeclaration,
  type EnumDeclaration,
  type ImportSpecifier,
  ModuleKind,
  Project,
  ScriptKind,
  ScriptTarget,
  type VariableDeclaration,
} from 'ts-morph';
import { ESCAPE_PREFIX, RESOLVE_PREFIX } from './CoreImportsHelper';
import { EntitySchemaSourceFile } from './EntitySchemaSourceFile';
import { SourceFile } from './SourceFile';

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
    options = Utils.mergeConfig({}, this.config.get('entityGenerator'), options);
    const schema = await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema);
    const metadata = await this.getEntityMetadata(schema, options);

    for (const meta of metadata) {
      if (!meta.pivotTable || this.referencedEntities.has(meta)) {
        if (options.entitySchema) {
          this.sources.push(new EntitySchemaSourceFile(meta, this.namingStrategy, this.platform, { ...options, scalarTypeInDecorator: true }));
        } else {
          this.sources.push(new SourceFile(meta, this.namingStrategy, this.platform, options));
        }
      }
    }

    return this.postProcess(options);
  }

  private async getEntityMetadata(schema: DatabaseSchema, options: GenerateOptions) {
    let metadata = schema.getTables()
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
        return table.getEntityDeclaration(this.namingStrategy, this.helper, options.scalarPropertiesForRelations!);
      });

    for (const meta of metadata) {
      for (const prop of meta.relations) {
        if (options.skipTables?.includes(prop.referencedTableName) ||
          (prop.referencedTableName.includes('.') && (() => {
            const parts = prop.referencedTableName.split('.');
            return parts[0] === schema.name && options.skipTables?.includes(parts[1]);
          })())
        ) {
          prop.kind = ReferenceKind.SCALAR;
          const meta2 = metadata.find(m => m.className === prop.type)!;
          prop.type = meta2.getPrimaryProps().map(pk => pk.type).join(' | ');
        }
      }
    }

    metadata = metadata.filter(meta => !options.skipTables || !(options.skipTables.includes(`${meta.schema ?? schema.name}.${meta.collection}`) || ((meta.schema ?? schema.name) === schema.name && options.skipTables.includes(meta.collection))));

    await options.onInitialMetadata?.(metadata, this.platform);

    // enforce schema usage in class names only on duplicates
    const duplicates = Utils.findDuplicates(metadata.map(meta => meta.className));

    for (const duplicate of duplicates) {
      for (const meta of metadata.filter(meta => meta.className === duplicate)) {
        meta.className = this.namingStrategy.getEntityName(`${meta.schema ?? schema.name}_${meta.className}`);
        metadata.forEach(relMeta => relMeta.relations.forEach(prop => {
          if (prop.type === duplicate && (prop.referencedTableName === meta.collection || prop.referencedTableName === `${meta.schema ?? schema.name}.${meta.collection}`)) {
            prop.type = meta.className;
          }
        }));
      }
    }

    this.detectManyToManyRelations(metadata, options.onlyPurePivotTables!, options.readOnlyPivotTables!);

    if (options.bidirectionalRelations) {
      this.generateBidirectionalRelations(metadata);
    }

    if (options.identifiedReferences) {
      this.generateIdentifiedReferences(metadata);
    }

    if (options.customBaseEntityName) {
      this.generateAndAttachCustomBaseEntity(metadata, options.customBaseEntityName);
    }

    await options.onProcessedMetadata?.(metadata, this.platform);

    return metadata;
  }

  private detectManyToManyRelations(metadata: EntityMetadata[], onlyPurePivotTables: boolean, readOnlyPivotTables: boolean): void {
    for (const meta of metadata) {
      const isReferenced = metadata.some(m => {
        return m.tableName !== meta.tableName && m.relations.some(r => {
          return r.referencedTableName === meta.tableName && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(r.kind);
        });
      });

      if (isReferenced) {
        this.referencedEntities.add(meta);
      }

      // Entities with non-composite PKs are never pivot tables. Skip.
      if (!meta.compositePK) {
        continue;
      }

      // Entities where there are not exactly 2 PK relations that are both ManyToOne are never pivot tables. Skip.
      const pkRelations = meta.relations.filter(rel => rel.primary);
      if (
          pkRelations.length !== 2 ||
          pkRelations.some(rel => rel.kind !== ReferenceKind.MANY_TO_ONE)
      ) {
        continue;
      }

      const pkRelationFields = new Set<string>(pkRelations.flatMap(rel => rel.fieldNames));
      const nonPkFields = Array.from(new Set<string>(meta.props.flatMap(prop => prop.fieldNames))).filter(fieldName => !pkRelationFields.has(fieldName));

      let fixedOrderColumn: string | undefined;
      let isReadOnly = false;

      // If there are any fields other than the ones in the two PK relations, table may or may not be a pivot one.
      // Check further and skip on disqualification.
      if (nonPkFields.length > 0) {
        // Additional columns have been disabled with the setting.
        // Skip table even it otherwise would have qualified as a pivot table.
        if (onlyPurePivotTables) {
          continue;
        }

        const pkRelationNames = pkRelations.map(rel => rel.name);
        let otherProps = meta.props
          .filter(prop => !pkRelationNames.includes(prop.name) &&
            prop.persist !== false && // Skip checking non-persist props
            prop.fieldNames.some(fieldName => nonPkFields.includes(fieldName)),
          );

        // Deal with the auto increment column first. That is the column used for fixed ordering, if present.
        const autoIncrementProp = meta.props.find(prop => prop.autoincrement && prop.fieldNames.length === 1);
        if (autoIncrementProp) {
          otherProps = otherProps.filter(prop => prop !== autoIncrementProp);
          fixedOrderColumn = autoIncrementProp.fieldNames[0];
        }

        isReadOnly = otherProps.some(prop => {
          // If the prop is non-nullable and unique, it will trivially end up causing issues.
          // Mark as read only.
          if (!prop.nullable && prop.unique) {
            return true;
          }

          // Any other props need to also be optional.
          // Whether they have a default or are generated,
          // we've already checked that not explicitly setting the property means the default is either NULL,
          // or a non-unique non-null value, making it safe to write to pivot entity.
          return !prop.optional;
        });

        if (isReadOnly && !readOnlyPivotTables) {
          continue;
        }

        // If this now proven pivot entity has persistent props other than the fixed order column,
        // output it, by considering it as a referenced one.
        if (otherProps.length > 0) {
          this.referencedEntities.add(meta);
        }
      }

      meta.pivotTable = true;
      const owner = metadata.find(m => m.className === meta.relations[0].type)!;

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
      if (fixedOrderColumn) {
        ownerProp.fixedOrder = true;
        ownerProp.fixedOrderColumn = fixedOrderColumn;
      }
      if (isReadOnly) {
        ownerProp.persist = false;
      }

      owner.addProperty(ownerProp);
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
          persist: prop.persist,
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
      for (const prop of Object.values(meta.properties)) {
        if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) || prop.lazy) {
          prop.ref = true;
        }
      }
    }
  }

  private generateAndAttachCustomBaseEntity(metadata: EntityMetadata[], customBaseEntityName: string) {
    let baseClassExists = false;
    for (const meta of metadata) {
      if (meta.className === customBaseEntityName) {
        baseClassExists = true;
        continue;
      }
      meta.extends ??= customBaseEntityName;
    }
    if (!baseClassExists) {
      metadata.push(new EntityMetadata({
        className: customBaseEntityName,
        abstract: true,
        relations: [],
      }));
    }
  }

  private postProcess(options: GenerateOptions) {
    const defaultPath = `${this.config.get('baseDir')}/generated-entities`;
    const baseDir = Utils.normalizePath(options.path ?? defaultPath);
    const project = new Project({
      compilerOptions: {
        strict: true,
        isolatedModules: true,
        module: ModuleKind.Node16,
        target: ScriptTarget.Latest,
      },
    });

    const processedSources = this.sources
      .map(file => ({ sourceFile: project.createSourceFile(
        baseDir + '/' + file.getBaseName(),
        file.generate(),
        { overwrite: true, scriptKind: ScriptKind.TS },
      ), file }))
      .map(({ sourceFile, file }) => {
        const customNameDeclarations: Dictionary<ClassDeclaration | EnumDeclaration | VariableDeclaration> = {};
        const customImportedDeclarations: Dictionary<ImportSpecifier> = {};
        const conflictingCoreImports: Dictionary<ImportSpecifier> = {};

        if (!file.hasPotentialCoreConflict) {
          sourceFile.forgetDescendants();
          return ({ sourceFile, customNameDeclarations, customImportedDeclarations, conflictingCoreImports });
        }

        for (const declaration of [
          sourceFile.getClasses(),
          sourceFile.getEnums(),
          sourceFile.getVariableDeclarations(),
        ].flat()) {
          const originalName = declaration.getName();
          if (typeof originalName !== 'undefined' && originalName.startsWith(ESCAPE_PREFIX)) {
            const intendedName = originalName.replace(ESCAPE_PREFIX, '');
            customNameDeclarations[intendedName] = declaration;
          } else {
            declaration.forget();
          }
        }

        const customNameImports: string[] = [];
        for (const importDeclaration of sourceFile.getImportDeclarations()) {
          if (importDeclaration.getModuleSpecifierValue() === '@mikro-orm/core') {
            continue;
          }

          if (importDeclaration.getModuleSpecifierSourceFile()) {
            for (const namedImport of importDeclaration.getNamedImports()) {
              const originalName = namedImport.getName();
              if (originalName.startsWith(ESCAPE_PREFIX)) {
                const intendedName = originalName.replace(ESCAPE_PREFIX, '');
                customNameImports.push(intendedName);
                namedImport.forgetDescendants();
              } else {
                namedImport.forget();
              }
            }
            continue;
          }

          for (const namedImport of importDeclaration.getNamedImports()) {
            const originalName = namedImport.getName();
            if (originalName.startsWith(ESCAPE_PREFIX)) {
              const intendedName = originalName.replace(ESCAPE_PREFIX, '');
              customImportedDeclarations[intendedName] = namedImport;
              namedImport.forgetDescendants();
            } else {
              namedImport.forget();
            }
          }
        }

        const coreImports = sourceFile.getImportDeclaration('@mikro-orm/core')?.getNamedImports();
        if (coreImports) {
          const namesOfCustomDeclarations = [...Object.keys(customImportedDeclarations), ...Object.keys(customNameDeclarations)];
          for (const coreImport of coreImports) {
            let alias = coreImport.getName();
            while (namesOfCustomDeclarations.includes(alias) || customNameImports.includes(alias)) {
              alias = `${RESOLVE_PREFIX}${alias}`;
            }
            if (alias !== coreImport.getName()) {
              conflictingCoreImports[alias] = coreImport;
            } else {
              coreImport.forget();
            }
          }
        }

        return { sourceFile, customNameDeclarations, customImportedDeclarations, conflictingCoreImports };
      })
      .map(({ sourceFile, customNameDeclarations, customImportedDeclarations, conflictingCoreImports }) => {
        for (const [newAlias, coreImport] of Object.entries(conflictingCoreImports)) {
          coreImport.renameAlias(newAlias);
        }
        return { sourceFile, customNameDeclarations, customImportedDeclarations };
      })
      .map(({ sourceFile, customNameDeclarations, customImportedDeclarations }) => {
          for (const [intendedName, declaration] of Object.entries(customNameDeclarations)) {
            declaration.rename(intendedName);
          }
          return { sourceFile, customImportedDeclarations };
        },
      )
      .map(({ sourceFile, customImportedDeclarations }) => {
        for (const [intendedName, declaration] of Object.entries(customImportedDeclarations)) {
          declaration.renameAlias(intendedName).setName(intendedName).removeAlias();
        }
        sourceFile.forgetDescendants();
        return sourceFile;
      });

    if (options.save) {
      project.saveSync();
    }
    return processedSources.map(sourceFile => sourceFile.getFullText());
  }

}
