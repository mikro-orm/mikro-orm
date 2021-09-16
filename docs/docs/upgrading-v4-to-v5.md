---
title: Upgrading from v4 to v5
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid 
> for you, like if you do not use custom `NamingStrategy` implementation, you do not care about
> the interface being changed.

## Node 12.17.0+ (or 13.10.0+) required

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
- `em.merge()`
- `em.fork()`
- `em.begin()`
- `repo.find()`
- `repo.findOne()`
- `repo.findOneOrFail()`
- `repo.findAndCount()`
- `repo.findAll()`
- `repo.merge()`

This also applies to the methods on `IDatabaseDriver` interface.

## Type-safe populate parameter with dot notation

`FindOptions.populate` parameter is now strictly typed and supports only array of strings or a boolean.
Object way is no longer supported. To set loading strategy, use `FindOptions.strategy`.
The return type of all such methods now returns properly typed `Loaded` response. 

## Type-safe fields parameter

`FindOptions.fields` parameter is now strictly typed also for the dot notation.

## Removed `@Repository()` decorator

The decorator was problematic as it could only work properly it the file was required
soon enough - before the ORM initialization, otherwise the repository would not be 
registered at all.

Use `@Entity({ customRepository: () => CustomRepository })` in the entity definition
instead.
