import type { AnyEntity, Configuration, ConnectionType, EntityDictionary, EntityProperty, FilterQuery, NativeInsertUpdateManyOptions, NativeInsertUpdateOptions, QueryResult, Transaction } from '@mikro-orm/core';
import { QueryFlag, Utils } from '@mikro-orm/core';
import type { Knex, QueryBuilder } from '@mikro-orm/knex';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { MsSqlConnection } from './MsSqlConnection';
import { MsSqlPlatform } from './MsSqlPlatform';
import { MsSqlQueryBuilder } from './MsSqlQueryBuilder';

export class MsSqlDriver extends AbstractSqlDriver<MsSqlConnection> {

  constructor(config: Configuration) {
    super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'mssql']);
  }

  protected getPrimaryKeyFields(entityName: string): string[] {
    const meta = this.metadata.find(entityName);
    if (meta?.pivotTable) {
      const pks = Utils.flatten(Object.values(meta.properties).filter(({ primary }) => primary).map(({ fieldNames }) => fieldNames));
      return pks;
    }
    return meta ? Utils.flatten(meta.getPrimaryProps().map(pk => pk.fieldNames)) : [this.config.getNamingStrategy().referenceColumnName()];
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    return super.nativeInsert(entityName, data, options);
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.get<T>(entityName);
    const set = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => set.add(k)));
    const props = [...set].map(name => meta.properties[name] ?? { name, fieldNames: [name] }) as EntityProperty<T>[];
    const fields = Utils.flatten(props.map(prop => prop.fieldNames));
    const hasFields = fields.length > 0;

    // Is this en empty insert... this is rather hard in mssql (especially with an insert many)
    if (!hasFields) {
      const returningProps = meta!.props.filter(prop => prop.primary || prop.defaultRaw);
      const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
      const tableName = this.getTableName(meta, options);
      const using = `SELECT *  FROM (VALUES ${data.map((x, i) => `(${i})`).join(',')}) v (id) WHERE 1 = 1`;
      const output = returningFields.length > 0 ? `output ${returningFields.map(field => 'inserted.' + this.platform.quoteIdentifier(field)).join(', ')}` : '';
      const sql = `merge into ${tableName} using (${using}) s on 1 = 0 when not matched then insert default values ${output};`;

      const res = await this.execute<QueryResult<T>>(sql, [], 'run', options.ctx);

      const collections = options.processCollections ? data.map(d => this.extractManyToMany(entityName, d)) : [];
      const pks = this.getPrimaryKeyFields(entityName);
      let pk: any[];

      /* istanbul ignore next */
      if (pks.length > 1) { // owner has composite pk
        pk = data.map(d => Utils.getPrimaryKeyCond(d as T, pks));
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

    return super.nativeInsertMany(entityName, data, options);
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    return super.nativeUpdate(entityName, where, data, options);
  }

  createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<Knex.Transaction>, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean): QueryBuilder<T> {
    const connectionType = this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new MsSqlQueryBuilder<T>(entityName, this.metadata, this, ctx, undefined, connectionType);

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

}
