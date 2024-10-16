import {
  EntityManager,
  EntityRepository,
  MikroORM,
  RequestContext,
  TransactionContext,
  type TransactionOptions,
  Utils,
} from '../';
import type { AsyncFunction, GetContext } from '../typings';

function getEntityManager(caller: { orm?: MikroORM; em?: EntityManager }, context: unknown) {
  if (context instanceof EntityManager) {
    return context;
  }

  if (context instanceof EntityRepository) {
    return context.getEntityManager();
  }

  if (context instanceof MikroORM) {
    return context.em;
  }

  if (caller.em instanceof EntityManager) {
    return caller.em;
  }

  if (caller.orm instanceof MikroORM) {
    return caller.orm.em;
  }

  return TransactionContext.getEntityManager() || RequestContext.getEntityManager();
}

export function Transactional<T extends object>(): MethodDecorator;

export function Transactional<T extends object>(getContext: GetContext<T>): MethodDecorator;

export function Transactional<T extends object>(options: TransactionOptions): MethodDecorator;

export function Transactional<T extends object>(getContext: GetContext<T>, options: TransactionOptions): MethodDecorator;

export function Transactional<T extends object>(getContext?: GetContext<T> | TransactionOptions, options?: TransactionOptions): MethodDecorator {
  return function (target, propertyKey, descriptor: PropertyDescriptor) {
    const originalMethod: AsyncFunction = descriptor.value;

    if (originalMethod.constructor.name !== 'AsyncFunction') {
      throw new Error('@Transactional() should be use with async functions');
    }

    if (Utils.isPlainObject(getContext)) {
      options = getContext as TransactionOptions;
      getContext = undefined;
    }

    descriptor.value = async function (this: T, ...args: any) {
      const context = typeof getContext === 'function'
        ? await getContext(this)
        : await getContext;
      const em = getEntityManager(this, context);

      if (!em) {
        throw new Error(`@Transactional() decorator can only be applied to methods of classes with \`orm: MikroORM\` property, \`em: EntityManager\` property, or with a callback parameter like \`@Transactional(() => orm)\` that returns one of those types. The parameter will contain a reference to current \`this\`. Returning an EntityRepository from it is also supported.`);
      }

      return em.transactional(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
