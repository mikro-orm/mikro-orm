import type { EntityManager } from '../EntityManager';
import type { GetContext } from '../typings';
import { RequestContext } from '../utils/RequestContext';
import { TransactionContext } from '../utils/TransactionContext';
import { resolveGetContext } from '../utils/Utils';

export function CreateRequestContext<T extends object>(getContext?: GetContext<T>, respectExistingContext = false): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: T, ...args: any[]) {
      const em = await resolveGetContext(this, getContext);

      if (!em) {
        const name = respectExistingContext ? 'EnsureRequestContext' : 'CreateRequestContext';
        throw new Error(`@${name}() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@${name}(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      // Otherwise, the outer tx context would be preferred.
      const txContext = TransactionContext.currentTransactionContext();
      const provider = txContext ? TransactionContext : RequestContext;

      const create = async (em: EntityManager) => {
        // reuse existing context if available for given respect `contextName`
        if (respectExistingContext && RequestContext.getEntityManager(em.name)) {
          return originalMethod.apply(this, args);
        }

        if (txContext) {
          em = em.fork({ useContext: true });
        }

        return await provider.create(em, () => {
          return originalMethod.apply(this, args);
        });
      };

      return await create(em);
    };

    return descriptor;
  };
}

export function EnsureRequestContext<T extends object>(getContext?: GetContext<T>): MethodDecorator {
  return CreateRequestContext(getContext, true);
}
