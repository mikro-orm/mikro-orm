import { Reference, type Ref } from './Reference.js';
import type {
  AutoPath,
  EntityData,
  EntityDTO,
  Loaded,
  LoadedReference,
  AddEager,
  EntityKey,
  FromEntityType,
  IsSubset,
  MergeSelected,
} from '../typings.js';
import { EntityAssigner, type AssignOptions } from './EntityAssigner.js';
import type { EntityLoaderOptions } from './EntityLoader.js';
import { EntitySerializer, type SerializeOptions } from '../serialization/EntitySerializer.js';
import { helper } from './wrap.js';
import type { FindOneOptions } from '../drivers/IDatabaseDriver.js';
import type { PopulatePath } from '../enums.js';

export abstract class BaseEntity {
  isInitialized(): boolean {
    return helper(this).__initialized;
  }

  populated(populated = true): void {
    helper(this).populated(populated);
  }

  async populate<Entity extends this = this, Hint extends string = never>(
    populate: AutoPath<Entity, Hint, PopulatePath.ALL>[] | false,
    options: EntityLoaderOptions<Entity> = {},
  ): Promise<Loaded<Entity, Hint>> {
    return helper(this as Entity).populate(populate, options);
  }

  toReference<Entity extends this = this>(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>> {
    return Reference.create(this) as unknown as Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  }

  /**
   * Converts the entity to a plain object representation.
   *
   * **Note on typing with `Loaded` entities:** When called on a `Loaded<Entity, 'relation'>` type,
   * the return type will be `EntityDTO<Entity>` (with relations as primary keys), not
   * `EntityDTO<Loaded<Entity, 'relation'>>` (with loaded relations as nested objects).
   * This is a TypeScript limitation - the `this` type resolves to the class, not the `Loaded` wrapper.
   *
   * For correct typing that reflects loaded relations, use `wrap()`:
   * ```ts
   * const result = await em.find(User, {}, { populate: ['profile'] });
   * // Type: EntityDTO<User> (profile is number)
   * const obj1 = result[0].toObject();
   * // Type: EntityDTO<Loaded<User, 'profile'>> (profile is nested object)
   * const obj2 = wrap(result[0]).toObject();
   * ```
   *
   * Runtime values are correct in both cases - only the static types differ.
   */
  toObject<Entity extends this = this>(): EntityDTO<Entity>;
  /**
   * Converts the entity to a plain object representation.
   *
   * **Note on typing with `Loaded` entities:** When called on a `Loaded<Entity, 'relation'>` type,
   * the return type will be `EntityDTO<Entity>` (with relations as primary keys), not
   * `EntityDTO<Loaded<Entity, 'relation'>>` (with loaded relations as nested objects).
   * This is a TypeScript limitation - the `this` type resolves to the class, not the `Loaded` wrapper.
   *
   * For correct typing that reflects loaded relations, use `wrap()`:
   * ```ts
   * const result = await em.find(User, {}, { populate: ['profile'] });
   * // Type: EntityDTO<User> (profile is number)
   * const obj1 = result[0].toObject();
   * // Type: EntityDTO<Loaded<User, 'profile'>> (profile is nested object)
   * const obj2 = wrap(result[0]).toObject();
   * ```
   *
   * Runtime values are correct in both cases - only the static types differ.
   */
  toObject<Entity extends this = this>(ignoreFields: never[]): EntityDTO<Entity>;
  /**
   * Converts the entity to a plain object representation.
   *
   * **Note on typing with `Loaded` entities:** When called on a `Loaded<Entity, 'relation'>` type,
   * the return type will be `EntityDTO<Entity>` (with relations as primary keys), not
   * `EntityDTO<Loaded<Entity, 'relation'>>` (with loaded relations as nested objects).
   * This is a TypeScript limitation - the `this` type resolves to the class, not the `Loaded` wrapper.
   *
   * For correct typing that reflects loaded relations, use `wrap()`:
   * ```ts
   * const result = await em.find(User, {}, { populate: ['profile'] });
   * // Type: EntityDTO<User> (profile is number)
   * const obj1 = result[0].toObject();
   * // Type: EntityDTO<Loaded<User, 'profile'>> (profile is nested object)
   * const obj2 = wrap(result[0]).toObject();
   * ```
   *
   * Runtime values are correct in both cases - only the static types differ.
   *
   * @param ignoreFields - Array of field names to omit from the result.
   */
  toObject<Entity extends this = this, Ignored extends EntityKey<Entity> = never>(
    ignoreFields: Ignored[],
  ): Omit<EntityDTO<Entity>, Ignored>;
  toObject<Entity extends this = this, Ignored extends EntityKey<Entity> = never>(
    ignoreFields?: Ignored[],
  ): Omit<EntityDTO<Entity>, Ignored> {
    return helper(this as Entity).toObject(ignoreFields!);
  }

  toPOJO<Entity extends this = this>(): EntityDTO<Entity> {
    return helper(this as Entity).toPOJO();
  }

  serialize<
    Entity extends this = this,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Hint extends string = never,
    Exclude extends string = never,
  >(options?: SerializeOptions<Naked, Hint, Exclude>): EntityDTO<Loaded<Naked, Hint>> {
    return EntitySerializer.serialize(this as unknown as Naked, options);
  }

  assign<
    Entity extends this,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Convert extends boolean = false,
    Data extends EntityData<Naked, Convert> | Partial<EntityDTO<Naked>> =
      | EntityData<Naked, Convert>
      | Partial<EntityDTO<Naked>>,
  >(
    data: Data & IsSubset<EntityData<Naked>, Data>,
    options: AssignOptions<Convert> = {},
  ): MergeSelected<Entity, Naked, keyof Data & string> {
    return EntityAssigner.assign(this as Entity, data as any, options) as any;
  }

  init<
    Entity extends this = this,
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(options?: FindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    return helper(this as Entity).init(options);
  }

  getSchema(): string | undefined {
    return helper(this).getSchema();
  }

  setSchema(schema?: string): void {
    helper(this).setSchema(schema);
  }
}

Object.defineProperty(BaseEntity.prototype, '__baseEntity', { value: true, writable: false, enumerable: false });
