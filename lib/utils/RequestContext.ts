import domain from 'domain';
import { v4 as uuid } from 'uuid';
import { EntityManager } from '../EntityManager';

declare module 'domain' {
  export type ORMDomain = Domain & { __mikro_orm_context?: RequestContext };
  const active: ORMDomain;
  function create(): ORMDomain;
}

export class RequestContext {

  readonly id = uuid();

  constructor(readonly em: EntityManager) { }

  /**
   * Creates new RequestContext instance and runs the code inside its domain.
   */
  static create(em: EntityManager, next: (...args: any[]) => void) {
    const context = new RequestContext(em.fork(true, true));
    const d = domain.create();
    d.__mikro_orm_context = context;
    d.run(next);
  }

  /**
   * Returns current RequestContext (if available).
   */
  static currentRequestContext(): RequestContext | undefined {
    return domain.active ? domain.active.__mikro_orm_context : undefined;
  }

  /**
   * Returns current EntityManager (if available).
   */
  static getEntityManager(): EntityManager | undefined {
    const context = RequestContext.currentRequestContext();
    return context ? context.em : undefined;
  }

}
