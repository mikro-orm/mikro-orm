#!/usr/bin/env -S node --import=tsx

import { bench } from '@ark/attest';
import {
  type AutoPath,
  type Collection,
  type LazyRef,
  type Loaded,
  type PopulatePath,
  type Ref,
  EagerProps,
  PrimaryKeyProp,
} from '@mikro-orm/core';

// ============================================
// Entities with LazyRef-based relations
// ============================================

interface LRTag {
  id: number;
  name: string;
  [PrimaryKeyProp]?: 'id';
}

interface LRPublisher {
  id: number;
  name: string;
  books: Collection<LRBook>;
  [PrimaryKeyProp]?: 'id';
}

interface LRBook {
  id: number;
  title: string;
  author: LazyRef<LRAuthor>;
  publisher?: LazyRef<LRPublisher> | null;
  tags: Collection<LRTag>;
  [PrimaryKeyProp]?: 'id';
}

interface LRAuthor {
  id: number;
  name: string;
  email: string;
  age?: number;
  books: Collection<LRBook>;
  favouriteBook?: LazyRef<LRBook> | null;
  friends: Collection<LRAuthor>;
  [PrimaryKeyProp]?: 'id';
}

// ============================================
// AutoPath benchmarks — paths traversing LazyRef
// ============================================

function validatePath<T, P extends string>(_path: AutoPath<T, P, PopulatePath.ALL>): void {
  /* empty */
}

bench('AutoPath LazyRef - single relation', () => {
  validatePath<LRBook, 'author'>('author');
}).types([792, 'instantiations']);

bench('AutoPath LazyRef - nested (2 levels)', () => {
  validatePath<LRBook, 'author.books'>('author.books');
}).types([861, 'instantiations']);

bench('AutoPath LazyRef - nested (3 levels)', () => {
  validatePath<LRBook, 'author.books.publisher'>('author.books.publisher');
}).types([1079, 'instantiations']);

bench('AutoPath LazyRef - collection with :ref', () => {
  validatePath<LRBook, 'author:ref'>('author:ref');
}).types([550, 'instantiations']);

// ============================================
// Loaded benchmarks — narrowing LazyRef
// ============================================

// eslint-disable-next-line
function useLoaded<T, L extends string = never>(_entity: Loaded<T, L>): void {}

bench('Loaded LazyRef - no populate', () => {
  useLoaded<LRBook>({} as LRBook);
}).types([543, 'instantiations']);

bench('Loaded LazyRef - single to-one', () => {
  useLoaded<LRBook, 'author'>({} as Loaded<LRBook, 'author'>);
}).types([954, 'instantiations']);

bench('Loaded LazyRef - nested to-one (2 levels)', () => {
  useLoaded<LRBook, 'author.favouriteBook'>({} as Loaded<LRBook, 'author.favouriteBook'>);
}).types([954, 'instantiations']);

bench('Loaded LazyRef - mixed LazyRef + Collection', () => {
  useLoaded<LRBook, 'author' | 'tags'>({} as Loaded<LRBook, 'author' | 'tags'>);
}).types([1077, 'instantiations']);

// ============================================
// Baseline comparison — same entity shape but using Ref instead of LazyRef
// ============================================

interface RefBook {
  id: number;
  title: string;
  author: Ref<RefAuthor>;
  publisher?: Ref<RefPublisher> | null;
  tags: Collection<RefTag>;
  [PrimaryKeyProp]?: 'id';
}

interface RefAuthor {
  id: number;
  name: string;
  email: string;
  age?: number;
  books: Collection<RefBook>;
  favouriteBook?: Ref<RefBook> | null;
  friends: Collection<RefAuthor>;
  [PrimaryKeyProp]?: 'id';
}

interface RefPublisher {
  id: number;
  name: string;
  books: Collection<RefBook>;
  [PrimaryKeyProp]?: 'id';
}

interface RefTag {
  id: number;
  name: string;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath Ref (baseline) - nested (2 levels)', () => {
  validatePath<RefBook, 'author.books'>('author.books');
}).types([871, 'instantiations']);

bench('Loaded Ref (baseline) - single to-one', () => {
  useLoaded<RefBook, 'author'>({} as Loaded<RefBook, 'author'>);
}).types([971, 'instantiations']);

// ============================================
// Deep chain of LazyRef relations
// ============================================

interface L5 {
  id: number;
  value: string;
  [PrimaryKeyProp]?: 'id';
}

interface L4 {
  id: number;
  next: LazyRef<L5>;
  [PrimaryKeyProp]?: 'id';
}

interface L3 {
  id: number;
  next: LazyRef<L4>;
  [PrimaryKeyProp]?: 'id';
}

interface L2 {
  id: number;
  next: LazyRef<L3>;
  [PrimaryKeyProp]?: 'id';
}

interface L1 {
  id: number;
  next: LazyRef<L2>;
  [PrimaryKeyProp]?: 'id';
}

bench('AutoPath LazyRef - deep chain (5 levels)', () => {
  validatePath<L1, 'next.next.next.next'>('next.next.next.next');
}).types([1165, 'instantiations']);

bench('Loaded LazyRef - deep chain (5 levels)', () => {
  useLoaded<L1, 'next.next.next.next'>({} as Loaded<L1, 'next.next.next.next'>);
}).types([902, 'instantiations']);

// ============================================
// Eager LazyRef
// ============================================

interface LREntityWithEager {
  id: number;
  name: string;
  eagerRel: LazyRef<LRTag>;
  normalRel: LazyRef<LRTag>;
  [PrimaryKeyProp]?: 'id';
  [EagerProps]?: 'eagerRel';
}

bench('Loaded LazyRef - with eager props', () => {
  useLoaded<LREntityWithEager, 'normalRel'>({} as Loaded<LREntityWithEager, 'normalRel'>);
}).types([1024, 'instantiations']);
