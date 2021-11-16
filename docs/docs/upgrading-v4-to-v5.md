---
title: Upgrading from v4 to v5
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid 
> for you, like if you do not use custom `NamingStrategy` implementation, you do not care about
> the interface being changed.

## Node 14+ required

Support for older node versions was dropped. 

## TypeScript 4.1+ required

Support for older TypeScript versions was dropped. 

## Options parameters

Previously many methods had many (often boolean) parameters, in v5 such methods are
refactored to use options object instead to improve readability. Some methods offered
both signatures - the multi parameter signatures are now removed.

List of such methods:

- `em.find()`
- `em.findOne()`
- `em.findOneOrFail()`
- `em.findAndCount()`
- `em.getReference()`
- `em.merge()`
- `em.fork()`
- `em.begin()`
- `em.assign()`
- `em.create()`
- `repo.find()`
- `repo.findOne()`
- `repo.findOneOrFail()`
- `repo.findAndCount()`
- `repo.findAll()`
- `repo.getReference()`
- `repo.merge()`
- `collection.init()`
- `repo.create()`
- `repo.assign()`

This also applies to the methods on `IDatabaseDriver` interface.

## Type-safe populate parameter with dot notation

`FindOptions.populate` parameter is now strictly typed and supports only array of 
strings or a boolean.
Object way is no longer supported. To set loading strategy, use `FindOptions.strategy`.
The return type of all such methods now returns properly typed `Loaded` response. 

## Type-safe fields parameter

`FindOptions.fields` parameter is now strictly typed also for the dot notation.

## Type-safe orderBy parameter

`FindOptions.orderBy` parameter is now strictly typed. It also allows passing an 
array of objects instead of just a single object.

```ts
const books = await em.find(Book, {}, {
  orderBy: [
    { title: 1 },
    { author: { name: -1 } },
  ],
});
```

## Removed `@Repository()` decorator

The decorator was problematic as it could only work properly it the file was required
soon enough - before the ORM initialization, otherwise the repository would not be 
registered at all.

Use `@Entity({ customRepository: () => CustomRepository })` in the entity definition
instead.

## Disallowed global identity map

In v5, it is no longer possible to use the global identity map. This was a 
common issue that led to weird bugs, as using the global EM without request
context is wrong, we always need to have a dedicated context for each request,
so they do not interfere.

Now we get a validation error if we try to use the global context. We still can
disable this check via `allowGlobalContext` configuration, or a connected 
environment variable `MIKRO_ORM_ALLOW_GLOBAL_CONTEXT` - this can be handy 
especially in unit tests.

## `LoadedCollection.get()` and `$` now return the `Collection` instance

Previously those dynamically added getters returned the array copy of collection
items. In v5, we return the collection instance, which is also iterable and has
a `length` getter and indexed access support, so it mimics the array. To get the
array copy as before, call `getItems()` as with a regular collection.

## Different table aliasing for select-in loading strategy and for QueryBuilder

Previously with select-in strategy as well as with QueryBuilder, table aliases
were always the letter `e` followed by unique index. In v5, we use the same 
method as with joined strategy - the letter is inferred from the entity name.

This can be breaking if you used the aliases somewhere, e.g. in custom SQL 
fragments. We can restore to the old behaviour by implementing custom naming
strategy, overriding the `aliasName` method:

```ts
import { AbstractNamingStrategy } from '@mikro-orm/core';

class CustomNamingStrategy extends AbstractNamingStrategy {
  aliasName(entityName: string, index: number) {
    return 'e' + index;
  }
}
```

Note that in v5 it is possible to use `expr()` helper to access the alias name
dynamically, e.g. ``expr(alias => `lower('${alias}.name')`)``, which should be 
now preferred way instead of hardcoding the aliases.

## Migrations are now stored without extensions

Running migrations in production via node and ts-node is now handled the same.
This should actually not be breaking, as old format with extension is still 
supported (e.g. they still can be rolled back), but newly logged migrations
will not contain the extension.
