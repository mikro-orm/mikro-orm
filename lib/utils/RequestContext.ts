import { createNamespace, getNamespace } from 'node-request-context';
import * as uuid from 'uuid';
import { EntityManager } from '../EntityManager';

export class RequestContext {

  static readonly NAMESPACE = 'mikro-orm-context';
  readonly id = uuid.v4();

  constructor(readonly em: EntityManager) { }

  static create(em: EntityManager, next: Function) {
    const context = new RequestContext(em.fork());
    const namespace = getNamespace(RequestContext.NAMESPACE) || createNamespace(RequestContext.NAMESPACE);

    namespace.run(() => {
      namespace.set(RequestContext.name, context);
      next();
    });
  }

  static currentRequestContext(): RequestContext {
    const namespace = getNamespace(RequestContext.NAMESPACE);
    return namespace ? namespace.get(RequestContext.name) : null;
  }

  static getEntityManager(): EntityManager {
    const context = RequestContext.currentRequestContext();
    return context ? context.em : null;
  }

}
