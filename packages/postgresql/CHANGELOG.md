# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)


### Bug Fixes

* **schema:** escape table/column comments ([fff1581](https://github.com/mikro-orm/mikro-orm/commit/fff1581d7ff8f2ab5014e57d14c3938e120eb272)), closes [#2805](https://github.com/mikro-orm/mikro-orm/issues/2805)





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **postgres:** consider int8 as numeric when inferring autoincrement value ([64bc99d](https://github.com/mikro-orm/mikro-orm/commit/64bc99d3ddb2293dbf4a3cb70aa22e16ac813b2d)), closes [#2791](https://github.com/mikro-orm/mikro-orm/issues/2791)





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)


### Bug Fixes

* **postgres:** do not ignore custom PK constraint names ([3201ef7](https://github.com/mikro-orm/mikro-orm/commit/3201ef7b2b2f4ea745f946da0966da9f94fd2cc8)), closes [#2762](https://github.com/mikro-orm/mikro-orm/issues/2762)





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/postgresql





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **core:** allow empty strings in postgres arrays ([#2680](https://github.com/mikro-orm/mikro-orm/issues/2680)) ([5a33722](https://github.com/mikro-orm/mikro-orm/commit/5a3372265556a4d9acfeec8ae52f7b6aab9307af))
* **core:** declare peer dependencies on driver packages ([1873e8c](https://github.com/mikro-orm/mikro-orm/commit/1873e8c4b9b5b9cb5979604f529ddd0cc6717042)), closes [#2110](https://github.com/mikro-orm/mikro-orm/issues/2110)
* **postgres:** fix runtime support for native pg enum arrays ([#2584](https://github.com/mikro-orm/mikro-orm/issues/2584)) ([fcdb9b0](https://github.com/mikro-orm/mikro-orm/commit/fcdb9b02b2d2f85f858ec64d8590e8d984a85f08))
* **postgres:** limit index names to 64 characters ([48c105a](https://github.com/mikro-orm/mikro-orm/commit/48c105a1d5705a0ec42b3a017790ab8537ec6114)), closes [#1915](https://github.com/mikro-orm/mikro-orm/issues/1915)
* **schema:** improve diffing of default values for strings and dates ([d4ac638](https://github.com/mikro-orm/mikro-orm/commit/d4ac6385aa84208732f144e6bd9f68e8cf5c6697)), closes [#2385](https://github.com/mikro-orm/mikro-orm/issues/2385)
* **sql:** split `$and` branches when auto joining to-many relations ([70c795a](https://github.com/mikro-orm/mikro-orm/commit/70c795ad19e83109f70c1b53579056e450a512e2)), closes [#2677](https://github.com/mikro-orm/mikro-orm/issues/2677)


### Features

* **core:** add custom table check constraint support for postgres ([#2688](https://github.com/mikro-orm/mikro-orm/issues/2688)) ([89aca5f](https://github.com/mikro-orm/mikro-orm/commit/89aca5f41cf85bad8bbea51d0c1f9983ec01e903))
* **core:** add index/key name to naming strategy ([a842e3e](https://github.com/mikro-orm/mikro-orm/commit/a842e3eea80349777ccdf7b8840b3c1860e9607f))
* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** add support for multiple schemas (including UoW) ([#2296](https://github.com/mikro-orm/mikro-orm/issues/2296)) ([d64d100](https://github.com/mikro-orm/mikro-orm/commit/d64d100b0ef6fd3335d234aeac1ffa9b34b8f7ea)), closes [#2074](https://github.com/mikro-orm/mikro-orm/issues/2074)
* **core:** add support for polymorphic embeddables ([#2426](https://github.com/mikro-orm/mikro-orm/issues/2426)) ([7b7c3a2](https://github.com/mikro-orm/mikro-orm/commit/7b7c3a22fe517e13a1a610f142c59e758acd3c3f)), closes [#1165](https://github.com/mikro-orm/mikro-orm/issues/1165)
* **core:** allow using short lived tokens in config ([4499838](https://github.com/mikro-orm/mikro-orm/commit/44998383b21a3aef943a922a3e75426369178f35)), closes [#1818](https://github.com/mikro-orm/mikro-orm/issues/1818)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **embeddables:** allow using m:1 properties inside embeddables ([#1948](https://github.com/mikro-orm/mikro-orm/issues/1948)) ([ffca73e](https://github.com/mikro-orm/mikro-orm/commit/ffca73ecf3ecf405dee3042ad0ab60848721ab7b))
* **entity-generator:** add enum generation support ([#2608](https://github.com/mikro-orm/mikro-orm/issues/2608)) ([1e0b411](https://github.com/mikro-orm/mikro-orm/commit/1e0b411dad3cb0ebb456b34e1bcac9a71f059c48))
* **schema:** allow disabling foreign key constraints ([fcdb236](https://github.com/mikro-orm/mikro-orm/commit/fcdb236eb8112ebaed3450892f51fd469902ac62)), closes [#2548](https://github.com/mikro-orm/mikro-orm/issues/2548)
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))


### BREAKING CHANGES

* **core:** Embeddable instances are now created via `EntityFactory` and they respect the
`forceEntityConstructor` configuration. Due to this we need to have EM instance
when assigning to embedded properties. 

Using `em.assign()` should be preferred to get around this.

Deep assigning of child entities now works by default based on the presence of PKs in the payload.
This behaviour can be disable via updateByPrimaryKey: false in the assign options.

`mergeObjects` option is now enabled by default.
* **core:** `em.getReference()` now has options parameter.





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/postgresql





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)


### Features

* **core:** allow querying by JSON properties ([#1384](https://github.com/mikro-orm/mikro-orm/issues/1384)) ([69c2493](https://github.com/mikro-orm/mikro-orm/commit/69c24934db478eb07d9c88541527b7be40a26483)), closes [#1359](https://github.com/mikro-orm/mikro-orm/issues/1359) [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/postgresql





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)


### Features

* **core:** add support for nested embedddables ([#1311](https://github.com/mikro-orm/mikro-orm/issues/1311)) ([aee2abd](https://github.com/mikro-orm/mikro-orm/commit/aee2abd4cdb9f8ded0920f2786fd80a32cef41f7)), closes [#1017](https://github.com/mikro-orm/mikro-orm/issues/1017)





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)


### Bug Fixes

* **schema:** fix diffing tables in other than default schema ([429d832](https://github.com/mikro-orm/mikro-orm/commit/429d8321d4c9962082af7cf4b2284204342a285b)), closes [#1142](https://github.com/mikro-orm/mikro-orm/issues/1142) [#1143](https://github.com/mikro-orm/mikro-orm/issues/1143)





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)


### Bug Fixes

* **postgres:** use `->>` to search in object embeddables ([78c9373](https://github.com/mikro-orm/mikro-orm/commit/78c93738ba875eb7195460fe6503da784db038a1)), closes [#1091](https://github.com/mikro-orm/mikro-orm/issues/1091)





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)
* **sql:** do not batch update unique properties ([87b722a](https://github.com/mikro-orm/mikro-orm/commit/87b722a792e8a49c4ffa52e5b21444748c48b224)), closes [#1025](https://github.com/mikro-orm/mikro-orm/issues/1025)
* **sql:** inline array parameters when formatting queries ([a21735f](https://github.com/mikro-orm/mikro-orm/commit/a21735f85f3a9de533212151bee8df55810b25b1)), closes [#1021](https://github.com/mikro-orm/mikro-orm/issues/1021)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/postgresql





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)


### Bug Fixes

* **postgres:** escape question marks in parameters ([813e3cd](https://github.com/mikro-orm/mikro-orm/commit/813e3cd3fad2f1975c0158bf7265e7f58d1437b5)), closes [#920](https://github.com/mikro-orm/mikro-orm/issues/920)





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Bug Fixes

* **postgres:** do not convert date type columns to Date js objects ([2cfb145](https://github.com/mikro-orm/mikro-orm/commit/2cfb14594608f9de89a68464afc838d0925eb68d)), closes [#864](https://github.com/mikro-orm/mikro-orm/issues/864)
* **sqlite:** rework schema support for composite keys in sqlite ([82e2efd](https://github.com/mikro-orm/mikro-orm/commit/82e2efd2d285c507c9205bffced4a9afa920f259)), closes [#887](https://github.com/mikro-orm/mikro-orm/issues/887)


### Performance Improvements

* **core:** interpolate query parameters at ORM level ([742b813](https://github.com/mikro-orm/mikro-orm/commit/742b8131ba7d0acec2cca3f289237fd0e757baa5)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use bulk inserts in all drivers ([10f2e55](https://github.com/mikro-orm/mikro-orm/commit/10f2e55f6710822c9fca272b01c278ff80065096)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use JIT compilation for snapshotting entities ([5612759](https://github.com/mikro-orm/mikro-orm/commit/561275918c0da27e612084c1c0a7b8bd473ef081)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)


### Performance Improvements

* **core:** use batch inserts in UoW (postgres & mongodb) ([#865](https://github.com/mikro-orm/mikro-orm/issues/865)) ([54ad928](https://github.com/mikro-orm/mikro-orm/commit/54ad928aab44d0c42e3f7b306eef0c07ed65dfc1)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)


### Bug Fixes

* **schema:** defer creating of composite indexes + implement diffing ([f57b457](https://github.com/mikro-orm/mikro-orm/commit/f57b4571feb2aea7c955c5f7eb7470530133271e)), closes [#850](https://github.com/mikro-orm/mikro-orm/issues/850)





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/postgresql





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)

**Note:** Version bump only for package @mikro-orm/postgresql
