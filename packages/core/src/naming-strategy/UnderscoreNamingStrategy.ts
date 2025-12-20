import { AbstractNamingStrategy } from './AbstractNamingStrategy.js';

export class UnderscoreNamingStrategy extends AbstractNamingStrategy {

  classToTableName(entityName: string, tableName?: string): string {
    return tableName ?? this.underscore(entityName);
  }

  joinColumnName(propertyName: string): string {
    return this.underscore(propertyName) + '_' + this.referenceColumnName();
  }

  joinKeyColumnName(entityName: string, referencedColumnName?: string, composite?: boolean, tableName?: string): string {
    return this.classToTableName(entityName, tableName) + '_' + (referencedColumnName || this.referenceColumnName());
  }

  joinTableName(sourceEntity: string, targetEntity: string, propertyName: string, tableName?: string): string {
    return this.classToTableName(sourceEntity, tableName) + '_' + this.classToTableName(propertyName);
  }

  propertyToColumnName(propertyName: string, object?: boolean): string {
    return this.underscore(propertyName);
  }

  referenceColumnName(): string {
    return 'id';
  }

  private underscore(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

}
