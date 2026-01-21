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
  type EntityDataValue,
  type EntityDictionary,
  type EntityField,
  type EntityKey,
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
  type FormulaTable,
  getLoadingStrategy,
  getOnConflictFields,
  getOnConflictReturningFields,
  helper,
  isRaw,
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
  type PopulatePath,
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
  type StreamOptions,
  type Transaction,
  type UpsertManyOptions,
  type UpsertOptions,
  Utils,
} from '@mikro-orm/core';
import type { AbstractSqlConnection } from './AbstractSqlConnection.js';
import type { AbstractSqlPlatform } from './AbstractSqlPlatform.js';
import { QueryBuilder } from './query/QueryBuilder.js';
import { type NativeQueryBuilder } from './query/NativeQueryBuilder.js';
import { JoinType, QueryType } from './query/enums.js';
import { SqlEntityManager } from './SqlEntityManager.js';
import type { Field } from './typings.js';
import { PivotCollectionPersister } from './PivotCollectionPersister.js';

export abstract class AbstractSqlDriver<
  Connection extends AbstractSqlConnection = AbstractSqlConnection,
  Platform extends AbstractSqlPlatform = AbstractSqlPlatform,
> extends DatabaseDriver<Connection> {

  override [EntityManagerType]!: SqlEntityManager<this>;

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

  override createEntityManager(useContext?: boolean): this[typeof EntityManagerType] {
    const EntityManagerClass = this.config.get('entityManager', SqlEntityManager);
    return new EntityManagerClass(this.config, this, this.metadata, useContext);
  }

  private async createQueryBuilderFromOptions<T extends object>(meta: EntityMetadata<T>, where: FilterQuery<T>, options: FindOptions<T, any, any, any> = {}): Promise<QueryBuilder<T, any, any, any>> {
    const connectionType = this.resolveConnectionType({ ctx: options.ctx, connectionType: options.connectionType });
    const populate = this.autoJoinOneToOneOwner(meta, options.populate as unknown as PopulateOptions<T>[], options.fields);
    const joinedProps = this.joinedProps(meta, populate, options);
    const schema = this.getSchemaName(meta, options);
    const qb = this.createQueryBuilder(meta.class, options.ctx, connectionType, false, options.logging, undefined, options.em as any)
      .withSchema(schema);
    const fields = this.buildFields(meta, populate, joinedProps, qb, qb.alias, options, schema);
    const orderBy = this.buildOrderBy(qb, meta, populate, options);
    const populateWhere = this.buildPopulateWhere(meta, joinedProps, options);
    Utils.asArray(options.flags).forEach(flag => qb.setFlag(flag));

    if (Utils.isPrimaryKey(where, meta.compositePK)) {
      where = { [Utils.getPrimaryKeyHash(meta.primaryKeys)]: where } as ObjectQuery<T>;
    }

    const { first, last, before, after } = options as FindByCursorOptions<T>;
    const isCursorPagination = [first, last, before, after].some(v => v != null);
    qb.__populateWhere = (options as Dictionary)._populateWhere;
    qb.select(fields)
      // only add populateWhere if we are populate-joining, as this will be used to add `on` conditions
      .populate(
        populate,
        joinedProps.length > 0 ? populateWhere : undefined,
        joinedProps.length > 0 ? options.populateFilter : undefined,
      )
      .where(where)
      .groupBy(options.groupBy!)
      .having(options.having!)
      .indexHint(options.indexHint!)
      .comment(options.comments!)
      .hintComment(options.hintComments!);

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

    if (options.em) {
      await qb.applyJoinedFilters(options.em, options.filters);
    }

    return qb;
  }

  async find<T extends object, P extends string = never, F extends string = PopulatePath.ALL, E extends string = never>(entityName: EntityName<T>, where: ObjectQuery<T>, options: FindOptions<T, P, F, E> = {}): Promise<EntityData<T>[]> {
    options = { populate: [], orderBy: [], ...options };
    const meta = this.metadata.get(entityName);

    if (meta.virtual) {
      return this.findVirtual<T>(entityName, where, options);
    }

    const qb = await this.createQueryBuilderFromOptions(meta, where, options);
    const result = await this.rethrow(qb.execute('all'));

    if (options.last && !options.first) {
      result.reverse();
    }

    return result;
  }

  async findOne<T extends object, P extends string = never, F extends string = PopulatePath.ALL, E extends string = never>(entityName: EntityName<T>, where: ObjectQuery<T>, options?: FindOneOptions<T, P, F, E>): Promise<EntityData<T> | null> {
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

  override async findVirtual<T extends object>(entityName: EntityName<T>, where: ObjectQuery<T>, options: FindOptions<T, any, any, any>): Promise<EntityData<T>[]> {
    return this.findFromVirtual(entityName, where, options, QueryType.SELECT) as Promise<EntityData<T>[]>;
  }

  override async countVirtual<T extends object>(entityName: EntityName<T>, where: ObjectQuery<T>, options: CountOptions<T, any>): Promise<number> {
    return this.findFromVirtual(entityName, where, options, QueryType.COUNT) as Promise<number>;
  }

  protected async findFromVirtual<T extends object>(entityName: EntityName<T>, where: ObjectQuery<T>, options: FindOptions<T, any> | CountOptions<T, any>, type: QueryType): Promise<EntityData<T>[] | number> {
    const meta = this.metadata.get<T>(entityName);

    /* v8 ignore next */
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

    if (res instanceof RawQueryFragment) {
      const expr = this.platform.formatQuery(res.sql, res.params);
      return this.wrapVirtualExpressionInSubquery(meta, expr, where, options as FindOptions<T, any>, type);
    }

    /* v8 ignore next */
    return res as EntityData<T>[];
  }

  protected async *streamFromVirtual<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: StreamOptions<T, any>): AsyncIterableIterator<EntityData<T>> {
    const meta = this.metadata.get<T>(entityName);

    /* v8 ignore next */
    if (!meta.expression) {
      return;
    }

    if (typeof meta.expression === 'string') {
      yield* this.wrapVirtualExpressionInSubqueryStream(meta, meta.expression, where, options as FindOptions<T, any>, QueryType.SELECT);
      return;
    }

    const em = this.createEntityManager();
    em.setTransactionContext(options.ctx);
    const res = meta.expression(em, where as any, options as FindOptions<T, any, any, any>, true);

    if (typeof res === 'string') {
      yield* this.wrapVirtualExpressionInSubqueryStream(meta, res, where, options as FindOptions<T, any>, QueryType.SELECT);
      return;
    }

    if (res instanceof QueryBuilder) {
      yield* this.wrapVirtualExpressionInSubqueryStream(meta, res.getFormattedQuery(), where, options as FindOptions<T, any>, QueryType.SELECT);
      return;
    }

    if (res instanceof RawQueryFragment) {
      const expr = this.platform.formatQuery(res.sql, res.params);
      yield* this.wrapVirtualExpressionInSubqueryStream(meta, expr, where, options as FindOptions<T, any>, QueryType.SELECT);
      return;
    }

    /* v8 ignore next */
    yield* res as EntityData<T>[];
  }

  protected async wrapVirtualExpressionInSubquery<T extends object>(meta: EntityMetadata<T>, expression: string, where: FilterQuery<T>, options: FindOptions<T, any>, type: QueryType): Promise<T[] | number> {
    const qb = await this.createQueryBuilderFromOptions(meta, where, options);
    qb.setFlag(QueryFlag.DISABLE_PAGINATE);
    const isCursorPagination = [
      options.first,
      options.last,
      options.before,
      options.after,
    ].some(v => v != null);
    const native = qb.getNativeQuery(false);

    if (type === QueryType.COUNT) {
      native
        .clear('select')
        .clear('limit')
        .clear('offset')
        .count();
    }

    native.from(raw(`(${expression}) as ${this.platform.quoteIdentifier(qb.alias)}`));
    const query = native.compile();
    const res = await this.execute<T[]>(query.sql, query.params, 'all', options.ctx);

    if (type === QueryType.COUNT) {
      return (res[0] as Dictionary).count;
    }

    if (isCursorPagination && !options.first && !!options.last) {
      res.reverse();
    }

    return res.map(row => this.mapResult(row, meta) as T);
  }

  protected async *wrapVirtualExpressionInSubqueryStream<T extends object>(meta: EntityMetadata<T>, expression: string, where: FilterQuery<T>, options: FindOptions<T, any, any, any>, type: QueryType.SELECT): AsyncIterableIterator<T> {
    const qb = await this.createQueryBuilderFromOptions(meta, where, options);
    qb.unsetFlag(QueryFlag.DISABLE_PAGINATE);
    const native = qb.getNativeQuery(false);
    native.from(raw(`(${expression}) as ${this.platform.quoteIdentifier(qb.alias)}`));
    const query = native.compile();

    const connectionType = this.resolveConnectionType({ ctx: options.ctx, connectionType: options.connectionType });
    const res = this.getConnection(connectionType).stream<T>(query.sql, query.params, options.ctx, options.loggerContext);

    for await (const row of res) {
      yield this.mapResult(row, meta) as T;
    }
  }

  override mapResult<T extends object>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[] = [], qb?: QueryBuilder<T, any, any, any>, map: Dictionary = {}): EntityData<T> | null {
    const ret = super.mapResult(result, meta);

    /* v8 ignore next */
    if (!ret) {
      return null;
    }

    if (qb) {
      // here we map the aliased results (cartesian product) to an object graph
      this.mapJoinedProps<T>(ret, meta, populate, qb, ret, map);
    }

    return ret;
  }

  private mapJoinedProps<T extends object>(result: EntityData<T>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], qb: QueryBuilder<T, any, any, any>, root: EntityData<T>, map: Dictionary, parentJoinPath?: string) {
    const joinedProps = this.joinedProps(meta, populate);

    joinedProps.forEach(hint => {
      const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
      const prop = meta.properties[propName];

      /* v8 ignore next */
      if (!prop) {
        return;
      }

      const pivotRefJoin = prop.kind === ReferenceKind.MANY_TO_MANY && ref;
      const meta2 = prop.targetMeta as EntityMetadata<T>;
      let path = parentJoinPath ? `${parentJoinPath}.${prop.name}` : `${meta.name}.${prop.name}`;

      if (!parentJoinPath) {
        path = '[populate]' + path;
      }

      if (pivotRefJoin) {
        path += '[pivot]';
      }

      const relationAlias = qb.getAliasForJoinPath(path, { matchPopulateJoins: true });

      /* v8 ignore next */
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

        result[prop.name] ??= [] as EntityDataValue<T>;

        if (item) {
          (result[prop.name] as EntityData<T>[]).push(item);
        }

        return;
      }

      const mapToPk = !hint.dataOnly && !!(ref || prop.mapToPk);
      const targetProps = mapToPk
        ? meta2.getPrimaryProps()
        : meta2.props.filter(prop => this.platform.shouldHaveColumn(prop, hint.children as any || []));

      // If the primary key value for the relation is null, we know we haven't joined to anything
      // and therefore we don't return any record (since all values would be null)
      const hasPK = meta2.getPrimaryProps().every(pk => pk.fieldNames.every(name => {
        return root![`${relationAlias}__${name}` as EntityKey] != null;
      }));

      if (!hasPK) {
        if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind)) {
          result[prop.name] = [] as EntityDataValue<T>;
        }

        if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
          result[prop.name] = null;
        }

        for (const prop of targetProps) {
          for (const name of prop.fieldNames) {
            delete root![`${relationAlias}__${name}` as EntityKey<T>];
          }
        }

        return;
      }

      let relationPojo: EntityData<T> = {};

      meta2.props
        .filter(prop => !ref && prop.persist === false && prop.fieldNames)
        .forEach(prop => {
          /* v8 ignore next */
          if (prop.fieldNames.length > 1) { // composite keys
            relationPojo[prop.name as EntityKey<T>] = prop.fieldNames.map(name => root![`${relationAlias}__${name}` as EntityKey<T>]) as EntityDataValue<T>;
          } else {
            const alias =
              `${relationAlias}__${prop.fieldNames[0]}` as EntityKey<T>;
            relationPojo[prop.name] = root![alias] as EntityDataValue<T>;
          }
        });

      const tz = this.platform.getTimezone();

      for (const prop of targetProps) {
        if (prop.fieldNames.every(name => typeof root![`${relationAlias}__${name}` as EntityKey<T>] === 'undefined')) {
          continue;
        }

        if (prop.fieldNames.length > 1) { // composite keys
          const fk = prop.fieldNames.map(name => root![`${relationAlias}__${name}` as EntityKey<T>]) as Primary<T>[];
          const pk = Utils.mapFlatCompositePrimaryKey(fk, prop) as unknown[];
          relationPojo[prop.name] = pk.every(val => val != null) ? pk as EntityDataValue<T> : null;
        } else if (prop.runtimeType === 'Date') {
          const alias = `${relationAlias}__${prop.fieldNames[0]}` as EntityKey<T>;
          const value = root![alias] as unknown;

          if (tz && tz !== 'local' && typeof value === 'string' && !value.includes('+') && value.lastIndexOf('-') < 11 && !value.endsWith('Z')) {
            relationPojo[prop.name] = this.platform.parseDate(value + tz) as EntityDataValue<T>;
          } else if (['string', 'number'].includes(typeof value)) {
            relationPojo[prop.name] = this.platform.parseDate(value as string) as EntityDataValue<T>;
          } else {
            relationPojo[prop.name] = value as EntityDataValue<T>;
          }
        } else {
          const alias = `${relationAlias}__${prop.fieldNames[0]}` as EntityKey<T>;
          relationPojo[prop.name] = root![alias];

          if (prop.kind === ReferenceKind.EMBEDDED && (prop.object || meta.embeddable)) {
            const item = parseJsonSafe(relationPojo[prop.name]);

            if (Array.isArray(item)) {
              relationPojo[prop.name] = item.map(row => row == null ? row : this.comparator.mapResult(prop.targetMeta!, row)) as EntityDataValue<T>;
            } else {
              relationPojo[prop.name] = item == null ? item : this.comparator.mapResult(prop.targetMeta!, item) as EntityDataValue<T>;
            }
          }
        }
      }

      // properties can be mapped to multiple places, e.g. when sharing a column in multiple FKs,
      // so we need to delete them after everything is mapped from given level
      for (const prop of targetProps) {
        for (const name of prop.fieldNames) {
          delete root![`${relationAlias}__${name}` as EntityKey<T>];
        }
      }

      if (mapToPk) {
        const tmp = Object.values(relationPojo);
        /* v8 ignore next */
        relationPojo = (meta2.compositePK ? tmp : tmp[0]) as EntityData<T>;
      }

      if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind)) {
        result[prop.name] ??= [] as EntityDataValue<T>;
        (result[prop.name] as EntityData<T>[]).push(relationPojo);
      } else {
        result[prop.name] = relationPojo as EntityDataValue<T>;
      }

      const populateChildren = hint.children as any || [];
      this.mapJoinedProps(relationPojo, meta2, populateChildren, qb, root, map, path);
    });
  }

  async count<T extends object>(entityName: EntityName<T>, where: any, options: CountOptions<T> = {}): Promise<number> {
    const meta = this.metadata.get(entityName);

    if (meta.virtual) {
      return this.countVirtual<T>(entityName, where, options);
    }

    options = { populate: [], ...options };
    const populate = options.populate as unknown as PopulateOptions<T>[];
    const joinedProps = this.joinedProps(meta, populate, options as FindOptions<T>);
    const schema = this.getSchemaName(meta, options);
    const qb = this.createQueryBuilder<T>(entityName, options.ctx, options.connectionType, false, options.logging);
    const populateWhere = this.buildPopulateWhere(meta, joinedProps, options);

    if (meta && !Utils.isEmpty(populate)) {
      this.buildFields(meta, populate, joinedProps, qb, qb.alias, options as FindOptions<T>, schema);
    }

    qb.__populateWhere = (options as Dictionary)._populateWhere;
    qb.indexHint(options.indexHint!)
      .comment(options.comments!)
      .hintComment(options.hintComments!)
      .groupBy(options.groupBy!)
      .having(options.having!)
      .populate(
        populate,
        joinedProps.length > 0 ? populateWhere : undefined,
        joinedProps.length > 0 ? options.populateFilter : undefined,
      )
      .withSchema(schema)
      .where(where);

    if (options.em) {
      await qb.applyJoinedFilters(options.em, options.filters);
    }

    return this.rethrow(qb.getCount());
  }

  async nativeInsert<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get(entityName);
    const collections = this.extractManyToMany(meta, data);
    const qb = this.createQueryBuilder(entityName, options.ctx, 'write', options.convertCustomTypes, options.loggerContext).withSchema(this.getSchemaName(meta, options));
    const res = await this.rethrow(qb.insert(data as unknown as RequiredEntityData<T>).execute('run', false));
    res.row = res.row || {};
    let pk: any;

    if (meta.primaryKeys.length > 1) { // owner has composite pk
      pk = Utils.getPrimaryKeyCond(data as T, meta.primaryKeys);
    } else {
      /* v8 ignore next */
      res.insertId = data[meta.primaryKeys[0]] ?? res.insertId ?? res.row[meta.primaryKeys[0]];
      pk = [res.insertId];
    }

    await this.processManyToMany(meta, pk, collections, false, options);

    return res;
  }

  async nativeInsertMany<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}, transform?: (sql: string) => string): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get(entityName).root;
    const collections = options.processCollections ? data.map(d => this.extractManyToMany(meta, d)) : [];
    const pks = this.getPrimaryKeyFields(meta);
    const set = new Set<EntityKey<T>>();
    data.forEach(row => Utils.keys(row).forEach(k => set.add(k)));
    const props = [...set].map(name => meta.properties[name] ?? { name, fieldNames: [name] }) as EntityProperty<T>[];
    // For STI with conflicting fieldNames, include all alternative columns
    let fields = Utils.flatten(props.map(prop => prop.stiFieldNames ?? prop.fieldNames));
    const duplicates = Utils.findDuplicates(fields);
    const params: unknown[] = [];

    if (duplicates.length) {
      fields = Utils.unique(fields);
    }

    const tableName = this.getTableName(meta, options);
    let sql = `insert into ${tableName} `;
    sql += fields.length > 0 ? '(' + fields.map(k => this.platform.quoteIdentifier(k)).join(', ') + ')' : `(${this.platform.quoteIdentifier(pks[0])})`;

    if (this.platform.usesOutputStatement()) {
      const returningProps = meta.props
        .filter(prop => prop.persist !== false && prop.defaultRaw || prop.autoincrement || prop.generated)
        .filter(prop => !(prop.name in data[0]) || isRaw(data[0][prop.name]));
      const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
      sql += returningFields.length > 0 ? ` output ${returningFields.map(field => 'inserted.' + this.platform.quoteIdentifier(field)).join(', ')}` : '';
    }

    if (fields.length > 0 || this.platform.usesDefaultKeyword()) {
      sql += ' values ';
    } else {
      sql += ' ' + data.map(() => `select null as ${this.platform.quoteIdentifier(pks[0])}`).join(' union all ');
    }

    const addParams = (prop: EntityProperty<T>, row: Dictionary) => {
      const rowValue = row[prop.name];

      if (prop.nullable && rowValue === null) {
        params.push(null);
        return;
      }

      let value = rowValue ?? prop.default;

      if (prop.kind === ReferenceKind.EMBEDDED && prop.object) {
        if (prop.array && value) {
          value = this.platform.cloneEmbeddable(value);

          for (let i = 0; i < (value as Dictionary[]).length; i++) {
            const item = (value as Dictionary[])[i];
            value[i] = this.mapDataToFieldNames(item, false, prop.embeddedProps, options.convertCustomTypes);
          }
        } else {
          value = this.mapDataToFieldNames(value, false, prop.embeddedProps, options.convertCustomTypes);
        }
      }

      if (typeof value === 'undefined' && this.platform.usesDefaultKeyword()) {
        params.push(raw('default'));
        return;
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
          // For STI with conflicting fieldNames, use discriminator to determine which field gets value
          if (prop.stiFieldNames && prop.stiFieldNameMap && meta.discriminatorColumn) {
            const activeField = prop.stiFieldNameMap[row[meta.discriminatorColumn]];
            for (const field of prop.stiFieldNames) {
              params.push(field === activeField ? row[prop.name] : null);
              keys.push('?');
            }
            return;
          }

          if (prop.fieldNames.length > 1) {
            const newFields: string[] = [];
            const rawParam = Utils.asArray(row[prop.name]) ?? prop.fieldNames.map(() => null);
            // Deep flatten nested arrays when needed (for deeply nested composite keys like Tag -> Comment -> Post -> User)
            const needsFlatten = rawParam.length !== prop.fieldNames.length && rawParam.some(v => Array.isArray(v));
            const allParam = needsFlatten ? Utils.flatten(rawParam as unknown[][], true) : rawParam;
            // TODO(v7): instead of making this conditional here, the entity snapshot should respect `ownColumns`,
            //  but that means changing the compiled PK getters, which might be seen as breaking
            const columns = allParam.length > 1 ? prop.fieldNames : prop.ownColumns;
            const param: unknown[] = [];

            columns.forEach((field, idx) => {
              if (usedDups.includes(field)) {
                return;
              }
              newFields.push(field);
              param.push(allParam[idx]);
            });

            newFields.forEach((field, idx) => {
              if (!duplicates.includes(field) || !usedDups.includes(field)) {
                params.push(param[idx]);
                keys.push('?');
                usedDups.push(field);
              }
            });
          } else {
            const field = prop.fieldNames[0];

            if (!duplicates.includes(field) || !usedDups.includes(field)) {
              if (prop.customType && !prop.object && 'convertToDatabaseValueSQL' in prop.customType && row[prop.name] != null && !isRaw(row[prop.name])) {
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
        .filter(prop => !(prop.name in data[0]) || isRaw(data[0][prop.name]));
      const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
      /* v8 ignore next */
      sql += returningFields.length > 0 ? ` returning ${returningFields.map(field => this.platform.quoteIdentifier(field)).join(', ')}` : '';
    }

    if (transform) {
      sql = transform(sql);
    }

    const res = await this.execute<QueryResult<T>>(sql, params, 'run', options.ctx, options.loggerContext);
    let pk: any[];

    /* v8 ignore next */
    if (pks.length > 1) { // owner has composite pk
      pk = data.map(d => Utils.getPrimaryKeyCond(d as T, pks as EntityKey<T>[]));
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

  async nativeUpdate<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> & UpsertOptions<T> = {}): Promise<QueryResult<T>> {
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get(entityName);
    const pks = this.getPrimaryKeyFields(meta);
    const collections = this.extractManyToMany(meta, data);
    let res = { affectedRows: 0, insertId: 0, row: {} } as QueryResult<T>;

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      /* v8 ignore next */
      where = { [meta.primaryKeys[0] ?? pks[0]]: where } as FilterQuery<T>;
    }

    if (Utils.hasObjectKeys(data)) {
      const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes, options.loggerContext)
        .withSchema(this.getSchemaName(meta, options));

      if (options.upsert) {
        /* v8 ignore next */
        const uniqueFields = options.onConflictFields ?? (Utils.isPlainObject(where) ? Utils.keys(where) as EntityKey<T>[] : meta!.primaryKeys) as (keyof T)[];
        const returning = getOnConflictReturningFields(meta, data, uniqueFields, options);
        qb.insert(data as T)
          .onConflict(uniqueFields)
          .returning(returning);

        if (!options.onConflictAction || options.onConflictAction === 'merge') {
          const fields = getOnConflictFields(meta, data, uniqueFields, options);
          qb.merge(fields);
        }

        if (options.onConflictAction === 'ignore') {
          qb.ignore();
        }
      } else {
        qb.update(data).where(where);

        // reload generated columns and version fields
        const returning: string[] = [];
        meta.props
          .filter(prop => (prop.generated && !prop.primary) || prop.version)
          .forEach(prop => returning.push(prop.name));

        qb.returning(returning);
      }

      res = await this.rethrow(qb.execute('run', false));
    }

    /* v8 ignore next */
    const pk = pks.map(pk => Utils.extractPK<T>(data[pk] || where, meta)!) as Primary<T>[];
    await this.processManyToMany<T>(meta, pk, collections, true, options);

    return res;
  }

  override async nativeUpdateMany<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> & UpsertManyOptions<T> = {}): Promise<QueryResult<T>> {
    options.processCollections ??= true;
    options.convertCustomTypes ??= true;
    const meta = this.metadata.get<T>(entityName);

    if (options.upsert) {
      const uniqueFields = options.onConflictFields ?? (Utils.isPlainObject(where[0]) ? Object.keys(where[0]).flatMap(key => Utils.splitPrimaryKeys(key)) : meta!.primaryKeys) as (keyof T)[];
      const qb = this.createQueryBuilder<T>(entityName, options.ctx, 'write', options.convertCustomTypes, options.loggerContext).withSchema(this.getSchemaName(meta, options));
      const returning = getOnConflictReturningFields(meta, data[0], uniqueFields, options);
      qb.insert(data as T[])
        .onConflict(uniqueFields)
        .returning(returning);

      if (!options.onConflictAction || options.onConflictAction === 'merge') {
        const fields = getOnConflictFields(meta, data[0], uniqueFields, options);
        qb.merge(fields);
      }

      if (options.onConflictAction === 'ignore') {
        qb.ignore();
      }

      return this.rethrow(qb.execute('run', false));
    }

    const collections = options.processCollections ? data.map(d => this.extractManyToMany(meta, d)) : [];
    const keys = new Set<EntityKey<T>>();
    const fields = new Set<string>();
    const returning = new Set<EntityKey<T>>();

    for (const row of data) {
      for (const k of Utils.keys(row)) {
        keys.add(k as EntityKey<T>);

        if (isRaw(row[k])) {
          returning.add(k);
        }
      }
    }

    // reload generated columns and version fields
    meta.props
      .filter(prop => prop.generated || prop.version || prop.primary)
      .forEach(prop => returning.add(prop.name));

    const pkCond = Utils.flatten(meta.primaryKeys.map(pk => meta.properties[pk].fieldNames)).map(pk => `${this.platform.quoteIdentifier(pk)} = ?`).join(' and ');
    const params: any[] = [];
    let sql = `update ${this.getTableName(meta, options)} set `;

    const addParams = (prop: EntityProperty<T>, value: Dictionary) => {
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

      params.push(value);
    };

    for (const key of keys) {
      const prop = meta.properties[key] ?? meta.root.properties[key];

      prop.fieldNames.forEach((fieldName: string, fieldNameIdx: number) => {
        if (fields.has(fieldName) || (prop.ownColumns && !prop.ownColumns.includes(fieldName))) {
          return;
        }

        fields.add(fieldName);

        sql += `${this.platform.quoteIdentifier(fieldName)} = case`;
        where.forEach((cond, idx) => {
          if (key in data[idx]) {
            const pks = Utils.getOrderedPrimaryKeys(cond as Dictionary, meta);
            sql += ` when (${pkCond}) then `;

            if (prop.customType && !prop.object && 'convertToDatabaseValueSQL' in prop.customType && data[idx][prop.name] != null && !isRaw(data[idx][key])) {
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
    }

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
      /* v8 ignore next */
      sql += returningFields.length > 0 ? ` returning ${returningFields.map(field => this.platform.quoteIdentifier(field)).join(', ')}` : '';
    }

    const res = await this.rethrow(this.execute<QueryResult<T>>(sql, params, 'run', options.ctx, options.loggerContext));

    for (let i = 0; i < collections.length; i++) {
      await this.processManyToMany<T>(meta, where[i] as Primary<T>[], collections[i], false, options);
    }

    return res;
  }

  async nativeDelete<T extends object>(entityName: EntityName<T>, where: FilterQuery<T> | string | any, options: DeleteOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.get(entityName);
    const pks = this.getPrimaryKeyFields(meta);

    if (Utils.isPrimaryKey(where) && pks.length === 1) {
      where = { [pks[0]]: where };
    }

    const qb = this.createQueryBuilder(entityName, options.ctx, 'write', false, options.loggerContext).delete(where).withSchema(this.getSchemaName(meta, options));

    return this.rethrow(qb.execute('run', false));
  }

  /**
   * Fast comparison for collection snapshots that are represented by PK arrays.
   * Compares scalars via `===` and fallbacks to Utils.equals()` for more complex types like Buffer.
   * Always expects the same length of the arrays, since we only compare PKs of the same entity type.
   */
  private comparePrimaryKeyArrays(a: unknown[], b: unknown[]) {
    for (let i = a.length; i-- !== 0;) {
      if (['number', 'string', 'bigint', 'boolean'].includes(typeof a[i])) {
        if (a[i] !== b[i]) {
          return false;
        }
      } else {
        if (!Utils.equals(a[i], b[i])) {
          return false;
        }
      }
    }

    return true;
  }

  override async syncCollections<T extends object, O extends object>(collections: Iterable<Collection<T, O>>, options?: DriverMethodOptions): Promise<void> {
    const groups = {} as Dictionary<PivotCollectionPersister<any>>;

    for (const coll of collections) {
      const wrapped = helper(coll.owner);
      const meta = wrapped.__meta;
      const pks = wrapped.getPrimaryKeys(true)!;
      const snap = coll.getSnapshot();
      const includes = <T>(arr: T[][], item: T[]) => !!arr.find(i => this.comparePrimaryKeyArrays(i, item));
      const snapshot = snap ? snap.map(item => helper(item).getPrimaryKeys(true)!) : [];
      const current = coll.getItems(false).map(item => helper(item).getPrimaryKeys(true)!);
      const deleteDiff = snap ? snapshot.filter(item => !includes(current, item)) : true;
      const insertDiff = current.filter(item => !includes(snapshot, item));
      const target = snapshot.filter(item => includes(current, item)).concat(...insertDiff);
      const equals = Utils.equals(current, target);

      // wrong order if we just delete and insert to the end (only owning sides can have fixed order)
      if (coll.property.owner && coll.property.fixedOrder && !equals && Array.isArray(deleteDiff)) {
        deleteDiff.length = insertDiff.length = 0;

        for (const item of snapshot) {
          deleteDiff.push(item);
        }

        for (const item of current) {
          insertDiff.push(item);
        }
      }

      if (coll.property.kind === ReferenceKind.ONE_TO_MANY) {
        const cols = coll.property.referencedColumnNames;
        const qb = this.createQueryBuilder(coll.property.targetMeta!.class, options?.ctx, 'write')
          .withSchema(this.getSchemaName(meta, options));

        if (coll.getSnapshot() === undefined) {
          if (coll.property.orphanRemoval) {
            const query = qb.delete({ [coll.property.mappedBy]: pks })
              .andWhere({ [cols.join(Utils.PK_SEPARATOR)]: { $nin: insertDiff } });

            await this.rethrow(query.execute());
            continue;
          }

          const query = qb.update({ [coll.property.mappedBy]: null })
            .where({ [coll.property.mappedBy]: pks })
            .andWhere({ [cols.join(Utils.PK_SEPARATOR)]: { $nin: insertDiff } });

          await this.rethrow(query.execute());
          continue;
        }

        /* v8 ignore next */
        const query = qb.update({ [coll.property.mappedBy]: pks })
          .where({ [cols.join(Utils.PK_SEPARATOR)]: { $in: insertDiff } });

        await this.rethrow(query.execute());
        continue;
      }

      const pivotMeta = this.metadata.find(coll.property.pivotEntity)!;
      let schema = pivotMeta.schema;

      if (schema === '*') {
        if (coll.property.owner) {
          schema = wrapped.getSchema() === '*' ? options?.schema ?? this.config.get('schema') : wrapped.getSchema();
        } else {
          const targetMeta = coll.property.targetMeta!;
          const targetSchema = (coll[0] ?? snap?.[0]) && helper(coll[0] ?? snap?.[0]).getSchema();
          schema = targetMeta.schema === '*' ? options?.schema ?? targetSchema ?? this.config.get('schema') : targetMeta.schema;
        }
      } else if (schema == null) {
        schema = this.config.get('schema');
      }

      const tableName = `${schema ?? '_'}.${pivotMeta.tableName}`;
      const persister = groups[tableName] ??= new PivotCollectionPersister(pivotMeta, this, options?.ctx, schema, options?.loggerContext);
      persister.enqueueUpdate(coll.property, insertDiff, deleteDiff, pks, coll.isInitialized());
    }

    for (const persister of Utils.values(groups)) {
      await this.rethrow(persister.execute());
    }
  }

  override async loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where: FilterQuery<any> = {} as FilterQuery<any>, orderBy?: OrderDefinition<T>, ctx?: Transaction, options?: FindOptions<T, any, any, any>, pivotJoin?: boolean): Promise<Dictionary<T[]>> {
    if (owners.length === 0) {
      return {};
    }

    const pivotMeta = this.metadata.get(prop.pivotEntity);
    const pivotProp1 = pivotMeta.relations[prop.owner ? 1 : 0];
    const pivotProp2 = pivotMeta.relations[prop.owner ? 0 : 1];
    const ownerMeta = pivotProp2.targetMeta as EntityMetadata<O>;

    const cond = {
      [pivotProp2.name]: { $in: ownerMeta.compositePK ? owners : owners.map(o => o[0]) },
    };

    if (!Utils.isEmpty(where)) {
      cond[pivotProp1.name] = { ...where };
    }

    where = cond as FilterQuery<T>;
    const populateField = pivotJoin ? `${pivotProp1.name}:ref` : pivotProp1.name as EntityKey<T>;
    const populate = this.autoJoinOneToOneOwner(prop.targetMeta!, options?.populate as PopulateOptions<T>[] ?? [], options?.fields);
    const childFields = !Utils.isEmpty(options?.fields) ? options!.fields!.map(f => `${pivotProp1.name}.${f}`) : [];
    const childExclude = !Utils.isEmpty(options?.exclude) ? options!.exclude!.map(f => `${pivotProp1.name}.${f}`) : [];
    const fields = pivotJoin
      ? [pivotProp1.name, pivotProp2.name] as any[]
      : [pivotProp1.name, pivotProp2.name, ...childFields];
    const res = await this.find(pivotMeta.class, where, {
      ctx,
      ...options,
      fields,
      exclude: childExclude as any[],
      orderBy: this.getPivotOrderBy(prop, pivotProp1, orderBy, options?.orderBy),
      populate: [{ field: populateField, strategy: LoadStrategy.JOINED, joinType: JoinType.innerJoin, children: populate, dataOnly: pivotProp1.mapToPk && !pivotJoin } as any],
      populateWhere: undefined,
      // @ts-ignore
      _populateWhere: 'infer',
      populateFilter: !Utils.isEmpty(options?.populateFilter) || RawQueryFragment.hasObjectFragments(options?.populateFilter) ? { [pivotProp2.name]: options?.populateFilter } : undefined,
    });

    const map: Dictionary<T[]> = {};

    for (const owner of owners) {
      const key = Utils.getPrimaryKeyHash(owner as string[]);
      map[key] = [];
    }

    for (const item of res) {
      const key = Utils.getPrimaryKeyHash(Utils.asArray(item[pivotProp2.name]));
      map[key].push(item[pivotProp1.name]);
    }

    return map;
  }

  private getPivotOrderBy<T>(prop: EntityProperty<T>, pivotProp: EntityProperty, orderBy?: OrderDefinition<T>, parentOrderBy?: OrderDefinition<T>): QueryOrderMap<T>[] {
    if (!Utils.isEmpty(orderBy) || RawQueryFragment.hasObjectFragments(orderBy)) {
      return Utils.asArray(orderBy).map(o => ({ [pivotProp.name]: o } as QueryOrderMap<T>));
    }

    if (prop.kind === ReferenceKind.MANY_TO_MANY && Utils.asArray(parentOrderBy).some(o => o[prop.name])) {
      return Utils.asArray(parentOrderBy)
        .filter(o => o[prop.name])
        .map(o => ({ [pivotProp.name]: o[prop.name] }) as QueryOrderMap<T>);
    }

    if (!Utils.isEmpty(prop.orderBy) || RawQueryFragment.hasObjectFragments(prop.orderBy)) {
      return Utils.asArray(prop.orderBy).map(o => ({ [pivotProp.name]: o } as QueryOrderMap<T>));
    }

    if (prop.fixedOrder) {
      return [{ [prop.fixedOrderColumn!]: QueryOrder.ASC } as QueryOrderMap<T>];
    }

    return [];
  }

  async execute<T extends QueryResult | EntityData<AnyEntity> | EntityData<AnyEntity>[] = EntityData<AnyEntity>[]>(query: string | NativeQueryBuilder | RawQueryFragment, params: any[] = [], method: 'all' | 'get' | 'run' = 'all', ctx?: Transaction, loggerContext?: LoggingOptions): Promise<T> {
    return this.rethrow(this.connection.execute(query, params, method, ctx, loggerContext));
  }

  async *stream<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: StreamOptions<T, any, any, any>): AsyncIterableIterator<T> {
    options = { populate: [], orderBy: [], ...options };
    const meta = this.metadata.get(entityName);

    if (meta.virtual) {
      yield* this.streamFromVirtual(entityName, where, options as any) as AsyncIterableIterator<T>;
      return;
    }

    const qb = await this.createQueryBuilderFromOptions(meta, where, options);

    try {
      const result = qb.stream(options);

      for await (const item of result) {
        yield item as T;
      }
    } catch (e) {
      throw this.convertException(e as Error);
    }
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
      .filter(prop => prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner && !prop.lazy && !relationsToPopulate.includes(prop.name))
      .filter(prop => fields.length === 0 || fields.some(f => prop.name === f || prop.name.startsWith(`${String(f)}.`)))
      .map(prop => ({ field: `${prop.name}:ref` as any, strategy: LoadStrategy.JOINED }));

    return [...populate, ...toPopulate];
  }

  /**
   * @internal
   */
  joinedProps<T>(meta: EntityMetadata, populate: readonly PopulateOptions<T>[], options?: { strategy?: Options['loadStrategy'] }): PopulateOptions<T>[] {
    return populate.filter(hint => {
      const [propName, ref] = hint.field.split(':', 2);
      const prop = meta.properties[propName] || {};
      const strategy = getLoadingStrategy(hint.strategy || prop.strategy || options?.strategy || this.config.get('loadStrategy'), prop.kind);

      if (ref && [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
        return true;
      }

      // skip redundant joins for 1:1 owner population hints when using `mapToPk`
      if (prop.kind === ReferenceKind.ONE_TO_ONE && prop.mapToPk && prop.owner) {
        return false;
      }

      if (strategy !== LoadStrategy.JOINED) {
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
    if (rawResults.length <= 1) {
      return rawResults;
    }

    const res: EntityData<T>[] = [];
    const map: Dictionary<EntityData<T>> = {};
    const collectionsToMerge: Dictionary<Dictionary<EntityData<T>[]>> = {};

    const hints = joinedProps.map(hint => {
      const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
      return { propName, ref, children: hint.children };
    });

    for (const item of rawResults) {
      const pk = Utils.getCompositeKeyHash(item, meta);

      if (map[pk]) {
        for (const { propName } of hints) {
          if (!item[propName]) {
            continue;
          }

          collectionsToMerge[pk] ??= {};
          collectionsToMerge[pk][propName] ??= [map[pk][propName] as EntityData<T>];
          collectionsToMerge[pk][propName].push(item[propName] as EntityData<T>);
        }
      } else {
        map[pk] = item;
        res.push(item);
      }
    }

    for (const pk in collectionsToMerge) {
      const entity = map[pk];
      const collections = collectionsToMerge[pk];

      for (const { propName, ref, children } of hints) {
        if (!collections[propName]) {
          continue;
        }

        const prop = meta.properties[propName];
        const items = collections[propName].flat() as EntityData<T>[];

        if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind) && ref) {
          entity[propName] = items as EntityDataValue<T>;
          continue;
        }

        switch (prop.kind) {
          case ReferenceKind.ONE_TO_MANY:
          case ReferenceKind.MANY_TO_MANY:
            entity[propName] = this.mergeJoinedResult(items, prop.targetMeta!, children as any ?? []) as EntityDataValue<T>;
            break;
          case ReferenceKind.MANY_TO_ONE:
          case ReferenceKind.ONE_TO_ONE:
            entity[propName] = this.mergeJoinedResult(items, prop.targetMeta!, children as any ?? [])[0] as EntityDataValue<T>;
            break;
        }
      }
    }

    return res;
  }

  protected shouldHaveColumn<T, U>(meta: EntityMetadata<T>, prop: EntityProperty<U>, populate: readonly PopulateOptions<U>[], fields?: readonly Field<U>[], exclude?: readonly Field<U>[]) {
    if (!this.platform.shouldHaveColumn(prop, populate, exclude as string[])) {
      return false;
    }

    if (!fields || fields.includes('*') || prop.primary || meta.root.discriminatorColumn === prop.name) {
      return true;
    }

    return fields.some(f => f === prop.name || f.toString().startsWith(prop.name + '.'));
  }

  protected getFieldsForJoinedLoad<T extends object>(qb: QueryBuilder<T, any, any, any>, meta: EntityMetadata<T>, options: FieldsForJoinedLoadOptions<T>): Field<T>[] {
    const fields: Field<T>[] = [];
    const populate = options.populate ?? [];
    const joinedProps = this.joinedProps(meta, populate, options);
    const populateWhereAll = (options as Dictionary)?._populateWhere === 'all' || Utils.isEmpty((options as Dictionary)?._populateWhere);

    // root entity is already handled, skip that
    if (options.parentJoinPath) {
      // alias all fields in the primary table
      meta.props
        .filter(prop => this.shouldHaveColumn(meta, prop, populate, options.explicitFields, options.exclude))
        .forEach(prop => fields.push(...this.mapPropToFieldNames(qb, prop, options.parentTableAlias, meta, options.schema, options.explicitFields)));
    }

    for (const hint of joinedProps) {
      const [propName, ref] = hint.field.split(':', 2) as [EntityKey<T>, string | undefined];
      const prop = meta.properties[propName];

      // ignore ref joins of known FKs unless it's a filter hint
      if (ref && !hint.filter && (prop.kind === ReferenceKind.MANY_TO_ONE || (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner))) {
        continue;
      }

      const meta2 = prop.targetMeta as EntityMetadata<T>;
      const pivotRefJoin = prop.kind === ReferenceKind.MANY_TO_MANY && ref;
      const tableAlias = qb.getNextAlias(prop.name);
      const field = `${options.parentTableAlias}.${prop.name}`;
      let path = options.parentJoinPath ? `${options.parentJoinPath}.${prop.name}` : `${meta.name}.${prop.name}`;

      if (!options.parentJoinPath && populateWhereAll && !hint.filter && !path.startsWith('[populate]')) {
        path = '[populate]' + path;
      }

      const mandatoryToOneProperty = [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) && !prop.nullable;
      const joinType = pivotRefJoin
        ? JoinType.pivotJoin
        : hint.joinType
          ? hint.joinType as JoinType
          : (hint.filter && !prop.nullable) || mandatoryToOneProperty
            ? JoinType.innerJoin
            : JoinType.leftJoin;
      const schema = prop.targetMeta!.schema === '*' ? options?.schema ?? this.config.get('schema') : prop.targetMeta!.schema;
      qb.join(field, tableAlias, {}, joinType, path, schema);

      if (pivotRefJoin) {
        fields.push(
          ...prop.joinColumns!.map(col => qb.helper.mapper(`${tableAlias}.${col}`, qb.type, undefined, `${tableAlias}__${col}`)),
          ...prop.inverseJoinColumns!.map(col => qb.helper.mapper(`${tableAlias}.${col}`, qb.type, undefined, `${tableAlias}__${col}`)),
        );
      }

      if (prop.kind === ReferenceKind.ONE_TO_MANY && ref) {
        fields.push(...this.getFieldsForJoinedLoad(qb, meta2, {
          ...options,
          explicitFields: prop.referencedColumnNames,
          exclude: undefined,
          populate: hint.children as any,
          parentTableAlias: tableAlias,
          parentJoinPath: path,
        }));
      }

      const childExplicitFields = options.explicitFields?.filter(f => Utils.isPlainObject(f)).map(o => (o as Dictionary)[prop.name])[0] || [];

      options.explicitFields?.forEach(f => {
        if (typeof f === 'string' && f.startsWith(`${prop.name}.`)) {
          childExplicitFields.push(f.substring(prop.name.length + 1));
        }
      });

      const childExclude = options.exclude ? Utils.extractChildElements(options.exclude as string[], prop.name) : options.exclude;

      if (!ref && (!prop.mapToPk || hint.dataOnly)) {
        fields.push(...this.getFieldsForJoinedLoad(qb, meta2, {
          ...options,
          explicitFields: childExplicitFields.length === 0 ? undefined : childExplicitFields,
          exclude: childExclude,
          populate: hint.children as any,
          parentTableAlias: tableAlias,
          parentJoinPath: path,
        }));
      } else if (hint.filter || (prop.mapToPk && !hint.dataOnly) || (ref && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind))) {
        fields.push(...prop.referencedColumnNames!.map(col => qb.helper.mapper(`${tableAlias}.${col}`, qb.type, undefined, `${tableAlias}__${col}`)));
      }
    }

    return fields;
  }

  /**
   * @internal
   */
  mapPropToFieldNames<T extends object>(qb: QueryBuilder<T, any, any, any>, prop: EntityProperty<T>, tableAlias: string, meta: EntityMetadata<T>, schema?: string, explicitFields?: readonly Field<T>[]): Field<T>[] {
    if (prop.kind === ReferenceKind.EMBEDDED && !prop.object) {
      return Object.entries(prop.embeddedProps).flatMap(([name, childProp]) => {
        const childFields = explicitFields ? Utils.extractChildElements(explicitFields as string[], prop.name) : [];

        if (!this.shouldHaveColumn(prop.targetMeta!, { ...childProp, name }, [], childFields.length > 0 ? childFields : undefined)) {
          return [];
        }

        return this.mapPropToFieldNames<T>(qb, childProp, tableAlias, meta, schema, childFields);
      });
    }

    const aliased = this.platform.quoteIdentifier(`${tableAlias}__${prop.fieldNames[0]}`);

    if (prop.customTypes?.some(type => !!type?.convertToJSValueSQL)) {
      return prop.fieldNames.map((col, idx) => {
        if (!prop.customTypes[idx]?.convertToJSValueSQL) {
          return col;
        }

        const prefixed = this.platform.quoteIdentifier(`${tableAlias}.${col}`);
        const aliased = this.platform.quoteIdentifier(`${tableAlias}__${col}`);

        return raw(`${prop.customTypes[idx]!.convertToJSValueSQL!(prefixed, this.platform)} as ${aliased}`);
      });
    }

    if (prop.customType?.convertToJSValueSQL) {
      const prefixed = this.platform.quoteIdentifier(`${tableAlias}.${prop.fieldNames[0]}`);
      return [raw(`${prop.customType.convertToJSValueSQL(prefixed, this.platform)} as ${aliased}`)];
    }

    if (prop.formula) {
      const alias = this.platform.quoteIdentifier(tableAlias);
      const effectiveSchema = schema ?? (meta.schema !== '*' ? meta.schema : undefined);
      const qualifiedName = effectiveSchema ? `${effectiveSchema}.${meta.tableName}` : meta.tableName;
      const table: FormulaTable = {
        alias: alias.toString(),
        name: meta.tableName,
        schema: effectiveSchema,
        qualifiedName,
        toString: () => alias.toString(),
      };
      const columns = meta.createColumnMappingObject();
      return [raw(`${(prop.formula!(table, columns))} as ${aliased}`)];
    }

    return prop.fieldNames.map(fieldName => {
      return `${tableAlias}.${fieldName} as ${tableAlias}__${fieldName}`;
    });
  }

  /** @internal */
  createQueryBuilder<T extends object>(entityName: EntityName<T> | QueryBuilder<T, any, any, any>, ctx?: Transaction, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean, loggerContext?: LoggingOptions, alias?: string, em?: SqlEntityManager): QueryBuilder<T, any, any, any> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em ? preferredConnectionType : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new QueryBuilder<T, any, any, any>(
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

  protected resolveConnectionType(args: { ctx?: Transaction; connectionType?: ConnectionType }) {
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

  protected extractManyToMany<T>(meta: EntityMetadata<T>, data: EntityDictionary<T>): EntityData<T> {
    const ret: EntityData<T> = {};

    for (const prop of meta.relations) {
      if (prop.kind === ReferenceKind.MANY_TO_MANY && data[prop.name]) {
        ret[prop.name] = data[prop.name].map((item: Primary<T>) => Utils.asArray(item));
        delete data[prop.name];
      }
    }

    return ret;
  }

  protected async processManyToMany<T extends object>(meta: EntityMetadata<T>, pks: Primary<T>[], collections: EntityData<T>, clear: boolean, options?: DriverMethodOptions) {
    for (const prop of meta.relations) {
      if (collections[prop.name]) {
        const pivotMeta = this.metadata.get(prop.pivotEntity);
        const persister = new PivotCollectionPersister(pivotMeta, this, options?.ctx, options?.schema, options?.loggerContext);
        persister.enqueueUpdate(prop, collections[prop.name] as Primary<T>[][], clear, pks);
        await this.rethrow(persister.execute());
      }
    }
  }

  override async lockPessimistic<T extends object>(entity: T, options: LockOptions): Promise<void> {
    const meta = helper(entity).__meta;
    const qb = this.createQueryBuilder(meta.class, options.ctx, undefined, undefined, options.logging).withSchema(options.schema ?? meta.schema);
    const cond = Utils.getPrimaryKeyCond(entity, meta.primaryKeys);
    qb.select(raw('1')).where(cond!).setLockMode(options.lockMode, options.lockTableAliases);
    await this.rethrow(qb.execute());
  }

  protected buildPopulateWhere<T extends object>(meta: EntityMetadata<T>, joinedProps: PopulateOptions<T>[], options: Pick<FindOptions<any>, 'populateWhere'>): ObjectQuery<T> {
    const where = {} as ObjectQuery<T>;

    for (const hint of joinedProps) {
      const [propName] = hint.field.split(':', 2) as [EntityKey<T>];
      const prop = meta.properties[propName];

      if (!Utils.isEmpty(prop.where) || RawQueryFragment.hasObjectFragments(prop.where)) {
        where[prop.name] = Utils.copy(prop.where);
      }

      if (hint.children) {
        const inner = this.buildPopulateWhere(prop.targetMeta!, hint.children as any, {});

        if (!Utils.isEmpty(inner) || RawQueryFragment.hasObjectFragments(inner)) {
          where[prop.name] ??= {} as any;
          Object.assign(where[prop.name] as object, inner);
        }
      }
    }

    if (Utils.isEmpty(options.populateWhere) && !RawQueryFragment.hasObjectFragments(options.populateWhere)) {
      return where;
    }

    if (Utils.isEmpty(where) && !RawQueryFragment.hasObjectFragments(where)) {
      return options.populateWhere as ObjectQuery<T>;
    }

    /* v8 ignore next */
    return { $and: [options.populateWhere, where] } as unknown as ObjectQuery<T>;
  }

  protected buildOrderBy<T extends object>(qb: QueryBuilder<T, any, any, any>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], options: Pick<FindOptions<any>, 'strategy' | 'orderBy' | 'populateOrderBy'>): QueryOrderMap<T>[] {
    const joinedProps = this.joinedProps(meta, populate, options);
    // `options._populateWhere` is a copy of the value provided by user with a fallback to the global config option
    // as `options.populateWhere` will be always recomputed to respect filters
    const populateWhereAll = (options as Dictionary)._populateWhere !== 'infer' && !Utils.isEmpty((options as Dictionary)._populateWhere);
    const path = (populateWhereAll ? '[populate]' : '') + meta.className;
    const optionsOrderBy = Utils.asArray(options.orderBy);
    const populateOrderBy = this.buildPopulateOrderBy(qb, meta, Utils.asArray<QueryOrderMap<T>>(options.populateOrderBy ?? options.orderBy), path, !!options.populateOrderBy);
    const joinedPropsOrderBy = this.buildJoinedPropsOrderBy(qb, meta, joinedProps, options, path);

    return [...optionsOrderBy, ...populateOrderBy, ...joinedPropsOrderBy] as QueryOrderMap<T>[];
  }

  protected buildPopulateOrderBy<T extends object>(qb: QueryBuilder<T, any, any, any>, meta: EntityMetadata<T>, populateOrderBy: QueryOrderMap<T>[], parentPath: string, explicit: boolean, parentAlias = qb.alias): QueryOrderMap<T>[] {
    const orderBy: QueryOrderMap<T>[] = [];

    for (let i = 0; i < populateOrderBy.length; i++) {
      const orderHint = populateOrderBy[i];

      for (const field of Utils.getObjectQueryKeys(orderHint)) {
        const childOrder = orderHint[field as keyof typeof orderHint];

        if (RawQueryFragment.isKnownFragmentSymbol(field)) {
          const { sql, params } = RawQueryFragment.getKnownFragment(field)!;
          const key = raw(sql.replace(new RegExp(ALIAS_REPLACEMENT_RE, 'g'), parentAlias), params);
          orderBy.push({ [key]: childOrder } as QueryOrderMap<T>);
          continue;
        }

        const prop = meta.properties[field];

        if (!prop) {
          throw new Error(`Trying to order by not existing property ${meta.className}.${field}`);
        }

        let path = parentPath;
        const meta2 = prop.targetMeta!;
        if (prop.kind !== ReferenceKind.SCALAR && (![ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind) || !prop.owner || Utils.isPlainObject(childOrder))) {
          path += `.${field}`;
        }

        if (prop.kind === ReferenceKind.MANY_TO_MANY && typeof childOrder !== 'object') {
          path += '[pivot]';
        }

        const join = qb.getJoinForPath(path, { matchPopulateJoins: true });
        const propAlias = qb.getAliasForJoinPath(join ?? path, { matchPopulateJoins: true }) ?? parentAlias;

        if (!join) {
          continue;
        }

        if (join && ![ReferenceKind.SCALAR, ReferenceKind.EMBEDDED].includes(prop.kind) && typeof childOrder === 'object') {
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

        const order = typeof childOrder === 'object' ? childOrder[field as EntityKey] : childOrder;

        if (order) {
          orderBy.push({ [`${propAlias}.${field}` as EntityKey]: order } as QueryOrderMap<T>);
        }
      }
    }

    return orderBy;
  }

  protected buildJoinedPropsOrderBy<T extends object>(qb: QueryBuilder<T, any, any, any>, meta: EntityMetadata<T>, populate: PopulateOptions<T>[], options?: Pick<FindOptions<any>, 'strategy' | 'orderBy' | 'populateOrderBy'>, parentPath?: string): QueryOrderMap<T>[] {
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

      const meta2 = prop.targetMeta!;

      if (prop.kind === ReferenceKind.MANY_TO_MANY && prop.fixedOrder && join) {
        const alias = ref ? propAlias : join.ownerAlias;
        orderBy.push({ [`${alias}.${prop.fixedOrderColumn}`]: QueryOrder.ASC } as QueryOrderMap<T>);
      }

      if (propOrderBy) {
        for (const item of Utils.asArray(propOrderBy)) {
          for (const field of Utils.getObjectQueryKeys(item)) {
            const order = item[field as keyof typeof item];

            if (RawQueryFragment.isKnownFragmentSymbol(field)) {
              const { sql, params } = RawQueryFragment.getKnownFragment(field)!;
              const sql2 = propAlias ? sql.replace(new RegExp(ALIAS_REPLACEMENT_RE, 'g'), propAlias) : sql;
              const key = raw(sql2, params);
              orderBy.push({ [key]: order } as QueryOrderMap<T>);
              continue;
            }

            orderBy.push({ [`${propAlias}.${field}` as EntityKey]: order } as QueryOrderMap<T>);
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

  protected processField<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T> | undefined, field: string, ret: Field<T>[]): void {
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
          this.processField(meta, prop.embeddedProps[key], parts.join('.'), ret);
        }
      }

      return;
    }

    if (prop.persist === false && !prop.embedded && !prop.formula) {
      return;
    }

    ret.push(prop.name);
  }

  protected buildFields<T extends object>(meta: EntityMetadata<T>, populate: PopulateOptions<T>[], joinedProps: PopulateOptions<T>[], qb: QueryBuilder<T, any, any, any>, alias: string, options: Pick<FindOptions<T, any, any, any>, 'strategy' | 'fields' | 'exclude'>, schema?: string): Field<T>[] {
    const lazyProps = meta.props.filter(prop => prop.lazy && !populate.some(p => this.isPopulated(meta, prop, p)));
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
          entityName: meta.class,
          where: {} as FilterQuery<T>,
          aliasMap: qb.getAliasMap(),
        });

        this.processField(meta, prop, parts.join('.'), ret);
      }

      if (!options.fields.includes('*') && !options.fields.includes(`${qb.alias}.*`)) {
        ret.unshift(...meta.primaryKeys.filter(pk => !options.fields!.includes(pk)));
      }

      if (meta.root.discriminatorColumn && !options.fields.includes(`${qb.alias}.${meta.root.discriminatorColumn}`)) {
        ret.push(meta.root.discriminatorColumn);
      }
    } else if (!Utils.isEmpty(options.exclude) || lazyProps.some(p => !p.formula && (p.kind !== '1:1' || p.owner))) {
      const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate, options.exclude as string[], false, false));
      ret.push(...props.filter(p => !lazyProps.includes(p)).map(p => p.name));
      addFormulas = true;
    } else if (hasLazyFormulas || requiresSQLConversion) {
      ret.push('*');
      addFormulas = true;
    } else {
      ret.push('*');
    }

    if (ret.length > 0 && !hasExplicitFields && addFormulas) {
      const columns = meta.createColumnMappingObject();
      const effectiveSchema = schema ?? (meta.schema !== '*' ? meta.schema : undefined);

      for (const prop of meta.props) {
        if (lazyProps.includes(prop)) {
          continue;
        }

        if (prop.formula) {
          const a = this.platform.quoteIdentifier(alias);
          const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
          const qualifiedName = effectiveSchema ? `${effectiveSchema}.${meta.tableName}` : meta.tableName;
          const table: FormulaTable = {
            alias: a.toString(),
            name: meta.tableName,
            schema: effectiveSchema,
            qualifiedName,
            toString: () => a.toString(),
          };
          ret.push(raw(`${(prop.formula(table, columns))} as ${aliased}`));
        }

        if (!prop.object && (prop.hasConvertToDatabaseValueSQL || prop.hasConvertToJSValueSQL)) {
          ret.push(prop.name);
        }
      }
    }

    // add joined relations after the root entity fields
    if (joinedProps.length > 0) {
      ret.push(...this.getFieldsForJoinedLoad(qb, meta, {
        explicitFields: options.fields as string[],
        exclude: options.exclude as string[],
        populate,
        parentTableAlias: alias,
        ...options,
      }));
    }

    return Utils.unique(ret);
  }

}

interface FieldsForJoinedLoadOptions<T extends object> {
  explicitFields?: readonly Field<T>[];
  exclude?: readonly Field<T>[];
  populate?: readonly PopulateOptions<T>[];
  strategy?: Options['loadStrategy'];
  populateWhere?: FindOptions<any>['populateWhere'];
  populateFilter?: FindOptions<any>['populateFilter'];
  parentTableAlias: string;
  parentJoinPath?: string;
  count?: boolean;
  schema?: string;
}
