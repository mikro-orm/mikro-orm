---
title: Using Multiple Schemas
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

In MySQL, PostgreSQL, and SQLite (via ATTACH DATABASE) it is possible to define your entities in multiple schemas. In MySQL terminology, it is called database, but from an implementation point of view, it is a schema.

> To use multiple schemas, your connection needs to have access to all of them (multiple connections are not supported in a single MikroORM instance).

All you need to do is simply define the schema name via `schema` options, or table name including schema name in `tableName` option:

```ts
@Entity({ schema: 'first_schema' })
export class Foo { ... }

// or alternatively we can specify it inside custom table name
@Entity({ tableName: 'second_schema.bar' })
export class Bar { ... }
```

Then use those entities as usual. Resulting SQL queries will use this `tableName` value as a table name so as long as your connection has access to given schema, everything should work as expected.

You can also query for entity in specific schema via `EntityManager`, `EntityRepository` or `QueryBuilder`:

```ts
const user = await em.findOne(User, { ... }, { schema: 'client-123' });
```

To create entity in specific schema, you will need to use `QueryBuilder`:

```ts
const qb = em.createQueryBuilder(User);
await qb.insert({ email: 'foo@bar.com' }).withSchema('client-123');
```

## Default schema on `EntityManager`

Instead of defining schema per entity or operation it's possible to `.fork()` EntityManger and define a default schema that will be used with wildcard schemas.

```ts
const fork = em.fork({ schema: 'client-123' });
await fork.findOne(User, { ... });

// Will yield the same result as
const user = await em.findOne(User, { ... }, { schema: 'client-123' });
```

When creating an entity the fork will set default schema

```ts
const fork = em.fork({ schema: 'client-123' });
const user = new User();
user.email = 'foo@bar.com';
await fork.persist(user).flush();

// Will yield the same result as
const qb = em.createQueryBuilder(User);
await qb.insert({ email: 'foo@bar.com' }).withSchema('client-123');
```

You can also set or clear schema

```ts
em.schema = 'client-123';
const fork = em.fork({ schema: 'client-1234' });
fork.schema = null;
```

`EntityManager.schema` Respects the context, so global EM will give you the contextual schema if executed inside [request context handler](https://mikro-orm.io/docs/identity-map#-requestcontext-helper)

## Wildcard Schema

MikroORM also supports defining entities that can exist in multiple schemas. To do that, you just specify wildcard schema:

```ts
@Entity({ schema: '*' })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @ManyToOne(() => Author, { nullable: true, deleteRule: 'cascade' })
  author?: Author;

  @ManyToOne(() => Book, { nullable: true })
  basedOn?: Book;

}
```

Entities like this will be by default ignored when using `SchemaGenerator`, as you need to specify which schema to use. For that you need to use the `schema` option of the `createSchema/updateSchema/dropSchema` methods or the `--schema` CLI parameter.

On runtime, the wildcard schema will be replaced with either `FindOptions.schema`, `EntityManager.schema` or with the `schema` option from the ORM config.

### Note about migrations

Currently, this is not supported via migrations, they will always ignore wildcard schema entities, and `SchemaGenerator` needs to be used explicitly. Given the dynamic nature of such entities, it makes sense to only sync the schema dynamically, e.g. in an API endpoint. You could still use the ORM migrations, but you need to add the dynamic schema queries manually to migration files. It makes sense to use the `safe` mode for such queries.

## SQLite ATTACH DATABASE

SQLite supports multiple schemas via the `ATTACH DATABASE` command, which allows attaching additional database files to a single connection. Each attached database acts as a separate schema, and tables are accessed using the `schema.table_name` syntax.

### Configuration

Use the `attachDatabases` option to specify databases to attach on connection:

```ts
import { MikroORM } from '@mikro-orm/sqlite'; // or @mikro-orm/libsql

const orm = await MikroORM.init({
  dbName: './main.db',
  entities: [Author, Book, UserProfile, LogEntry],
  attachDatabases: [
    { name: 'users_db', path: './users.db' },
    { name: 'logs_db', path: '/var/data/logs.db' },
  ],
});
```

Relative paths are resolved from the `baseDir` option (or current working directory if not set).

### Entity Definition

Reference attached databases using the `schema` option:

<Tabs
  groupId="entity-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
]
  }
>
  <TabItem value="define-entity-class">

```ts
import { defineEntity, p } from '@mikro-orm/core';

// Entity in the main database (schema is optional for main)
const AuthorSchema = defineEntity({
  name: 'Author',
  schema: 'main',
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

// Entity in an attached database
export const UserProfile = defineEntity({
  name: 'UserProfile',
  schema: 'users_db',
  properties: {
    id: p.number().primary(),
    username: p.string(),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, p } from '@mikro-orm/core';

// Entity in the main database (schema is optional for main)
export const Author = defineEntity({
  name: 'Author',
  schema: 'main',
  properties: {
    id: p.number().primary(),
    name: p.string(),
  },
});

// Entity in an attached database
export const UserProfile = defineEntity({
  name: 'UserProfile',
  schema: 'users_db',
  properties: {
    id: p.number().primary(),
    username: p.string(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
// Entity in the main database (schema is optional for main)
@Entity({ schema: 'main' })
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

// Entity in an attached database
@Entity({ schema: 'users_db' })
class UserProfile {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
// Entity in the main database (schema is optional for main)
@Entity({ schema: 'main' })
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

// Entity in an attached database
@Entity({ schema: 'users_db' })
class UserProfile {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

}
```

  </TabItem>
</Tabs>

### Schema Generator Support

The schema generator fully supports attached databases. It will:

- Create tables in the correct attached database based on the entity's `schema` option
- Detect and diff tables across all attached databases
- Generate proper migration SQL for each database

```ts
// Creates tables in all databases (main and attached)
await orm.schema.create();

// Updates schema across all databases
await orm.schema.updateSchema();
```

### Limitations

- **libSQL remote connections**: ATTACH DATABASE is not supported when using remote libSQL URLs (`libsql://`, `https://`). Only local file-based databases can be attached.
- **Cross-database foreign keys**: While SQLite allows foreign keys between attached databases within the same connection, the referenced table name in the SQL syntax cannot include a schema prefix. MikroORM handles this automatically.
- **Transactions**: All attached databases share the same transaction scope within a connection.
