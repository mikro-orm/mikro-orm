#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for assign-related types.
 * Tests EntityAssigner.assign type signature and related helper types.
 */

import { bench } from '@ark/attest';
import {
  type EntityData,
  type EntityDTO,
  type IsSubset,
  type MergeSelected,
  type FromEntityType,
  type Loaded,
  type Ref,
  type Collection,
  PrimaryKeyProp,
} from '@mikro-orm/core';

// ============================================
// Test Entity Definitions
// ============================================

interface Tag {
  id: number;
  name: string;
  [PrimaryKeyProp]?: 'id';
}

interface Publisher {
  id: number;
  name: string;
  books: Collection<Book>;
  [PrimaryKeyProp]?: 'id';
}

interface Book {
  id: number;
  title: string;
  author: Author;
  publisher?: Ref<Publisher> | null;
  tags: Collection<Tag>;
  [PrimaryKeyProp]?: 'id';
}

interface Author {
  id: number;
  name: string;
  email: string;
  age?: number;
  books: Collection<Book>;
  favouriteBook?: Ref<Book> | null;
  friends: Collection<Author>;
  [PrimaryKeyProp]?: 'id';
}

// ============================================
// FromEntityType benchmarks
// ============================================

// eslint-disable-next-line @typescript-eslint/no-empty-function
function useFromEntityType<T>(_result: FromEntityType<T>): void {}

bench('FromEntityType - plain entity', () => {
  useFromEntityType<Author>({} as FromEntityType<Author>);
}).types([23, 'instantiations']);

bench('FromEntityType - Loaded entity', () => {
  useFromEntityType<Loaded<Author, 'books'>>({} as FromEntityType<Loaded<Author, 'books'>>);
}).types([1122, 'instantiations']);

// ============================================
// IsSubset benchmarks
// ============================================

type TestData = { name: string; email: string };

bench('IsSubset - simple', () => {
  type R = IsSubset<EntityData<Author>, TestData>;
  const x = {} as R;
  void x;
}).types([135, 'instantiations']);

bench('IsSubset - with Loaded', () => {
  type R = IsSubset<EntityData<Author>, TestData>;
  const x = {} as R;
  void x;
}).types([135, 'instantiations']);

// ============================================
// MergeSelected benchmarks (the known expensive one)
// ============================================

// MergeSelected optimized using intersection instead of extraction
bench('MergeSelected - plain entity', () => {
  type R = MergeSelected<Author, Author, 'name'>;
  const x = {} as R;
  void x;
}).types([7, 'instantiations']);

bench('MergeSelected - Loaded entity', () => {
  type R = MergeSelected<Loaded<Author, 'books'>, Author, 'name'>;
  const x = {} as R;
  void x;
}).types([1646, 'instantiations']);

// ============================================
// Full assign signature simulation
// ============================================

// Simulate the assign return type computation
type AssignReturnType<Entity extends object, Data> = MergeSelected<Entity, FromEntityType<Entity>, keyof Data & string>;

bench('assign return type - plain entity', () => {
  type R = AssignReturnType<Author, { name: string }>;
  const x = {} as R;
  void x;
}).types([22, 'instantiations']);

bench('assign return type - Loaded entity', () => {
  type R = AssignReturnType<Loaded<Author, 'books'>, { name: string }>;
  const x = {} as R;
  void x;
}).types([1665, 'instantiations']);

// ============================================
// Data parameter type computation
// ============================================

type AssignDataType<Entity extends object, Convert extends boolean = false> =
  | EntityData<FromEntityType<Entity>, Convert>
  | Partial<EntityDTO<FromEntityType<Entity>>>;

bench('assign data type - plain entity', () => {
  type R = AssignDataType<Author>;
  const x = {} as R;
  void x;
}).types([2361, 'instantiations']);

bench('assign data type - Loaded entity', () => {
  type R = AssignDataType<Loaded<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([3432, 'instantiations']);
