# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)


### Bug Fixes

* **core:** fix returning clause for upsert with embeddables ([#4427](https://github.com/mikro-orm/mikro-orm/issues/4427)) ([b9682f0](https://github.com/mikro-orm/mikro-orm/commit/b9682f03b34dc028cc593f8a3ffbd672d3e9bcee))
* **core:** respect `undefined` when assigning to object properties ([217ff8f](https://github.com/mikro-orm/mikro-orm/commit/217ff8f7321b6ed2551df5214f9f5934bb6d8896)), closes [#4428](https://github.com/mikro-orm/mikro-orm/issues/4428)





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)

**Note:** Version bump only for package @mikro-orm/knex





## [5.7.10](https://github.com/mikro-orm/mikro-orm/compare/v5.7.9...v5.7.10) (2023-05-23)


### Bug Fixes

* **core:** exclude collections from `returning` clause from `em.upsert` ([e342449](https://github.com/mikro-orm/mikro-orm/commit/e342449c1c291b74de8821afc43236f217260165)), closes [#4382](https://github.com/mikro-orm/mikro-orm/issues/4382)


### Performance Improvements

* **core:** set `Collection._property` early for managed entities ([23ca682](https://github.com/mikro-orm/mikro-orm/commit/23ca682ad8792de145a5c4c7e32c8ff226c0cae1)), closes [#4376](https://github.com/mikro-orm/mikro-orm/issues/4376)





## [5.7.9](https://github.com/mikro-orm/mikro-orm/compare/v5.7.8...v5.7.9) (2023-05-22)

**Note:** Version bump only for package @mikro-orm/knex





## [5.7.8](https://github.com/mikro-orm/mikro-orm/compare/v5.7.7...v5.7.8) (2023-05-21)


### Bug Fixes

* **core:** ensure `em.upsert` returns initialized entity ([#4370](https://github.com/mikro-orm/mikro-orm/issues/4370)) ([bad0b37](https://github.com/mikro-orm/mikro-orm/commit/bad0b37b83552cf6da6606b547ccb19d91062acc)), closes [#4242](https://github.com/mikro-orm/mikro-orm/issues/4242)
* **core:** ensure correct number of results is logged in SQL drivers ([e3cd184](https://github.com/mikro-orm/mikro-orm/commit/e3cd1845365c59fc3e8cdabd97a6be74c6374d79))
* **query-builder:** `qb.clone()` shouldn't ignore `groupBy` and `having` clauses ([7127ff6](https://github.com/mikro-orm/mikro-orm/commit/7127ff623b1f64940e9f24d658a2f2a258227c19))


### Features

* **query-builder:** add `qb.returning()` ([b5ab66b](https://github.com/mikro-orm/mikro-orm/commit/b5ab66bccf4dc3867194a6ba50626d4891646fe1))
* **query-builder:** allow partial loading via `qb.(left/inner)JoinAndSelect()` ([22c8c84](https://github.com/mikro-orm/mikro-orm/commit/22c8c84d9852008522e21389b2304f7f646cdb99)), closes [#4364](https://github.com/mikro-orm/mikro-orm/issues/4364)





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)


### Bug Fixes

* **core:** revert the `const enums` as they break projects with `isolatedModules` ([8b23674](https://github.com/mikro-orm/mikro-orm/commit/8b2367401d055590e402241a46a996c2b026e873)), closes [#4350](https://github.com/mikro-orm/mikro-orm/issues/4350)
* **knex:** remove constraints from knex's peer dependencies ([ce81071](https://github.com/mikro-orm/mikro-orm/commit/ce8107169d817f794766f1470cb3eabb19de3cd7))
* **query-builder:** do not enable query pagination when explicit `groupBy` is set ([921251a](https://github.com/mikro-orm/mikro-orm/commit/921251a5d9cfdeefb0adabddcd889c305b1ef696)), closes [#4353](https://github.com/mikro-orm/mikro-orm/issues/4353)


### Features

* **query-builder:** validate unknown alias when explicitly joining ([8d4a83a](https://github.com/mikro-orm/mikro-orm/commit/8d4a83a08aee3e280356a8321f78085ff36bea5c)), closes [#4353](https://github.com/mikro-orm/mikro-orm/issues/4353)





## [5.7.6](https://github.com/mikro-orm/mikro-orm/compare/v5.7.5...v5.7.6) (2023-05-13)


### Bug Fixes

* **core:** allow `em.populate()` on lazy formula properties ([5c6bb13](https://github.com/mikro-orm/mikro-orm/commit/5c6bb13fd92ad941f1f8de1982544620bb3e1547))


### Performance Improvements

* **core:** define some enums as const enums, so they get inlined ([3cb43ba](https://github.com/mikro-orm/mikro-orm/commit/3cb43baf14e4aa9b23d6085756198b6dbc796fb9))





## [5.7.5](https://github.com/mikro-orm/mikro-orm/compare/v5.7.4...v5.7.5) (2023-05-09)

**Note:** Version bump only for package @mikro-orm/knex





## [5.7.4](https://github.com/mikro-orm/mikro-orm/compare/v5.7.3...v5.7.4) (2023-05-01)

**Note:** Version bump only for package @mikro-orm/knex





## [5.7.3](https://github.com/mikro-orm/mikro-orm/compare/v5.7.2...v5.7.3) (2023-04-28)

**Note:** Version bump only for package @mikro-orm/knex





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)


### Bug Fixes

* **core:** quote JSON property paths if they contain special characters ([a94bbce](https://github.com/mikro-orm/mikro-orm/commit/a94bbcec526fd372ef4d34be06fb7b79197e3878)), closes [#4264](https://github.com/mikro-orm/mikro-orm/issues/4264)





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/knex





# [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)


### Bug Fixes

* **core:** detect `JsonType` based on `columnType` ([#4252](https://github.com/mikro-orm/mikro-orm/issues/4252)) ([2e01622](https://github.com/mikro-orm/mikro-orm/commit/2e01622963c8b22c6468b93a9cd3bc4d8e13bada)), closes [#4229](https://github.com/mikro-orm/mikro-orm/issues/4229)
* **core:** rework JSON value processing ([#4194](https://github.com/mikro-orm/mikro-orm/issues/4194)) ([5594c46](https://github.com/mikro-orm/mikro-orm/commit/5594c469f05d2c1fc76f3cc1a388f5e7162f4e72)), closes [#4193](https://github.com/mikro-orm/mikro-orm/issues/4193)
* **query-builder:** fix pagination when PK uses `BigIntType` ([b789031](https://github.com/mikro-orm/mikro-orm/commit/b789031300e752cfd9565371e7989776b18bd3a0)), closes [#4227](https://github.com/mikro-orm/mikro-orm/issues/4227)
* **query-builder:** support `onConflict().ignore()` without parameters ([3a3b0bd](https://github.com/mikro-orm/mikro-orm/commit/3a3b0bd956354917f31481582cc2e6381951a7c5)), closes [#4224](https://github.com/mikro-orm/mikro-orm/issues/4224)
* **schema:** fix comparing default value of JSON properties ([41277a1](https://github.com/mikro-orm/mikro-orm/commit/41277a1376904b197851bbc3a6cb7692187d90d0)), closes [#4212](https://github.com/mikro-orm/mikro-orm/issues/4212)


### Features

* **core:** deprecate `persist/flush/remove` methods from `EntityRepository` ([#4259](https://github.com/mikro-orm/mikro-orm/issues/4259)) ([eba4563](https://github.com/mikro-orm/mikro-orm/commit/eba45635c61c13f3646a19e640522bce09f5a24a)), closes [#3989](https://github.com/mikro-orm/mikro-orm/issues/3989)





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Bug Fixes

* **migrations:** do not interact with the database when snapshot exists ([48df462](https://github.com/mikro-orm/mikro-orm/commit/48df46219811e33c296ad3bd182a95702d3a2007))


### Reverts

* Revert "chore(release): v5.6.16 [skip ci]" ([49faac9](https://github.com/mikro-orm/mikro-orm/commit/49faac95c86d4c65fb6f66f76efa98ba221dd67e))





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)


### Bug Fixes

* **core:** deduplicate columns in insert queries ([db734d6](https://github.com/mikro-orm/mikro-orm/commit/db734d69b23a97f1cca186dba6629b112d788b16))





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)


### Bug Fixes

* **postgres:** use explicit schema in table identifier when altering comments ([#4123](https://github.com/mikro-orm/mikro-orm/issues/4123)) ([60d96de](https://github.com/mikro-orm/mikro-orm/commit/60d96de64de7f01a4d9baab485046c7f7f43ee7c)), closes [#4108](https://github.com/mikro-orm/mikro-orm/issues/4108)
* **query-builder:** ensure inner paginate query selects sub-queries used in orderBy ([22b7146](https://github.com/mikro-orm/mikro-orm/commit/22b7146cae14a3e153ed4d144f18de1fb6b8cc45)), closes [#4104](https://github.com/mikro-orm/mikro-orm/issues/4104)
* **query-builder:** fix update query with auto-join of 1:1 owner ([0a053fe](https://github.com/mikro-orm/mikro-orm/commit/0a053fe8854a088be8262291f51697749e89cd05)), closes [#4122](https://github.com/mikro-orm/mikro-orm/issues/4122)





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)

**Note:** Version bump only for package @mikro-orm/knex





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)


### Bug Fixes

* **core:** ensure custom types are processed in `em.upsert/upsertMany/insertMany` ([53a08ac](https://github.com/mikro-orm/mikro-orm/commit/53a08acfa285edb0c9da7185a3de9c763361245d)), closes [#4070](https://github.com/mikro-orm/mikro-orm/issues/4070)





## [5.6.11](https://github.com/mikro-orm/mikro-orm/compare/v5.6.10...v5.6.11) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/knex





## [5.6.10](https://github.com/mikro-orm/mikro-orm/compare/v5.6.9...v5.6.10) (2023-02-17)


### Performance Improvements

* **core:** improve result mapping and snapshotting ([#4053](https://github.com/mikro-orm/mikro-orm/issues/4053)) ([8bb0268](https://github.com/mikro-orm/mikro-orm/commit/8bb0268a6d67143b0aa4dd0a5c6a6fb1bd0f8374))





## [5.6.9](https://github.com/mikro-orm/mikro-orm/compare/v5.6.8...v5.6.9) (2023-02-10)


### Bug Fixes

* **query-builder:** respect `qb.joinAndSelect` when serializing ([4025869](https://github.com/mikro-orm/mikro-orm/commit/4025869c5183899b459c6dc7a88d8b60cd4e2689)), closes [#4034](https://github.com/mikro-orm/mikro-orm/issues/4034) [#3812](https://github.com/mikro-orm/mikro-orm/issues/3812)





## [5.6.8](https://github.com/mikro-orm/mikro-orm/compare/v5.6.7...v5.6.8) (2023-01-25)


### Bug Fixes

* **mysql:** fix reloading of database defaults for complex composite PKs ([d36af00](https://github.com/mikro-orm/mikro-orm/commit/d36af00514d96d1060fb18e68ac66b1117e706cb)), closes [#3965](https://github.com/mikro-orm/mikro-orm/issues/3965)





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)

**Note:** Version bump only for package @mikro-orm/knex





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)


### Bug Fixes

* **core:** make `FilterQuery` strict again! ([5427097](https://github.com/mikro-orm/mikro-orm/commit/5427097c9987e3d428c43df12373dcc4496b38f8))





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)

**Note:** Version bump only for package @mikro-orm/knex





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)


### Bug Fixes

* **core:** respect transaction context in `em.execute()` ([832105d](https://github.com/mikro-orm/mikro-orm/commit/832105d23de63df29010ccf62f4ec7a67955a47f)), closes [#3896](https://github.com/mikro-orm/mikro-orm/issues/3896)


### Features

* **core:** add getResultAndCount() ([#3891](https://github.com/mikro-orm/mikro-orm/issues/3891)) ([11956c8](https://github.com/mikro-orm/mikro-orm/commit/11956c8bc31e140ba73353eb1057d91e001986c5)), closes [#3885](https://github.com/mikro-orm/mikro-orm/issues/3885)





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)

**Note:** Version bump only for package @mikro-orm/knex





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)


### Bug Fixes

* **core:** respect `*` in partial loading with joined strategy ([7781f84](https://github.com/mikro-orm/mikro-orm/commit/7781f84537eac9a53d16ff2514bcaa051ece23c5)), closes [#3868](https://github.com/mikro-orm/mikro-orm/issues/3868)





## [5.6.1](https://github.com/mikro-orm/mikro-orm/compare/v5.6.0...v5.6.1) (2022-12-20)


### Bug Fixes

* **core:** fix populating relation with composite FK as primary key ([b27578f](https://github.com/mikro-orm/mikro-orm/commit/b27578ffd1f6185022f249a69e33b86791809aaf)), closes [#3844](https://github.com/mikro-orm/mikro-orm/issues/3844)
* **postgres:** compare only simplified versions of check constraints ([0fd8530](https://github.com/mikro-orm/mikro-orm/commit/0fd853001334032b71a0ff42fbdb585655717216)), closes [#3827](https://github.com/mikro-orm/mikro-orm/issues/3827)





# [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)


### Bug Fixes

* **core:** make `ChangeSet.getPrimaryKey()` response stable ([d32c956](https://github.com/mikro-orm/mikro-orm/commit/d32c956aa3ff66796e4b48b060242195b223c162))
* **mysql:** respect `auto_increment_increment` when batch inserting ([516db6d](https://github.com/mikro-orm/mikro-orm/commit/516db6d3e97b6309d55e8a73a73bb85144af1196)), closes [#3828](https://github.com/mikro-orm/mikro-orm/issues/3828)
* **query-builder:** fix cloning QB in some cases ([c3b4c20](https://github.com/mikro-orm/mikro-orm/commit/c3b4c2089d80a2d1431cc663e767b01be6fe891b)), closes [#3720](https://github.com/mikro-orm/mikro-orm/issues/3720)
* **query-builder:** fix querying for a composite FK when target is joined ([dec4c9c](https://github.com/mikro-orm/mikro-orm/commit/dec4c9c46b1ecf3105f78b77a698c30ef8670c14)), closes [#3738](https://github.com/mikro-orm/mikro-orm/issues/3738)
* **query-builder:** respect case-insensitive regexp flag ([1a1d381](https://github.com/mikro-orm/mikro-orm/commit/1a1d381cfe30bd97a038109e7d2e5ea9ce660062)), closes [#3801](https://github.com/mikro-orm/mikro-orm/issues/3801)
* **query-build:** fix query execution inside hooks sometimes hanging ([dba6ce2](https://github.com/mikro-orm/mikro-orm/commit/dba6ce299341d4345243083313f129e8a3da43ac))
* **schema:** do not cache knex instance ([dc00374](https://github.com/mikro-orm/mikro-orm/commit/dc00374585a0ff3f7686a422143c5c128ddbb87f)), closes [#3713](https://github.com/mikro-orm/mikro-orm/issues/3713)
* **schema:** ensure database exists before dropping schema ([fd4c416](https://github.com/mikro-orm/mikro-orm/commit/fd4c416472ca5b25dd353f324e86fd9ce59521db)), closes [#3713](https://github.com/mikro-orm/mikro-orm/issues/3713)


### Features

* **core:** add `em.upsertMany` ([#3825](https://github.com/mikro-orm/mikro-orm/issues/3825)) ([83ac12a](https://github.com/mikro-orm/mikro-orm/commit/83ac12a4d517b199a2efd364f61356cc6b08407a))
* **core:** introduce ORM extensions ([#3773](https://github.com/mikro-orm/mikro-orm/issues/3773)) ([0f36967](https://github.com/mikro-orm/mikro-orm/commit/0f36967d3c227465ea9c23aa8f290cd8fe383bad))





## [5.5.3](https://github.com/mikro-orm/mikro-orm/compare/v5.5.2...v5.5.3) (2022-11-10)

**Note:** Version bump only for package @mikro-orm/knex





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)


### Bug Fixes

* **knex:** always skip virtual properties in returning clause ([#3699](https://github.com/mikro-orm/mikro-orm/issues/3699)) ([c084dde](https://github.com/mikro-orm/mikro-orm/commit/c084dde32860485f6d63872effcaa76b2d35aed1))





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)


### Bug Fixes

* **core:** fix querying for a complex composite key via inverse side ([b99e7bb](https://github.com/mikro-orm/mikro-orm/commit/b99e7bb4d6dd1c0657ea0ddf28fb0c3a1986e5b7)), closes [#3669](https://github.com/mikro-orm/mikro-orm/issues/3669)
* **core:** handle `$fulltext` search correctly in nested queries ([9a2f535](https://github.com/mikro-orm/mikro-orm/commit/9a2f5350df3101f67c5609aaf4bde0cc6cd17a61)), closes [#3696](https://github.com/mikro-orm/mikro-orm/issues/3696)
* **embeddables:** support partial loading hints ([0c33e00](https://github.com/mikro-orm/mikro-orm/commit/0c33e000082dc9f6c585648da3156825c38790cc)), closes [#3673](https://github.com/mikro-orm/mikro-orm/issues/3673)
* **knex:** ensure virtual properties are never part of `returning` clause ([35d51fe](https://github.com/mikro-orm/mikro-orm/commit/35d51fecff9479f3d704bfcffa90d4fd5dcaf21a)), closes [#3664](https://github.com/mikro-orm/mikro-orm/issues/3664)


### Features

* **core:** add context param to `Type.convertToDatabaseValue()` ([a933e98](https://github.com/mikro-orm/mikro-orm/commit/a933e98e98f366014e1a5af2c1444aaf330a09a0)), closes [#3567](https://github.com/mikro-orm/mikro-orm/issues/3567)





# [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)


### Bug Fixes

* **core:** fix removing entities with complex composite keys ([6d6e9f4](https://github.com/mikro-orm/mikro-orm/commit/6d6e9f43d0f7ba6ef0e507ce08151d905e8470c4)), closes [#3543](https://github.com/mikro-orm/mikro-orm/issues/3543)
* **query-builder:** support top level `$not` operator in join condition ([#3609](https://github.com/mikro-orm/mikro-orm/issues/3609)) ([047504f](https://github.com/mikro-orm/mikro-orm/commit/047504f2404194ea969cca4f600005103c855e58))


### Features

* **core:** add `em.upsert()` method ([#3525](https://github.com/mikro-orm/mikro-orm/issues/3525)) ([3285cdb](https://github.com/mikro-orm/mikro-orm/commit/3285cdb6a615420bb7e079e17f945007e0b07a46)), closes [#3515](https://github.com/mikro-orm/mikro-orm/issues/3515)
* **mongo:** do not expand array queries to `$in` operator when nested inside `$eq` ([e25d28e](https://github.com/mikro-orm/mikro-orm/commit/e25d28e7c12a655d2373e14fd74e9cc68c2b1c5d))
* **postgres:** add `qb.distinctOn()` support ([307d3a1](https://github.com/mikro-orm/mikro-orm/commit/307d3a1dae1ababbb47595fe70b0888de3b9a557))
* **query-builder:** validate modification of finalized QB ([b23f015](https://github.com/mikro-orm/mikro-orm/commit/b23f01526a9287dd07f9eb42e1b68e41cf568f40)), closes [#3534](https://github.com/mikro-orm/mikro-orm/issues/3534)
* **schema:** add ability to ignore specific column changes ([#3503](https://github.com/mikro-orm/mikro-orm/issues/3503)) ([05fb1ce](https://github.com/mikro-orm/mikro-orm/commit/05fb1ce56fd53a5263967d600027f077ae2e10ea)), closes [#1904](https://github.com/mikro-orm/mikro-orm/issues/1904) [#1904](https://github.com/mikro-orm/mikro-orm/issues/1904)
* **sqlite:** enable returning statements in both SQLite drivers ([eaf83c8](https://github.com/mikro-orm/mikro-orm/commit/eaf83c83d8f102f3da62e134959fac2afc3671f1))


### Performance Improvements

* **schema:** improve schema inspection speed in SQL drivers ([#3549](https://github.com/mikro-orm/mikro-orm/issues/3549)) ([74dc3b1](https://github.com/mikro-orm/mikro-orm/commit/74dc3b1aba07666911fb6fc74b55f6547b2c5b4b))





## [5.4.2](https://github.com/mikro-orm/mikro-orm/compare/v5.4.1...v5.4.2) (2022-09-12)


### Features

* **knex:** allow changing `FROM` clause using `QueryBuilder` ([#3378](https://github.com/mikro-orm/mikro-orm/issues/3378)) ([df7d939](https://github.com/mikro-orm/mikro-orm/commit/df7d939f5cc28716dc556074563c8b56d32fb371))





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)
* **core:** support partial loading of inlined embeddables ([9654e6e](https://github.com/mikro-orm/mikro-orm/commit/9654e6e9685afb686eacda9ea84916e9ca0962c5)), closes [#3365](https://github.com/mikro-orm/mikro-orm/issues/3365)
* **postgres:** fix inserting values with `?` into `FullTextType` properties ([5095ddb](https://github.com/mikro-orm/mikro-orm/commit/5095ddb2a95cf4183e08a6a9f509ca442783136e)), closes [#3457](https://github.com/mikro-orm/mikro-orm/issues/3457)





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

* **core:** update to TypeScript 4.8 and improve `EntityDTO` type ([#3389](https://github.com/mikro-orm/mikro-orm/issues/3389)) ([f2957fb](https://github.com/mikro-orm/mikro-orm/commit/f2957fb14141294cfdffebf6cce6eaa937538cfb))
* **knex:** support `em.count()` on virtual entities ([5bb4ebe](https://github.com/mikro-orm/mikro-orm/commit/5bb4ebedfcb5df4d2e27dce66bcdc644e6d7d611))
* **query-builder:** allow using alias for delete queries ([aa19a85](https://github.com/mikro-orm/mikro-orm/commit/aa19a8561cff5e4765c060e86d860635458b2ed5)), closes [#3366](https://github.com/mikro-orm/mikro-orm/issues/3366)
* **query-builder:** support more operators in join conditions ([#3399](https://github.com/mikro-orm/mikro-orm/issues/3399)) ([af885c8](https://github.com/mikro-orm/mikro-orm/commit/af885c8884dc10dcc1ee61bc3eeb0a9922708e52))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/knex





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Bug Fixes

* **postgres:** fix having non-PK serial column next to a non-serial PK ([6c589b0](https://github.com/mikro-orm/mikro-orm/commit/6c589b0c534b8fa5994363f5ed718b9be8840e8d)), closes [#3350](https://github.com/mikro-orm/mikro-orm/issues/3350)
* **query-builder:** fix `qb.insert()/update()` on embeddables in inline mode ([#3340](https://github.com/mikro-orm/mikro-orm/issues/3340)) ([e611fa0](https://github.com/mikro-orm/mikro-orm/commit/e611fa060f392f60f239d53788d24b1ca7c36d7c))
* **schema:** respect explicit `columnType` when comparing columns ([f0a20fa](https://github.com/mikro-orm/mikro-orm/commit/f0a20fafa1425ca20f4f6fb2977eae7773d6ac6a)), closes [#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)
* **schema:** respect schema when renaming columns in postgres ([#3344](https://github.com/mikro-orm/mikro-orm/issues/3344)) ([f905336](https://github.com/mikro-orm/mikro-orm/commit/f9053368c0c3b2c771f1a3a273a19a4b8d374556))


### Features

* add support for full text searches ([#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)) ([8b8f140](https://github.com/mikro-orm/mikro-orm/commit/8b8f14071b92e91161a32aa272315a0ecce1bc0b))
* **core:** add `$exists` mongodb operator with SQL fallback to `is not null` ([112f2be](https://github.com/mikro-orm/mikro-orm/commit/112f2be85fabefc8e9562962945d3bd13b64025e)), closes [#3295](https://github.com/mikro-orm/mikro-orm/issues/3295)
* **core:** add support for virtual entities ([#3351](https://github.com/mikro-orm/mikro-orm/issues/3351)) ([dcd62ac](https://github.com/mikro-orm/mikro-orm/commit/dcd62ac1155e20e7e58d7de4c5fe1a22a422e201))





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)


### Bug Fixes

* **knex:** fix $or over 1:m and m:1 auto-joined relations ([#3307](https://github.com/mikro-orm/mikro-orm/issues/3307)) ([b6f12b2](https://github.com/mikro-orm/mikro-orm/commit/b6f12b21d04d5974e6fd082b4d9984c80129b9cc))


### Features

* **knex:** allow partial loading of 1:1 owner property from inverse side ([d642018](https://github.com/mikro-orm/mikro-orm/commit/d64201835362a42768562891663c3dda1745bda0)), closes [#3324](https://github.com/mikro-orm/mikro-orm/issues/3324)





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)

**Note:** Version bump only for package @mikro-orm/knex





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)


### Bug Fixes

* **sql:** fix prefixing of JSON queries nested on relations ([847ff46](https://github.com/mikro-orm/mikro-orm/commit/847ff468f48dbb99e06ffe713e5d66a461e524b2)), closes [#3242](https://github.com/mikro-orm/mikro-orm/issues/3242)





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)


### Bug Fixes

* **core:** prefer current schema for loading wild card pivot table entities ([f40cafa](https://github.com/mikro-orm/mikro-orm/commit/f40cafa6ec81263ccbd94b9367bff7662333e67c)), closes [#3177](https://github.com/mikro-orm/mikro-orm/issues/3177)





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* **core:** allow changing PK via UoW ([32ab215](https://github.com/mikro-orm/mikro-orm/commit/32ab21583d2718ab874ff71b3f13c9e6a9e5faf0)), closes [#3184](https://github.com/mikro-orm/mikro-orm/issues/3184)
* **query-builder:** fix calling `qb.count('id', true).getCount()` ([a97324a](https://github.com/mikro-orm/mikro-orm/commit/a97324a2b85dd8463f300004bee82b906a68251d)), closes [#3182](https://github.com/mikro-orm/mikro-orm/issues/3182)
* **query-builder:** fix processing of custom types in explicitly aliased queries ([db137a6](https://github.com/mikro-orm/mikro-orm/commit/db137a6cdbe182363d0e4a743b8b8f915e324b09)), closes [#3172](https://github.com/mikro-orm/mikro-orm/issues/3172)
* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))


### Features

* **knex:** allow reusing existing knex client via `driverOptions` ([c169eda](https://github.com/mikro-orm/mikro-orm/commit/c169eda1907f3af217ed77fecce8df1f20c45872)), closes [#3167](https://github.com/mikro-orm/mikro-orm/issues/3167)
* **schema:** add logging to schema comparator ([f96eaaf](https://github.com/mikro-orm/mikro-orm/commit/f96eaaf52a02c14e5413cbd25267a272bfeee92f))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)


### Bug Fixes

* **query-builder:** fix aliasing of relations with composite PK ([095e241](https://github.com/mikro-orm/mikro-orm/commit/095e2416026b926edd07da2eb694b31101e873c3)), closes [#3053](https://github.com/mikro-orm/mikro-orm/issues/3053)


### Performance Improvements

* **query-builder:** use distinct counts only when joining to-many relations ([eebe34d](https://github.com/mikro-orm/mikro-orm/commit/eebe34d8a11725c35b9e857f1ff4a1967cc6c1f8)), closes [#3044](https://github.com/mikro-orm/mikro-orm/issues/3044)





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)


### Bug Fixes

* **core:** fix aliasing of formula properties in complex conditions ([#3130](https://github.com/mikro-orm/mikro-orm/issues/3130)) ([071846e](https://github.com/mikro-orm/mikro-orm/commit/071846ee77ae453a3e26a244ea8c2f0966ab6942))
* **core:** improve type of `em.getContext()` ([158f077](https://github.com/mikro-orm/mikro-orm/commit/158f077d1d0fbe4fd0edcf736a2f6a49a336fb14)), closes [#3120](https://github.com/mikro-orm/mikro-orm/issues/3120)
* **postgres:** do not try to create schema for migrations when it exists ([d6af811](https://github.com/mikro-orm/mikro-orm/commit/d6af81160b4099436237dc312f7dbb4bbffc4378)), closes [#3106](https://github.com/mikro-orm/mikro-orm/issues/3106)





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)


### Bug Fixes

* **schema:** remove FKs first when trying to `dropSchema` without disabled FKs ([b1b5f55](https://github.com/mikro-orm/mikro-orm/commit/b1b5f553d3710893cdfdcc842e6e367f0b34a621)), closes [#3004](https://github.com/mikro-orm/mikro-orm/issues/3004)
* **sqlite:** upgrade knex to v2 + switch back to sqlite3 ([f3e4b9d](https://github.com/mikro-orm/mikro-orm/commit/f3e4b9dd8a29e44510e5549b773205d52475cb72)), closes [#3046](https://github.com/mikro-orm/mikro-orm/issues/3046)





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)


### Bug Fixes

* **core:** do not quote knex.raw() instances returned from custom types ([8a4c836](https://github.com/mikro-orm/mikro-orm/commit/8a4c8367a8af032ff3e4ab00825f5fc5aa605ae8)), closes [#1841](https://github.com/mikro-orm/mikro-orm/issues/1841)
* **core:** fix mapping of inserted PKs with custom field names from batch insert ([080d8e0](https://github.com/mikro-orm/mikro-orm/commit/080d8e0249391e437abc371a375ce62e5de0ba93)), closes [#2977](https://github.com/mikro-orm/mikro-orm/issues/2977)
* **core:** support `PopulateHint.INFER` with pagination and joined strategy ([56f8737](https://github.com/mikro-orm/mikro-orm/commit/56f873706132678c0129148a114fa94503f734a8)), closes [#2985](https://github.com/mikro-orm/mikro-orm/issues/2985)
* **postgres:** do not ignore custom PK constraint names ([#2931](https://github.com/mikro-orm/mikro-orm/issues/2931)) ([24bf10e](https://github.com/mikro-orm/mikro-orm/commit/24bf10e668dd2d3b4b6cc4c52ed215fbffcc9d45))


### Features

* **mariadb:** implement check constraint support + fix json column diffing ([b513b16](https://github.com/mikro-orm/mikro-orm/commit/b513b1636964a9185f5abfc19b5762a57c5c9006)), closes [#2151](https://github.com/mikro-orm/mikro-orm/issues/2151)
* **schema:** support mysql 8 ([#2961](https://github.com/mikro-orm/mikro-orm/issues/2961)) ([acc960e](https://github.com/mikro-orm/mikro-orm/commit/acc960ebc694c61a959f48e89a9fee5513f6bdfa))





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)


### Bug Fixes

* **core:** fix custom pivot table entities for unidirectional relations ([01bdbf6](https://github.com/mikro-orm/mikro-orm/commit/01bdbf65836b6db1c7353d4dd14032645df3a978))
* **knex:** `order by` with a formula field should not include `as` for sub-queries ([#2929](https://github.com/mikro-orm/mikro-orm/issues/2929)) ([74751fb](https://github.com/mikro-orm/mikro-orm/commit/74751fbb2a14f2b6029df5f07fac99310df75f31))
* **postgres:** allow explicit schema name in `prop.pivotTable` ([1860ff5](https://github.com/mikro-orm/mikro-orm/commit/1860ff5e335b4142e4d7917ac5c4d1c18ba4044d)), closes [#2919](https://github.com/mikro-orm/mikro-orm/issues/2919)
* **postgres:** fix pagination with order by UUID PK ([042626c](https://github.com/mikro-orm/mikro-orm/commit/042626c6aa1c1538ce65fb12db435b088e11e518)), closes [#2910](https://github.com/mikro-orm/mikro-orm/issues/2910)





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)


### Bug Fixes

* **core:** do not alias JSON conditions on update/delete queries ([5c0674e](https://github.com/mikro-orm/mikro-orm/commit/5c0674e61d97f9b143b48ae5314e5e7d1eeb4529)), closes [#2839](https://github.com/mikro-orm/mikro-orm/issues/2839)
* **core:** fix ordering by complex composite PKs ([dde11d3](https://github.com/mikro-orm/mikro-orm/commit/dde11d3b2fdd62df28f57c6410e47e14a087ecf3)), closes [#2886](https://github.com/mikro-orm/mikro-orm/issues/2886)
* **knex:** `order by` with a formula field should not include `as` ([#2848](https://github.com/mikro-orm/mikro-orm/issues/2848)) ([09e8bfa](https://github.com/mikro-orm/mikro-orm/commit/09e8bfa036962af13449d5e164ce6a983aa48094))
* **knex:** fully qualify sub-query order-by fields ([#2835](https://github.com/mikro-orm/mikro-orm/issues/2835)) ([f74dc73](https://github.com/mikro-orm/mikro-orm/commit/f74dc73ef8aa0c256b30811aeb3c2269a8a94aa1))
* **postgres:** respect schema name in migration storage ([fbf9bfa](https://github.com/mikro-orm/mikro-orm/commit/fbf9bfa3aad21a4175dea91cd1a6c9742541cbc6)), closes [#2828](https://github.com/mikro-orm/mikro-orm/issues/2828)


### Features

* **core:** allow better control over connection type when using read-replicas ([#2896](https://github.com/mikro-orm/mikro-orm/issues/2896)) ([e40ae2d](https://github.com/mikro-orm/mikro-orm/commit/e40ae2d65abe3d49435356cf79068de5c3d73bd1))
* **core:** allow forcing write connection via `forceWriteConnection` ([#2838](https://github.com/mikro-orm/mikro-orm/issues/2838)) ([36d1969](https://github.com/mikro-orm/mikro-orm/commit/36d19697a9dc504724ce2bf246f7f0906afb6517))
* **core:** allow specifying custom pivot table entity ([#2901](https://github.com/mikro-orm/mikro-orm/issues/2901)) ([8237d16](https://github.com/mikro-orm/mikro-orm/commit/8237d168479c5a61af28cf1a51fcd52f23079179))
* **core:** enable `QueryFlag.PAGINATE` automatically for `em.find()` ([ccb4223](https://github.com/mikro-orm/mikro-orm/commit/ccb4223c2a6ea39103fa9b82ccee8f0b3a9e4f1e)), closes [#2867](https://github.com/mikro-orm/mikro-orm/issues/2867)





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)


### Bug Fixes

* **core:** fix auto-joining multiple 1:1 properties ([0566e74](https://github.com/mikro-orm/mikro-orm/commit/0566e74b9587f28318bfbef384cb7ead8203aed9)), closes [#2821](https://github.com/mikro-orm/mikro-orm/issues/2821)
* **knex:** respect explicit transaction in `em.count()` ([#2818](https://github.com/mikro-orm/mikro-orm/issues/2818)) ([2d26a63](https://github.com/mikro-orm/mikro-orm/commit/2d26a631ebcc2bb1d1315f40f95594dca0abe9fc))
* **query-builder:** use paginate flag automatically based on to-many joins ([db9963f](https://github.com/mikro-orm/mikro-orm/commit/db9963fff8ceb980354b328f2d59353b9177aef3)), closes [#2823](https://github.com/mikro-orm/mikro-orm/issues/2823)





## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)


### Bug Fixes

* **schema:** escape table/column comments ([fff1581](https://github.com/mikro-orm/mikro-orm/commit/fff1581d7ff8f2ab5014e57d14c3938e120eb272)), closes [#2805](https://github.com/mikro-orm/mikro-orm/issues/2805)





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **core:** do not trigger global context validation from repositories ([f651865](https://github.com/mikro-orm/mikro-orm/commit/f651865a3adab17a3025e76dc094b04b1f004181)), closes [#2778](https://github.com/mikro-orm/mikro-orm/issues/2778)


### Features

* add better-sqlite driver ([#2792](https://github.com/mikro-orm/mikro-orm/issues/2792)) ([1b39d66](https://github.com/mikro-orm/mikro-orm/commit/1b39d6687fc2db64e85a45f6a964cf1776a374aa))
* **core:** add `SchemaGenerator.clearDatabase()` ([ecad9c6](https://github.com/mikro-orm/mikro-orm/commit/ecad9c68e8013350bef75b402d6f3c526389765b)), closes [#2220](https://github.com/mikro-orm/mikro-orm/issues/2220)





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)


### Bug Fixes

* **core:** do not ignore schema name in batch queries ([b47393e](https://github.com/mikro-orm/mikro-orm/commit/b47393e30eb495b81d124c523b00cb4620593ff0))
* **core:** do not ignore schema name in collection updates ([d688dc1](https://github.com/mikro-orm/mikro-orm/commit/d688dc19270277370f129f67e4347f2139a9313e))
* **postgres:** do not ignore custom PK constraint names ([3201ef7](https://github.com/mikro-orm/mikro-orm/commit/3201ef7b2b2f4ea745f946da0966da9f94fd2cc8)), closes [#2762](https://github.com/mikro-orm/mikro-orm/issues/2762)





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)


### Bug Fixes

* **core:** allow using 0 as PK ([a2e423c](https://github.com/mikro-orm/mikro-orm/commit/a2e423c5e7006f4869e87b842f646f502ab3846b)), closes [#2729](https://github.com/mikro-orm/mikro-orm/issues/2729)
* **query-builder:** respect explicit entity schema ([717aa5e](https://github.com/mikro-orm/mikro-orm/commit/717aa5e823e02c4d0ee6d7ab7afc8afa28887433)), closes [#2740](https://github.com/mikro-orm/mikro-orm/issues/2740)
* **schema:** fix explicit schema name support ([#2752](https://github.com/mikro-orm/mikro-orm/issues/2752)) ([68631ea](https://github.com/mikro-orm/mikro-orm/commit/68631ea786e40aecd8ffc31baead9a23699874b7))


### Features

* **query-builder:** allow autocomplete on `qb.orderBy()` ([fdf03c3](https://github.com/mikro-orm/mikro-orm/commit/fdf03c38322f79e0b41181b834db903d5138124d)), closes [#2747](https://github.com/mikro-orm/mikro-orm/issues/2747)





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **core:** allow non-standard property names (hyphens, spaces, ...) ([cc68230](https://github.com/mikro-orm/mikro-orm/commit/cc682305b44bd4ef886e7a744f8f4b1d69d090ff)), closes [#1958](https://github.com/mikro-orm/mikro-orm/issues/1958)
* **core:** do not ignore `qb.onConflict(...).merge()` without params ([527e188](https://github.com/mikro-orm/mikro-orm/commit/527e1881b8ffa6e2d45ad489249a050488eedc51)), closes [#1774](https://github.com/mikro-orm/mikro-orm/issues/1774)
* **core:** ensure correct aliasing when auto-joining PKs in group conditions ([38775e6](https://github.com/mikro-orm/mikro-orm/commit/38775e68b98c927e0bb5ae5ece38bb53f797c30c)), closes [#1734](https://github.com/mikro-orm/mikro-orm/issues/1734)
* **core:** fix `QueryFlag.PAGINATE` with joined loading strategy ([c6d72b8](https://github.com/mikro-orm/mikro-orm/commit/c6d72b864d7c36f219e5b0b1e2d3aa66586bf4b8))
* **core:** fix M:N relations with custom type PKs ([3cdc786](https://github.com/mikro-orm/mikro-orm/commit/3cdc78605c9ce8b204df431abba3aea2a0d24429)), closes [#1930](https://github.com/mikro-orm/mikro-orm/issues/1930)
* **core:** fix nested query with fk as pk ([#2650](https://github.com/mikro-orm/mikro-orm/issues/2650)) ([cc54ff9](https://github.com/mikro-orm/mikro-orm/commit/cc54ff94e6c3bc79fd6fb67b169df7489cd1405c)), closes [#2648](https://github.com/mikro-orm/mikro-orm/issues/2648)
* **core:** fix ordering by json properties ([741959f](https://github.com/mikro-orm/mikro-orm/commit/741959fb8db10b1bea4e697a65640834fa422e16))
* **core:** fix ordering by pivot table with explicit schema name ([eb1f9bb](https://github.com/mikro-orm/mikro-orm/commit/eb1f9bb1b10beedfbd5bf4b27aabe485e68e1dc9)), closes [#2621](https://github.com/mikro-orm/mikro-orm/issues/2621)
* **core:** fix pivot tables for wild card schema entities ([623dc91](https://github.com/mikro-orm/mikro-orm/commit/623dc9188b4cd1de30ac0feb190de036d1739e16)), closes [#2690](https://github.com/mikro-orm/mikro-orm/issues/2690)
* **core:** fix populating entities with wildcard schema ([98d0bfb](https://github.com/mikro-orm/mikro-orm/commit/98d0bfb30e268f1a391f4364fe6acb9049a607cb))
* **core:** fix propagation of locking option with select-in population ([f3990d0](https://github.com/mikro-orm/mikro-orm/commit/f3990d0e6eabd40434bbf8d5259519a99423e514)), closes [#1670](https://github.com/mikro-orm/mikro-orm/issues/1670)
* **core:** fix querying by JSON properties ([73108b1](https://github.com/mikro-orm/mikro-orm/commit/73108b183542ef34b4893d5859794e166a82ce39)), closes [#1673](https://github.com/mikro-orm/mikro-orm/issues/1673)
* **core:** fix removing of m:n items when one is composite ([81c0b30](https://github.com/mikro-orm/mikro-orm/commit/81c0b30329c867148e7dd96b6d7bd617f8f0f662)), closes [#1961](https://github.com/mikro-orm/mikro-orm/issues/1961)
* **core:** fix support for nested composite PKs ([14dcff8](https://github.com/mikro-orm/mikro-orm/commit/14dcff8f301577d64d99b7d71e392f211a5e178e)), closes [#2647](https://github.com/mikro-orm/mikro-orm/issues/2647)
* **core:** improve partial loading of 1:m relations ([3ddde1e](https://github.com/mikro-orm/mikro-orm/commit/3ddde1e9a5e31c245da44ebaa96332ee61ef0c61)), closes [#2651](https://github.com/mikro-orm/mikro-orm/issues/2651)
* **core:** initialize empty collections when fetch joining ([02714e5](https://github.com/mikro-orm/mikro-orm/commit/02714e56e4a9018b4bdcfbc995d0348ee04cad7e))
* **core:** mark entity generator and migrations as peer deps of knex ([0e24473](https://github.com/mikro-orm/mikro-orm/commit/0e24473a3ee0df9b1ac22b4f70ba2576204f0379)), closes [#1879](https://github.com/mikro-orm/mikro-orm/issues/1879)
* **core:** respect read replica options ([#2152](https://github.com/mikro-orm/mikro-orm/issues/2152)) ([9ec668d](https://github.com/mikro-orm/mikro-orm/commit/9ec668d201d9017359812d8bebcfc063aac60f55)), closes [#1963](https://github.com/mikro-orm/mikro-orm/issues/1963)
* **core:** respect request context when creating QB ([a2b7b84](https://github.com/mikro-orm/mikro-orm/commit/a2b7b8459597aa72e8a0fbbd6f1dac295b631ac3)), closes [#2669](https://github.com/mikro-orm/mikro-orm/issues/2669)
* **core:** update version values in batch updates ([8476400](https://github.com/mikro-orm/mikro-orm/commit/847640097a7d32156c83e8f6b5cf2c657b457a3b)), closes [#1703](https://github.com/mikro-orm/mikro-orm/issues/1703)
* **core:** use `$and` for merging of multiple filter conditions ([0a0622a](https://github.com/mikro-orm/mikro-orm/commit/0a0622aecac0ba96a39172745fd4bad4ea44edb3)), closes [#1776](https://github.com/mikro-orm/mikro-orm/issues/1776)
* **entity-generator:** fix boolean default values ([908a638](https://github.com/mikro-orm/mikro-orm/commit/908a6387958a7f0604754ad086cdc34a271c5d7f)), closes [#1917](https://github.com/mikro-orm/mikro-orm/issues/1917)
* **knex:** quote version column ([#2402](https://github.com/mikro-orm/mikro-orm/issues/2402)) ([5bbbd15](https://github.com/mikro-orm/mikro-orm/commit/5bbbd159375c273743e2e3d6bc5233d2eb8b8f1c)), closes [#2401](https://github.com/mikro-orm/mikro-orm/issues/2401)
* **mongo:** validate usage of migrator and entity generator ([1db1a63](https://github.com/mikro-orm/mikro-orm/commit/1db1a6376a4cd21412822cfbd1e68f7b178e54e6)), closes [#1801](https://github.com/mikro-orm/mikro-orm/issues/1801)
* **postgres:** allow type casting in nested conditions ([bbd0eb4](https://github.com/mikro-orm/mikro-orm/commit/bbd0eb42f530105d27752c7b713a1fdf7b505ae7)), closes [#2227](https://github.com/mikro-orm/mikro-orm/issues/2227)
* **query-builder:** allow passing array of keys to `qb.onConflict().merge()` ([e4a1cf0](https://github.com/mikro-orm/mikro-orm/commit/e4a1cf0b54452ced49c849fe085a51ca5d99d7a2)), closes [#1774](https://github.com/mikro-orm/mikro-orm/issues/1774)
* **query-builder:** do not wipe previously defined conditions with `qb.delete()` ([b8a5154](https://github.com/mikro-orm/mikro-orm/commit/b8a515479ec2fcbaaf9055acb66788193baf961d)), closes [#2136](https://github.com/mikro-orm/mikro-orm/issues/2136)
* **query-builder:** fix mapping of formula properties ([2607266](https://github.com/mikro-orm/mikro-orm/commit/2607266879207efadf2076a5368b854d9d57956d)), closes [#1599](https://github.com/mikro-orm/mikro-orm/issues/1599) [#2705](https://github.com/mikro-orm/mikro-orm/issues/2705)
* **query-builder:** fix nested ordered pagination ([#2351](https://github.com/mikro-orm/mikro-orm/issues/2351)) ([c5a5c6b](https://github.com/mikro-orm/mikro-orm/commit/c5a5c6b1a49bae334d6e061ae06ffd8c5496b161))
* **query-builder:** respect `0` as limit ([#2700](https://github.com/mikro-orm/mikro-orm/issues/2700)) ([3f284ed](https://github.com/mikro-orm/mikro-orm/commit/3f284ed442778b6ebc8fa312ae6f883e3b73fefe))
* **query-builder:** support joining same property multiple times ([b62fb05](https://github.com/mikro-orm/mikro-orm/commit/b62fb0533d8e845d3b8db31bafde8ad44c51f2dc)), closes [#2602](https://github.com/mikro-orm/mikro-orm/issues/2602)
* **query-builder:** translate field names in `qb.merge()` ([5aead23](https://github.com/mikro-orm/mikro-orm/commit/5aead23e547027bf97f91b2111f5345aa8590135)), closes [#2177](https://github.com/mikro-orm/mikro-orm/issues/2177)
* **query-builder:** validate missing `onConflict` calls ([30392bc](https://github.com/mikro-orm/mikro-orm/commit/30392bcdce9d2d5b585fd7aa2d01f87a2d25d4a2)), closes [#1803](https://github.com/mikro-orm/mikro-orm/issues/1803)
* **schema:** do not ignore entity level indexes with just expression ([0ee9c4d](https://github.com/mikro-orm/mikro-orm/commit/0ee9c4df0650810fc813faa9beac2ba20edd01ab)), closes [#2706](https://github.com/mikro-orm/mikro-orm/issues/2706)
* **schema:** improve diffing of default values for strings and dates ([d4ac638](https://github.com/mikro-orm/mikro-orm/commit/d4ac6385aa84208732f144e6bd9f68e8cf5c6697)), closes [#2385](https://github.com/mikro-orm/mikro-orm/issues/2385)
* **sql:** split `$and` branches when auto joining to-many relations ([70c795a](https://github.com/mikro-orm/mikro-orm/commit/70c795ad19e83109f70c1b53579056e450a512e2)), closes [#2677](https://github.com/mikro-orm/mikro-orm/issues/2677)
* **validation:** throw when calling `qb.update/delete()` after `qb.where()` ([96893e0](https://github.com/mikro-orm/mikro-orm/commit/96893e01d0f7044f878e8dbe3d355ba11132eafe)), closes [#2390](https://github.com/mikro-orm/mikro-orm/issues/2390)


### chore

* upgrade typescript to v4.5.2 ([2bd8220](https://github.com/mikro-orm/mikro-orm/commit/2bd8220378f47533ecc075ac5e04a4a50c4d9225))


### Code Refactoring

* **core:** `PrimaryKeyType` symbol should be defined as optional ([db0b399](https://github.com/mikro-orm/mikro-orm/commit/db0b399da133f7ca04c73347b1bd1a01c3c88001))
* **core:** use options parameters on `SchemaGenerator` ([7e48c5d](https://github.com/mikro-orm/mikro-orm/commit/7e48c5d2487d0f67838927f42efdcd4580a86fd0))
* use options parameters in `IDatabaseDriver` ([#2204](https://github.com/mikro-orm/mikro-orm/issues/2204)) ([9a32ac0](https://github.com/mikro-orm/mikro-orm/commit/9a32ac0655f7ec701399250b88605cc5f5fc3b2c))


### Features

* **core:** add `QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER` ([be9d9e1](https://github.com/mikro-orm/mikro-orm/commit/be9d9e16d59991fe2ea7a20db56602557845d813)), closes [#1660](https://github.com/mikro-orm/mikro-orm/issues/1660)
* **core:** add custom table check constraint support for postgres ([#2688](https://github.com/mikro-orm/mikro-orm/issues/2688)) ([89aca5f](https://github.com/mikro-orm/mikro-orm/commit/89aca5f41cf85bad8bbea51d0c1f9983ec01e903))
* **core:** add index/key name to naming strategy ([a842e3e](https://github.com/mikro-orm/mikro-orm/commit/a842e3eea80349777ccdf7b8840b3c1860e9607f))
* **core:** add support for advanced locking ([0cbed9c](https://github.com/mikro-orm/mikro-orm/commit/0cbed9ccead86cda46cb5d1715fd0b2382d5da18)), closes [#1786](https://github.com/mikro-orm/mikro-orm/issues/1786)
* **core:** add support for concurrency checks ([#2437](https://github.com/mikro-orm/mikro-orm/issues/2437)) ([acd43fe](https://github.com/mikro-orm/mikro-orm/commit/acd43feb0f391ec96f82916d94422c8d9b1341b0))
* **core:** add support for custom property ordering ([#2444](https://github.com/mikro-orm/mikro-orm/issues/2444)) ([40ae4d6](https://github.com/mikro-orm/mikro-orm/commit/40ae4d6b96fbc68ac8ff99edc3cd5209e0968527))
* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** add support for multiple schemas (including UoW) ([#2296](https://github.com/mikro-orm/mikro-orm/issues/2296)) ([d64d100](https://github.com/mikro-orm/mikro-orm/commit/d64d100b0ef6fd3335d234aeac1ffa9b34b8f7ea)), closes [#2074](https://github.com/mikro-orm/mikro-orm/issues/2074)
* **core:** add support for polymorphic embeddables ([#2426](https://github.com/mikro-orm/mikro-orm/issues/2426)) ([7b7c3a2](https://github.com/mikro-orm/mikro-orm/commit/7b7c3a22fe517e13a1a610f142c59e758acd3c3f)), closes [#1165](https://github.com/mikro-orm/mikro-orm/issues/1165)
* **core:** allow configuring aliasing naming strategy ([#2419](https://github.com/mikro-orm/mikro-orm/issues/2419)) ([89d63b3](https://github.com/mikro-orm/mikro-orm/commit/89d63b399e66cc61a7ba9294b39dacb9a9bf8cd1))
* **core:** allow defining check constraints via callback ([965f740](https://github.com/mikro-orm/mikro-orm/commit/965f740f830bd0676b9870dec358c9c69bc068cc)), closes [#2688](https://github.com/mikro-orm/mikro-orm/issues/2688) [#1711](https://github.com/mikro-orm/mikro-orm/issues/1711)
* **core:** allow passing arrays in `orderBy` parameter ([#2211](https://github.com/mikro-orm/mikro-orm/issues/2211)) ([0ec22ed](https://github.com/mikro-orm/mikro-orm/commit/0ec22ed3c88ea0e8c749dc164bb5c1d23ac7b9dc)), closes [#2010](https://github.com/mikro-orm/mikro-orm/issues/2010)
* **core:** allow providing custom `Logger` instance ([#2443](https://github.com/mikro-orm/mikro-orm/issues/2443)) ([c7a75e0](https://github.com/mikro-orm/mikro-orm/commit/c7a75e00de01b85ece282cd64429a57a49e5842d))
* **core:** allow using short lived tokens in config ([4499838](https://github.com/mikro-orm/mikro-orm/commit/44998383b21a3aef943a922a3e75426369178f35)), closes [#1818](https://github.com/mikro-orm/mikro-orm/issues/1818)
* **core:** implement auto-flush mode ([#2491](https://github.com/mikro-orm/mikro-orm/issues/2491)) ([f1d8bf1](https://github.com/mikro-orm/mikro-orm/commit/f1d8bf1dcdc769d4db2d79c7fb022b8d11007ce5)), closes [#2359](https://github.com/mikro-orm/mikro-orm/issues/2359)
* **core:** implement partial loading support for joined loading strategy ([2bebb5e](https://github.com/mikro-orm/mikro-orm/commit/2bebb5e75595ae3369887ee8bed7be48efc45173)), closes [#1707](https://github.com/mikro-orm/mikro-orm/issues/1707)
* **core:** make `em.create()` respect required properties ([2385f1d](https://github.com/mikro-orm/mikro-orm/commit/2385f1d18b1b5235750fc5f29b4d51fe04aca7b8))
* **core:** make `FindOptions.fields` strictly typed (dot notation) ([fd43099](https://github.com/mikro-orm/mikro-orm/commit/fd43099a63cae31ba32f833bed1b75c13f2dd43c))
* **core:** make `populate` parameter strictly typed with dot notation ([3372f02](https://github.com/mikro-orm/mikro-orm/commit/3372f0243f1af34e22a16be2cecba6dc5c04dd0d))
* **core:** support column names with spaces ([00b54b4](https://github.com/mikro-orm/mikro-orm/commit/00b54b46f627cf820d40e0f68eaadcea86236801)), closes [#1617](https://github.com/mikro-orm/mikro-orm/issues/1617)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **embeddables:** allow using m:1 properties inside embeddables ([#1948](https://github.com/mikro-orm/mikro-orm/issues/1948)) ([ffca73e](https://github.com/mikro-orm/mikro-orm/commit/ffca73ecf3ecf405dee3042ad0ab60848721ab7b))
* **entity-generator:** add enum generation support ([#2608](https://github.com/mikro-orm/mikro-orm/issues/2608)) ([1e0b411](https://github.com/mikro-orm/mikro-orm/commit/1e0b411dad3cb0ebb456b34e1bcac9a71f059c48))
* **entity-generator:** add support for generating M:N properties ([c0628c5](https://github.com/mikro-orm/mikro-orm/commit/c0628c5bea63b2b9f7b16a5da2c2e467784b9271))
* **entity-generator:** allow specifying schema ([beb2993](https://github.com/mikro-orm/mikro-orm/commit/beb299383c647f9f2d7431e177659d299fb0f041)), closes [#1301](https://github.com/mikro-orm/mikro-orm/issues/1301)
* **filters:** add `em` parameter to the filter callback parameters ([6858986](https://github.com/mikro-orm/mikro-orm/commit/6858986060e10e6170186094469df6e354a7413e)), closes [#2214](https://github.com/mikro-orm/mikro-orm/issues/2214)
* **knex:** export also global `knex` function ([383bc24](https://github.com/mikro-orm/mikro-orm/commit/383bc24143d11f1034b6025bd73389f046ae172b))
* **migrations:** use snapshots for generating diffs in new migrations ([#1815](https://github.com/mikro-orm/mikro-orm/issues/1815)) ([9c37f61](https://github.com/mikro-orm/mikro-orm/commit/9c37f6141d8723d6c472dfd3557a1d749d344455))
* **mongo:** add `SchemaGenerator` support for mongo ([#2658](https://github.com/mikro-orm/mikro-orm/issues/2658)) ([cc11859](https://github.com/mikro-orm/mikro-orm/commit/cc1185971d1ee5780b183623a8afb455b3f79d3a))
* **query-builder:** add `qb.getCount()` method ([f773736](https://github.com/mikro-orm/mikro-orm/commit/f773736a8a1db7d2d441d8879b27c1bd8e1aa90a)), closes [#2066](https://github.com/mikro-orm/mikro-orm/issues/2066)
* **query-builder:** allow awaiting the `QueryBuilder` instance ([#2446](https://github.com/mikro-orm/mikro-orm/issues/2446)) ([c1c4d51](https://github.com/mikro-orm/mikro-orm/commit/c1c4d51650950c7d9dcf1500cf26ccf8bfb16057))
* **query-builder:** improve typing of `qb.execute()` ([c4cfedb](https://github.com/mikro-orm/mikro-orm/commit/c4cfedbc71032de229d7d5a3c669a1edf306cadf)), closes [#2396](https://github.com/mikro-orm/mikro-orm/issues/2396)
* **schema:** add support for timestamp columns in mysql ([a224ec9](https://github.com/mikro-orm/mikro-orm/commit/a224ec9137afe035bd0ed8d6e77376bc076a0f45)), closes [#2386](https://github.com/mikro-orm/mikro-orm/issues/2386)
* **schema:** allow disabling foreign key constraints ([fcdb236](https://github.com/mikro-orm/mikro-orm/commit/fcdb236eb8112ebaed3450892f51fd469902ac62)), closes [#2548](https://github.com/mikro-orm/mikro-orm/issues/2548)
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **sql:** add `qb.indexHint()` method that appends to the from clause ([ce89e1f](https://github.com/mikro-orm/mikro-orm/commit/ce89e1fdca7622ca8343568b14ac8687f947dc6a)), closes [#1663](https://github.com/mikro-orm/mikro-orm/issues/1663)
* **sql:** add callback signature to `expr()` with alias parameter ([48702c7](https://github.com/mikro-orm/mikro-orm/commit/48702c7576f63f0a19dd81612ffae339b2988e62)), closes [#2405](https://github.com/mikro-orm/mikro-orm/issues/2405)
* **sql:** allow setting transaction isolation level ([6ae5fbf](https://github.com/mikro-orm/mikro-orm/commit/6ae5fbf70dd87fe2380b74d83bc8a04bb8f447fe)), closes [#819](https://github.com/mikro-orm/mikro-orm/issues/819)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))
* **typings:** make `em.create()` and other methods strict ([#1718](https://github.com/mikro-orm/mikro-orm/issues/1718)) ([e8b7119](https://github.com/mikro-orm/mikro-orm/commit/e8b7119eca0df7d686a7d3d91bfc17b74baaeea1)), closes [#1456](https://github.com/mikro-orm/mikro-orm/issues/1456)


### BREAKING CHANGES

* **core:** Previously when we had nonstandard PK types, we could use `PrimaryKeyType` symbol
to let the type system know it. It was required to define this property as required,
now it can be defined as optional too.
* **core:** `em.create()` will now require you to pass all non-optional properties. Some properties
might be defined as required for TS but we have a default value for them (either runtime,
or database one) - for such we can use `OptionalProps` symbol to specify which properties
should be considered as optional.
* Previously it was possible to call `em.populate()` with a single entity input,
and the output would be again just a single entity.

Due to issues with TS 4.5, this method now always return array of entities.
You can use destructing if you want to have a single entity return type:

```ts
const [loadedAuthor] = await em.populate(author, ...);
```
* **core:** Embeddable instances are now created via `EntityFactory` and they respect the
`forceEntityConstructor` configuration. Due to this we need to have EM instance
when assigning to embedded properties. 

Using `em.assign()` should be preferred to get around this.

Deep assigning of child entities now works by default based on the presence of PKs in the payload.
This behaviour can be disable via updateByPrimaryKey: false in the assign options.

`mergeObjects` option is now enabled by default.
* **core:** Previously with select-in strategy as well as with QueryBuilder, table aliases
were always the letter `e` followed by unique index. In v5, we use the same
method as with joined strategy - the letter is inferred from the entity name.

This can be breaking if you used the aliases somewhere, e.g. in custom SQL
fragments. We can restore to the old behaviour by implementing custom naming
strategy, overriding the `aliasName` method:

```ts
import { AbstractNamingStrategy } from '@mikro-orm/core';

class CustomNamingStrategy extends AbstractNamingStrategy {
  aliasName(entityName: string, index: number) {
    return 'e' + index;
  }
}
```

Note that in v5 it is possible to use `expr()` helper to access the alias name
dynamically, e.g. ``expr(alias => `lower('${alias}.name')`)``, which should be
now preferred way instead of hardcoding the aliases.
* **core:** `em.getReference()` now has options parameter.
* Most of the methods on IDatabaseDriver interface now have different signature.
* **core:** Populate parameter is now strictly typed and supports only array of strings or a boolean.
Object way is no longer supported. To set loading strategy, use `FindOptions.strategy`.
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
* **core:** Signature of `em.populate()` changed, it now uses options parameter.

```diff
-populate<P>(entities: T, populate: P, where?: FilterQuery<T>, orderBy?: QueryOrderMap,
-            refresh?: boolean, validate?: boolean): Promise<Loaded<T, P>>;
+populate<P>(entities: T,populate: P, options?: EntityLoaderOptions<T>): Promise<Loaded<T, P>>;
```
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

**Note:** Version bump only for package @mikro-orm/knex





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/knex





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)


### Bug Fixes

* **query-builder:** do not wipe previously defined conditions with `qb.delete()` ([380fe3d](https://github.com/mikro-orm/mikro-orm/commit/380fe3d561a11db29dc44410b984e90f1a6284ef)), closes [#2136](https://github.com/mikro-orm/mikro-orm/issues/2136)





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)


### Bug Fixes

* **core:** fix M:N relations with custom type PKs ([ed399b1](https://github.com/mikro-orm/mikro-orm/commit/ed399b19ad08ba8df8effbc632bdf7bd943cf972)), closes [#1930](https://github.com/mikro-orm/mikro-orm/issues/1930)
* **core:** fix removing of m:n items when one is composite ([8084845](https://github.com/mikro-orm/mikro-orm/commit/808484559c2dc30aca729a9e5a5ab7256b48427a)), closes [#1961](https://github.com/mikro-orm/mikro-orm/issues/1961)
* **entity-generator:** fix boolean default values ([219fc0c](https://github.com/mikro-orm/mikro-orm/commit/219fc0c9376b32928bcc5a6d73053d2d2384eb44)), closes [#1917](https://github.com/mikro-orm/mikro-orm/issues/1917)





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)


### Bug Fixes

* **core:** mark entity generator and migrations as peer deps of knex ([4ad80af](https://github.com/mikro-orm/mikro-orm/commit/4ad80afc89414ed64f44dbd954c121bd99e0cbf3)), closes [#1879](https://github.com/mikro-orm/mikro-orm/issues/1879)





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)


### Bug Fixes

* **core:** do not ignore `qb.onConflict(...).merge()` without params ([68b570e](https://github.com/mikro-orm/mikro-orm/commit/68b570ecf79705ed661a2f9be2ea23fece2752ef)), closes [#1774](https://github.com/mikro-orm/mikro-orm/issues/1774)
* **core:** ensure correct aliasing when auto-joining PKs in group conditions ([ec971b6](https://github.com/mikro-orm/mikro-orm/commit/ec971b68d8955df40dafcc81eb221fbd94b9cb1c)), closes [#1734](https://github.com/mikro-orm/mikro-orm/issues/1734)
* **core:** fix ordering by json properties ([53bef71](https://github.com/mikro-orm/mikro-orm/commit/53bef7184f19c1a7598180e85369e2b2c6042e12))
* **core:** use `$and` for merging of multiple filter conditions ([19f3f1d](https://github.com/mikro-orm/mikro-orm/commit/19f3f1d89cee416566e0f1e44350edfbcd3f34eb)), closes [#1776](https://github.com/mikro-orm/mikro-orm/issues/1776)
* **mongo:** validate usage of migrator and entity generator ([e41d1c5](https://github.com/mikro-orm/mikro-orm/commit/e41d1c5c77c4e80111cfd528ceab64e6cccf91cd)), closes [#1801](https://github.com/mikro-orm/mikro-orm/issues/1801)
* **query-builder:** allow passing array of keys to `qb.onConflict().merge()` ([fc3cf01](https://github.com/mikro-orm/mikro-orm/commit/fc3cf013accc3fbe3b7b59595a1007cb5a74f022)), closes [#1774](https://github.com/mikro-orm/mikro-orm/issues/1774)
* **query-builder:** validate missing `onConflict` calls ([d9ae997](https://github.com/mikro-orm/mikro-orm/commit/d9ae997a3963b96545b70fc8ea177a8231d0ee85)), closes [#1803](https://github.com/mikro-orm/mikro-orm/issues/1803)





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)


### Bug Fixes

* **core:** fix `QueryFlag.PAGINATE` with joined loading strategy ([11aa0a3](https://github.com/mikro-orm/mikro-orm/commit/11aa0a34b75844efb405b14bf098e79a64f5be00))
* **core:** fix querying by JSON properties ([bc5e1a9](https://github.com/mikro-orm/mikro-orm/commit/bc5e1a91e0c9da4c969f4a47e811ec19ef54fcf4)), closes [#1673](https://github.com/mikro-orm/mikro-orm/issues/1673)
* **core:** initialize empty collections when fetch joining ([6fb9560](https://github.com/mikro-orm/mikro-orm/commit/6fb956049d3febdc5acb322416f086db66e6d9c5))
* **core:** update version values in batch updates ([f5c8ed8](https://github.com/mikro-orm/mikro-orm/commit/f5c8ed8cf3af6fff07c83367628ac2908e428b7d)), closes [#1703](https://github.com/mikro-orm/mikro-orm/issues/1703)


### Features

* **core:** add `QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER` ([378e468](https://github.com/mikro-orm/mikro-orm/commit/378e4684441880977c565c1267f7c5aafd630ca8)), closes [#1660](https://github.com/mikro-orm/mikro-orm/issues/1660)





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)


### Bug Fixes

* **core:** do not auto-join composite relations when not needed ([b1420a6](https://github.com/mikro-orm/mikro-orm/commit/b1420a668ca410b3f65b94343fa1e5bb44f56fb0)), closes [#1658](https://github.com/mikro-orm/mikro-orm/issues/1658)
* **core:** fix aliasing of embeddables in update query ([#1650](https://github.com/mikro-orm/mikro-orm/issues/1650)) ([6cb5f62](https://github.com/mikro-orm/mikro-orm/commit/6cb5f62db0b160bee70ff55093cec68658677a76))
* **knex:** find by custom types with object subconditions ([#1656](https://github.com/mikro-orm/mikro-orm/issues/1656)) ([d8c328a](https://github.com/mikro-orm/mikro-orm/commit/d8c328a1658dfce2a967148568002142607d5e75))


### Features

* **query-builder:** allow passing raw query bindings via `qb.raw()` ([aa423a5](https://github.com/mikro-orm/mikro-orm/commit/aa423a5876935c76e5e22d2c32bbe06071ec9e8a)), closes [#1654](https://github.com/mikro-orm/mikro-orm/issues/1654)





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)


### Bug Fixes

* **core:** fix mapping of complex composite keys ([c0c658e](https://github.com/mikro-orm/mikro-orm/commit/c0c658eb125695bd1aed760aa95f2eadc1da8d43)), closes [#1624](https://github.com/mikro-orm/mikro-orm/issues/1624)
* **core:** fix querying embeddables over cast fields ([#1639](https://github.com/mikro-orm/mikro-orm/issues/1639)) ([cb5b25c](https://github.com/mikro-orm/mikro-orm/commit/cb5b25cdf84dfe237ce35871c87fa5028762286e))
* **core:** support advanced custom types in batch queries ([88cc71e](https://github.com/mikro-orm/mikro-orm/commit/88cc71e933d99416fa6a6e24759db281194e97c1)), closes [#1625](https://github.com/mikro-orm/mikro-orm/issues/1625)
* **knex:** find entity by advanced custom types ([#1630](https://github.com/mikro-orm/mikro-orm/issues/1630)) ([ef945d5](https://github.com/mikro-orm/mikro-orm/commit/ef945d5c4730997cd6daaefe84fc0eb77ed4693f))





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)


### Bug Fixes

* **core:** support `Collection.loadCount` for unidirectional M:N ([27e4dd2](https://github.com/mikro-orm/mikro-orm/commit/27e4dd2d93006f632e332e0e689a22ba61835acd)), closes [#1608](https://github.com/mikro-orm/mikro-orm/issues/1608)
* **core:** support sql fragments in custom types with joined strategy ([527579d](https://github.com/mikro-orm/mikro-orm/commit/527579d314dfafa880b2c3de465c085f74e92fb4)), closes [#1594](https://github.com/mikro-orm/mikro-orm/issues/1594)





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)


### Bug Fixes

* **core:** do not process knex.ref() via custom types ([ba2ee70](https://github.com/mikro-orm/mikro-orm/commit/ba2ee70bc7e1a74102fd5e1a00c3f48bb0dcee58)), closes [#1538](https://github.com/mikro-orm/mikro-orm/issues/1538)
* **core:** fix auto-joining with `$not` operator ([8071fd0](https://github.com/mikro-orm/mikro-orm/commit/8071fd07282685e20702cfcb1ec5e7c82fd47e34)), closes [#1537](https://github.com/mikro-orm/mikro-orm/issues/1537)


### Features

* **core:** add `Collection.matching()` method to allow pagination ([#1502](https://github.com/mikro-orm/mikro-orm/issues/1502)) ([1ad3448](https://github.com/mikro-orm/mikro-orm/commit/1ad34488b6ac0c51a75aea9ff505598ea776960e)), closes [#334](https://github.com/mikro-orm/mikro-orm/issues/334)
* **core:** support embeddable arrays ([#1496](https://github.com/mikro-orm/mikro-orm/issues/1496)) ([57b605c](https://github.com/mikro-orm/mikro-orm/commit/57b605ccef8c8104db73270effa62d85fd1ed223)), closes [#1369](https://github.com/mikro-orm/mikro-orm/issues/1369)





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)


### Bug Fixes

* **core:** improve quoting of advanced custom types ([cda3638](https://github.com/mikro-orm/mikro-orm/commit/cda3638e4c07fa8247afa7f1f5c80bb28240c066))





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)


### Bug Fixes

* **core:** handle `convertToJSValueSQL` at QB level too ([fbb2825](https://github.com/mikro-orm/mikro-orm/commit/fbb28252d0d27256dd10c4f8ddcf37c942152a83)), closes [#1432](https://github.com/mikro-orm/mikro-orm/issues/1432)
* **core:** quote custom type aliases ([#1415](https://github.com/mikro-orm/mikro-orm/issues/1415)) ([6f6d1ec](https://github.com/mikro-orm/mikro-orm/commit/6f6d1ec886b7d2b9968d61d082777236e024b337))





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)


### Features

* **core:** allow querying by JSON properties ([#1384](https://github.com/mikro-orm/mikro-orm/issues/1384)) ([69c2493](https://github.com/mikro-orm/mikro-orm/commit/69c24934db478eb07d9c88541527b7be40a26483)), closes [#1359](https://github.com/mikro-orm/mikro-orm/issues/1359) [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)
* **core:** allow using SQL expressions with custom types ([#1389](https://github.com/mikro-orm/mikro-orm/issues/1389)) ([83fe6ea](https://github.com/mikro-orm/mikro-orm/commit/83fe6ea11810e045f5f793ad0f084e3fdf64812a)), closes [#735](https://github.com/mikro-orm/mikro-orm/issues/735)





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)


### Bug Fixes

* **core:** alias pivot fields when loading m:n relations ([56682be](https://github.com/mikro-orm/mikro-orm/commit/56682bec4d3a3144ac26d592cd7c5d603ad9ad54)), closes [#1346](https://github.com/mikro-orm/mikro-orm/issues/1346) [#1349](https://github.com/mikro-orm/mikro-orm/issues/1349)





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)


### Bug Fixes

* **core:** allow using `lazy` flag with formulas ([4b2b5ce](https://github.com/mikro-orm/mikro-orm/commit/4b2b5ce9ea4587703fea04e6047e03814b3c65b4)), closes [#1229](https://github.com/mikro-orm/mikro-orm/issues/1229)
* **core:** fix pessimistic locking via `em.findOne()` ([a0419a4](https://github.com/mikro-orm/mikro-orm/commit/a0419a409fbebf0e1db88bfd7ed0c78fc970b4a5)), closes [#1291](https://github.com/mikro-orm/mikro-orm/issues/1291)
* **mysql:** enforce 64 character limit for identifier names in SQL ([#1297](https://github.com/mikro-orm/mikro-orm/issues/1297)) ([9c83b6d](https://github.com/mikro-orm/mikro-orm/commit/9c83b6d4b64c7fd618f309919967249b33e4ea64)), closes [#1271](https://github.com/mikro-orm/mikro-orm/issues/1271)
* **schema:** fix index name with explicit schema ([b62d9ec](https://github.com/mikro-orm/mikro-orm/commit/b62d9ec0f9121db5ad5e4b50010c4a3dc5255796)), closes [#1215](https://github.com/mikro-orm/mikro-orm/issues/1215)
* **schema:** fix renaming of multiple columns at the same time ([677a2b7](https://github.com/mikro-orm/mikro-orm/commit/677a2b705a679dc972ade64a82399ef50d0b76cc)), closes [#1262](https://github.com/mikro-orm/mikro-orm/issues/1262)
* **sql:** sort fetch-joined properties on their orderBy ([#1336](https://github.com/mikro-orm/mikro-orm/issues/1336)) ([f18cd88](https://github.com/mikro-orm/mikro-orm/commit/f18cd88cea50fda66261de5adaf2d267604e3170)), closes [#1331](https://github.com/mikro-orm/mikro-orm/issues/1331)


### Features

* **core:** add support for nested embedddables ([#1311](https://github.com/mikro-orm/mikro-orm/issues/1311)) ([aee2abd](https://github.com/mikro-orm/mikro-orm/commit/aee2abd4cdb9f8ded0920f2786fd80a32cef41f7)), closes [#1017](https://github.com/mikro-orm/mikro-orm/issues/1017)
* **core:** add support for nested partial loading ([#1306](https://github.com/mikro-orm/mikro-orm/issues/1306)) ([3878e6b](https://github.com/mikro-orm/mikro-orm/commit/3878e6b672f02d533e15d0b576cac4ea45a4d74a)), closes [#221](https://github.com/mikro-orm/mikro-orm/issues/221)
* **core:** implement transaction lifecycle hooks ([#1213](https://github.com/mikro-orm/mikro-orm/issues/1213)) ([0f81ff1](https://github.com/mikro-orm/mikro-orm/commit/0f81ff12d316cec3fcd8e6de623232458799a4f6)), closes [#1175](https://github.com/mikro-orm/mikro-orm/issues/1175)
* **mysql:** allow specifying collation globally ([cd95572](https://github.com/mikro-orm/mikro-orm/commit/cd95572675997fba40e2141258528fc0b19cd1f5)), closes [#1012](https://github.com/mikro-orm/mikro-orm/issues/1012)
* **query-builder:** add support for `onConflict()` ([b97ecb5](https://github.com/mikro-orm/mikro-orm/commit/b97ecb547282a5563b47e2c624ceb9d2833bbb38)), closes [#1240](https://github.com/mikro-orm/mikro-orm/issues/1240)





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)


### Bug Fixes

* **knex:** reject in `commit()` method if commit statement fails ([#1177](https://github.com/mikro-orm/mikro-orm/issues/1177)) ([f3beb7f](https://github.com/mikro-orm/mikro-orm/commit/f3beb7f8ceb943309ed35075e1a021627cf7634e)), closes [#1176](https://github.com/mikro-orm/mikro-orm/issues/1176)
* **sql:** ensure correct order of results when fetch joining ([7453816](https://github.com/mikro-orm/mikro-orm/commit/74538166c4cd9ff9fcd77689f946a0e1cb2f1f04)), closes [#1171](https://github.com/mikro-orm/mikro-orm/issues/1171)
* **sql:** use `__` when aliasing fetch-joined properties ([1479366](https://github.com/mikro-orm/mikro-orm/commit/1479366aab9754a3d3e168962c1143876fead43a)), closes [#1171](https://github.com/mikro-orm/mikro-orm/issues/1171)





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)


### Bug Fixes

* **core:** fix snapshotting of composite properties ([b5f19f2](https://github.com/mikro-orm/mikro-orm/commit/b5f19f2fff9d31138e23c12dc430249ca2854026)), closes [#1079](https://github.com/mikro-orm/mikro-orm/issues/1079)
* **schema:** fix diffing tables in other than default schema ([429d832](https://github.com/mikro-orm/mikro-orm/commit/429d8321d4c9962082af7cf4b2284204342a285b)), closes [#1142](https://github.com/mikro-orm/mikro-orm/issues/1142) [#1143](https://github.com/mikro-orm/mikro-orm/issues/1143)
* **sql:** allow no results in `em.count()` ([bc3cdf6](https://github.com/mikro-orm/mikro-orm/commit/bc3cdf6ae39a809b9507d888f2d190ccde1ece75)), closes [#1135](https://github.com/mikro-orm/mikro-orm/issues/1135)





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)


### Bug Fixes

* **sql:** allow using raw value for JSON prop with custom type ([2a17c59](https://github.com/mikro-orm/mikro-orm/commit/2a17c59cf2db4c6c211ca80ad9c82d64c94289df)), closes [#1112](https://github.com/mikro-orm/mikro-orm/issues/1112)





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)


### Bug Fixes

* **core:** do not interpolate escaped question marks ([c54c2a2](https://github.com/mikro-orm/mikro-orm/commit/c54c2a25314f7c086d590aa0574f713f44363463))





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** ensure correct grouping and commit order for STI ([8b77525](https://github.com/mikro-orm/mikro-orm/commit/8b7752545654b5a60cbc6eaf4f12e0b91e4d5cea)), closes [#845](https://github.com/mikro-orm/mikro-orm/issues/845)
* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)
* **schema:** do not add unique constraint to PKs ([a7da03d](https://github.com/mikro-orm/mikro-orm/commit/a7da03d2a2a937a1a2642cb34f7583a333fd50da)), closes [#1064](https://github.com/mikro-orm/mikro-orm/issues/1064)
* **schema:** ensure we do not ignore some columns ([5d7dfc1](https://github.com/mikro-orm/mikro-orm/commit/5d7dfc14212a4371611e058c377293e05d00c034)), closes [#1009](https://github.com/mikro-orm/mikro-orm/issues/1009)
* **sql:** allow using dot inside custom order by expression ([11e8c56](https://github.com/mikro-orm/mikro-orm/commit/11e8c56f5998eadcb5d81d31a4d30470ea8cf02e)), closes [#1067](https://github.com/mikro-orm/mikro-orm/issues/1067)
* **sql:** convert custom types at query builder level ([83d3ab2](https://github.com/mikro-orm/mikro-orm/commit/83d3ab27f63216aab385500ab73639fa39dcfe90))
* **sql:** fix populating M:N via joined strategy with conditions ([7113827](https://github.com/mikro-orm/mikro-orm/commit/7113827500079efb844df7bddf0b7443ab098185)), closes [#1043](https://github.com/mikro-orm/mikro-orm/issues/1043)
* **sql:** implement diffing of simple scalar indexes ([dc81ef0](https://github.com/mikro-orm/mikro-orm/commit/dc81ef098bcbfbc0e7215b539dbe7d24fce03bf6)), closes [#957](https://github.com/mikro-orm/mikro-orm/issues/957)
* **sql:** inline array parameters when formatting queries ([a21735f](https://github.com/mikro-orm/mikro-orm/commit/a21735f85f3a9de533212151bee8df55810b25b1)), closes [#1021](https://github.com/mikro-orm/mikro-orm/issues/1021)
* **sql:** interpolate `??` as identifier ([a3d4c09](https://github.com/mikro-orm/mikro-orm/commit/a3d4c09b393e2ca7e2bc2ad7c98b9f403559f4bd)), closes [#983](https://github.com/mikro-orm/mikro-orm/issues/983)


### Features

* **core:** maintain transaction context automatically ([#959](https://github.com/mikro-orm/mikro-orm/issues/959)) ([e0064e4](https://github.com/mikro-orm/mikro-orm/commit/e0064e44acb05eb559dcbd47ffff8dafb814149f))
* **query-builder:** allow mapping of complex joined results ([#988](https://github.com/mikro-orm/mikro-orm/issues/988)) ([60dd2d8](https://github.com/mikro-orm/mikro-orm/commit/60dd2d8e951dd94946888765a5e81f4f16c3e7c1)), closes [#932](https://github.com/mikro-orm/mikro-orm/issues/932)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)


### Bug Fixes

* **core:** ensure `qb.getFormattedQuery()` works with postgres ([63b2521](https://github.com/mikro-orm/mikro-orm/commit/63b2521b38ddba2ba5853ee56d28ea7300064f61))





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)


### Bug Fixes

* **core:** fix mapping of params with custom types ([e5049b1](https://github.com/mikro-orm/mikro-orm/commit/e5049b192d13ea41747e1340715e288084a0015d)), closes [#940](https://github.com/mikro-orm/mikro-orm/issues/940)
* **schema:** make sure we do not create FK columns twice in sqlite ([1eb6374](https://github.com/mikro-orm/mikro-orm/commit/1eb6374092caaae35acde46197d506ddf68a9ed9)), closes [#942](https://github.com/mikro-orm/mikro-orm/issues/942)





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/knex





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)


### Bug Fixes

* **schema:** improve column type equality check ([#925](https://github.com/mikro-orm/mikro-orm/issues/925)) ([152f399](https://github.com/mikro-orm/mikro-orm/commit/152f3991db57d771869a3f83b102d9bd14400fe9))


### Features

* **core:** add basic (in-memory) result caching ([2f8253d](https://github.com/mikro-orm/mikro-orm/commit/2f8253d9db9ae0c469e2dcf976aa20546f3b9b8c))
* **core:** allow storing embeddables as objects ([#927](https://github.com/mikro-orm/mikro-orm/issues/927)) ([ba881e6](https://github.com/mikro-orm/mikro-orm/commit/ba881e6257dd5d72bb10ca402b0322f7dbbda69c)), closes [#906](https://github.com/mikro-orm/mikro-orm/issues/906)





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)


### Bug Fixes

* **postgres:** escape question marks in parameters ([813e3cd](https://github.com/mikro-orm/mikro-orm/commit/813e3cd3fad2f1975c0158bf7265e7f58d1437b5)), closes [#920](https://github.com/mikro-orm/mikro-orm/issues/920)





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Bug Fixes

* **schema:** allow using non-abstract root entity in STI ([9dd3aed](https://github.com/mikro-orm/mikro-orm/commit/9dd3aede0484b5e31e10e9ce0ce92f4e0f5d6f55)), closes [#874](https://github.com/mikro-orm/mikro-orm/issues/874)
* **schema:** make STI metadata discovery order independent ([f477a48](https://github.com/mikro-orm/mikro-orm/commit/f477a48562d09373a2e78dea6bc72f21e2c6d64d)), closes [#909](https://github.com/mikro-orm/mikro-orm/issues/909)
* **sqlite:** rework schema support for composite keys in sqlite ([82e2efd](https://github.com/mikro-orm/mikro-orm/commit/82e2efd2d285c507c9205bffced4a9afa920f259)), closes [#887](https://github.com/mikro-orm/mikro-orm/issues/887)
* **typings:** improve inference of the entity type ([67f8015](https://github.com/mikro-orm/mikro-orm/commit/67f80157ae013479b6fc47ae1c08a5cd31a6c32d)), closes [#876](https://github.com/mikro-orm/mikro-orm/issues/876)


### Performance Improvements

* **core:** implement bulk updates in mongo driver ([5f347c1](https://github.com/mikro-orm/mikro-orm/commit/5f347c1de4e5dd6f30305275c86d333611edc27c)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** implement bulk updates in sql drivers ([b005353](https://github.com/mikro-orm/mikro-orm/commit/b00535349368ba18a5e0a5452ae7e2b567e12952)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** interpolate query parameters at ORM level ([742b813](https://github.com/mikro-orm/mikro-orm/commit/742b8131ba7d0acec2cca3f289237fd0e757baa5)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use dedicated identity maps for each entity ([84667f9](https://github.com/mikro-orm/mikro-orm/commit/84667f9e97323e4b054db2c0c70939ab0ca86c86)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use faster way to check number of object keys ([82f3ee4](https://github.com/mikro-orm/mikro-orm/commit/82f3ee4d4169def8ce8fe31764171193e8b8b5dc)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use JIT compiled PK getters/serializers ([0ec99dc](https://github.com/mikro-orm/mikro-orm/commit/0ec99dc75690bf15df3897b4da0fc3b2ab709cdd)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use raw sql for batch updates ([1089c57](https://github.com/mikro-orm/mikro-orm/commit/1089c57b4cea71b1319b913026e8b198985258e7)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)


### Features

* **core:** add groupBy, having and schema to `CountOptions` ([d3c3858](https://github.com/mikro-orm/mikro-orm/commit/d3c38584c38e11002460a6556405e136aabefa93))


### Performance Improvements

* **core:** use batch inserts in UoW (postgres & mongodb) ([#865](https://github.com/mikro-orm/mikro-orm/issues/865)) ([54ad928](https://github.com/mikro-orm/mikro-orm/commit/54ad928aab44d0c42e3f7b306eef0c07ed65dfc1)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)


### Bug Fixes

* **query-builder:** do not select 1:1 owner when auto-joining ([86c3032](https://github.com/mikro-orm/mikro-orm/commit/86c303229c2ac7b77d245000f64562c0cc529320)), closes [#858](https://github.com/mikro-orm/mikro-orm/issues/858)
* **query-builder:** fix auto-joining of 1:m PKs ([920995f](https://github.com/mikro-orm/mikro-orm/commit/920995f94070ff242b297d2837d83c7d9a9cb776)), closes [#857](https://github.com/mikro-orm/mikro-orm/issues/857)
* **query-builder:** fix count query with auto-joining of 1:1 ([9b8056c](https://github.com/mikro-orm/mikro-orm/commit/9b8056c7440b836d22c8175ba90adf70fc3b052e)), closes [#858](https://github.com/mikro-orm/mikro-orm/issues/858)
* **query-builder:** wrap nested array conditions with `$in` operator ([939989a](https://github.com/mikro-orm/mikro-orm/commit/939989add4f670deefe44f5a7faedb9b64155ba5)), closes [#860](https://github.com/mikro-orm/mikro-orm/issues/860)





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)


### Bug Fixes

* **schema:** defer creating of composite indexes + implement diffing ([f57b457](https://github.com/mikro-orm/mikro-orm/commit/f57b4571feb2aea7c955c5f7eb7470530133271e)), closes [#850](https://github.com/mikro-orm/mikro-orm/issues/850)





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)


### Bug Fixes

* **query-builder:** fix mapping of 1:1 inverse sides ([a46281e](https://github.com/mikro-orm/mikro-orm/commit/a46281e0d8de6385e2c49fd250d284293421f2dc)), closes [#849](https://github.com/mikro-orm/mikro-orm/issues/849)
* **query-builder:** fix mapping of nested 1:1 properties ([9799e70](https://github.com/mikro-orm/mikro-orm/commit/9799e70bd7235695f4f1e55b25fe61bbc158eb38))


### Performance Improvements

* move reference to metadata to entity prototype + more improvements ([#843](https://github.com/mikro-orm/mikro-orm/issues/843)) ([f71e4c2](https://github.com/mikro-orm/mikro-orm/commit/f71e4c2b8dd0bbfb0658dc8a366444ec1a49c187)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)


### Performance Improvements

* **core:** do not use `em.merge()` internally ([6a1a6d6](https://github.com/mikro-orm/mikro-orm/commit/6a1a6d68b65a20b8f1a78bf644844427f3b2dd1a))





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/knex





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)


### Bug Fixes

* **core:** refactor internals to reduce number of cycles ([#830](https://github.com/mikro-orm/mikro-orm/issues/830)) ([3994767](https://github.com/mikro-orm/mikro-orm/commit/3994767d93ef119d229bedffa77eb2ea3af5c775))
