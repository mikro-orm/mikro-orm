import {
  AbstractSqlPlatform,
  type Dictionary,
  type EntityMetadata,
  type IDatabaseDriver,
  type EntityManager,
  type MikroORM,
  raw,
  Type,
  Utils,
  ALIAS_REPLACEMENT,
  type Primary,
  type IPrimaryKey,
  DoubleType,
  FloatType,
  QueryOrder,
} from '@mikro-orm/knex';
// @ts-expect-error no types available
import SqlString from 'tsqlstring';
import { MsSqlSchemaHelper } from './MsSqlSchemaHelper';
import { MsSqlExceptionConverter } from './MsSqlExceptionConverter';
import { MsSqlSchemaGenerator } from './MsSqlSchemaGenerator';
import { UnicodeCharacterType } from './UnicodeCharacterType';
import { UnicodeString, UnicodeStringType } from './UnicodeStringType';

export class MsSqlPlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: MsSqlSchemaHelper = new MsSqlSchemaHelper(this);
  protected override readonly exceptionConverter = new MsSqlExceptionConverter();

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    MsSqlSchemaGenerator.register(orm);
  }

  /** @inheritDoc */
  override init(orm: MikroORM): void {
    super.init(orm);
    // do not double escape backslash inside strings
    SqlString.CHARS_GLOBAL_REGEXP = /[']/g;
  }

  override getRollbackToSavepointSQL(savepointName: string): string {
    return `rollback transaction ${this.quoteIdentifier(savepointName)}`;
  }

  override getSavepointSQL(savepointName: string): string {
    return `save transaction ${this.quoteIdentifier(savepointName)}`;
  }

  override usesOutputStatement(): boolean {
    return true;
  }

  override convertDateToJSValue(value: string | Date): string {
    /* istanbul ignore next */
    if (typeof value === 'string') {
      return value;
    }

    return SqlString.dateToString(value.toISOString(), this.timezone ?? 'local').substring(1, 11);
  }

  override convertsJsonAutomatically(): boolean {
    return false;
  }

  override indexForeignKeys() {
    return false;
  }

  override supportsSchemas(): boolean {
    return true;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp`;
  }

  override getDateTimeTypeDeclarationSQL(column: { length?: number }): string {
    /* istanbul ignore next */
    return 'datetime2' + (column.length != null ? `(${column.length})` : '');
  }

  override getDefaultDateTimeLength(): number {
    return 7;
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

  override getRegExpOperator(): string {
    throw new Error('Not supported');
  }

  override getBlobDeclarationSQL(): string {
    return 'varbinary(max)';
  }

  override getJsonDeclarationSQL(): string {
    return 'nvarchar(max)';
  }

  override getVarcharTypeDeclarationSQL(column: { length?: number }): string {
    if (column.length === -1) {
      return 'varchar(max)';
    }

    return super.getVarcharTypeDeclarationSQL(column);
  }

  override getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
    if (column.items?.every(item => Utils.isString(item))) {
      return Type.getType(UnicodeStringType).getColumnType({ length: 100, ...column }, this);
    }

    /* istanbul ignore next */
    return this.getSmallIntTypeDeclarationSQL(column);
  }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number } = {}): string {
    const simpleType = this.extractSimpleType(type);

    if (['decimal', 'numeric'].includes(simpleType)) {
      return this.getDecimalTypeDeclarationSQL(options);
    }

    if (['real'].includes(simpleType)) {
      return this.getFloatDeclarationSQL();
    }

    return super.normalizeColumnType(type, options);
  }

  override getDefaultMappedType(type: string): Type<unknown> {
    if (type.startsWith('float')) {
      const len = type.match(/float\((\d+)\)/)?.[1] ?? 24;
      return +len > 24 ? Type.getType(DoubleType) : Type.getType(FloatType);
    }

    const normalizedType = this.extractSimpleType(type);

    if (normalizedType !== 'uuid' && ['string', 'nvarchar'].includes(normalizedType)) {
      return Type.getType(UnicodeStringType);
    }

    if (['character', 'nchar'].includes(normalizedType)) {
      return Type.getType(UnicodeCharacterType);
    }

    const map = {
      int: 'integer',
      bit: 'boolean',
      real: 'float',
      uniqueidentifier: 'uuid',
      varbinary: 'blob',
      datetime2: 'datetime',
      smalldatetime: 'datetime',
    } as Dictionary;

    return super.getDefaultMappedType(map[normalizedType] ?? type);
  }

  override getDefaultSchemaName(): string | undefined {
    return 'dbo';
  }

  override getUuidTypeDeclarationSQL(column: { length?: number }): string {
    return 'uniqueidentifier';
  }

  override validateMetadata(meta: EntityMetadata): void {
    for (const prop of meta.props) {
      if (
        (prop.runtimeType === 'string' || ['string', 'nvarchar'].includes(prop.type))
        && !['uuid'].includes(prop.type)
        && !prop.columnTypes[0].startsWith('varchar')
      ) {
        prop.customType ??= new UnicodeStringType();
        prop.customType.prop = prop;
        prop.customType.platform = this;
        prop.customType.meta = meta;
      }
    }
  }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    const [a, ...b] = path;
    /* istanbul ignore next */
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${a}` : a);
    const types = {
      boolean: 'bit',
    } as Dictionary;
    const cast = (key: string) => raw(type in types ? `cast(${key} as ${types[type]})` : key);
    const quoteKey = (key: string) => key.match(/^[a-z]\w*$/i) ? key : `"${key}"`;

    /* istanbul ignore if */
    if (path.length === 0) {
      return cast(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
    }

    return cast(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
  }

  override normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | string): T {
    /* istanbul ignore if */
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

  override quoteIdentifier(id: string | { toString: () => string }): string {
    return `[${id.toString().replace('.', `].[`)}]`;
  }

  override escape(value: any): string {
    if (value instanceof UnicodeString) {
      return `N${SqlString.escape(value.value)}`;
    }

    if (value instanceof Buffer) {
      return `0x${value.toString('hex')}`;
    }

    if (value instanceof Date) {
      return SqlString.dateToString(value.toISOString(), this.timezone ?? 'local');
    }

    return SqlString.escape(value);
  }

  /* istanbul ignore next: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): MsSqlSchemaGenerator {
    return new MsSqlSchemaGenerator(em ?? driver as any);
  }

  override allowsComparingTuples() {
    return false;
  }

  override getOrderByExpression(column: string, direction: QueryOrder): string[] {
    switch (direction.toUpperCase()) {
      case QueryOrder.ASC_NULLS_FIRST:
        return [`case when ${column} is null then 0 else 1 end, ${column} asc`];
      case QueryOrder.ASC_NULLS_LAST:
        return [`case when ${column} is null then 1 else 0 end, ${column} asc`];
      case QueryOrder.DESC_NULLS_FIRST:
        return [`case when ${column} is null then 0 else 1 end, ${column} desc`];
      case QueryOrder.DESC_NULLS_LAST:
        return [`case when ${column} is null then 1 else 0 end, ${column} desc`];
      default:
        return [`${column} ${direction.toLowerCase()}`];
    }
  }

}
