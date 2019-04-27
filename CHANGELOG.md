<a name="2.3.2"></a>
# [2.4.0](https://github.com/B4nan/mikro-orm/compare/v2.3.2...v2.4.0) (2019-04-27)

### Bug Fixes

* query-builder: do not ignore nested and group conditions ([ab64d5a](https://github.com/B4nan/mikro-orm/commit/ab64d5a))
* query-builder: support calling `andWhere()`/`orWhere()` without previous `where()` ([516e863](https://github.com/B4nan/mikro-orm/commit/516e863))

### Features

* query-builder: add `groupBy()` and `having()` to `QueryBuilder` ([1487803](https://github.com/B4nan/mikro-orm/commit/1487803))
* query-builder: add `QueryBuilder.clone()` method ([313deb1](https://github.com/B4nan/mikro-orm/commit/313deb1))
* query-builder: allow DISTINCT selects via `qb.select('...', true)` ([31d6079](https://github.com/B4nan/mikro-orm/commit/31d6079))
* query-builder: do not wrap fields that contain space ([7ee2e5a](https://github.com/B4nan/mikro-orm/commit/7ee2e5a))
* query-builder: allow string literals in where conditions ([ec27c33](https://github.com/B4nan/mikro-orm/commit/ec27c33))
* query-builder: support smart query conditions in `QueryBuilder` ([2c5bca4](https://github.com/B4nan/mikro-orm/commit/2c5bca4))



<a name="2.3.2"></a>
## [2.3.2](https://github.com/B4nan/mikro-orm/compare/v2.3.1...v2.3.2) (2019-04-26)

### Bug Fixes

* **mongo**: support entity names in mongo connection API ([c719b1e](https://github.com/B4nan/mikro-orm/commit/c719b1e))
* **mongo**: support other top level keys than $set in `EM.nativeUpdate()` ([d12bd78](https://github.com/B4nan/mikro-orm/commit/d12bd78))
* **serializing**: do not strip falsy values from serialized DTO ([93e806f](https://github.com/B4nan/mikro-orm/commit/93e806f))



<a name="2.3.1"></a>
## [2.3.1](https://github.com/B4nan/mikro-orm/compare/v2.3.0...v2.3.1) (2019-04-25)

### Bug Fixes

* **core**: do not override loaded entity state when loading it again ([79fabcb](https://github.com/B4nan/mikro-orm/commit/79fabcb))



<a name="2.3.0"></a>
# [2.3.0](https://github.com/B4nan/mikro-orm/compare/v2.2.2...v2.3.0) (2019-04-24)

### Bug Fixes

* **deps**: update dependency ts-morph to v2 ([#47](https://github.com/B4nan/mikro-orm/issues/47))
* **sql**: support custom field names in select clause of query builder ([b10c67f](https://github.com/B4nan/mikro-orm/commit/b10c67f))

### Features

* **core**: implement orphan removal ([#48](https://github.com/B4nan/mikro-orm/issues/48)), closes [#36](https://github.com/B4nan/mikro-orm/issues/36)
* **core**: support lookup by array instead of explicit `$in` condition ([4f600d6](https://github.com/B4nan/mikro-orm/commit/4f600d6))
* **query-builder**: add support for `join()` and `leftJoin()` ([#46](https://github.com/B4nan/mikro-orm/issues/46)), closes [#45](https://github.com/B4nan/mikro-orm/issues/45)



<a name="2.2.2"></a>
## [2.2.2](https://github.com/B4nan/mikro-orm/compare/v2.2.1...v2.2.2) (2019-04-18)

### Bug Fixes

* **serializing**: allow serializing deeply nested structures ([04c5190](https://github.com/B4nan/mikro-orm/commit/04c5190))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/B4nan/mikro-orm/compare/v2.2.0...v2.2.1) (2019-04-18)

### Bug Fixes

* **entity**: allow boolean onlyProperties parameter in entity.assign() ([9f318f7](https://github.com/B4nan/mikro-orm/commit/9f318f7))
* **entity**: set dirty flag on collections updated via entity.assign() ([d9d71fe](https://github.com/B4nan/mikro-orm/commit/d9d71fe))
* **sql-drivers**: work around empty IN () and NOT IN () conditions ([13a1832](https://github.com/B4nan/mikro-orm/commit/13a1832))

### Features

* **core**: allow forking EM without clearing identity map ([5e4603c](https://github.com/B4nan/mikro-orm/commit/5e4603c))



<a name="2.2.0"></a>
# [2.2.0](https://github.com/B4nan/mikro-orm/compare/v2.1.1...v2.2.0) (2019-04-14)

### Bug Fixes

* **core**: ignore rest parameter in `entity.toJSON()` ([147de7d](https://github.com/B4nan/mikro-orm/commit/147de7d))
* **core**: merge only objects in `assign()` with `mergeObjects` flag ([749ca6f](https://github.com/B4nan/mikro-orm/commit/749ca6f))
* **core**: use serialized PK in `Collection.getIdentifiers()` ([a24b6bc](https://github.com/B4nan/mikro-orm/commit/a24b6bc))
* **mongo**: include missing query condition in logger in `deleteMany()` ([bf280b4](https://github.com/B4nan/mikro-orm/commit/bf280b4))

### Features

* **core**: add `@OneToOne` decorator ([#42](https://github.com/B4nan/mikro-orm/pull/42)), closes [#37](https://github.com/B4nan/mikro-orm/issues/37)
* **core**: add `createQueryBuilder()` to `EntityRepository` API ([a8ab04e](https://github.com/B4nan/mikro-orm/commit/a8ab04e))
* **core**: add support for `nullable` columns in schema generator ([8e508d3](https://github.com/B4nan/mikro-orm/commit/8e508d3)), closes [#39](https://github.com/B4nan/mikro-orm/issues/39)
* **core**: add support for `unique` index in schema generator ([f8a614b](https://github.com/B4nan/mikro-orm/commit/f8a614b)), closes [#38](https://github.com/B4nan/mikro-orm/issues/38)
* **core**: allow changing join columns in 1:m, m:n and 1:1 ([dd97760](https://github.com/B4nan/mikro-orm/commit/dd97760))
* **core**: allow entities in query data and where (convert them to PK) ([e3a4962](https://github.com/B4nan/mikro-orm/commit/e3a4962))
* **core**: allow orderBy in `EM.findOne()` and support `FindOneOptions` ([0c61703](https://github.com/B4nan/mikro-orm/commit/0c61703))
* **core**: allow self-referencing in M:N collections ([5fda213](https://github.com/B4nan/mikro-orm/commit/5fda213))
* **core**: implement shadow properties - `@Property({ persist: false })` ([6062118](https://github.com/B4nan/mikro-orm/commit/6062118)), closes [#40](https://github.com/B4nan/mikro-orm/issues/40)
* **mapping**: use `mappedBy`/`inversedBy` in 1:m/m:1 to be consistent ([305dc6e](https://github.com/B4nan/mikro-orm/commit/305dc6e))
* **metadata**: do not require source files when type provided ([f9a237f](https://github.com/B4nan/mikro-orm/commit/f9a237f))
* **query-builder**: add `andWhere()` and `orWhere()` to `QueryBuilder` ([d1a1127](https://github.com/B4nan/mikro-orm/commit/d1a1127))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/B4nan/mikro-orm/compare/v2.1.0...v2.1.1) (2019-04-05)

### Features

* **core**: add support for merging object properties in `IEntity.assign()` ([3b401ed](https://github.com/B4nan/mikro-orm/commit/3b401ed)), closes [#35](https://github.com/B4nan/mikro-orm/issues/35)



<a name="2.1.0"></a>
# [2.1.0](https://github.com/B4nan/mikro-orm/compare/v2.0.3...v2.1.0) (2019-04-04)

### Bug Fixes

* **core**: rename `IEntity.uuid` to `__uuid` to allow using uuid as property ([44eb778](https://github.com/B4nan/mikro-orm/commit/44eb778))
* **core**: do not require PK when computing change set ([67415f6](https://github.com/B4nan/mikro-orm/commit/67415f6))
* **core**: support custom `toJSON` implementation in complex structures ([2a9f6da](https://github.com/B4nan/mikro-orm/commit/2a9f6da))
* **core**: support self-referencing in many to one association ([0fe4ec7](https://github.com/B4nan/mikro-orm/commit/0fe4ec7), [2499019](https://github.com/B4nan/mikro-orm/commit/2499019))
* **drivers**: log correct client url (based on other connection options) ([79f37bd](https://github.com/B4nan/mikro-orm/commit/79f37bd)), closes [#29](https://github.com/B4nan/mikro-orm/issues/29)
* **mysql**: convert numeric value of bool fields to boolean ([133afaa](https://github.com/B4nan/mikro-orm/commit/133afaa))
* **serializing**: always initialize collections when populating ([5290737](https://github.com/B4nan/mikro-orm/commit/5290737))

### Features

* **core**: add support for complex query conditions in SQL QueryBuilder ([0ea3f41](https://github.com/B4nan/mikro-orm/commit/0ea3f41))
* **core**: allow using different PK than id (e.g. uuid) ([40bcdc0](https://github.com/B4nan/mikro-orm/commit/40bcdc0))
* **core**: improve support for ts-node ([220bcaa](https://github.com/B4nan/mikro-orm/commit/220bcaa))
* **core**: implement `Cascade.MERGE` and `Cascade.ALL` ([#27](https://github.com/B4nan/mikro-orm/issues/27))), closes [#16](https://github.com/B4nan/mikro-orm/issues/16)
* **core**: support cascade merging detached entity ([8801960](https://github.com/B4nan/mikro-orm/commit/8801960))
* **core**: support smart search conditions ([5537156](https://github.com/B4nan/mikro-orm/commit/5537156)), closes [#20](https://github.com/B4nan/mikro-orm/issues/20)
* **core**: support wrapped query with operator in QueryBuilder ([8a967b4](https://github.com/B4nan/mikro-orm/commit/8a967b4))
* **drivers**: add support for **PostgreSQL** ([edb6eec](https://github.com/B4nan/mikro-orm/commit/edb6eec)), closes [#17](https://github.com/B4nan/mikro-orm/issues/17)
* **drivers**: allow choosing driver via new `type` option ([9e765aa](https://github.com/B4nan/mikro-orm/commit/9e765aa))
* **drivers**: allow ordering of 1:M collections ([8cfb62d](https://github.com/B4nan/mikro-orm/commit/8cfb62d))
* **mongo**: support using native helpers on collections directly ([5d727e9](https://github.com/B4nan/mikro-orm/commit/5d727e9))
* **mongo**: support user and password connection options ([a2d9250](https://github.com/B4nan/mikro-orm/commit/a2d9250))
* **query-builder**: add support for custom query expressions ([#28](https://github.com/B4nan/mikro-orm/pull/28))
* **schema**: add schema generator for SQL ([#26](https://github.com/B4nan/mikro-orm/pull/26))



<a name="2.0.3"></a>
## [2.0.3](https://github.com/B4nan/mikro-orm/compare/v2.0.2...v2.0.3) (2019-03-12)

### Bug Fixes

* allow masking of passwords with special characters ([e2bf26d](https://github.com/B4nan/mikro-orm/commit/e2bf26d))
* do not cache Hydrator as it would have reference to wrong factory ([fd124d5](https://github.com/B4nan/mikro-orm/commit/fd124d5))
* require generic type of ChangeSet (fixes older TS compatibility) ([d8503d7](https://github.com/B4nan/mikro-orm/commit/d8503d7))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/B4nan/mikro-orm/compare/v2.0.1...v2.0.2) (2019-03-10)

### Bug Fixes

* require path in JS entity schema to fix support of entities array ([de63f35](https://github.com/B4nan/mikro-orm/commit/de63f35))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/B4nan/mikro-orm/compare/v2.0.0...v2.0.1) (2019-03-10)

### Bug Fixes

* reorganize imports to fix circular dependency in built JS code ([bf23587](https://github.com/B4nan/mikro-orm/commit/bf23587))

### Features

* introduce `Configuration` object ([5916435](https://github.com/B4nan/mikro-orm/commit/5916435))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/B4nan/mikro-orm/compare/v1.2.3...v2.0.0) (2019-03-09)

### Bug Fixes

* improve hooks - allow changing db properties in beforeCreate/beforeUpdate hooks (closes #5) ([26008a0](https://github.com/B4nan/mikro-orm/commit/26008a0))
* initialize 1:M collection when loading owner from EM ([7c052bc](https://github.com/B4nan/mikro-orm/commit/7c052bc))
* remove index type signature from PropertyOptions interface ([19816ff](https://github.com/B4nan/mikro-orm/commit/19816ff))

### Features

* add support for **MySQL** ([bcf2a65](https://github.com/B4nan/mikro-orm/commit/bcf2a65))
* add support for **SQLite** ([d3adbb4](https://github.com/B4nan/mikro-orm/commit/d3adbb4))
* add support for **vanilla JS** ([1a38f2f](https://github.com/B4nan/mikro-orm/commit/1a38f2f), [9fc4454](https://github.com/B4nan/mikro-orm/commit/9fc4454), [a8b1d1f](https://github.com/B4nan/mikro-orm/commit/a8b1d1f), [e123d82](https://github.com/B4nan/mikro-orm/commit/e123d82))
* add support for **nested populate** ([28fe1e6](https://github.com/B4nan/mikro-orm/commit/28fe1e6))
* add support for WHERE LIKE clauses in SQL drivers via native regexps ([2ad681e](https://github.com/B4nan/mikro-orm/commit/2ad681e))
* add support for different naming of entity files (e.g. `book-tag.ts` or `book-tag.model.ts`) ([8fe2816](https://github.com/B4nan/mikro-orm/commit/8fe2816))
* add basic transactions api to EM ([88872ea](https://github.com/B4nan/mikro-orm/commit/88872ea))
* add NamingStrategy support ([5dd2c65](https://github.com/B4nan/mikro-orm/commit/5dd2c65), [e0d1e30](https://github.com/B4nan/mikro-orm/commit/e0d1e30))
* add persistAndFlush() and persistLater() methods ([3b1ff7a](https://github.com/B4nan/mikro-orm/commit/3b1ff7a))
* add possibility to disable auto-flush globally ([39ae0ec](https://github.com/B4nan/mikro-orm/commit/39ae0ec))
* allow async methods in hooks ([9722e75](https://github.com/B4nan/mikro-orm/commit/9722e75))
* allow passing array of entities via `entities` option ([26093f9](https://github.com/B4nan/mikro-orm/commit/26093f9))
* allow passing entity class instead of string name in EM methods (CRUD, getRepository, ...) ([86acead](https://github.com/B4nan/mikro-orm/commit/86acead))
* allow setting custom base repository globally ([9ad19f2](https://github.com/B4nan/mikro-orm/commit/9ad19f2))
* allow usage **without `BaseEntity`** ([af352f7](https://github.com/B4nan/mikro-orm/commit/af352f7))
* allow using options object in EntityManager.find() ([e5abcfd](https://github.com/B4nan/mikro-orm/commit/e5abcfd))
* implement **cascade persist and remove** ([7836626](https://github.com/B4nan/mikro-orm/commit/7836626))
* implement metadata caching to JSON files ([d958e4d](https://github.com/B4nan/mikro-orm/commit/d958e4d))
* improve `Collection` definition - only owner reference is now required ([49224cc](https://github.com/B4nan/mikro-orm/commit/49224cc))
* improve internal typings, enable noImplicitAny and strict null checks ([1a5e32d](https://github.com/B4nan/mikro-orm/commit/1a5e32d), [271bffb](https://github.com/B4nan/mikro-orm/commit/271bffb))
* read m:1 referenced type via reflection, do not require its definition ([5cbb29a](https://github.com/B4nan/mikro-orm/commit/5cbb29a))
* run all queries in transaction when flushing ([8c233c0](https://github.com/B4nan/mikro-orm/commit/8c233c0))
* validate each entity after discovery ([06b432e](https://github.com/B4nan/mikro-orm/commit/06b432e))

### BREAKING CHANGES

* **introduced new layer of drivers**, require [manual installation of underlying db driver](https://b4nan.github.io/mikro-orm/installation/)
* **refactor entity definition**, remove `BaseEntity`, require [merging with `IEntity` interface and defining @PrimaryKey](https://b4nan.github.io/mikro-orm/defining-entities/)
* change default key in Collection#getIdentifiers() to `id` as that one is required ([1f16ef9](https://github.com/B4nan/mikro-orm/commit/1f16ef9))
* remove identity map API from entity manager, use unit of work directly ([b27326c](https://github.com/B4nan/mikro-orm/commit/b27326c))
