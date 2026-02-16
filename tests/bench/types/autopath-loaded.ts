#!/usr/bin/env -S node --import=tsx

import { bench } from '@ark/attest';
import { type AutoPath, type Loaded, type Ref, type Collection, type PopulatePath, PrimaryKeyProp, EagerProps } from '@mikro-orm/core';

// ============================================
// Test Entity Definitions (simple hierarchy)
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
// AutoPath benchmarks
// ============================================

function validatePath<T, P extends string>(_path: AutoPath<T, P, PopulatePath.ALL>): void {
  /* empty */
}

bench('AutoPath - simple property access', () => {
  validatePath<Author, 'name'>('name');
}).types([682, 'instantiations']);

bench('AutoPath - single relation', () => {
  validatePath<Author, 'books'>('books');
}).types([773, 'instantiations']);

bench('AutoPath - nested relation (2 levels)', () => {
  validatePath<Author, 'books.publisher'>('books.publisher');
}).types([1000, 'instantiations']);

bench('AutoPath - nested relation (3 levels)', () => {
  validatePath<Author, 'books.publisher.books'>('books.publisher.books');
}).types([1043, 'instantiations']);

bench('AutoPath - nested relation (4 levels)', () => {
  validatePath<Author, 'books.publisher.books.author'>('books.publisher.books.author');
}).types([1106, 'instantiations']);

bench('AutoPath - collection with :ref', () => {
  validatePath<Author, 'books:ref'>('books:ref');
}).types([581, 'instantiations']);

// ============================================
// Loaded benchmarks
// ============================================

// eslint-disable-next-line
function useLoaded<T, L extends string = never>(_entity: Loaded<T, L>): void {}

bench('Loaded - no populate', () => {
  useLoaded<Author>({} as Author);
}).types([585, 'instantiations']);

bench('Loaded - single relation', () => {
  useLoaded<Author, 'books'>({} as Loaded<Author, 'books'>);
}).types([961, 'instantiations']);

bench('Loaded - nested relation (2 levels)', () => {
  useLoaded<Author, 'books.publisher'>({} as Loaded<Author, 'books.publisher'>);
}).types([961, 'instantiations']);

bench('Loaded - nested relation (3 levels)', () => {
  useLoaded<Author, 'books.publisher.books'>({} as Loaded<Author, 'books.publisher.books'>);
}).types([961, 'instantiations']);

bench('Loaded - multiple relations', () => {
  useLoaded<Author, 'books' | 'friends' | 'favouriteBook'>({} as Loaded<Author, 'books' | 'friends' | 'favouriteBook'>);
}).types([1242, 'instantiations']);

bench('Loaded - complex nested paths', () => {
  useLoaded<Author, 'books.tags' | 'books.publisher' | 'friends.books'>({} as Loaded<Author, 'books.tags' | 'books.publisher' | 'friends.books'>);
}).types([1119, 'instantiations']);

// ============================================
// Deep hierarchy tests
// ============================================

interface DeepLevel5 {
  id: number;
  value: string;
  [PrimaryKeyProp]?: 'id';
}

interface DeepLevel4 {
  id: number;
  name: string;
  level5: Ref<DeepLevel5>;
  [PrimaryKeyProp]?: 'id';
}

interface DeepLevel3 {
  id: number;
  name: string;
  level4: Ref<DeepLevel4>;
  items: Collection<DeepLevel4>;
  [PrimaryKeyProp]?: 'id';
}

interface DeepLevel2 {
  id: number;
  name: string;
  level3: Ref<DeepLevel3>;
  [PrimaryKeyProp]?: 'id';
}

interface DeepLevel1 {
  id: number;
  name: string;
  level2: Ref<DeepLevel2>;
  children: Collection<DeepLevel2>;
  [PrimaryKeyProp]?: 'id';
}

interface DeepRoot {
  id: number;
  name: string;
  level1: Ref<DeepLevel1>;
  items: Collection<DeepLevel1>;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath - deep hierarchy (6 levels)', () => {
  validatePath<DeepRoot, 'level1.level2.level3.level4.level5'>('level1.level2.level3.level4.level5');
}).types([1402, 'instantiations']);

bench('Loaded - deep hierarchy (6 levels)', () => {
  useLoaded<DeepRoot, 'level1.level2.level3.level4.level5'>({} as Loaded<DeepRoot, 'level1.level2.level3.level4.level5'>);
}).types([923, 'instantiations']);

// ============================================
// Wide entity (many properties) tests
// ============================================

interface WideEntity {
  id: number;
  prop1: string;
  prop2: string;
  prop3: string;
  prop4: string;
  prop5: string;
  prop6: string;
  prop7: string;
  prop8: string;
  prop9: string;
  prop10: string;
  rel1: Ref<Tag>;
  rel2: Ref<Tag>;
  rel3: Ref<Tag>;
  rel4: Ref<Tag>;
  rel5: Collection<Tag>;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath - wide entity (15 properties)', () => {
  validatePath<WideEntity, 'rel1'>('rel1');
}).types([843, 'instantiations']);

bench('Loaded - wide entity (15 properties)', () => {
  useLoaded<WideEntity, 'rel1' | 'rel2' | 'rel3'>({} as Loaded<WideEntity, 'rel1' | 'rel2' | 'rel3'>);
}).types([1390, 'instantiations']);

// ============================================
// Eager props tests
// ============================================

interface EntityWithEager {
  id: number;
  name: string;
  eagerRel: Ref<Tag>;
  normalRel: Ref<Tag>;
  [PrimaryKeyProp]?: 'id';
  [EagerProps]?: 'eagerRel';
}

bench('Loaded - with eager props', () => {
  useLoaded<EntityWithEager, 'normalRel'>({} as Loaded<EntityWithEager, 'normalRel'>);
}).types([1001, 'instantiations']);

// ============================================
// Fields selection tests
// ============================================

bench('Loaded - with fields selection', () => {
  const entity = {} as Loaded<Author, 'books', 'name' | 'email'>;
  void entity;
}).types([625, 'instantiations']);

bench('Loaded - with exclude', () => {
  const entity = {} as Loaded<Author, 'books', '*', 'age'>;
  void entity;
}).types([591, 'instantiations']);
