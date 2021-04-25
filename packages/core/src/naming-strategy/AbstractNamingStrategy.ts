import { NamingStrategy } from './NamingStrategy';

export abstract class AbstractNamingStrategy implements NamingStrategy {

  getClassName(file: string, separator = '-'): string {
    const name = file.split('.')[0];
    const ret = name.replace(new RegExp(`${separator}+(\\w)`, 'g'), m => m[1].toUpperCase());

    return ret.charAt(0).toUpperCase() + ret.slice(1);
  }

  classToMigrationName(timestamp: string): string {
    return `Migration${timestamp}`;
  }

  indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence'): string {
    if (tableName.includes('.')) {
      tableName = tableName.substr(tableName.indexOf('.') + 1);
    }

    if (type === 'primary') {
      return `${tableName}_pkey`;
    }

    if (type === 'sequence') {
      return `${tableName}_${columns.join('_')}_seq`;
    }

    return `${tableName}_${columns.join('_')}_${type}`;
  }

  abstract classToTableName(entityName: string): string;

  abstract joinColumnName(propertyName: string): string;

  abstract joinKeyColumnName(entityName: string, referencedColumnName?: string): string;

  abstract joinTableName(sourceEntity: string, targetEntity: string, propertyName?: string): string;

  abstract propertyToColumnName(propertyName: string): string;

  abstract referenceColumnName(): string;

}
