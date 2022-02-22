# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/sqlite





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **sqlite:** respect `autoincrement: false` in schema diffing ([b39b6ad](https://github.com/mikro-orm/mikro-orm/commit/b39b6ada0e276a21c3089558a996092174b546fc)), closes [#2800](https://github.com/mikro-orm/mikro-orm/issues/2800)





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/sqlite





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/sqlite





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **core:** declare peer dependencies on driver packages ([1873e8c](https://github.com/mikro-orm/mikro-orm/commit/1873e8c4b9b5b9cb5979604f529ddd0cc6717042)), closes [#2110](https://github.com/mikro-orm/mikro-orm/issues/2110)
* **core:** fix transaction context in nested transactions ([091e60d](https://github.com/mikro-orm/mikro-orm/commit/091e60d5636959477176d851ef112ab53f1c6609)), closes [#1910](https://github.com/mikro-orm/mikro-orm/issues/1910)
* **schema:** improve diffing of default values for strings and dates ([d4ac638](https://github.com/mikro-orm/mikro-orm/commit/d4ac6385aa84208732f144e6bd9f68e8cf5c6697)), closes [#2385](https://github.com/mikro-orm/mikro-orm/issues/2385)
* **sqlite:** patch dialect only once ([ea6a764](https://github.com/mikro-orm/mikro-orm/commit/ea6a764d74eebf070be8d24efc1664f5dace940f)), closes [#2422](https://github.com/mikro-orm/mikro-orm/issues/2422)


### Code Refactoring

* use options parameters in `IDatabaseDriver` ([#2204](https://github.com/mikro-orm/mikro-orm/issues/2204)) ([9a32ac0](https://github.com/mikro-orm/mikro-orm/commit/9a32ac0655f7ec701399250b88605cc5f5fc3b2c))


### Features

* **core:** add custom table check constraint support for postgres ([#2688](https://github.com/mikro-orm/mikro-orm/issues/2688)) ([89aca5f](https://github.com/mikro-orm/mikro-orm/commit/89aca5f41cf85bad8bbea51d0c1f9983ec01e903))
* **core:** add index/key name to naming strategy ([a842e3e](https://github.com/mikro-orm/mikro-orm/commit/a842e3eea80349777ccdf7b8840b3c1860e9607f))
* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** add support for polymorphic embeddables ([#2426](https://github.com/mikro-orm/mikro-orm/issues/2426)) ([7b7c3a2](https://github.com/mikro-orm/mikro-orm/commit/7b7c3a22fe517e13a1a610f142c59e758acd3c3f)), closes [#1165](https://github.com/mikro-orm/mikro-orm/issues/1165)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **embeddables:** allow using m:1 properties inside embeddables ([#1948](https://github.com/mikro-orm/mikro-orm/issues/1948)) ([ffca73e](https://github.com/mikro-orm/mikro-orm/commit/ffca73ecf3ecf405dee3042ad0ab60848721ab7b))
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))
* **typings:** make `em.create()` and other methods strict ([#1718](https://github.com/mikro-orm/mikro-orm/issues/1718)) ([e8b7119](https://github.com/mikro-orm/mikro-orm/commit/e8b7119eca0df7d686a7d3d91bfc17b74baaeea1)), closes [#1456](https://github.com/mikro-orm/mikro-orm/issues/1456)


### BREAKING CHANGES

* **core:** Embeddable instances are now created via `EntityFactory` and they respect the
`forceEntityConstructor` configuration. Due to this we need to have EM instance
when assigning to embedded properties. 

Using `em.assign()` should be preferred to get around this.

Deep assigning of child entities now works by default based on the presence of PKs in the payload.
This behaviour can be disable via updateByPrimaryKey: false in the assign options.

`mergeObjects` option is now enabled by default.
* Most of the methods on IDatabaseDriver interface now have different signature.
* **typings:** Some methods are now strictly typed, so previously fine usages might be restricted on TS level.
To get around those, we might either cast as `any`, provide the generic `T` type as `any`, or
use `expr` helper.

```ts
em.create(User, { someNotDefinedProp: 123 }); // throws if someNotDefinedProp not on the User
em.create(User, { [expr('someNotDefinedProp')]: 123 }); // works, using expr
em.create<any>(User, { someNotDefinedProp: 123 }); // works, using type cast
em.create(User, { someNotDefinedProp: 123 } as any); // works, using type cast
```





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)


### Bug Fixes

* **sqlite:** patch dialect only once ([a7fe71e](https://github.com/mikro-orm/mikro-orm/commit/a7fe71e032fd819949fd3e2bd0bd7b1a9d073a6d)), closes [#2422](https://github.com/mikro-orm/mikro-orm/issues/2422)





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)


### Bug Fixes

* **core:** fix transaction context in nested transactions ([d88dd8b](https://github.com/mikro-orm/mikro-orm/commit/d88dd8bbc7dc3fad623a7ee37031cf534a955112)), closes [#1910](https://github.com/mikro-orm/mikro-orm/issues/1910)





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/sqlite





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)


### Features

* **core:** allow querying by JSON properties ([#1384](https://github.com/mikro-orm/mikro-orm/issues/1384)) ([69c2493](https://github.com/mikro-orm/mikro-orm/commit/69c24934db478eb07d9c88541527b7be40a26483)), closes [#1359](https://github.com/mikro-orm/mikro-orm/issues/1359) [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/sqlite





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)


### Bug Fixes

* **sqlite:** fix querying by 1:1 relation with composite PK ([0da6347](https://github.com/mikro-orm/mikro-orm/commit/0da63476f4d0226d0d4bcee793ef143f6ecf475b)), closes [#1157](https://github.com/mikro-orm/mikro-orm/issues/1157)





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)


### Bug Fixes

* **core:** fix comparison of object properties and bigints ([2119a65](https://github.com/mikro-orm/mikro-orm/commit/2119a65f29dcb583a3a28e8dadb3c68240634632)), closes [#1117](https://github.com/mikro-orm/mikro-orm/issues/1117)





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)

**Note:** Version bump only for package @mikro-orm/sqlite





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)
* **sql:** inline array parameters when formatting queries ([a21735f](https://github.com/mikro-orm/mikro-orm/commit/a21735f85f3a9de533212151bee8df55810b25b1)), closes [#1021](https://github.com/mikro-orm/mikro-orm/issues/1021)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/sqlite





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)

**Note:** Version bump only for package @mikro-orm/sqlite





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Bug Fixes

* **sqlite:** rework schema support for composite keys in sqlite ([82e2efd](https://github.com/mikro-orm/mikro-orm/commit/82e2efd2d285c507c9205bffced4a9afa920f259)), closes [#887](https://github.com/mikro-orm/mikro-orm/issues/887)


### Performance Improvements

* **core:** interpolate query parameters at ORM level ([742b813](https://github.com/mikro-orm/mikro-orm/commit/742b8131ba7d0acec2cca3f289237fd0e757baa5)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use bulk inserts in all drivers ([10f2e55](https://github.com/mikro-orm/mikro-orm/commit/10f2e55f6710822c9fca272b01c278ff80065096)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use dedicated identity maps for each entity ([84667f9](https://github.com/mikro-orm/mikro-orm/commit/84667f9e97323e4b054db2c0c70939ab0ca86c86)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)


### Performance Improvements

* **core:** use batch inserts in UoW (postgres & mongodb) ([#865](https://github.com/mikro-orm/mikro-orm/issues/865)) ([54ad928](https://github.com/mikro-orm/mikro-orm/commit/54ad928aab44d0c42e3f7b306eef0c07ed65dfc1)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)


### Bug Fixes

* **schema:** defer creating of composite indexes + implement diffing ([f57b457](https://github.com/mikro-orm/mikro-orm/commit/f57b4571feb2aea7c955c5f7eb7470530133271e)), closes [#850](https://github.com/mikro-orm/mikro-orm/issues/850)





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)


### Performance Improvements

* **core:** create the helper instance early ([f4f90eb](https://github.com/mikro-orm/mikro-orm/commit/f4f90ebe7d540164c2959c554a5245dda712b612))
* **core:** do not use `em.merge()` internally ([6a1a6d6](https://github.com/mikro-orm/mikro-orm/commit/6a1a6d68b65a20b8f1a78bf644844427f3b2dd1a))





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/sqlite





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)

**Note:** Version bump only for package @mikro-orm/sqlite
