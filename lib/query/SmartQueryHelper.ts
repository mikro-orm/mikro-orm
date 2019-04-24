import { FilterQuery, IEntity, Utils } from '..';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import { IEntityType } from '../decorators';
import { MetadataStorage } from '../metadata';

export class SmartQueryHelper {

  static readonly SUPPORTED_OPERATORS = ['>', '<', '<=', '>=', '!', '!=', ':in', ':nin', ':gt', ':gte', ':lt', ':lte', ':ne', ':not'];

  private static readonly metadata = MetadataStorage.getMetadata();

  static processParams(params: any, root?: boolean): any {
    if (Utils.isEntity(params)) {
      return SmartQueryHelper.processEntity(params, root);
    }

    if (params === undefined) {
      return null;
    }

    if (Array.isArray(params)) {
      return params.map(item => SmartQueryHelper.processParams(item, true));
    }

    if (Utils.isObject(params)) {
      Object.keys(params).forEach(k => {
        params[k] = SmartQueryHelper.processParams(params[k], !!k);
      });
    }

    return params;
  }

  static processWhere<T extends IEntityType<T>>(where: FilterQuery<T>, entityName: string): FilterQuery<T> {
    where = this.processParams(where);
    const rootPrimaryKey = this.metadata[entityName] ? this.metadata[entityName].primaryKey : entityName;

    if (Array.isArray(where)) {
      return { [rootPrimaryKey]: { $in: where.map(sub => this.processWhere(sub, entityName)) } };
    }

    if (!Utils.isObject(where)) {
      return where;
    }

    Object.entries(where).forEach(([key, value]) => {
      if (QueryBuilderHelper.GROUP_OPERATORS[key as '$and' | '$or']) {
        return value.map((sub: any) => this.processWhere(sub, entityName));
      }

      if (Array.isArray(value) && !SmartQueryHelper.isSupported(key) && !key.includes('?')) {
        return where[key as keyof typeof where] = { $in: value };
      }

      if (!SmartQueryHelper.isSupported(key)) {
        return where;
      }

      delete where[key as keyof typeof where];

      if (key.includes(':')) {
        const [k, expr] = key.split(':');
        where[k as keyof typeof where] = SmartQueryHelper.processExpression(expr, value);
      } else {
        const m = key.match(/([\w-]+) ?([<>=!]+)$/)!;
        where[m[1] as keyof typeof where] = SmartQueryHelper.processExpression(m[2], value);
      }
    });

    return where;
  }

  private static processEntity(entity: IEntity, root?: boolean): any {
    if (root) {
      return entity.__primaryKey;
    }

    return { [entity.__primaryKeyField]: entity.__primaryKey };
  }

  private static processExpression<T>(expr: string, value: T): Record<string, T> {
    switch (expr) {
      case '>': return { '$gt': value };
      case '<': return { '$lt': value };
      case '>=': return { '$gte': value };
      case '<=': return { '$lte': value };
      case '!=': return { '$ne': value };
      case '!': return { '$not': value };
      default: return { ['$' + expr]: value };
    }
  }

  private static isSupported(key: string): boolean {
    return !!SmartQueryHelper.SUPPORTED_OPERATORS.find(op => key.includes(op));
  }

}
