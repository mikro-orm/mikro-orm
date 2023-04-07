import { Reference } from './Reference';
import type { Ref, EntityData, EntityDTO, Loaded, AddEager, LoadedReference, EntityKey } from '../typings';
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

  toReference<Entity extends this = this>(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>> {
    return Reference.create(this) as unknown as Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  }

  toObject<Entity extends this = this, Ignored extends EntityKey<Entity> = never>(ignoreFields: Ignored[]): Omit<EntityDTO<Entity>, Ignored>;
  toObject<Entity extends this = this>(...args: unknown[]): EntityDTO<Entity>;
  toObject<Entity extends this = this, Ignored extends EntityKey<Entity> = never>(ignoreFields?: Ignored[]): Omit<EntityDTO<Entity>, Ignored> {
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
