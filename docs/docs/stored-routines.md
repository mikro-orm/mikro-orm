---
title: Stored Routines
---

:::caution Experimental

Stored-routine support landed in v7.1 and is considered **experimental** while we gather real-world feedback. The metadata shapes (`RoutineDef`, `RoutineParamConfig`, `RoutineReturns`, `resultSets`) and runtime behaviour may evolve in a patch release. Pin your MikroORM version if you rely on the exact API shape.

:::

MikroORM can declare, manage, and invoke stored procedures and functions. Routine definitions live alongside your entities and are managed by the schema generator and migration system — they're created, updated, and removed automatically.

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

> Cross-driver tests: defining a routine that also has a `bodyJs` JS implementation lets you target SQLite (via better-sqlite3) in tests while production runs the SQL implementation against PostgreSQL/MySQL/etc. SQLite silent-skips routines from schema generation, so `schema:diff` produces no spurious changes. libSQL does not currently expose UDF registration, so it cannot bridge `bodyJs` — use the SQLite driver for cross-DB testing.

## Defining a routine

You can declare routines using the `@Routine` decorator, the `defineRoutine` helper, or `RoutineSchema`. All three produce the same metadata.

Routines are registered via a dedicated `routines` configuration option, separate from `entities`. They don't share discovery semantics with entities — there's no folder discovery for routines, and they never participate in unit-of-work or query building.

```ts
await MikroORM.init({
  entities: [User, Book],
  routines: [HashUser, AddRecord],
});
```

### Decorator

Parameters are declared inline in the `@Routine` options (the same `params` shape used by `defineRoutine`). `@Property()` decorators on the class are not used by routines. The `Routine` decorator lives in `@mikro-orm/decorators/legacy` (use `/es` instead if your TypeScript build emits TC39 decorators).

```ts
import { createHash } from 'node:crypto';
import { Routine } from '@mikro-orm/decorators/legacy';

@Routine({
  name: 'hash_user',
  type: 'function',
  params: { name: { type: 'string' }, salt: { type: 'string' } },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: (p) => `SELECT SHA1(CONCAT(${p.name}, ${p.salt}))`,
  bodyJs: ({ name, salt }) => createHash('sha1').update(name + salt).digest('hex'),
})
class HashUser {}

@Routine({
  name: 'add_record',
  type: 'procedure',
  params: {
    name: { type: 'varchar(255)' },
    age: { type: 'tinyint' },
  },
  body: (p) => `INSERT INTO record_entity (name, age, hash)
    VALUES (${p.name}, ${p.age}, SHA1(CONCAT(${p.name}, ${p.age})))`,
})
class AddRecord {}
```

### `defineRoutine`

```ts
import { defineRoutine } from '@mikro-orm/core';

const HashUser = defineRoutine({
  name: 'hash_user',
  type: 'function',
  params: {
    name: { type: 'string' },
    salt: { type: 'string' },
  },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: (p) => `SELECT SHA1(CONCAT(${p.name}, ${p.salt}))`,
});
```

### `RoutineSchema`

```ts
import { RoutineSchema } from '@mikro-orm/core';

const HashUser = new RoutineSchema({
  name: 'hash_user',
  type: 'function',
  params: {
    name: { type: 'string' },
    salt: { type: 'string' },
  },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: 'SELECT SHA1(CONCAT(name, salt))',
});
```

## Calling a routine

```ts
// Function: scalar return
const hash = await em.callRoutine<string>(HashUser, { name: 'jon', salt: 'pepper' });

// Procedure with OUT/INOUT parameters via ScalarReference
const hash = new ScalarReference<string>();
await em.callRoutine(AddRecord, { p_name: 'jon', p_age: 30, p_hash: hash });
console.log(hash.unwrap()); // populated by the procedure
```

OUT and INOUT parameters are passed as `ScalarReference` instances. The values are mutated in place after the call returns. Per-dialect plumbing handles the binding mechanics:

- **PostgreSQL**: `CALL proc(...)` returns a result row containing OUT/INOUT values, which are copied back into the references.
- **MySQL/MariaDB**: session variables (`SET @v := ?; CALL proc(?, @v); SELECT @v`) bridge the values.
- **MSSQL**: T-SQL batch with `DECLARE @v ...; SET @v = ?; EXEC proc ?, @v OUTPUT; SELECT @v`.
- **Oracle**: PL/SQL block with `oracledb` bind directions (`BIND_INOUT`, `BIND_OUT`).
- **SQLite/libSQL**: not supported — SQLite has no stored procedures.

:::caution Oracle and `em.transactional`

The Oracle driver runs each `em.callRoutine` invocation on a dedicated pool connection with `autoCommit: true` (oracledb's INOUT/OUT binds and REF CURSOR fetches need to resolve in a single execute, so the call can't share the EM's transaction). Wrapping an Oracle routine call in `em.transactional(...)` throws to make the divergence loud — call Oracle routines directly, outside the EM transaction context.

PostgreSQL multi-result-set procedures (refcursor OUT params) explicitly require `em.transactional`. MySQL/MariaDB and MSSQL routine calls work both inside and outside `em.transactional`.

:::

## Parameter directions

The `direction` option on a parameter declares whether it's IN (default), OUT, or INOUT. OUT/INOUT params must also be marked with `ref: true` and passed as `ScalarReference` at call time. Functions only accept IN parameters; defining a non-IN parameter on a `type: 'function'` routine throws at metadata validation.

```ts
const RecordInsert = defineRoutine({
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

## Custom types

Routine params and scalar function returns accept a `customType` that marshals values through `Type.convertToDatabaseValue` (inbound) and `Type.convertToJSValue` (outbound). Pass either a `Type` instance or a constructor.

```ts
import { JsonType } from '@mikro-orm/core';

const CountItems = defineRoutine({
  name: 'count_items',
  type: 'function',
  language: 'plpgsql',
  params: {
    data: { type: 'jsonb', customType: JsonType },
  },
  returns: { runtimeType: 'string', columnType: 'text' },
  body: 'BEGIN RETURN jsonb_array_length(data)::text; END;',
});

const length = await em.callRoutine<string>(CountItems, { data: [1, 2, 3, 4] });
// `data` was serialized via JsonType.convertToDatabaseValue before binding;
// the scalar return passes through as plain text since `returns.customType` is unset.
```

The same applies to procedure OUT/INOUT params — the raw row value goes through `convertToJSValue` before being written into the caller's `ScalarReference`.

`customType` applies to:

- IN params (on the way to the procedure/function via `convertToDatabaseValue`)
- OUT/INOUT params (back into the caller's `ScalarReference` via `convertToJSValue`)
- The scalar return descriptor on functions: `returns: { runtimeType, columnType, customType: MyType }`

## Schema generator integration

Routines are picked up by `schema:create`, `schema:update`, `schema:diff`, and `migration:create` automatically. The schema comparator detects:

- Added routines (in metadata but not in DB) → `CREATE`
- Removed routines (in DB but not in metadata) → `DROP`
- Body changes, parameter changes, return-type changes, and metadata changes (comment, security, deterministic, definer) → `DROP` + `CREATE` (no dialect supports `ALTER PROCEDURE` for body)

To skip specific fields when diffing, set `ignoreSchemaChanges` to any subset of `'body' | 'comment' | 'security' | 'deterministic' | 'definer'`:

```ts
const HashUser = defineRoutine({
  name: 'hash_user',
  type: 'function',
  params: { name: { type: 'string' } },
  returns: { runtimeType: 'string', columnType: 'char(40)' },
  body: "select sha1(name)",
  ignoreSchemaChanges: ['body', 'comment'],
});
```

This is useful when the database normalises whitespace differently from the literal you wrote, producing spurious diffs every run.

## SQLite cross-DB testing

When you target SQLite (via better-sqlite3) with routines defined via `@Routine`/`defineRoutine`/`RoutineSchema`:

- Schema generator silently skips them — no DDL is emitted, `schema:diff` produces no changes.
- `em.callRoutine` for `type: 'function'` routines that declare `bodyJs` registers the JS function as a UDF via the underlying driver (better-sqlite3's `db.function()`) on first call, then dispatches `SELECT routine_name(?, ?, ...)`.
- `em.callRoutine` for procedures (or functions without `bodyJs`) throws clearly. SQLite has no analog for stored procedures, so they cannot be bridged.

This lets you run the same entities and routine declarations against PostgreSQL/MySQL/MSSQL/Oracle in production while using SQLite in tests, provided your tests only call functions that have a `bodyJs` fallback.

libSQL is **not** a drop-in replacement here: the `libsql` client does not currently implement runtime UDF registration, so `em.callRoutine` throws on libSQL regardless of `bodyJs`. Use the SQLite (better-sqlite3) driver for cross-DB testing of routines.

## Multi-result-set procedures

Procedures that emit several result sets can be declared via `resultSets: N`. The exact mechanism is dialect-specific:

```ts
// MySQL / MariaDB — body contains N SELECTs; mysql2 surfaces each set natively.
const TwoSets = defineRoutine({
  name: 'two_sets',
  type: 'procedure',
  params: {},
  resultSets: 2,
  body: `
    select 1 as a;
    select 'foo' as label, 10 as n union select 'bar', 20;
  `,
});

// PostgreSQL — open N refcursor OUT params; the connection FETCHes each one.
// The call must be wrapped in a transaction so the cursors stay alive for FETCH.
const TwoCursors = defineRoutine({
  name: 'two_cursors',
  type: 'procedure',
  language: 'plpgsql',
  params: {
    c1: { type: 'refcursor', direction: 'out', ref: true },
    c2: { type: 'refcursor', direction: 'out', ref: true },
  },
  resultSets: 2,
  body: `
    open c1 for select * from "user";
    open c2 for select * from book;
  `,
});

const [pgUsers, pgBooks] = await em.transactional(em => em.callRoutine(TwoCursors, {}));

// Oracle — sys_refcursor OUT params; oracledb binds them as DB_TYPE_CURSOR.
// Do NOT wrap Oracle calls in em.transactional (see the caution above).
const TwoCursorsOra = defineRoutine({
  name: 'two_cursors',
  type: 'procedure',
  params: {
    c1: { type: 'sys_refcursor', direction: 'out', ref: true },
    c2: { type: 'sys_refcursor', direction: 'out', ref: true },
  },
  resultSets: 2,
  body: p => `
    open ${p.c1} for select 1 from dual;
    open ${p.c2} for select 2 from dual;
  `,
});

const [oraSets1, oraSets2] = await em.callRoutine<unknown[][]>(TwoCursorsOra, {});
```

When `resultSets` is set, `em.callRoutine` returns `Dictionary[][]` — one row array per declared result set. Driver support:

- **MySQL / MariaDB**: full support — proc body contains N `SELECT`s.
- **PostgreSQL**: full support via `refcursor` OUT params. **Must** be called inside `em.transactional`.
- **Oracle**: full support via `sys_refcursor` OUT params. **Must not** be called inside `em.transactional` — Oracle's routine path uses its own pool connection.
- **MSSQL**: not yet — the high-level API throws with a clear message. Use `em.getConnection().execute()` if you need raw multi-recordset access, or split the procedure into separate EXECs.
- **SQLite / Mongo**: no stored procedure concept; throws.

`resultSets` is only valid on `type: 'procedure'`. Setting it on a function throws at metadata validation.

:::note Likely to evolve

`resultSets` currently returns plain `Dictionary[][]` (raw row arrays). Static tuple typing (`resultSets: [Author, Book]` → `[Author[], Book[]]`) and dynamic hydration via a `(fields, index) => EntityClass` callback — for procedures whose emitted set shape depends on a runtime branch — are the natural next steps. Plan for the metadata shape here to change in a patch release once those use cases land.

:::

## Limitations

- The default body diff strips trailing semicolons, normalises whitespace, and compares the result. If the database canonicalises your body more aggressively than that, set `ignoreSchemaChanges: ['body']` on the affected routines.
- Multi-result-set procedures on MSSQL still need to go through `em.getConnection().execute()` — the high-level `em.callRoutine` returns `Dictionary[][]` only for MySQL/MariaDB, PostgreSQL, and Oracle.
- Entity-typed result-set hydration (e.g. `resultSets: [User, Book]` mapping rows onto entity classes) is not yet supported; the result rows come back as plain `Dictionary`s.
