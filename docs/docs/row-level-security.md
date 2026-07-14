---
title: Row Level Security
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::info PostgreSQL only

Row level security (RLS) is a PostgreSQL feature, so this support covers the `postgresql` and `pglite` drivers only. Declaring a policy or an RLS filter on any other driver throws at metadata discovery.

:::

PostgreSQL row level security lets the database itself decide which rows a given connection may see or write. MikroORM can declare policies directly in your entity metadata, keep them in sync through the schema generator and migrations, and push per-request session state (session variables and roles) down to the connection at runtime so the policies actually take effect.

The main use case is multi-tenancy: instead of trusting every query to remember a `where tenant_id = ?`, you enforce the boundary in the database, where a forgotten filter or a raw query cannot leak another tenant's data. RLS is a defense-in-depth layer, not a replacement for application-level [filters](./filters.md) — the two compose, and the [filter bridge](#the-filter-bridge) below lets a single declaration drive both.

## Declaring policies

Attach policies to an entity through the `policies` option, and toggle the table-level switch with `rowLevelSecurity`. Declaring any policy implies RLS is enabled, so you rarely need to set both.

<Tabs
  groupId="entity-def"
  defaultValue="decorators"
  values={[
    {label: 'decorators', value: 'decorators'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
]
  }
>
  <TabItem value="decorators">

```ts title="./entities/Article.ts"
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({
  rowLevelSecurity: true,
  policies: [
    {
      name: 'article_tenant',
      using: `tenant_id = current_setting('app.tenant')::uuid`,
      check: `tenant_id = current_setting('app.tenant')::uuid`,
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
  <TabItem value="define-entity">

```ts title="./entities/Article.ts"
import { defineEntity, p } from '@mikro-orm/postgresql';

export const Article = defineEntity({
  name: 'Article',
  rowLevelSecurity: true,
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
  <TabItem value="entity-schema">

```ts title="./entities/Article.ts"
import { EntitySchema } from '@mikro-orm/postgresql';

export const Article = new EntitySchema({
  name: 'Article',
  rowLevelSecurity: true,
  properties: {
    id: { type: 'number', primary: true },
    tenantId: { type: 'uuid' },
  },
  policies: [
    {
      name: 'article_tenant',
      using: `tenant_id = current_setting('app.tenant')::uuid`,
      check: `tenant_id = current_setting('app.tenant')::uuid`,
    },
  ],
});
```

  </TabItem>
</Tabs>

This produces:

```sql
alter table "article" enable row level security;
create policy "article_tenant" on "article" using (tenant_id = current_setting('app.tenant')::uuid) with check (tenant_id = current_setting('app.tenant')::uuid);
```

### Policy options

A `PolicyDef` has the following shape:

| Option | Description |
|---|---|
| `name` | Policy name. Auto-generated from the table, command, and a collision suffix when omitted (e.g. `article_all_policy`, `article_all_policy_2`). |
| `command` | The command the policy applies to: `'select'`, `'insert'`, `'update'`, `'delete'`, or `'all'` (the default). |
| `type` | `'permissive'` (the default, OR-combined with other permissive policies) or `'restrictive'` (AND-combined — every restrictive policy must pass). |
| `roles` | Database roles the policy applies to. Defaults to `PUBLIC` (all roles). |
| `using` | The `using` expression that decides which existing rows are visible (reads, updates, deletes). |
| `check` | The `with check` expression that validates rows being written (inserts, updates). |

`using` and `check` accept a plain SQL string, a `raw()` fragment, or a callback `(columns, table) => string` that receives the property-to-column-name mapping (the same shape used by [check constraints](./defining-entities.md#check-constraints)). The callback form keeps the expression correct if you later rename a physical column:

```ts
policies: [
  {
    name: 'owner_only',
    using: columns => `${columns.ownerId} = current_setting('app.user')::int`,
  },
],
```

### Permissive vs restrictive

Permissive policies are combined with `OR` — a row is visible if **any** permissive policy grants it. Restrictive policies are combined with `AND` — **every** restrictive policy must also pass. Use permissive policies to widen access and restrictive policies to add a mandatory constraint on top:

```ts
policies: [
  // permissive: either your own rows or rows shared with you
  { name: 'own_rows', using: `owner_id = current_setting('app.user')::int` },
  { name: 'shared_rows', using: `is_shared = true` },
  // restrictive: but never across tenants, regardless of the above
  { name: 'tenant_guard', type: 'restrictive', using: `tenant_id = current_setting('app.tenant')::uuid` },
],
```

### Per-command policies

Split read and write rules by setting `command`. A `select` policy uses `using`; an `insert` policy uses `check`; `update` can use both:

```ts
policies: [
  { name: 'reader', command: 'select', roles: ['app_reader'], using: `tenant_id = current_setting('app.tenant')::uuid` },
  { name: 'writer', command: 'insert', roles: ['app_writer'], check: `tenant_id = current_setting('app.tenant')::uuid` },
],
```

```sql
create policy "reader" on "..." for select to "app_reader" using (tenant_id = current_setting('app.tenant')::uuid);
create policy "writer" on "..." for insert to "app_writer" with check (tenant_id = current_setting('app.tenant')::uuid);
```

### Enable without policies (deny-all) and force

`rowLevelSecurity: true` with no policies enables RLS on the table without granting any access. Because a table with RLS enabled and no matching policy denies everything to non-owners, this is a **deny-all** switch — handy as a safe default before you add policies:

```ts
@Entity({ rowLevelSecurity: true }) // enabled, no policies -> non-owners see nothing
```

`rowLevelSecurity: 'force'` emits `force row level security`, which applies the policies to the **table owner too**. Without `force`, the owner (and superusers) bypass RLS entirely — see [operational caveats](#operational-caveats).

```ts
@Entity({ rowLevelSecurity: 'force', policies: [/* ... */] })
```

```sql
alter table "..." enable row level security;
alter table "..." force row level security;
```

Conversely, `rowLevelSecurity: false` overrides the policies-imply-RLS default: the declared policies are still created, but RLS is left **disabled**, so they stay dormant until you enable it. This lets you stage policies ahead of the cutover and flip the switch later.

```ts
@Entity({ rowLevelSecurity: false, policies: [/* ... */] }) // policies created, but RLS stays off
```

### Inheritance

Policies declared on an abstract base entity are passed down to the concrete entities that extend it, together with the `rowLevelSecurity` flag (a child can override the flag by declaring its own value). For single table inheritance (STI), policies may only be declared on the **root** of the hierarchy (all subclasses share one table) — declaring them on a non-root STI entity throws. For table-per-type (TPT) inheritance, policies stay on the table that declares them — the root's policies protect the root table only, and child tables declare their own.

## Schema generator and migrations

Policies are picked up by `schema:create`, `schema:update`, and `migration:create` automatically, and PostgreSQL policies are introspected back so the diff stays clean. The comparator diffs each policy by name:

- **Added / removed policies** → `create policy` / `drop policy`. Policies are matched by name, so a **rename** shows up as a drop of the old name plus a create of the new one (policies carry no data, so nothing is lost).
- **Enabling / disabling RLS** → `enable`/`disable row level security`, and `force`/`no force`.
- **Any other change** (`using`, `check`, `roles`, `command`, `type`) → `drop policy` + `create policy`. The old policy is dropped **before** any column drops in the same diff and recreated **after** any column adds — a policy expression holds a dependency on the columns it references, so altering in place would block dropping a column the old expression referenced (and PostgreSQL cannot alter a policy's `for <command>` or `as permissive|restrictive` in place anyway).

Because the target schema is compared against what PostgreSQL reports, expressions are canonicalized by the database (e.g. `in (1, 2, 3)` comes back as `= any (...)`), and the comparator accounts for that — a round-trip of `schema:create` followed by `schema:update` produces no drift. Migration snapshots serialize the full policy set and RLS state, so re-running `migration:create` against an unchanged schema yields an empty migration.

:::note

Tables without any RLS emit no policy or RLS keys into the migration snapshot at all, so adopting this feature does not churn existing non-RLS snapshots.

:::

### Adopting on a database with hand-written policies

If your database already has policies you created manually (raw SQL migrations, the patterns from the pre-native-support era), the schema generator now sees them — and since they are not mirrored in your entity metadata, any diff computed from **live introspection** (`schema:update`, or `migration:create` with `snapshot: false`) will propose to **drop them and disable RLS**. Snapshot-based `migration:create` is unaffected — pre-upgrade snapshots contain no policy state, so nothing is diffed. Pick one of two adoption paths before running any schema tooling after the upgrade:

1. **Adopt them into metadata** — declare the existing policies on your entities (`generate-entities` round-trips them into all definition styles, so you can copy the emitted `policies` arrays verbatim). Once declared, the diff is clean and the ORM manages them from here on.
2. **Leave them unmanaged** — set `schemaGenerator: { ignorePolicies: true }`. This makes RLS create-only: policies you declare in metadata are still created, and enabling/forcing RLS is still emitted, but existing policies are never dropped or altered and RLS is never disabled or unforced. This mirrors the `ignoreTriggers`/`ignoreRoutines` options.

:::caution

`safe` mode suppresses policy drops and RLS disabling, so it shields unmanaged policies from a plain `schema:update --safe` — but it is not an adoption strategy: non-safe runs and migrations still drop them, and a hand-written policy whose name collides with a declared one is drop+recreated even under `safe`. Use one of the two paths above.

:::

## Runtime session context

Policies almost always read per-request state through `current_setting('app.tenant')` or `current_user`. MikroORM carries that state as a **session context** on the `EntityManager` — a set of session variables plus an optional role — and emits it to PostgreSQL before your queries run.

Set it when forking, or later via `setSessionContext`:

```ts
// fork a dedicated EM for the request/tenant
const em = orm.em.fork({
  session: {
    variables: { 'app.tenant': tenantId },
    role: 'app_user',
  },
});

const articles = await em.find(Article, {}); // only this tenant's rows come back
```

```ts
// or set/update it on an existing context
em.setSessionContext({ variables: { 'app.tenant': tenantId } });
em.setSessionContext({ role: 'app_user' });

const ctx = em.getSessionContext();
// { variables: { 'app.tenant': tenantId }, role: 'app_user' }
```

`setSessionContext` **merges** the variables into any already set and updates the role when one is provided — use `clearSessionContext()` to drop the whole context (there is no per-key removal). Neither can be called while a transaction is active (under either strategy) — the running transaction would never see the change, so the ORM fails closed. Forks inherit the parent's session context; passing `session` to `fork()` replaces it for that fork, except that variables staged by `setFilterParams` for [rls filters](#the-filter-bridge) are re-staged from the copied filter params (explicit `session.variables` win on conflict), so the app-level filters and the DB policies stay consistent.

Session variables are applied as strings (`set_config` only takes text); `Date` values are serialized to ISO 8601 so casts like `::timestamptz` parse them.

### The two strategies

The `sessionContext` config option chooses how the context reaches the connection:

```ts
const orm = await MikroORM.init({
  // ...
  sessionContext: 'transaction', // the default; 'connection' is the alternative
});
```

#### `'transaction'` (default)

After every `begin`, the ORM emits `select set_config(key, value, true)` for each variable (transaction-scoped, so it is rolled back with the transaction) and `set local role "..."` when a role is set. This is safe under pgBouncer **transaction** pooling mode.

Operations that run **outside** an explicit transaction get wrapped in a short implicit transaction automatically — but only when a session context is actually set, so there is zero overhead when you do not use RLS. This covers `em.find`/`findOne`/`count`, native `insert`/`nativeUpdate`/`nativeDelete`, upserts, many-to-many pivot loads, raw `em.execute()`, and flushes:

```ts
// no explicit transaction needed — the ORM opens a short one to carry the context
const em = orm.em.fork({ session: { variables: { 'app.tenant': tenantId } } });
await em.find(Article, {});
```

```sql
begin;
select set_config($1, $2, true);
select ... from "article" ...;
commit;
```

Because `em.execute()` is wrapped too, statements that cannot run inside a transaction block (`vacuum`, `create index concurrently`, ...) will fail while a session context is set — run those via `em.getConnection().execute()` (which never carries the context) or from an EM without one.

Nested transactions (savepoints) do **not** re-emit the context — it is set once on the outermost `begin` and inherited by the savepoints.

:::caution streaming requires a transaction

A short implicit transaction cannot outlive a lazy async iterator, so `em.stream()`/`qb.stream()` cannot be auto-wrapped. Rather than silently streaming rows the policies never scoped, the ORM **fails closed**: streaming with a staged session context outside a transaction throws under the `'transaction'` strategy. Wrap streaming in an explicit `em.transactional()` (which does carry the context), or use the `'connection'` strategy.

```ts
await em.transactional(async em => {
  for await (const article of em.stream(Article, {})) {
    // ...
  }
});
```

:::

#### `'connection'`

Applies the context whenever a connection is reserved, using `set_config(..., false)` and `set role "..."` (session-scoped), always preceded by `reset all` (plus `reset role` when no role is set) so a pooled connection never carries stale state from a previous reservation. It resolves the active EM through the request context, which makes it a natural fit for a [RequestContext](./identity-map.md#request-context)/middleware setup. This strategy is **postgresql driver only** and composes with any `onReserveConnection` hook you already have.

```ts
const orm = await MikroORM.init({
  driver: PostgreSqlDriver,
  sessionContext: 'connection',
});

await RequestContext.create(orm.em, async () => {
  const em = RequestContext.getEntityManager()!;
  em.setSessionContext({ role: 'app_user', variables: { 'app.tenant': tenantId } });
  return em.find(Article, {});
});
```

```sql
select set_config($1, $2, false);
set role "app_user";
select ... from "article" ...;
```

:::info Which strategy?

Prefer `'transaction'` (the default) unless you specifically need session-scoped state — it keeps each unit of work self-contained and is safe under pgBouncer transaction pooling. The `'connection'` strategy sets state for the lifetime of the reserved connection, so it needs pgBouncer **session** pooling (or no external pooler), but it removes the implicit-transaction wrapping and handles `em.stream()` without ceremony.

:::

Two caveats specific to this strategy:

- It resolves the active EM through `RequestContext` — an explicit `fork()` created outside a request context receives only the connection reset (`reset all` / `reset role`), not your session variables. Set the context on the EM resolved inside `RequestContext` (as in the example above).
- The `reset all` issued on every acquire also clears any session-level `set`s you made in `onCreateConnection`; re-apply such settings via your own `onReserveConnection` hook (which runs after the ORM's) or per query.

It is only available on the `postgresql` driver — configuring it elsewhere (including `pglite`) throws at init.

### Fork-per-request middleware

The typical multi-tenant pattern (see [GitHub discussion #6137](https://github.com/mikro-orm/mikro-orm/discussions/6137)) is to derive the tenant from the request and fork a scoped EM for the duration of the handler:

```ts
app.use((req, res, next) => {
  const tenantId = getTenantFromRequest(req); // e.g. from a JWT claim or subdomain
  const em = orm.em.fork({
    session: {
      variables: { 'app.tenant': tenantId },
      role: 'app_user',
    },
  });

  RequestContext.create(em, next);
});
```

Every `em.find`, flush, and raw query inside that request now runs with the tenant's session context, and the database enforces the boundary regardless of what the application code asks for.

### Write violations

A write that a `with check` policy rejects surfaces as a `RowLevelSecurityViolationException` (a `ConstraintViolationException` subclass), mapped from PostgreSQL SQLSTATE `42501`:

```ts
import { RowLevelSecurityViolationException } from '@mikro-orm/postgresql';

const em = orm.em.fork({ session: { role: 'app_user', variables: { 'app.tenant': tenantA } } });
em.create(Article, { tenantId: tenantB }); // wrong tenant

try {
  await em.flush();
} catch (e) {
  if (e instanceof RowLevelSecurityViolationException) {
    // rejected by the policy's WITH CHECK
  }
}
```

### Result cache

The session context is folded into the [result cache](./caching.md) key automatically — including **named** cache keys (`cache: ['articles', 5000]`, stored as `articles|<serialized context>` when a context is set) — so two tenants issuing the same query never share a cached result. One consequence: `em.clearCache('articles')` removes only the unscoped entry; context-scoped entries expire via their TTL.

## The filter bridge

If you already model tenancy with an entity [filter](./filters.md), you can have that single declaration enforce itself at **both** layers: the application-level `where` and a database policy. Flag the filter with `rls: true`:

```ts
import { defineEntity, p } from '@mikro-orm/postgresql';

export const Order = defineEntity({
  name: 'Order',
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    title: p.string(),
  },
  filters: {
    byTenant: { name: 'byTenant', cond: args => ({ tenantId: args.tenant }), rls: true },
  },
});
```

At schema time this compiles to a policy, deriving the session-variable name and the cast from the property type:

```sql
create policy "order_byTenant_policy" on "order" using ("tenant_id" = current_setting('mikro.byTenant.tenant')::uuid);
```

At runtime, `em.setFilterParams` stages **both** the application `where` clause (when you enable the filter) and the matching session variable, so the DB policy sees the same value:

```ts
const em = orm.em.fork();
em.setFilterParams('byTenant', { tenant: tenantId });
// stages the session variable { 'mikro.byTenant.tenant': tenantId }

// the app-level WHERE is added when the filter is enabled...
await em.find(Order, {}, { filters: ['byTenant'] }); // ... where "tenant_id" = ?

// ...and a raw query that bypasses the app filter is still caught by the policy
await em.execute('select * from "order"'); // only this tenant's rows
```

One declaration, two enforcement layers.

### Session variable name and casts

Each referenced argument maps to a session variable named `mikro.<filterName>.<argName>`. The SQL cast is derived from the compared property's type:

| Column type | Cast |
|---|---|
| `uuid` | `::uuid` |
| `bigint` | `::bigint` |
| `int` / `smallint` / `tinyint` | `::int` |
| `boolean` | `::boolean` |
| `datetime` | `::timestamptz` |
| `date` | `::date` |
| `time` | `::time` |
| `string` / `text` / `enum` | none (`current_setting()` already returns text) |
| native enum (`nativeEnumName`) | cast to the enum type itself (e.g. `::"task_status"`) |

Types outside this table (e.g. `decimal`) are uncastable and error at schema build.

Filters inherited from a TPT parent do not compile onto the child tables — the policy lives on the parent table only. Declaring an `rls` filter on a non-root STI entity throws at discovery, since those entities have no table of their own and the policy would silently never be created.

For a **single-argument** filter, override the variable name with `rls: { setting: 'app.current_tenant' }`:

```ts
filters: {
  byTenant: { name: 'byTenant', cond: args => ({ tenantId: args.tenant }), rls: { setting: 'app.current_tenant' } },
},
```

```sql
create policy "order_byTenant_policy" on "order" using ("tenant_id" = current_setting('app.current_tenant')::uuid);
```

A custom `setting` with more than one referenced argument throws, since there is no single variable to map it to.

### Compilation constraints

To compile to a static policy, the filter's `cond` must be statically analyzable. The following throw a descriptive error at schema build:

- A condition that touches `em`, `type`, or the find options (a policy cannot see runtime state).
- An `async` condition.
- An argument used outside a direct comparison (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`) — e.g. `{ orgId: { $in: [args.o] } }`.
- A compared column whose type has no cast (e.g. `decimal`).

Object conditions (`cond: { status: 'active' }`) and functions over `args` only are fine. Only **entity-scoped** filters can be flagged — a global (config or `addFilter`) filter with `rls` is rejected.

:::caution Multiple RLS filters are separate permissive policies

Each `rls` filter compiles to its **own permissive policy**, and `current_setting()` is emitted **without** `missing_ok`, so an unset variable raises an error at query time. That is deliberate — it fails closed rather than silently returning everything. But because permissive policies are OR-combined, if a table has several RLS-filter policies, a query is evaluated against all of them, and any whose variable is unset will error. Stage every relevant filter's params (or set the variables directly) before querying such a table. If you need a policy that tolerates an unset variable, write it by hand with the `nullif` pattern shown [below](#tolerating-an-unset-variable).

:::

## Operational caveats

RLS has sharp edges that are easy to get wrong. Read this section before relying on it in production.

### The table owner and superusers bypass RLS

By default, the role that **owns** the table and any superuser **bypass** RLS entirely — policies simply do not apply to them. This is why your application must connect as a **non-owner, non-superuser** role, and why the schema generator (which connects as a privileged role to create tables) is not itself constrained by the policies. If you need the owner to be constrained too, declare `rowLevelSecurity: 'force'`.

### Schema role vs application role

There are two distinct roles in play:

- The **migration/schema role** owns the tables and runs `schema:*` / migrations. It is privileged and bypasses RLS.
- The **application role** is what your app connects as at runtime. It must be a non-owner so the policies apply, and you must explicitly `grant` it the table privileges it needs:

```sql
create role app_user login password '...';
grant usage on schema public to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
-- and for future tables:
alter default privileges in schema public grant select, insert, update, delete on tables to app_user;
```

Then connect your app as `app_user` (via the connection string or `user` option), and switch to it per request with `session: { role: 'app_user' }` if you connect as a shared role.

### Tolerating an unset variable

The default fail-closed behavior means a policy referencing `current_setting('app.tenant')` errors if `app.tenant` was never set. When you deliberately want a policy to treat an unset variable as "no match" instead of an error, pass `true` as the second argument to `current_setting` (so it returns `null` rather than raising) and guard the empty string:

```ts
policies: [
  {
    name: 'tenant_optional',
    using: `tenant_id = nullif(current_setting('app.tenant', true), '')::uuid`,
  },
],
```

Contrast this with the filter bridge's default, which omits `missing_ok` on purpose so a missing variable is a hard error.

:::caution Empty string, not "unset"

With connection pooling, "unset" is less reliable than it looks. Once any transaction ran `set_config('app.tenant', ..., true)` on a physical connection, the parameter stays known on that connection after the transaction ends — its value resets to the **empty string**, not to undefined. A later query without a session context then reads `''` instead of raising `unrecognized configuration parameter`.

This is still fail-closed as long as your policy casts the setting (`::uuid`, `::int`, ...) — the cast fails on `''`. But a policy comparing a **plain text column** with no cast would silently match rows whose column equals `''` instead of erroring. Prefer cast-forcing column types for tenant discriminators, or use the `nullif(...)` guard above to make the empty string explicit.

:::

### Index your tenant column

Policies run **per row** on every query — a `using` expression is effectively an extra `where` clause the planner must satisfy. Keep the columns your policies compare **indexed** (your `tenant_id`, `owner_id`, etc.), and keep expressions index-friendly. An unindexed tenant column turns every query into a sequential scan.

### pgBouncer

- The `'transaction'` strategy uses transaction-scoped `set_config(..., true)` / `set local role`, which is safe under pgBouncer **transaction** pooling mode.
- The `'connection'` strategy sets session-scoped state on the reserved connection, so it requires pgBouncer **session** pooling mode (or a direct, non-pooled connection). Using it under transaction mode would leak one request's context onto another.

## Entity generator

Regenerating entities from a database that already has RLS emits explicit `policies` and the `rowLevelSecurity` flag on the generated entities, reflecting exactly what PostgreSQL reports. Note that policies which originated from the [filter bridge](#the-filter-bridge) come back as **plain policies** — the link back to the source filter is not stored in the database and cannot be recovered, so you will get the compiled `using`/`check` expression rather than a `filters: { ..., rls: true }` declaration. If you want to keep the one-declaration-two-layers ergonomics, re-introduce the filter by hand after generating. See the [Entity Generator](./entity-generator.md) guide for the overall workflow.
