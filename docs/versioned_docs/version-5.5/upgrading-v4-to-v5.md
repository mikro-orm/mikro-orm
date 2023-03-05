---
title: Upgrading from v4 to v5
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid for you, like if you do not use custom `NamingStrategy` implementation, you do not care about the interface being changed.

## Node 14+ required

Support for older node versions was dropped.

## TypeScript 4.1+ required

Support for older TypeScript versions was dropped.

## Options parameters

Previously many methods had many (often boolean) parameters, in v5 such methods are refactored to use options object instead to improve readability. Some methods offered both signatures - the multi parameter signatures are now removed.

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

`FindOptions.populate` parameter is now strictly typed and supports only array of strings or a boolean. Object way is no longer supported. To set loading strategy, use `FindOptions.strategy`. The return type of all such methods now returns properly typed `Loaded` response.

## Type-safe fields parameter

`FindOptions.fields` parameter is now strictly typed also for the dot notation.

## Type-safe orderBy parameter

`FindOptions.orderBy` parameter is now strictly typed. It also allows passing an array of objects instead of just a single object.

```ts
const books = await em.find(Book, {}, {
  orderBy: [
    { title: 1 },
    { author: { name: -1 } },
  ],
});
```

## Removed `@Repository()` decorator

The decorator was problematic as it could only work properly it the file was required soon enough - before the ORM initialization, otherwise the repository would not be registered at all.

Use `@Entity({ customRepository: () => CustomRepository })` in the entity definition instead.

## Disallowed global identity map

In v5, it is no longer possible to use the global identity map. This was a common issue that led to weird bugs, as using the global EM without request context is wrong, we always need to have a dedicated context for each request, so they do not interfere.

Now we get a validation error if we try to use the global context. We still can disable this check via `allowGlobalContext` configuration, or a connected environment variable `MIKRO_ORM_ALLOW_GLOBAL_CONTEXT` - this can be handy especially in unit tests.

## `LoadedCollection.get()` and `$` now return the `Collection` instance

Previously those dynamically added getters returned the array copy of collection items. In v5, we return the collection instance, which is also iterable and has a `length` getter and indexed access support, so it mimics the array. To get the array copy as before, call `getItems()` as with a regular collection.

## Different table aliasing for select-in loading strategy and for QueryBuilder

Previously with select-in strategy as well as with QueryBuilder, table aliases were always the letter `e` followed by unique index. In v5, we use the same method as with joined strategy - the letter is inferred from the entity name.

This can be breaking if you used the aliases somewhere, e.g. in custom SQL fragments. We can restore to the old behaviour by implementing custom naming strategy, overriding the `aliasName` method:

```ts
import { AbstractNamingStrategy } from '@mikro-orm/core';

class CustomNamingStrategy extends AbstractNamingStrategy {
  aliasName(entityName: string, index: number) {
    return 'e' + index;
  }
}
```

Note that in v5 it is possible to use `expr()` helper to access the alias name dynamically, e.g. `` expr(alias => `lower('${alias}.name')`) ``, which should be now preferred way instead of hardcoding the aliases.

## Migrations are now stored without extensions

Running migrations in production via node and ts-node is now handled the same. This should actually not be breaking, as old format with extension is still supported (e.g. they still can be rolled back), but newly logged migrations will not contain the extension.

## Changes in `assign()` helper

Embeddable instances are now created via `EntityFactory` and they respect the `forceEntityConstructor` configuration. Due to this we need to have EM instance when assigning to embedded properties.

Using `em.assign()` should be preferred to get around this.

Deep assigning of child entities now works by default based on the presence of PKs in the payload. This behaviour can be disable via updateByPrimaryKey: false in the assign options.

`mergeObjects` option is now enabled by default.

## `em.populate()` always return array of entities

Previously it was possible to call `em.populate()` with a single entity input, and the output would be again just a single entity.

Due to issues with TS 4.5, this method now always return array of entities. You can use destructing if you want to have a single entity return type:

```ts
const [loadedAuthor] = await em.populate(author, ...);
```

## QueryBuilder is awaitable

Previously awaiting of QB instance was a no-op. In v5, QB is promise-like interface, so we can await it. More about this in [Awaiting the QueryBuilder](./query-builder.md#awaiting-the-querybuilder) section.

## `UnitOfWork.getScheduledCollectionDeletions()` has been removed

Previously scheduled collection deletions were used for a hack when removing 1:m collection via orphan removal might require early deletes - in case we were adding the same entity (but different instance), so with same PK - inserting it in the same unit would cause unique constraint failures.

Also `IDatabaseDriver.clearCollection()` method is no longer present in the driver API.

## `populateAfterFlush` is enabled by default

After flushing a new entity, all relations are marked as populated, just like if the entity was loaded from the db. This aligns the serialized output of `e.toJSON()` of a loaded entity and just-inserted one.

In v4 this behaviour was disabled by default, so even after the new entity was flushed, the serialized form contained only FKs for its relations. We can opt in to this old behaviour via `populateAfterFlush: false`.

## `migrations.pattern` is removed in favour of `migrations.glob`

Migrations are using `umzug` under the hood, which is now upgraded to v3.0. With this version, the `pattern` configuration options is no longer available, and has been replaced with `glob`. This change is also reflected in MikroORM.

The default value for `glob` is `!(*.d).{js,ts}`, so both JS and TS files are matched (but not .d.ts files). You should usually not need to change this option as this default suits both development and production environments.

## Population no longer infers the where condition by default

> This applies only to SELECT_IN strategy, as JOINED strategy implies the inference.

Previously when we used populate hints in `em.find()` and similar methods, the query for our entity would be analysed and parts of it extracted and used for the population. Following example would find all authors that have books with given IDs, and populate their books collection, again using this PK condition, resulting in only such books being in those collections.

```ts
// this would end up with `Author.books` collections having only books of PK 1, 2, 3
const a = await em.find(Author, { books: [1, 2, 3] }, { populate: ['books'] });
```

Following this example, if we wanted to load all books, we would need a separate `em.populate()` call:

```ts
const a = await em.find(Author, { books: [1, 2, 3] });
await em.populate(a, ['books']);
```

This behaviour changed and is now configurable both globally and locally, via `populateWhere` option. Globally we can specify one of `PopulateHint.ALL` and `PopulateHint.INFER`, the former being the default in v5, the latter being the default behaviour in v4. Locally (via `FindOptions`) we can also specify custom where condition that will be passed to `em.populate()` call.

```ts
// revert back to the old behaviour locally
const a = await em.find(Author, { books: [1, 2, 3] }, {
  populate: ['books'],
  populateWhere: PopulateHint.INFER,
});
```

## `em.create()` respects required properties

`em.create()` will now require you to pass all non-optional properties. Some properties might be defined as required for TS, but we have a default value for them (either runtime, or database one) - for such we can use `OptionalProps` symbol to specify which properties should be considered as optional.

## Required properties are validated before insert

Previously the validation took place in the database, so it worked only for SQL drivers. Now we have runtime validation based on the entity metadata. This means mongo users now need to use `nullable: true` on their optional properties, or disable the validation globally via `validateRequired: false` in the ORM config.

## `PrimaryKeyType` symbol should be defined as optional

Previously when we had nonstandard PK types, we could use `PrimaryKeyType` symbol to let the type system know it. It was required to define this property as required, now it can be defined as optional too.
