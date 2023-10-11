import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';
import { Utils } from '@mikro-orm/core';

export function CreateRequestContext<T>(getContext?: MikroORM | Promise<MikroORM> | ((type?: T) => MikroORM | Promise<MikroORM>)): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: T, ...args: any[]) {
      /* istanbul ignore next */
      let orm: unknown;

      if (!getContext) {
        orm = (this as any).orm;
      } else if (typeof getContext === 'function') {
        orm = getContext(this);
      } else {
        orm = getContext;
      }

      if (Utils.isAsync(orm)) {
        orm = await orm;
      }

      if (!(orm instanceof MikroORM)) {
        throw new Error('@CreateRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, or with a callback parameter like `@CreateRequestContext(() => orm)`');
      }

      return await RequestContext.createAsync(orm.em, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
