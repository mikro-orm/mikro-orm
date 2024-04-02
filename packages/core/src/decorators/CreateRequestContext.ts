import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';
import { EntityManager } from '../EntityManager';
import { EntityRepository } from '../entity/EntityRepository';

export function CreateRequestContext<T>(getContext?: MikroORM | Promise<MikroORM> | ((type: T) => MikroORM | Promise<MikroORM> | EntityManager | EntityRepository<any> | { getEntityManager(): EntityManager }), respectExistingContext = false): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: T, ...args: any[]) {
      // reuse existing context if available
      if (RequestContext.currentRequestContext()) {
        return originalMethod.apply(this, args);
      }

      /* istanbul ignore next */
      let orm: unknown;
      let em: unknown;

      if (typeof getContext === 'function') {
        orm = await (getContext(this) ?? (this as any).orm);
      } else if (getContext) {
        orm = await getContext;
      } else {
        orm = await (this as any).orm;
        em = await (this as any).em;
      }

      if (em instanceof EntityManager) {
        return await RequestContext.create(em, () => {
          return originalMethod.apply(this, args);
        });
      }

      if (orm instanceof EntityRepository) {
        return await RequestContext.create(orm.getEntityManager(), () => {
          return originalMethod.apply(this, args);
        });
      }

      if (!(orm instanceof MikroORM)) {
        const name = respectExistingContext ? 'EnsureRequestContext' : 'CreateRequestContext';
        throw new Error(`@${name}() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@${name}(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      return await RequestContext.create(orm.em, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

export function EnsureRequestContext<T>(getContext?: MikroORM | Promise<MikroORM> | ((type: T) => MikroORM | Promise<MikroORM> | EntityManager | EntityRepository<any> | { getEntityManager(): EntityManager })): MethodDecorator {
  return CreateRequestContext(getContext, true);
}
