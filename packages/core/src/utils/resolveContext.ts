import { EntityRepository } from '../entity/EntityRepository';
import { EntityManager } from '../EntityManager';
import { MikroORM } from '../MikroORM';
import type { Context, MaybePromise } from '../typings';

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
export async function resolveContext<T>(caller: T & { orm?: MaybePromise<MikroORM>; em?: MaybePromise<EntityManager> }, context?: Context<T>): Promise<EntityManager | undefined> {
  const ctx = typeof context === 'function' ? await context(caller) : await context;
  return getEntityManager({ orm: await caller.orm, em: await caller.em }, ctx);
}
