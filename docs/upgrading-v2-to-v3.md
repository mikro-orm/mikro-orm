---
---

# Upgrading from v2 to v3

Following sections describe (hopefully) all breaking changes, most of them might be not valid 
for you, like if you do not use custom `NamingStrategy` implementation, you do not care about
the interface being changed.

## Default value of autoFlush has changed to false

> If you had `autoFlush: false` in your ORM configuration before, you can now remove 
> this line, no changes are needed in your app. 

Default value for `autoFlush` is now `false`. That means you need to call 
`em.flush()` yourself to persist changes into database. You can still change this via ORM's
options to ease the transition but generally it is not recommended as it can cause unwanted
small transactions being created around each `persist`. 

```typescript
orm.em.persist(new Entity()); // no auto-flushing by default
await orm.em.flush();
await orm.em.persist(new Entity(), true); // you can still use second parameter to auto-flush
```

## Reworked entity definition

Now it is no longer needed to merge entities with `IEntity` interface, that was polluting entity's 
interface with internal methods. New interfaces `IdentifiedEntity<T>`, `UuidEntity<T>` and `MongoEntity<T>` 
are introduced, that should be implemented by entities. They are not adding any new properties or methods, 
keeping the entity's interface clean.

`IEntity` interface has been renamed to `AnyEntity<T, PK>` and it no longer has public methods 
like `toJSON()`, `toObject()` or `init()`. One can use `wrap()` method provided by ORM that
will enhance property type when needed with those methods (`await wrap(book.author).init()`). 
To keep all methods available on the entity, you can still use interface merging with 
`WrappedEntity<T, PK>` that both extends `AnyEntity<T, PK>` and defines all those methods.


!!TODO add examples of entity definition in given section and add links here


## Integrated Knex.js as query builder and runner

`QueryBuilder` now internally uses knex to run all queries. As knex already supports connection 
pooling, this feature comes without any effort. New configuration for pooling is now available

Transactions now require using `em.transactional()` method, previous helpers 
`beginTransaction`/`commit`/`rollback` are now removed.

All transaction management has been removed from `IDatabaseDriver` interface, now EM handles 
this, passing the transaction context (carried by EM, and created by `Connection`) to all 
driver methods. New methods on EM exists: `isInTransaction()` and `getTransactionContext()`.

In postgres driver, it used to be required to pass parameters as indexed dollar sign 
($1, $2, ...), while now knex requires the placeholder to be simple question mark (`?`), 
like in other dialects, so this is now unified with other drivers.

## SchemaGenerator.generate() is now async

If you used `SchemaGenerator`, now there is CLI tool you can use instead. Learn more 
in [SchemaGenerator docs](schema-generator.md). To setup CLI, take a look at 
[installation section](installation.md).

## Strict FilterQuery and smart query conditions

`FilterQuery` now does not allow using smart query operators. You can either cast your condition 
as any or use object syntax instead (instead of `{ 'age:gte': 18 }` use `{ age: { $gte: 18 } }`).

## Logging configuration

Previously to start logging it was required to provide your custom logger. Logger now defaults 
to `console.log()`, and users can specify what namespaces are they interested in via `debug` 
option. `true`/`false` will enable/disable all namespaces.

Available logger namespaces: `'query' | 'query-params' | 'discovery' | 'info'`.

## New method on NamingStrategy interface

`getClassName()` is used to find entity class name based on its file name. Now users can 
override the default implementation to accommodate their specific needs.

If you used custom naming strategy, you will either need to implement this method yourself, 
or extend `AbstractNamingStrategy`.

## Removed deprecated fk option from 1:m and m:1 decorators 

Use `mappedBy`/`inversedBy` instead.
