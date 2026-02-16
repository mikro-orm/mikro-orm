#!/usr/bin/env -S node --import=tsx

/**
 * Isolated benchmarks to identify bottlenecks in EntityDTO.
 */

import { bench } from '@ark/attest';
import { type EntityDTO, type Loaded, type Ref, type Collection, PrimaryKeyProp, OptionalProps } from '@mikro-orm/core';

// Simple entity without relations
interface SimpleEntity {
  id: number;
  name: string;
  email: string;
  age?: number;
  [PrimaryKeyProp]?: 'id';
  [OptionalProps]?: 'age';
}

// Entity with one relation
interface EntityWithRef {
  id: number;
  name: string;
  parent?: Ref<SimpleEntity> | null;
  [PrimaryKeyProp]?: 'id';
  [OptionalProps]?: 'parent';
}

// Entity with collection
interface EntityWithCollection {
  id: number;
  name: string;
  items: Collection<SimpleEntity>;
  [PrimaryKeyProp]?: 'id';
}

// eslint-disable-next-line
function useDTO<T>(_dto: EntityDTO<T>): void {}

// ============================================
// EntityDTO on plain entities
// ============================================

bench('EntityDTO<SimpleEntity> - no relations', () => {
  useDTO<SimpleEntity>({} as EntityDTO<SimpleEntity>);
}).types([918, 'instantiations']);

bench('EntityDTO<EntityWithRef> - with Ref', () => {
  useDTO<EntityWithRef>({} as EntityDTO<EntityWithRef>);
}).types([856, 'instantiations']);

bench('EntityDTO<EntityWithCollection> - with Collection', () => {
  useDTO<EntityWithCollection>({} as EntityDTO<EntityWithCollection>);
}).types([791, 'instantiations']);

// ============================================
// EntityDTO on Loaded entities
// ============================================

bench('EntityDTO<Loaded<SimpleEntity>> - loaded no relations', () => {
  useDTO<Loaded<SimpleEntity>>({} as EntityDTO<Loaded<SimpleEntity>>);
}).types([2142, 'instantiations']);

bench('EntityDTO<Loaded<EntityWithRef>> - loaded with Ref', () => {
  useDTO<Loaded<EntityWithRef>>({} as EntityDTO<Loaded<EntityWithRef>>);
}).types([1930, 'instantiations']);

bench('EntityDTO<Loaded<EntityWithRef, "parent">> - loaded with populated Ref', () => {
  useDTO<Loaded<EntityWithRef, 'parent'>>({} as EntityDTO<Loaded<EntityWithRef, 'parent'>>);
}).types([2411, 'instantiations']);

bench('EntityDTO<Loaded<EntityWithCollection>> - loaded with Collection', () => {
  useDTO<Loaded<EntityWithCollection>>({} as EntityDTO<Loaded<EntityWithCollection>>);
}).types([1741, 'instantiations']);

bench('EntityDTO<Loaded<EntityWithCollection, "items">> - loaded with populated Collection', () => {
  useDTO<Loaded<EntityWithCollection, 'items'>>({} as EntityDTO<Loaded<EntityWithCollection, 'items'>>);
}).types([2369, 'instantiations']);

// ============================================
// Comparison: EntityDTO vs direct Loaded
// ============================================

// eslint-disable-next-line
function useLoaded<T, L extends string = never>(_entity: Loaded<T, L>): void {}

bench('Loaded<EntityWithCollection, "items"> - without EntityDTO', () => {
  useLoaded<EntityWithCollection, 'items'>({} as Loaded<EntityWithCollection, 'items'>);
}).types([873, 'instantiations']);
