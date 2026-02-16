---
title: Using Kysely
sidebar_label: Kysely
---

MikroORM provides first-class integration with [Kysely](https://kysely.dev/), a type-safe SQL query builder. Through this integration, you can get a configured Kysely instance directly from `EntityManager`, leveraging MikroORM's metadata to drive Kysely's query transformation and type inference.

This allows you to write lower-level SQL queries while maintaining type safety and reusing entity relationships and hooks defined in MikroORM. The integration works with all entity definition styles — decorators, `EntitySchema`, and `defineEntity`.

## Getting a Kysely Instance

You can get a Kysely instance through the `em.getKysely()` method:

```ts
const kysely = orm.em.getKysely();
```

By default, this gives you a raw Kysely instance without the MikroORM plugin. To enable MikroORM-aware features like entity/property name mapping, hook processing, and value conversion, pass a configuration object:

```ts
const kysely = orm.em.getKysely({
  tableNamingStrategy: 'entity',
  columnNamingStrategy: 'property',
  processOnCreateHooks: true,
  processOnUpdateHooks: true,
  convertValues: true,
});
```

These options are described in detail in the [Plugin Options](#plugin-options) section below.

## Using Entity and Property Names in Queries

One of the most useful plugin features is the ability to write Kysely queries using your entity and property names instead of raw table and column names. This works regardless of how you define your entities — decorators, `EntitySchema`, or `defineEntity`.

```ts
@Entity()
class UserProfile {

  [EntityName]?: 'UserProfile';

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string; // maps to 'first_name' column

  @Property()
  lastName!: string; // maps to 'last_name' column

}

const kysely = orm.em.getKysely({
  tableNamingStrategy: 'entity',
  columnNamingStrategy: 'property',
});

const users = await kysely
  .selectFrom('UserProfile') // entity name, not table name
  .select(['firstName', 'lastName']) // property names, not column names
  .where('firstName', '=', 'John')
  .execute();

// Generated SQL: select "first_name", "last_name" from "user_profile" where "first_name" = ?

// Results are automatically mapped back to property names
console.log(users[0].firstName); // 'John'
```

The plugin translates entity names to table names and property names to column names at query compilation time, so you can write queries that match your TypeScript code rather than your database schema.

## Type Safety

### Automatic Inference with `defineEntity`

When you define entities using `defineEntity`, `getKysely()` automatically infers the full database type from entity metadata — table names, column types, nullability, and relations are all derived from your property definitions:

```ts
import { MikroORM, defineEntity, p } from '@mikro-orm/core';

const User = defineEntity({
  name: 'User',
  tableName: 'users',
  properties: {
    name: p.string().primary(),
    email: p.string().nullable(),
  },
});

const orm = new MikroORM({
  dbName: ':memory:',
  entities: [User],
});

// getKysely() automatically infers table structure
const kysely = orm.em.getKysely();

// Fully type-safe: TypeScript auto-completes 'users' table and its columns
const result = await kysely
  .selectFrom('users')
  .selectAll()
  .where('email', 'is not', null)
  .execute();
```

### Automatic Inference with Decorator Entities

For decorator-based entities, you can enable automatic type inference by adding the `[EntityName]` symbol property. This tells `getKysely()` the entity name at the type level, allowing it to infer table and column types from the class properties:

```ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { EntityName, MikroORM } from '@mikro-orm/sqlite';

@Entity()
class UserProfile {

  [EntityName]?: 'UserProfile';

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

}

const orm = await MikroORM.init({
  dbName: ':memory:',
  // entity classes must be passed explicitly for type inference to work
  entities: [UserProfile],
});

// getKysely() infers the table from the class properties
const kysely = orm.em.getKysely({
  columnNamingStrategy: 'property',
});

// TypeScript knows about 'user_profile' table with id, firstName, lastName columns
const result = await kysely
  .selectFrom('user_profile')
  .select(['id', 'firstName', 'lastName'])
  .execute();
```

The `[EntityName]` symbol property is required — without it, `getKysely()` cannot infer the entity name as a string literal type from a class reference. This is similar to how `[EntityRepositoryType]` works for custom repository types.

Column types are inferred directly from the class instance properties. The table name follows the configured naming strategy (underscore by default). When using `tableNamingStrategy: 'entity'`, the entity name (`'UserProfile'`) is used as-is in queries.

> Entity classes must be passed explicitly in the `entities` array (not as folder paths) for automatic type inference. This approach uses the class property types as-is and does not support detailed column name mapping (e.g., custom `fieldName`) — for that level of control, use `defineEntity`.

### Manual Type Declarations

For decorator-based or `EntitySchema`-based entities, you can also provide a manual database type to `getKysely()`:

```ts
// Define the database type to match your entities
interface Database {
  user_profile: {
    id: number;
    first_name: string;
    last_name: string;
  };
  post: {
    id: number;
    title: string;
    author_id: number;
  };
}

// Pass the type to getKysely() for full type safety
const kysely = orm.em.getKysely<Database>();

const user = await kysely
  .selectFrom('user_profile')
  .select(['id', 'first_name'])
  .executeTakeFirst();
```

When using `columnNamingStrategy: 'property'`, define the interface with property names instead:

```ts
interface Database {
  user_profile: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const kysely = orm.em.getKysely<Database>({
  columnNamingStrategy: 'property',
});
```

### Mixing Inferred and Manual Types

You can combine `InferKyselyTable` (for `defineEntity` entities) with manual type declarations (for other tables or views):

```ts
import { InferKyselyTable } from '@mikro-orm/postgresql';

const pluginOptions = {
  tableNamingStrategy: 'entity',
  convertValues: true,
} as const;

// Manual type for a database view or table without a defineEntity definition
interface ViewStatsTable {
  view_id: number;
  view_count: number;
}

interface Database {
  User: InferKyselyTable<typeof User, typeof pluginOptions>;
  Post: InferKyselyTable<typeof Post, typeof pluginOptions>;
  view_stats: ViewStatsTable;
}

const kysely = orm.em.getKysely<Database>(pluginOptions);

const user = await kysely.selectFrom('User').selectAll().executeTakeFirst();
const stats = await kysely.selectFrom('view_stats').selectAll().executeTakeFirst();
```

## Plugin Options

When you pass a configuration object to `getKysely()`, the returned instance includes the `MikroKyselyPlugin`. This plugin intercepts Kysely's query compilation and result processing to support MikroORM-specific features.

### `tableNamingStrategy`

Controls how you reference tables in Kysely queries.

- `'table'` (**default**): Use the actual table name in the database (e.g., `user_profiles`). This is Kysely's standard behavior.
- `'entity'`: Use the entity name (e.g., `UserProfile`). The plugin converts it to the corresponding table name before generating SQL.

```ts
// Assuming entity name is 'User' and database table name is 'users'

// Default (tableNamingStrategy: 'table')
await kysely.selectFrom('users').selectAll().execute();

// Using entity name strategy (tableNamingStrategy: 'entity')
await kysely.selectFrom('User').selectAll().execute();
// Generated SQL: select * from "users"
```

### `columnNamingStrategy`

Controls how you reference columns in Kysely queries and how results are mapped.

- `'column'` (**default**): Use the actual column name in the database (e.g., `first_name`).
- `'property'`: Use the entity property name (e.g., `firstName`). The plugin converts property names to column names when generating SQL, and maps column names back to property names in returned results.

```ts
const kysely = orm.em.getKysely({ columnNamingStrategy: 'property' });

const users = await kysely
  .selectFrom('user')
  .select(['firstName', 'lastName']) // property names
  .where('firstName', '=', 'John')
  .execute();

// Generated SQL: select "first_name", "last_name" from "user" where "first_name" = ?

// Results are automatically mapped back to property names
console.log(users[0].firstName); // 'John'
```

### `processOnCreateHooks`

Boolean, defaults to `false`.

When enabled, `INSERT` queries automatically process `onCreate` hooks defined on entity properties. If your insert data is missing certain properties configured with `onCreate` (e.g., `createdAt`), the plugin will automatically generate and add them to the query.

```ts
// Entity property with onCreate hook:
// @Property({ onCreate: () => new Date() })
// createdAt!: Date;

const kysely = orm.em.getKysely({ processOnCreateHooks: true });

// Insert without createdAt — it gets added automatically
await kysely.insertInto('user').values({ name: 'John' }).execute();

// Generated SQL automatically includes created_at
// insert into "user" ("name", "created_at") values (?, ?)
```

### `processOnUpdateHooks`

Boolean, defaults to `false`.

When enabled, `UPDATE` queries automatically process `onUpdate` hooks defined on entity properties. For example, automatically updating the `updatedAt` timestamp field.

```ts
// Entity property with onUpdate hook:
// @Property({ onUpdate: () => new Date() })
// updatedAt!: Date;

const kysely = orm.em.getKysely({ processOnUpdateHooks: true });

await kysely
  .updateTable('user')
  .set({ name: 'Johnny' })
  .where('id', '=', 1)
  .execute();

// Generated SQL automatically includes updated_at
// update "user" set "name" = ?, "updated_at" = ? where "id" = ?
```

### `convertValues`

Boolean, defaults to `false`.

When enabled, the plugin uses MikroORM's type system to convert query parameters and result values. This is important for handling driver-specific types (such as Date stored as numbers/strings in SQLite) or custom types.

- **Input conversion**: Converts JavaScript objects (e.g., `Date`) to database-supported formats.
- **Output conversion**: Converts raw values returned from the database back to JavaScript objects or custom types.

```ts
const kysely = orm.em.getKysely({ convertValues: true });

// 1. Input conversion: Date objects are automatically handled
await kysely
  .insertInto('user')
  .values({
    name: 'John',
    bornAt: new Date('1990-01-01') // automatically converted to database format
  })
  .execute();

// 2. Output conversion: automatically converted back to Date objects when reading
const user = await kysely
  .selectFrom('user')
  .selectAll()
  .executeTakeFirst();

console.log(user.bornAt instanceof Date); // true
```
