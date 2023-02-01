import type { IdentifiedReference } from './Reference';
import { Reference } from './Reference';
import type { EntityData, EntityDTO, Loaded } from '../typings';
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

  toReference(): IdentifiedReference<this> {
    return Reference.create(this);
  }

  toObject(ignoreFields: string[] = []): EntityDTO<this> {
    return helper(this).toObject(ignoreFields);
  }

  toJSON(...args: any[]): EntityDTO<this> {
    return this.toObject(...args);
  }

  toPOJO(): EntityDTO<this> {
    return helper(this).toPOJO();
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
