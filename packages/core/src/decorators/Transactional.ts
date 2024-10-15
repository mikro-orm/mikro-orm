import { DatasourceUtils, RequestContext, TransactionContext, type TransactionOptions } from '../';
import type { AsyncFunction } from '../typings';

type TransactionalOptions = TransactionOptions & { name?: string };

/**
 * To use forked EntityManager, use TransactionContext.getEntityManager().
 */
export function Transactional(options?: TransactionalOptions): MethodDecorator {
  return function (target, propertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod: AsyncFunction = descriptor.value;

    if (originalMethod.constructor.name !== 'AsyncFunction') {
      throw new Error('@Transactional() should be use with async functions');
    }

    descriptor.value = async function (...args: any) {
      const em = TransactionContext.getEntityManager()
        || RequestContext.getEntityManager()
        || DatasourceUtils.getEntityManager(options?.name);

      if (!em) {
        throw new Error('use DatasourceUtils.setDatasource()');
      }

      delete options?.name;
      return em.transactional(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
