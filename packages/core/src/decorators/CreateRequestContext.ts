import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';
import { EntityManager } from '../EntityManager';
import { EntityRepository } from '../entity/EntityRepository';
import { TransactionContext } from '../utils/TransactionContext';

export function CreateRequestContext<T>(getContext?: MikroORM | Promise<MikroORM> | ((type: T) => MikroORM | Promise<MikroORM> | EntityManager | EntityRepository<any> | { getEntityManager(): EntityManager }), respectExistingContext = false): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: T, ...args: any[]) {
      // reuse existing context if available
      if (respectExistingContext && RequestContext.currentRequestContext()) {
        return originalMethod.apply(this, args);
      }

      // If we are inside explicit transaction context, we need to create another tx context.
      // Otherwise, the outer tx context would be preferred.
      const txContext = TransactionContext.currentTransactionContext();
      const provider = txContext ? TransactionContext : RequestContext;

      /* istanbul ignore next */
      let orm: unknown;
      let em: unknown;

      if (typeof getContext === 'function') {
        const context = await getContext(this);
        orm = context ?? await (this as any).orm;
        em = context ?? await (this as any).em;
      } else if (getContext) {
        orm = em = await getContext;
      } else {
        orm = await (this as any).orm;
        em = await (this as any).em;
      }

      const create = async (em: EntityManager) => {
        if (txContext) {
          em = em.fork({ useContext: true });
        }

        return await provider.create(em, () => {
          return originalMethod.apply(this, args);
        });
      };

      if (em instanceof EntityManager) {
        return await create(em);
      }

      if (orm instanceof EntityRepository) {
        return await create(orm.getEntityManager());
      }

      if (!(orm instanceof MikroORM)) {
        const name = respectExistingContext ? 'EnsureRequestContext' : 'CreateRequestContext';
        throw new Error(`@${name}() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@${name}(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      return await create(orm.em);
    };

    return descriptor;
  };
}

export function EnsureRequestContext<T>(getContext?: MikroORM | Promise<MikroORM> | ((type: T) => MikroORM | Promise<MikroORM> | EntityManager | EntityRepository<any> | { getEntityManager(): EntityManager })): MethodDecorator {
  return CreateRequestContext(getContext, true);
}
