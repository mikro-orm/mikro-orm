#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for QueryBuilder type safety features.
 */

import { bench } from '@ark/attest';
import type { Collection, Ref, PrimaryKeyProp } from '@mikro-orm/core';
import type { Field, ContextOrderByMap, QBFilterQuery, ModifyHint, ModifyContext } from '@mikro-orm/sql';

// ============================================
// Test Entity Definitions
// ============================================

interface Tag {
  id: number;
  name: string;
  books: Collection<Book>;
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
  uuid: string;
  title: string;
  price: number;
  author: Author;
  publisher?: Ref<Publisher> | null;
  tags: Collection<Tag>;
  [PrimaryKeyProp]?: 'uuid';
}

interface Author {
  id: number;
  name: string;
  email: string;
  age?: number;
  books: Collection<Book>;
  favouriteBook?: Ref<Book> | null;
  [PrimaryKeyProp]?: 'id';
}

// ============================================
// Field type benchmarks
// ============================================

// eslint-disable-next-line
function useField<E, R extends string, C>(_field: Field<E, R, C>): void {}

bench('Field<Author, "a", never> - no context', () => {
  useField<Author, 'a', never>('name');
}).types([137, 'instantiations']);

bench('Field<Author, "a", never> - wildcard', () => {
  useField<Author, 'a', never>('*');
}).types([137, 'instantiations']);

bench('Field<Author, "a", never> - alias wildcard', () => {
  useField<Author, 'a', never>('a.*');
}).types([137, 'instantiations']);

// Context uses tuple format: [Path, Alias, Type, Select]
type SimpleContext = { b: ['books', 'b', Book, false] };

bench('Field<Author, "a", SimpleContext> - with one join', () => {
  useField<Author, 'a', SimpleContext>('b.title');
}).types([224, 'instantiations']);

type TwoJoinContext = {
  b: ['books', 'b', Book, false];
  t: ['tags', 't', Tag, false];
};

bench('Field<Author, "a", TwoJoinContext> - with two joins', () => {
  useField<Author, 'a', TwoJoinContext>('t.name');
}).types([269, 'instantiations']);

// ============================================
// ModifyHint benchmarks
// ============================================

// eslint-disable-next-line
function useHint<H extends string>(_hint: H): void {}

bench('ModifyHint - simple', () => {
  type Result = ModifyHint<'a', never, 'Loaded<Author>', 'books', false>;
  const check: Result = 'Loaded<Author>' as Result;
  useHint<Result>(check);
}).types([16, 'instantiations']);

// ============================================
// ModifyContext benchmarks
// ============================================

// eslint-disable-next-line
function useContext<C>(_ctx: C): void {}

bench('ModifyContext - add first join', () => {
  type Result = ModifyContext<Author, never, 'books', 'b'>;
  useContext<Result>({} as Result);
}).types([139, 'instantiations']);

bench('ModifyContext - add second join', () => {
  type Result = ModifyContext<Author, SimpleContext, 'tags', 't'>;
  useContext<Result>({} as Result);
}).types([148, 'instantiations']);

// ============================================
// ContextOrderByMap benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useOrderBy<E, R extends string, C>(_order: ContextOrderByMap<E, R, C>): void {}

bench('ContextOrderByMap<Author, "a", never> - no context', () => {
  useOrderBy<Author, 'a', never>({ name: 'asc' });
}).types([746, 'instantiations']);

bench('ContextOrderByMap<Author, "a", SimpleContext> - with join', () => {
  useOrderBy<Author, 'a', SimpleContext>({ 'b.title': 'asc' });
}).types([781, 'instantiations']);

// ============================================
// QBFilterQuery benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useFilter<E, R extends string, C>(_filter: QBFilterQuery<E, R, C>): void {}

bench('QBFilterQuery<Author, "a", never> - no context', () => {
  useFilter<Author, 'a', never>({ name: 'test' });
}).types([1863, 'instantiations']);

bench('QBFilterQuery<Author, "a", SimpleContext> - with join', () => {
  useFilter<Author, 'a', SimpleContext>({ 'b.title': 'test' });
}).types([1905, 'instantiations']);

bench('QBFilterQuery<Author, "a", SimpleContext> - with $and', () => {
  useFilter<Author, 'a', SimpleContext>({
    $and: [{ 'b.title': 'test' }, { name: 'foo' }],
  });
}).types([1932, 'instantiations']);
