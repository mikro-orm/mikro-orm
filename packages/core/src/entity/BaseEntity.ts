import { Reference } from './Reference';
import type { AutoPath, Ref, EntityData, EntityDTO, Loaded, AddEager, LoadedReference, EntityKey } from '../typings';
import type { AssignOptions } from './EntityAssigner';
import { EntityAssigner } from './EntityAssigner';
import type { EntityLoaderOptions } from './EntityLoader';
import type { SerializeOptions } from '../serialization/EntitySerializer';
import { EntitySerializer } from '../serialization/EntitySerializer';
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

  async populate<Entity extends this = this, Hint extends string = never>(
    populate: AutoPath<Entity, Hint>[] | boolean,
    options: EntityLoaderOptions<Entity, Hint> = {},
  ): Promise<Loaded<Entity, Hint>> {
    return helper(this as Entity).populate(populate, options);
  }

  toReference<Entity extends this = this>(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>> {
    return Reference.create(this) as unknown as Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  }

  toObject<Entity extends this = this>(): EntityDTO<Entity>;
  toObject<Entity extends this = this>(ignoreFields: never[]): EntityDTO<Entity>;
  toObject<Entity extends this = this, Ignored extends EntityKey<Entity> = never>(ignoreFields: Ignored[]): Omit<EntityDTO<Entity>, Ignored>;
  toObject<Entity extends this = this, Ignored extends EntityKey<Entity> = never>(ignoreFields?: Ignored[]): Omit<EntityDTO<Entity>, Ignored> {
    return helper(this as Entity).toObject(ignoreFields!);
  }

  toPOJO<Entity extends this = this>(): EntityDTO<Entity> {
    return helper(this as Entity).toPOJO();
  }

  serialize<Entity extends this = this, Hint extends string = never, Exclude extends string = never>(options?: SerializeOptions<Entity, Hint, Exclude>): EntityDTO<Loaded<Entity, Hint>> {
    return EntitySerializer.serialize(this as Entity, options);
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
