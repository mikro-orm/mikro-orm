import { RequestContext, resolveGetContext, TransactionContext, type TransactionOptions } from '../';
import type { AsyncFunction, GetContext } from '../typings';

type TransactionalOptions<T> = TransactionOptions & { getContext?: GetContext<T> };

/**
 * you can specify context to open transaction by providing `getContext` property.
 */
export function Transactional<T extends object>(options: TransactionalOptions<T> = {}): MethodDecorator {
  return function (target, propertyKey, descriptor: PropertyDescriptor) {
    const originalMethod: AsyncFunction = descriptor.value;

    if (originalMethod.constructor.name !== 'AsyncFunction') {
      throw new Error('@Transactional() should be use with async functions');
    }

    descriptor.value = async function (this: T, ...args: any) {
      const { getContext, ...txOptions } = options;
      const em = await resolveGetContext(this, getContext)
        || TransactionContext.getEntityManager()
        || RequestContext.getEntityManager();

      if (!em) {
        throw new Error(`@Transactional() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@Transactional(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      return em.transactional(() => originalMethod.apply(this, args), txOptions);
    };

    return descriptor;
  };
}
