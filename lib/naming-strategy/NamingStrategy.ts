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
   * Return a column name for a property
   */
  propertyToColumnName(propertyName: string): string;

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
  joinTableName(sourceEntity: string, targetEntity: string, propertyName?: string): string;

  /**
   * Return the foreign key column name for the given parameters
   */
  joinKeyColumnName(entityName: string, referencedColumnName?: string): string;

}
