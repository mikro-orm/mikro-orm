# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

* **core:** update to TypeScript 4.8 and improve `EntityDTO` type ([#3389](https://github.com/mikro-orm/mikro-orm/issues/3389)) ([f2957fb](https://github.com/mikro-orm/mikro-orm/commit/f2957fb14141294cfdffebf6cce6eaa937538cfb))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/seeder





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)


### Bug Fixes

* **seeder:** fs-extra dep ([#3268](https://github.com/mikro-orm/mikro-orm/issues/3268)) ([972e5ba](https://github.com/mikro-orm/mikro-orm/commit/972e5bac8d679303422a07a19b07a352529c4ff6))





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)

**Note:** Version bump only for package @mikro-orm/seeder





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)


### Bug Fixes

* **seeder:** explicitly flush forks when calling `Seeder.call()` ([c8ece7c](https://github.com/mikro-orm/mikro-orm/commit/c8ece7cd2b1c5b3972e0375d7c941196e6b57031)), closes [#2998](https://github.com/mikro-orm/mikro-orm/issues/2998)
* **seeder:** fix type of Factory methods ([#3064](https://github.com/mikro-orm/mikro-orm/issues/3064)) ([06e88e7](https://github.com/mikro-orm/mikro-orm/commit/06e88e72d3a4393190fe46c8de9578c7f3ff2812))


### Features

* **seeder:** created shared context when calling other seeders ([6fa04ae](https://github.com/mikro-orm/mikro-orm/commit/6fa04ae4d98756544d9215cd62863707158193ba)), closes [#3022](https://github.com/mikro-orm/mikro-orm/issues/3022)





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)

**Note:** Version bump only for package @mikro-orm/seeder





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)

**Note:** Version bump only for package @mikro-orm/seeder





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)

**Note:** Version bump only for package @mikro-orm/seeder





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
