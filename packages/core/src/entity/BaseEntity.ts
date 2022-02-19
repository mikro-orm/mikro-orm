import { Reference } from './Reference';
import type { AnyEntity, EntityData, EntityDTO, IWrappedEntity, Loaded } from '../typings';
import type { AssignOptions } from './EntityAssigner';
import { EntityAssigner } from './EntityAssigner';

export abstract class BaseEntity<T, PK extends keyof T, P extends string = never> implements IWrappedEntity<T, PK, P> {

  isInitialized(): boolean {
    return (this as unknown as AnyEntity<T>).__helper!.__initialized;
  }

  isTouched(): boolean {
    return (this as unknown as AnyEntity<T>).__helper!.__touched;
  }

  populated(populated = true): void {
    (this as unknown as AnyEntity<T>).__helper!.populated(populated);
  }

  toReference() {
    return Reference.create(this) as any; // maintain the type from IWrappedEntity
  }

  toObject(ignoreFields: string[] = []): EntityDTO<T> {
    return (this as unknown as AnyEntity<T>).__helper!.toObject(ignoreFields);
  }

  toJSON(...args: any[]): EntityDTO<T> {
    return this.toObject(...args);
  }

  toPOJO(): EntityDTO<T> {
    return (this as unknown as AnyEntity<T>).__helper!.toPOJO();
  }

  assign(data: EntityData<T>, options?: AssignOptions): T {
    return EntityAssigner.assign(this as unknown as T, data, options);
  }

  init<P extends string = never>(populated = true): Promise<Loaded<T, P>> {
    return (this as unknown as AnyEntity<T>).__helper!.init<P>(populated);
  }

  getSchema(): string | undefined {
    return (this as unknown as AnyEntity<T>).__helper!.getSchema();
  }

  setSchema(schema?: string): void {
    (this as unknown as AnyEntity<T>).__helper!.setSchema(schema);
  }

}

Object.defineProperty(BaseEntity.prototype, '__baseEntity', { value: true, writable: false, enumerable: false });
