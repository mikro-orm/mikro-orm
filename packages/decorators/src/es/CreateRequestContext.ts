import { RequestContext, TransactionContext } from '@mikro-orm/core';
import { type ContextProvider, resolveContextProvider } from '../utils.js';

export function CreateRequestContext<T extends object>(contextProvider?: ContextProvider<T>, respectExistingContext = false) {
  return function (value: (this: T, ...args: any) => any, context: ClassMethodDecoratorContext<T>) {
    const name = respectExistingContext ? 'EnsureRequestContext' : 'CreateRequestContext';

    if (value.constructor.name !== 'AsyncFunction') {
      throw new Error(`@${name}() should be use with async functions`);
    }

    return async function (this: T, ...args: any[]) {
      const em = await resolveContextProvider(this, contextProvider);

      if (!em) {
        throw new Error(`@${name}() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@${name}(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      // reuse existing context if available for given respect `contextName`
      if (respectExistingContext && RequestContext.getEntityManager(em.name)) {
        return value.apply(this, args);
      }

      // Otherwise, the outer tx context would be preferred.
      const txContext = TransactionContext.currentTransactionContext();
      const provider = txContext ? TransactionContext : RequestContext;

      return txContext
        ? provider.create(em.fork({ useContext: true }), () => value.apply(this, args))
        : provider.create(em, () => value.apply(this, args));
    };
  };
}

export function EnsureRequestContext<T extends object>(context?: ContextProvider<T>) {
  return CreateRequestContext(context, true);
}
