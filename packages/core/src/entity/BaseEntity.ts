import { IdentifiedReference, Reference } from './Reference';
import { AnyEntity, Dictionary, EntityData, IWrappedEntity, LoadedReference, Populate } from '../typings';
import { AssignOptions, EntityAssigner } from './EntityAssigner';

export abstract class BaseEntity<T extends AnyEntity<T>, PK extends keyof T> implements IWrappedEntity<T, PK> {

  constructor() {
    Object.defineProperty(this, '__baseEntity', { value: true });
  }

  isInitialized(): boolean {
    return (this as unknown as T).__helper!.isInitialized();
  }

  populated(populated = true): void {
    (this as unknown as T).__helper!.populated(populated);
  }

  toReference<PK2 extends PK = never, P extends Populate<T> = never>(): IdentifiedReference<T, PK2> & LoadedReference<T, P> {
    return Reference.create<T, PK>(this as unknown as T) as IdentifiedReference<T, PK> & LoadedReference<T>;
  }

  toObject(ignoreFields: string[] = []): Dictionary {
    return (this as unknown as T).__helper!.toObject(ignoreFields) as EntityData<T>;
  }

  toJSON(...args: any[]): Dictionary {
    return this.toObject(...args);
  }

  assign(data: EntityData<T>, options?: AssignOptions): T {
    return EntityAssigner.assign(this as unknown as T, data, options);
  }

  init(populated = true): Promise<T> {
    return (this as unknown as T).__helper!.init(populated);
  }

}
