# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.3.4](https://github.com/mikro-orm/mikro-orm/compare/v6.3.3...v6.3.4) (2024-08-06)


### Bug Fixes

* **mssql:** convert tuple comparison queries to simple `and/or` conditions ([#5906](https://github.com/mikro-orm/mikro-orm/issues/5906)) ([c3c3519](https://github.com/mikro-orm/mikro-orm/commit/c3c3519db72ab15810fcb65d764541ab1fcc0130))





## [6.3.3](https://github.com/mikro-orm/mikro-orm/compare/v6.3.2...v6.3.3) (2024-08-03)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.3.2](https://github.com/mikro-orm/mikro-orm/compare/v6.3.1...v6.3.2) (2024-08-01)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.3.1](https://github.com/mikro-orm/mikro-orm/compare/v6.3.0...v6.3.1) (2024-07-25)


### Bug Fixes

* **mssql:** do not escape charecters that don't need escaping ([#5860](https://github.com/mikro-orm/mikro-orm/issues/5860)) ([6730978](https://github.com/mikro-orm/mikro-orm/commit/6730978b6c7003e45ed97f9d2d7c5c0bc9262e26)), closes [mikro-orm#5811](https://github.com/mikro-orm/issues/5811)
* **mssql:** do not escape new line character ([97919ce](https://github.com/mikro-orm/mikro-orm/commit/97919ce479fc5e2e00a3bf24a511ec29a2279d1b)), closes [#5811](https://github.com/mikro-orm/mikro-orm/issues/5811)





# [6.3.0](https://github.com/mikro-orm/mikro-orm/compare/v6.2.9...v6.3.0) (2024-07-18)


### Bug Fixes

* **core:** improve handling of JSON properties to support numeric strings in all drivers ([#5780](https://github.com/mikro-orm/mikro-orm/issues/5780)) ([fc50c5f](https://github.com/mikro-orm/mikro-orm/commit/fc50c5f5f28f0764115631900edac24bc734afa4)), closes [#5773](https://github.com/mikro-orm/mikro-orm/issues/5773)
* **mssql:** add proper support for MSSQL's native "varchar" type ([#5685](https://github.com/mikro-orm/mikro-orm/issues/5685)) ([0b514ce](https://github.com/mikro-orm/mikro-orm/commit/0b514ce7378df21ef414027f993267f2ecbe681a))
* **mssql:** fix handling of non-UTC timezones ([e78696c](https://github.com/mikro-orm/mikro-orm/commit/e78696c548e14be3e00ba5595697816db4c9dd52)), closes [#5695](https://github.com/mikro-orm/mikro-orm/issues/5695)
* **mssql:** only escape strings and unicode strings when necessary ([#5786](https://github.com/mikro-orm/mikro-orm/issues/5786)) ([b4e0914](https://github.com/mikro-orm/mikro-orm/commit/b4e0914772356285bcbb9362a4df2044438b4cd7)), closes [#5811](https://github.com/mikro-orm/mikro-orm/issues/5811)


### Features

* **core:** addz `Platform.getDefaultVarcharLength` and optional `Type.getDefaultLength` ([#5749](https://github.com/mikro-orm/mikro-orm/issues/5749)) ([29dcdeb](https://github.com/mikro-orm/mikro-orm/commit/29dcdeb5e4c3f84e43c154fe3eb81a113c6d1470))
* **core:** implement "character" type (DB type "char") ([#5684](https://github.com/mikro-orm/mikro-orm/issues/5684)) ([9fa5fad](https://github.com/mikro-orm/mikro-orm/commit/9fa5fad5e3955cdcdee89aa12c8b3dd4841b2045))
* **query-builder:** infer `Loaded` hint based on `joinAndSelect` calls ([#5482](https://github.com/mikro-orm/mikro-orm/issues/5482)) ([d18da6b](https://github.com/mikro-orm/mikro-orm/commit/d18da6b8cfce84ffaf480a27b869b79efbc70fb6))





## [6.2.9](https://github.com/mikro-orm/mikro-orm/compare/v6.2.8...v6.2.9) (2024-05-31)


### Bug Fixes

* **mssql:** account for quotes in table names ([#5637](https://github.com/mikro-orm/mikro-orm/issues/5637)) ([0343609](https://github.com/mikro-orm/mikro-orm/commit/0343609c3e99d1fe5e4024a7afe0aaa2b2d6d980))
* **mssql:** fix creating migrations due to a missing helper method ([#5644](https://github.com/mikro-orm/mikro-orm/issues/5644)) ([90e27c2](https://github.com/mikro-orm/mikro-orm/commit/90e27c275d7db46269ee721e049dcfe09b274abe)), closes [#5633](https://github.com/mikro-orm/mikro-orm/issues/5633)
* **mssql:** fix ensuring the database exists on older SQL Server versions ([f0a5790](https://github.com/mikro-orm/mikro-orm/commit/f0a5790de0b08978983a3af82122e0f5045531dc)), closes [#5638](https://github.com/mikro-orm/mikro-orm/issues/5638)





## [6.2.8](https://github.com/mikro-orm/mikro-orm/compare/v6.2.7...v6.2.8) (2024-05-21)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.2.7](https://github.com/mikro-orm/mikro-orm/compare/v6.2.6...v6.2.7) (2024-05-18)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.2.6](https://github.com/mikro-orm/mikro-orm/compare/v6.2.5...v6.2.6) (2024-05-14)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.2.5](https://github.com/mikro-orm/mikro-orm/compare/v6.2.4...v6.2.5) (2024-05-05)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.2.4](https://github.com/mikro-orm/mikro-orm/compare/v6.2.3...v6.2.4) (2024-05-02)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.2.3](https://github.com/mikro-orm/mikro-orm/compare/v6.2.2...v6.2.3) (2024-04-24)

**Note:** Version bump only for package @mikro-orm/mssql





## [6.2.2](https://github.com/mikro-orm/mikro-orm/compare/v6.2.1...v6.2.2) (2024-04-20)


### Bug Fixes

* **mssql:** declare `import` types explicitly ([02494bf](https://github.com/mikro-orm/mikro-orm/commit/02494bf129e15261ba17218288a840120fedb089)), closes [#5462](https://github.com/mikro-orm/mikro-orm/issues/5462)





## [6.2.1](https://github.com/mikro-orm/mikro-orm/compare/v6.2.0...v6.2.1) (2024-04-12)


### Bug Fixes

* **mssql:** support instance names in `host` ([dc7dc4c](https://github.com/mikro-orm/mikro-orm/commit/dc7dc4cecfc8e3c426ce8c679365c8efa7705370)), closes [#5441](https://github.com/mikro-orm/mikro-orm/issues/5441)





# [6.2.0](https://github.com/mikro-orm/mikro-orm/compare/v6.1.12...v6.2.0) (2024-04-09)


### Features

* **mssql:** add MS SQL Server driver ([#1375](https://github.com/mikro-orm/mikro-orm/issues/1375)) ([eeaad45](https://github.com/mikro-orm/mikro-orm/commit/eeaad45a60b3ef4732d5ba9eafc8719998e52181)), closes [#771](https://github.com/mikro-orm/mikro-orm/issues/771)
