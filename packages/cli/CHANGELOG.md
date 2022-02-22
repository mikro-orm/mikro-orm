# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/cli





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **core:** revert to `require()` when getting ORM version to fix webpack support ([6cfb526](https://github.com/mikro-orm/mikro-orm/commit/6cfb5269696a9c0991198b238667c40f0dae2250)), closes [#2799](https://github.com/mikro-orm/mikro-orm/issues/2799)


### Features

* add better-sqlite driver ([#2792](https://github.com/mikro-orm/mikro-orm/issues/2792)) ([1b39d66](https://github.com/mikro-orm/mikro-orm/commit/1b39d6687fc2db64e85a45f6a964cf1776a374aa))





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/cli





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)


### Bug Fixes

* **core:** use `createRequire` instead of dynamic import for JSON files ([f567d2d](https://github.com/mikro-orm/mikro-orm/commit/f567d2d073854163e6de8bddbf8e1a256a6fcaed)), closes [#2738](https://github.com/mikro-orm/mikro-orm/issues/2738)


### Features

* **seeder:** refactor seeder to support running compiled files ([#2751](https://github.com/mikro-orm/mikro-orm/issues/2751)) ([8d9c4c0](https://github.com/mikro-orm/mikro-orm/commit/8d9c4c0454d06920cd59647f1f2ea4070ea2bd5a)), closes [#2728](https://github.com/mikro-orm/mikro-orm/issues/2728)





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **cli:** validate configuration in CLI cache commands ([#2146](https://github.com/mikro-orm/mikro-orm/issues/2146)) ([544583b](https://github.com/mikro-orm/mikro-orm/commit/544583b3158ff408eab3982b63585adc9a637b5a)), closes [#2145](https://github.com/mikro-orm/mikro-orm/issues/2145)
* **core:** declare peer dependencies on driver packages ([1873e8c](https://github.com/mikro-orm/mikro-orm/commit/1873e8c4b9b5b9cb5979604f529ddd0cc6717042)), closes [#2110](https://github.com/mikro-orm/mikro-orm/issues/2110)
* **migrations:** clear the migrations table in `migration:fresh` ([63eb4e6](https://github.com/mikro-orm/mikro-orm/commit/63eb4e64d1de06ffc3fdfff06e937eafb926c86b)), closes [#2698](https://github.com/mikro-orm/mikro-orm/issues/2698)


### Code Refactoring

* **core:** use options parameters on `SchemaGenerator` ([7e48c5d](https://github.com/mikro-orm/mikro-orm/commit/7e48c5d2487d0f67838927f42efdcd4580a86fd0))


### Features

* **cli:** add `database:create` command ([#1778](https://github.com/mikro-orm/mikro-orm/issues/1778)) ([7e9d97d](https://github.com/mikro-orm/mikro-orm/commit/7e9d97d06c7f07db93a3b033909bda21594e7ac6)), closes [#1757](https://github.com/mikro-orm/mikro-orm/issues/1757)
* **cli:** validate CLI package is installed locally ([8952149](https://github.com/mikro-orm/mikro-orm/commit/8952149a78be5ba527ae1614cb1eb36d6d8d1dd9))
* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** add support for multiple schemas (including UoW) ([#2296](https://github.com/mikro-orm/mikro-orm/issues/2296)) ([d64d100](https://github.com/mikro-orm/mikro-orm/commit/d64d100b0ef6fd3335d234aeac1ffa9b34b8f7ea)), closes [#2074](https://github.com/mikro-orm/mikro-orm/issues/2074)
* **core:** allow providing custom `Logger` instance ([#2443](https://github.com/mikro-orm/mikro-orm/issues/2443)) ([c7a75e0](https://github.com/mikro-orm/mikro-orm/commit/c7a75e00de01b85ece282cd64429a57a49e5842d))
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **entity-generator:** allow specifying schema ([beb2993](https://github.com/mikro-orm/mikro-orm/commit/beb299383c647f9f2d7431e177659d299fb0f041)), closes [#1301](https://github.com/mikro-orm/mikro-orm/issues/1301)
* **seeder:** add seeder package ([#929](https://github.com/mikro-orm/mikro-orm/issues/929)) ([2b86e22](https://github.com/mikro-orm/mikro-orm/commit/2b86e22eb061060ee2c67a85741b99c1ddcac9c0)), closes [#251](https://github.com/mikro-orm/mikro-orm/issues/251)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))


### BREAKING CHANGES

* **core:** `em.getReference()` now has options parameter.
* **core:** `SchemaGenerator` API changed, boolean parameters are now removed
in favour of options objects

```ts
interface SchemaGenerator {
  generate(): Promise<string>;
  createSchema(options?: { wrap?: boolean }): Promise<void>;
  ensureDatabase(): Promise<void>;
  getCreateSchemaSQL(options?: { wrap?: boolean }): Promise<string>;
  dropSchema(options?: { wrap?: boolean; dropMigrationsTable?: boolean; dropDb?: boolean }): Promise<void>;
  getDropSchemaSQL(options?: { wrap?: boolean; dropMigrationsTable?: boolean }): Promise<string>;
  updateSchema(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean }): Promise<void>;
  getUpdateSchemaSQL(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean }): Promise<string>;
  createDatabase(name: string): Promise<void>;
  dropDatabase(name: string): Promise<void>;
  execute(sql: string, options?: { wrap?: boolean }): Promise<void>;
}
```





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/cli





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/cli





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)


### Features

* **core:** infer configuration from environment variables ([#1498](https://github.com/mikro-orm/mikro-orm/issues/1498)) ([1ff07a7](https://github.com/mikro-orm/mikro-orm/commit/1ff07a76b2a5e6c9c958586e4bb7a6a2c270e1ab)), closes [#1472](https://github.com/mikro-orm/mikro-orm/issues/1472)





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)


### Bug Fixes

* **cli:** fix debug command with file globs ([5ec60e2](https://github.com/mikro-orm/mikro-orm/commit/5ec60e20db8d13ed44d1b3f129fd48f3362cb893)), closes [#1465](https://github.com/mikro-orm/mikro-orm/issues/1465)





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/cli





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)

**Note:** Version bump only for package @mikro-orm/cli





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/cli





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)

**Note:** Version bump only for package @mikro-orm/cli





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/cli





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)


### Bug Fixes

* **cli:** print both `entities` and `entitiesTs` in debug command ([90b85e4](https://github.com/mikro-orm/mikro-orm/commit/90b85e4a540bf0a385ba34c4ca7ff0859039abcf)), closes [#1139](https://github.com/mikro-orm/mikro-orm/issues/1139)





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/cli





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)

**Note:** Version bump only for package @mikro-orm/cli





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **cli:** add missing peer dependencies ([#1057](https://github.com/mikro-orm/mikro-orm/issues/1057)) ([83bd6b3](https://github.com/mikro-orm/mikro-orm/commit/83bd6b3ce0fe47cb0d1052ec200ecc49fe3728b5))
* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/cli





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/cli





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/cli





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)

**Note:** Version bump only for package @mikro-orm/cli





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)

**Note:** Version bump only for package @mikro-orm/cli





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/cli





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)


### Bug Fixes

* **core:** refactor internals to reduce number of cycles ([#830](https://github.com/mikro-orm/mikro-orm/issues/830)) ([3994767](https://github.com/mikro-orm/mikro-orm/commit/3994767d93ef119d229bedffa77eb2ea3af5c775))
