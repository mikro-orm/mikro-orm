#!/usr/bin/env -S node --import=tsx

/**
 * Deep benchmarks for FilterQuery type to identify optimization opportunities.
 */

import { bench } from '@ark/attest';
import { type FilterQuery, type FilterObject, type ExpandQuery, type EntityKey, type Ref, type Collection, PrimaryKeyProp } from '@mikro-orm/core';

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
// FilterQuery type benchmarks
// ============================================

// eslint-disable-next-line
function useFilter<T>(_filter: FilterQuery<T>): void {}

bench('FilterQuery<Tag> - simple entity', () => {
  useFilter<Tag>({ name: 'test' });
}).types([419, 'instantiations']);

bench('FilterQuery<Publisher> - entity with collection', () => {
  useFilter<Publisher>({ name: 'test' });
}).types([446, 'instantiations']);

bench('FilterQuery<Book> - entity with relations', () => {
  useFilter<Book>({ title: 'test' });
}).types([478, 'instantiations']);

bench('FilterQuery<Author> - complex entity', () => {
  useFilter<Author>({ name: 'test' });
}).types([509, 'instantiations']);

// ============================================
// Nested query benchmarks
// ============================================

bench('FilterQuery<Author> - nested 1 level', () => {
  useFilter<Author>({ books: { title: 'test' } });
}).types([1034, 'instantiations']);

bench('FilterQuery<Author> - nested 2 levels', () => {
  useFilter<Author>({ books: { publisher: { name: 'test' } } });
}).types([1312, 'instantiations']);

bench('FilterQuery<Author> - nested 3 levels', () => {
  useFilter<Author>({ books: { publisher: { books: { title: 'test' } } } });
}).types([1343, 'instantiations']);

// ============================================
// Component type benchmarks
// ============================================

// eslint-disable-next-line
function useFilterObject<T>(_filter: FilterObject<T>): void {}

bench('FilterObject<Author> - direct', () => {
  useFilterObject<Author>({ name: 'test' });
}).types([427, 'instantiations']);

// eslint-disable-next-line
function useExpandQuery<T>(_filter: ExpandQuery<T>): void {}

bench('ExpandQuery<Author> - direct', () => {
  useExpandQuery<Author>({ name: 'test' });
}).types([579, 'instantiations']);

// ============================================
// EntityKey benchmarks
// ============================================

// eslint-disable-next-line
function useEntityKey<T>(_key: EntityKey<T>): void {}

bench('EntityKey<Author> - direct', () => {
  useEntityKey<Author>('name');
}).types([138, 'instantiations']);

bench('EntityKey<Book> - direct', () => {
  useEntityKey<Book>('title');
}).types([109, 'instantiations']);
