import { Reference, wrap } from '../entity';
import { Utils } from './Utils';
import { AnyEntity, Dictionary, EntityMetadata, FilterDef, FilterQuery } from '../typings';
import { GroupOperator } from '../enums';
import { MetadataStorage } from '../metadata';

export class QueryHelper {

  static readonly SUPPORTED_OPERATORS = ['>', '<', '<=', '>=', '!', '!=', ':in', ':nin', ':gt', ':gte', ':lt', ':lte', ':ne', ':not'];

  static processParams(params: any, root?: boolean): any {
    if (params instanceof Reference) {
      params = params.unwrap();
    }

    if (Utils.isEntity(params)) {
      return QueryHelper.processEntity(params, root);
    }

    if (params === undefined) {
      return null;
    }

    if (Array.isArray(params)) {
      return params.map(item => QueryHelper.processParams(item, true));
    }

    if (Utils.isPlainObject(params)) {
      Object.keys(params).forEach(k => {
        params[k] = QueryHelper.processParams(params[k], !!k);
      });
    }

    return params;
  }

  static inlinePrimaryKeyObjects<T extends AnyEntity<T>>(where: Dictionary, meta: EntityMetadata<T>, metadata: MetadataStorage, key?: string): boolean {
    if (Array.isArray(where)) {
      where.forEach((item, i) => {
        if (this.inlinePrimaryKeyObjects(item, meta, metadata, key)) {
          where[i] = Utils.getPrimaryKeyValues(item, meta.primaryKeys, false);
        }
      });
    }

    if (!Utils.isPlainObject(where)) {
      return false;
    }

    if (meta.primaryKeys.every(pk => pk in where) && Object.keys(where).length === meta.primaryKeys.length) {
      return !GroupOperator[key as string] && Object.keys(where).every(k => !Utils.isPlainObject(where[k]) || Object.keys(where[k]).every(v => !Utils.isOperator(v, false)));
    }

    Object.keys(where).forEach(k => {
      const meta2 = metadata.get(meta.properties[k]?.type, false, false) || meta;

      if (this.inlinePrimaryKeyObjects(where[k], meta2, metadata, k)) {
        where[k] = Utils.getPrimaryKeyValues(where[k], meta2.primaryKeys, true);
      }
    });

    return false;
  }

  static processWhere<T extends AnyEntity<T>>(where: FilterQuery<T>, entityName: string, metadata: MetadataStorage): FilterQuery<T> {
    const meta = metadata.get(entityName, false, false);

    // inline PK-only objects in M:N queries so we don't join the target entity when not needed
    if (meta) {
      QueryHelper.inlinePrimaryKeyObjects(where as Dictionary, meta, metadata);
    }

    where = QueryHelper.processParams(where, true) || {};

    if (Array.isArray(where)) {
      const rootPrimaryKey = meta ? Utils.getPrimaryKeyHash(meta.primaryKeys) : entityName;
      return { [rootPrimaryKey]: { $in: (where as FilterQuery<T>[]).map(sub => QueryHelper.processWhere(sub, entityName, metadata)) } } as FilterQuery<T>;
    }

    if (!Utils.isPlainObject(where) || Utils.isPrimaryKey(where)) {
      return where as FilterQuery<T>;
    }

    return Object.keys(where as Dictionary).reduce((o, key) => {
      const value = where[key];
      const composite = meta?.properties[key]?.joinColumns?.length > 1;

      if (key in GroupOperator) {
        o[key] = value.map((sub: any) => QueryHelper.processWhere(sub, entityName, metadata));
        return o;
      }

      if (Array.isArray(value) && !QueryHelper.isSupported(key) && !key.includes('?')) {
        // comparing single composite key - use $eq instead of $in
        const op = !value.every(v => Array.isArray(v)) && composite ? '$eq' : '$in';
        o[key] = { [op]: value };
        return o;
      }

      if (!QueryHelper.isSupported(key)) {
        o[key] = where[key as keyof typeof where];
      } else if (key.includes(':')) {
        const [k, expr] = key.split(':');
        o[k] = QueryHelper.processExpression(expr, value);
      } else {
        const m = key.match(/([\w-]+) ?([<>=!]+)$/)!;
        o[m[1]] = QueryHelper.processExpression(m[2], value);
      }

      return o;
    }, {} as FilterQuery<T>);
  }

  static getActiveFilters(entityName: string, options: Dictionary<boolean | Dictionary> | string[] | boolean, filters: Dictionary<FilterDef<any>>): FilterDef<any>[] {
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

  static isFilterActive(entityName: string, filterName: string, filter: FilterDef<any>, options: Dictionary<boolean | Dictionary>): boolean {
    if (filter.entity && !filter.entity.includes(entityName)) {
      return false;
    }

    if (options[filterName] === false) {
      return false;
    }

    return filter.default || filterName in options;
  }

  private static processEntity(entity: AnyEntity, root?: boolean): any {
    const wrapped = wrap(entity, true);

    if (root || wrapped.__meta.compositePK) {
      return wrapped.__primaryKey;
    }

    return Utils.getPrimaryKeyCond(entity, wrapped.__meta.primaryKeys);
  }

  private static processExpression<T>(expr: string, value: T): Dictionary<T> {
    switch (expr) {
      case '>': return { $gt: value };
      case '<': return { $lt: value };
      case '>=': return { $gte: value };
      case '<=': return { $lte: value };
      case '!=': return { $ne: value };
      case '!': return { $not: value };
      default: return { ['$' + expr]: value };
    }
  }

  private static isSupported(key: string): boolean {
    return !!QueryHelper.SUPPORTED_OPERATORS.find(op => key.includes(op));
  }

}
