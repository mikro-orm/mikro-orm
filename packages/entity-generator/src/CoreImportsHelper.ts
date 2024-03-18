import {
  BaseEntity,
  Collection,
  Config,
  EagerProps,
  Embeddable,
  Embedded,
  Entity,
  EntitySchema,
  Enum,
  Formula,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Unique,
} from '@mikro-orm/core';

export const POSSIBLE_IMPORTS = [
  BaseEntity.name,
  Collection.name,
  Config.description!,
  EagerProps.description!,
  Embeddable.name,
  Embedded.name,
  Entity.name,
  EntitySchema.name,
  Enum.name,
  Formula.name,
  Index.name,
  ManyToMany.name,
  ManyToOne.name,
  OneToMany.name,
  OneToOne.name,
  PrimaryKey.name,
  PrimaryKeyProp.description!,
  Property.name,
  Unique.name,
] as const;

export const POSSIBLE_TYPE_IMPORTS = [
  'DefineConfig',
  'Hidden',
  'Opt',
  'Ref',
  'EntityRef',
  'ScalarRef',
  'Rel',
] as const;

export const POSSIBLY_GENERATED_CORE_IMPORTS = [
  ...POSSIBLE_TYPE_IMPORTS,
  ...POSSIBLE_IMPORTS,
] as const;

export const ESCAPE_PREFIX = 'U$';

export const RESOLVE_PREFIX = 'Mikro';
