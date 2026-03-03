import { AbstractNamingStrategy } from './AbstractNamingStrategy.js';

/**
 * This strategy keeps original entity/property names for table/column.
 */
export class EntityCaseNamingStrategy extends AbstractNamingStrategy {
  classToTableName(entityName: string, tableName?: string): string {
    return tableName ?? entityName;
  }

  joinColumnName(propertyName: string): string {
    return propertyName;
  }

  joinKeyColumnName(
    entityName: string,
    referencedColumnName?: string,
    composite?: boolean,
    tableName?: string,
  ): string {
    entityName = this.classToTableName(entityName, tableName);
    const name = entityName.substr(0, 1).toLowerCase() + entityName.substr(1);

    if (composite && referencedColumnName) {
      return name + '_' + referencedColumnName;
    }

    return name;
  }

  joinTableName(sourceEntity: string, targetEntity: string, propertyName: string, tableName?: string): string {
    return this.classToTableName(sourceEntity, tableName) + '_' + this.propertyToColumnName(propertyName);
  }

  propertyToColumnName(propertyName: string): string {
    return propertyName;
  }

  referenceColumnName(): string {
    return 'id';
  }
}
