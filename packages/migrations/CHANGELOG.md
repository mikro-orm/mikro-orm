# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/migrations





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **migrations:** generate snapshot too when using `--initial` ([4857be7](https://github.com/mikro-orm/mikro-orm/commit/4857be73d5f21b7152dcf2e1acd31327d600d37f)), closes [#2800](https://github.com/mikro-orm/mikro-orm/issues/2800)





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/migrations





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/migrations





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **migrations:** respect `baseDir` and allow absolute paths for sqlite `dbName` ([36a3ae5](https://github.com/mikro-orm/mikro-orm/commit/36a3ae5f142a5119d579289381aab284b514f66b)), closes [#2710](https://github.com/mikro-orm/mikro-orm/issues/2710)


### Code Refactoring

* **core:** use options parameters on `SchemaGenerator` ([7e48c5d](https://github.com/mikro-orm/mikro-orm/commit/7e48c5d2487d0f67838927f42efdcd4580a86fd0))
* use options parameters in `IDatabaseDriver` ([#2204](https://github.com/mikro-orm/mikro-orm/issues/2204)) ([9a32ac0](https://github.com/mikro-orm/mikro-orm/commit/9a32ac0655f7ec701399250b88605cc5f5fc3b2c))


### Features

* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** add support for multiple schemas (including UoW) ([#2296](https://github.com/mikro-orm/mikro-orm/issues/2296)) ([d64d100](https://github.com/mikro-orm/mikro-orm/commit/d64d100b0ef6fd3335d234aeac1ffa9b34b8f7ea)), closes [#2074](https://github.com/mikro-orm/mikro-orm/issues/2074)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **migrations:** allow providing custom `MigrationGenerator` ([3cc366b](https://github.com/mikro-orm/mikro-orm/commit/3cc366b7a7e269a2c527edc324695620e8025163)), closes [#1913](https://github.com/mikro-orm/mikro-orm/issues/1913)
* **migrations:** allow using migrations with ES modules ([072f23f](https://github.com/mikro-orm/mikro-orm/commit/072f23fe873c969f77a519ef5b997c30e3246093)), closes [#2631](https://github.com/mikro-orm/mikro-orm/issues/2631)
* **migrations:** ensure the database exists when using migrator ([02dd67c](https://github.com/mikro-orm/mikro-orm/commit/02dd67cc0048aa0d9469e62ccb566b56db8e05a0)), closes [#1757](https://github.com/mikro-orm/mikro-orm/issues/1757)
* **migrations:** store migrations without extensions ([4036716](https://github.com/mikro-orm/mikro-orm/commit/40367166f9e74a042e2f6314f31877f27a15a14d)), closes [#2239](https://github.com/mikro-orm/mikro-orm/issues/2239)
* **migrations:** use snapshots for generating diffs in new migrations ([#1815](https://github.com/mikro-orm/mikro-orm/issues/1815)) ([9c37f61](https://github.com/mikro-orm/mikro-orm/commit/9c37f6141d8723d6c472dfd3557a1d749d344455))
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **sql:** allow setting transaction isolation level ([6ae5fbf](https://github.com/mikro-orm/mikro-orm/commit/6ae5fbf70dd87fe2380b74d83bc8a04bb8f447fe)), closes [#819](https://github.com/mikro-orm/mikro-orm/issues/819)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))


### BREAKING CHANGES

* **core:** `em.getReference()` now has options parameter.
* Most of the methods on IDatabaseDriver interface now have different signature.
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
* **sql:** - `em.transactional()` signature has changed, the parameter is now options object
- `em.begin()` signature has changed, the parameter is now options object





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/migrations





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)


### Bug Fixes

* **migrations:** fix generation of empty migrations ([#1362](https://github.com/mikro-orm/mikro-orm/issues/1362)) ([7ec9f30](https://github.com/mikro-orm/mikro-orm/commit/7ec9f3068709be0664966d18bc6d3ba88ae48b33))





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)

**Note:** Version bump only for package @mikro-orm/migrations





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)


### Bug Fixes

* only create migrations folder if migrationsList is not used ([#941](https://github.com/mikro-orm/mikro-orm/issues/941)) ([1e5c5e8](https://github.com/mikro-orm/mikro-orm/commit/1e5c5e83013894d9546c894e83c5965c5bafd4e5)), closes [#907](https://github.com/mikro-orm/mikro-orm/issues/907)





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/migrations





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)


### Bug Fixes

* **core:** update umzug types to 2.3 ([4668e78](https://github.com/mikro-orm/mikro-orm/commit/4668e78d1c900d1718625364b603dda1b707dd82)), closes [#926](https://github.com/mikro-orm/mikro-orm/issues/926)





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)

**Note:** Version bump only for package @mikro-orm/migrations





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Bug Fixes

* **migrations:** always ensure the migrations folder exists ([a1e0703](https://github.com/mikro-orm/mikro-orm/commit/a1e0703dbf1572e95bf11b353f2872742fdecaef)), closes [#907](https://github.com/mikro-orm/mikro-orm/issues/907)
* **migrations:** respect custom file names when running by name ([80e5b58](https://github.com/mikro-orm/mikro-orm/commit/80e5b584594da89a11b61d1ac2fecdb61dd4106a)), closes [#883](https://github.com/mikro-orm/mikro-orm/issues/883)


### Performance Improvements

* **core:** use JIT compilation for diffing entities ([60f10a4](https://github.com/mikro-orm/mikro-orm/commit/60f10a4cf5fcdbe397c8d7410ece9ffc7a272d6c)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)


### Bug Fixes

* **migrations:** migrate only one version down with explicit tx ([50567dd](https://github.com/mikro-orm/mikro-orm/commit/50567ddd384ac2b53512925cade28e8debbb9f3b)), closes [#855](https://github.com/mikro-orm/mikro-orm/issues/855)





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)


### Features

* **migrations:** allow providing transaction context ([1089c86](https://github.com/mikro-orm/mikro-orm/commit/1089c861afcb31703a0dbdc82edf9674b2dd1576)), closes [#851](https://github.com/mikro-orm/mikro-orm/issues/851)





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)

**Note:** Version bump only for package @mikro-orm/migrations





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)


### Features

* **migrations:** do not use ts-morph in migrations ([9800dc1](https://github.com/mikro-orm/mikro-orm/commit/9800dc114ae32d31bb3621fc771a8eb5324ae044))





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)


### Bug Fixes

* **core:** refactor internals to reduce number of cycles ([#830](https://github.com/mikro-orm/mikro-orm/issues/830)) ([3994767](https://github.com/mikro-orm/mikro-orm/commit/3994767d93ef119d229bedffa77eb2ea3af5c775))
