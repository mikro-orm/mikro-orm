import { Cascade, DateTimeType, DecimalType, EntitySchema, ReferenceKind, t, Utils, type Dictionary, type EntityMetadata, type EntityProperty, type NamingStrategy } from '@mikro-orm/core';
import type { SchemaHelper } from './SchemaHelper';
import type { CheckDef, Column, ForeignKey, IndexDef } from '../typings';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform';

/**
 * @internal
 */
export class DatabaseTable {

  private columns: Dictionary<Column> = {};
  private indexes: IndexDef[] = [];
  private checks: CheckDef[] = [];
  private foreignKeys: Dictionary<ForeignKey> = {};
  private nullableForeignKeys = new Set<ForeignKey>();
  public nativeEnums: Dictionary<unknown[]> = {}; // for postgres
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

  getIndexes(): IndexDef[] {
    return Utils.removeDuplicates(this.indexes);
  }

  getChecks(): CheckDef[] {
    return this.checks;
  }

  init(cols: Column[], indexes: IndexDef[] = [], checks: CheckDef[] = [], pks: string[], fks: Dictionary<ForeignKey> = {}, enums: Dictionary<string[]> = {}): void {
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
      v.enumItems ??= enums[v.name] || [];
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
          prop.precision ??= +match[1];
          prop.scale ??= +match[2];
          prop.length = undefined;
        }
      }

      if (mappedType instanceof DateTimeType) {
        const match = prop.columnTypes[idx].match(/\w+\((\d+)\)/);

        if (match) {
          prop.length ??= +match[1];
        } else {
          prop.length ??= this.platform.getDefaultDateTimeLength();
        }
      }

      const primary = !meta.compositePK && !!prop.primary && prop.kind === ReferenceKind.SCALAR && this.platform.isNumericColumn(mappedType);
      this.columns[field] = {
        name: prop.fieldNames[idx],
        type: prop.columnTypes[idx],
        generated: prop.generated as string,
        mappedType,
        unsigned: prop.unsigned && this.platform.isNumericColumn(mappedType),
        autoincrement: prop.autoincrement ?? primary,
        primary,
        nullable: this.columns[field]?.nullable ?? !!prop.nullable,
        nativeEnumName: prop.nativeEnumName,
        length: prop.length,
        precision: prop.precision,
        scale: prop.scale,
        default: prop.defaultRaw,
        enumItems: prop.nativeEnumName || prop.items?.every(Utils.isString) ? prop.items as string[] : undefined,
        comment: prop.comment,
        extra: prop.extra,
        ignoreSchemaChanges: prop.ignoreSchemaChanges,
      };
      this.columns[field].unsigned ||= this.columns[field].autoincrement;
      const defaultValue = this.platform.getSchemaHelper()!.normalizeDefaultValue(prop.defaultRaw!, prop.length);
      this.columns[field].default = defaultValue as string;
    });

    if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
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

      if (prop.deleteRule || cascade || prop.nullable) {
        this.foreignKeys[constraintName].deleteRule = prop.deleteRule || (cascade ? 'cascade' : 'set null');
      }

      if (prop.updateRule || prop.cascade.includes(Cascade.PERSIST) || prop.cascade.includes(Cascade.ALL)) {
        this.foreignKeys[constraintName].updateRule = prop.updateRule || 'cascade';
      }
    }

    if (prop.index) {
      this.indexes.push({
        columnNames: prop.fieldNames,
        composite: prop.fieldNames.length > 1,
        keyName: this.getIndexName(prop.index, prop.fieldNames, 'index'),
        constraint: false,
        primary: false,
        unique: false,
      });
    }

    if (prop.unique && !(prop.primary && !meta.compositePK)) {
      this.indexes.push({
        columnNames: prop.fieldNames,
        composite: prop.fieldNames.length > 1,
        keyName: this.getIndexName(prop.unique, prop.fieldNames, 'unique'),
        constraint: !prop.fieldNames.some((d: string) => d.includes('.')),
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

    const fks = Object.values(this.getForeignKeys());
    const fksOnColumnProps = new Map<string, ForeignKey>();
    const fksOnStandaloneProps = new Map<string, ForeignKey>();
    const columnFks: Record<string, ForeignKey[]> = {};
    for (const currentFk of fks) {
      if (currentFk.columnNames.length === 1 && !fks.some(fk => fk !== currentFk && fk.columnNames.length === 1 && currentFk.columnNames[0] === fk.columnNames[0])) {
        // Non-composite FK is the only possible one for a column. Render the column with it.
        const columnName = currentFk.columnNames[0];
        columnFks[columnName] ??= [];
        columnFks[columnName].push(currentFk);
        if (this.getColumn(columnName)?.nullable) {
          this.nullableForeignKeys.add(currentFk);
        }
        fksOnColumnProps.set(columnName, currentFk);
        continue;
      }

      const specificColumnNames: string[] = [];
      const nullableColumnsInFk = [];
      for (const columnName of currentFk.columnNames) {
        columnFks[columnName] ??= [];
        columnFks[columnName].push(currentFk);
        if (!fks.some(fk => fk !== currentFk && fk.columnNames.includes(columnName))) {
          specificColumnNames.push(columnName);
        }
        if (this.getColumn(columnName)?.nullable) {
          nullableColumnsInFk.push(columnName);
        }
      }
      if (nullableColumnsInFk.length > 0) {
        this.nullableForeignKeys.add(currentFk);
      }

      if (specificColumnNames.length === 1 && ((nullableColumnsInFk.length === currentFk.columnNames.length || nullableColumnsInFk.length === 0) || (nullableColumnsInFk.length === 1 && nullableColumnsInFk[0] === specificColumnNames[0]))) {
        // Composite FK has exactly one column which is not used in any other FK.
        // The FK also doesn't have a mix of nullable and non-nullable columns,
        // or its only nullable column is this very one.
        // It is safe to just render this FK attached to the specific column.
        const columnName = specificColumnNames[0];
        fksOnColumnProps.set(columnName, currentFk);
        continue;
      }

      if (specificColumnNames.length === currentFk.columnNames.length) {
        // All columns involved with this FK are only covered by this one FK.
        // It is safe to attach this FK to the first nullable column,
        // or if the FK has all non-nullable columns, attach it to the first column.
        const columnName = nullableColumnsInFk.at(0) ?? currentFk.columnNames[0];
        fksOnColumnProps.set(columnName, currentFk);
        continue;
      }

      if (!fks.some(fk => fk !== currentFk && fk.referencedTableName === currentFk.referencedTableName) && !this.getColumn(currentFk.referencedTableName)) {
        // Composite FK is the only one in this table that references this other table.
        // The name of the referenced table is not shared with a column in this table,
        // so it is safe to output prop name based on the referenced entity.
        fksOnStandaloneProps.set(currentFk.referencedTableName, currentFk);
        continue;
      }

      // Any ambiguous FK is rendered with a name based on the FK constraint name
      fksOnStandaloneProps.set(currentFk.constraintName, currentFk);
    }

    const columnsInFks = Object.keys(columnFks);
    for (const column of this.getColumns()) {
      // Skip columns if they are covered by foreign keys.
      // Do not skip if the column is not nullable, and yet all involved FKs are nullable.
      if (columnsInFks.includes(column.name) && !fksOnColumnProps.has(column.name) &&
        (column.nullable || columnFks[column.name].some(fk => !this.nullableForeignKeys.has(fk)))
      ) {
        continue;
      }
      const prop = this.getPropertyDeclaration(column, namingStrategy, schemaHelper, compositeFkIndexes, compositeFkUniques, fksOnColumnProps.get(column.name));
      schema.addProperty(prop.name, prop.type, prop);
    }

    for (const [propBaseName, currentFk] of fksOnStandaloneProps.entries()) {
      const prop = this.getForeignKeyDeclaration(currentFk, namingStrategy, schemaHelper, compositeFkIndexes, compositeFkUniques, propBaseName);
      schema.addProperty(prop.name, prop.type, prop);
    }

    const meta = schema.init().meta;
    const oneToOneCandidateProperties = meta.relations
      .filter(prop => prop.primary && prop.kind === ReferenceKind.MANY_TO_ONE);
    if (oneToOneCandidateProperties.length === 1 && oneToOneCandidateProperties[0].fieldNames.length === meta.primaryKeys.length) {
      oneToOneCandidateProperties[0].kind = ReferenceKind.ONE_TO_ONE;
    }

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

  private getForeignKeyDeclaration(
    fk: ForeignKey,
    namingStrategy: NamingStrategy,
    schemaHelper: SchemaHelper,
    compositeFkIndexes: Dictionary<{ keyName: string }>,
    compositeFkUniques: Dictionary<{ keyName: string }>,
    propNameBase: string,
  ) {
    const prop = namingStrategy.columnNameToProperty(propNameBase);
    const fkColumnsLength = fk.columnNames.length;
    const possibleIndexes = this.indexes.filter(index => {
      return index.columnNames.length >= fkColumnsLength && !fk.columnNames.some((columnName, i) => index.columnNames[i] !== columnName);
    });
    possibleIndexes.sort((a, b) => {
      if (a.primary !== b.primary) {
        return a.primary ? -1 : 1;
      }

      if (a.unique !== b.unique) {
        return a.unique ? -1 : 1;
      }

      if (a.columnNames.length !== b.columnNames.length) {
        return a.columnNames.length < b.columnNames.length ? -1 : 1;
      }

      return a.keyName.localeCompare(b.keyName);
    });
    const fkIndex = possibleIndexes[0];
    const kind = (fkIndex.unique && !fkIndex.primary) ? this.getReferenceKind(fk, fkIndex) : this.getReferenceKind(fk);
    const type = this.getPropertyTypeForForeignKey(namingStrategy, fk);

    const fkOptions: Partial<EntityProperty> = {};
    fkOptions.fieldNames = fk.columnNames;
    fkOptions.referencedTableName = fk.referencedTableName;
    fkOptions.referencedColumnNames = fk.referencedColumnNames;
    fkOptions.updateRule = fk.updateRule?.toLowerCase();
    fkOptions.deleteRule = fk.deleteRule?.toLowerCase();

    const columnOptions: Partial<EntityProperty> = {};
    if (fk.columnNames.length === 1) {
      const column = this.getColumn(fk.columnNames[0])!;
      columnOptions.default = this.getPropertyDefaultValue(schemaHelper, column, type);
      columnOptions.defaultRaw = this.getPropertyDefaultValue(schemaHelper, column, type, true);
      columnOptions.nullable = column.nullable;
      columnOptions.primary = column.primary;
      columnOptions.length = column.length;
      columnOptions.precision = column.precision;
      columnOptions.scale = column.scale;
      columnOptions.enum = !!column.enumItems?.length;
      columnOptions.items = column.enumItems;
    }

    return {
      name: prop,
      type,
      kind,
      ...columnOptions,
      nullable: this.nullableForeignKeys.has(fk),
      primary: fkIndex.primary || !fk.columnNames.some(columnName => !this.getPrimaryKey()?.columnNames.includes(columnName)),
      index: !fkIndex.unique ? fkIndex.keyName : undefined,
      unique: (fkIndex.unique && !fkIndex.primary) ? fkIndex.keyName : undefined,
      ...fkOptions,
    };
  }

  private getPropertyDeclaration(
    column: Column,
    namingStrategy: NamingStrategy,
    schemaHelper: SchemaHelper,
    compositeFkIndexes: Dictionary<{ keyName: string }>,
    compositeFkUniques: Dictionary<{ keyName: string }>,
    fk?: ForeignKey,
  ) {
    const prop = this.getPropertyName(namingStrategy, column);
    const index = compositeFkIndexes[prop] || this.indexes.find(idx => idx.columnNames[0] === column.name && !idx.composite && !idx.unique && !idx.primary);
    const unique = compositeFkUniques[prop] || this.indexes.find(idx => idx.columnNames[0] === column.name && !idx.composite && idx.unique && !idx.primary);

    const kind = this.getReferenceKind(fk, unique);
    const type = this.getPropertyTypeForColumn(namingStrategy, column, fk);
    const fkOptions: Partial<EntityProperty> = {};

    if (fk) {
      fkOptions.fieldNames = fk.columnNames;
      fkOptions.referencedTableName = fk.referencedTableName;
      fkOptions.referencedColumnNames = fk.referencedColumnNames;
      fkOptions.updateRule = fk.updateRule?.toLowerCase();
      fkOptions.deleteRule = fk.deleteRule?.toLowerCase();
    }

    return {
      name: prop,
      type,
      kind,
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

  private getReferenceKind(fk?: ForeignKey, unique?: { keyName: string }): ReferenceKind {
    if (fk && unique) {
      return ReferenceKind.ONE_TO_ONE;
    }

    if (fk) {
      return ReferenceKind.MANY_TO_ONE;
    }

    return ReferenceKind.SCALAR;
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

  private getPropertyTypeForForeignKey(namingStrategy: NamingStrategy, fk: ForeignKey): string {
    const parts = fk.referencedTableName.split('.', 2);
    return namingStrategy.getClassName(parts.length > 1 ? parts[1] : parts[0], '_');
  }

  private getPropertyTypeForColumn(namingStrategy: NamingStrategy, column: Column, fk?: ForeignKey): string {
    if (fk) {
      return this.getPropertyTypeForForeignKey(namingStrategy, fk);
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
    const properties = Utils.unique(Utils.flatten(Utils.asArray(index.properties).map(prop => {
      const root = prop.replace(/\..+$/, '');

      if (meta.properties[prop]) {
        if (meta.properties[prop].embeddedPath) {
          return [meta.properties[prop].embeddedPath!.join('.')];
        }

        return meta.properties[prop].fieldNames;
      }

      // json index, we need to rename the column only
      if (meta.properties[root]) {
        return [prop.replace(root, meta.properties[root].fieldNames[0])];
      }

      return [prop];
    })));

    if (properties.length === 0 && !index.expression) {
      return;
    }

    const name = this.getIndexName(index.name!, properties, type);
    this.indexes.push({
      keyName: name,
      columnNames: properties,
      composite: properties.length > 1,
      // JSON columns can have unique index but not unique constraint, and we need to distinguish those, so we can properly drop them
      constraint: type !== 'index' && !properties.some((d: string) => d.includes('.')),
      primary: type === 'primary',
      unique: type !== 'index',
      type: index.type,
      expression: index.expression,
      options: index.options,
    });
  }

  addCheck(check: CheckDef) {
    this.checks.push(check);
  }

  toJSON(): Dictionary {
    const { platform, columns, ...rest } = this;
    const columnsMapped = Utils.keys(columns).reduce((o, col) => {
      const { mappedType, ...restCol } = columns[col];
      o[col] = restCol;
      o[col].mappedType = Utils.keys(t).find(k => t[k] === mappedType.constructor);

      return o;
    }, {} as Dictionary);

    return { columns: columnsMapped, ...rest };
  }

}
