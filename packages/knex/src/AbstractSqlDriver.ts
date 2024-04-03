import type { Knex } from 'knex';
import {
  ALIAS_REPLACEMENT_RE,
  type AnyEntity,
  type Collection,
  type Configuration,
  type ConnectionType,
  type Constructor,
  type CountOptions,
  DatabaseDriver,
  type DeleteOptions,
  type Dictionary,
  type DriverMethodOptions,
  type EntityData,
  type EntityDictionary,
  type EntityField,
  type EntityKey,
  type EntityManager,
  EntityManagerType,
  type EntityMetadata,
  type EntityName,
  type EntityProperty,
  type EntityValue,
  type FilterKey,
  type FilterQuery,
  type FindByCursorOptions,
  type FindOneOptions,
  type FindOptions,
  getOnConflictFields,
  getOnConflictReturningFields,
  helper,
  type IDatabaseDriver,
  LoadStrategy,
  type LockOptions,
  type LoggingOptions,
  type NativeInsertUpdateManyOptions,
  type NativeInsertUpdateOptions,
  type ObjectQuery,
  type Options,
  type OrderDefinition,
  parseJsonSafe,
  type PopulateOptions,
  type Primary,
  QueryFlag,
  QueryHelper,
  QueryOrder,
  type QueryOrderMap,
  type QueryResult,
  raw,
  RawQueryFragment,
  ReferenceKind,
  type RequiredEntityData,
  type Transaction,
  type UpsertManyOptions,
  type UpsertOptions,
  Utils,
} from '@mikro-orm/core';
import type { AbstractSqlConnection } from './AbstractSqlConnection';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform';
import { JoinType, QueryBuilder, QueryType } from './query';
import { SqlEntityManager } from './SqlEntityManager';
import type { Field } from './typings';
import { PivotCollectionPersister } from './PivotCollectionPersister';

export abstract class AbstractSqlDriver<Connection extends AbstractSqlConnection = AbstractSqlConnection, Platform extends AbstractSqlPlatform = AbstractSqlPlatform> extends DatabaseDriver<Connection> {

  [EntityManagerType]!: SqlEntityManager<this>;

  protected override readonly connection: Connection;
  protected override readonly replicas: Connection[] = [];
  protected override readonly platform: Platform;

  protected constructor(config: Configuration, platform: Platform, connection: Constructor<Connection>, connector: string[]) {
    super(config, connector);
    this.connection = new connection(this.config);
    this.replicas = this.createReplicas(conf => new connection(this.config, conf, 'read'));
    this.platform = platform;
  }

  override getPlatform(): Platform {
    return this.platform;
  }

  override createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    const EntityManagerClass = this.config.get('entityManager', SqlEntityManager);
    return new EntityManagerClass(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  async find<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P, F, E> = {}): Promise<EntityData<T>[]> {
    options = { populate: [], orderBy: [], ...options };
    const meta = this.metadata.find<T>(entityName)!;

    if (meta?.virtual) {
      return this.findVirtual<T>(entityName, where, options);
    }

    const populate = this.autoJoinOneToOneOwner(meta, options.populate as unknown as PopulateOptions<T>[], options.fields);
    const joinedProps = this.joinedProps(meta, populate, options);
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, options.connectionType, false, options.logging);
    const fields = this.buildFields(meta, populate, joinedProps, qb, qb.alias, options);
    const orderBy = this.buildOrderBy(qb, meta, populate, options);
    const populateWhere = this.buildPopulateWhere(meta, joinedProps, options);
    Utils.asArray(options.flags).forEach(flag => qb.setFlag(flag));

    if (Utils.isPrimaryKey(where, meta.compositePK)) {
      where = { [Utils.getPrimaryKeyHash(meta.primaryKeys)]: where } as FilterQuery<T>;
    }

    const { first, last, before, after } = options as FindByCursorOptions<T>;
    const isCursorPagination = [first, last, before, after].some(v => v != null);
    qb.__populateWhere = (options as Dictionary)._populateWhere;
    qb.select(fields)
      // only add populateWhere if we are populate-joining, as this will be used to add `on` conditions
      .populate(populate, joinedProps.length > 0 ? populateWhere : undefined)
      .where(where)
      .groupBy(options.groupBy!)
      .having(options.having!)
      .indexHint(options.indexHint!)
      .comment(options.comments!)
      .hintComment(options.hintComments!)
      .withSchema(this.getSchemaName(meta, options));

    if (isCursorPagination) {
      const { orderBy: newOrderBy, where } = this.processCursorOptions(meta, options, orderBy);
      qb.andWhere(where).orderBy(newOrderBy);
    } else {
      qb.orderBy(orderBy);
    }

    if (options.limit != null || options.offset != null) {
      qb.limit(options.limit, options.offset);
    }

    if (options.lockMode) {
      qb.setLockMode(options.lockMode, options.lockTableAliases);
    }

    const result = await this.rethrow(qb.execute('all'));

    if (isCursorPagination && !first && !!last) {
      result.reverse();
    }

    return result;
  }

  async findOne<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T, P, F, E>): Promise<EntityData<T> | null> {
    const opts = { populate: [], ...options } as FindOptions<T>;
    const meta = this.metadata.find(entityName)!;
    const populate = this.autoJoinOneToOneOwner(meta, opts.populate as unknown as PopulateOptions<T>[], opts.fields);
    const joinedProps = this.joinedProps(meta, populate, options);
    const hasToManyJoins = joinedProps.some(hint => this.hasToManyJoins(hint, meta));

    if (joinedProps.length === 0 || !hasToManyJoins) {
      opts.limit = 1;
    }

    if (opts.limit! > 0 && !opts.flags?.includes(QueryFlag.DISABLE_PAGINATE)) {
      opts.flags ??= [];
      opts.flags.push(QueryFlag.DISABLE_PAGINATE);
    }

    const res = await this.find<T>(entityName, where, opts);

    return res[0] || null;
  }

  protected hasToManyJoins<T extends object>(hint: PopulateOptions<T>, meta: EntityMetadata<T>): boolean {
    const [propName] = hint.field.split(':', 2) as [EntityKey<T>];
    const prop = meta.properties[propName];

    if (prop && [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
      return true;
    }

    if (hint.children && prop.targetMeta) {
      return hint.children.some(hint => this.hasToManyJoins(hint as any, prop.targetMeta as any));
    }

    return false;
  }

  override async findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any, any, any>): Promise<EntityData<T>[]> {
    return this.findFromVirtual(entityName, where, options, QueryType.SELECT) as Promise<EntityData<T>[]>;
  }

  override async countVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: CountOptions<T, any>): Promise<number> {
    return this.findFromVirtual(entityName, where, options, QueryType.COUNT) as Promise<number>;
  }

  protected async findFromVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any> | CountOptions<T, any>, type: QueryType): Promise<EntityData<T>[] | number> {
    const meta = this.metadata.get<T>(entityName);

    /* istanbul ignore next */
    if (!meta.expression) {
      return type === QueryType.SELECT ? [] : 0;
    }

    if (typeof meta.expression === 'string') {
      return this.wrapVirtualExpressionInSubquery(meta, meta.expression, where, options as FindOptions<T, any>, type);
    }

    const em = this.createEntityManager();
    em.setTransactionContext(options.ctx);
    const res = meta.expression(em, where, options as FindOptions<T, any, any, any>);

    if (typeof res === 'string') {
      return this.wrapVirtualExpressionInSubquery(meta, res, where, options as FindOptions<T, any>, type);
    }

    if (res instanceof QueryBuilder) {
      return this.wrapVirtualExpressionInSubquery(meta, res.getFormattedQuery(), where, options as FindOptions<T, any>, type);
    }

    if (Utils.isObject<Knex.QueryBuilder | Knex.Raw>(res)) {
      const { sql, bindings } = res.toSQL();
      const query = this.platform.formatQuery(sql, bindings);
      return this.wrapVirtualExpressionInSubquery(meta, query, where, options as FindOptions<T, any>, type);
    }

    /* istanbul ignore next */
    return res as EntityData<T>[];
  }

  protected async wrapVirtualExpressionInSubquery<T extends object>(meta: EntityMetadata<T>, expression: string, where: FilterQuery<T>, options: FindOptions<T, any>, type: QueryType): Promise<T[] | number> {
    const qb = this.createQueryBuilder(meta.className, options?.ctx, options.connectionType, options.convertCustomTypes, options.logging)
      .indexHint(options.indexHint!)
      .comment(options.comments!)
      .hintComment(options.hintComments!);

    if (type !== QueryType.COUNT) {
      qb.limit(options?.limit, options?.offset);

      if (options.orderBy) {
        qb.orderBy(options.orderBy);
      }
    }

    qb.where(where);

    const kqb = qb.getKnexQuery(false).clear('select');

    if (type === QueryType.COUNT) {
      kqb.select(this.connection.getKnex().raw('count(*) as count'));
    } else { // select
      kqb.select('*');
    }

    kqb.fromRaw(`(${expression}) as ${this.platform.quoteIdentifier(qb.alias)}`);
    const res = await this.execute<T[]>(kqb);

    if (type === QueryType.COUNT) {
      return (res[0] as Dictionary).count;
    }

    return res.map(row => this.mapResult(row, meta) as T);
  }

  override mapResult<T extends object>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[] = [], qb?: QueryBuilder<T>, map: Dictionary = {}): EntityData<T> | null {
    const ret = super.mapResult(result, meta);

    /* istanbul ignore if */
    if (!ret) {
      return null;
    }

    if (qb) {
      // here we map the aliased results (cartesian product) to an object graph
      this.mapJoinedProps<T>(ret, meta, populate, qb, ret, map);
    }

    return ret;
  }

  private mapJoinedProps<T extends object>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], qb: QueryBuilder<T>, root: EntityData<T>, map: Dictionary, parentJoinPath?: string) {
    const joinedProps = this.joinedProps(meta, populate);

    joinedProps.forEach(hint => {
      const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
      const prop = meta.properties[propName];

      /* istanbul ignore next */
      if (!prop) {
        return;
      }

      const pivotRefJoin = prop.kind === ReferenceKind.MANY_TO_MANY && ref;
      const meta2 = this.metadata.find<T>(prop.type)!;
      let path = parentJoinPath ? `${parentJoinPath}.${prop.name}` : `${meta.name}.${prop.name}`;

      if (!parentJoinPath) {
        path = '[populate]' + path;
      }

      if (pivotRefJoin) {
        path += '[pivot]';
      }

      const relationAlias = qb.getAliasForJoinPath(path, { matchPopulateJoins: true });

      /* istanbul ignore next */
      if (!relationAlias) {
        return;
      }

      // pivot ref joins via joined strategy need to be handled separately here, as they dont join the target entity
      if (pivotRefJoin) {
        let item;

        if (prop.inverseJoinColumns.length > 1) { // composite keys
          item = prop.inverseJoinColumns.map(name => root![`${relationAlias}__${name}` as EntityKey<T>]) as EntityValue<T>;
        } else {
          const alias = `${relationAlias}__${prop.inverseJoinColumns[0]}` as EntityKey<T>;
          item = root![alias] as EntityValue<T>;
        }

        prop.joinColumns.forEach(name => delete root![`${relationAlias}__${name}` as EntityKey<T>]);
        prop.inverseJoinColumns.forEach(name => delete root![`${relationAlias}__${name}` as EntityKey<T>]);

        result[prop.name] ??= [] as EntityValue<T>;

        if (item) {
          (result[prop.name] as EntityData<T>[]).push(item);
        }

        return;
      }

      // If the primary key value for the relation is null, we know we haven't joined to anything
      // and therefore we don't return any record (since all values would be null)
      const hasPK = meta2.primaryKeys.every(pk => meta2.properties[pk].fieldNames.every(name => {
        return root![`${relationAlias}__${name}` as EntityKey] != null;
      }));

      if (!hasPK) {
        if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind)) {
          result[prop.name] = [] as EntityValue<T>;
        }

        if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
          result[prop.name] = null;
        }

        return;
      }

      let relationPojo: EntityData<T> = {};

      meta2.props
        .filter(prop => !ref && prop.persist === false && prop.fieldNames)
        .filter(prop => !prop.lazy || populate.some(p => p.field === prop.name || p.all))
        .forEach(prop => {
          /* istanbul ignore if */
          if (prop.fieldNames.length > 1) { // composite keys
            relationPojo[prop.name as EntityKey<T>] = prop.fieldNames.map(name => root![`${relationAlias}__${name}` as EntityKey<T>]) as EntityValue<T>;
          } else {
            const alias = `${relationAlias}__${prop.fieldNames[0]}` as EntityKey<T>;
            relationPojo[prop.name] = root![alias] as EntityValue<T>;
          }
        });

      const targetProps = ref
        ? meta2.getPrimaryProps()
        : meta2.props.filter(prop => this.platform.shouldHaveColumn(prop, hint.children as any || []));

      for (const prop of targetProps) {
        if (prop.fieldNames.length > 1) { // composite keys
          const fk = prop.fieldNames.map(name => root![`${relationAlias}__${name}` as EntityKey<T>]) as Primary<T>[];
          const pk = Utils.mapFlatCompositePrimaryKey(fk, prop) as unknown[];
          relationPojo[prop.name] = pk.every(val => val != null) ? pk as EntityValue<T> : null;
        } else if (prop.runtimeType === 'Date') {
          const alias = `${relationAlias}__${prop.fieldNames[0]}` as EntityKey<T>;
          relationPojo[prop.name] = (typeof root![alias] === 'string' ? new Date(root![alias] as string) : root![alias]) as EntityValue<T>;
        } else {
          const alias = `${relationAlias}__${prop.fieldNames[0]}` as EntityKey<T>;
          relationPojo[prop.name] = root![alias];

          if (prop.kind === ReferenceKind.EMBEDDED && (prop.object || meta.embeddable)) {
            const item = parseJsonSafe(relationPojo[prop.name]);

            if (Array.isArray(item)) {
              relationPojo[prop.name] = item.map(row => row == null ? row : this.comparator.mapResult(prop.type, row)) as EntityValue<T>;
            } else {
              relationPojo[prop.name] = item == null ? item : this.comparator.mapResult(prop.type, item) as EntityValue<T>;
            }
          }
        }
      }

      // properties can be mapped to multiple places, e.g. when sharing a column in multiple FKs,
      // so we need to delete them after everything is mapped from given level
      for (const prop of targetProps) {
        prop.fieldNames.map(name => delete root![`${relationAlias}__${name}` as EntityKey<T>]);
      }

      if (ref) {
        const tmp = Object.values(relationPojo);
        /* istanbul ignore next */
        relationPojo = (meta2.compositePK ? tmp : tmp[0]) as EntityData<T>;
      }

      if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind)) {
        result[prop.name] ??= [] as EntityValue<T>;
        (result[prop.name] as EntityData<T>[]).push(relationPojo);
      } else {
        result[prop.name] = relationPojo as EntityValue<T>;
      }

      const populateChildren = hint.children as any || [];
      this.mapJoinedProps(relationPojo, meta2, populateChildren, qb, root, map, path);
    });
  }

  async count<T extends object>(entityName: string, where: any, options: CountOptions<T> = {}): Promise<number> {
    const meta = this.metadata.find(entityName);

    if (meta?.virtual) {
      return this.countVirtual<T>(entityName, where, options);
    }

    const qb = this.createQueryBuilder<T>(entityName, options.ctx, options.connectionType, false, options.logging)
      .indexHint(options.indexHint!)
      .comment(options.comments!)
      .hintComment(options.hintComments!)
      .groupBy(options.groupBy!)
      .having(options.having!)
      .populate(options.populate as unknown as PopulateOptions<T>[] ?? [])
      .withSchema(this.getSchemaName(meta, options))
      .where(where);

    return this.rethrow(qb.getCount());
  }

  async nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    options.convertCustomTypes ??= true;
    const meta = this.metadata.find<T>(entityName)!;
    const collections = this.extractManyToMany(entityName, data);
    const pks = meta?.primaryKeys ?? [this.config.getNamingStrategy().referenceColumnName()];
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes).withSchema(this.getSchemaName(meta, options));
    const res = await this.rethrow(qb.insert(data as unknown as RequiredEntityData<T>).execute('run', false));
    res.row = res.row || {};
    let pk: any;

    if (pks.length > 1) { // owner has composite pk
      pk = Utils.getPrimaryKeyCond(data as T, pks);
    } else {
      /* istanbul ignore next */
      res.insertId = data[pks[0]] ?? res.insertId ?? res.row[pks[0]];
      pk = [res.insertId];
    }

    await this.processManyToMany<T>(meta, pk, collections, false, options);

    return res;
  }

  async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.find<T>(entityName)?.root;
    const collections = options.processCollections ? data.map(d => this.extractManyToMany(entityName, d)) : [];
    const pks = this.getPrimaryKeyFields(entityName) as EntityKey<T>[];
    const set = new Set<EntityKey<T>>();
    data.forEach(row => Utils.keys(row).forEach(k => set.add(k)));
    const props = [...set].map(name => meta?.properties[name] ?? { name, fieldNames: [name] }) as EntityProperty<T>[];
    let fields = Utils.flatten(props.map(prop => prop.fieldNames));
    const duplicates = Utils.findDuplicates(fields);
    const params: unknown[] = [];

    if (duplicates.length) {
      fields = Utils.unique(fields);
    }

    /* istanbul ignore next */
    const tableName = meta ? this.getTableName(meta, options) : this.platform.quoteIdentifier(entityName);
    let sql = `insert into ${tableName} `;
    sql += fields.length > 0 ? '(' + fields.map(k => this.platform.quoteIdentifier(k)).join(', ') + ')' : `(${this.platform.quoteIdentifier(pks[0])})`;

    if (fields.length > 0 || this.platform.usesDefaultKeyword()) {
      sql += ' values ';
    } else {
      sql += ' ' + data.map(() => `select null as ${this.platform.quoteIdentifier(pks[0])}`).join(' union all ');
    }

    const addParams = (prop: EntityProperty<T>, row: Dictionary) => {
      let value = row[prop.name];

      if (prop.kind === ReferenceKind.EMBEDDED && prop.object) {
        if (prop.array && value) {
          for (let i = 0; i < (value as Dictionary[]).length; i++) {
            const item = (value as Dictionary[])[i];
            value[i] = this.mapDataToFieldNames(item, false, prop.embeddedProps, options.convertCustomTypes);
          }
        } else {
          value = this.mapDataToFieldNames(value, false, prop.embeddedProps, options.convertCustomTypes);
        }
      }

      if (options.convertCustomTypes && prop.customType) {
        params.push(prop.customType.convertToDatabaseValue(value, this.platform, { key: prop.name, mode: 'query-data' }));
        return;
      }

      params.push(value);
    };

    if (fields.length > 0 || this.platform.usesDefaultKeyword()) {
      sql += data.map(row => {
        const keys: string[] = [];
        const usedDups: string[] = [];
        props.forEach(prop => {
          if (prop.fieldNames.length > 1) {
            const param = Utils.flatten([...row[prop.name] ?? prop.fieldNames.map(() => null)]);
            const key = param.map(() => '?');
            prop.fieldNames.forEach((field, idx) => {
              if (!duplicates.includes(field) || !usedDups.includes(field)) {
                params.push(param[idx]);
                keys.push(key[idx]);
                usedDups.push(field);
              }
            });
          } else {
            const field = prop.fieldNames[0];

            if (!duplicates.includes(field) || !usedDups.includes(field)) {
              if (prop.customType && !prop.object && 'convertToDatabaseValueSQL' in prop.customType && !this.platform.isRaw(row[prop.name])) {
                keys.push(prop.customType.convertToDatabaseValueSQL!('?', this.platform));
              } else {
                keys.push('?');
              }

              addParams(prop, row);
              usedDups.push(field);
            }
          }
        });

        return '(' + (keys.join(', ') || 'default') + ')';
      }).join(', ');
    }

    if (meta && this.platform.usesReturningStatement()) {
      const returningProps = meta.props
        .filter(prop => prop.persist !== false && prop.defaultRaw || prop.autoincrement || prop.generated)
        .filter(prop => !(prop.name in data[0]) || Utils.isRawSql(data[0][prop.name]));
      const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
      /* istanbul ignore next */
      sql += returningFields.length > 0 ? ` returning ${returningFields.map(field => this.platform.quoteIdentifier(field)).join(', ')}` : '';
    }

    const res = await this.execute<QueryResult<T>>(sql, params, 'run', options.ctx);
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

  async nativeUpdate<T extends object>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> & UpsertOptions<T> = {}): Promise<QueryResult<T>> {
    options.convertCustomTypes ??= true;
    const meta = this.metadata.find<T>(entityName);
    const pks = this.getPrimaryKeyFields(entityName);
    const collections = this.extractManyToMany(entityName, data);
    let res = { affectedRows: 0, insertId: 0, row: {} } as QueryResult<T>;

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      /* istanbul ignore next */
      where = { [meta?.primaryKeys[0] ?? pks[0]]: where } as FilterQuery<T>;
    }

    if (Utils.hasObjectKeys(data)) {
      const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes)
        .withSchema(this.getSchemaName(meta, options));

      if (options.upsert) {
        /* istanbul ignore next */
        const uniqueFields = options.onConflictFields ?? (Utils.isPlainObject(where) ? Utils.keys(where) as EntityKey<T>[] : meta!.primaryKeys) as (keyof T)[];
        const returning = getOnConflictReturningFields(meta, data, uniqueFields, options);
        qb.insert(data as T)
          .onConflict(uniqueFields)
          .returning(returning);

        if (!options.onConflictAction || options.onConflictAction === 'merge') {
          const fields = getOnConflictFields(data, uniqueFields, options);
          qb.merge(fields);
        }

        if (options.onConflictAction === 'ignore') {
          qb.ignore();
        }
      } else {
        qb.update(data).where(where);

        // reload generated columns and version fields
        const returning: string[] = [];
        meta?.props
          .filter(prop => (prop.generated && !prop.primary) || prop.version)
          .forEach(prop => returning.push(prop.name));

        qb.returning(returning);
      }

      res = await this.rethrow(qb.execute('run', false));
    }

    /* istanbul ignore next */
    const pk = pks.map(pk => Utils.extractPK<T>(data[pk] || where, meta)!) as Primary<T>[];
    await this.processManyToMany<T>(meta, pk, collections, true, options);

    return res;
  }

  override async nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> & UpsertManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get<T>(entityName);

    if (options.upsert) {
      const uniqueFields = options.onConflictFields ?? (Utils.isPlainObject(where[0]) ? Object.keys(where[0]).flatMap(key => Utils.splitPrimaryKeys(key)) : meta!.primaryKeys) as (keyof T)[];
      const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes).withSchema(this.getSchemaName(meta, options));
      const returning = getOnConflictReturningFields(meta, data[0], uniqueFields, options);
      qb.insert(data as T[])
        .onConflict(uniqueFields)
        .returning(returning);

      if (!options.onConflictAction || options.onConflictAction === 'merge') {
        const fields = getOnConflictFields(data[0], uniqueFields, options);
        qb.merge(fields);
      }

      if (options.onConflictAction === 'ignore') {
        qb.ignore();
      }

      return this.rethrow(qb.execute('run', false));
    }

    const collections = options.processCollections ? data.map(d => this.extractManyToMany(entityName, d)) : [];
    const keys = new Set<EntityKey<T>>();
    const fields = new Set<string>();
    const returning = new Set<EntityKey<T>>();
    data.forEach(row => {
      Utils.keys(row).forEach(k => {
        keys.add(k as EntityKey<T>);

        if (Utils.isRawSql(row[k])) {
          returning.add(k);
        }
      });
    });

    // reload generated columns and version fields
    meta?.props
      .filter(prop => (prop.generated && !prop.primary) || prop.version)
      .forEach(prop => returning.add(prop.name));

    const pkCond = Utils.flatten(meta.primaryKeys.map(pk => meta.properties[pk].fieldNames)).map(pk => `${this.platform.quoteIdentifier(pk)} = ?`).join(' and ');
    const params: any[] = [];
    let sql = `update ${this.getTableName(meta, options)} set `;

    const addParams = (prop: EntityProperty<T>, value: Dictionary) => {
      if (prop.kind === ReferenceKind.EMBEDDED && prop.object) {
        if (prop.array) {
          for (let i = 0; i < (value as Dictionary[]).length; i++) {
            const item = (value as Dictionary[])[i];
            value[i] = this.mapDataToFieldNames(item, false, prop.embeddedProps, options.convertCustomTypes);
          }
        } else {
          value = this.mapDataToFieldNames(value, false, prop.embeddedProps, options.convertCustomTypes);
        }
      }

      params.push(value);
    };

    keys.forEach(key => {
      const prop = meta.properties[key];

      prop.fieldNames.forEach((fieldName: string, fieldNameIdx: number) => {
        if (fields.has(fieldName)) {
          return;
        }

        fields.add(fieldName);

        sql += `${this.platform.quoteIdentifier(fieldName)} = case`;
        where.forEach((cond, idx) => {
          if (key in data[idx]) {
            const pks = Utils.getOrderedPrimaryKeys(cond as Dictionary, meta);
            sql += ` when (${pkCond}) then `;

            if (prop.customType && !prop.object && 'convertToDatabaseValueSQL' in prop.customType && !this.platform.isRaw(data[idx][key])) {
              sql += prop.customType.convertToDatabaseValueSQL!('?', this.platform);
            } else {
              sql += '?';
            }

            params.push(...pks);
            addParams(prop, prop.fieldNames.length > 1 ? data[idx][key]?.[fieldNameIdx] : data[idx][key]);
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

      if (versionProperty.runtimeType === 'Date') {
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
      if (Utils.isPlainObject(cond) && Utils.getObjectKeysSize(cond) === 1) {
        cond = Object.values(cond)[0] as object;
      }

      if (pks.length > 1) {
        pkProps.forEach(pk => {
          if (Array.isArray(cond![pk as keyof FilterQuery<T>])) {
            params.push(...Utils.flatten(cond![pk as FilterKey<T>] as any));
          } else {
            params.push(cond![pk as keyof FilterQuery<T>]);
          }
        });
        return `(${Array.from({ length: pks.length }).fill('?').join(', ')})`;
      }

      params.push(cond);
      return '?';
    });
    sql += ` in (${conds.join(', ')})`;

    if (this.platform.usesReturningStatement() && returning.size > 0) {
      const returningFields = Utils.flatten([...returning].map(prop => meta.properties[prop].fieldNames));
      /* istanbul ignore next */
      sql += returningFields.length > 0 ? ` returning ${returningFields.map(field => this.platform.quoteIdentifier(field)).join(', ')}` : '';
    }

    const res = await this.rethrow(this.execute<QueryResult<T>>(sql, params, 'run', options.ctx));

    for (let i = 0; i < collections.length; i++) {
      await this.processManyToMany<T>(meta, where[i] as Primary<T>[], collections[i], false, options);
    }

    return res;
  }

  async nativeDelete<T extends object>(entityName: string, where: FilterQuery<T> | string | any, options: DeleteOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.find(entityName);
    const pks = this.getPrimaryKeyFields(entityName);

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      where = { [pks[0]]: where };
    }

    const qb = this.createQueryBuilder(entityName, options.ctx, 'write', false).delete(where).withSchema(this.getSchemaName(meta, options));

    return this.rethrow(qb.execute('run', false));
  }

  override async syncCollections<T extends object, O extends object>(collections: Iterable<Collection<T, O>>, options?: DriverMethodOptions): Promise<void> {
    const groups = {} as Dictionary<PivotCollectionPersister<any>>;

    for (const coll of collections) {
      const wrapped = helper(coll.owner);
      const meta = wrapped.__meta;
      const pks = wrapped.getPrimaryKeys(true)!;
      const snap = coll.getSnapshot();
      const includes = <T>(arr: T[], item: T) => !!arr.find(i => Utils.equals(i, item));
      const snapshot = snap ? snap.map(item => helper(item).getPrimaryKeys(true)!) : [];
      const current = coll.getItems(false).map(item => helper(item).getPrimaryKeys(true)!);
      const deleteDiff = snap ? snapshot.filter(item => !includes(current, item)) : true;
      const insertDiff = current.filter(item => !includes(snapshot, item));
      const target = snapshot.filter(item => includes(current, item)).concat(...insertDiff);
      const equals = Utils.equals(current, target);

      // wrong order if we just delete and insert to the end (only owning sides can have fixed order)
      if (coll.property.owner && coll.property.fixedOrder && !equals && Array.isArray(deleteDiff)) {
        deleteDiff.length = insertDiff.length = 0;
        deleteDiff.push(...snapshot);
        insertDiff.push(...current);
      }

      if (coll.property.kind === ReferenceKind.ONE_TO_MANY) {
        const cols = coll.property.referencedColumnNames;
        const qb = this.createQueryBuilder(coll.property.type, options?.ctx, 'write')
          .withSchema(this.getSchemaName(meta, options));

        if (coll.getSnapshot() === undefined) {
          if (coll.property.orphanRemoval) {
            const kqb = qb.delete({ [coll.property.mappedBy]: pks })
              .getKnexQuery()
              .whereNotIn(cols, insertDiff as string[][]);

            await this.rethrow(this.execute<any>(kqb));
            continue;
          }

          const kqb = qb.update({ [coll.property.mappedBy]: null })
            .getKnexQuery()
            .whereNotIn(cols, insertDiff as string[][]);

          await this.rethrow(this.execute<any>(kqb));
          continue;
        }

        const kqb = qb.update({ [coll.property.mappedBy]: pks })
          .getKnexQuery()
          .whereIn(cols, insertDiff as string[][]);

        await this.rethrow(this.execute<any>(kqb));
        continue;
      }

      /* istanbul ignore next */
      const pivotMeta = this.metadata.find(coll.property.pivotEntity)!;
      let schema = pivotMeta.schema;

      if (schema === '*') {
        const ownerSchema = wrapped.getSchema() === '*' ? this.config.get('schema') : wrapped.getSchema();
        schema = coll.property.owner ? ownerSchema : this.config.get('schema');
      } else if (schema == null) {
        schema = this.config.get('schema');
      }

      const tableName = `${schema ?? '_'}.${pivotMeta.tableName}`;
      const persister = groups[tableName] ??= new PivotCollectionPersister(pivotMeta, this, options?.ctx, schema);
      persister.enqueueUpdate(coll.property, insertDiff, deleteDiff, pks);
    }

    for (const persister of Utils.values(groups)) {
      await this.rethrow(persister.execute());
    }
  }

  override async loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where: FilterQuery<any> = {} as FilterQuery<any>, orderBy?: OrderDefinition<T>, ctx?: Transaction, options?: FindOptions<T, any, any, any>, pivotJoin?: boolean): Promise<Dictionary<T[]>> {
    const pivotMeta = this.metadata.find(prop.pivotEntity)!;
    const pivotProp1 = pivotMeta.relations[prop.owner ? 1 : 0];
    const pivotProp2 = pivotMeta.relations[prop.owner ? 0 : 1];
    const ownerMeta = this.metadata.find(pivotProp2.type)!;
    options = { ...options };
    const qb = this.createQueryBuilder<T>(prop.pivotEntity, ctx, options.connectionType, undefined, options?.logging)
      .withSchema(this.getSchemaName(pivotMeta, options))
      .indexHint(options.indexHint!)
      .comment(options.comments!)
      .hintComment(options.hintComments!);
    const pivotAlias = qb.alias;
    const pivotKey = pivotProp2.joinColumns.map(column => `${pivotAlias}.${column}`).join(Utils.PK_SEPARATOR);
    const cond = {
      [pivotKey]: { $in: ownerMeta.compositePK ? owners : owners.map(o => o[0]) },
    };

    /* istanbul ignore if */
    if (!Utils.isEmpty(where) && Object.keys(where as Dictionary).every(k => Utils.isOperator(k, false))) {
      where = cond as FilterQuery<T>;
    } else {
      where = { ...(where as Dictionary), ...cond } as FilterQuery<T>;
    }

    orderBy = this.getPivotOrderBy(prop, pivotProp1, pivotAlias, orderBy);
    const populate = this.autoJoinOneToOneOwner(prop.targetMeta!, []);
    const fields = [] as Field<T>[];
    const k1 = !prop.owner ? 'joinColumns' : 'inverseJoinColumns';
    const k2 = prop.owner ? 'joinColumns' : 'inverseJoinColumns';
    const cols = [
      ...prop[k1].map(col => `${pivotAlias}.${col} as fk__${col}`),
      ...prop[k2].map(col => `${pivotAlias}.${col} as fk__${col}`),
    ];
    fields.push(...cols as string[]);

    if (!pivotJoin) {
      const targetAlias = qb.getNextAlias(prop.targetMeta!.tableName);
      const targetSchema = this.getSchemaName(prop.targetMeta, options) ?? this.platform.getDefaultSchemaName();
      qb.innerJoin(pivotProp1.name, targetAlias, {}, targetSchema);
      const targetFields = this.buildFields(prop.targetMeta!, (options.populate ?? []) as unknown as PopulateOptions<T>[], [], qb, targetAlias, options);

      for (const field of targetFields) {
        const f = field.toString();
        fields.unshift(f.includes('.') ? field as string : `${targetAlias}.${f}`);

        if (RawQueryFragment.isKnownFragment(field as string)) {
          qb.rawFragments.add(f);
        }
      }

      // we need to handle 1:1 owner auto-joins explicitly, as the QB type is the pivot table, not the target
      populate.forEach(hint => {
        const alias = qb.getNextAlias(prop.targetMeta!.tableName);
        qb.leftJoin(`${targetAlias}.${hint.field}`, alias);

        // eslint-disable-next-line dot-notation
        for (const join of Object.values(qb['_joins'])) {
          const [propName] = hint.field.split(':', 2);
          if (join.alias === alias && join.prop.name === propName) {
            fields.push(...qb.helper.mapJoinColumns(qb.type!, join) as Field<T>[]);
          }
        }
      });
    }

    qb.select(fields)
      .where({ [pivotProp1.name]: where })
      .orderBy(orderBy)
      .setLockMode(options.lockMode, options.lockTableAliases);

    if (owners.length === 1 && (options.offset != null || options.limit != null)) {
      qb.limit(options.limit, options.offset);
    }

    // console.log('pivot qb', qb, qb._fields);
    const res = owners.length ? await this.rethrow(qb.execute('all', { mergeResults: false, mapResults: false })) : [];
    // console.log(res);
    // const items = res.map((row: Dictionary) => super.mapResult(row, prop.targetMeta));
    const tmp: Dictionary = {};
    // const items = res.map((row: Dictionary) => this.mapResult(row, prop.targetMeta!, populate, qb, tmp));
    // const items = res.map((row: Dictionary) => this.mapResult(row, pivotMeta, populate, qb, tmp));
    const items = res.map((row: Dictionary) => {
      const root = super.mapResult(row, prop.targetMeta);
      this.mapJoinedProps<T>(root!, prop.targetMeta!, populate, qb, root!, tmp, pivotMeta.className + '.' + pivotProp1.name);

      return root;
    });
    // console.log(prop.name, prop.targetMeta!.className, items);
    qb.clearRawFragmentsCache();

    const map: Dictionary<T[]> = {};
    const pkProps = ownerMeta.getPrimaryProps();

    for (const owner of owners) {
      const key = Utils.getPrimaryKeyHash(prop.joinColumns.map((_col, idx) => {
        const pkProp = pkProps[idx];
        return pkProp.customType ? pkProp.customType.convertToJSValue(owner[idx], this.platform) : owner[idx];
      }));

      map[key] = [];
    }

    for (const item of items) {
      const key = Utils.getPrimaryKeyHash(prop.joinColumns.map((col, idx) => {
        const pkProp = pkProps[idx];
        return pkProp.customType ? pkProp.customType.convertToJSValue(item[`fk__${col}`], this.platform) : item[`fk__${col}`];
      }));
      map[key].push(item);
      prop.joinColumns.forEach(col => delete item[`fk__${col}`]);
      prop.inverseJoinColumns.forEach((col, idx) => {
        Utils.renameKey(item, `fk__${col}`, prop.targetMeta!.primaryKeys[idx]);
      });
    }

    return map;
  }

  private getPivotOrderBy<T>(prop: EntityProperty<T>, pivotProp: EntityProperty, pivotAlias: string, orderBy?: OrderDefinition<T>): QueryOrderMap<T>[] {
    // FIXME this is ignoring the rest of the array items
    if (!Utils.isEmpty(orderBy)) {
      return [{ [pivotProp.name]: Utils.asArray(orderBy)[0] }] as QueryOrderMap<T>[];
    }

    if (!Utils.isEmpty(prop.orderBy)) {
      return [{ [pivotProp.name]: Utils.asArray(prop.orderBy)[0] }] as QueryOrderMap<T>[];
    }

    if (prop.fixedOrder) {
      return [{ [`${pivotAlias}.${prop.fixedOrderColumn}`]: QueryOrder.ASC } as QueryOrderMap<T>];
    }

    return [];
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(queryOrKnex: string | Knex.QueryBuilder | Knex.Raw, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction, loggerContext?: LoggingOptions): Promise<T> {
    return this.rethrow(this.connection.execute(queryOrKnex, params, method, ctx, loggerContext));
  }

  /**
   * 1:1 owner side needs to be marked for population so QB auto-joins the owner id
   */
  protected autoJoinOneToOneOwner<T extends object>(meta: EntityMetadata<T>, populate: PopulateOptions<T>[], fields: readonly EntityField<T, any>[] = []): PopulateOptions<T>[] {
    if (!this.config.get('autoJoinOneToOneOwner')) {
      return populate;
    }

    const relationsToPopulate = populate.map(({ field }) => field.split(':')[0]);
    const toPopulate: PopulateOptions<T>[] = meta.relations
      .filter(prop => prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner && !relationsToPopulate.includes(prop.name))
      .filter(prop => fields.length === 0 || fields.some(f => prop.name === f || prop.name.startsWith(`${String(f)}.`)))
      .map(prop => ({ field: `${prop.name}:ref` as any, strategy: prop.strategy }));

    return [...populate, ...toPopulate];
  }

  /**
   * @internal
   */
  joinedProps<T>(meta: EntityMetadata, populate: PopulateOptions<T>[], options?: { strategy?: Options['loadStrategy'] }): PopulateOptions<T>[] {
    return populate.filter(hint => {
      const [propName, ref] = hint.field.split(':', 2);
      const prop = meta.properties[propName] || {};

      if (hint.filter && hint.strategy === LoadStrategy.JOINED) {
        return true;
      }

      if ((options?.strategy || hint.strategy || prop.strategy || this.config.get('loadStrategy')) !== LoadStrategy.JOINED) {
        // force joined strategy for explicit 1:1 owner populate hint as it would require a join anyway
        return prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner;
      }

      return ![ReferenceKind.SCALAR, ReferenceKind.EMBEDDED].includes(prop.kind);
    });
  }

  /**
   * @internal
   */
  mergeJoinedResult<T extends object>(rawResults: EntityData<T>[], meta: EntityMetadata<T>, joinedProps: PopulateOptions<T>[]): EntityData<T>[] {
    const res: EntityData<T>[] = [];
    const map: Dictionary<Dictionary> = {};

    for (const item of rawResults) {
      const pk = Utils.getCompositeKeyHash(item, meta);

      if (map[pk]) {
        for (const hint of joinedProps) {
          const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
          const prop = meta.properties[propName];

          if (!item[propName]) {
            continue;
          }

          if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind) && ref) {
            map[pk][propName] = [...map[pk][propName], ...(item[propName] as T[])];
            continue;
          }

          switch (prop.kind) {
            case ReferenceKind.ONE_TO_MANY:
            case ReferenceKind.MANY_TO_MANY:
              map[pk][propName] = this.mergeJoinedResult<T>([...map[pk][propName], ...(item[propName] as T[])], prop.targetMeta!, hint.children as any ?? []);
              break;
            case ReferenceKind.MANY_TO_ONE:
            case ReferenceKind.ONE_TO_ONE:
              map[pk][propName] = this.mergeJoinedResult<T>([map[pk][propName], item[propName]], prop.targetMeta!, hint.children as any ?? [])[0];
              break;
          }
        }
      } else {
        map[pk] = item;
        res.push(item);
      }
    }

    return res;
  }

  protected getFieldsForJoinedLoad<T extends object>(qb: QueryBuilder<T>, meta: EntityMetadata<T>, explicitFields?: Field<T>[], exclude?: Field<T>[], populate: PopulateOptions<T>[] = [], options?: { strategy?: Options['loadStrategy']; populateWhere?: FindOptions<any>['populateWhere'] }, parentTableAlias?: string, parentJoinPath?: string): Field<T>[] {
    const fields: Field<T>[] = [];
    const joinedProps = this.joinedProps(meta, populate, options);

    if (explicitFields?.includes('*')) {
      fields.push('*');
    }

    const shouldHaveColumn = <U>(prop: EntityProperty<U>, populate: PopulateOptions<U>[], fields?: Field<U>[]) => {
      if (!this.platform.shouldHaveColumn(prop, populate, exclude as string[])) {
        return false;
      }

      if (!fields || prop.primary) {
        return !fields?.includes('*');
      }

      return fields.some(f => f === prop.name || f.toString().startsWith(prop.name + '.'));
    };

    const populateWhereAll = (options as Dictionary)?._populateWhere === 'all' || Utils.isEmpty((options as Dictionary)?._populateWhere);

    // root entity is already handled, skip that
    if (parentJoinPath) {
      // alias all fields in the primary table
      meta.props
        .filter(prop => shouldHaveColumn(prop, populate, explicitFields))
        .forEach(prop => fields.push(...this.mapPropToFieldNames(qb, prop, parentTableAlias)));
    }

    joinedProps.forEach(hint => {
      const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
      const prop = meta.properties[propName];

      // ignore ref joins of known FKs unless it's a filter hint
      if (ref && !hint.filter && (prop.kind === ReferenceKind.MANY_TO_ONE || (prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner))) {
        // // console.log('wat', hint);
        return;
      }

      const meta2 = this.metadata.find<T>(prop.type)!;
      const pivotRefJoin = prop.kind === ReferenceKind.MANY_TO_MANY && ref;
      const tableAlias = qb.getNextAlias(prop.name);
      const field = parentTableAlias ? `${parentTableAlias}.${prop.name}` : prop.name;
      let path = parentJoinPath ? `${parentJoinPath}.${prop.name}` : `${meta.name}.${prop.name}`;

      if (!parentJoinPath && populateWhereAll && !hint.filter && !path.startsWith('[populate]')) {
        path = '[populate]' + path;
      }

      const joinType = pivotRefJoin
        ? JoinType.pivotJoin
        : hint.filter && !prop.nullable
          ? JoinType.innerJoin
          : JoinType.leftJoin;
      qb.join(field, tableAlias, {}, joinType, path);

      if (pivotRefJoin) {
        fields.push(
          ...prop.joinColumns!.map(col => qb.helper.mapper(`${tableAlias}.${col}`, qb.type, undefined, `${tableAlias}__${col}`)),
          ...prop.inverseJoinColumns!.map(col => qb.helper.mapper(`${tableAlias}.${col}`, qb.type, undefined, `${tableAlias}__${col}`)),
        );
      }

      if (prop.kind === ReferenceKind.ONE_TO_MANY && ref) {
        fields.push(...this.getFieldsForJoinedLoad(qb, meta2, prop.referencedColumnNames, undefined, hint.children as any, options, tableAlias, path));
      }

      const childExplicitFields = explicitFields?.filter(f => Utils.isPlainObject(f)).map(o => (o as Dictionary)[prop.name])[0] || [];

      explicitFields?.forEach(f => {
        if (typeof f === 'string' && f.startsWith(`${prop.name}.`)) {
          childExplicitFields.push(f.substring(prop.name.length + 1));
        }
      });

      const childExclude = exclude ? Utils.extractChildElements(exclude as string[], prop.name) : exclude;

      if (!ref) {
        fields.push(...this.getFieldsForJoinedLoad(qb, meta2, childExplicitFields.length === 0 ? undefined : childExplicitFields, childExclude, hint.children as any, options, tableAlias, path));
      } else if (hint.filter) {
        // fields.push(field);
        fields.push(...prop.referencedColumnNames!.map(col => qb.helper.mapper(`${tableAlias}.${col}`, qb.type, undefined, `${tableAlias}__${col}`)));
      }
    });
    // // console.log(fields, joinedProps);

    return fields;
  }

  /**
   * @internal
   */
  mapPropToFieldNames<T extends object>(qb: QueryBuilder<T>, prop: EntityProperty<T>, tableAlias?: string): Field<T>[] {
    const aliased = this.platform.quoteIdentifier(tableAlias ? `${tableAlias}__${prop.fieldNames[0]}` : prop.fieldNames[0]);

    if (tableAlias && prop.customTypes?.some(type => type?.convertToJSValueSQL)) {
      return prop.fieldNames.map((col, idx) => {
        if (!prop.customTypes[idx]?.convertToJSValueSQL) {
          return col;
        }

        const prefixed = this.platform.quoteIdentifier(`${tableAlias}.${col}`);
        const aliased = this.platform.quoteIdentifier(`${tableAlias}__${col}`);

        return raw(`${prop.customTypes[idx]!.convertToJSValueSQL!(prefixed, this.platform)} as ${aliased}`);
      });
    }

    if (tableAlias && prop.customType?.convertToJSValueSQL) {
      const prefixed = this.platform.quoteIdentifier(`${tableAlias}.${prop.fieldNames[0]}`);
      return [raw(`${prop.customType.convertToJSValueSQL(prefixed, this.platform)} as ${aliased}`)];
    }

    if (prop.formula) {
      const alias = this.platform.quoteIdentifier(tableAlias ?? qb.alias);
      return [raw(`${prop.formula!(alias)} as ${aliased}`)];
    }

    if (tableAlias) {
      return prop.fieldNames.map(fieldName => {
        return `${tableAlias}.${fieldName} as ${tableAlias}__${fieldName}`;
      });
    }

    return prop.fieldNames;
  }

  /** @internal */
  createQueryBuilder<T extends object>(entityName: EntityName<T> | QueryBuilder<T>, ctx?: Transaction<Knex.Transaction>, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean, loggerContext?: LoggingOptions): QueryBuilder<T> {
    const connectionType = this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new QueryBuilder<T>(
      entityName,
      this.metadata,
      this,
      ctx,
      undefined,
      connectionType,
      undefined,
      loggerContext,
    );

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

  protected resolveConnectionType(args: { ctx?: Transaction<Knex.Transaction>; connectionType?: ConnectionType }) {
    if (args.ctx) {
      return 'write';
    }

    if (args.connectionType) {
      return args.connectionType;
    }

    if (this.config.get('preferReadReplicas')) {
      return 'read';
    }

    return 'write';
  }

  protected extractManyToMany<T>(entityName: string, data: EntityDictionary<T>): EntityData<T> {
    if (!this.metadata.has(entityName)) {
      return {};
    }

    const ret: EntityData<T> = {};

    this.metadata.find<T>(entityName)!.relations.forEach(prop => {
      if (prop.kind === ReferenceKind.MANY_TO_MANY && data[prop.name]) {
        ret[prop.name] = data[prop.name].map((item: Primary<T>) => Utils.asArray(item));
        delete data[prop.name];
      }
    });

    return ret;
  }

  protected async processManyToMany<T extends object>(meta: EntityMetadata<T> | undefined, pks: Primary<T>[], collections: EntityData<T>, clear: boolean, options?: DriverMethodOptions) {
    if (!meta) {
      return;
    }

    for (const prop of meta.relations) {
      if (collections[prop.name]) {
        const pivotMeta = this.metadata.find(prop.pivotEntity)!;
        const persister = new PivotCollectionPersister(pivotMeta, this, options?.ctx, options?.schema);
        persister.enqueueUpdate(prop, collections[prop.name] as Primary<T>[][], clear, pks);
        await this.rethrow(persister.execute());
      }
    }
  }

  override async lockPessimistic<T extends object>(entity: T, options: LockOptions): Promise<void> {
    const meta = helper(entity).__meta;
    const qb = this.createQueryBuilder((entity as object).constructor.name, options.ctx, undefined, undefined, options.logging).withSchema(options.schema ?? meta.schema);
    const cond = Utils.getPrimaryKeyCond(entity, meta.primaryKeys);
    qb.select(raw('1')).where(cond!).setLockMode(options.lockMode, options.lockTableAliases);
    await this.rethrow(qb.execute());
  }

  protected buildPopulateWhere<T extends object>(meta: EntityMetadata<T>, joinedProps: PopulateOptions<T>[], options: Pick<FindOptions<any>, 'populateWhere'>): ObjectQuery<T> {
    const where = {} as ObjectQuery<T>;

    for (const hint of joinedProps) {
      const [propName] = hint.field.split(':', 2) as [EntityKey<T>];
      const prop = meta.properties[propName];

      if (!Utils.isEmpty(prop.where)) {
        where[prop.name] = Utils.copy(prop.where);
      }

      if (hint.children) {
        const inner = this.buildPopulateWhere(prop.targetMeta!, hint.children as any, {});

        if (!Utils.isEmpty(inner)) {
          where[prop.name] ??= {} as any;
          Object.assign(where[prop.name] as object, inner);
        }
      }
    }

    if (Utils.isEmpty(options.populateWhere)) {
      return where;
    }

    if (Utils.isEmpty(where)) {
      return options.populateWhere as ObjectQuery<T>;
    }

    /* istanbul ignore next */
    return { $and: [options.populateWhere, where] } as ObjectQuery<T>;
  }

  protected buildOrderBy<T extends object>(qb: QueryBuilder<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], options: Pick<FindOptions<any>, 'strategy' | 'orderBy' | 'populateOrderBy'>): QueryOrderMap<T>[] {
    const joinedProps = this.joinedProps(meta, populate, options);
    // `options._populateWhere` is a copy of the value provided by user with a fallback to the global config option
    // as `options.populateWhere` will be always recomputed to respect filters
    const populateWhereAll = (options as Dictionary)._populateWhere !== 'infer' && !Utils.isEmpty((options as Dictionary)._populateWhere);
    const path = (populateWhereAll ? '[populate]' : '') + meta.className;
    const populateOrderBy = this.buildPopulateOrderBy(qb, meta, Utils.asArray<QueryOrderMap<T>>(options.populateOrderBy ?? options.orderBy), path, !!options.populateOrderBy);
    const joinedPropsOrderBy = this.buildJoinedPropsOrderBy(qb, meta, joinedProps, options, path);

    return [...Utils.asArray(options.orderBy), ...populateOrderBy, ...joinedPropsOrderBy] as QueryOrderMap<T>[];
  }

  protected buildPopulateOrderBy<T extends object>(qb: QueryBuilder<T>, meta: EntityMetadata<T>, populateOrderBy: QueryOrderMap<T>[], parentPath: string, explicit: boolean, parentAlias = qb.alias): QueryOrderMap<T>[] {
    const orderBy: QueryOrderMap<T>[] = [];

    for (let i = 0; i < populateOrderBy.length; i++) {
      const orderHint = populateOrderBy[i];

      for (const propName of Utils.keys(orderHint)) {
        const raw = RawQueryFragment.getKnownFragment(propName, explicit);

        if (raw) {
          const sql = raw.sql.replace(new RegExp(ALIAS_REPLACEMENT_RE, 'g'), parentAlias);
          const raw2 = new RawQueryFragment(sql, raw.params);
          orderBy.push({ [raw2 as EntityKey]: orderHint[propName] } as QueryOrderMap<T>);
          continue;
        }

        const prop = meta.properties[propName];

        if (!prop) {
          throw new Error(`Trying to order by not existing property ${meta.className}.${propName}`);
        }

        const meta2 = this.metadata.find<T>(prop.type)!;
        const childOrder = orderHint[prop.name] as Dictionary;
        let path = `${parentPath}.${propName}`;

        if (prop.kind === ReferenceKind.MANY_TO_MANY && typeof childOrder !== 'object') {
          path += '[pivot]';
        }

        const join = qb.getJoinForPath(path, { matchPopulateJoins: true });
        const propAlias = qb.getAliasForJoinPath(join ?? path, { matchPopulateJoins: true }) ?? parentAlias;

        if (!join && parentAlias === qb.alias) {
          continue;
        }

        if (![ReferenceKind.SCALAR, ReferenceKind.EMBEDDED].includes(prop.kind) && typeof childOrder === 'object') {
          const children = this.buildPopulateOrderBy(qb, meta2, Utils.asArray(childOrder as QueryOrderMap<T>), path, explicit, propAlias);
          orderBy.push(...children);
          continue;
        }

        if (prop.kind === ReferenceKind.MANY_TO_MANY && join) {
          if (prop.fixedOrderColumn) {
            orderBy.push({ [`${join.alias}.${prop.fixedOrderColumn}`]: childOrder } as QueryOrderMap<T>);
          } else {
            for (const col of prop.inverseJoinColumns) {
              orderBy.push({ [`${join.ownerAlias}.${col}`]: childOrder } as QueryOrderMap<T>);
            }
          }

          continue;
        }

        const order = typeof childOrder === 'object' ? childOrder[propName] : childOrder;
        orderBy.push({ [`${propAlias}.${propName}` as EntityKey]: order } as QueryOrderMap<T>);
      }
    }

    return orderBy;
  }

  protected buildJoinedPropsOrderBy<T extends object>(qb: QueryBuilder<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], options?: Pick<FindOptions<any>, 'strategy' | 'orderBy' | 'populateOrderBy'>, parentPath?: string): QueryOrderMap<T>[] {
    const orderBy: QueryOrderMap<T>[] = [];
    const joinedProps = this.joinedProps(meta, populate, options);

    for (const hint of joinedProps) {
      const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
      const prop = meta.properties[propName];
      const propOrderBy = prop.orderBy;
      let path = `${parentPath}.${propName}`;

      if (prop.kind === ReferenceKind.MANY_TO_MANY && ref) {
        path += '[pivot]';
      }

      const join = qb.getJoinForPath(path, { matchPopulateJoins: true });
      const propAlias = qb.getAliasForJoinPath(join ?? path, { matchPopulateJoins: true });

      const meta2 = this.metadata.find<T>(prop.type)!;

      if (prop.kind === ReferenceKind.MANY_TO_MANY && prop.fixedOrder && join) {
        const alias = ref ? propAlias : join.ownerAlias;
        orderBy.push({ [`${alias}.${prop.fixedOrderColumn}`]: QueryOrder.ASC } as QueryOrderMap<T>);
      }

      if (propOrderBy) {
        for (const item of Utils.asArray(propOrderBy)) {
          for (const field of Utils.keys(item)) {
            const rawField = RawQueryFragment.getKnownFragment(field, false);

            if (rawField) {
              const sql = propAlias ? rawField.sql.replace(new RegExp(ALIAS_REPLACEMENT_RE, 'g'), propAlias) : rawField.sql;
              const raw2 = raw(sql, rawField.params);
              orderBy.push({ [raw2.toString()]: item[field] } as QueryOrderMap<T>);
              continue;
            }

            orderBy.push({ [`${propAlias}.${field}` as EntityKey]: item[field] } as QueryOrderMap<T>);
          }
        }
      }

      if (hint.children) {
        const buildJoinedPropsOrderBy = this.buildJoinedPropsOrderBy(qb, meta2, hint.children as any, options, path);
        orderBy.push(...buildJoinedPropsOrderBy);
      }
    }

    return orderBy;
  }

  protected normalizeFields<T extends object>(fields: Field<T>[], prefix = ''): string[] {
    const ret: string[] = [];

    for (const field of fields) {
      if (typeof field === 'string') {
        ret.push(prefix + field);
        continue;
      }

      if (Utils.isPlainObject(field)) {
        for (const key of Object.keys(field)) {
          ret.push(...this.normalizeFields((field as Dictionary)[key], key + '.'));
        }
      }
    }

    return ret;
  }

  protected processField<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T> | undefined, field: string, ret: Field<T>[], populate: PopulateOptions<T>[], joinedProps: PopulateOptions<T>[], qb: QueryBuilder<T>): void {
    if (!prop || (prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner)) {
      return;
    }

    if (prop.kind === ReferenceKind.EMBEDDED) {
      if (prop.object) {
        ret.push(prop.name);
        return;
      }

      const parts = field.split('.');
      const top = parts.shift();

      for (const key of Object.keys(prop.embeddedProps)) {
        if (!top || key === top) {
          this.processField(meta, prop.embeddedProps[key], parts.join('.'), ret, populate, joinedProps, qb);
        }
      }

      return;
    }

    if (prop.persist === false && !prop.embedded && !prop.formula) {
      return;
    }

    ret.push(prop.name);
  }

  protected buildFields<T extends object>(meta: EntityMetadata<T>, populate: PopulateOptions<T>[], joinedProps: PopulateOptions<T>[], qb: QueryBuilder<T>, alias: string, options: Pick<FindOptions<T, any, any, any>, 'strategy' | 'fields' | 'exclude'>): Field<T>[] {
    const lazyProps = meta.props.filter(prop => prop.lazy && !populate.some(p => p.field === prop.name || p.all));
    const hasLazyFormulas = meta.props.some(p => p.lazy && p.formula);
    const requiresSQLConversion = meta.props.some(p => p.customType?.convertToJSValueSQL && p.persist !== false);
    const hasExplicitFields = !!options.fields;
    const ret: Field<T>[] = [];
    let addFormulas = false;

    // handle root entity properties first, this is used for both strategies in the same way
    if (options.fields) {
      for (const field of this.normalizeFields(options.fields as string[])) {
        if (field === '*') {
          ret.push('*');
          continue;
        }

        const parts = field.split('.');
        const rootPropName = parts.shift()!; // first one is the `prop`
        const prop = QueryHelper.findProperty<T>(rootPropName, {
          metadata: this.metadata,
          platform: this.platform,
          entityName: meta.className,
          where: {} as FilterQuery<T>,
          aliasMap: qb.getAliasMap(),
        });

        this.processField(meta, prop, parts.join('.'), ret, populate, joinedProps, qb);
      }

      if (!options.fields.includes('*') && !options.fields.includes(`${qb.alias}.*`)) {
        ret.unshift(...meta.primaryKeys.filter(pk => !options.fields!.includes(pk)));
      }
    } else if (!Utils.isEmpty(options.exclude) || lazyProps.some(p => !p.formula)) {
      const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate, options.exclude as string[], false));
      ret.push(...props.filter(p => !lazyProps.includes(p)).map(p => p.name));
      addFormulas = true;
    } else if (hasLazyFormulas || requiresSQLConversion) {
      ret.push('*');
      addFormulas = true;
    } else {
      ret.push('*');
    }

    if (ret.length > 0 && !hasExplicitFields && addFormulas) {
      meta.props
        .filter(prop => prop.formula && !lazyProps.includes(prop))
        .forEach(prop => {
          const a = this.platform.quoteIdentifier(alias);
          const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
          ret.push(raw(`${prop.formula!(a)} as ${aliased}`));
        });

      meta.props
        .filter(prop => !prop.object && (prop.hasConvertToDatabaseValueSQL || prop.hasConvertToJSValueSQL))
        .forEach(prop => ret.push(prop.name));
    }

    // add joined relations after the root entity fields
    if (joinedProps.length > 0) {
      ret.push(...this.getFieldsForJoinedLoad(qb, meta, options.fields as string[], options.exclude as string[], populate, options, alias));
    }

    return Utils.unique(ret);
  }

}
