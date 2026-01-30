#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for common API method signatures.
 * Tests em.find, em.create, em.populate, serialize, wrap().toObject(), etc.
 */

import { bench } from '@ark/attest';
import {
  type EntityManager,
  type FilterQuery,
  type Loaded,
  type Ref,
  type Collection,
  type EntityData,
  type EntityDTO,
  type RequiredEntityData,
  type New,
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
  address: string;
  books: Collection<Book>;
  [PrimaryKeyProp]?: 'id';
}

interface Book {
  id: number;
  title: string;
  price: number;
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
  bio?: string;
  books: Collection<Book>;
  favouriteBook?: Ref<Book> | null;
  friends: Collection<Author>;
  [PrimaryKeyProp]?: 'id';
}

// ============================================
// em.find() - return type computation
// ============================================

// Simulating what happens when you call em.find()
declare const em: EntityManager;

bench('em.find() return type - no options', () => {
  type R = ReturnType<typeof em.find<Author>>;
  const x = {} as R;
  void x;
}).types([705, 'instantiations']);

bench('em.find() return type - with populate', () => {
  type R = ReturnType<typeof em.find<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([705, 'instantiations']);

bench('em.find() return type - with populate and fields', () => {
  type R = ReturnType<typeof em.find<Author, 'books', 'name' | 'email'>>;
  const x = {} as R;
  void x;
}).types([703, 'instantiations']);

// ============================================
// em.create() - input and return type computation
// ============================================

bench('em.create() return type', () => {
  type R = ReturnType<typeof em.create<Author>>;
  const x = {} as R;
  void x;
}).types([1741, 'instantiations']);

bench('RequiredEntityData - Author', () => {
  type R = RequiredEntityData<Author>;
  const x = {} as R;
  void x;
}).types([1436, 'instantiations']);

bench('RequiredEntityData - Book', () => {
  type R = RequiredEntityData<Book>;
  const x = {} as R;
  void x;
}).types([1249, 'instantiations']);

// New<T> type (used as create return type)
bench('New<Author>', () => {
  type R = New<Author>;
  const x = {} as R;
  void x;
}).types([611, 'instantiations']);

bench('New<Author, "books">', () => {
  type R = New<Author, 'books'>;
  const x = {} as R;
  void x;
}).types([1032, 'instantiations']);

// ============================================
// em.populate() - return type computation
// ============================================

bench('em.populate() return type - plain', () => {
  type R = ReturnType<typeof em.populate<Author>>;
  const x = {} as R;
  void x;
}).types([149, 'instantiations']);

// ============================================
// EntityDTO - used by toObject(), serialize()
// ============================================

bench('EntityDTO<Author>', () => {
  type R = EntityDTO<Author>;
  const x = {} as R;
  void x;
}).types([1078, 'instantiations']);

bench('EntityDTO<Book>', () => {
  type R = EntityDTO<Book>;
  const x = {} as R;
  void x;
}).types([954, 'instantiations']);

bench('EntityDTO<Loaded<Author, "books">>', () => {
  type R = EntityDTO<Loaded<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([3617, 'instantiations']);

bench('EntityDTO<Loaded<Author, "books.publisher">>', () => {
  type R = EntityDTO<Loaded<Author, 'books.publisher'>>;
  const x = {} as R;
  void x;
}).types([3617, 'instantiations']);

// ============================================
// FilterQuery - used in where clauses
// ============================================

bench('FilterQuery<Author>', () => {
  type R = FilterQuery<Author>;
  const x = {} as R;
  void x;
}).types([536, 'instantiations']);

bench('FilterQuery<Book>', () => {
  type R = FilterQuery<Book>;
  const x = {} as R;
  void x;
}).types([505, 'instantiations']);

bench('FilterQuery<Loaded<Author, "books">>', () => {
  type R = FilterQuery<Loaded<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([2499, 'instantiations']);

// ============================================
// EntityData - used in em.assign()
// ============================================

bench('EntityData<Author>', () => {
  type R = EntityData<Author>;
  const x = {} as R;
  void x;
}).types([216, 'instantiations']);

bench('EntityData<Loaded<Author, "books">>', () => {
  type R = EntityData<Loaded<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([1880, 'instantiations']);

// ============================================
// Simulating wrap(e).toObject()
// ============================================

// toObject returns EntityDTO<Entity>
type ToObjectReturn<T> = EntityDTO<T>;

bench('wrap(author).toObject() return type', () => {
  type R = ToObjectReturn<Author>;
  const x = {} as R;
  void x;
}).types([1079, 'instantiations']);

bench('wrap(loadedAuthor).toObject() return type', () => {
  type R = ToObjectReturn<Loaded<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([3619, 'instantiations']);

// ============================================
// Complex scenarios
// ============================================

// Chained operations: find -> populate -> toObject
bench('find result then EntityDTO', () => {
  type FindResult = Loaded<Author, 'books'>;
  type DTOResult = EntityDTO<FindResult>;
  const x = {} as DTOResult;
  void x;
}).types([3617, 'instantiations']);
