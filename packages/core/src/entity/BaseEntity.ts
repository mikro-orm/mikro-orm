import { Reference, type IdentifiedReference } from './Reference';
import type { AutoPath, EntityData, EntityDTO, Loaded } from '../typings';
import { EntityAssigner, type AssignOptions } from './EntityAssigner';
import type { EntityLoaderOptions } from './EntityLoader';
import { helper } from './wrap';

export abstract class BaseEntity<Entity extends object, Primary extends keyof Entity, Populate extends string = string> {

  isInitialized(): boolean {
    return helper(this).__initialized;
  }

  isTouched(): boolean {
    return helper(this).__touched;
  }

  populated(populated = true): void {
    helper(this).populated(populated);
  }

  async populate<This extends this, Hint extends string = never>(
    populate: AutoPath<This, Hint>[] | boolean,
    options: EntityLoaderOptions<This, Hint> = {},
  ): Promise<Loaded<This, Hint>> {
    return helper(this as This).populate(populate, options);
  }

  toReference(): IdentifiedReference<Entity, Primary> {
    return Reference.create(this as unknown as Entity);
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

  assign(data: EntityData<Entity>, options?: AssignOptions): Entity {
    return EntityAssigner.assign(this as object, data, options) as Entity;
  }

  init<Populate extends string = never>(populated = true): Promise<Loaded<Entity, Populate>> {
    // using `Loaded<this>` results in issues with assignability unfortunately
    return helper(this as unknown as Entity).init<Populate>(populated);
  }

  getSchema(): string | undefined {
    return helper(this).getSchema();
  }

  setSchema(schema?: string): void {
    helper(this).setSchema(schema);
  }

}

Object.defineProperty(BaseEntity.prototype, '__baseEntity', { value: true, writable: false, enumerable: false });
