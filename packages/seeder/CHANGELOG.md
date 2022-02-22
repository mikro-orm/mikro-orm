# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)


### Bug Fixes

* **seeder:** declare missing dependency on globby ([0599032](https://github.com/mikro-orm/mikro-orm/commit/05990328ccad8b0e8a37b0eb323a89d1df876976))





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)


### Bug Fixes

* **seeder:** fix Factory type for entity with constructor params ([#2745](https://github.com/mikro-orm/mikro-orm/issues/2745)) ([8b7b977](https://github.com/mikro-orm/mikro-orm/commit/8b7b97729935d9fe35f8b57cd9e64dddc8fa86e6))


### Features

* **seeder:** refactor seeder to support running compiled files ([#2751](https://github.com/mikro-orm/mikro-orm/issues/2751)) ([8d9c4c0](https://github.com/mikro-orm/mikro-orm/commit/8d9c4c0454d06920cd59647f1f2ea4070ea2bd5a)), closes [#2728](https://github.com/mikro-orm/mikro-orm/issues/2728)





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Features

* **core:** add `persistOnCreate` option and enable it for seeder ([f0fec1b](https://github.com/mikro-orm/mikro-orm/commit/f0fec1b917a228869482bf781d256ab68c0b138c)), closes [#2629](https://github.com/mikro-orm/mikro-orm/issues/2629)
* **core:** make `em.create()` respect required properties ([2385f1d](https://github.com/mikro-orm/mikro-orm/commit/2385f1d18b1b5235750fc5f29b4d51fe04aca7b8))
* **seeder:** add seeder package ([#929](https://github.com/mikro-orm/mikro-orm/issues/929)) ([2b86e22](https://github.com/mikro-orm/mikro-orm/commit/2b86e22eb061060ee2c67a85741b99c1ddcac9c0)), closes [#251](https://github.com/mikro-orm/mikro-orm/issues/251)


### BREAKING CHANGES

* **core:** `em.create()` will now require you to pass all non-optional properties. Some properties
might be defined as required for TS but we have a default value for them (either runtime,
or database one) - for such we can use `OptionalProps` symbol to specify which properties
should be considered as optional.
