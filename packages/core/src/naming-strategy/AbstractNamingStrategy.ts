import type { NamingStrategy } from './NamingStrategy';

export abstract class AbstractNamingStrategy implements NamingStrategy {

  getClassName(file: string, separator = '-'): string {
    const name = file.split('.')[0];
    const ret = name.replace(new RegExp(`${separator}+(\\w)`, 'g'), m => m[1].toUpperCase());

    return ret.charAt(0).toUpperCase() + ret.slice(1);
  }

  classToMigrationName(timestamp: string, customMigrationName?: string): string {
    let migrationName = `Migration${timestamp}`;

    if (customMigrationName) {
      migrationName += `_${customMigrationName}`;
    }

    return migrationName;
  }

  indexName(tableName: string, columns: string[], type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check'): string {
    /* istanbul ignore next */
    if (tableName.includes('.')) {
      tableName = tableName.substring(tableName.indexOf('.') + 1);
    }

    if (type === 'primary') {
      return `${tableName}_pkey`;
    }

    columns = columns.map(col => col.replace(/\./g, '_'));

    if (type === 'sequence') {
      return `${tableName}_${columns.join('_')}_seq`;
    }

    if (columns.length > 0) {
      return `${tableName}_${columns.join('_')}_${type}`;
    }

    return `${tableName}_${type}`;
  }

  columnNameToProperty(columnName: string): string {
    return columnName.replace(/[_\- ](\w)/g, m => m[1].toUpperCase()).replace(/[_\- ]+/g, '');
  }

  aliasName(entityName: string, index: number): string {
    // Take only the first letter of the prefix to keep character counts down since some engines have character limits
    return entityName.charAt(0).toLowerCase() + index;
  }

  abstract classToTableName(entityName: string): string;

  abstract joinColumnName(propertyName: string): string;

  abstract joinKeyColumnName(entityName: string, referencedColumnName?: string): string;

  abstract joinTableName(sourceEntity: string, targetEntity: string, propertyName?: string): string;

  abstract propertyToColumnName(propertyName: string, object?: boolean): string;

  abstract referenceColumnName(): string;

}
