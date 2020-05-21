import { AbstractNamingStrategy } from './AbstractNamingStrategy';

/**
 * This strategy keeps original entity/property names for table/column.
 */
export class EntityCaseNamingStrategy extends AbstractNamingStrategy {

  classToTableName(entityName: string): string {
    return entityName;
  }

  joinColumnName(propertyName: string): string {
    return propertyName;
  }

  joinKeyColumnName(entityName: string, referencedColumnName?: string, composite = false): string {
    const name = entityName.substr(0, 1).toLowerCase() + entityName.substr(1);

    if (composite) {
      return name + '_' + (referencedColumnName || this.referenceColumnName());
    }

    return name;
  }

  joinTableName(sourceEntity: string, targetEntity: string, propertyName: string): string {
    return this.classToTableName(sourceEntity) + '_' + this.propertyToColumnName(propertyName);
  }

  propertyToColumnName(propertyName: string): string {
    return propertyName;
  }

  referenceColumnName(): string {
    return 'id';
  }

}
