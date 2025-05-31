import {
  AbstractSqlPlatform,
  type Dictionary,
  type IDatabaseDriver,
  type EntityManager,
  type MikroORM,
  raw,
  Type,
  ALIAS_REPLACEMENT,
  DoubleType,
  FloatType,
  QueryOrder,
  OracleNativeQueryBuilder,
} from '@mikro-orm/knex';
import { OracleSchemaHelper } from './OracleSchemaHelper.js';
import { OracleExceptionConverter } from './OracleExceptionConverter.js';
import { OracleSchemaGenerator } from './OracleSchemaGenerator.js';

export class OraclePlatform extends AbstractSqlPlatform {

  protected override readonly schemaHelper: OracleSchemaHelper = new OracleSchemaHelper(this);
  protected override readonly exceptionConverter = new OracleExceptionConverter();

  /** @inheritDoc */
  override lookupExtensions(orm: MikroORM): void {
    OracleSchemaGenerator.register(orm);
  }

  override getRollbackToSavepointSQL(savepointName: string): string {
    return `rollback transaction ${this.quoteIdentifier(savepointName)}`;
  }

  override getSavepointSQL(savepointName: string): string {
    return `save transaction ${this.quoteIdentifier(savepointName)}`;
  }

  /** @internal */
  override createNativeQueryBuilder(): OracleNativeQueryBuilder {
    return new OracleNativeQueryBuilder(this);
  }

  override usesOutputStatement(): boolean {
    return true;
  }

  // FIXME
  // override convertDateToJSValue(value: string | Date): string {
  //   /* v8 ignore next 3 */
  //   if (typeof value === 'string') {
  //     return value;
  //   }
  //
  //   return SqlString.dateToString(value.toISOString(), this.timezone ?? 'local').substring(1, 11);
  // }

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
    /* v8 ignore next */
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

  // FIXME
  // override getEnumTypeDeclarationSQL(column: { items?: unknown[]; fieldNames: string[]; length?: number; unsigned?: boolean; autoincrement?: boolean }): string {
  //   if (column.items?.every(item => Utils.isString(item))) {
  //     return Type.getType(UnicodeStringType).getColumnType({ length: 100, ...column }, this);
  //   }
  //
  //   /* v8 ignore next */
  //   return this.getSmallIntTypeDeclarationSQL(column);
  // }

  override normalizeColumnType(type: string, options: { length?: number; precision?: number; scale?: number }): string {
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

    // if (normalizedType !== 'uuid' && ['string', 'nvarchar'].includes(normalizedType)) {
    //   return Type.getType(UnicodeStringType);
    // }
    //
    // if (['character', 'nchar'].includes(normalizedType)) {
    //   return Type.getType(UnicodeCharacterType);
    // }

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

  // override validateMetadata(meta: EntityMetadata): void {
  //   for (const prop of meta.props) {
  //     if (
  //       (prop.runtimeType === 'string' || ['string', 'nvarchar'].includes(prop.type))
  //       && !['uuid'].includes(prop.type)
  //       && !prop.columnTypes[0].startsWith('varchar')
  //     ) {
  //       prop.customType ??= new UnicodeStringType();
  //       prop.customType.prop = prop;
  //       prop.customType.platform = this;
  //       prop.customType.meta = meta;
  //     }
  //   }
  // }

  override getSearchJsonPropertyKey(path: string[], type: string, aliased: boolean, value?: unknown): string {
    const [a, ...b] = path;
    /* v8 ignore next */
    const root = this.quoteIdentifier(aliased ? `${ALIAS_REPLACEMENT}.${a}` : a);
    const types = {
      boolean: 'bit',
    } as Dictionary;
    const cast = (key: string) => raw(type in types ? `cast(${key} as ${types[type]})` : key);
    const quoteKey = (key: string) => key.match(/^[a-z]\w*$/i) ? key : `"${key}"`;

    /* v8 ignore next 3 */
    if (path.length === 0) {
      return cast(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
    }

    return cast(`json_value(${root}, '$.${b.map(quoteKey).join('.')}')`);
  }

  // override normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | string): T {
  //   /* v8 ignore next 3 */
  //   if (data instanceof UnicodeString) {
  //     return data.value as T;
  //   }
  //
  //   return data as T;
  // }

  override usesEnumCheckConstraints(): boolean {
    return true;
  }

  override supportsMultipleCascadePaths(): boolean {
    return false;
  }

  override supportsMultipleStatements(): boolean {
    return true;
  }

  override quoteIdentifier(id: string): string {
    return super.quoteIdentifier(id, '"');
  }

  // FIXME
  // override escape(value: any): string {
  //   if (value instanceof UnicodeString) {
  //     return `N${SqlString.escape(value.value)}`;
  //   }
  //
  //   if (value instanceof Buffer) {
  //     return `0x${value.toString('hex')}`;
  //   }
  //
  //   if (value instanceof Date) {
  //     return SqlString.dateToString(value.toISOString(), this.timezone ?? 'local');
  //   }
  //
  //   return SqlString.escape(value);
  // }

  /* v8 ignore next 3: kept for type inference only */
  override getSchemaGenerator(driver: IDatabaseDriver, em?: EntityManager): OracleSchemaGenerator {
    return new OracleSchemaGenerator(em ?? driver as any);
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

  override getDefaultClientUrl(): string {
    return 'localhost:1521/FREEDPDB1';
  }

}
