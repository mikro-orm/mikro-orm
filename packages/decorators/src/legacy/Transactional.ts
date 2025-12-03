import { type TransactionOptions, TransactionPropagation, RequestContext, TransactionContext } from '@mikro-orm/core';
import { type ContextProvider, resolveContextProvider } from '../utils.js';

type AsyncFunction<T = unknown> = (args: T) => Promise<T>;
type TransactionalOptions<T> = TransactionOptions & { context?: ContextProvider<T>; contextName?: string };

/**
 * This decorator wraps the method with `em.transactional()`, so you can provide `TransactionOptions` just like with `em.transactional()`.
 * The difference is that you can specify the context in which the transaction begins by providing `context` option,
 * and if omitted, the transaction will begin in the current context implicitly.
 * It works on async functions and can be nested with `em.transactional()`.
 * Unlike `em.transactional()`, this decorator uses `REQUIRED` propagation by default, which means it will join existing transactions.
 */
export function Transactional<T extends object>(options: TransactionalOptions<T> = {}): MethodDecorator {
  return function (target, propertyKey, descriptor: PropertyDescriptor) {
    const originalMethod: AsyncFunction = descriptor.value;

    if (originalMethod.constructor.name !== 'AsyncFunction') {
      throw new Error('@Transactional() should be use with async functions');
    }

    descriptor.value = async function (this: T, ...args: any) {
      const { context, contextName, ...txOptions } = options;
      txOptions.propagation ??= TransactionPropagation.REQUIRED;
      const em = (await resolveContextProvider(this, context))
        || TransactionContext.getEntityManager(contextName)
        || RequestContext.getEntityManager(contextName);

      if (!em) {
        throw new Error(`@Transactional() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@Transactional(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      return em.transactional(() => originalMethod.apply(this, args), txOptions);
    };

    return descriptor;
  };
}
