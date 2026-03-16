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
  SerializeDTO,
} from '../typings.js';
import { EntityAssigner, type AssignOptions } from './EntityAssigner.js';
import type { EntityLoaderOptions } from './EntityLoader.js';
import { EntitySerializer, type SerializeOptions } from '../serialization/EntitySerializer.js';
import { helper } from './wrap.js';
import type { FindOneOptions } from '../drivers/IDatabaseDriver.js';
import type { PopulatePath } from '../enums.js';

/** Base class for entities providing convenience methods like `assign()`, `toObject()`, and `populate()`. */
export abstract class BaseEntity {
  /** Returns whether the entity has been fully loaded from the database. */
  isInitialized(): boolean {
    return helper(this).__initialized;
  }

  /** Marks the entity as populated or not for serialization purposes. */
  populated(populated = true): void {
    helper(this).populated(populated);
  }

  /** Loads the specified relations on this entity. */
  async populate<Entity extends this = this, Hint extends string = never, Fields extends string = never>(
    populate: AutoPath<Entity, Hint, PopulatePath.ALL>[] | false,
    options: EntityLoaderOptions<Entity, Fields> = {},
  ): Promise<Loaded<Entity, Hint>> {
    return helper(this as Entity).populate(populate, options);
  }

  /** Returns a Reference wrapper for this entity. */
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

  /** Converts the entity to a plain object, including all properties regardless of serialization rules. */
  toPOJO<Entity extends this = this>(): EntityDTO<Entity> {
    return helper(this as Entity).toPOJO();
  }

  /** Serializes the entity with control over which relations and fields to include or exclude. */
  serialize<
    Entity extends this = this,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Hint extends string = never,
    Exclude extends string = never,
  >(options?: SerializeOptions<Naked, Hint, Exclude>): SerializeDTO<Naked, Hint, Exclude> {
    return EntitySerializer.serialize(this as unknown as Naked, options);
  }

  /** Assigns the given data to this entity, updating its properties and relations. */
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

  /** Initializes (refreshes) the entity by reloading it from the database. Returns null if not found. */
  init<
    Entity extends this = this,
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(options?: FindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    return helper(this as Entity).init(options);
  }

  /** Returns the database schema this entity belongs to. */
  getSchema(): string | undefined {
    return helper(this).getSchema();
  }

  /** Sets the database schema for this entity. */
  setSchema(schema?: string): void {
    helper(this).setSchema(schema);
  }
}

Object.defineProperty(BaseEntity.prototype, '__baseEntity', { value: true, writable: false, enumerable: false });
