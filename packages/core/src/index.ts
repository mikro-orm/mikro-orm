/**
 * @packageDocumentation
 * @module core
 */
export { EntityMetadata, PrimaryKeyProp, EntityRepositoryType, OptionalProps, EagerProps, HiddenProps, Config, EntityName } from './typings.js';
export type {
  CompiledFunctions, Constructor, ConnectionType, Dictionary, Primary, IPrimaryKey, ObjectQuery, FilterQuery, IWrappedEntity, InferEntityName, EntityData, Highlighter, MaybePromise,
  AnyEntity, EntityClass, EntityProperty, PopulateOptions, Populate, Loaded, New, LoadedReference, LoadedCollection, IMigrator, IMigrationGenerator, MigratorEvent,
  GetRepository, MigrationObject, DeepPartial, PrimaryProperty, Cast, IsUnknown, EntityDictionary, EntityDTO, EntityDTOFlat, EntityDTOProp, SerializeDTO, MigrationDiff, GenerateOptions, FilterObject, IMigrationRunner,
  IEntityGenerator, ISeedManager, IMigratorStorage, RequiredEntityData, CheckCallback, IndexCallback, FormulaCallback, FormulaTable, SchemaTable, SchemaColumns, SimpleColumnMeta, Rel, Ref, ScalarRef, EntityRef, ISchemaGenerator,
  MigrationInfo, MigrateOptions, MigrationResult, MigrationRow, EntityKey, EntityValue, EntityDataValue, FilterKey, EntityType, FromEntityType, Selected, IsSubset,
  EntityProps, ExpandProperty, ExpandScalar, FilterItemValue, ExpandQuery, Scalar, ExpandHint, FilterValue, MergeLoaded, MergeSelected, TypeConfig, AnyString,
  ClearDatabaseOptions, CreateSchemaOptions, EnsureDatabaseOptions, UpdateSchemaOptions, DropSchemaOptions, RefreshDatabaseOptions, AutoPath, UnboxArray, MetadataProcessor, ImportsResolver,
  RequiredNullable, DefineConfig, Opt, Hidden, EntitySchemaWithMeta, InferEntity, CheckConstraint, GeneratedColumnCallback, FilterDef, EntityCtor, Subquery,
  PopulateHintOptions, Prefixes,
} from './typings.js';
export * from './enums.js';
export * from './errors.js';
export * from './exceptions.js';
export * from './MikroORM.js';
export * from './entity/index.js';
export * from './serialization/index.js';
export * from './events/index.js';
export * from './EntityManager.js';
export * from './unit-of-work/index.js';
export * from './utils/index.js';
export * from './logging/index.js';
export * from './hydration/index.js';
export * from './drivers/index.js';
export * from './connections/index.js';
export * from './platforms/index.js';
export * from './types/index.js';
export * from './naming-strategy/index.js';
export * from './metadata/index.js';
export * from './cache/index.js';
