#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for populate: true (all relations) pattern.
 * Tests the AutoPath with boolean which triggers the LoadableShape check.
 */

import { bench } from '@ark/attest';
import {
  type AutoPath,
  type PopulatePath,
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
// AutoPath with boolean (populate: true pattern)
// ============================================


function validatePath<T, P extends string | boolean>(
  _path: AutoPath<T, P, PopulatePath.ALL>,
): void { /* empty */ }

bench('AutoPath<Author, true> - populate all', () => {
  validatePath<Author, true>(true);
}).types([6, 'instantiations']);

bench('AutoPath<Book, true> - populate all', () => {
  validatePath<Book, true>(true);
}).types([6, 'instantiations']);

bench('AutoPath<Publisher, true> - populate all', () => {
  validatePath<Publisher, true>(true);
}).types([6, 'instantiations']);

// Compare with string paths
bench('AutoPath<Author, "books"> - string path', () => {
  validatePath<Author, 'books'>('books');
}).types([795, 'instantiations']);

bench('AutoPath<Author, "books.publisher"> - nested string', () => {
  validatePath<Author, 'books.publisher'>('books.publisher');
}).types([1033, 'instantiations']);
