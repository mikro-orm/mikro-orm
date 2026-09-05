import {
  type AnyEntity,
  type Configuration,
  type ConnectionType,
  type Constructor,
  type Dictionary,
  type EntityDictionary,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type FilterQuery,
  isRaw,
  type LoggingOptions,
  type NativeInsertUpdateManyOptions,
  type Primary,
  QueryFlag,
  type QueryResult,
  ReferenceKind,
  type RequiredEntityData,
  type Transaction,
  type UpsertManyOptions,
  Utils,
} from '@mikro-orm/core';
import { AbstractSqlDriver, type SqlEntityManager } from '@mikro-orm/sql';
import { OracleConnection } from './OracleConnection.js';
import { OracleMikroORM } from './OracleMikroORM.js';
import { OracleQueryBuilder } from './OracleQueryBuilder.js';
import { OraclePlatform } from './OraclePlatform.js';

/** Database driver for Oracle. */
export class OracleDriver extends AbstractSqlDriver<OracleConnection, OraclePlatform> {
  constructor(config: Configuration) {
    super(config, new OraclePlatform(), OracleConnection, ['kysely', 'oracledb']);
  }

  override createQueryBuilder<T extends AnyEntity<T>>(
    entityName: EntityName<T>,
    ctx?: Transaction,
    preferredConnectionType?: ConnectionType,
    convertCustomTypes?: boolean,
    loggerContext?: LoggingOptions,
    alias?: string,
    em?: SqlEntityManager,
  ): OracleQueryBuilder<T, any, any, any> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em
      ? preferredConnectionType
      : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new OracleQueryBuilder<T, any, any, any>(
      entityName,
      this.metadata,
      this,
      ctx,
      alias,
      connectionType,
      em,
      loggerContext,
    );

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

  override async nativeInsertMany<T extends object>(
    entityName: EntityName<T>,
    data: EntityDictionary<T>[],
    options: NativeInsertUpdateManyOptions<T> = {},
  ): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get<T>(entityName);
    const pks = this.getPrimaryKeyFields(meta) as EntityKey<T>[];
    const collections = options.processCollections ? data.map(d => this.extractManyToMany(meta, d)) : [];
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes).withSchema(
      this.getSchemaName(meta, options),
    );
    qb.insert(data as RequiredEntityData<T>[]);

    const res = await this.rethrow(qb.execute('run'));
    let pk: any[];

    if (pks.length > 1) {
      // owner has composite pk
      pk = data.map(d => Utils.getOrderedPrimaryKeys(d as Record<string, Primary<T>>, meta));
    } else {
      res.row ??= {};
      res.rows ??= [];
      pk = data.map((d, i) => d[pks[0]] ?? res.rows![i]?.[pks[0]]).map(d => [d]);
      res.insertId = res.insertId || res.row![pks[0]];
    }

    for (let i = 0; i < collections.length; i++) {
      await this.processManyToMany<T>(meta, pk[i], collections[i], false, options);
    }

    return res;
  }

  override async nativeUpdateMany<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>[],
    data: EntityDictionary<T>[],
    options: NativeInsertUpdateManyOptions<T> & UpsertManyOptions<T> = {},
  ): Promise<QueryResult<T>> {
    const meta = this.metadata.get<T>(entityName);
    const returning = new Set<EntityKey<T>>();
    const into: string[] = [];
    const outBindingsMap: Dictionary<string> = {};

    for (const row of data) {
      for (const k of Utils.keys(row)) {
        if (isRaw(row[k])) {
          returning.add(k);
        }
      }
    }

    // reload generated columns and version fields
    meta.props.filter(prop => prop.generated || prop.version || prop.primary).forEach(prop => returning.add(prop.name));

    for (const propName of returning) {
      const prop = meta.properties[propName];
      // the parent builds the `returning` list from all field names, so every column needs its own OUT bind
      const runtimeTypes = this.getOutBindTypes(prop);

      prop.fieldNames.forEach((fieldName, idx) => {
        into.push(`:out_${fieldName}`);
        outBindingsMap[`out_${fieldName}`] = runtimeTypes[idx];
      });
    }

    const outBindings = this.platform.createOutBindings(outBindingsMap);

    return super.nativeUpdateMany(entityName, where, data, options, (sql, params) => {
      /* v8 ignore next 2: defensive guard — PKs are always added to `returning` above */
      if (into.length === 0) {
        return sql;
      }

      params.push(outBindings);

      return `${sql} into ${into.join(', ')}`;
    });
  }

  /**
   * Resolves the runtime type of every column a property maps to, aligned with its `fieldNames`.
   * A relation covers one column per target PK column, and a target PK can be a relation itself,
   * so we recurse down to the scalar leaves - `prop.runtimeType` is `unknown` for relations.
   */
  private getOutBindTypes(prop: EntityProperty): string[] {
    if (!prop.targetMeta || ![ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
      return prop.fieldNames.map(() => prop.runtimeType);
    }

    const types = prop.referencedPKs.flatMap(pk => this.getOutBindTypes(prop.targetMeta!.properties[pk]));

    // `fieldNames` of a polymorphic relation start with the discriminator column
    return prop.polymorphic ? ['string', ...types] : types;
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<OracleMikroORM> {
    return OracleMikroORM;
  }
}
