import {
  AbstractSqlPlatform,
  type Dictionary,
  type EntityMetadata,
  type IDatabaseDriver,
  type EntityManager,
  type MikroORM,
  JsonProperty,
  raw,
  Type,
  Utils,
  ALIAS_REPLACEMENT,
  type Primary,
  type IPrimaryKey,
  type SimpleColumnMeta,
} from '@mikro-orm/knex';
// @ts-expect-error no types available
import SqlString from 'tsqlstring';
import { MsSqlSchemaHelper } from './MsSqlSchemaHelper';
import { MsSqlExceptionConverter } from './MsSqlExceptionConverter';
import { MsSqlSchemaGenerator } from './MsSqlSchemaGenerator';
import { UnicodeString, UnicodeStringType } from './UnicodeStringType';

export class MsSqlPlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: MsSqlSchemaHelper = new MsSqlSchemaHelper(this);
  protected override readonly exceptionConverter = new MsSqlExceptionConverter();

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    MsSqlSchemaGenerator.register(orm);
  }

  override usesOutputStatement(): boolean {
    return true;
  }

  override convertDateToJSValue(value: string | Date): string {
    /* istanbul ignore next */
    if (typeof value === 'string') {
      return value;
    }

    return value.toISOString().substring(0, 10);
  }

  override convertsJsonAutomatically(): boolean {
    return false;
  }

  override indexForeignKeys() {
    return false;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    return 'datetime2' + (column.length != null ? `(${column.length})` : '');
  }

  override getTimeTypeDeclarationSQL(): string {
    return 'time';
  }

  override getFloatDeclarationSQL(): string {
    return 'float(24)';
  }

  override getDoubleDeclarationSQL(): string {
    return 'float(53)';
  }

  override getBooleanTypeDeclarationSQL(): string {
    return 'bit';
  }

  override getFullTextIndexExpression(indexName: string, schemaName: string | undefined, tableName: string, columns: SimpleColumnMeta[]): string {
    /* istanbul ignore next */
    const quotedTableName = this.quoteIdentifier(schemaName ? `${schemaName}.${tableName}` : tableName);
    const quotedColumnNames = columns.map(c => this.quoteIdentifier(c.name));
    const quotedIndexName = this.quoteIdentifier(indexName);

    if (columns.length === 1 && columns[0].type === 'tsvector') {
      return `create index ${quotedIndexName} on ${quotedTableName} using gin(${quotedColumnNames[0]})`;
    }

    return `create index ${quotedIndexName} on ${quotedTableName} using gin(to_tsvector('simple', ${quotedColumnNames.join(` || ' ' || `)}))`;
  }

  override getRegExpOperator(): string {
    throw new Error('Not supported');
  }

  override getBlobDeclarationSQL(): string {
    return 'varbinary(max)';
  }

  override getJsonDeclarationSQL(): string {
    return 'nvarchar(max)';
  }

  override getEnumTypeDeclarationSQL(column: { fieldNames: string[]; items?: unknown[]; length?: number }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return this.getVarcharTypeDeclarationSQL({ length: 100, ...column });
    }

    /* istanbul ignore next */
    return this.getSmallIntTypeDeclarationSQL(column);
  }

  override getDefaultMappedType(type: string): Type<unknown> {
    const normalizedType = this.extractSimpleType(type);

    if (normalizedType === 'string' || normalizedType === 'nvarchar') {
      return Type.getType(UnicodeStringType);
    }

    const map = {
      int: 'integer',
      bit: 'boolean',
      real: 'float',
      uniqueidentifier: 'uuid',
      varbinary: 'blob',
      datetime2: 'datetime',
    } as Dictionary;

    return super.getDefaultMappedType(map[normalizedType] ?? type);
  }

  override getDefaultSchemaName(): string | undefined {
    return 'dbo';
  }

  override getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    return `nvarchar(${column.length ?? 255})`;
  }

  override getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return 'uniqueidentifier';
  }

  override validateMetadata(meta: EntityMetadata): void {
    for (const prop of meta.props) {
      if (
        (prop.runtimeType === 'string' || ['string', 'nvarchar'].includes(prop.type))
        && !prop.columnTypes[0].startsWith('varchar')
      ) {
        prop.customType ??= new UnicodeStringType();
        prop.customType.prop = prop;
        prop.customType.platform = this;
        prop.customType.meta = meta;
      }
    }

    return;
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    const [a, ...b] = path;
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${a}` : a);
    const types = {
      boolean: 'bit',
    } as Dictionary;
    const cast = (key: string) => raw(type in types ? `cast(${key} as ${types[type]})` : key);
    const quoteKey = (key: string) => key.match(/^[a-z]\w*$/i) ? key : `"${key}"`;

    if (path.length === 0) {
      return cast(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
    }

    return cast(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | string): T {
    if (data instanceof UnicodeString) {
      return data.value as T;
    }

    return data as T;
  }

  override supportsMultipleCascadePaths(): boolean {
    return false;
  }

  override supportsMultipleStatements(): boolean {
    return true;
  }

  override quoteIdentifier(id: string): string {
    return `[${id.replace('.', `].[`)}]`;
  }

  override quoteValue(value: any): string {
    if (Utils.isRawSql(value)) {
      return this.formatQuery(value.sql, value.params ?? []);
    }

    if (this.isRaw(value)) {
      return value;
    }

    if (value instanceof UnicodeString) {
      return `N${SqlString.escape(value.value)}`;
    }

    /* istanbul ignore if */
    if (Utils.isPlainObject(value) || value?.[JsonProperty]) {
      return SqlString.escape(JSON.stringify(value), true, this.timezone);
    }

    if (value instanceof Buffer) {
      return `0x${value.toString('hex')}`;
    }

    if (value instanceof Date) {
      return SqlString.dateToString(value.toISOString(), 'Z');
    }

    return SqlString.escape(value);
  }

  /* istanbul ignore next: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): MsSqlSchemaGenerator {
    return new MsSqlSchemaGenerator(em ?? driver as any);
  }

}
