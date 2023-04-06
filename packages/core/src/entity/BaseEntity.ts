import { Reference, type Ref } from './Reference';
import type { AutoPath, EntityData, EntityDTO, Loaded, LoadedReference, AddEager } from '../typings';
import { EntityAssigner, type AssignOptions } from './EntityAssigner';
import type { EntityLoaderOptions } from './EntityLoader';
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

  async populate<This extends this, Hint extends string = never>(
    populate: AutoPath<This, Hint>[] | boolean,
    options: EntityLoaderOptions<This, Hint> = {},
  ): Promise<Loaded<This, Hint>> {
    return helper(this as This).populate(populate, options);
  }

  toReference<Entity extends this = this>(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>> {
    return Reference.create(this) as unknown as Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  }

  toObject<Entity extends this = this>(ignoreFields: string[] = []): EntityDTO<Entity> {
    return helper(this as unknown as Entity).toObject(ignoreFields);
  }

  toPOJO<Entity extends this = this>(): EntityDTO<Entity> {
    return helper(this as unknown as Entity).toPOJO();
  }

  assign<Entity extends this = this>(data: EntityData<Entity>, options?: AssignOptions): Entity {
    return EntityAssigner.assign(this as Entity, data, options);
  }

  init<Entity extends this = this, Populate extends string = never>(populated = true): Promise<Loaded<Entity, Populate>> {
    return helper(this as Entity).init<Populate>(populated);
  }

  getSchema(): string | undefined {
    return helper(this).getSchema();
  }

  setSchema(schema?: string): void {
    helper(this).setSchema(schema);
  }

}

Object.defineProperty(BaseEntity.prototype, '__baseEntity', { value: true, writable: false, enumerable: false });
