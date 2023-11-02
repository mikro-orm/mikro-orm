export interface NamingStrategy {

  /**
   * Return a name of the class based on its file name
   */
  getClassName(file: string, separator?: string): string;

  /**
   * Return a table name for an entity class
   */
  classToTableName(entityName: string): string;

  /**
   * Return a migration name. This name should allow ordering.
   */
  classToMigrationName(timestamp: string, customMigrationName?: string): string;

  /**
   * Return a column name for a property
   */
  propertyToColumnName(propertyName: string, object?: boolean): string;

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
  joinTableName(sourceEntity: string, targetEntity: string, propertyName: string): string;

  /**
   * Return the foreign key column name for the given parameters
   */
  joinKeyColumnName(entityName: string, referencedColumnName?: string, composite?: boolean): string;

  /**
   * Returns key/constraint name for given type. Some drivers might not support all the types (e.g. mysql and sqlite enforce the PK name).
   */
  indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check'): string;

  /**
   * Returns alias name for given entity. The alias needs to be unique across the query, which is by default
   * ensured via appended index parameter. It is optional to use it as long as you ensure it will be unique.
   */
  aliasName(entityName: string, index: number): string;

}
