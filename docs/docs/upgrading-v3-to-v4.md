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
