# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)


### Bug Fixes

* **schema:** escape table/column comments ([fff1581](https://github.com/mikro-orm/mikro-orm/commit/fff1581d7ff8f2ab5014e57d14c3938e120eb272)), closes [#2805](https://github.com/mikro-orm/mikro-orm/issues/2805)





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)

**Note:** Version bump only for package @mikro-orm/mariadb





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/mariadb





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/mariadb





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **core:** declare peer dependencies on driver packages ([1873e8c](https://github.com/mikro-orm/mikro-orm/commit/1873e8c4b9b5b9cb5979604f529ddd0cc6717042)), closes [#2110](https://github.com/mikro-orm/mikro-orm/issues/2110)
* **schema:** improve diffing of default values for strings and dates ([d4ac638](https://github.com/mikro-orm/mikro-orm/commit/d4ac6385aa84208732f144e6bd9f68e8cf5c6697)), closes [#2385](https://github.com/mikro-orm/mikro-orm/issues/2385)


### Code Refactoring

* use options parameters in `IDatabaseDriver` ([#2204](https://github.com/mikro-orm/mikro-orm/issues/2204)) ([9a32ac0](https://github.com/mikro-orm/mikro-orm/commit/9a32ac0655f7ec701399250b88605cc5f5fc3b2c))


### Features

* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **typings:** make `em.create()` and other methods strict ([#1718](https://github.com/mikro-orm/mikro-orm/issues/1718)) ([e8b7119](https://github.com/mikro-orm/mikro-orm/commit/e8b7119eca0df7d686a7d3d91bfc17b74baaeea1)), closes [#1456](https://github.com/mikro-orm/mikro-orm/issues/1456)


### BREAKING CHANGES

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

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/mariadb





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/mariadb





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)

**Note:** Version bump only for package @mikro-orm/mariadb





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/mariadb





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)

**Note:** Version bump only for package @mikro-orm/mariadb





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Performance Improvements

* **core:** interpolate query parameters at ORM level ([742b813](https://github.com/mikro-orm/mikro-orm/commit/742b8131ba7d0acec2cca3f289237fd0e757baa5)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use dedicated identity maps for each entity ([84667f9](https://github.com/mikro-orm/mikro-orm/commit/84667f9e97323e4b054db2c0c70939ab0ca86c86)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/mariadb





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)

**Note:** Version bump only for package @mikro-orm/mariadb
