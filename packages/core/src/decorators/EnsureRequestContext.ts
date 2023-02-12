import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';

export function EnsureRequestContext<T>(getContext?: MikroORM | ((type?: T) => MikroORM)): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: T, ...args: any[]) {
      // reuse existing context if available
      if (RequestContext.currentRequestContext()) {
        return originalMethod.apply(this, args);
      }

      /* istanbul ignore next */
      const orm = getContext instanceof MikroORM ? getContext : (getContext?.(this) ?? (this as any).orm);

      if (!(orm as unknown instanceof MikroORM)) {
        throw new Error('@EnsureRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, or with a callback parameter like `@EnsureRequestContext(() => orm)`');
      }

      return await RequestContext.create(orm.em, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
