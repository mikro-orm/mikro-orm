---
title: Stored Routines
---

:::caution Experimental

Stored-routine support landed in v7.1 and is considered **experimental** while we gather real-world feedback. The configuration types (`RoutineConfig`, `RoutineParamConfig`, `RoutineReturns`) and runtime behaviour may evolve in a patch release. Pin your MikroORM version if you rely on the exact API shape.

:::

MikroORM can declare, invoke, and manage stored procedures and stored functions. Routines are passed to `MikroORM.init` via the `routines` config option, called through `em.callRoutine(routine, args)`, and picked up automatically by the schema generator and migration system — `CREATE`, `DROP`, and body-change diffs are handled the same way they are for tables.

## Driver support

| Driver | Procedures | Functions | Schema management | Notes |
|---|---|---|---|---|
| PostgreSQL | yes | yes | yes | Reads `pg_proc` + `pg_get_functiondef`. |
| PGlite | yes | yes | yes | Inherits PostgreSQL implementation. |
| MySQL / MariaDB | yes | yes | yes | Reads `information_schema.routines`. |
| MSSQL | yes | yes | yes | Reads `sys.sql_modules`. |
| Oracle | yes | yes | yes | Reads `USER_PROCEDURES` + `USER_SOURCE` + `USER_ARGUMENTS`. |
| SQLite | — | yes (via `bodyJs`) | silent skip | No server-side routines. JS-fallback functions are registered as UDFs on connection open. |
| libSQL | — | — | silent skip | The libsql client does not implement runtime UDF registration; `em.callRoutine` throws. Schema-side still silent-skips. |
| MongoDB | — | — | — | Calling `em.callRoutine` throws. |

## Defining a routine

Declare a routine by constructing a `Routine` and pass the instance to `MikroORM.init`:

```ts
import { createHash } from 'node:crypto';
import { Routine } from '@mikro-orm/core';

const HashUser = new Routine({
  name: 'hash_user',
  type: 'function',
  params: {
    name: { type: 'varchar(255)', runtimeType: 'string' },
    salt: { type: 'varchar(255)', runtimeType: 'string' },
  },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: 'SELECT SHA1(CONCAT(name, salt))',
  bodyJs: ({ name, salt }) => createHash('sha1').update(name + salt).digest('hex'),
});

const AddRecord = new Routine({
  name: 'add_record',
  type: 'procedure',
  params: {
    name: { type: 'varchar(255)' },
    age: { type: 'tinyint' },
  },
  body: `INSERT INTO record_entity (name, age, hash)
    VALUES (name, age, SHA1(CONCAT(name, age)))`,
});

await MikroORM.init({
  entities: [User, Book],
  routines: [HashUser, AddRecord],
});
```

The `Routine` instance you import is also the identity used at call time, so unused routines tree-shake out of bundled code naturally.

## Calling a routine

`em.callRoutine` infers the argument and return types from the routine's config — no explicit generic needed. Each param's TS type is resolved in this order:

1. **Explicit `runtimeType`** wins when set (`'string' | 'number' | 'boolean' | 'bigint' | 'Buffer' | 'Date' | 'object' | 'any'`).
2. Otherwise the SQL **`type`** string is mapped to a TS type — `varchar(255)`, `text`, `uuid` → `string`; `int`, `smallint`, `real`, `double precision` → `number`; `boolean`, `bit` → `boolean`; `timestamp`, `date`, `time` → `Date`; `json`, `jsonb` → `Dictionary`; `bytea`, `blob`, `binary` → `Buffer`. Length/precision arguments are stripped, and the lowercase token is matched.
3. Genuinely ambiguous SQL types (`bigint`, `numeric`, `decimal`, `refcursor`, `sys_refcursor`, …) and unrecognised dialect-specific types fall through to `any`. Opt in with an explicit `runtimeType` when you want them typed.

`nullable: true` adds `| null`. `ref: true` wraps the result in `ScalarReference<T>`.

```ts
// Function: scalar return — `string` is inferred from `returns.runtimeType`.
const hash = await em.callRoutine(HashUser, { name: 'jon', salt: 'pepper' });

// Procedure with OUT/INOUT parameters via ScalarReference.
const hash = new ScalarReference<string>();
await em.callRoutine(AddRecord, { p_name: 'jon', p_age: 30, p_hash: hash });
console.log(hash.unwrap()); // populated by the procedure
```

### Refining the inferred types

When the `runtimeType → TS` mapping is too loose — most often for `runtimeType: 'object'`, which falls back to `Dictionary` — declare the routine with `Routine.create<TArgs, TReturn>(config)` to supply explicit override generics:

```ts
interface UserStats {
  totalOrders: number;
  lastOrderAt: Date;
}

const GetStats = Routine.create<{ user_id: number }, UserStats>({
  name: 'get_user_stats',
  type: 'function',
  params: { user_id: { type: 'int', runtimeType: 'number' } },
  returns: { runtimeType: 'object', columnType: 'json' },
  body: '...',
});

const stats = await em.callRoutine(GetStats, { user_id: 1 });
stats.totalOrders; // typed as `number`
```

Omit a generic to fall back to inference — pass `never` in the args slot to refine only the return type:

```ts
const ListUsers = Routine.create<never, Array<{ id: number; email: string }>>({
  name: 'list_users',
  type: 'function',
  params: { since: { type: 'timestamp', runtimeType: 'Date' } },
  returns: { runtimeType: 'object', columnType: 'jsonb[]' },
  body: '...',
});
// args still inferred as `{ since: Date }` from the config.
```

### Parameter directions

The `direction` option declares whether a parameter is IN (default), OUT, or INOUT. OUT/INOUT params must be marked with `ref: true` and passed as `ScalarReference` instances at call time; the value inside the reference is mutated in place after the call returns. Functions only accept IN parameters — declaring a non-IN parameter on a `type: 'function'` routine throws at init.

```ts
const RecordInsert = new Routine({
  name: 'record_insert',
  type: 'procedure',
  params: {
    p_name: { type: 'varchar(255)' },
    p_hash: { type: 'char(40)', direction: 'inout', ref: true },
    p_id: { type: 'int', direction: 'out', ref: true },
  },
  body: '...',
});

const hash = new ScalarReference<string>();
const id = new ScalarReference<number>();
await em.callRoutine(RecordInsert, { p_name: 'jon', p_hash: hash, p_id: id });
```

Per-dialect plumbing handles the binding mechanics:

- **PostgreSQL**: `CALL proc(...)` returns a result row containing OUT/INOUT values.
- **MySQL / MariaDB**: session variables (`SET @v := ?; CALL proc(?, @v); SELECT @v`) bridge the values.
- **MSSQL**: T-SQL batch with `DECLARE @v ...; SET @v = ?; EXEC proc ?, @v OUTPUT; SELECT @v`.
- **Oracle**: PL/SQL block with `oracledb` bind directions (`BIND_INOUT`, `BIND_OUT`).
- **SQLite / libSQL**: not supported — SQLite has no stored procedures.

:::caution Oracle and `em.transactional`

The Oracle driver runs each `em.callRoutine` invocation on a dedicated pool connection with `autoCommit: true` — oracledb's INOUT/OUT binds and REF CURSOR fetches need to resolve in a single execute, so the call cannot share the EM's transaction. Wrapping an Oracle routine call in `em.transactional(...)` throws to make the divergence loud. Call Oracle routines directly, outside the EM transaction context.

PostgreSQL multi-result-set procedures (refcursor OUT params) **require** `em.transactional`. MySQL/MariaDB and MSSQL routine calls work both inside and outside `em.transactional`.

:::

## Custom types

Routine params and scalar function returns accept a `customType` that marshals values through `Type.convertToDatabaseValue` (inbound) and `Type.convertToJSValue` (outbound). Pass either a `Type` instance or a constructor:

```ts
import { JsonType } from '@mikro-orm/core';

const CountItems = new Routine({
  name: 'count_items',
  type: 'function',
  language: 'plpgsql',
  params: {
    data: { type: 'jsonb', runtimeType: 'object', customType: JsonType },
  },
  returns: { runtimeType: 'string', columnType: 'text' },
  body: 'BEGIN RETURN jsonb_array_length(data)::text; END;',
});

const length = await em.callRoutine(CountItems, { data: [1, 2, 3, 4] });
// `data` is serialised via JsonType.convertToDatabaseValue before binding;
// the scalar return passes through as plain text since `returns.customType` is unset.
```

`customType` applies to:

- IN params (via `convertToDatabaseValue` on the way to the database).
- OUT/INOUT params (via `convertToJSValue` back into the caller's `ScalarReference`).
- The scalar return descriptor on functions: `returns: { runtimeType, columnType, customType: MyType }`.

## Schema generator integration

Routines are picked up by `schema:create`, `schema:update`, `schema:diff`, and `migration:create` automatically. The comparator detects:

- Added routines (in metadata but not in DB) → `CREATE`.
- Removed routines (in DB but not in metadata) → `DROP`.
- Body changes, parameter changes, return-type changes, and metadata changes (comment, security, deterministic, definer) → `DROP` + `CREATE` (no dialect supports `ALTER PROCEDURE` for the body).

To skip specific fields when diffing, set `ignoreSchemaChanges` to any subset of `'body' | 'comment' | 'security' | 'deterministic' | 'definer'`:

```ts
const HashUser = new Routine({
  name: 'hash_user',
  type: 'function',
  params: { name: { type: 'string' } },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: "select sha1(name)",
  ignoreSchemaChanges: ['body', 'comment'],
});
```

This is useful when the database normalises whitespace differently from the literal you wrote, producing spurious diffs every run.

## Multi-result-set procedures

Procedures that emit several result sets work out of the box — `em.callRoutine` returns `Dictionary[][]` (one row array per set). The driver detects the count at runtime, the mechanism is dialect-specific:

```ts
// MySQL / MariaDB — body contains N SELECTs; mysql2's end-of-stream marker tells us when
// the result-set list ends, so the count is detected automatically.
const TwoSets = Routine.create<Record<string, never>, unknown[][]>({
  name: 'two_sets',
  type: 'procedure',
  params: {},
  body: `
    select 1 as a;
    select 'foo' as label, 10 as n union select 'bar', 20;
  `,
});

const sets = await em.callRoutine(TwoSets, {});
// sets[0] === [{ a: 1 }]
// sets[1] === [{ label: 'foo', n: 10 }, { label: 'bar', n: 20 }]

// PostgreSQL — declare N refcursor OUT params; the connection FETCHes each one.
// The call must run inside a transaction so the cursors stay alive for FETCH.
const TwoCursors = Routine.create<Record<string, never>, unknown[][]>({
  name: 'two_cursors',
  type: 'procedure',
  language: 'plpgsql',
  params: {
    c1: { type: 'refcursor', direction: 'out', ref: true },
    c2: { type: 'refcursor', direction: 'out', ref: true },
  },
  body: `
    open c1 for select * from "user";
    open c2 for select * from book;
  `,
});

const [pgUsers, pgBooks] = await em.transactional(em => em.callRoutine(TwoCursors, {}));

// Oracle — declare sys_refcursor OUT params; oracledb binds them as DB_TYPE_CURSOR.
// Do NOT wrap Oracle calls in em.transactional (see the caution above).
const TwoCursorsOra = Routine.create<Record<string, never>, unknown[][]>({
  name: 'two_cursors',
  type: 'procedure',
  params: {
    c1: { type: 'sys_refcursor', direction: 'out', ref: true },
    c2: { type: 'sys_refcursor', direction: 'out', ref: true },
  },
  body: p => `
    open ${p.c1} for select 1 from dual;
    open ${p.c2} for select 2 from dual;
  `,
});

const [oraSets1, oraSets2] = await em.callRoutine(TwoCursorsOra, {});
```

Driver support:

- **MySQL / MariaDB**: full support. Proc body contains N `SELECT`s; mysql2's response array carries each set, terminated by an OkPacket the connection filters out.
- **PostgreSQL**: full support via `refcursor` OUT params. **Must** be called inside `em.transactional`. Refcursor params are detected by `type: 'refcursor'` — non-refcursor OUT params still behave as scalar `ScalarReference` outputs.
- **Oracle**: full support via `sys_refcursor` OUT params. **Must not** be called inside `em.transactional`.
- **MSSQL**: result sets emitted by a procedure are not surfaced through `em.callRoutine` — tedious flattens them through the kysely wrapper without per-set boundaries. Use `em.getConnection().execute()` for raw multi-recordset access.
- **SQLite / libSQL / Mongo**: no stored procedure concept; throws.

:::note Likely to evolve

`em.callRoutine` currently returns plain `Dictionary[][]` for result-set-emitting procedures. Static tuple typing (`returns: [Author, Book]` → `[Author[], Book[]]`) and dynamic hydration via a `(fields, index) => EntityClass` callback — for procedures whose emitted set shape depends on a runtime branch — are tracked as follow-ups.

:::

## Cross-DB testing with SQLite

A routine that supplies both `body` (SQL) and `bodyJs` (a JS fallback) can be used against PostgreSQL/MySQL/MSSQL/Oracle in production while tests run against SQLite (better-sqlite3):

- The schema generator silently skips SQLite — no DDL is emitted, `schema:diff` produces no changes.
- `em.callRoutine` on a `type: 'function'` routine with `bodyJs` registers the JS implementation as a UDF via better-sqlite3's `db.function()` on first call, then dispatches `SELECT routine_name(?, ?, ...)`.
- Calling a procedure on SQLite, or a function without `bodyJs`, throws — SQLite has no analog.

libSQL is **not** a drop-in replacement: the `libsql` client does not currently expose runtime UDF registration, so `em.callRoutine` throws regardless of `bodyJs`. Use the SQLite (better-sqlite3) driver for cross-DB testing of routines.

## Limitations

- The default body diff strips trailing semicolons and normalises whitespace before comparing. When the database canonicalises your body more aggressively than that, set `ignoreSchemaChanges: ['body']` on the affected routine.
- Multi-result-set procedures on MSSQL still need to go through `em.getConnection().execute()`. `em.callRoutine` returns `Dictionary[][]` only for MySQL/MariaDB, PostgreSQL, and Oracle.
- Entity-typed result-set hydration (mapping rows onto entity classes) is not yet supported; result rows come back as plain `Dictionary` objects. A `returns: [User, Book]` static tuple form and a `(fields, index) => EntityClass` dynamic callback are tracked as follow-ups.
