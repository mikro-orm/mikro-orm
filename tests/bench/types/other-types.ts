#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for other commonly used types.
 * Looking for optimization opportunities in FilterQuery, EntityData, etc.
 */

import { bench } from '@ark/attest';
import {
  type FilterQuery,
  type EntityData,
  type RequiredEntityData,
  type Ref,
  type Collection,
  type Primary,
  type EntityDTO,
  type Loaded,
  PrimaryKeyProp,
  OptionalProps,
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
  [OptionalProps]?: 'publisher' | 'tags';
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
  [OptionalProps]?: 'age' | 'bio' | 'favouriteBook';
}

// ============================================
// FilterQuery benchmarks
// ============================================

// eslint-disable-next-line
function useFilter<T>(_filter: FilterQuery<T>): void {}

bench('FilterQuery<Author> - simple', () => {
  useFilter<Author>({ name: 'test' });
}).types([520, 'instantiations']);

bench('FilterQuery<Author> - with relation', () => {
  useFilter<Author>({ books: { title: 'test' } });
}).types([1056, 'instantiations']);

bench('FilterQuery<Author> - with operators', () => {
  useFilter<Author>({ age: { $gt: 18 }, name: { $like: '%test%' } });
}).types([666, 'instantiations']);

bench('FilterQuery<Book> - nested relations', () => {
  useFilter<Book>({ author: { books: { publisher: { name: 'test' } } } });
}).types([1428, 'instantiations']);

// ============================================
// EntityData benchmarks
// ============================================

// eslint-disable-next-line
function useEntityData<T>(_data: EntityData<T>): void {}

bench('EntityData<Author> - simple', () => {
  useEntityData<Author>({ name: 'test', email: 'test@test.com' });
}).types([213, 'instantiations']);

bench('EntityData<Book> - with relations', () => {
  useEntityData<Book>({
    title: 'test',
    price: 10,
    author: { name: 'test' } as any,
  });
}).types([594, 'instantiations']);

// ============================================
// RequiredEntityData benchmarks
// ============================================

// eslint-disable-next-line
function useRequiredData<T>(_data: RequiredEntityData<T>): void {}

bench('RequiredEntityData<Author> - simple', () => {
  useRequiredData<Author>({ name: 'test', email: 'test@test.com' });
}).types([2063, 'instantiations']);

bench('RequiredEntityData<Book> - with required relations', () => {
  useRequiredData<Book>({ title: 'test', price: 10, author: {} as Author });
}).types([3343, 'instantiations']);

// ============================================
// Primary type benchmarks
// ============================================

// eslint-disable-next-line
function usePrimary<T>(_pk: Primary<T>): void {}

bench('Primary<Author> - simple PK', () => {
  usePrimary<Author>(1);
}).types([39, 'instantiations']);

bench('Primary<Book> - simple PK', () => {
  usePrimary<Book>(1);
}).types([37, 'instantiations']);

// ============================================
// EntityDTO benchmarks
// ============================================

// eslint-disable-next-line
function useDTO<T>(_dto: EntityDTO<T>): void {}

bench('EntityDTO<Author> - simple', () => {
  useDTO<Author>({} as EntityDTO<Author>);
}).types([1141, 'instantiations']);

bench('EntityDTO<Loaded<Author, "books">> - with loaded hint', () => {
  useDTO<Loaded<Author, 'books'>>({} as EntityDTO<Loaded<Author, 'books'>>);
}).types([3885, 'instantiations']);
