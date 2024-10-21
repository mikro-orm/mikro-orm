 import { EntityRepository } from '../entity/EntityRepository';
import { EntityManager } from '../EntityManager';
import { MikroORM } from '../MikroORM';
import type { GetContext, MaybePromise } from '../typings';

function getEntityManager(caller: { orm?: MikroORM; em?: EntityManager }, context: unknown): EntityManager | undefined {
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

  return undefined;
}

/**
 * Find entityManager in injected context, or else in class's orm or em properties.
 */
export async function resolveGetContext<T>(caller: T & { orm?: MaybePromise<MikroORM>; em?: MaybePromise<EntityManager> }, getContext?: GetContext<T>): Promise<EntityManager | undefined> {
  const context = typeof getContext === 'function' ? await getContext(caller) : await getContext;
  return getEntityManager({ orm: await caller.orm, em: await caller.em }, context);
}
