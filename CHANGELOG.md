<a name="2.0.1"></a>
# [2.0.1](https://github.com/B4nan/mikro-orm/compare/v2.0.0...v2.0.1) (2019-03-10)

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
