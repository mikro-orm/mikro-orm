import type { EmbeddedOptions, EnumOptions, InferEntityFromProperties, ManyToManyOptions, ManyToOneOptions, OneToManyOptions, OneToOneOptions, PropertyOptions } from '../decorators';
import { ReferenceKind } from '../enums';
import { EntitySchema } from '../metadata/EntitySchema';
import { types, type Type } from '../types';
import { type InferJSType } from '../types/Type';
import type { __types, Constructor, Dictionary, EntityMetadata, EntityName, Opt, Ref } from '../typings';
import type { Collection } from './Collection';


export type InferEntity<T extends EntityMetadataLike | { meta?: EntityMetadataLike } > =
 T extends EntityMetadataLike ? NonNullable<T[typeof __types]>['entity'] :
 T extends { meta?: EntityMetadataLike } ? InferEntity<NonNullable<T['meta']>> : never;

interface EntityMetadataLike {
  [__types]?: { entity?: any };
}

export type InferPropertiesFromEntity<T> = {
  [K in keyof T]: PropertyOptions<any, T[K]>
};

export type TypeType = string | NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | Constructor<Type<any>> | Type<any>;

export type TypeDef<Target> = { type: TypeType } | { entity: string | (() => string | EntityName<Target>) };

export type EmbeddedTypeDef<Target> = { type: TypeType } | { entity: string | (() => string | EntityName<Target> | EntityName<Target>[]) };

type InferEntityByName<T extends EntityName<any>> = T extends EntityName<infer U> ? U : never;

type InferType<T extends TypeType> =
  T extends string ? InferTypeByString<T> :
  T extends NumberConstructor ? number :
  T extends StringConstructor ? string :
  T extends BooleanConstructor ? boolean :
  T extends DateConstructor ? Date :
  T extends ArrayConstructor ? string[] :
  T extends Constructor<infer TType> ?
    TType extends Type<any, any> ? NonNullable<InferJSType<TType>> : TType :
  T extends Type<any, any> ? NonNullable<InferJSType<T>> :
  never;

type InferTypeByString<T extends string> =
  T extends 'string[]' ? string[] :
  T extends 'datetime' ? Date :
  T extends 'boolean' ? boolean :
  T extends 'number' | 'float' | 'int' ? number :
  T extends 'string' | 'ObjectId' | 'varchar' | 'character' | 'char' | 'text' | 'date' ? string :
  any;

interface PropertyTypedOptions extends Pick<PropertyOptions<any, any>, 'nullable' | 'ref' | 'onCreate' | 'default'> {
  array?: boolean;
}
type OptOptions = { onCreate: (...args: any) => any } | { default: {} };

type InferVariants<Value, Options extends PropertyTypedOptions> = InferVariantsForNullable<InferVariantsForOpt<InferVariantsForRef<InferVariantsForArray<Value, Options>, Options>, Options>, Options>;
type InferVariantsForNullable<Value, Options extends PropertyTypedOptions> = Options extends { nullable: true } ? Value | null | undefined : Value;
type InferVariantsForOpt<Value, Options extends PropertyTypedOptions> = Options extends OptOptions ? Opt<Value> : Value;
type InferVariantsForRef<Value, Options extends PropertyTypedOptions> = Value extends Collection<any, any> ? Value : Options extends { ref: true } ? Ref<Value> : Value;
type InferVariantsForArray<Value, Options extends PropertyTypedOptions> = Options extends { array: true } ? Value[] : Value;

export interface PropertyFactory<Value> {
  <Options extends Omit<PropertyOptions<any, Value>, 'type'>>
    (options?: Options): PropertyOptions<any, InferVariants<Value, Options>>;
}

export interface TypedPropertyFactory {
  <Value extends TypeType, Options extends Omit<PropertyOptions<any, InferType<Value>>, 'type'>>
    (type: Value, options?: Options): PropertyOptions<any, InferVariants<InferType<Value>, Options>>;
}

// Due to [multiple generics](https://github.com/microsoft/TypeScript/issues/10571), we can only use function overloads for `JsonPropertyFactory`
export interface JsonPropertyFactory {
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable?: false; ref?: false; onCreate?: undefined; default?: undefined }): PropertyOptions<any, Payload>;
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable: true; ref?: false; onCreate?: undefined; default?: undefined }): PropertyOptions<any, Payload | null | undefined>;
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable?: false; ref: true; onCreate?: undefined; default?: undefined }): PropertyOptions<any, Ref<Payload>>;
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable: true; ref: true; onCreate?: undefined; default?: undefined }): PropertyOptions<any, Ref<Payload> | null | undefined>;

  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable?: false; ref?: false } & OptOptions): PropertyOptions<any, Opt<Payload>>;
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable: true; ref?: false } & OptOptions): PropertyOptions<any, Opt<Payload> | null | undefined>;
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable?: false; ref: true } & OptOptions): PropertyOptions<any, Opt<Ref<Payload>>>;
  <Payload = any>(options?: Omit<PropertyOptions<any, Payload>, 'type'> & { nullable: true; ref: true } & OptOptions): PropertyOptions<any, Opt<Ref<Payload>> | null | undefined>;
}

export interface ManyToOneFactory {
  <Target extends object, Options extends ManyToOneOptions<unknown, Target>>
    (entity: () => EntityName<Target>, options?: Options): ({ kind: ReferenceKind.MANY_TO_ONE } & TypeDef<Target> &
      ManyToOneOptions<unknown, Target, InferVariants<Target, Options>>);
}

export interface OneToOneFactory {
  <Target extends object, Options extends OneToOneOptions<unknown, Target>>
    (entity: () => EntityName<Target>, options?: Options): ({ kind: ReferenceKind.ONE_TO_ONE } & TypeDef<Target> &
      OneToOneOptions<unknown, Target, InferVariants<Target, Options>>);
}

export interface OneToManyFactory {
  <Target extends object, Options extends OneToManyOptions<unknown, Target>>
    (entity: () => EntityName<Target>, options: Options): ({ kind: ReferenceKind.ONE_TO_MANY } & TypeDef<Target> &
      OneToManyOptions<unknown, Target, InferVariants<Collection<Target>, Options>>);
}

export interface ManyToManyFactory {
  <Target extends object, Options extends ManyToManyOptions<unknown, Target>>
    (entity: () => EntityName<Target>, options?: Options): ({ kind: ReferenceKind.MANY_TO_MANY } & TypeDef<Target> &
      ManyToManyOptions<unknown, Target, InferVariants<Collection<Target>, Options>>);
}

export interface EmbeddedFactory {
  <Target extends object, Options extends EmbeddedOptions & PropertyOptions<any>>
    (entity: () => EntityName<Target>, options?: Options): ({ kind: ReferenceKind.EMBEDDED } & EmbeddedTypeDef<Target> & EmbeddedOptions &
      PropertyOptions<any, InferVariants<Target, Options>>);

  <Entities extends EntityName<any>[], Options extends EmbeddedOptions & PropertyOptions<any>>
    (entity: () => Entities, options?: Options): ({ kind: ReferenceKind.EMBEDDED } & EmbeddedTypeDef<InferEntityByName<Entities[number]>> & EmbeddedOptions &
      PropertyOptions<any, InferVariants<InferEntityByName<Entities[number]>, Options>>);
}

export interface EnumFactory {
  <EnumType, Options extends EnumOptions<unknown, EnumType>>
    (items: () => Dictionary<EnumType>, option?: Options): ({ enum: true } &
      EnumOptions<unknown, InferVariants<EnumType, Options>>);

  <ItemTypes extends (number | string)[], Options extends EnumOptions<unknown, ItemTypes[number]>>
    (items: ItemTypes, option?: Options) : ({ enum: true } &
      EnumOptions<unknown, InferVariants<ItemTypes[number], Options>>);
}

function propertyFactory<ValueType extends Type<unknown, unknown>>(type: Constructor<ValueType>): PropertyFactory<NonNullable<InferJSType<ValueType>>> {
  return (options => ({ ...options, type }) as any);
}

const typePropertyFactory: TypedPropertyFactory = (type, options) => {
  return { ...options, type } as any;
};

const manyToOneFactory: ManyToOneFactory = (entity, options) => {
  return { ...options, kind: ReferenceKind.MANY_TO_ONE, entity } as any;
};

const oneToOneFactory: OneToOneFactory = (entity, options) => {
  return { ...options, kind: ReferenceKind.ONE_TO_ONE, entity } as any;
};

const oneToManyFactory: OneToManyFactory = (entity, options) => {
  return { ...options, kind: ReferenceKind.ONE_TO_MANY, entity } as any;
};

const manyToManyFactory: ManyToManyFactory = (entity, options) => {
  return { ...options, kind: ReferenceKind.MANY_TO_MANY, entity } as any;
};

const embeddedFactory: EmbeddedFactory = (entity: () => any, options: any) => {
  return { ...options, kind: ReferenceKind.EMBEDDED, entity };
};

const enumFactory: EnumFactory = (items: (number | string)[] | (() => Dictionary), options?: EnumOptions<unknown>) => {
  return { ...options, enum: true as const, items };
};

export const propertyFactories = {
  date: propertyFactory(types.date),
  time: propertyFactory(types.time),
  datetime: propertyFactory(types.datetime),
  bigint: propertyFactory(types.bigint),
  blob: propertyFactory(types.blob),
  uint8array: propertyFactory(types.uint8array),
  array: propertyFactory(types.array),
  json: propertyFactory(types.json) as JsonPropertyFactory,
  integer: propertyFactory(types.integer),
  smallint: propertyFactory(types.smallint),
  tinyint: propertyFactory(types.tinyint),
  mediumint: propertyFactory(types.mediumint),
  float: propertyFactory(types.float),
  double: propertyFactory(types.double),
  boolean: propertyFactory(types.boolean),
  decimal: propertyFactory(types.decimal),
  character: propertyFactory(types.character),
  string: propertyFactory(types.string),
  uuid: propertyFactory(types.uuid),
  text: propertyFactory(types.text),
  interval: propertyFactory(types.interval),
  unknown: propertyFactory(types.unknown),

  property: typePropertyFactory,

  manyToOne: manyToOneFactory,
  oneToOne: oneToOneFactory,
  oneToMany: oneToManyFactory,
  manyToMany: manyToManyFactory,
  embedded: embeddedFactory,

  enum: enumFactory,
} as const;

export function defineEntity<Properties extends Record<string, PropertyOptions<any, unknown>>>(
  meta: Omit<Partial<EntityMetadata<InferEntityFromProperties<Properties>>>, 'properties' | 'extends'> & {
    name: string;
    properties: ((factories: typeof propertyFactories) => Properties) | Properties;
  }): EntitySchema<InferEntityFromProperties<Properties>, never> {
  const { properties: getProperties, ...options } = meta;
  const properties = typeof getProperties === 'function' ? getProperties(propertyFactories) : getProperties;
  return new EntitySchema({ properties, ...options } as any);
}

defineEntity.properties = propertyFactories;

export function defineEntityProperties<Properties extends Record<string, PropertyOptions<any, unknown>>>(properties: ((factories: typeof propertyFactories) => Properties) | Properties): Properties {
  return typeof properties === 'function' ? properties(propertyFactories) : properties;
}
