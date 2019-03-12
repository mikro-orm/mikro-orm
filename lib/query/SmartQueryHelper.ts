import { FilterQuery, Utils } from '..';
import { QueryBuilderHelper } from './QueryBuilderHelper';

export class SmartQueryHelper {

  static readonly SUPPORTED_OPERATORS = ['>', '<', '<=', '>=', '!', '!=', ':in', ':nin', ':gt', ':gte', ':lt', ':lte', ':ne', ':not'];

  static processWhere<T>(where: FilterQuery<T>): FilterQuery<T> {
    if (!Utils.isObject(where)) {
      return where;
    }

    Object.entries(where).map(([key, value]) => {
      if (QueryBuilderHelper.GROUP_OPERATORS[key as '$and' | '$or']) {
        return value.map((sub: any) => this.processWhere(sub));
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
