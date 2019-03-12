import { createHook, executionAsyncId } from 'async_hooks';
import { v4 as uuid } from 'uuid';
import { EntityManager } from '../EntityManager';

export class RequestContext {

  static readonly CONTEXT: Record<number, RequestContext> = {};
  readonly id = uuid();

  constructor(readonly em: EntityManager) { }

  static create(em: EntityManager, next: Function) {
    RequestContext.CONTEXT[executionAsyncId()] = new RequestContext(em.fork());

    const init = (asyncId: number, type: string, triggerId: number) => {
      if (RequestContext.CONTEXT[triggerId]) {
        RequestContext.CONTEXT[asyncId] = RequestContext.CONTEXT[triggerId];
      }
    };
    const destroy = (asyncId: number) => {
      delete RequestContext.CONTEXT[asyncId];
    };

    createHook({ init, destroy }).enable();
    next();
  }

  static currentRequestContext(): RequestContext | null {
    return RequestContext.CONTEXT[executionAsyncId()] || null;
  }

  static getEntityManager(): EntityManager | null {
    const context = RequestContext.currentRequestContext();
    return context ? context.em : null;
  }

}
