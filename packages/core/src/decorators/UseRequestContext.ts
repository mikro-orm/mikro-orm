import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';

export function UseRequestContext(getContext?: MikroORM | (() => MikroORM)) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: { orm: MikroORM }, ...args: any[]) {
      /* istanbul ignore next */
      const orm = getContext instanceof MikroORM ? getContext : (getContext?.() ?? this.orm);

      if (!(orm as unknown instanceof MikroORM)) {
        throw new Error('@UseRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property, or with a callback parameter like `@UseRequestContext(() => orm)`');
      }

      return await RequestContext.createAsync(orm.em, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
