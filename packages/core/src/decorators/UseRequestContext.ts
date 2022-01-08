import { MikroORM } from '../MikroORM';
import { RequestContext } from '../utils/RequestContext';

export function UseRequestContext() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (this: { orm: MikroORM }, ...args: any[]) {
      if (!(this.orm as unknown instanceof MikroORM)) {
        throw new Error('@UseRequestContext() decorator can only be applied to methods of classes with `orm: MikroORM` property');
      }

      return await RequestContext.createAsync(this.orm.em, async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
