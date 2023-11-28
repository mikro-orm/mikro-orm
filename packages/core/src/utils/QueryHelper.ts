import { Reference } from '../entity/Reference';
import { Utils } from './Utils';
import type {
  Dictionary,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  EntityValue,
  FilterDef,
  FilterKey,
  FilterQuery,
} from '../typings';
import { GroupOperator, ReferenceKind } from '../enums';
import type { Platform } from '../platforms';
import type { MetadataStorage } from '../metadata/MetadataStorage';
import { JsonType } from '../types/JsonType';
import { helper } from '../entity/wrap';

export class QueryHelper {

  static readonly SUPPORTED_OPERATORS = ['>', '<', '<=', '>=', '!', '!='];

  static processParams(params: unknown): any {
    if (Reference.isReference(params)) {
      params = params.unwrap();
    }

    if (Utils.isEntity(params)) {
      if (helper(params).__meta.compositePK) {
        return helper(params).__primaryKeys;
      }

      return helper(params).getPrimaryKey();
    }

    if (params === undefined) {
      return null;
    }

    if (Array.isArray(params)) {
      return (params as unknown[]).map(item => QueryHelper.processParams(item));
    }

    if (Utils.isPlainObject(params)) {
      QueryHelper.processObjectParams(params);
    }

    return params;
  }

  static processObjectParams<T extends object>(params: T = {} as T): T {
    Utils.keys(params).forEach(k => {
      params[k] = QueryHelper.processParams(params[k]);
    });

    return params;
  }

  static inlinePrimaryKeyObjects<T extends object>(where: Dictionary, meta: EntityMetadata<T>, metadata: MetadataStorage, key?: string): boolean {
    if (Array.isArray(where)) {
      where.forEach((item, i) => {
        if (this.inlinePrimaryKeyObjects(item, meta, metadata, key)) {
          where[i] = Utils.getPrimaryKeyValues(item, meta.primaryKeys, false);
        }
      });
    }

    if (!Utils.isPlainObject(where) || (key && meta.properties[key as EntityKey<T>]?.customType instanceof JsonType)) {
      return false;
    }

    if (meta.primaryKeys.every(pk => pk in where) && Utils.getObjectKeysSize(where) === meta.primaryKeys.length) {
      return !!key && !GroupOperator[key as keyof typeof GroupOperator] && Object.keys(where).every(k => !Utils.isPlainObject(where[k]) || Object.keys(where[k]).every(v => {
        if (Utils.isOperator(v, false)) {
          return false;
        }

        if (meta.properties[k as EntityKey<T>].primary && [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(meta.properties[k as EntityKey<T>].kind)) {
          return this.inlinePrimaryKeyObjects(where[k], meta.properties[k as EntityKey<T>].targetMeta!, metadata, v);
        }

        return true;
      }));
    }

    Object.keys(where).forEach(k => {
      const meta2 = metadata.find(meta.properties[k as EntityKey<T>]?.type) || meta;

      if (this.inlinePrimaryKeyObjects(where[k], meta2, metadata, k)) {
        where[k] = Utils.getPrimaryKeyValues(where[k], meta2.primaryKeys, true);
      }
    });

    return false;
  }

  static processWhere<T extends object>(options: ProcessWhereOptions<T>): FilterQuery<T> {
    // eslint-disable-next-line prefer-const
    let { where, entityName, metadata, platform, aliased = true, convertCustomTypes = true, root = true } = options;
    const meta = metadata.find<T>(entityName);

    // inline PK-only objects in M:N queries, so we don't join the target entity when not needed
    if (meta && root) {
      QueryHelper.inlinePrimaryKeyObjects(where as Dictionary, meta, metadata);
    }

    if (options.platform.getConfig().get('ignoreUndefinedInQuery') && where && typeof where === 'object') {
      Utils.dropUndefinedProperties(where);
    }

    where = QueryHelper.processParams(where) ?? {};

    /* istanbul ignore next */
    if (!root && Utils.isPrimaryKey<T>(where)) {
      return where;
    }

    if (meta && Utils.isPrimaryKey(where, meta.compositePK)) {
      where = { [Utils.getPrimaryKeyHash(meta.primaryKeys)]: where } as FilterQuery<T>;
    }

    if (Array.isArray(where) && root) {
      const rootPrimaryKey = meta ? Utils.getPrimaryKeyHash(meta.primaryKeys) : entityName;
      let cond = { [rootPrimaryKey]: { $in: where } } as FilterQuery<T>;

      // @ts-ignore
      // detect tuple comparison, use `$or` in case the number of constituents don't match
      if (meta && !where.every(c => Utils.isPrimaryKey(c as unknown) || (Array.isArray(c) && c.length === meta.primaryKeys.length && c.every(i => Utils.isPrimaryKey(i))))) {
        cond = { $or: where } as FilterQuery<T>;
      }

      return QueryHelper.processWhere({ ...options, where: cond, root: false });
    }

    if (!Utils.isPlainObject(where)) {
      return where;
    }

    return Object.keys(where).reduce((o, key) => {
      let value = where![key as keyof typeof where] as unknown as FilterQuery<T>;
      const prop = this.findProperty(key, options);
      const keys = prop?.joinColumns?.length ?? 0;
      const composite = keys > 1;

      if (key in GroupOperator) {
        o[key] = (value as unknown[]).map((sub: any) => QueryHelper.processWhere<T>({ ...options, where: sub, root }));
        return o;
      }

      // wrap top level operators (except platform allowed operators) with PK
      if (Utils.isOperator(key) && root && meta && !options.platform.isAllowedTopLevelOperator(key)) {
        const rootPrimaryKey = Utils.getPrimaryKeyHash(meta.primaryKeys);
        o[rootPrimaryKey] = { [key]: QueryHelper.processWhere<T>({ ...options, where: value, root: false }) };
        return o;
      }

      if (prop?.customType && convertCustomTypes && !platform.isRaw(value)) {
        value = QueryHelper.processCustomType<T>(prop, value, platform, undefined, true);
      }

      const isJsonProperty = prop?.customType instanceof JsonType && Utils.isPlainObject(value) && !platform.isRaw(value) && Object.keys(value)[0] !== '$eq';

      if (isJsonProperty) {
        return this.processJsonCondition<T>(o as FilterQuery<T>, value as EntityValue<T>, [prop.fieldNames[0]] as EntityKey<T>[], platform, aliased);
      }

      if (Array.isArray(value) && !Utils.isOperator(key) && !QueryHelper.isSupportedOperator(key) && !key.includes('?') && options.type !== 'orderBy') {
        if (platform.allowsComparingTuples()) {
          // comparing single composite key - use $eq instead of $in
          const op = !value.every(v => Array.isArray(v)) && composite ? '$eq' : '$in';
          o[key] = { [op]: value };
        } else {
          if (!value.every(v => Array.isArray(v)) && composite) {
            o[key] = { $in: [value] };
          } else {
            o[key] = { $in: value };
          }
        }

        return o;
      }

      if (Utils.isPlainObject(value)) {
        o[key] = QueryHelper.processWhere({
          ...options,
          where: value as FilterQuery<T>,
          entityName: prop?.type ?? entityName,
          root: false,
        });
      } else {
        o[key] = value;
      }

      return o;
    }, {} as Dictionary) as FilterQuery<T>;
  }

  static getActiveFilters(entityName: string, options: Dictionary<boolean | Dictionary> | string[] | boolean, filters: Dictionary<FilterDef>): FilterDef[] {
    if (options === false) {
      return [];
    }

    const opts: Dictionary<boolean | Dictionary> = {};

    if (Array.isArray(options)) {
      options.forEach(filter => opts[filter] = true);
    } else if (Utils.isPlainObject(options)) {
      Object.keys(options).forEach(filter => opts[filter] = options[filter]);
    }

    return Object.keys(filters)
      .filter(f => QueryHelper.isFilterActive(entityName, f, filters[f], opts))
      .map(f => {
        filters[f].name = f;
        return filters[f];
      });
  }

  static isFilterActive(entityName: string, filterName: string, filter: FilterDef, options: Dictionary<boolean | Dictionary>): boolean {
    if (filter.entity && !filter.entity.includes(entityName)) {
      return false;
    }

    if (options[filterName] === false) {
      return false;
    }

    return filter.default || filterName in options;
  }

  static processCustomType<T extends object>(prop: EntityProperty<T>, cond: FilterQuery<T>, platform: Platform, key?: string, fromQuery?: boolean): FilterQuery<T> {
    if (Utils.isPlainObject(cond)) {
      return Utils.keys(cond).reduce((o, k) => {
        if (Utils.isOperator(k, true) || prop.referencedPKs?.includes(k)) {
          o[k] = QueryHelper.processCustomType<T>(prop, cond[k] as any, platform, k, fromQuery) as any;
        } else {
          o[k] = cond[k];
        }

        return o;
      }, {} as FilterQuery<T>);
    }

    if (Array.isArray(cond) && !(key && Utils.isArrayOperator(key))) {
      return (cond as FilterQuery<T>[]).map(v => QueryHelper.processCustomType(prop, v, platform, key, fromQuery)) as unknown as FilterQuery<T>;
    }

    if (platform.isRaw(cond)) {
      return cond;
    }

    return prop.customType.convertToDatabaseValue(cond, platform, { fromQuery, key, mode: 'query' });
  }

  private static isSupportedOperator(key: string): boolean {
    return !!QueryHelper.SUPPORTED_OPERATORS.find(op => key.includes(op));
  }

  private static processJsonCondition<T extends object>(o: FilterQuery<T>, value: EntityValue<T>, path: EntityKey<T>[], platform: Platform, alias: boolean) {
    if (Utils.isPlainObject<T>(value) && !Object.keys(value).some(k => Utils.isOperator(k))) {
      Utils.keys(value).forEach(k => {
        this.processJsonCondition<T>(o, value[k] as EntityValue<T>, [...path, k as EntityKey<T>], platform, alias);
      });

      return o;
    }

    if (path.length === 1) {
      o[path[0] as FilterKey<T>] = value as any;
      return o;
    }

    const operatorObject = Utils.isPlainObject(value) && Object.keys(value).every(k => Utils.isOperator(k));
    const type = operatorObject ? typeof Object.values(value)[0] : typeof value;
    const k = platform.getSearchJsonPropertyKey(path, type, alias, value) as FilterKey<T>;
    o[k] = value as any;

    return o;
  }

  static findProperty<T>(fieldName: string, options: ProcessWhereOptions<T>): EntityProperty<T> | undefined {
    const parts = fieldName.split('.');
    const propName = parts.pop() as EntityKey<T>;
    const alias = parts.length > 0 ? parts.join('.') : undefined;
    const entityName = alias ? options.aliasMap?.[alias] : options.entityName;
    const meta = entityName ? options.metadata.find<T>(entityName) : undefined;

    return meta?.properties[propName];
  }

}

interface ProcessWhereOptions<T> {
  where: FilterQuery<T>;
  entityName: string;
  metadata: MetadataStorage;
  platform: Platform;
  aliased?: boolean;
  aliasMap?: Dictionary<string>;
  convertCustomTypes?: boolean;
  root?: boolean;
  type?: 'where' | 'orderBy';
}
