import type { Knex } from 'knex';
import type { AnyEntity, Collection, ConnectionType, Configuration, Constructor, CountOptions, DeleteOptions, Dictionary,
  DriverMethodOptions, EntityData, EntityDictionary, EntityField, EntityManager, EntityMetadata, EntityProperty, FilterQuery,
  FindOneOptions, FindOptions, IDatabaseDriver, LockOptions, NativeInsertUpdateManyOptions, NativeInsertUpdateOptions,
  PopulateOptions, Primary, QueryOrderMap, QueryResult, RequiredEntityData, Transaction } from '@mikro-orm/core';
import { DatabaseDriver, EntityManagerType, LoadStrategy, QueryFlag, ReferenceType, Utils } from '@mikro-orm/core';
import type { AbstractSqlConnection } from './AbstractSqlConnection';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform';
import { QueryBuilder } from './query/QueryBuilder';
import { SqlEntityManager } from './SqlEntityManager';
import type { Field } from './typings';

export abstract class AbstractSqlDriver<C extends AbstractSqlConnection = AbstractSqlConnection> extends DatabaseDriver<C> {

  [EntityManagerType]: SqlEntityManager<this>;

  protected readonly connection: C;
  protected readonly replicas: C[] = [];
  protected readonly platform: AbstractSqlPlatform;

  protected constructor(config: Configuration, platform: AbstractSqlPlatform, connection: Constructor<C>, connector: string[]) {
    super(config, connector);
    this.connection = new connection(this.config);
    this.replicas = this.createReplicas(conf => new connection(this.config, conf, 'read'));
    this.platform = platform;
  }

  getPlatform(): AbstractSqlPlatform {
    return this.platform;
  }

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new SqlEntityManager(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  async find<T, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<EntityData<T>[]> {
    options = { populate: [], orderBy: [], ...options };
    const meta = this.metadata.find<T>(entityName)!;
    const populate = this.autoJoinOneToOneOwner(meta, options.populate as unknown as PopulateOptions<T>[], options.fields);
    const joinedProps = this.joinedProps(meta, populate);
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, options.connectionType, false);
    const fields = this.buildFields(meta, populate, joinedProps, qb, options.fields as Field<T>[]);
    const joinedPropsOrderBy = this.buildJoinedPropsOrderBy(entityName, qb, meta, joinedProps);

    if (Utils.isPrimaryKey(where, meta.compositePK)) {
      where = { [Utils.getPrimaryKeyHash(meta.primaryKeys)]: where } as FilterQuery<T>;
    }

    qb.select(fields)
      .populate(populate)
      .where(where)
      .orderBy([...Utils.asArray(options.orderBy), ...joinedPropsOrderBy])
      .groupBy(options.groupBy!)
      .having(options.having!)
      .withSchema(this.getSchemaName(meta, options));

    if (options.limit !== undefined) {
      qb.limit(options.limit, options.offset);
    }

    if (options.lockMode) {
      qb.setLockMode(options.lockMode, options.lockTableAliases);
    }

    Utils.asArray(options.flags).forEach(flag => qb.setFlag(flag));
    const result = await this.rethrow(qb.execute('all'));

    if (joinedProps.length > 0) {
      return this.mergeJoinedResult(result, meta);
    }

    return result;
  }

  async findOne<T, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<EntityData<T> | null> {
    const opts = { populate: [], ...(options || {}) } as FindOptions<T>;
    const meta = this.metadata.find(entityName)!;
    const populate = this.autoJoinOneToOneOwner(meta, opts.populate as unknown as PopulateOptions<T>[], opts.fields);
    const joinedProps = this.joinedProps(meta, populate);

    if (joinedProps.length === 0) {
      opts.limit = 1;
    }

    if (opts.limit! > 0 && !opts.flags?.includes(QueryFlag.DISABLE_PAGINATE)) {
      opts.flags ??= [];
      opts.flags.push(QueryFlag.DISABLE_PAGINATE);
    }

    const res = await this.find<T>(entityName, where, opts);

    return res[0] || null;
  }

  mapResult<T>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[] = [], qb?: QueryBuilder<T>, map: Dictionary = {}): EntityData<T> | null {
    const ret = super.mapResult(result, meta);

    /* istanbul ignore if */
    if (!ret) {
      return null;
    }

    if (qb) {
      this.mapJoinedProps<T>(ret, meta, populate, qb, ret, map);
    }

    return ret;
  }

  private mapJoinedProps<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], qb: QueryBuilder<T>, root: EntityData<T>, map: Dictionary, parentJoinPath?: string) {
    const joinedProps = this.joinedProps(meta, populate);

    joinedProps.forEach(p => {
      const relation = meta.properties[p.field];

      /* istanbul ignore next */
      if (!relation) {
        return;
      }

      const meta2 = this.metadata.find(relation.type)!;
      const path = parentJoinPath ? `${parentJoinPath}.${relation.name}` : `${meta.name}.${relation.name}`;
      const relationAlias = qb.getAliasForJoinPath(path);
      const relationPojo: EntityData<unknown> = {};

      // If the primary key value for the relation is null, we know we haven't joined to anything
      // and therefore we don't return any record (since all values would be null)
      const hasPK = meta2.primaryKeys.every(pk => meta2.properties[pk].fieldNames.every(name => {
        return root![`${relationAlias}__${name}`] != null;
      }));

      if (!hasPK) {
        // initialize empty collections
        if ([ReferenceType.MANY_TO_MANY, ReferenceType.ONE_TO_MANY].includes(relation.reference)) {
          result[relation.name] = result[relation.name] || [] as unknown as T[keyof T & string];
        }

        return;
      }

      meta2.props
        .filter(prop => this.platform.shouldHaveColumn(prop, p.children || []))
        .forEach(prop => {
          if (prop.fieldNames.length > 1) { // composite keys
            relationPojo[prop.name] = prop.fieldNames.map(name => root![`${relationAlias}__${name}`]);
            prop.fieldNames.map(name => delete root![`${relationAlias}__${name}`]);
          } else {
            const alias = `${relationAlias}__${prop.fieldNames[0]}`;
            relationPojo[prop.name] = root![alias];
            delete root![alias];
          }
        });

      const key = `${meta.name}-${(Utils.getCompositeKeyHash(result, meta))}`;

      if (map[key]) {
        result[relation.name] = map[key][relation.name];
      } else {
        map[key] = result;
      }

      if ([ReferenceType.MANY_TO_MANY, ReferenceType.ONE_TO_MANY].includes(relation.reference)) {
        result[relation.name] = result[relation.name] || [] as unknown as T[keyof T & string];
        this.appendToCollection(meta2, result[relation.name] as Dictionary[], relationPojo);
      } else {
        result[relation.name] = relationPojo as T[keyof T & string];
      }

      const populateChildren = p.children || [];
      this.mapJoinedProps(relationPojo, meta2, populateChildren, qb, root, map, path);
    });
  }

  private appendToCollection<T extends AnyEntity<T>>(meta: EntityMetadata<T>, collection: EntityData<T>[], relationPojo: EntityData<T>): void {
    if (collection.length === 0) {
      return void collection.push(relationPojo);
    }

    const last = collection[collection.length - 1];
    const pk1 = Utils.getCompositeKeyHash(last, meta);
    const pk2 = Utils.getCompositeKeyHash(relationPojo, meta);

    if (pk1 !== pk2) {
      collection.push(relationPojo);
    }
  }

  async count<T extends AnyEntity<T>>(entityName: string, where: any, options: CountOptions<T> = {}): Promise<number> {
    const meta = this.metadata.find(entityName)!;
    const pks = meta.primaryKeys;
    const qb = this.createQueryBuilder(entityName, options.ctx, options.connectionType, false)
      .groupBy(options.groupBy!)
      .having(options.having!)
      .populate(options.populate as unknown as PopulateOptions<T>[] ?? [])
      .withSchema(this.getSchemaName(meta, options))
      .where(where);

    return this.rethrow(qb.getCount(pks, true));
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    options.convertCustomTypes ??= true;
    const meta = this.metadata.find<T>(entityName)!;
    const collections = this.extractManyToMany(entityName, data);
    const pks = this.getPrimaryKeyFields(entityName);
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes).withSchema(this.getSchemaName(meta, options));
    const res = await this.rethrow(qb.insert(data as unknown as RequiredEntityData<T>).execute('run', false));
    res.row = res.row || {};
    let pk: any;

    if (pks.length > 1) { // owner has composite pk
      pk = Utils.getPrimaryKeyCond(data as T, pks);
    } else {
      res.insertId = data[pks[0]] ?? res.insertId ?? res.row[pks[0]];
      pk = [res.insertId];
    }

    await this.processManyToMany<T>(meta, pk, collections, false, options);

    return res;
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get<T>(entityName);
    const collections = options.processCollections ? data.map(d => this.extractManyToMany(entityName, d)) : [];
    const pks = this.getPrimaryKeyFields(entityName);
    const set = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => set.add(k)));
    const props = [...set].map(name => meta.properties[name] ?? { name, fieldNames: [name] }) as EntityProperty<T>[];
    const fields = Utils.flatten(props.map(prop => prop.fieldNames));
    let res: QueryResult<T>;

    if (fields.length === 0) {
      const qb = this.createQueryBuilder(entityName, options.ctx, 'write', options.convertCustomTypes).withSchema(this.getSchemaName(meta, options));
      res = await this.rethrow(qb.insert(data as unknown as RequiredEntityData<T>[]).execute('run', false));
    } else {
      let sql = `insert into ${this.getTableName(meta, options)} `;
      /* istanbul ignore next */
      sql += fields.length > 0 ? '(' + fields.map(k => this.platform.quoteIdentifier(k)).join(', ') + ')' : 'default';
      sql += ` values `;
      const params: any[] = [];
      sql += data.map(row => {
        const keys: string[] = [];
        props.forEach(prop => {
          if (prop.fieldNames.length > 1) {
            params.push(...(row[prop.name] as unknown[]));
            keys.push(...prop.fieldNames.map(_ => '?'));
          } else if (prop.customType && 'convertToDatabaseValueSQL' in prop.customType && !this.platform.isRaw(row[prop.name])) {
            keys.push(prop.customType.convertToDatabaseValueSQL!('?', this.platform));
            params.push(row[prop.name]);
          } else {
            params.push(row[prop.name]);
            keys.push('?');
          }
        });

        return '(' + keys.join(', ') + ')';
      }).join(', ');

      if (this.platform.usesReturningStatement()) {
        /* istanbul ignore next */
        const returningProps = meta!.props.filter(prop => prop.primary || prop.defaultRaw);
        const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
        /* istanbul ignore next */
        sql += returningFields.length > 0 ? ` returning ${returningFields.map(field => this.platform.quoteIdentifier(field)).join(', ')}` : '';
      }

      res = await this.execute(sql, params, 'run', options.ctx);
    }

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

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    options.convertCustomTypes ??= true;
    const meta = this.metadata.find<T>(entityName);
    const pks = this.getPrimaryKeyFields(entityName);
    const collections = this.extractManyToMany(entityName, data);
    let res = { affectedRows: 0, insertId: 0, row: {} } as QueryResult<T>;

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      where = { [pks[0]]: where } as FilterQuery<T>;
    }

    if (Utils.hasObjectKeys(data)) {
      const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes)
        .update(data)
        .withSchema(this.getSchemaName(meta, options))
        .where(where);

      res = await this.rethrow(qb.execute('run', false));
    }

    /* istanbul ignore next */
    const pk = pks.map(pk => Utils.extractPK<T>(data[pk] || where, meta)!) as Primary<T>[];
    await this.processManyToMany<T>(meta, pk, collections, true, options);

    return res;
  }

  async nativeUpdateMany<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get<T>(entityName);
    const collections = options.processCollections ? data.map(d => this.extractManyToMany(entityName, d)) : [];
    const keys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => keys.add(k)));
    const pkCond = Utils.flatten(meta.primaryKeys.map(pk => meta.properties[pk].fieldNames)).map(pk => `${this.platform.quoteIdentifier(pk)} = ?`).join(' and ');
    const params: any[] = [];
    let sql = `update ${this.getTableName(meta, options)} set `;

    keys.forEach(key => {
      const prop = meta.properties[key];

      prop.fieldNames.forEach((fieldName: string, fieldNameIdx: number) => {
        sql += `${this.platform.quoteIdentifier(fieldName)} = case`;
        where.forEach((cond, idx) => {
          if (key in data[idx]) {
            const pks = Utils.getOrderedPrimaryKeys(cond as Dictionary, meta);
            sql += ` when (${pkCond}) then `;

            if (prop.customType && 'convertToDatabaseValueSQL' in prop.customType && !this.platform.isRaw(data[idx][key])) {
              sql += prop.customType.convertToDatabaseValueSQL!('?', this.platform);
            } else {
              sql += '?';
            }

            params.push(...pks, prop.fieldNames.length > 1 ? data[idx][key][fieldNameIdx] : data[idx][key]);
          }
        });
        sql += ` else ${this.platform.quoteIdentifier(fieldName)} end, `;

        return sql;
      });
    });

    if (meta.versionProperty) {
      const versionProperty = meta.properties[meta.versionProperty];
      const quotedFieldName = this.platform.quoteIdentifier(versionProperty.fieldNames[0]);
      sql += `${quotedFieldName} = `;

      if (versionProperty.type.toLowerCase() === 'date') {
        sql += this.platform.getCurrentTimestampSQL(versionProperty.length);
      } else {
        sql += `${quotedFieldName} + 1`;
      }

      sql += `, `;
    }

    sql = sql.substring(0, sql.length - 2) + ' where ';
    const pkProps = meta.primaryKeys.concat(...meta.concurrencyCheckKeys);
    const pks = Utils.flatten(pkProps.map(pk => meta.properties[pk].fieldNames));
    sql += pks.length > 1 ? `(${pks.map(pk => `${this.platform.quoteIdentifier(pk)}`).join(', ')})` : this.platform.quoteIdentifier(pks[0]);

    const conds = where.map(cond => {
      if (pks.length > 1) {
        pkProps.forEach(pk => params.push(cond![pk as string]));
        return `(${new Array(pks.length).fill('?').join(', ')})`;
      }

      params.push(cond);
      return '?';
    });
    const values = pks.length > 1 && this.platform.requiresValuesKeyword() ? 'values ' : '';
    sql += ` in (${values}${conds.join(', ')})`;
    const res = await this.rethrow(this.execute<QueryResult<T>>(sql, params, 'run', options.ctx));

    for (let i = 0; i < collections.length; i++) {
      await this.processManyToMany<T>(meta, where[i] as Primary<T>[], collections[i], false, options);
    }

    return res;
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T> | string | any, options: DeleteOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find(entityName);
    const pks = this.getPrimaryKeyFields(entityName);

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      where = { [pks[0]]: where };
    }

    const qb = this.createQueryBuilder(entityName, options.ctx, 'write', false).delete(where).withSchema(this.getSchemaName(meta, options));

    return this.rethrow(qb.execute('run', false));
  }

  async syncCollection<T extends AnyEntity<T>, O extends AnyEntity<O>>(coll: Collection<T, O>, options?: DriverMethodOptions): Promise<void> {
    const wrapped = coll.owner.__helper!;
    const meta = wrapped.__meta;
    const pks = wrapped.getPrimaryKeys(true)!;
    const snap = coll.getSnapshot();
    const includes = <T>(arr: T[], item: T) => !!arr.find(i => Utils.equals(i, item));
    const snapshot = snap ? snap.map(item => item.__helper!.getPrimaryKeys(true)!) : [];
    const current = coll.getItems(false).map(item => item.__helper!.getPrimaryKeys(true)!);
    const deleteDiff = snap ? snapshot.filter(item => !includes(current, item)) : true;
    const insertDiff = current.filter(item => !includes(snapshot, item));
    const target = snapshot.filter(item => includes(current, item)).concat(...insertDiff);
    const equals = Utils.equals(current, target);
    const ctx = options?.ctx;

    // wrong order if we just delete and insert to the end (only owning sides can have fixed order)
    if (coll.property.owner && coll.property.fixedOrder && !equals && Array.isArray(deleteDiff)) {
      (deleteDiff as unknown[]).length = insertDiff.length = 0;
      deleteDiff.push(...snapshot);
      insertDiff.push(...current);
    }

    if (coll.property.reference === ReferenceType.ONE_TO_MANY) {
      const cols = coll.property.referencedColumnNames;
      const qb = this.createQueryBuilder(coll.property.type, ctx, 'write')
        .withSchema(this.getSchemaName(meta, options))
        .update({ [coll.property.mappedBy]: pks })
        .getKnexQuery()
        .whereIn(cols, insertDiff as string[][]);

      return this.rethrow(this.execute<any>(qb));
    }

    /* istanbul ignore next */
    const ownerSchema = wrapped.getSchema() === '*' ? this.config.get('schema') : wrapped.getSchema();
    const pivotMeta = this.metadata.find(coll.property.pivotEntity)!;

    if (pivotMeta.schema === '*') {
      /* istanbul ignore next */
      options ??= {};
      options.schema = ownerSchema;
    }

    return this.rethrow(this.updateCollectionDiff<T, O>(meta, coll.property, pks, deleteDiff, insertDiff, options));
  }

  async loadFromPivotTable<T, O>(prop: EntityProperty, owners: Primary<O>[][], where: FilterQuery<T> = {} as FilterQuery<T>, orderBy?: QueryOrderMap<T>[], ctx?: Transaction, options?: FindOptions<T>): Promise<Dictionary<T[]>> {
    const pivotProp2 = this.getPivotInverseProperty(prop);
    const ownerMeta = this.metadata.find(pivotProp2.type)!;
    const cond = { [`${prop.pivotEntity}.${pivotProp2.name}`]: { $in: ownerMeta.compositePK ? owners : owners.map(o => o[0]) } };

    /* istanbul ignore if */
    if (!Utils.isEmpty(where) && Object.keys(where as Dictionary).every(k => Utils.isOperator(k, false))) {
      where = cond as FilterQuery<T>;
    } else {
      where = { ...(where as Dictionary), ...cond } as FilterQuery<T>;
    }

    orderBy = this.getPivotOrderBy(prop, orderBy);
    const qb = this.createQueryBuilder<T>(prop.type, ctx, options?.connectionType)
      .unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES)
      .withSchema(this.getSchemaName(prop.targetMeta, options));
    const populate = this.autoJoinOneToOneOwner(prop.targetMeta!, [{ field: prop.pivotEntity }]);
    const fields = this.buildFields(prop.targetMeta!, (options?.populate ?? []) as unknown as PopulateOptions<T>[], [], qb, options?.fields as Field<T>[]);
    qb.select(fields).populate(populate).where(where).orderBy(orderBy!).setLockMode(options?.lockMode, options?.lockTableAliases);

    if (owners.length === 1 && (options?.offset != null || options?.limit != null)) {
      qb.limit(options.limit, options.offset);
    }

    const items = owners.length ? await this.rethrow(qb.execute('all')) : [];

    const map: Dictionary<T[]> = {};
    const pkProps = ownerMeta.getPrimaryProps();
    owners.forEach(owner => {
      const key = Utils.getPrimaryKeyHash(prop.joinColumns.map((col, idx) => {
        const pkProp = pkProps[idx];
        return pkProp.customType ? pkProp.customType.convertToJSValue(owner[idx], this.platform) : owner[idx];
      }));

      return map[key] = [];
    });
    items.forEach((item: any) => {
      const key = Utils.getPrimaryKeyHash(prop.joinColumns.map((col, idx) => {
        const pkProp = pkProps[idx];
        return pkProp.customType ? pkProp.customType.convertToJSValue(item[`fk__${col}`], this.platform) : item[`fk__${col}`];
      }));
      map[key].push(item);
      prop.joinColumns.forEach(col => delete item[`fk__${col}`]);
      prop.inverseJoinColumns.forEach(col => delete item[`fk__${col}`]);
    });

    return map;
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | Knex.QueryBuilder | Knex.Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction): Promise<T> {
    return this.rethrow(this.connection.execute(queryOrKnex, params, method, ctx));
  }

  /**
   * 1:1 owner side needs to be marked for population so QB auto-joins the owner id
   */
  protected autoJoinOneToOneOwner<T, P extends string = never>(meta: EntityMetadata, populate: PopulateOptions<T>[], fields: readonly EntityField<T, P>[] = []): PopulateOptions<T>[] {
    if (!this.config.get('autoJoinOneToOneOwner') || fields.length > 0) {
      return populate;
    }

    const relationsToPopulate = populate.map(({ field }) => field);
    const toPopulate: PopulateOptions<T>[] = meta.relations
      .filter(prop => prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner && !relationsToPopulate.includes(prop.name))
      .map(prop => ({ field: prop.name, strategy: prop.strategy }));

    return [...populate, ...toPopulate];
  }

  protected joinedProps<T>(meta: EntityMetadata, populate: PopulateOptions<T>[]): PopulateOptions<T>[] {
    return populate.filter(p => {
      const prop = meta.properties[p.field] || {};
      return (p.strategy || prop.strategy || this.config.get('loadStrategy')) === LoadStrategy.JOINED && prop.reference !== ReferenceType.SCALAR;
    });
  }

  /**
   * @internal
   */
  mergeJoinedResult<T extends AnyEntity<T>>(rawResults: EntityData<T>[], meta: EntityMetadata<T>): EntityData<T>[] {
    // group by the root entity primary key first
    const map: Dictionary = {};
    const res: EntityData<T>[] = [];
    rawResults.forEach(item => {
      const pk = Utils.getCompositeKeyHash(item, meta);

      if (map[pk]) {
        map[pk].push(item);
      } else {
        map[pk] = [item];
        res.push(item);
      }
    });

    return res;
  }

  protected getFieldsForJoinedLoad<T extends AnyEntity<T>>(qb: QueryBuilder<T>, meta: EntityMetadata<T>, explicitFields?: Field<T>[], populate: PopulateOptions<T>[] = [], parentTableAlias?: string, parentJoinPath?: string): Field<T>[] {
    const fields: Field<T>[] = [];
    const joinedProps = this.joinedProps(meta, populate);

    const shouldHaveColumn = <U>(prop: EntityProperty<U>, populate: PopulateOptions<U>[], fields?: Field<U>[]) => {
      if (!this.platform.shouldHaveColumn(prop, populate)) {
        return false;
      }

      if (!fields || prop.primary) {
        return true;
      }

      return fields.includes(prop.name);
    };

    // alias all fields in the primary table
    meta.props
      .filter(prop => shouldHaveColumn(prop, populate, explicitFields))
      .forEach(prop => fields.push(...this.mapPropToFieldNames(qb, prop, parentTableAlias)));

    joinedProps.forEach(relation => {
      const prop = meta.properties[relation.field];
      const meta2 = this.metadata.find<T>(prop.type)!;
      const tableAlias = qb.getNextAlias(prop.name);
      const field = parentTableAlias ? `${parentTableAlias}.${prop.name}` : prop.name;
      const path = parentJoinPath ? `${parentJoinPath}.${prop.name}` : `${meta.name}.${prop.name}`;
      qb.join(field, tableAlias, {}, 'leftJoin', path);
      const childExplicitFields = explicitFields?.filter(f => Utils.isPlainObject(f)).map(o => o[prop.name])[0] || [];

      explicitFields?.forEach(f => {
        if (typeof f === 'string' && f.startsWith(`${prop.name}.`)) {
          childExplicitFields.push(f.substring(prop.name.length + 1));
        }
      });

      fields.push(...this.getFieldsForJoinedLoad(qb, meta2, childExplicitFields.length === 0 ? undefined : childExplicitFields, relation.children, tableAlias, path));
    });

    return fields;
  }

  /**
   * @internal
   */
  mapPropToFieldNames<T extends AnyEntity<T>>(qb: QueryBuilder<T>, prop: EntityProperty<T>, tableAlias?: string): Field<T>[] {
    const aliased = qb.ref(tableAlias ? `${tableAlias}__${prop.fieldNames[0]}` : prop.fieldNames[0]).toString();

    if (prop.customType?.convertToJSValueSQL && tableAlias) {
      const prefixed = qb.ref(prop.fieldNames[0]).withSchema(tableAlias).toString();
      return [qb.raw(prop.customType.convertToJSValueSQL(prefixed, this.platform) + ' as ' + aliased).toString()];
    }

    if (prop.formula) {
      const alias = qb.ref(tableAlias ?? qb.alias).toString();
      return [`${prop.formula!(alias)} as ${aliased}`];
    }

    if (tableAlias) {
      return prop.fieldNames.map(fieldName => qb.ref(fieldName).withSchema(tableAlias).as(`${tableAlias}__${fieldName}`));
    }

    return prop.fieldNames;
  }

  /** @internal */
  createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<Knex.Transaction>, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean): QueryBuilder<T> {
    const connectionType = this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new QueryBuilder<T>(entityName, this.metadata, this, ctx, undefined, connectionType);

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

  protected resolveConnectionType(args: { ctx?: Transaction<Knex.Transaction>; connectionType?: ConnectionType}) {
    if (args.ctx) {
      return 'write';
    } else if (args.connectionType) {
      return args.connectionType;
    } else if (this.config.get('preferReadReplicas') === true) {
      return 'read';
    }

    return 'write';
  }

  protected extractManyToMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>): EntityData<T> {
    if (!this.metadata.has(entityName)) {
      return {};
    }

    const ret: EntityData<T> = {};

    this.metadata.find(entityName)!.relations.forEach(prop => {
      if (prop.reference === ReferenceType.MANY_TO_MANY && data[prop.name]) {
        ret[prop.name] = data[prop.name].map((item: Primary<T>) => Utils.asArray(item));
        delete data[prop.name];
      }
    });

    return ret;
  }

  protected async processManyToMany<T extends AnyEntity<T>>(meta: EntityMetadata<T> | undefined, pks: Primary<T>[], collections: EntityData<T>, clear: boolean, options?: DriverMethodOptions) {
    if (!meta) {
      return;
    }

    for (const prop of meta.relations) {
      if (collections[prop.name as string]) {
        await this.rethrow(this.updateCollectionDiff(meta, prop, pks, clear, collections[prop.name as string] as Primary<T>[][], options));
      }
    }
  }

  protected async updateCollectionDiff<T extends AnyEntity<T>, O extends AnyEntity<O>>(
    meta: EntityMetadata<O>,
    prop: EntityProperty<T>,
    pks: Primary<O>[],
    deleteDiff: Primary<T>[][] | boolean,
    insertDiff: Primary<T>[][],
    options?: DriverMethodOptions & { ownerSchema?: string },
  ): Promise<void> {
    if (!deleteDiff) {
      deleteDiff = [];
    }

    if (deleteDiff === true || deleteDiff.length > 0) {
      const qb1 = this.createQueryBuilder(prop.pivotEntity, options?.ctx, 'write')
        .withSchema(this.getSchemaName(meta, options))
        .unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
      const knex = qb1.getKnex();

      if (Array.isArray(deleteDiff)) {
        knex.whereIn(prop.inverseJoinColumns, deleteDiff as Knex.Value[][]);
      }

      prop.joinColumns.forEach((joinColumn, idx) => knex.andWhere(joinColumn, pks[idx] as Knex.Value[][]));
      await this.execute(knex.delete());
    }

    if (insertDiff.length === 0) {
      return;
    }

    const items = insertDiff.map(item => {
      const cond = {} as Dictionary<Primary<T | O>>;
      prop.joinColumns.forEach((joinColumn, idx) => cond[joinColumn] = pks[idx]);
      prop.inverseJoinColumns.forEach((inverseJoinColumn, idx) => cond[inverseJoinColumn] = item[idx]);

      return cond;
    });

    /* istanbul ignore else */
    if (this.platform.allowsMultiInsert()) {
      await this.nativeInsertMany<T>(prop.pivotEntity, items as EntityData<T>[], { ...options, convertCustomTypes: false, processCollections: false });
    } else {
      await Utils.runSerial(items, item => {
        return this.createQueryBuilder(prop.pivotEntity, options?.ctx, 'write')
          .unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES)
          .withSchema(this.getSchemaName(meta, options))
          .insert(item)
          .execute('run', false);
      });
    }
  }

  async lockPessimistic<T extends AnyEntity<T>>(entity: T, options: LockOptions): Promise<void> {
    const meta = entity.__helper!.__meta;
    const qb = this.createQueryBuilder(entity.constructor.name, options.ctx).unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES).withSchema(options.schema ?? meta.schema);
    const cond = Utils.getPrimaryKeyCond(entity, meta.primaryKeys);
    qb.select('1').where(cond!).setLockMode(options.lockMode, options.lockTableAliases);
    await this.rethrow(qb.execute());
  }

  protected buildJoinedPropsOrderBy<T extends AnyEntity<T>>(entityName: string, qb: QueryBuilder<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], parentPath?: string): QueryOrderMap<T>[] {
    const orderBy: QueryOrderMap<T>[] = [];
    const joinedProps = this.joinedProps(meta, populate);

    joinedProps.forEach(relation => {
      const prop = meta.properties[relation.field];
      const propOrderBy = prop.orderBy;
      const path = `${parentPath ? parentPath : entityName}.${relation.field}`;
      const propAlias = qb.getAliasForJoinPath(path);

      if (propOrderBy) {
        Object.keys(propOrderBy).forEach(field => {
          orderBy.push({ [`${propAlias}.${field}`]: propOrderBy[field] } as QueryOrderMap<T>);
        });
      }

      if (relation.children) {
        const meta2 = this.metadata.find<T>(prop.type)!;
        orderBy.push(...this.buildJoinedPropsOrderBy(prop.name, qb, meta2, relation.children, path));
      }
    });

    return orderBy;
  }

  protected buildFields<T extends AnyEntity<T>>(meta: EntityMetadata<T>, populate: PopulateOptions<T>[], joinedProps: PopulateOptions<T>[], qb: QueryBuilder<T>, fields?: Field<T>[]): Field<T>[] {
    const lazyProps = meta.props.filter(prop => prop.lazy && !populate.some(p => p.field === prop.name || p.all));
    const hasLazyFormulas = meta.props.some(p => p.lazy && p.formula);
    const requiresSQLConversion = meta.props.some(p => p.customType?.convertToJSValueSQL);
    const hasExplicitFields = !!fields;
    const ret: Field<T>[] = [];

    if (joinedProps.length > 0) {
      ret.push(...this.getFieldsForJoinedLoad(qb, meta, fields, populate));
    } else if (fields) {
      for (const field of [...fields]) {
        if (Utils.isPlainObject(field) || field.toString().includes('.')) {
          continue;
        }

        ret.push(field);
      }

      ret.unshift(...meta.primaryKeys.filter(pk => !fields.includes(pk)));
    } else if (lazyProps.filter(p => !p.formula).length > 0) {
      const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate, false));
      ret.push(...Utils.flatten(props.filter(p => !lazyProps.includes(p)).map(p => p.fieldNames)));
    } else if (hasLazyFormulas || requiresSQLConversion) {
      ret.push('*');
    }

    if (ret.length > 0 && !hasExplicitFields) {
      meta.props
        .filter(prop => prop.formula && !lazyProps.includes(prop))
        .forEach(prop => {
          const alias = qb.ref(qb.alias).toString();
          const aliased = qb.ref(prop.fieldNames[0]).toString();
          ret.push(`${prop.formula!(alias)} as ${aliased}`);
        });

      meta.props
        .filter(prop => prop.customType?.convertToDatabaseValueSQL || prop.customType?.convertToJSValueSQL)
        .forEach(prop => ret.push(prop.name));
    }

    return ret.length > 0 ? ret : ['*'];
  }

}
