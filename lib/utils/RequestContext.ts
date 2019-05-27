import * as domain from 'domain';
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

  static create(em: EntityManager, next: (...args: any[]) => void) {
    const context = new RequestContext(em.fork());
    const d = domain.create();
    d.__mikro_orm_context = context;
    d.run(next);
  }

  static currentRequestContext(): RequestContext | undefined {
    return domain.active ? domain.active.__mikro_orm_context : undefined;
  }

  static getEntityManager(): EntityManager | undefined {
    const context = RequestContext.currentRequestContext();
    return context ? context.em : undefined;
  }

}
