---
slug: mikro-orm-7-2-released
title: 'MikroORM 7.2: Trust Issues'
authors: [B4nan]
tags: [typescript, javascript, node, sql]
image: './img/og-v7-2.png'
draft: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

[MikroORM v7.2](https://github.com/mikro-orm/mikro-orm/releases/tag/v7.2.0) is out. The headline is native PostgreSQL row level security — policies as entity metadata, managed by the schema generator, with per-request session context pushed down to the connection. Next to that: a new `through` option for to-one relations resolved via subquery, a rework of cursor pagination for custom types and nullable sort keys, a new sql.js driver that brought a live playground to the docs, named parameters in `em.execute()`, string normalization, native client access, `await using` support, and a handful of smaller things. Let's go through the highlights.

<img src={require('./img/og-v7-2.png').default} style={{maxHeight: 450}} />

<!--truncate-->

## Row level security

Multi-tenancy in an ORM usually comes down to remembering a `where tenant_id = ?` on every single query. Filters help, but they only cover what goes through the ORM's query pipeline — one raw query, one native update, one forgotten `disableFilters` and the boundary is gone. PostgreSQL has had row level security for over a decade, and it puts that boundary where it cannot be forgotten: in the database.

v7.2 makes RLS a first-class part of entity metadata. Policies are declared on the entity, created and diffed by the schema generator, introspected back from `pg_policies`, and serialized into migration snapshots:

<Tabs groupId="entity-def" defaultValue="define-entity" values={[
  {label: 'defineEntity', value: 'define-entity'},
  {label: 'decorators', value: 'decorators'},
]}>
  <TabItem value="define-entity">

```ts
export const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
  },
  policies: [
    {
      name: 'article_tenant',
      using: columns => `${columns.tenantId} = current_setting('app.tenant')::uuid`,
      check: columns => `${columns.tenantId} = current_setting('app.tenant')::uuid`,
    },
  ],
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity({
  policies: [
    {
      name: 'article_tenant',
      using: columns => `${columns.tenantId} = current_setting('app.tenant')::uuid`,
      check: columns => `${columns.tenantId} = current_setting('app.tenant')::uuid`,
    },
  ],
})
export class Article {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'uuid' })
  tenantId!: string;

}
```

  </TabItem>
</Tabs>

```sql
alter table "article" enable row level security;
create policy "article_tenant" on "article" using (tenant_id = current_setting('app.tenant')::uuid) with check (tenant_id = current_setting('app.tenant')::uuid);
```

The `using` / `check` expressions accept a callback receiving the property-to-column mapping (typed in all three definition styles, the same shape check constraints already use), a plain SQL string, or a `raw()` fragment. Prefer the callback — column names come from the naming strategy, and the expression stays correct when a column is renamed. Policies support `command` (`select` / `insert` / `update` / `delete` / `all`), `roles`, and `type: 'permissive' | 'restrictive'`, so you can widen access with OR-combined permissive policies and pin a mandatory constraint on top with a restrictive one.

`rowLevelSecurity: true` without policies is a deny-all switch. `'force'` applies the policies to the table owner too (without it, owners and superusers bypass RLS entirely). `false` creates the policies but leaves RLS disabled, which lets you stage them ahead of a cutover and flip the switch later.

### Session context

Policies read per-request state through `current_setting(...)` or `current_user`, so the ORM needs to get that state onto the connection. It carries it as a **session context** on the `EntityManager` — session variables plus an optional role:

```ts
const em = orm.em.fork({
  session: {
    variables: { 'app.tenant': tenantId },
    role: 'app_user',
  },
});

const articles = await em.find(Article, {}); // only this tenant's rows come back
```

There are two strategies for how it reaches the database. The default `'transaction'` emits `select set_config(key, value, true)` and `set local role` right after each `begin`, which is safe under pgBouncer transaction pooling. Operations outside an explicit transaction get wrapped in a short implicit one — but **only when a session context is actually set**, so there is no overhead if you don't use RLS:

```sql
begin;
select set_config($1, $2, true);
select ... from "article" ...;
commit;
```

The `'connection'` strategy (postgresql driver only) applies the context on every pool acquire instead, always preceded by `reset all`, so a pooled connection never carries stale state. It needs session-level pooling, but removes the implicit-transaction wrapping and handles `em.stream()` without ceremony.

The design is fail-closed throughout. Setting a session context with `implicitTransactions: false` throws rather than letting writes run untransacted past the policies. Streaming outside a transaction under the `'transaction'` strategy throws rather than streaming rows nothing scoped. Neither strategy lets you change the context mid-transaction, since the running transaction would never see it. Write violations surface as `RowLevelSecurityViolationException`, and the session context is folded into the result cache key, so two tenants issuing the same query never share a cached result.

### The filter bridge

If you already model tenancy as an entity [filter](/docs/next/filters), you don't have to write the policy twice. Flag the filter with `rls: true` and the same declaration drives both layers:

```ts
filters: {
  byTenant: { name: 'byTenant', cond: args => ({ tenantId: args.tenant }), rls: true },
},
```

At schema time it compiles to a policy, deriving the session variable name and the SQL cast from the property type:

```sql
create policy "order_byTenant_policy" on "order" using ("tenant_id" = current_setting('mikro.byTenant.tenant')::uuid);
```

At runtime, `em.setFilterParams('byTenant', { tenant: tenantId })` stages both the application-level `where` and the matching session variable:

```ts
await em.find(Order, {}, { filters: ['byTenant'] }); // ... where "tenant_id" = ?
await em.execute('select * from "order"');           // still only this tenant's rows
```

One declaration, two enforcement layers. Conditions that can't compile to a static policy (touching `em` or find options, `async`, an argument used outside a direct comparison, a column type with no cast) fail loudly at schema build rather than silently producing a policy that does less than the filter.

This is PostgreSQL only — `postgresql` and `pglite`, with pglite limited to the `'transaction'` strategy since it has no pool to hook. Other drivers reject RLS metadata at discovery. If your database already has hand-written policies, read the [adoption section](/docs/next/row-level-security#adopting-on-a-database-with-hand-written-policies) before running any schema tooling after the upgrade — the schema generator can see them now, and a live-introspection diff will propose dropping them unless you adopt them into metadata or set `schemaGenerator: { ignorePolicies: true }`. The [row level security guide](/docs/next/row-level-security) covers the whole thing, including the operational caveats around owner bypass, role grants and pgBouncer modes.

## To-one relations through another entity

Not every link to a single related entity is a foreign key on the owning table. Two shapes come up over and over: a pivot entity that carries the link plus extra columns to filter on, and a to-many relation you only want one item out of — typically the newest one. Both are now expressible as a read-only `ManyToOne` / `OneToOne` with the new `through` option:

<Tabs groupId="entity-def" defaultValue="define-entity" values={[
  {label: 'defineEntity', value: 'define-entity'},
  {label: 'decorators', value: 'decorators'},
]}>
  <TabItem value="define-entity">

```ts
export const Customer = defineEntity({
  name: 'Customer',
  properties: {
    id: p.integer().primary(),
    edges: () => p.oneToMany(Edge).mappedBy('start'),
    // the account linked via an edge in the `cleared` state
    account: () => p.manyToOne(Account).through(() => Edge).where({ state: 'cleared' }).ref().nullable(),
    // the newest edge of this customer, picked out of the `edges` collection
    latestEdge: () => p.oneToOne(Edge).through(() => Edge).orderBy({ id: 'desc' }).ref().nullable(),
  },
});

export const Edge = defineEntity({
  name: 'Edge',
  properties: {
    id: p.integer().primary(),
    start: () => p.manyToOne(Customer),
    end: () => p.manyToOne(Account),
    state: p.string(),
  },
});
```

  </TabItem>
  <TabItem value="decorators">

```ts
@Entity()
export class Customer {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Edge, e => e.start)
  edges = new Collection<Edge>(this);

  // the account linked via an edge in the `cleared` state
  @ManyToOne(() => Account, { through: () => Edge, where: { state: 'cleared' }, ref: true, nullable: true })
  account?: Ref<Account>;

  // the newest edge of this customer, picked out of the `edges` collection
  @OneToOne(() => Edge, { through: () => Edge, orderBy: { id: 'desc' }, ref: true, nullable: true })
  latestEdge?: Ref<Edge>;

}
```

  </TabItem>
</Tabs>

The `where` and `orderBy` options apply to the `through` entity, and the first matching row wins. The ORM resolves the target primary key with a correlated subquery:

```sql
select c.*, (
  select e.end_id from edge as e
  where e.start_id = c.id and e.state = 'cleared'
  limit 1
) as account_id from customer as c
```

When `through` points at the target entity itself there is no pivot, and the subquery selects that entity's primary key directly — the `latestEdge` case above. It's the same result as loading the whole `edges` collection and taking the newest item, without loading the collection.

Under the hood this is the existing non-persistent formula relation, so there are no new code paths: both loading strategies, `Loaded<>` inference, serialization, `mapToPk` and conditions on the relation all work as they do for any other to-one. The relation is read-only — no column, no FK constraint, assignments ignored during flush; you write through the `through` entity. If you need conditions that reach past the `through` entity's own columns, the docs also cover writing the subquery by hand with `formula`, which is all `through` is a shortcut for. See [to-one relations through another entity](/docs/next/relationships#to-one-relations-through-another-entity) for the full reference.

![Roll Safe: can't load a whole collection just to take the newest row if you never load the collection](./img/v7-2/through-rollsafe.jpg)

## Cursor pagination, reworked

[Cursor-based pagination](/docs/next/entity-manager#cursor-based-pagination) had two categories of input where it quietly returned the wrong page. Both are fixed in v7.2.

The first is **custom types over datetime columns**. The decode path healed every string offset through `new Date()`, which truncates sub-millisecond precision, so boundary rows were silently skipped for Temporal-style wrapper types. Rather than widening the shape heuristics further, the type is now the authority over its own cursor wire format via a new optional `Type.fromJSON()`, paired with the existing `toJSON`:

```ts
class TemporalInstantType extends Type<Temporal.Instant, string> {

  override toJSON(value: Temporal.Instant) {
    return value.toString();
  }

  override fromJSON(value: unknown) {
    // cursors are client supplied — validate and throw for what you cannot restore
    return Temporal.Instant.from(value as string);
  }

}
```

Implementing it routes cursor encoding through `toJSON` and passes the decoded value back to `fromJSON`; a failure surfaces as a `CursorError`. `DateTimeType` and `BigIntType` ship implementations (the bigint one also fixes encoding — a bigint cursor member used to crash in `JSON.stringify`). Types without `fromJSON` keep the previous wire format, and the fallback now tries the type's own string parsing before healing to a `Date`.

The second is **nullable sort keys**. Keyset pagination needs the emitted `orderBy` and the keyset condition to agree on where nulls sit, and they disagreed in three separate ways: the rewritten `orderBy` dropped the `nulls first` / `nulls last` qualifier, `desc nulls first` was treated as ascending, and a non-null offset compared with `$gt` never matched a null key, so pagination could not enter the null block at all. Nullable keys now carry an explicit placement, both sides resolve the direction through one parser, and a comparison against a nullable key gets a null arm when the null block lies ahead.

<img src={require('./img/v7-2/cursor-nulls-two-buttons.jpg').default} alt='Two buttons meme: "nulls first" and "nulls last", sweated over by the order by and the keyset condition before v7.2' style={{maxHeight: 600}} />

Two new platform hooks back this: `supportsNullsOrdering()` reports whether the placement can be requested at all (native on PostgreSQL, SQLite and Oracle, emulated on MySQL and MSSQL), and `sortsNullsLowest()` states what the database does when nobody asks — so an unqualified direction is left alone instead of being rewritten, and `findByCursor` returns the same order as `find` for the same `orderBy`. MongoDB stops being a special case; it's simply a platform that sorts nulls lowest and cannot be told otherwise.

A nested `orderBy` group is a keyset in its own right, and it now decomposes lexicographically like the top level does — `{ author: { rating, name } }` used to compare its keys independently and AND them together, dropping rows whose first key was past the cursor while the second wasn't. `@Formula` properties are treated as nullable, since the ORM cannot know otherwise.

Worth knowing when you upgrade: ordering by a nullable key now emits an explicit nulls placement, which adds an `order by` term on MySQL and MSSQL where the placement is emulated. On MongoDB, pagination over a nullable key changes to follow the nulls-lowest ordering mongo actually produces. `Cursor.for` payloads changed shape for the inputs it previously mishandled, and payloads produced by older versions still decode.

## The sql.js driver, and a playground in the docs

There's a new driver in the family: [`@mikro-orm/sql-js`](https://www.npmjs.com/package/@mikro-orm/sql-js). It runs [sql.js](https://sql.js.org), SQLite compiled to WebAssembly, entirely in memory in the browser, Node.js, Bun and Deno, with no native bindings anywhere. It sits on the shared `@mikro-orm/sql` base the same way `@mikro-orm/libsql` does and reuses the SQLite platform, so feature support matches `@mikro-orm/sqlite`:

```ts
import { defineConfig } from '@mikro-orm/sql-js';

export default defineConfig({
  entities: ['./dist/entities'],
  entitiesTs: ['./src/entities'],
});
```

The database always lives in memory, so `dbName` defaults to `:memory:` and there is nothing to point it at. Options under `driverOptions` are forwarded to `initSqlJs()` (`locateFile`, `wasmBinary`) — bundlers need `locateFile` to resolve the URL they emit for `sql.js/dist/sql-wasm.wasm` — with two of the driver's own on top: `sqlJs` hands over a module you initialised yourself, and `data` opens an existing SQLite file image instead of an empty database. Paired with `getNativeClient()`, which returns the sql.js `Database`, that is how you persist state across sessions:

```ts
const db = await orm.em.getConnection().getNativeClient();
const data = db.export(); // Uint8Array, the SQLite file image
```

Keep in mind the database lives and dies with the connection. `orm.close()` frees the WASM database, and reconnecting starts from an empty one (or from `driverOptions.data`), so the schema has to be created again. See [usage with sql.js](/docs/next/usage-with-sql-js) for the setup details.

The driver also powers something more visible. The getting-started guide used to embed StackBlitz; those are gone, replaced by a playground that runs in the page itself — Monaco for editing, sucrase for transpiling, a Web Worker for execution — so the guide's code runs against a real database while you read it. It is wired into checkpoints 1 and 2, with a QueryBuilder companion in chapter 4.

## Named parameters in `em.execute()`

`em.execute()` and `connection.execute()` now take a plain object of named parameters as an alternative to the positional array — `:name` for values, `:name:` for identifiers:

```ts
await em.execute(`
  insert into geo_seed (country, region, city)
  values (:country, :region, :city)
  on conflict (city)
      do update set country = excluded.country,
                    region  = excluded.region
`, { country, region, city });
```

The same works in the `raw()` helper, where parameters may repeat:

```ts
const fragment = raw('select :col: from geo_seed where city = :city or region = :city', { col: 'city', city: 'Brno' });
```

This also fixes the named parameter translation in `raw()` itself, which used to bind values in object-key order rather than SQL-placeholder order, replace only the first occurrence of a repeated token, and corrupt the query when one key was a prefix of another (`:city` vs `:cityCode`). It is now a single left-to-right scan that leaves PostgreSQL `::` casts and unmatched tokens alone. See [named parameters](/docs/next/raw-queries#named-parameters) for the details.

## String normalization

`StringType` and `TextType` can now trim and case values on the way to the database. With `defineEntity`, there are string-specific builder methods:

```ts
const Customer = defineEntity({
  name: 'Customer',
  properties: {
    id: p.integer().primary().autoincrement(),
    currency: p.string().trim().uppercase(),
    email: p.string().trim().lowercase().unique(),
    biography: p.text().trim(),
  },
});
```

Decorators and `EntitySchema` configure the mapped type directly:

```ts
@Property({ type: new StringType({ trim: true, case: 'upper' }) })
currency!: string;
```

Normalization runs when values are written to the database or used as ORM query parameters, so the value you search by and the value you stored agree. It is deliberately **not** a property setter: direct assignment, `em.create()` and `em.assign()` keep the assigned value in memory, and the flush writes the normalized form without mutating the property. `p.string()` with no options keeps the existing fast path, and the type benchmarks show no regression. Existing columns holding non-normalized data want a migration before you enable this. See [normalizing string properties](/docs/next/custom-types#normalizing-string-properties).

## Accessing the native client

Every driver runs on some vendor client, and until now the only supported handle was `getClient()`, which returns the Kysely query builder on SQL drivers. For vendor APIs the ORM does not wrap, there's now `getNativeClient()`, narrowed to each driver's own client type:

```ts
const pool = await orm.em.getConnection().getNativeClient(); // `Pool` from `pg`
```

| Driver             | Returns                                 |
|--------------------|-----------------------------------------|
| `postgresql`       | `Pool` from `pg`                        |
| `mysql`, `mariadb` | `Pool` from `mysql2`                    |
| `sqlite`           | `Database` from `better-sqlite3`        |
| `libsql`           | `Database` from `libsql`                |
| `pglite`           | `PGlite` from `@electric-sql/pglite`    |
| `oracledb`         | `Pool` from `oracledb`                  |
| `mongodb`          | `MongoClient`                           |

The request that prompted this was reaching the PGlite instance to run `pgDump` at runtime — it lives in a native private field, so there was no way to get at it:

```ts
import { pgDump } from '@electric-sql/pglite-tools/pg_dump';

const pglite = await orm.em.getConnection().getNativeClient();
const dump = await pgDump({ pg: pglite });
```

It throws on `mssql`, which has no long-lived native client (use the `onCreateConnection` / `onReserveConnection` hooks to reach `tedious` connections), and when you supplied a ready-made Kysely instance or dialect via `driverOptions`, since the driver never creates a client of its own then. Unless you provided the client yourself, its lifecycle stays with the ORM — leave the closing to `orm.close()`.

## `await using`

The `MikroORM` instance implements the async disposable protocol, so explicit resource management closes the connection for you:

```ts
await using orm = await MikroORM.init(config);
// `orm.close()` is called automatically at the end of the enclosing scope
```

`Symbol.asyncDispose` exists at runtime since node 18.18, so this works on node 22 without a polyfill — only the `await using` syntax itself needs node 24+ or a transpiler (TypeScript downlevels it for any target below `ESNext`).

## Smaller improvements

A few more additions worth mentioning:

- **`index` on M:N properties** — whether the generated pivot table's join columns get indexed used to be the platform default with no way to override it, which meant no index at all on PostgreSQL. `@ManyToMany({ entity: () => User, index: true })` (or `p.manyToMany(User).index()`) now indexes the join columns not already covered by a leading prefix of the pivot's composite PK (the inverse join column for the default pivot, both with `fixedOrder`). A string names the index, and `index: false` disables the platform default — handy on SQLite, which indexes every FK.
- **`em.map()` can bypass the identity map** — `em.map(User, row, { disableIdentityMap: true })` converts raw database results into an entity without touching the current context. The motivating case is CDC processing, where the before-image should not evict the after-image from the identity map.
- **`RequestContext.create()` accepts a callback for the options** — when you pass an array of entity managers from different ORM instances, the options can now be a `contextName => options` function, so each instance gets its own. Useful for e.g. deriving the schema from the request for the default instance while leaving an admin instance on its own.
- **`migrations.snapshotOnMigrate`** — set it to `false` and `migration:up` / `migration:down` stop rewriting the snapshot from database introspection, leaving it managed solely by `migration:create`. Teams that generate migrations without a live database and enforce snapshot freshness in CI get a single source of truth for the file; the trade is that the snapshot no longer follows the database after a `migration:down`. Also available as `MIKRO_ORM_MIGRATIONS_SNAPSHOT_ON_MIGRATE`.
- **`nub` CLI TypeScript loader** — `@nubjs/loader` joins `oxc`, `swc`, `tsx`, `jiti` and `tsimp` as a `tsLoader` option, either via `"mikro-orm": { "tsLoader": "nub" }` in `package.json` or `MIKRO_ORM_CLI_TS_LOADER=nub`. Automatic detection never picks it, so you opt in explicitly. It reads the project `tsconfig.json`, and rejects a custom tsconfig path rather than silently ignoring one.
- **CLI `-q` flag** — suppresses informational output on every command (errors still print), which makes the CLI behave when it's called from a larger script or as a JS module, where the output buffer is shared with the caller.
- **`cache:generate --combined` takes a path** — `--combined="../cache/mikro-orm-metadata.json"` writes the bundle where you want it (relative to the `temp` folder), instead of only to the default location.

## What do you think?

Those were the highlights. There are more improvements and bug fixes throughout — check the [full changelog](https://github.com/mikro-orm/mikro-orm/releases/tag/v7.2.0) for the complete list, and let us know what you think in the comments!
