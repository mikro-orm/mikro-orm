#!/usr/bin/env -S node --import=tsx

/**
 * Benchmarks for QueryBuilder type safety features.
 */

import { bench } from '@ark/attest';
import type {
  Collection,
  EntityDTO,
  EntityDTOFlat,
  EntityDTOProp,
  Loaded,
  PrimaryProperty,
  Ref,
  PrimaryKeyProp,
  SerializeDTO,
} from '@mikro-orm/core';
import type {
  Field,
  ContextOrderByMap,
  QBFilterQuery,
  ModifyHint,
  ModifyContext,
  ModifyFields,
  JoinSelectField,
  QueryBuilder,
  SelectQueryBuilder,
} from '@mikro-orm/sql';

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
}).types([138, 'instantiations']);

bench('Field<Author, "a", never> - wildcard', () => {
  useField<Author, 'a', never>('*');
}).types([138, 'instantiations']);

bench('Field<Author, "a", never> - alias wildcard', () => {
  useField<Author, 'a', never>('a.*');
}).types([138, 'instantiations']);

// Context uses tuple format: [Path, Alias, Type, Select]
type SimpleContext = { b: ['books', 'b', Book, false] };

bench('Field<Author, "a", SimpleContext> - with one join', () => {
  useField<Author, 'a', SimpleContext>('b.title');
}).types([202, 'instantiations']);

type TwoJoinContext = {
  b: ['books', 'b', Book, false];
  t: ['tags', 't', Tag, false];
};

bench('Field<Author, "a", TwoJoinContext> - with two joins', () => {
  useField<Author, 'a', TwoJoinContext>('t.name');
}).types([247, 'instantiations']);

// ============================================
// ModifyHint benchmarks
// ============================================

// eslint-disable-next-line
function useHint<H extends string>(_hint: H): void {}

bench('ModifyHint - simple', () => {
  type Result = ModifyHint<'a', never, 'Loaded<Author>', 'books', false>;
  const check: Result = 'Loaded<Author>';
  useHint<Result>(check);
}).types([9, 'instantiations']);

// ============================================
// ModifyContext benchmarks
// ============================================

// eslint-disable-next-line
function useContext<C>(_ctx: C): void {}

bench('ModifyContext - add first join', () => {
  type Result = ModifyContext<Author, never, 'books', 'b'>;
  useContext<Result>({} as Result);
}).types([25, 'instantiations']);

bench('ModifyContext - add second join', () => {
  type Result = ModifyContext<Author, SimpleContext, 'tags', 't'>;
  useContext<Result>({} as Result);
}).types([31, 'instantiations']);

// ============================================
// ContextOrderByMap benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useOrderBy<E, R extends string, C>(_order: ContextOrderByMap<E, R, C>): void {}

bench('ContextOrderByMap<Author, "a", never> - no context', () => {
  useOrderBy<Author, 'a', never>({ name: 'asc' });
}).types([558, 'instantiations']);

bench('ContextOrderByMap<Author, "a", SimpleContext> - with join', () => {
  useOrderBy<Author, 'a', SimpleContext>({ 'b.title': 'asc' });
}).types([595, 'instantiations']);

// ============================================
// QBFilterQuery benchmarks
// ============================================

// eslint-disable-next-line no-empty-function
function useFilter<E, R extends string, C>(_filter: QBFilterQuery<E, R, C>): void {}

bench('QBFilterQuery<Author, "a", never> - no context', () => {
  useFilter<Author, 'a', never>({ name: 'test' });
}).types([267, 'instantiations']);

bench('QBFilterQuery<Author, "a", SimpleContext> - with join', () => {
  useFilter<Author, 'a', SimpleContext>({ 'b.title': 'test' });
}).types([226, 'instantiations']);

bench('QBFilterQuery<Author, "a", SimpleContext> - with $and', () => {
  useFilter<Author, 'a', SimpleContext>({
    $and: [{ 'b.title': 'test' }, { name: 'foo' }],
  });
}).types([357, 'instantiations']);

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
}).types([151, 'instantiations']);

bench('ModifyFields - with join fields (accumulate)', () => {
  type Result = ModifyFields<'id' | 'name', 'a', SimpleContext, 'books', 'b', readonly ['title']>;
  useFields<Result>('' as Result);
}).types([129, 'instantiations']);

bench('ModifyFields - nested context', () => {
  type Result = ModifyFields<'id', 'a', TwoJoinContext, 'tags', 't', readonly ['name']>;
  useFields<Result>('' as Result);
}).types([129, 'instantiations']);

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
}).types([647, 'instantiations']);

bench('execute() return - 2-level nested wildcard', () => {
  const r = {} as SerializeDTO<Author, 'books' | 'books.publisher'>;
  const _: string = r.name;
  void _;
}).types([587, 'instantiations']);

bench('execute() return - 3-level nested wildcard', () => {
  const r = {} as SerializeDTO<Author, 'books' | 'books.publisher' | 'books.publisher.books'>;
  const _: string = r.name;
  void _;
}).types([593, 'instantiations']);

bench('execute() return - 3-level nested with fields', () => {
  const r = {} as EntityDTOFlat<
    Loaded<
      Author,
      'books' | 'books.publisher' | 'books.publisher.books',
      'id' | 'books.title' | 'books.publisher.name' | 'books.publisher.books.title'
    >
  >;
  const _: number = r.id;
  void _;
}).types([1583, 'instantiations']);

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
}).types([5080, 'instantiations']);

bench('EntityDTOFlat<Loaded<WideAuthor, "books">> - 1-pass recursive', () => {
  const r = {} as EntityDTOFlat<Loaded<WideAuthor, 'books'>>;
  const _: string = r.name;
  void _;
}).types([4071, 'instantiations']);

bench('EntityDTO<Loaded<WideAuthor, "books.publisher">> - 2-pass recursive 2-level', () => {
  const r = {} as EntityDTO<Loaded<WideAuthor, 'books' | 'books.publisher'>>;
  const _: string = r.name;
  void _;
}).types([5112, 'instantiations']);

bench('EntityDTOFlat<Loaded<WideAuthor, "books.publisher">> - 1-pass recursive 2-level', () => {
  const r = {} as EntityDTOFlat<Loaded<WideAuthor, 'books' | 'books.publisher'>>;
  const _: string = r.name;
  void _;
}).types([4103, 'instantiations']);

// ============================================
// CTE type safety benchmarks
// ============================================

// Helper to force type resolution through .with() and .from() calls
// eslint-disable-next-line no-empty-function
function withCte<N extends string, Q extends QueryBuilder<any>>(qb: QueryBuilder<Author, 'a'>, name: N, sub: Q) {
  return qb.with(name, sub);
}
// eslint-disable-next-line no-empty-function
function fromCte<C extends Record<string, object>, N extends string & keyof C, A extends string = N>(
  qb: QueryBuilder<Author, 'a', never, never, never, '*', C>,
  name: N,
  alias?: A,
) {
  return qb.from(name, alias);
}

// Measure the cost of .with() accumulating one CTE into the CTEs generic
bench('with() - single CTE type accumulation', () => {
  const qb = {} as QueryBuilder<Author, 'a'>;
  const sub = {} as QueryBuilder<Book>;
  const r = withCte(qb, 'cte', sub);
  void r;
}).types([15, 'instantiations']);

// Measure the cost of chaining two .with() calls (intersecting CTEs records)
bench('with() - two chained CTEs', () => {
  const qb = {} as QueryBuilder<Author, 'a'>;
  const sub1 = {} as QueryBuilder<Book>;
  const sub2 = {} as QueryBuilder<Tag>;
  const r = qb.with('books_cte', sub1).with('tags_cte', sub2);
  void r;
}).types([73, 'instantiations']);

// Measure the cost of from() resolving a CTE name to its entity type
bench('from() - CTE name resolution', () => {
  const qb = {} as QueryBuilder<Author, 'a', never, never, never, '*', { books_cte: Book }>;
  const r = fromCte(qb, 'books_cte');
  void r;
}).types([12, 'instantiations']);

// Measure the full with().from() chain type inference
bench('with().from() - full CTE chain', () => {
  const qb = {} as QueryBuilder<Author, 'a'>;
  const sub = {} as QueryBuilder<Book>;
  const r = qb.with('cte', sub).from('cte');
  void r;
}).types([84, 'instantiations']);

// Verify from() preserves the alias as a literal type
bench('from() - CTE alias preserved as literal', () => {
  const qb = {} as QueryBuilder<Author, 'a', never, never, never, '*', { books_cte: Book }>;
  const r = fromCte(qb, 'books_cte', 'bc');
  void r;
}).types([13, 'instantiations']);

// Verify the full chain: with().from() then select() produces type-safe fields
bench('with().from() then select() - type-safe field access', () => {
  const qb = {} as QueryBuilder<Author, 'a'>;
  const sub = {} as QueryBuilder<Book>;
  const fromQb = qb.with('cte', sub).from('cte', 'c');
  // After from(), select should accept 'c.title' as a valid field for Book
  fromQb.select('c.title');
  void fromQb;
}).types([2354, 'instantiations']);
