import 'zone.js';
import { EntityManager } from './EntityManager';

export class RequestContext {

  public readonly id = Math.random();

  constructor(public readonly em: EntityManager) { }

  static create(em: EntityManager, next: Function) {
    const context = new RequestContext(em.fork());
    Zone.current.fork({
      name: RequestContext.name,
      properties: { [RequestContext.name]: context },
    }).run(() => next());
  }

  static currentRequestContext(): RequestContext {
    return Zone.current.get(RequestContext.name);
  }

  static getEntityManager(): EntityManager {
    const context = RequestContext.currentRequestContext();

    if (context) {
      return context.em;
    }

    return null;
  }

}
