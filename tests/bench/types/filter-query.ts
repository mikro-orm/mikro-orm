#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for FilterQuery and related types.
 * Tests the type computation for where clauses.
 */

import { bench } from '@ark/attest';
import {
  type FilterQuery,
  type FilterObject,
  type EntityKey,
  type Ref,
  type Collection,
  type Loaded,
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
// EntityKey benchmarks
// ============================================

bench('EntityKey<Author>', () => {
  type R = EntityKey<Author>;
  const x = {} as R;
  void x;
}).types([171, 'instantiations']);

bench('EntityKey<Book>', () => {
  type R = EntityKey<Book>;
  const x = {} as R;
  void x;
}).types([142, 'instantiations']);

bench('EntityKey<Loaded<Author, "books">>', () => {
  type R = EntityKey<Loaded<Author, 'books'>>;
  const x = {} as R;
  void x;
}).types([1759, 'instantiations']);

// ============================================
// FilterObject benchmarks
// ============================================

bench('FilterObject<Author>', () => {
  type R = FilterObject<Author>;
  const x = {} as R;
  void x;
}).types([318, 'instantiations']);

bench('FilterObject<Book>', () => {
  type R = FilterObject<Book>;
  const x = {} as R;
  void x;
}).types([289, 'instantiations']);

// ============================================
// FilterQuery benchmarks (already in api-methods but more detailed here)
// ============================================

bench('FilterQuery<Author> - plain', () => {
  type R = FilterQuery<Author>;
  const x = {} as R;
  void x;
}).types([534, 'instantiations']);

bench('FilterQuery<Book> - plain', () => {
  type R = FilterQuery<Book>;
  const x = {} as R;
  void x;
}).types([503, 'instantiations']);

bench('FilterQuery<Tag> - simple entity', () => {
  type R = FilterQuery<Tag>;
  const x = {} as R;
  void x;
}).types([444, 'instantiations']);

// ============================================
// Union entity tests
// ============================================

type AuthorOrBook = Author | Book;

bench('FilterQuery<Author | Book> - union', () => {
  type R = FilterQuery<AuthorOrBook>;
  const x = {} as R;
  void x;
}).types([478, 'instantiations']);

// ============================================
// Nested filter access simulation
// ============================================

// This simulates what happens when you do: em.find(Author, { books: { title: 'foo' } })
bench('FilterQuery nested - author.books', () => {
  type R = FilterObject<Author>['books'];
  const x = {} as R;
  void x;
}).types([1246, 'instantiations']);

bench('FilterQuery nested - book.author', () => {
  type R = FilterObject<Book>['author'];
  const x = {} as R;
  void x;
}).types([1312, 'instantiations']);
