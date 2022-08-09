import type { Knex } from 'knex';
import type { EntityMetadata } from '@mikro-orm/core';

export interface Alias {
  aliasName: string;
  entityName: string;
  metadata?: EntityMetadata;
  subQuery?: Knex.QueryBuilder;
}
