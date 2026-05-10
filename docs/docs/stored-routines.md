---
title: Stored Routines
---

MikroORM can declare, manage, and invoke stored procedures and functions. Routine definitions live alongside your entities and are managed by the schema generator and migration system — they're created, updated, and removed automatically.

## Driver support

| Driver | Procedures | Functions | Schema management | Notes |
|---|---|---|---|---|
| PostgreSQL | yes | yes | yes | Reads `pg_proc` + `pg_get_functiondef`. |
| PGlite | yes | yes | yes | Inherits PostgreSQL implementation. |
| MySQL / MariaDB | yes | yes | yes | Reads `information_schema.routines`. |
| MSSQL | yes | yes | yes | Reads `sys.sql_modules`. |
| Oracle | yes | yes | yes | Reads `USER_PROCEDURES` + `USER_SOURCE` + `USER_ARGUMENTS`. |
| SQLite / libSQL | — | yes (via `bodyJs`) | silent skip | No server-side routines. JS-fallback functions are registered as UDFs on connection open. |
| MongoDB | — | — | — | Calling `em.callRoutine` throws. |

> Cross-driver tests: defining a routine that also has a `bodyJs` JS implementation lets you target SQLite in tests while production runs the SQL implementation against PostgreSQL/MySQL/etc. SQLite silent-skips routines from schema generation, so `schema:diff` produces no spurious changes.

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

Parameters are declared inline in the `@Routine` options (the same `params` shape used by `defineRoutine`). `@Property()` decorators on the class are not used by routines.

```ts
import { Routine } from '@mikro-orm/core';

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

## Parameter directions

The `direction` option on a parameter declares whether it's IN (default), OUT, or INOUT. OUT/INOUT params must also be marked with `ref: true` and passed as `ScalarReference` at call time. Functions only accept IN parameters; defining a non-IN parameter on a `type: 'function'` routine throws at metadata validation.

```ts
@Property({ columnType: 'int', ref: true, direction: 'out' }) inserted_id!: Ref<number>;
@Property({ columnType: 'char(40)', ref: true, direction: 'inout' }) hash!: Ref<string>;
```

## Schema generator integration

Routines are picked up by `schema:create`, `schema:update`, `schema:diff`, and `migration:create` automatically. The schema comparator detects:

- Added routines (in metadata but not in DB) → `CREATE`
- Removed routines (in DB but not in metadata) → `DROP`
- Body changes, parameter changes, return-type changes, and metadata changes (comment, security, deterministic, definer) → `DROP` + `CREATE` (no dialect supports `ALTER PROCEDURE` for body)

To skip specific fields when diffing, use `ignoreSchemaChanges`:

```ts
@Routine({
  type: 'function',
  body: '...',
  ignoreSchemaChanges: ['body', 'comment'],
})
```

This is useful when the database normalises whitespace differently from the literal you wrote, producing spurious diffs every run.

## SQLite cross-DB testing

When you target SQLite (or libSQL) with routines defined via `@Routine`/`defineRoutine`/`RoutineSchema`:

- Schema generator silently skips them — no DDL is emitted, `schema:diff` produces no changes.
- `em.callRoutine` for `type: 'function'` routines that declare `bodyJs` registers the JS function as a UDF via the underlying driver (better-sqlite3's `db.function()`) on first call, then dispatches `SELECT routine_name(?, ?, ...)`.
- `em.callRoutine` for procedures (or functions without `bodyJs`) throws clearly. SQLite has no analog for stored procedures, so they cannot be bridged.

This lets you run the same entities and routine declarations against PostgreSQL/MySQL/MSSQL/Oracle in production while using SQLite in tests, provided your tests only call functions that have a `bodyJs` fallback.

## Limitations

- The default body diff strips trailing semicolons, normalises whitespace, and compares the result. If the database canonicalises your body more aggressively than that, set `ignoreSchemaChanges: ['body']` on the affected routines.
- Multi-result-set procedures are currently only supported on MySQL.
- Reverse-engineering existing routines into `@Routine` source via `mikro-orm generate-entities` is not yet implemented; routine introspection is used by the schema comparator but not by the entity generator.
