import { wrap } from './wrap';
import { IdentifiedReference, Reference } from './Reference';
import { Dictionary, EntityData, IWrappedEntity } from '../typings';
import { AssignOptions, EntityAssigner } from './EntityAssigner';

export abstract class BaseEntity<T, PK extends keyof T> implements IWrappedEntity<T, PK> {

  isInitialized(): boolean {
    return wrap(this, true).isInitialized();
  }

  populated(populated = true): void {
    wrap(this, true).populated(populated);
  }

  toReference(): IdentifiedReference<T, PK> {
    return Reference.create<T, PK>(this as unknown as T);
  }

  toObject(ignoreFields: string[] = []): EntityData<T> {
    return wrap(this, true).toObject(ignoreFields) as EntityData<T>;
  }

  toJSON(...args: any[]): EntityData<T> & Dictionary {
    return this.toObject(...args);
  }

  assign(data: EntityData<T>, options?: AssignOptions): T {
    return EntityAssigner.assign(this as unknown as T, data, options);
  }

  init(populated = true): Promise<T> {
    return wrap(this as unknown as T, true).init(populated);
  }

}
