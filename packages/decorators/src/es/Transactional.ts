import { RequestContext, TransactionContext, type TransactionOptions, TransactionPropagation } from '@mikro-orm/core';
import { type ContextProvider, resolveContextProvider } from '../utils.js';

type TransactionalOptions<T> = TransactionOptions & { context?: ContextProvider<T>; contextName?: string };

/**
 * This decorator wraps the method with `em.transactional()`, so you can provide `TransactionOptions` just like with `em.transactional()`.
 * The difference is that you can specify the context in which the transaction begins by providing `context` option,
 * and if omitted, the transaction will begin in the current context implicitly.
 * It works on async functions and can be nested with `em.transactional()`.
 * Unlike `em.transactional()`, this decorator uses `REQUIRED` propagation by default, which means it will join existing transactions.
 */
export function Transactional<
  Owner extends object,
  Value extends (this: Owner, ...args: any) => any = (this: Owner, ...args: any) => any,
>(options: TransactionalOptions<Owner> = {}) {
  return function (value: Value, context: ClassMethodDecoratorContext<Owner, Value>) {
    if (value.constructor.name !== 'AsyncFunction') {
      throw new Error('@Transactional() should be use with async functions');
    }

    return async function (this: Owner, ...args: any) {
      const { context, contextName, ...txOptions } = options;
      txOptions.propagation ??= TransactionPropagation.REQUIRED;
      const em = (await resolveContextProvider(this, context))
        || TransactionContext.getEntityManager(contextName)
        || RequestContext.getEntityManager(contextName);

      if (!em) {
        throw new Error(`@Transactional() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@Transactional(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      return em.transactional(() => value.apply(this, args), txOptions);
    };
  };
}
