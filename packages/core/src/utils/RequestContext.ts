import domain, { Domain } from 'domain';
import { EntityManager } from '../EntityManager';
import { Dictionary } from '../typings';

export type ORMDomain = Domain & { __mikro_orm_context?: RequestContext };

/**
 * For node 14 and above it is suggested to use `AsyncLocalStorage` instead,
 * @see https://mikro-orm.io/docs/async-local-storage/
 */
export class RequestContext {

  private static counter = 1;
  readonly id = RequestContext.counter++;

  constructor(readonly map: Map<string, EntityManager>) { }

  /**
   * Returns default EntityManager.
   */
  get em(): EntityManager | undefined {
    return this.map.get('default');
  }

  /**
   * Creates new RequestContext instance and runs the code inside its domain.
   */
  static create(em: EntityManager | EntityManager[], next: (...args: any[]) => void): void {
    const d = this.createDomain(em);
    d.run(next);
  }

  /**
   * Creates new RequestContext instance and runs the code inside its domain.
   * Async variant, when the `next` handler needs to be awaited (like in Koa).
   */
  static async createAsync(em: EntityManager | EntityManager[], next: (...args: any[]) => Promise<void>): Promise<void> {
    const d = this.createDomain(em);
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
  static getEntityManager(name = 'default'): EntityManager | undefined {
    const context = RequestContext.currentRequestContext();
    return context ? context.map.get(name) : undefined;
  }

  private static createDomain(em: EntityManager | EntityManager[]): ORMDomain {
    const forks = new Map<string, EntityManager>();

    if (Array.isArray(em)) {
      em.forEach(em => forks.set(em.name, em.fork(true, true)));
    } else {
      forks.set(em.name, em.fork(true, true));
    }

    const context = new RequestContext(forks);
    const d = domain.create() as ORMDomain;
    d.__mikro_orm_context = context;

    return d;
  }

}
