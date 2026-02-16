#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for QueryBuilder type safety features.
 */

import { bench } from '@ark/attest';
import type { Collection, EntityDTO, EntityDTOFlat, EntityDTOProp, Loaded, PrimaryProperty, Ref, PrimaryKeyProp, SerializeDTO } from '@mikro-orm/core';
import type { Field, ContextOrderByMap, QBFilterQuery, ModifyHint, ModifyContext, ModifyFields, JoinSelectField } from '@mikro-orm/sql';

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
}).types([144, 'instantiations']);

bench('Field<Author, "a", never> - wildcard', () => {
  useField<Author, 'a', never>('*');
}).types([144, 'instantiations']);

bench('Field<Author, "a", never> - alias wildcard', () => {
  useField<Author, 'a', never>('a.*');
}).types([144, 'instantiations']);

// Context uses tuple format: [Path, Alias, Type, Select]
type SimpleContext = { b: ['books', 'b', Book, false] };

bench('Field<Author, "a", SimpleContext> - with one join', () => {
  useField<Author, 'a', SimpleContext>('b.title');
}).types([240, 'instantiations']);

type TwoJoinContext = {
  b: ['books', 'b', Book, false];
  t: ['tags', 't', Tag, false];
};

bench('Field<Author, "a", TwoJoinContext> - with two joins', () => {
  useField<Author, 'a', TwoJoinContext>('t.name');
}).types([285, 'instantiations']);

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
}).types([136, 'instantiations']);

bench('ModifyContext - add second join', () => {
  type Result = ModifyContext<Author, SimpleContext, 'tags', 't'>;
  useContext<Result>({} as Result);
}).types([145, 'instantiations']);

// ============================================
// ContextOrderByMap benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useOrderBy<E, R extends string, C>(_order: ContextOrderByMap<E, R, C>): void {}

bench('ContextOrderByMap<Author, "a", never> - no context', () => {
  useOrderBy<Author, 'a', never>({ name: 'asc' });
}).types([789, 'instantiations']);

bench('ContextOrderByMap<Author, "a", SimpleContext> - with join', () => {
  useOrderBy<Author, 'a', SimpleContext>({ 'b.title': 'asc' });
}).types([865, 'instantiations']);

// ============================================
// QBFilterQuery benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useFilter<E, R extends string, C>(_filter: QBFilterQuery<E, R, C>): void {}

bench('QBFilterQuery<Author, "a", never> - no context', () => {
  useFilter<Author, 'a', never>({ name: 'test' });
}).types([607, 'instantiations']);

bench('QBFilterQuery<Author, "a", SimpleContext> - with join', () => {
  useFilter<Author, 'a', SimpleContext>({ 'b.title': 'test' });
}).types([510, 'instantiations']);

bench('QBFilterQuery<Author, "a", SimpleContext> - with $and', () => {
  useFilter<Author, 'a', SimpleContext>({
    $and: [{ 'b.title': 'test' }, { name: 'foo' }],
  });
}).types([922, 'instantiations']);

// ============================================
// ModifyFields benchmarks (Fields tracking)
// ============================================

// eslint-disable-next-line no-empty-function
function useFields<F extends string>(_fields: F): void {}

bench('ModifyFields - no join fields (passthrough)', () => {
  type Result = ModifyFields<'id' | 'name', 'a', never, 'books', 'b', undefined>;
  useFields<Result>('' as Result);
}).types([5, 'instantiations']);

bench('ModifyFields - with join fields (simple)', () => {
  type Result = ModifyFields<'*', 'a', SimpleContext, 'books', 'b', readonly ['title', 'price']>;
  useFields<Result>('' as Result);
}).types([201, 'instantiations']);

bench('ModifyFields - with join fields (accumulate)', () => {
  type Result = ModifyFields<'id' | 'name', 'a', SimpleContext, 'books', 'b', readonly ['title']>;
  useFields<Result>('' as Result);
}).types([179, 'instantiations']);

bench('ModifyFields - nested context', () => {
  type Result = ModifyFields<'id', 'a', TwoJoinContext, 'tags', 't', readonly ['name']>;
  useFields<Result>('' as Result);
}).types([179, 'instantiations']);

// ============================================
// JoinSelectField benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useJoinField<E, A extends string>(_field: JoinSelectField<E, A>): void {}

bench('JoinSelectField<Book, "b"> - plain key', () => {
  useJoinField<Book, 'b'>('title');
}).types([6, 'instantiations']);

bench('JoinSelectField<Book, "b"> - alias-prefixed key', () => {
  useJoinField<Book, 'b'>('b.title');
}).types([6, 'instantiations']);

// ============================================
// execute() return type benchmarks
// Uses ExecuteDTO with DirectDTO shortcut:
// - No joins, wildcard: EntityDTOFlat<T>
// - No joins, selected fields: DirectDTO<T, F> (bypasses full EntityDTO computation)
// - Wildcard + single-level join: Omit<EntityDTOFlat<T>> + override relations
// - Selected fields + single-level join: DirectDTO for root + DirectDTO for joined
// - Nested joins (wildcard): SerializeDTO<T, H>
// - Nested joins (fields): EntityDTOFlat<Loaded<T, H, F>>
// ============================================

// DirectDTO: only iterates selected keys, not all entity keys
type DirectDTO<T, F extends keyof T> = {
  [K in F]: EntityDTOProp<T, NonNullable<T[K]>> | Extract<T[K], null | undefined>;
};

// Force type resolution by accessing a property — prevents TypeScript from
// identity-matching identical type aliases without resolving their structure.

bench('execute() return - wildcard fields', () => {
  const r = {} as EntityDTOFlat<Author>;
  const _: string = r.name;
  void _;
}).types([446, 'instantiations']);

bench('execute() return - selected fields', () => {
  const r = {} as DirectDTO<Author, 'id' | 'email'>;
  const _: string = r.email;
  void _;
}).types([21, 'instantiations']);

bench('execute("get") return - selected fields (single)', () => {
  const r = {} as DirectDTO<Author, 'id' | 'email'>;
  const _: number = r.id;
  void _;
}).types([21, 'instantiations']);

bench('execute() return - with join hint', () => {
  const r = {} as DirectDTO<Author, 'id'> & { books: DirectDTO<Book, 'title' | PrimaryProperty<Book>>[] };
  const _: number = r.id;
  void _;
}).types([42, 'instantiations']);

bench('execute() return - with join hint and wildcard', () => {
  const r = {} as Omit<EntityDTOFlat<Author>, 'books'> & { books: EntityDTOFlat<Book>[] };
  const _: string = r.name;
  void _;
}).types([656, 'instantiations']);

bench('execute() return - 2-level nested wildcard', () => {
  const r = {} as SerializeDTO<Author, 'books' | 'books.publisher'>;
  const _: string = r.name;
  void _;
}).types([590, 'instantiations']);

bench('execute() return - 3-level nested wildcard', () => {
  const r = {} as SerializeDTO<Author, 'books' | 'books.publisher' | 'books.publisher.books'>;
  const _: string = r.name;
  void _;
}).types([596, 'instantiations']);

bench('execute() return - 3-level nested with fields', () => {
  const r = {} as EntityDTOFlat<Loaded<Author, 'books' | 'books.publisher' | 'books.publisher.books', 'id' | 'books.title' | 'books.publisher.name' | 'books.publisher.books.title'>>;
  const _: number = r.id;
  void _;
}).types([2041, 'instantiations']);

// ============================================
// EntityDTOFlat vs EntityDTO comparison (wide entities)
// Demonstrates recursive 1-pass savings on wider entity graphs
// ============================================

interface WidePublisher {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  foundedYear: number;
  revenue: number;
  employeeCount: number;
  isPublic: boolean;
  books: Collection<WideBook>;
  [PrimaryKeyProp]?: 'id';
}

interface WideBook {
  uuid: string;
  title: string;
  price: number;
  isbn: string;
  pageCount: number;
  language: string;
  format: string;
  edition: number;
  rating: number;
  synopsis: string;
  publishDate: Date;
  inStock: boolean;
  author: WideAuthor;
  publisher?: Ref<WidePublisher> | null;
  [PrimaryKeyProp]?: 'uuid';
}

interface WideAuthor {
  id: number;
  name: string;
  email: string;
  age?: number;
  bio: string;
  website: string;
  twitter: string;
  country: string;
  birthDate: Date;
  debutYear: number;
  isActive: boolean;
  penName?: string;
  books: Collection<WideBook>;
  favouriteBook?: Ref<WideBook> | null;
  [PrimaryKeyProp]?: 'id';
}

bench('EntityDTO<Loaded<WideAuthor, "books">> - 2-pass recursive', () => {
  const r = {} as EntityDTO<Loaded<WideAuthor, 'books'>>;
  const _: string = r.name;
  void _;
}).types([5649, 'instantiations']);

bench('EntityDTOFlat<Loaded<WideAuthor, "books">> - 1-pass recursive', () => {
  const r = {} as EntityDTOFlat<Loaded<WideAuthor, 'books'>>;
  const _: string = r.name;
  void _;
}).types([4640, 'instantiations']);

bench('EntityDTO<Loaded<WideAuthor, "books.publisher">> - 2-pass recursive 2-level', () => {
  const r = {} as EntityDTO<Loaded<WideAuthor, 'books' | 'books.publisher'>>;
  const _: string = r.name;
  void _;
}).types([5681, 'instantiations']);

bench('EntityDTOFlat<Loaded<WideAuthor, "books.publisher">> - 1-pass recursive 2-level', () => {
  const r = {} as EntityDTOFlat<Loaded<WideAuthor, 'books' | 'books.publisher'>>;
  const _: string = r.name;
  void _;
}).types([4672, 'instantiations']);
