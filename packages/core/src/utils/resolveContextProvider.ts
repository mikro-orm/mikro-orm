import { EntityRepository } from '../entity/EntityRepository.js';
import { EntityManager } from '../EntityManager.js';
import { MikroORM } from '../MikroORM.js';
import type { ContextProvider, MaybePromise } from '../typings.js';

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
 * Find `EntityManager` in provided context, or else in instance's `orm` or `em` properties.
 */
export async function resolveContextProvider<T>(caller: T & { orm?: MaybePromise<MikroORM>; em?: MaybePromise<EntityManager> }, provider?: ContextProvider<T>): Promise<EntityManager | undefined> {
  const context = typeof provider === 'function' ? await provider(caller) : await provider;
  return getEntityManager({ orm: await caller.orm, em: await caller.em }, context);
}
