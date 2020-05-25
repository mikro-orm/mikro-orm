import { AbstractNamingStrategy } from './AbstractNamingStrategy';

export class MongoNamingStrategy extends AbstractNamingStrategy {

  classToTableName(entityName: string): string {
    return entityName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  joinColumnName(propertyName: string): string {
    return propertyName;
  }

  joinKeyColumnName(entityName: string, referencedColumnName?: string): string {
    return entityName;
  }

  joinTableName(sourceEntity: string, targetEntity: string, propertyName: string): string {
    return '';
  }

  propertyToColumnName(propertyName: string): string {
    return propertyName;
  }

  referenceColumnName(): string {
    return '_id';
  }

}
