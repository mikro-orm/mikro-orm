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
- `repo.find()`
- `repo.findOne()`
- `repo.findOneOrFail()`
- `repo.findAndCount()`
- `repo.findAll()`
- `repo.merge()`

## Type-safe populate parameter with dot notation

Populate parameter is now strictly typed and supports only array of strings or a boolean.
Object way is no longer supported. To set loading strategy, use `FindOptions.strategy`.
The return type of all such methods now returns properly typed `Loaded` response. 
