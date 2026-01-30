#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for asterisk (*) populate hints.
 * Tests Loaded with wildcard patterns for recursive population.
 */

import { bench } from '@ark/attest';
import { type Loaded, type Ref, type Collection, PrimaryKeyProp } from '@mikro-orm/core';

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
// Loaded with asterisk (recursive populate all)
// ============================================

// eslint-disable-next-line
function useLoaded<T, L extends string = never, F extends string = '*'>(_entity: Loaded<T, L, F>): void {
  /* empty */
}

bench('Loaded<Author, "*"> - asterisk populate all', () => {
  useLoaded<Author, '*'>({} as Loaded<Author, '*'>);
}).types([1390, 'instantiations']);

bench('Loaded<Book, "*"> - asterisk populate all', () => {
  useLoaded<Book, '*'>({} as Loaded<Book, '*'>);
}).types([1921, 'instantiations']);

bench('Loaded<Publisher, "*"> - asterisk populate all', () => {
  useLoaded<Publisher, '*'>({} as Loaded<Publisher, '*'>);
}).types([1066, 'instantiations']);

// Compare with explicit paths
bench('Loaded<Author, "books"> - single relation', () => {
  useLoaded<Author, 'books'>({} as Loaded<Author, 'books'>);
}).types([1163, 'instantiations']);

bench('Loaded<Author, "books" | "friends"> - multiple relations', () => {
  useLoaded<Author, 'books' | 'friends'>({} as Loaded<Author, 'books' | 'friends'>);
}).types([1295, 'instantiations']);

// ============================================
// Loaded with asterisk fields (F parameter)
// ============================================

bench('Loaded<Author, "books", "*"> - default fields', () => {
  useLoaded<Author, 'books', '*'>({} as Loaded<Author, 'books', '*'>);
}).types([1023, 'instantiations']);

bench('Loaded<Author, "books", "name" | "email"> - specific fields', () => {
  useLoaded<Author, 'books', 'name' | 'email'>({} as Loaded<Author, 'books', 'name' | 'email'>);
}).types([985, 'instantiations']);

// ============================================
// Helper type benchmarks
// ============================================

type Prefix<T, K> = K extends `${infer S}.${string}` ? S : K extends '*' ? keyof T : K;

// eslint-disable-next-line
function testPrefix<T, K>(_val: Prefix<T, K>): void {}

bench('Prefix<Author, "*"> - asterisk expansion', () => {
  testPrefix<Author, '*'>('books');
}).types([11, 'instantiations']);

bench('Prefix<Author, "books.title"> - dotted path', () => {
  testPrefix<Author, 'books.title'>('books');
}).types([9, 'instantiations']);

type Suffix<Key, Hint extends string, All = true | '*'> = Hint extends `${infer Pref}.${infer Suf}`
  ? Pref extends Key
    ? Suf
    : never
  : Hint extends All
    ? Hint
    : never;

// eslint-disable-next-line
function testSuffix<K, H extends string>(_val: Suffix<K, H>): void {}

bench('Suffix<"books", "*"> - asterisk as hint', () => {
  testSuffix<'books', '*'>('*');
}).types([15, 'instantiations']);

bench('Suffix<"books", "books.title"> - extract suffix', () => {
  testSuffix<'books', 'books.title'>('title');
}).types([13, 'instantiations']);
