import domain, { Domain } from 'domain';
import { EntityManager } from '../EntityManager';
import { Dictionary } from '../typings';

export type ORMDomain = Domain & { __mikro_orm_context?: RequestContext };

/**
 * For node 14 and above it is suggested to use `AsyncLocalStorage` instead,
 * @see https://mikro-orm.io/docs/async-local-storage/
 */
export class RequestContext {

  readonly id = this.em.id;

  constructor(readonly em: EntityManager) { }

  /**
   * Creates new RequestContext instance and runs the code inside its domain.
   */
  static create(em: EntityManager, next: (...args: any[]) => void): void {
    const context = new RequestContext(em.fork(true, true));
    const d = domain.create() as ORMDomain;
    d.__mikro_orm_context = context;
    d.run(next);
  }

  /**
   * Creates new RequestContext instance and runs the code inside its domain.
   * Async variant, when the `next` handler needs to be awaited (like in Koa).
   */
  static async createAsync(em: EntityManager, next: (...args: any[]) => Promise<void>): Promise<void> {
    const context = new RequestContext(em.fork(true, true));
    const d = domain.create() as ORMDomain;
    d.__mikro_orm_context = context;
    await new Promise((resolve, reject) => {
      d.run(() => next().then(resolve).catch(reject));
    });
  }

  /**
   * Returns current RequestContext (if available).
   */
  static currentRequestContext(): RequestContext | undefined {
    const active = (domain as Dictionary).active as ORMDomain;
    return active ? active.__mikro_orm_context : undefined;
  }

  /**
   * Returns current EntityManager (if available).
   */
  static getEntityManager(): EntityManager | undefined {
    const context = RequestContext.currentRequestContext();
    return context ? context.em : undefined;
  }

}
