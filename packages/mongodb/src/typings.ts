import type {
  CountOptions,
  Dictionary,
  FindAllOptions,
  FindByCursorOptions,
  FindOneOptions,
  FindOneOrFailOptions,
  FindOptions,
  StreamOptions,
} from '@mikro-orm/core';

export interface CollationOptions {
  locale: string;
  caseLevel?: boolean;
  caseFirst?: string;
  strength?: number;
  numericOrdering?: boolean;
  alternate?: string;
  maxVariable?: string;
  backwards?: boolean;
}

export interface MongoQueryExtras {
  /** Index name or spec passed as `hint`. */
  indexHint?: string | Dictionary;
  collation?: CollationOptions;
  maxTimeMS?: number;
  allowDiskUse?: boolean;
}

export interface MongoFindOptions<
  Entity,
  Hint extends string = never,
  Fields extends string = '*',
  Excludes extends string = never,
> extends FindOptions<Entity, Hint, Fields, Excludes>, MongoQueryExtras {
}

export interface MongoFindOneOptions<
  T,
  P extends string = never,
  F extends string = '*',
  E extends string = never,
> extends FindOneOptions<T, P, F, E>, MongoQueryExtras {
}

export interface MongoFindOneOrFailOptions<
  T extends object,
  P extends string = never,
  F extends string = '*',
  E extends string = never,
> extends FindOneOrFailOptions<T, P, F, E>, MongoQueryExtras {
}

export interface MongoFindAllOptions<
  T,
  P extends string = never,
  F extends string = '*',
  E extends string = never,
> extends FindAllOptions<T, P, F, E>, MongoQueryExtras {
}

export interface MongoFindByCursorOptions<
  T extends object,
  P extends string = never,
  F extends string = '*',
  E extends string = never,
  I extends boolean = true,
> extends FindByCursorOptions<T, P, F, E, I>, MongoQueryExtras {
}

export interface MongoStreamOptions<
  Entity,
  Populate extends string = never,
  Fields extends string = '*',
  Exclude extends string = never,
> extends StreamOptions<Entity, Populate, Fields, Exclude>, MongoQueryExtras {
}

export interface MongoCountOptions<T extends object, P extends string = never> extends CountOptions<T, P>, Omit<MongoQueryExtras, 'allowDiskUse'> {
}
