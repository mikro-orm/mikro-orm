import type { ReferenceKind } from '../enums.js';

export interface NamingStrategy {
  /**
   * Return a name of the class based on its file name
   */
  getClassName(file: string, separator?: string): string;

  /**
   * Return a table name for an entity class
   */
  classToTableName(entityName: string, tableName?: string): string;

  /**
   * Return a migration name. This name should allow ordering.
   */
  classToMigrationName(timestamp: string, customMigrationName?: string): string;

  /**
   * Return a column name for a property
   */
  propertyToColumnName(propertyName: string, object?: boolean): string;

  /**
   * Get an enum class name.
   *
   * @param columnName The column name which has the enum.
   * @param tableName The table name of the column.
   * @param schemaName The schema name of the column.
   *
   * @return A new class name that will be used for the enum.
   */
  getEnumClassName(columnName: string, tableName: string | undefined, schemaName?: string): string;

  /**
   * Get an enum type name. Used with `enumType: 'dictionary'` and `enumType: 'union-type'` entity generator option.
   *
   * @param columnName The column name which has the enum.
   * @param tableName The table name of the column.
   * @param schemaName The schema name of the column.
   *
   * @return A new type name that will be used for the enum.
   */
  getEnumTypeName(columnName: string, tableName: string | undefined, schemaName?: string): string;

  /**
   * Get an enum option name for a given enum value.
   *
   * @param enumValue The enum value to generate a name for.
   * @param columnName The column name which has the enum.
   * @param tableName The table name of the column.
   * @param schemaName The schema name of the column.
   *
   * @return The name of the enum property that will hold the value.
   */
  enumValueToEnumProperty(enumValue: string, columnName: string, tableName: string, schemaName?: string): string;

  /**
   * Return a name of the entity class based on database table name (used in `EntityGenerator`).
   * Default implementation ignores the schema name.
   */
  getEntityName(tableName: string, schemaName?: string): string;

  /**
   * Return a property for a column name (used in `EntityGenerator`).
   */
  columnNameToProperty(columnName: string): string;

  /**
   * Return the default reference column name
   */
  referenceColumnName(): string;

  /**
   * Return a join column name for a property
   */
  joinColumnName(propertyName: string): string;

  /**
   * Return a join table name
   */
  joinTableName(sourceEntity: string, targetEntity: string, propertyName: string, tableName?: string): string;

  /**
   * Return the foreign key column name for the given parameters
   */
  joinKeyColumnName(entityName: string, referencedColumnName?: string, composite?: boolean, tableName?: string): string;

  /**
   * Returns key/constraint name for the given type. Some drivers might not support all the types (e.g. mysql and sqlite enforce the PK name).
   */
  indexName(
    tableName: string,
    columns: string[],
    type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check' | 'default',
  ): string;

  /**
   * Returns alias name for given entity. The alias needs to be unique across the query, which is by default
   * ensured via appended index parameter. It is optional to use it as long as you ensure it will be unique.
   */
  aliasName(entityName: string, index: number): string;

  /**
   * Returns the name of the inverse side property. Used in the `EntityGenerator` with `bidirectionalRelations` option.
   */
  inverseSideName(entityName: string, propertyName: string, kind: ReferenceKind): string;

  /**
   * Return a property name for a many-to-many relation (used in `EntityGenerator`).
   *
   * @param ownerEntityName - The owner entity class name
   * @param targetEntityName - The target entity class name
   * @param pivotTableName - The pivot table name
   * @param ownerTableName - The owner table name
   * @param schemaName - The schema name (if any)
   */
  manyToManyPropertyName(
    ownerEntityName: string,
    targetEntityName: string,
    pivotTableName: string,
    ownerTableName: string,
    schemaName?: string,
  ): string;

  /**
   * Returns the discriminator column name for polymorphic relations.
   */
  discriminatorColumnName(baseName: string): string;
}
