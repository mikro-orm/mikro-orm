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
