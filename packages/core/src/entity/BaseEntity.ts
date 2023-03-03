import { Reference } from './Reference';
import type { Ref, EntityData, EntityDTO, Loaded, AddEager, LoadedReference } from '../typings';
import type { AssignOptions } from './EntityAssigner';
import { EntityAssigner } from './EntityAssigner';
import { helper } from './wrap';

export abstract class BaseEntity {

  isInitialized(): boolean {
    return helper(this).__initialized;
  }

  isTouched(): boolean {
    return helper(this).__touched;
  }

  populated(populated = true): void {
    helper(this).populated(populated);
  }

  toReference<T extends this = this>(): Ref<T> & LoadedReference<Loaded<T, AddEager<T>>> {
    return Reference.create(this) as unknown as Ref<T> & LoadedReference<Loaded<T, AddEager<T>>>;
  }

  toObject<T extends this = this>(ignoreFields: string[] = []): EntityDTO<T> {
    return helper(this as unknown as T).toObject(ignoreFields);
  }

  toPOJO<T extends this = this>(): EntityDTO<T> {
    return helper(this as unknown as T).toPOJO();
  }

  assign(data: EntityData<this>, options?: AssignOptions): this {
    return EntityAssigner.assign(this as object, data, options) as this;
  }

  init<Populate extends string = never>(populated = true): Promise<Loaded<this, Populate>> {
    return helper(this).init<Populate>(populated);
  }

  getSchema(): string | undefined {
    return helper(this).getSchema();
  }

  setSchema(schema?: string): void {
    helper(this).setSchema(schema);
  }

}

Object.defineProperty(BaseEntity.prototype, '__baseEntity', { value: true, writable: false, enumerable: false });
