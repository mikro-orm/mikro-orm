import {
  type AnyEntity,
  type Configuration,
  type ConnectionType,
  type Dictionary,
  type EntityDictionary,
  type EntityKey,
  type EntityName,
  type FilterQuery,
  isRaw,
  type LoggingOptions,
  type NativeInsertUpdateManyOptions,
  QueryFlag,
  type QueryResult,
  type RequiredEntityData,
  type Transaction,
  type UpsertManyOptions,
  Utils,
} from '@mikro-orm/core';
import { AbstractSqlDriver, type SqlEntityManager } from '@mikro-orm/knex';
import { OracleConnection } from './OracleConnection.js';
import { OracleQueryBuilder } from './OracleQueryBuilder.js';
import { OraclePlatform } from './OraclePlatform.js';

export class OracleDriver extends AbstractSqlDriver<OracleConnection, OraclePlatform> {

  constructor(config: Configuration) {
    super(config, new OraclePlatform(), OracleConnection, ['kysely', 'oracledb']);
  }

  override createQueryBuilder<T extends AnyEntity<T>>(entityName: EntityName<T>, ctx?: Transaction, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean, loggerContext?: LoggingOptions, alias?: string, em?: SqlEntityManager): OracleQueryBuilder<T, any, any, any> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em ? preferredConnectionType : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new OracleQueryBuilder<T, any, any, any>(entityName, this.metadata, this, ctx, alias, connectionType, em, loggerContext);

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

  override async nativeInsertMany<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}, transform?: (sql: string) => string): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get<T>(entityName);
    const pks = this.getPrimaryKeyFields(entityName) as EntityKey<T>[];
    const collections = options.processCollections ? data.map(d => this.extractManyToMany(entityName, d)) : [];
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes).withSchema(this.getSchemaName(meta, options));
    qb.insert(data as RequiredEntityData<T>[]);

    const res = await this.rethrow(qb.execute('run'));
    let pk: any[];

    /* v8 ignore next 3 */
    if (pks.length > 1) { // owner has composite pk
      pk = data.map(d => Utils.getPrimaryKeyCond(d as T, pks));
    } else {
      res.row ??= {};
      res.rows ??= [];
      pk = data.map((d, i) => d[pks[0]] ?? res.rows![i]?.[pks[0]]).map(d => [d]);
      res.insertId = res.insertId || res.row![pks[0]];
    }

    await this.processManyToMany<T>(meta, pk, collections, false, options);

    return res;
  }

  override async nativeUpdateMany<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> & UpsertManyOptions<T> = {}): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);
    const meta = this.metadata.get<T>(entityName);
    const returning = new Set<EntityKey<T>>();
    const into: string[] = [];
    const outBindings: Dictionary = {};
    Object.defineProperty(outBindings, '__outBindings', { value: true, writable: true, configurable: true, enumerable: false });

    for (const row of data) {
      for (const k of Utils.keys(row)) {
        if (isRaw(row[k])) {
          returning.add(k);
        }
      }
    }

    // reload generated columns and version fields
    meta.props
      .filter(prop => prop.generated || prop.version || prop.primary)
      .forEach(prop => returning.add(prop.name));

    for (const propName of returning) {
      const prop = meta.properties[propName];
      into.push(`:out_${prop.fieldNames[0]}`);
      outBindings[`out_${prop.fieldNames[0]}`] = {
        dir: this.platform.mapToOracleType('out'),
        type: this.platform.mapToOracleType(prop.runtimeType),
      };
    }

    return super.nativeUpdateMany(entityName, where, data, options, (sql, params) => {
      if (into.length === 0) {
        return sql;
      }

      params.push(outBindings);

      return `${sql} into ${into.join(', ')}`;
    });
  }

}
