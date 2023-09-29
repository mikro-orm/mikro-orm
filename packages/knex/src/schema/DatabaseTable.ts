import { Cascade, DateTimeType, DecimalType, EntitySchema, ReferenceType, t, Utils, type Dictionary, type EntityMetadata, type EntityProperty, type NamingStrategy } from '@mikro-orm/core';
import type { SchemaHelper } from './SchemaHelper';
import type { Check, Column, ForeignKey, Index } from '../typings';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform';

/**
 * @internal
 */
export class DatabaseTable {

  private columns: Dictionary<Column> = {};
  private indexes: Index[] = [];
  private checks: Check[] = [];
  private foreignKeys: Dictionary<ForeignKey> = {};
  public comment?: string;

  constructor(private readonly platform: AbstractSqlPlatform,
              readonly name: string,
              readonly schema?: string) {
    Object.defineProperties(this, {
      platform: { enumerable: false, writable: true },
    });
  }

  getColumns(): Column[] {
    return Object.values(this.columns);
  }

  getColumn(name: string): Column | undefined {
    return this.columns[name];
  }

  removeColumn(name: string): void {
    delete this.columns[name];
  }

  getIndexes(): Index[] {
    return this.indexes;
  }

  getChecks(): Check[] {
    return this.checks;
  }

  init(cols: Column[], indexes: Index[] = [], checks: Check[] = [], pks: string[], fks: Dictionary<ForeignKey> = {}, enums: Dictionary<string[]> = {}): void {
    this.indexes = indexes;
    this.checks = checks;
    this.foreignKeys = fks;

    this.columns = cols.reduce((o, v) => {
      const index = indexes.filter(i => i.columnNames[0] === v.name);
      v.primary = v.primary || pks.includes(v.name);
      v.unique = index.some(i => i.unique && !i.primary);
      const type = v.name in enums ? 'enum' : v.type;
      v.mappedType = this.platform.getMappedType(type);
      v.default = v.default?.toString().startsWith('nextval(') ? null : v.default;
      v.enumItems = enums[v.name] || [];
      o[v.name] = v;

      return o;
    }, {} as Dictionary<Column>);
  }

  addColumn(column: Column) {
    this.columns[column.name] = column;
  }

  addColumnFromProperty(prop: EntityProperty, meta: EntityMetadata) {
    prop.fieldNames.forEach((field, idx) => {
      const type = prop.enum ? 'enum' : prop.columnTypes[idx];
      const mappedType = this.platform.getMappedType(type);

      if (mappedType instanceof DecimalType) {
        const match = prop.columnTypes[idx].match(/\w+\((\d+), ?(\d+)\)/);

        /* istanbul ignore else */
        if (match) {
          prop.precision = +match[1];
          prop.scale = +match[2];
          prop.length = undefined;
        }
      }

      if (mappedType instanceof DateTimeType) {
        prop.length ??= this.platform.getDefaultDateTimeLength();
      }

      const primary = !meta.compositePK && !!prop.primary && prop.reference === ReferenceType.SCALAR && this.platform.isNumericColumn(mappedType);
      this.columns[field] = {
        name: prop.fieldNames[idx],
        type: prop.columnTypes[idx],
        mappedType,
        unsigned: prop.unsigned && this.platform.isNumericColumn(mappedType),
        autoincrement: prop.autoincrement ?? primary,
        primary,
        nullable: this.columns[field]?.nullable ?? !!prop.nullable,
        length: prop.length,
        precision: prop.precision,
        scale: prop.scale,
        default: prop.defaultRaw,
        enumItems: prop.items?.every(Utils.isString) ? prop.items as string[] : undefined,
        comment: prop.comment,
        extra: prop.extra,
        ignoreSchemaChanges: prop.ignoreSchemaChanges,
      };
      this.columns[field].unsigned ||= this.columns[field].autoincrement;
      const defaultValue = this.platform.getSchemaHelper()!.normalizeDefaultValue(prop.defaultRaw!, prop.length);
      this.columns[field].default = defaultValue as string;
    });

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop.reference)) {
      const constraintName = this.getIndexName(true, prop.fieldNames, 'foreign');
      let schema = prop.targetMeta!.schema === '*' ? this.schema : prop.targetMeta!.schema ?? this.schema;

      if (prop.referencedTableName.includes('.')) {
        schema = undefined;
      }

      this.foreignKeys[constraintName] = {
        constraintName,
        columnNames: prop.fieldNames,
        localTableName: this.getShortestName(),
        referencedColumnNames: prop.referencedColumnNames,
        referencedTableName: schema ? `${schema}.${prop.referencedTableName}` : prop.referencedTableName,
      };

      const cascade = prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL);

      if (prop.onDelete || cascade || prop.nullable) {
        this.foreignKeys[constraintName].deleteRule = prop.onDelete || (cascade ? 'cascade' : 'set null');
      }

      if (prop.onUpdateIntegrity || prop.cascade.includes(Cascade.PERSIST) || prop.cascade.includes(Cascade.ALL)) {
        this.foreignKeys[constraintName].updateRule = prop.onUpdateIntegrity || 'cascade';
      }
    }

    if (prop.index) {
      this.indexes.push({
        columnNames: prop.fieldNames,
        composite: prop.fieldNames.length > 1,
        keyName: this.getIndexName(prop.index, prop.fieldNames, 'index'),
        primary: false,
        unique: false,
      });
    }

    if (prop.unique && !(prop.primary && !meta.compositePK)) {
      this.indexes.push({
        columnNames: prop.fieldNames,
        composite: prop.fieldNames.length > 1,
        keyName: this.getIndexName(prop.unique, prop.fieldNames, 'unique'),
        primary: false,
        unique: true,
      });
    }
  }

  private getIndexName(value: boolean | string, columnNames: string[], type: 'unique' | 'index' | 'primary' | 'foreign'): string {
    if (Utils.isString(value)) {
      return value;
    }

    return this.platform.getIndexName(this.name, columnNames, type);
  }

  getEntityDeclaration(namingStrategy: NamingStrategy, schemaHelper: SchemaHelper): EntityMetadata {
    let name = namingStrategy.getClassName(this.name, '_');
    name = name.match(/^\d/) ? 'E' + name : name;
    const schema = new EntitySchema({ name, collection: this.name, schema: this.schema });
    const compositeFkIndexes: Dictionary<{ keyName: string }> = {};
    const compositeFkUniques: Dictionary<{ keyName: string }> = {};

    for (const index of this.indexes.filter(index => index.columnNames.length > 1)) {
      const properties = index.columnNames.map(col => this.getPropertyName(namingStrategy, this.getColumn(col)!));
      const ret = { name: index.keyName, properties: Utils.unique(properties) };

      if (ret.properties.length === 1) {
        const map = index.unique ? compositeFkUniques : compositeFkIndexes;
        map[ret.properties[0]] = { keyName: index.keyName };
        continue;
      }

      if (index.primary) {
        //
      } else if (index.unique) {
        schema.addUnique(ret);
      } else {
        schema.addIndex(ret);
      }
    }

    for (const column of this.getColumns()) {
      const prop = this.getPropertyDeclaration(column, namingStrategy, schemaHelper, compositeFkIndexes, compositeFkUniques);
      schema.addProperty(prop.name, prop.type, prop);
    }

    const meta = schema.init().meta;
    meta.relations
      .filter(prop => prop.primary && prop.reference === ReferenceType.MANY_TO_ONE && !meta.compositePK)
      .forEach(prop => prop.reference = ReferenceType.ONE_TO_ONE);

    return meta;
  }

  /**
   * The shortest name is stripped of the default namespace. All other namespaced elements are returned as full-qualified names.
   */
  getShortestName(): string {
    if (!this.schema || this.name.startsWith(this.schema + '.')) {
      return this.name;
    }

    return `${this.schema}.${this.name}`;
  }

  getForeignKeys() {
    return this.foreignKeys;
  }

  hasColumn(columnName: string) {
    return columnName in this.columns;
  }

  getIndex(indexName: string) {
    return this.indexes.find(i => i.keyName === indexName);
  }

  hasIndex(indexName: string) {
    return !!this.getIndex(indexName);
  }

  getCheck(checkName: string) {
    return this.checks.find(i => i.name === checkName);
  }

  hasCheck(checkName: string) {
    return !!this.getCheck(checkName);
  }

  getPrimaryKey() {
    return this.indexes.find(i => i.primary);
  }

  hasPrimaryKey() {
    return !!this.getPrimaryKey();
  }

  private getPropertyDeclaration(
    column: Column,
    namingStrategy: NamingStrategy,
    schemaHelper: SchemaHelper,
    compositeFkIndexes: Dictionary<{ keyName: string }>,
    compositeFkUniques: Dictionary<{ keyName: string }>,
  ) {
    const fk = Object.values(this.foreignKeys).find(fk => fk.columnNames.includes(column.name));
    const prop = this.getPropertyName(namingStrategy, column);
    const index = compositeFkIndexes[prop] || this.indexes.find(idx => idx.columnNames[0] === column.name && !idx.composite && !idx.unique && !idx.primary);
    const unique = compositeFkUniques[prop] || this.indexes.find(idx => idx.columnNames[0] === column.name && !idx.composite && idx.unique && !idx.primary);
    const reference = this.getReferenceType(fk, unique);
    const type = this.getPropertyType(namingStrategy, column, fk);
    const fkOptions: Partial<EntityProperty> = {};

    if (fk) {
      fkOptions.fieldNames = fk.columnNames;
      fkOptions.referencedTableName = fk.referencedTableName;
      fkOptions.referencedColumnNames = fk.referencedColumnNames;
      fkOptions.onUpdateIntegrity = fk.updateRule?.toLowerCase();
      fkOptions.onDelete = fk.deleteRule?.toLowerCase();
    }

    return {
      name: prop,
      type,
      reference,
      columnType: column.type,
      default: this.getPropertyDefaultValue(schemaHelper, column, type),
      defaultRaw: this.getPropertyDefaultValue(schemaHelper, column, type, true),
      nullable: column.nullable,
      primary: column.primary,
      fieldName: column.name,
      length: column.length,
      precision: column.precision,
      scale: column.scale,
      index: index ? index.keyName : undefined,
      unique: unique ? unique.keyName : undefined,
      enum: !!column.enumItems?.length,
      items: column.enumItems,
      ...fkOptions,
    };
  }

  private getReferenceType(fk?: ForeignKey, unique?: { keyName: string }): ReferenceType {
    if (fk && unique) {
      return ReferenceType.ONE_TO_ONE;
    }

    if (fk) {
      return ReferenceType.MANY_TO_ONE;
    }

    return ReferenceType.SCALAR;
  }

  private getPropertyName(namingStrategy: NamingStrategy, column: Column): string {
    const fk = Object.values(this.foreignKeys).find(fk => fk.columnNames.includes(column.name));
    let field = column.name;

    if (fk) {
      const idx = fk.columnNames.indexOf(column.name);
      field = field.replace(new RegExp(`_${fk.referencedColumnNames[idx]}$`), '');
    }

    return namingStrategy.columnNameToProperty(field);
  }

  private getPropertyType(namingStrategy: NamingStrategy, column: Column, fk?: ForeignKey): string {
    if (fk) {
      const parts = fk.referencedTableName.split('.', 2);
      return namingStrategy.getClassName(parts.length > 1 ? parts[1] : parts[0], '_');
    }
    // If this column is using an enum.
    if (column.enumItems?.length) {
      // We will create a new enum name for this type and set it as the property type as well.
      // The enum name will be a concatenation of the table name and the column name.
      return namingStrategy.getClassName(this.name + '_' + column.name, '_');
    }

    return column.mappedType?.compareAsType() ?? 'unknown';
  }

  private getPropertyDefaultValue(schemaHelper: SchemaHelper, column: Column, propType: string, raw = false): any {
    const empty = raw ? 'null' : undefined;

    if (!column.default) {
      return empty;
    }

    const val = schemaHelper.normalizeDefaultValue(column.default, column.length);

    if (column.nullable && val === 'null') {
      return empty;
    }

    if (propType === 'boolean' && !raw) {
      return !['0', 'false', 'f', 'n', 'no', 'off'].includes('' + column.default);
    }

    if (propType === 'number') {
      return +column.default;
    }

    // unquote string defaults if `raw = false`
    const match = ('' + val).match(/^'(.*)'$/);

    if (!raw && match) {
      return match[1];
    }

    return '' + val;
  }

  addIndex(meta: EntityMetadata, index: { properties: string | string[]; name?: string; type?: string; expression?: string; options?: Dictionary }, type: 'index' | 'unique' | 'primary') {
    const properties = Utils.unique(Utils.flatten(Utils.asArray(index.properties).map(prop => meta.properties[prop].fieldNames)));

    if (properties.length === 0 && !index.expression) {
      return;
    }

    const name = this.getIndexName(index.name!, properties, type);
    this.indexes.push({
      keyName: name,
      columnNames: properties,
      composite: properties.length > 1,
      primary: type === 'primary',
      unique: type !== 'index',
      type: index.type,
      expression: index.expression,
    });
  }

  addCheck(check: Check) {
    this.checks.push(check);
  }

  toJSON(): Dictionary {
    const { platform, columns, ...rest } = this;
    const columnsMapped = Object.keys(columns).reduce((o, col) => {
      const { mappedType, ...restCol } = columns[col];
      o[col] = restCol;
      o[col].mappedType = Object.keys(t).find(k => t[k] === mappedType.constructor);

      return o;
    }, {} as Dictionary);

    return { columns: columnsMapped, ...rest };
  }

}
