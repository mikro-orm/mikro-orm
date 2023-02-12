import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';

export function CreateRequestContext<T>(getContext?: MikroORM | Promise<MikroORM> | ((type?: T) => MikroORM | Promise<MikroORM>)): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: T, ...args: any[]) {
      /* istanbul ignore next */
      let orm: unknown;

      if (typeof getContext === 'function') {
        orm = await (getContext(this) ?? (this as any).orm);
      } else if (getContext) {
        orm = await getContext;
      } else {
        orm = await (this as any).orm;
      }

      if (!(orm instanceof MikroORM)) {
        throw new Error('@CreateRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, or with a callback parameter like `@CreateRequestContext(() => orm)`');
      }

      return await RequestContext.create(orm.em, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
