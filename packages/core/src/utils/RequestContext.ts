import { AsyncLocalStorage } from 'async_hooks';
import type { EntityManager } from '../EntityManager';

/**
 * Uses `AsyncLocalStorage` to create async context that holds current EM fork.
 */
export class RequestContext {

  private static storage = new AsyncLocalStorage<RequestContext>();
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
   * If the handler is async, the return value needs to be awaited.
   */
  static create<T>(em: EntityManager | EntityManager[], next: (...args: any[]) => T, options: CreateContextOptions = {}): T {
    const ctx = this.createContext(em, options);
    return this.storage.run(ctx, next);
  }

  /**
   * Returns current RequestContext (if available).
   */
  static currentRequestContext(): RequestContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Returns current EntityManager (if available).
   */
  static getEntityManager(name = 'default'): EntityManager | undefined {
    const context = RequestContext.currentRequestContext();
    return context ? context.map.get(name) : undefined;
  }

  private static createContext(em: EntityManager | EntityManager[], options: CreateContextOptions = {}): RequestContext {
    const forks = new Map<string, EntityManager>();

    if (Array.isArray(em)) {
      em.forEach(em => forks.set(em.name, em.fork({ useContext: true, schema: options.schema })));
    } else {
      forks.set(em.name, em.fork({ useContext: true, schema: options.schema }));
    }

    return new RequestContext(forks);
  }

}

export interface CreateContextOptions {
  schema?: string;
}
