---
title: Upgrading from v3 to v4
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid 
> for you, like if you do not use custom `NamingStrategy` implementation, you do not care about
> the interface being changed.

## Node 10.13.0+ required

Support for older node versions was dropped. 

## TypeScript 3.7+ required

Support for older TypeScript versions was dropped. 

## Monorepo

The ORM has been split into several packages. In v4 one needs to require
`@mikro-orm/core` and a driver package, e.g. `@mikro-orm/mysql`. This driver
package already contains the `mysql2` dependency, so you can remove that from
your `package.json`. 

- `@mikro-orm/core`
- `@mikro-orm/reflection` - `TsMorphMetadataProvider`
- `@mikro-orm/cli` - CLI support, requires entity-generator, migrator and knex
- `@mikro-orm/knex` - SQL support
- `@mikro-orm/entity-generator`
- `@mikro-orm/migrations`
- `@mikro-orm/mysql`
- `@mikro-orm/mariadb`
- `@mikro-orm/mysql-base` - Common implementation for mysql and mariadb (internal)
- `@mikro-orm/sqlite`
- `@mikro-orm/postgresql`
- `@mikro-orm/mongodb`

> For easier transition, meta package mikro-orm is still present, reexporting 
> core, reflection, migrations, entity-generator and cli packages. You should 
> **not** install both `mikro-orm` and `@mikro-orm/core` packages together. 

> You should prefer the `@mikro-orm/core` over `mikro-orm` package, there were
> weird dependency issues reported with the `mikro-orm` meta-package. 

## SqlEntityManager and MongoEntityManager

In v4 the `core` package, where `EntityManager` and `EntityRepository` are 
defined, is not dependent on knex, and therefore it cannot have a method 
returning a `QueryBuilder`. You need to import the SQL flavour of the EM 
from the driver package to access the `createQueryBuilder()` method.

> The SQL flavour of EM is actually called `SqlEntityManager`, it is exported both under 
> this name and under `EntityManager` alias, so you can just change the 
> location from where you import.

```typescript
import { EntityManager } from '@mikro-orm/mysql'; // or any other SQL driver package

const em: EntityManager;
const qb = await em.createQueryBuilder(...);
```

Same applies for the `aggregate()` method in mongo driver:

```typescript
import { EntityManager } from '@mikro-orm/mongodb';

const em: EntityManager;
const ret = await em.aggregate(...);
```

> The mongo flavour of EM is actually called `MongoEntityManager`, it is exported both under 
> this name and under `EntityManager` alias, so you can just change the 
> location from where you import.

## Different default `pivotTable`

Implementation of `UnderscoreNamingStrategy` and `EntityCaseNamingStrategy` 
`joinTableName()` method has changed. You can use `pivotTable` on the owning side
of M:N relation to specify the table name manually. 

Previously the table name did not respect property name, if one defined multiple
M:N relations between same entities, there were conflicts and one would have to 
specify `pivotTable` name manually at least on one of them. With the new way, 
we can be sure that the table name won't conflict with other pivot tables. 

Previously the name was constructed from 2 entity names as `entity_a_to_entity_b`,
ignoring the actual property name. In v4 the name will be `entity_a_coll_name` in 
case of the collection property on the owning side being named `collName`. 

## Changes in folder-based discovery (`entitiesDirs` removed)

`entitiesDirs` and `entitiesDirsTs` were removed in favour of `entities` and `entitiesTs`,
`entities` will be used as a default for `entitiesTs` (that is used when we detect `ts-node`).

`entities` can now contain mixture of paths to directories, globs pointing to entities,
or references to the entities or instances of `EntitySchema`. 

This basically means that all you need to change is renaming `entitiesDirs` to `entities`.

```typescript
MikroORM.init({
  entities: ['dist/**/entities', 'dist/**/*.entity.js', FooBar, FooBaz],
  entitiesTs: ['src/**/entities', 'src/**/*.entity.ts', FooBar, FooBaz],
});
```

## Changes in `wrap()` helper, `WrappedEntity` interface and `Reference` wrapper

Previously all the methods and properties of `WrappedEntity` interface were
added to the entity prototype during discovery. In v4 there is only one property
added: `__helper: WrappedEntity`. `WrappedEntity` has been converted to actual class.

`wrap(entity)` no longer returns the entity, now the `WrappedEntity` instance is 
being returned. It contains only public methods (`init`, `assign`, `isInitialized`, ...),
if you want to access internal properties like `__meta` or `__em`, you need to explicitly
ask for the helper via `wrap(entity, true)`.

Internal methods (with `__` prefix) were also removed from the `Reference` class, 
use `wrap(ref, true)` to access them. 

Instead of interface merging with `WrappedEntity`, one can now use classic inheritance,
by extending `BaseEntity` exported from `@mikro-orm/core`. If you do so, `wrap(entity)` 
will return your entity. 

## Removed `flush` parameter from `persist()` and `remove()` methods

`flush` param is removed, both `persist` and `remove` methods are synchronous and
require explicit flushing, possibly via fluent interface call.

```typescript
// before
await em.persist(jon, true);
await em.remove(Author, jon, true);

// after
await em.persist(jon).flush();
await em.remove(jon).flush();
```

## `remove()` method requires entity instances

The `em.remove()` method originally allowed to pass either entity instance, or 
a condition. When one passed a condition, it was firing a native delete query, 
without handling transactions or hooks. 

In v4, the method is now simplified and works only with entity instances. Use 
`em.nativeDelete()` explicitly if you want to fire a delete query instead of 
letting the `UnitOfWork` doing its job.

```typescript
// before
await em.remove(Author, 1); // fires query directly

// after 
await em.nativeDelete(Author, 1);
```

> `em.removeEntity()` has been removed in favour of `em.remove()` (that now has almost the same signature).

## Type safe references

EM now returns `Loaded<T, P>` instead of the entity (`T`). This type automatically
adds synchronous method `get()` that returns the entity (for references) or array
of entities (for collections).

`Reference.get()` is now available only with correct `Loaded` type hint and is used 
as a sync getter for the entity, just like `unwrap()`. You can use `Reference.load(prop)` 
for the original `get()` method functionality. 

`em.find()` and similar methods now have two type arguments, due to TypeScript not supporting partial
type inference, when you specify the `T` explicitly (without also explicitly 
specifying the load hint), the inference will not work. This use case was mainly
for usage without classes (interfaces + `EntitySchema`) - in that case it is now 
supported to pass actual instance of `EntitySchema` as the first parameter to these
methods, that will allow correct type inference:

```typescript
const author = await em.findOne(AuthorSchema, { ... }, ['books']);
console.log(author.books.get()); // `get()` is now inferred correctly
```

## Custom types are now type safe

Generic `Type` class has now two type arguments - the input and output types. 
Input type defaults to `string`, output type defaults to the input type. 

You might need to explicitly provide the types if your methods are strictly typed.

## Custom type serialization

Custom types used to be serialized to the database value. In v4, the runtime 
value is used by default. Implement custom `toJSON()` method if you need to 
customize this.

## Property `default` and `defaultRaw`

Previously the `default` option of properties was used as is, so we had to wrap 
strings in quotes (e.g. `@Property({ default: "'foo bar'" })`). 

In v4 the `default` is typed as `string | number | boolean | null` and when used
with string value, it will be automatically quoted. 

To use SQL functions we now need to use `defaultRaw`: `@Property({ defaultRaw: 'now()' })`.

## `autoFlush` option has been removed

Also `persistLater()` and `removeLater()` methods are deprecated. Use `persist()` or
`remove` respectively.

## `IdEntity`, `UuidEntity` and `MongoEntity` interfaces are removed

They were actually never needed. 

## MongoDB driver is no longer the default

You need to specify the platform type either via `type` option or provide the driver
implementation via `driver` option. 

Available platforms types: `[ 'mongo', 'mysql', 'mariadb', 'postgresql', 'sqlite' ]`

## Removed configuration `discovery.tsConfigPath`

Removed as it is no longer needed, it was used only for `TsMorphMetadataProvider`,
when the `entitiesDirsTs` were not explicitly provided. In v4, this is no longer
needed, as ts-morph discovery will use `d.ts` files instead, that should be located
next to the compiled entities. 

## Changes in query highlighting

Previously Highlight.js was used to highlight various things in the CLI, 
like SQL and mongo queries, or migrations or entities generated via CLI.
While the library worked fine, it was causing performance issues mainly 
for those bundling via webpack and using lambdas, as the library was huge.

In v4 highlighting is disabled by default, and there are 2 highlighters 
you can optionally use (you need to install them first).

```typescript
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';

MikroORM.init({
  highlighter: new SqlHighlighter(),
  // ...
});
```

For MongoDB you can use `@mikro-orm/mongo-highlighter`.
