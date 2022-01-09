---
title: Frequently Asked Questions
---

### How can I synchronize my database schema with the entities?

There are two ways:
- [Schema Generator](./schema-generator.md)
- [Migrations](./migrations.md)

```sh
npx mikro-orm schema:update --run
```

### I cannot run the CLI

Make sure you install `@mikro-orm/cli` package locally. If you want to have
global installation, you will need to install driver packages globally too.

### EntityManager does not have `createQueryBuilder()` method

The method is there, the issue is in the TS type.

In v4 the `core` package, where `EntityManager` and `EntityRepository` are
defined, is not dependent on knex, and therefore it cannot have a method
returning a `QueryBuilder`. You need to import the SQL flavour of the EM
from the driver package to access the `createQueryBuilder()` method.

> The SQL flavour of EM is actually called `SqlEntityManager`, it is exported both under
> this name and under `EntityManager` alias, so you can just change the
> location from where you import.

```typescript
import { EntityManager } from '@mikro-orm/mysql'; // or any other SQL driver package

const em = orm.em as EntityManager;
const qb = await em.createQueryBuilder(...);
```

To have the `orm.em` variable properly typed, we can use generic type parameter of
`MikroORM.init()`:

```ts
import { MySqlDriver } from '@mikro-orm/mysql'; // or any other SQL driver package

const orm = await MikroORM.init<MySqlDriver>({
  // ...
});
console.log(orm.em); // access EntityManager via `em` property
```

Same applies for the `aggregate()` method in mongo driver:

```typescript
import { EntityManager } from '@mikro-orm/mongodb';

const em = orm.em as EntityManager;
const ret = await em.aggregate(...);
```

> The mongo flavour of EM is actually called `MongoEntityManager`, it is exported both under
> this name and under `EntityManager` alias, so you can just change the
> location from where you import.

### How can I add columns to pivot table (M:N relation)

You should model your M:N relation transparently, via 1:m and m:1 properties.
More about this can be found in [Composite Keys section](./composite-keys.md/#use-case-3-join-table-with-metadata).

### You cannot call `em.flush()` from inside lifecycle hook handlers

You might see this validation error even if you do not use hooks. If that happens,
the reason is usually because you do not have [request context](identity-map.md) set up properly, and
you are reusing one `EntityManager` instance.

### Column is being created with JSON type while the TS type is `string/Date/number/...`

You are probably using the default `ReflectMetadataProvider`, which does not
support inferring property type when there is a property initializer.

```ts
@Property()
foo = 'abc';
```

There are two ways around this:
- Use [TsMorphMetadataProvider](./metadata-providers.md/#tsmorphmetadataprovider)
- Specify the type explicitly:

```ts
@Property()
foo: string = 'abc';
```

### How to set foreign key by raw id?

There are several ways:

1. Using references:

```ts
const b = new Book();
b.author = em.getReference(Author, 1);
```

2. Using assign helper:

```ts
const b = new Book();
em.assign(b, { author: 1 });
```

3. Using create helper:

```ts
const b = em.create(Book, { author: 1 });
```

### New entity instances get initialized with all properties set to `undefined`

When creating new entity instances, either with `new Book()` or `em.create(Book, {})`, MikroORM should return:

```ts
Book {}
```

But some users might find that this returns an object with properties that are explicitly
set to `undefined`:

```ts
Book {
  name: undefined,
  author: undefined,
  createdAt: undefined
}
```

This can cause unexpected behavior, particularly if you're expecting the database to set a
default value for a column.

To fix this, disable the [`useDefineForClassFields`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#the-usedefineforclassfields-flag-and-the-declare-property-modifier) option in your tsconfig:

```json
{
  "compilerOptions": {
    "useDefineForClassFields": false
  }
}
```
