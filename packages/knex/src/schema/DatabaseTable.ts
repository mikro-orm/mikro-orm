import { Dictionary, EntityMetadata, EntityProperty, EntitySchema, NamingStrategy, ReferenceType, Utils } from '@mikro-orm/core';
import { SchemaHelper } from './SchemaHelper';

export class DatabaseTable {

  private columns!: Dictionary<Column>;
  private indexes!: Index[];
  private foreignKeys!: Dictionary<ForeignKey>;

  constructor(readonly name: string,
              readonly schema?: string) { }

  getColumns(): Column[] {
    return Object.values(this.columns);
  }

  getColumn(name: string): Column | undefined {
    return this.columns[name];
  }

  getIndexes(): Dictionary<Index[]> {
    return this.indexes.reduce((o, index) => {
      if (index.primary) {
        return o;
      }

      o[index.keyName] = o[index.keyName] || [];
      o[index.keyName].push(index);

      return o;
    }, {} as Dictionary<Index[]>);
  }

  init(cols: Column[], indexes: Index[], pks: string[], fks: Dictionary<ForeignKey>, enums: Dictionary<string[]>): void {
    this.indexes = indexes;
    this.foreignKeys = fks;

    const map = this.getIndexes();
    Object.keys(map).forEach(key => {
      map[key].forEach(index => index.composite = map[key].length > 1);
    });

    this.columns = cols.reduce((o, v) => {
      const index = indexes.filter(i => i.columnName === v.name);
      v.primary = pks.includes(v.name);
      v.unique = index.some(i => i.unique && !i.primary);
      v.fk = fks[v.name];
      v.indexes = index.filter(i => !i.primary && !i.composite);
      v.defaultValue = v.defaultValue && v.defaultValue.toString().startsWith('nextval(') ? null : v.defaultValue;
      v.enumItems = enums[v.name] || [];
      o[v.name] = v;

      return o;
    }, {} as Dictionary<Column>);
  }

  getEntityDeclaration(namingStrategy: NamingStrategy, schemaHelper: SchemaHelper): EntityMetadata {
    const name = namingStrategy.getClassName(this.name, '_');
    const schema = new EntitySchema({ name, collection: this.name });
    const indexes = this.getIndexes();
    const compositeFkIndexes: Dictionary<{ keyName: string }> = {};

    Object.keys(indexes)
      .filter(name => indexes[name].length > 1)
      .forEach(name => {
        const properties = indexes[name].map(index => this.getPropertyName(this.getColumn(index.columnName)!));
        const index = { name, properties: Utils.unique(properties) };

        if (index.properties.length === 1) {
          compositeFkIndexes[index.properties[0]] = { keyName: name };
          return;
        }

        if (indexes[index.name][0].unique) {
          schema.addUnique(index);
        } else {
          schema.addIndex(index);
        }
      });

    this.getColumns().forEach(column => this.getPropertyDeclaration(column, namingStrategy, schemaHelper, compositeFkIndexes, schema));

    return schema.init().meta;
  }

  private getPropertyDeclaration(column: Column, namingStrategy: NamingStrategy, schemaHelper: SchemaHelper, compositeFkIndexes: Dictionary<{ keyName: string }>, schema: EntitySchema) {
    const reference = this.getReferenceType(column);
    const prop = this.getPropertyName(column);
    const type = this.getPropertyType(namingStrategy, schemaHelper, column);
    const fkOptions: Partial<EntityProperty> = {};
    const index = compositeFkIndexes[prop] || column.indexes.find(i => !i.unique);
    const unique = column.indexes.find(i => i.unique);

    if (column.fk) {
      fkOptions.referencedTableName = column.fk.referencedTableName;
      fkOptions.referencedColumnNames = [column.fk.referencedColumnName];
      fkOptions.onUpdateIntegrity = column.fk.updateRule.toLowerCase();
      fkOptions.onDelete = column.fk.deleteRule.toLowerCase();
    }

    schema.addProperty(prop, type, {
      reference,
      columnType: column.type,
      default: this.getPropertyDefaultValue(schemaHelper, column, type),
      defaultRaw: this.getPropertyDefaultValue(schemaHelper, column, type, true),
      nullable: column.nullable,
      primary: column.primary,
      fieldName: column.name,
      length: column.maxLength,
      index: index ? index.keyName : undefined,
      unique: unique ? unique.keyName : undefined,
      ...fkOptions,
    });
  }

  private getReferenceType(column: Column): ReferenceType {
    if (column.fk && column.unique) {
      return ReferenceType.ONE_TO_ONE;
    }

    if (column.fk) {
      return ReferenceType.MANY_TO_ONE;
    }

    return ReferenceType.SCALAR;
  }

  private getPropertyName(column: Column): string {
    let field = column.name;

    if (column.fk) {
      field = field.replace(new RegExp(`_${column.fk.referencedColumnName}$`), '');
    }

    return field.replace(/_(\w)/g, m => m[1].toUpperCase()).replace(/_+/g, '');
  }

  private getPropertyType(namingStrategy: NamingStrategy, schemaHelper: SchemaHelper, column: Column, defaultType = 'string'): string {
    if (column.fk) {
      return namingStrategy.getClassName(column.fk.referencedTableName, '_');
    }

    return schemaHelper.getTypeFromDefinition(column.type, defaultType);
  }

  private getPropertyDefaultValue(schemaHelper: SchemaHelper, column: Column, propType: string, raw = false): any {
    const empty = raw ? 'null' : undefined;

    if (!column.defaultValue) {
      return empty;
    }

    const val = schemaHelper.normalizeDefaultValue(column.defaultValue, column.maxLength);

    if (column.nullable && val === 'null') {
      return empty;
    }

    if (propType === 'boolean') {
      return !!column.defaultValue;
    }

    if (propType === 'number') {
      return +column.defaultValue;
    }

    return '' + val;
  }

}

export interface Column {
  name: string;
  type: string;
  fk: ForeignKey;
  fks: ForeignKey[];
  indexes: Index[];
  primary: boolean;
  unique: boolean;
  nullable: boolean;
  maxLength: number;
  defaultValue: string | null;
  enumItems: string[];
}

export interface ForeignKey {
  columnName: string;
  constraintName: string;
  referencedTableName: string;
  referencedColumnName: string;
  updateRule: string;
  deleteRule: string;
}

export interface Index {
  columnName: string;
  keyName: string;
  unique: boolean;
  primary: boolean;
  composite?: boolean;
}
