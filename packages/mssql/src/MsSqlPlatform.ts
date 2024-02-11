import {
  AbstractSqlPlatform,
  type Dictionary,
  type EntityMetadata,
  type IDatabaseDriver,
  type EntityManager,
  type MikroORM,
  type IndexDef,
  JsonProperty,
  raw,
  Type,
  Utils,
  ALIAS_REPLACEMENT,
  type Primary,
  type IPrimaryKey,
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
    if (typeof value === 'string') {
      return value;
    }

    return value.toISOString().substring(0, 10);
  }

  override convertsJsonAutomatically(): boolean {
    return false;
  }

  override getCurrentTimestampSQL(length: number): string {
    return `current_timestamp`;
  }

  override getTimeTypeDeclarationSQL(): string {
    return 'time';
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

  override getDefaultMappedType(type: string): Type<unknown> {
    if (type === 'string') {
      return Type.getType(UnicodeStringType);
    }

    return super.getDefaultMappedType(type);
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

  override getJsonIndexDefinition(index: IndexDef): string[] {
    return index.columnNames
      .map(column => {
        const [root, ...path] = column.split('.');
        return `json_value(${root}, '$.${path.join('.')}')`;
      });
  }

  override normalizePrimaryKey<T extends number | string = number | string>(data: Primary<T> | IPrimaryKey | string): T {
    if (data instanceof UnicodeString) {
      return data.value as T;
    }

    return data as T;
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
