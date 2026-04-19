import { Reference, type LoadReferenceOptions, type LoadReferenceOrFailOptions, type Ref } from './Reference.js';
import type {
  AutoPath,
  EntityData,
  EntityDTO,
  ExtractFieldsHint,
  Loaded,
  LoadedReference,
  AddEager,
  EntityKey,
  FromEntityType,
  IsSubset,
  MergeSelected,
  ResolveSerializeFields,
  SerializeDTO,
  SerializeFieldsKeepPK,
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
    Fields extends string = never,
  >(
    options?: SerializeOptions<Naked, Hint, Exclude, Fields>,
  ): SerializeDTO<
    Naked,
    Hint,
    Exclude,
    never,
    ResolveSerializeFields<Fields, ExtractFieldsHint<Entity>>,
    SerializeFieldsKeepPK<Fields>
  > {
    return EntitySerializer.serialize(this as unknown as Naked, options) as any;
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

/* eslint-disable @typescript-eslint/no-explicit-any */

type EntityConstructor<T extends object = object> = abstract new (...args: any[]) => T;

/**
 * The `load()` / `loadOrFail()` methods added by the {@link Loadable} mixin. Declared as an interface so the
 * mixin function can have an explicit return type (required by JSR fast-check).
 */
export interface LoadableEntity {
  /**
   * Ensures this entity is loaded (without reloading it if it already is). Returns the entity, or `null` if it
   * was not found in the database (e.g. it was deleted in the meantime, or active filters disallow loading it).
   * Use `loadOrFail()` if you want an error to be thrown in such a case.
   */
  load<
    Entity extends this = this,
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    options?: LoadReferenceOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes> | null>;

  /**
   * Ensures this entity is loaded (without reloading it if it already is). Returns the entity, or throws an error
   * just like `em.findOneOrFail()` (and respects the same config options) if it was not found.
   */
  loadOrFail<
    Entity extends this = this,
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    options?: LoadReferenceOrFailOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes>>;
}

/** Return-type shape of {@link Loadable} — a constructor that produces instances of `TBase` enriched with {@link LoadableEntity}. */
export type LoadableConstructor<TBase extends EntityConstructor> = abstract new (
  ...args: any[]
) => InstanceType<TBase> & LoadableEntity;

/** Internal: rejects a base class that already defines `load` or `loadOrFail` to prevent silent override. */
type EnsureNoLoadConflict<TBase extends EntityConstructor> =
  InstanceType<TBase> extends {
    load: any;
  }
    ? 'Loadable: base class already defines `load` — remove it or do not apply the mixin'
    : InstanceType<TBase> extends { loadOrFail: any }
      ? 'Loadable: base class already defines `loadOrFail` — remove it or do not apply the mixin'
      : TBase;

/** Empty base for {@link Loadable} when called without arguments — standalone mixin, no inherited base. */
abstract class EmptyBase {}

/**
 * Mixin that adds `load()` / `loadOrFail()` methods to an entity class. These methods ensure the entity is loaded
 * from the database without reloading it if it already is — unlike `init()`, which always refreshes.
 *
 * Useful when migrating from a non-`Ref`-based codebase where lazy loading support is desired without the
 * `.$` / `.get()` indirection that the `Reference` wrapper requires. Opt-in so it does not conflict with entities
 * that already define a `load` or `loadOrFail` property — applying the mixin to a base class that already has
 * either method is a compile error to prevent silent override.
 *
 * Call without arguments (`Loadable()`) for a standalone base with no other inheritance, or pass a base class
 * (`Loadable(BaseEntity)`) to compose. The convenience alias {@link LoadableBaseEntity} is shorthand for the
 * latter.
 *
 * @example
 * ```ts
 * // compose with BaseEntity
 * class User extends Loadable(BaseEntity) {
 *   ＠PrimaryKey()
 *   id!: number;
 * }
 *
 * // standalone — no inherited base
 * class Product extends Loadable() {
 *   ＠PrimaryKey()
 *   id!: number;
 * }
 *
 * const user = orm.em.getReference(User, 1);
 * await user.load();
 * ```
 */
export function Loadable(): LoadableConstructor<typeof EmptyBase> & typeof EmptyBase;
export function Loadable<TBase extends EntityConstructor>(
  Base: EnsureNoLoadConflict<TBase> extends TBase ? TBase : never,
): LoadableConstructor<TBase> & TBase;
export function Loadable<TBase extends EntityConstructor>(
  Base: TBase = EmptyBase as unknown as TBase,
): LoadableConstructor<TBase> & TBase {
  abstract class LoadableMixin extends Base {
    async load(options?: LoadReferenceOptions<object>): Promise<object | null> {
      return Reference.create(this).load(options) as Promise<object | null>;
    }

    async loadOrFail(options?: LoadReferenceOrFailOptions<object>): Promise<object> {
      return Reference.create(this).loadOrFail(options) as Promise<object>;
    }
  }

  return LoadableMixin as unknown as LoadableConstructor<TBase> & TBase;
}

const LoadableBaseEntityBase: LoadableConstructor<typeof BaseEntity> & typeof BaseEntity = Loadable(BaseEntity);

/** Convenience: `BaseEntity` pre-composed with the `Loadable` mixin. */
export abstract class LoadableBaseEntity extends LoadableBaseEntityBase {}
