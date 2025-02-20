import type { ContextProvider } from '../typings.js';
import { RequestContext } from '../utils/RequestContext.js';
import { resolveContextProvider } from '../utils/resolveContextProvider.js';
import { TransactionContext } from '../utils/TransactionContext.js';

export function CreateRequestContext<T extends object>(context?: ContextProvider<T>, respectExistingContext = false): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = respectExistingContext ? 'EnsureRequestContext' : 'CreateRequestContext';

    if (originalMethod.constructor.name !== 'AsyncFunction') {
      throw new Error(`@${name}() should be use with async functions`);
    }

    descriptor.value = async function (this: T, ...args: any[]) {
      const em = await resolveContextProvider(this, context);

      if (!em) {
        throw new Error(`@${name}() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@${name}(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      // reuse existing context if available for given respect `contextName`
      if (respectExistingContext && RequestContext.getEntityManager(em.name)) {
        return originalMethod.apply(this, args);
      }

      // Otherwise, the outer tx context would be preferred.
      const txContext = TransactionContext.currentTransactionContext();
      const provider = txContext ? TransactionContext : RequestContext;

      return txContext
        ? provider.create(em.fork({ useContext: true }), () => originalMethod.apply(this, args))
        : provider.create(em, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

export function EnsureRequestContext<T extends object>(context?: ContextProvider<T>): MethodDecorator {
  return CreateRequestContext(context, true);
}
