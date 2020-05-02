---
title: Upgrading from v3 to v4
---

Following sections describe (hopefully) all breaking changes, most of them might be not valid 
for you, like if you do not use custom `NamingStrategy` implementation, you do not care about
the interface being changed.

## Node 10.13.0+ required

Support for older node versions was dropped. 

## TypeScript 3.7+ required

Support for older TypeScript versions was dropped. 

## Monorepo

TODO multiple packages

## SqlEntityManager and MongoEntityManager

TODO QB getter, knex getter, aggregate...

## Changes in `wrap()` helper and `WrappedEntity` interface

Previously all the methods and properties of `WrappedEntity` interface were
added to the entity prototype during discovery. In v4 there is only one property
added: `__helper: WrappedEntity`. `WrappedEntity` has been converted to actual class.

`wrap(entity)` no longer returns the entity, now the `WrappedEntity` instance is 
being returned. It contains only public methods (`init`, `assign`, `isInitialized`, ...),
if you want to access internal properties like `__meta` or `__em`, you need to explicitly
ask for the helper via `wrap(entity, true)`.

Instead of interface merging with `WrappedEntity`, one can now use classic inheritance,
by extending `BaseEntity` exported from `@mikro-orm/core`. If you do so, `wrap(entity)` 
will return your entity. 

## `autoFlush` option has been removed

The `flush` parameter of `persist()` and `remove()` methods is still there, but you
should prefer to call `em.flush()` explicitly. 

Also `persistLater()` and `removeLater()` methods are deprecated. Use `persist()` or
`remove` respectively.

## `IdEntity`, `UuidEntity` and `MongoEntity` interfaces are removed

They were actually never needed. 

## MongoDB driver is no longer the default

You need to specify the platform type either via `type` option or provide the driver
implementation via `driver` option. 

Available platforms types: `[ 'mongo', 'mysql', 'mariadb', 'postgresql', 'sqlite' ]`
