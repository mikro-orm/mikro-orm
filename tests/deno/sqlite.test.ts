/**
 * Deno integration test — validates MikroORM works on Deno with node:sqlite.
 *
 * Run: deno run --allow-read --allow-write --allow-env --allow-ffi --node-modules-dir=manual tests/deno/sqlite.test.ts
 */
import { MikroORM } from '@mikro-orm/core';
import { defineEntity, p } from '@mikro-orm/core';
import { SqliteDriver, NodeSqliteDialect } from '@mikro-orm/sql';

// ---------------------------------------------------------------------------
// 1. Entity definitions
// ---------------------------------------------------------------------------
const Author = defineEntity({
  name: 'Author',
  tableName: 'author',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    email: p.string(),
  },
});

const Book = defineEntity({
  name: 'Book',
  tableName: 'book',
  properties: {
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

// ---------------------------------------------------------------------------
// 2. Test runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

const orm = await MikroORM.init({
  driver: SqliteDriver,
  entities: [Author, Book],
  dbName: ':memory:',
  driverOptions: new NodeSqliteDialect(':memory:'),
});

// create schema
await orm.schema.create();

// insert
const em1 = orm.em.fork();
const author = em1.create(Author, { name: 'John', email: 'john@example.com' });
em1.create(Book, { title: 'Book 1', author });
em1.create(Book, { title: 'Book 2', author });
await em1.flush();
assert(author.id !== undefined, 'Author should have an id after flush');

// query
const em2 = orm.em.fork();
const authors = await em2.findAll(Author);
assert(authors.length === 1, `Expected 1 author, got ${authors.length}`);
assert(authors[0].name === 'John', `Expected 'John', got '${authors[0].name}'`);

const books = await em2.findAll(Book, { populate: ['author'] });
assert(books.length === 2, `Expected 2 books, got ${books.length}`);
assert(books[0].author.name === 'John', 'Book should have author populated');

// update
authors[0].name = 'John Updated';
await em2.flush();

const em3 = orm.em.fork();
const updated = await em3.findOne(Author, { name: 'John Updated' });
assert(updated !== null, 'Should find updated author');

// delete
const em4 = orm.em.fork();
const toDelete = await em4.findAll(Book);
toDelete.forEach(b => em4.remove(b));
await em4.flush();

const remaining = await em4.findAll(Book);
assert(remaining.length === 0, `Expected 0 books after delete, got ${remaining.length}`);

// schema drop
await orm.schema.drop();
await orm.close();

// report
console.log(`\nDeno SQLite test: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  // deno-lint-ignore no-process-globals
  process.exit(1);
}
