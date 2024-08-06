# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.3.4](https://github.com/mikro-orm/mikro-orm/compare/v6.3.3...v6.3.4) (2024-08-06)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.3.3](https://github.com/mikro-orm/mikro-orm/compare/v6.3.2...v6.3.3) (2024-08-03)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.3.2](https://github.com/mikro-orm/mikro-orm/compare/v6.3.1...v6.3.2) (2024-08-01)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.3.1](https://github.com/mikro-orm/mikro-orm/compare/v6.3.0...v6.3.1) (2024-07-25)

**Note:** Version bump only for package @mikro-orm/postgresql





# [6.3.0](https://github.com/mikro-orm/mikro-orm/compare/v6.2.9...v6.3.0) (2024-07-18)


### Bug Fixes

* **postgres:** implement diffing support for `vector` type ([9eadac1](https://github.com/mikro-orm/mikro-orm/commit/9eadac187eb92d6ef098a0552e2c94967ebf2a60)), closes [#5739](https://github.com/mikro-orm/mikro-orm/issues/5739)
* **postgres:** put new native enum values into the correct position ([f79e3bc](https://github.com/mikro-orm/mikro-orm/commit/f79e3bc9063ce34e6fc5ad1c3a9abc3630c1cabe)), closes [#5791](https://github.com/mikro-orm/mikro-orm/issues/5791)
* **postgresql:** ignore tables that use inheritance during schema diffing ([#5648](https://github.com/mikro-orm/mikro-orm/issues/5648)) ([55f452a](https://github.com/mikro-orm/mikro-orm/commit/55f452a7d9061d04244178f87b21df3e0d32f6f4))
* **postgres:** respect empty string in enum items ([c02f12e](https://github.com/mikro-orm/mikro-orm/commit/c02f12e3d835101041fe62a92fd32908d346b789)), closes [#5751](https://github.com/mikro-orm/mikro-orm/issues/5751)
* **postgres:** support enum arrays with special characters ([54b30cb](https://github.com/mikro-orm/mikro-orm/commit/54b30cb8e043cd9cc5d960a609363cc7d5c4ba5a)), closes [#5781](https://github.com/mikro-orm/mikro-orm/issues/5781)


### Features

* **core:** addz `Platform.getDefaultVarcharLength` and optional `Type.getDefaultLength` ([#5749](https://github.com/mikro-orm/mikro-orm/issues/5749)) ([29dcdeb](https://github.com/mikro-orm/mikro-orm/commit/29dcdeb5e4c3f84e43c154fe3eb81a113c6d1470))
* **core:** implement "character" type (DB type "char") ([#5684](https://github.com/mikro-orm/mikro-orm/issues/5684)) ([9fa5fad](https://github.com/mikro-orm/mikro-orm/commit/9fa5fad5e3955cdcdee89aa12c8b3dd4841b2045))
* **postgres:** allow specifying deferred mode on unique constraints ([#5537](https://github.com/mikro-orm/mikro-orm/issues/5537)) ([7672b56](https://github.com/mikro-orm/mikro-orm/commit/7672b56b0efaed26d87651e256866c8ac8ca72ed))
* **postgres:** support `on delete set null/default` with subset of columns ([5353e6a](https://github.com/mikro-orm/mikro-orm/commit/5353e6a97cdea224ce19fe3b5745951411a12282)), closes [#5568](https://github.com/mikro-orm/mikro-orm/issues/5568)
* **postresql:** add support for varchar with unlimited length ([#5707](https://github.com/mikro-orm/mikro-orm/issues/5707)) ([c22e971](https://github.com/mikro-orm/mikro-orm/commit/c22e97147877d0081b7310452b19acbd4609b2a2))





## [6.2.9](https://github.com/mikro-orm/mikro-orm/compare/v6.2.8...v6.2.9) (2024-05-31)


### Bug Fixes

* **postgres:** respect `deferMode` option in 1:1 relations ([#5641](https://github.com/mikro-orm/mikro-orm/issues/5641)) ([101c0a8](https://github.com/mikro-orm/mikro-orm/commit/101c0a85cacfd20e7d4857646d7c7242e4ec1cd1))





## [6.2.8](https://github.com/mikro-orm/mikro-orm/compare/v6.2.7...v6.2.8) (2024-05-21)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.2.7](https://github.com/mikro-orm/mikro-orm/compare/v6.2.6...v6.2.7) (2024-05-18)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.2.6](https://github.com/mikro-orm/mikro-orm/compare/v6.2.5...v6.2.6) (2024-05-14)


### Bug Fixes

* **core:** fix mapping of `Date` properties from `bigint` values ([05c802b](https://github.com/mikro-orm/mikro-orm/commit/05c802b5c33ed87cf57c119208dd34294c09c8b5)), closes [#5540](https://github.com/mikro-orm/mikro-orm/issues/5540)





## [6.2.5](https://github.com/mikro-orm/mikro-orm/compare/v6.2.4...v6.2.5) (2024-05-05)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.2.4](https://github.com/mikro-orm/mikro-orm/compare/v6.2.3...v6.2.4) (2024-05-02)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.2.3](https://github.com/mikro-orm/mikro-orm/compare/v6.2.2...v6.2.3) (2024-04-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.2.2](https://github.com/mikro-orm/mikro-orm/compare/v6.2.1...v6.2.2) (2024-04-20)


### Bug Fixes

* **postgres:** support wildcard native enums ([e183de3](https://github.com/mikro-orm/mikro-orm/commit/e183de3588437db2c41c9fb9d18940116f591a25)), closes [#5456](https://github.com/mikro-orm/mikro-orm/issues/5456)





## [6.2.1](https://github.com/mikro-orm/mikro-orm/compare/v6.2.0...v6.2.1) (2024-04-12)

**Note:** Version bump only for package @mikro-orm/postgresql





# [6.2.0](https://github.com/mikro-orm/mikro-orm/compare/v6.1.12...v6.2.0) (2024-04-09)


### Bug Fixes

* **entity-generator:** allow arbitrary class and prop names as identifiers ([#5359](https://github.com/mikro-orm/mikro-orm/issues/5359)) ([b0c0236](https://github.com/mikro-orm/mikro-orm/commit/b0c0236ac8a2154e7181ac737baccbe95782f337))
* **postgres:** drop text enum check constraints only when necessary ([#5414](https://github.com/mikro-orm/mikro-orm/issues/5414)) ([5162345](https://github.com/mikro-orm/mikro-orm/commit/516234542373b6d62135b88e45df17d4e41cdf08)), closes [#4112](https://github.com/mikro-orm/mikro-orm/issues/4112)
* **postgres:** removed erroneous duplicates in FK discovery query ([#5376](https://github.com/mikro-orm/mikro-orm/issues/5376)) ([eec2b38](https://github.com/mikro-orm/mikro-orm/commit/eec2b387f165b5390185887b695e219c09bd9b60))


### Features

* **mssql:** add MS SQL Server driver ([#1375](https://github.com/mikro-orm/mikro-orm/issues/1375)) ([eeaad45](https://github.com/mikro-orm/mikro-orm/commit/eeaad45a60b3ef4732d5ba9eafc8719998e52181)), closes [#771](https://github.com/mikro-orm/mikro-orm/issues/771)
* **postgres:** allow defining deferred FK constraints ([#5384](https://github.com/mikro-orm/mikro-orm/issues/5384)) ([f42d171](https://github.com/mikro-orm/mikro-orm/commit/f42d171f8bc7604c7b36f15f680f37402990bf9e)), closes [#5306](https://github.com/mikro-orm/mikro-orm/issues/5306)
* **schema:** improve `orm.schema.execute()` to support executing batches ([3c5a347](https://github.com/mikro-orm/mikro-orm/commit/3c5a347d0ce277dc8b33ed6f3dd6e6e4315aa4eb))





## [6.1.12](https://github.com/mikro-orm/mikro-orm/compare/v6.1.11...v6.1.12) (2024-03-24)


### Bug Fixes

* **postgres:** fix query for loading all foreign keys from existing schema ([2eb85d5](https://github.com/mikro-orm/mikro-orm/commit/2eb85d501727601ee86eba8c2c1a11d994cce8cf)), closes [#5364](https://github.com/mikro-orm/mikro-orm/issues/5364)


### Performance Improvements

* **postgres:** try to optimize loading of foreign keys ([2dff96b](https://github.com/mikro-orm/mikro-orm/commit/2dff96bc48c6a84bc1fc213e8044b0ac722d4792)), closes [#5364](https://github.com/mikro-orm/mikro-orm/issues/5364)





## [6.1.11](https://github.com/mikro-orm/mikro-orm/compare/v6.1.10...v6.1.11) (2024-03-18)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.10](https://github.com/mikro-orm/mikro-orm/compare/v6.1.9...v6.1.10) (2024-03-14)


### Bug Fixes

* **postgres:** fix diffing of native enums (create/remove via `schema:update`) ([7c8be79](https://github.com/mikro-orm/mikro-orm/commit/7c8be795e5c5b365dbb03ecadc7709cc42794b12)), closes [#5322](https://github.com/mikro-orm/mikro-orm/issues/5322)
* **schema:** support compound index over JSON property and a regular column ([319df49](https://github.com/mikro-orm/mikro-orm/commit/319df499742475c68df3581f4863be649aa564d7)), closes [#5333](https://github.com/mikro-orm/mikro-orm/issues/5333)


### Features

* **postgres:** provide more details in driver exceptions ([e782d06](https://github.com/mikro-orm/mikro-orm/commit/e782d0686e45ddfd1e91e613ed83b0b5a046dc6f))





## [6.1.9](https://github.com/mikro-orm/mikro-orm/compare/v6.1.8...v6.1.9) (2024-03-10)


### Features

* **postgres:** add support for native enum arrays ([c2e362b](https://github.com/mikro-orm/mikro-orm/commit/c2e362bc6fe19ec792d13f475a11cf2290b94fde)), closes [#5322](https://github.com/mikro-orm/mikro-orm/issues/5322)





## [6.1.8](https://github.com/mikro-orm/mikro-orm/compare/v6.1.7...v6.1.8) (2024-03-06)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.7](https://github.com/mikro-orm/mikro-orm/compare/v6.1.6...v6.1.7) (2024-03-04)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.6](https://github.com/mikro-orm/mikro-orm/compare/v6.1.5...v6.1.6) (2024-02-28)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.5](https://github.com/mikro-orm/mikro-orm/compare/v6.1.4...v6.1.5) (2024-02-21)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.4](https://github.com/mikro-orm/mikro-orm/compare/v6.1.3...v6.1.4) (2024-02-16)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.3](https://github.com/mikro-orm/mikro-orm/compare/v6.1.2...v6.1.3) (2024-02-13)


### Bug Fixes

* **postgres:** implement casting for JSON queries on types like `double` or `bigint` ([b00eae6](https://github.com/mikro-orm/mikro-orm/commit/b00eae695aae3258e68799dc4e2101123eeac866)), closes [#5239](https://github.com/mikro-orm/mikro-orm/issues/5239)





## [6.1.2](https://github.com/mikro-orm/mikro-orm/compare/v6.1.1...v6.1.2) (2024-02-11)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.1.1](https://github.com/mikro-orm/mikro-orm/compare/v6.1.0...v6.1.1) (2024-02-10)


### Bug Fixes

* **postgres:** declare dependency on `postgres-array` ([e73fd1a](https://github.com/mikro-orm/mikro-orm/commit/e73fd1a2ec92534c2889255132fb95129de1bb23))
* **postgres:** fix parsing of date properties inside object emebddables ([760ec77](https://github.com/mikro-orm/mikro-orm/commit/760ec77b1f852103f878998bb2c76edce1fb5c77)), closes [#5216](https://github.com/mikro-orm/mikro-orm/issues/5216)





# [6.1.0](https://github.com/mikro-orm/mikro-orm/compare/v6.0.7...v6.1.0) (2024-02-04)


### Bug Fixes

* **postgres:** improve diffing of native postgres enums ([49d6b4d](https://github.com/mikro-orm/mikro-orm/commit/49d6b4d561196c7c1e0c6f94e6cc1ee1966b9178)), closes [#5108](https://github.com/mikro-orm/mikro-orm/issues/5108)


### Features

* **core:** allow mapping array columns to arrays of objects via `ArrayType` ([#5204](https://github.com/mikro-orm/mikro-orm/issues/5204)) ([42cc9cc](https://github.com/mikro-orm/mikro-orm/commit/42cc9ccf4639d430d8d1cc60bb5c3385b0e501f2)), closes [#5188](https://github.com/mikro-orm/mikro-orm/issues/5188)





## [6.0.7](https://github.com/mikro-orm/mikro-orm/compare/v6.0.6...v6.0.7) (2024-01-30)


### Features

* **postgres:** add support for `interval` type ([659a613](https://github.com/mikro-orm/mikro-orm/commit/659a613f802b7c47f94ee2729425c8576b20146a)), closes [#5181](https://github.com/mikro-orm/mikro-orm/issues/5181)





## [6.0.6](https://github.com/mikro-orm/mikro-orm/compare/v6.0.5...v6.0.6) (2024-01-29)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.0.5](https://github.com/mikro-orm/mikro-orm/compare/v6.0.4...v6.0.5) (2024-01-18)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.0.4](https://github.com/mikro-orm/mikro-orm/compare/v6.0.3...v6.0.4) (2024-01-15)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.0.3](https://github.com/mikro-orm/mikro-orm/compare/v6.0.2...v6.0.3) (2024-01-13)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.0.2](https://github.com/mikro-orm/mikro-orm/compare/v6.0.1...v6.0.2) (2024-01-09)

**Note:** Version bump only for package @mikro-orm/postgresql





## [6.0.1](https://github.com/mikro-orm/mikro-orm/compare/v6.0.0...v6.0.1) (2024-01-08)

**Note:** Version bump only for package @mikro-orm/postgresql





# [6.0.0](https://github.com/mikro-orm/mikro-orm/compare/v5.9.7...v6.0.0) (2024-01-08)


### Bug Fixes

* **core:** refactor mapping of `Date` properties ([#4391](https://github.com/mikro-orm/mikro-orm/issues/4391)) ([3a80369](https://github.com/mikro-orm/mikro-orm/commit/3a8036928ce36d31a2005b7e5133cf825b84a1b5)), closes [#4362](https://github.com/mikro-orm/mikro-orm/issues/4362) [#4360](https://github.com/mikro-orm/mikro-orm/issues/4360) [#1476](https://github.com/mikro-orm/mikro-orm/issues/1476)
* **core:** rework pivot table joining ([#4438](https://github.com/mikro-orm/mikro-orm/issues/4438)) ([0506d36](https://github.com/mikro-orm/mikro-orm/commit/0506d36dc1e5bad16aeefee8419717e0054c6764)), closes [#4423](https://github.com/mikro-orm/mikro-orm/issues/4423)
* **entity-generator:** use index expressions for complex indexes (e.g. conditional) ([64a39f8](https://github.com/mikro-orm/mikro-orm/commit/64a39f82c7d391d28e28c639512a810c516f08a9)), closes [#4911](https://github.com/mikro-orm/mikro-orm/issues/4911)
* **postgres:** allow using array operators (e.g. `@>`) with object arrays ([ca8795a](https://github.com/mikro-orm/mikro-orm/commit/ca8795af7efe9c7e3dbe65cbd7df59c01f44fe1c)), closes [#4973](https://github.com/mikro-orm/mikro-orm/issues/4973)
* **postgres:** parse timestamp dates less than year 100 ([e774d40](https://github.com/mikro-orm/mikro-orm/commit/e774d4092eb13d81772701f7d8e35ada55fb4d45)), closes [#5071](https://github.com/mikro-orm/mikro-orm/issues/5071)
* **postgres:** respect column length in down migrations ([d49d13c](https://github.com/mikro-orm/mikro-orm/commit/d49d13c9db9d4374558217ee7af12a605313db5c)), closes [#5048](https://github.com/mikro-orm/mikro-orm/issues/5048)


### Features

* **core:** add `MikroORM.initSync()` helper ([#4166](https://github.com/mikro-orm/mikro-orm/issues/4166)) ([8b1a1fa](https://github.com/mikro-orm/mikro-orm/commit/8b1a1fa324db9227f5caae35fb2d8ab6a2b76e8a)), closes [#4164](https://github.com/mikro-orm/mikro-orm/issues/4164)
* **core:** add `sql.now()`, `sql.lower()` and `sql.upper()` functions ([#5044](https://github.com/mikro-orm/mikro-orm/issues/5044)) ([016fe63](https://github.com/mikro-orm/mikro-orm/commit/016fe63e0e0db448a31da00c4690fc5c5ae59069))
* **core:** add support for indexes on JSON properties ([#4735](https://github.com/mikro-orm/mikro-orm/issues/4735)) ([82c8629](https://github.com/mikro-orm/mikro-orm/commit/82c8629d5e96a8552890cd17eb485ca3020156dc)), closes [#1230](https://github.com/mikro-orm/mikro-orm/issues/1230)
* **core:** allow extending `EntityManager` ([#5064](https://github.com/mikro-orm/mikro-orm/issues/5064)) ([6c363e7](https://github.com/mikro-orm/mikro-orm/commit/6c363e7666ddf713ae601d1c9325c5b7f4523fbe))
* **core:** re-export the core package from all drivers ([#3816](https://github.com/mikro-orm/mikro-orm/issues/3816)) ([175c059](https://github.com/mikro-orm/mikro-orm/commit/175c05912d3f53eac0788ecd32002cb9a30e7cfa))
* **core:** remove static require calls ([#3814](https://github.com/mikro-orm/mikro-orm/issues/3814)) ([b58f476](https://github.com/mikro-orm/mikro-orm/commit/b58f4763995738cad11d08665b239443f9fb4499)), closes [#3743](https://github.com/mikro-orm/mikro-orm/issues/3743)
* **core:** require explicitly marked raw queries via `raw()` helper ([#4197](https://github.com/mikro-orm/mikro-orm/issues/4197)) ([9c1b205](https://github.com/mikro-orm/mikro-orm/commit/9c1b205f4cb9fede6330360982f23cf6ef37f346))
* **postgres:** add support for native enums ([#4296](https://github.com/mikro-orm/mikro-orm/issues/4296)) ([8515380](https://github.com/mikro-orm/mikro-orm/commit/8515380b7d54aabdef89098139d533ae15adc91b)), closes [#2764](https://github.com/mikro-orm/mikro-orm/issues/2764)
* **postgres:** add support for weighted tsvectors and a custom regconfig ([#3805](https://github.com/mikro-orm/mikro-orm/issues/3805)) ([a0e2c7f](https://github.com/mikro-orm/mikro-orm/commit/a0e2c7f4063d0774afd608a178b0e1edc220c3d5)), closes [/github.com/mikro-orm/mikro-orm/pull/3317#issuecomment-1330035868](https://github.com//github.com/mikro-orm/mikro-orm/pull/3317/issues/issuecomment-1330035868) [/github.com/mikro-orm/mikro-orm/pull/3317#issuecomment-1330555809](https://github.com//github.com/mikro-orm/mikro-orm/pull/3317/issues/issuecomment-1330555809) [/github.com/mikro-orm/mikro-orm/pull/3317#issuecomment-1279882693](https://github.com//github.com/mikro-orm/mikro-orm/pull/3317/issues/issuecomment-1279882693)
* **sql:** add native support for generated columns ([#4884](https://github.com/mikro-orm/mikro-orm/issues/4884)) ([a928291](https://github.com/mikro-orm/mikro-orm/commit/a928291335f6867e02ed948afb5c9abd17975dba))





## [5.9.2](https://github.com/mikro-orm/mikro-orm/compare/v5.9.1...v5.9.2) (2023-11-02)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.9.1](https://github.com/mikro-orm/mikro-orm/compare/v5.9.0...v5.9.1) (2023-10-31)

**Note:** Version bump only for package @mikro-orm/postgresql





# [5.9.0](https://github.com/mikro-orm/mikro-orm/compare/v5.8.10...v5.9.0) (2023-10-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.10](https://github.com/mikro-orm/mikro-orm/compare/v5.8.9...v5.8.10) (2023-10-18)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.9](https://github.com/mikro-orm/mikro-orm/compare/v5.8.8...v5.8.9) (2023-10-15)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.8](https://github.com/mikro-orm/mikro-orm/compare/v5.8.7...v5.8.8) (2023-10-11)


### Bug Fixes

* **postgres:** escape array literal values containing backslash ([#4797](https://github.com/mikro-orm/mikro-orm/issues/4797)) ([20179ec](https://github.com/mikro-orm/mikro-orm/commit/20179ec839def5f8144e56f3a6bc89131f7e72a4)), closes [#4796](https://github.com/mikro-orm/mikro-orm/issues/4796)





## [5.8.7](https://github.com/mikro-orm/mikro-orm/compare/v5.8.6...v5.8.7) (2023-10-05)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.6](https://github.com/mikro-orm/mikro-orm/compare/v5.8.5...v5.8.6) (2023-10-02)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.5](https://github.com/mikro-orm/mikro-orm/compare/v5.8.4...v5.8.5) (2023-09-30)


### Bug Fixes

* **core:** pin all internal dependencies ([f4868ed](https://github.com/mikro-orm/mikro-orm/commit/f4868edec97457e7c4548d887fb3ba23cf266c59)), closes [#4764](https://github.com/mikro-orm/mikro-orm/issues/4764)





## [5.8.4](https://github.com/mikro-orm/mikro-orm/compare/v5.8.3...v5.8.4) (2023-09-27)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.3](https://github.com/mikro-orm/mikro-orm/compare/v5.8.2...v5.8.3) (2023-09-24)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.2](https://github.com/mikro-orm/mikro-orm/compare/v5.8.1...v5.8.2) (2023-09-20)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.8.1](https://github.com/mikro-orm/mikro-orm/compare/v5.8.0...v5.8.1) (2023-09-12)

**Note:** Version bump only for package @mikro-orm/postgresql





# [5.8.0](https://github.com/mikro-orm/mikro-orm/compare/v5.7.14...v5.8.0) (2023-09-10)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.14](https://github.com/mikro-orm/mikro-orm/compare/v5.7.13...v5.7.14) (2023-07-27)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.13](https://github.com/mikro-orm/mikro-orm/compare/v5.7.12...v5.7.13) (2023-07-16)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.10](https://github.com/mikro-orm/mikro-orm/compare/v5.7.9...v5.7.10) (2023-05-23)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.9](https://github.com/mikro-orm/mikro-orm/compare/v5.7.8...v5.7.9) (2023-05-22)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.8](https://github.com/mikro-orm/mikro-orm/compare/v5.7.7...v5.7.8) (2023-05-21)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.6](https://github.com/mikro-orm/mikro-orm/compare/v5.7.5...v5.7.6) (2023-05-13)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.5](https://github.com/mikro-orm/mikro-orm/compare/v5.7.4...v5.7.5) (2023-05-09)


### Bug Fixes

* **postgres:** improve enum/check constraint inspection in schema diffing ([6c44b42](https://github.com/mikro-orm/mikro-orm/commit/6c44b4277976c2c4bd79818d997a1a6bff861d7c)), closes [#4312](https://github.com/mikro-orm/mikro-orm/issues/4312)





## [5.7.4](https://github.com/mikro-orm/mikro-orm/compare/v5.7.3...v5.7.4) (2023-05-01)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.3](https://github.com/mikro-orm/mikro-orm/compare/v5.7.2...v5.7.3) (2023-04-28)


### Bug Fixes

* **postgres:** do not convert `date` column type to `Date` object automatically ([a7d1d09](https://github.com/mikro-orm/mikro-orm/commit/a7d1d09e710497d08d2c12346a76c664ed2d67e5)), closes [#4194](https://github.com/mikro-orm/mikro-orm/issues/4194) [#4276](https://github.com/mikro-orm/mikro-orm/issues/4276)





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/postgresql





# [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)


### Bug Fixes

* **core:** detect `JsonType` based on `columnType` ([#4252](https://github.com/mikro-orm/mikro-orm/issues/4252)) ([2e01622](https://github.com/mikro-orm/mikro-orm/commit/2e01622963c8b22c6468b93a9cd3bc4d8e13bada)), closes [#4229](https://github.com/mikro-orm/mikro-orm/issues/4229)
* **core:** rework JSON value processing ([#4194](https://github.com/mikro-orm/mikro-orm/issues/4194)) ([5594c46](https://github.com/mikro-orm/mikro-orm/commit/5594c469f05d2c1fc76f3cc1a388f5e7162f4e72)), closes [#4193](https://github.com/mikro-orm/mikro-orm/issues/4193)





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Reverts

* Revert "chore(release): v5.6.16 [skip ci]" ([49faac9](https://github.com/mikro-orm/mikro-orm/commit/49faac95c86d4c65fb6f66f76efa98ba221dd67e))
* Revert "chore(release): update internal dependencies to use tilde [skip ci]" ([381cba1](https://github.com/mikro-orm/mikro-orm/commit/381cba1fbf1141e1f754d25e1fd5748906425caa))





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)


### Bug Fixes

* **postgres:** use explicit schema in table identifier when altering comments ([#4123](https://github.com/mikro-orm/mikro-orm/issues/4123)) ([60d96de](https://github.com/mikro-orm/mikro-orm/commit/60d96de64de7f01a4d9baab485046c7f7f43ee7c)), closes [#4108](https://github.com/mikro-orm/mikro-orm/issues/4108)





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)


### Bug Fixes

* **postgres:** use quoted schema+table name when dropping constraints ([#4079](https://github.com/mikro-orm/mikro-orm/issues/4079)) ([ff1dfb6](https://github.com/mikro-orm/mikro-orm/commit/ff1dfb69ff9841d45cb9ce78c37341748df47c08))





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.11](https://github.com/mikro-orm/mikro-orm/compare/v5.6.10...v5.6.11) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.10](https://github.com/mikro-orm/mikro-orm/compare/v5.6.9...v5.6.10) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.9](https://github.com/mikro-orm/mikro-orm/compare/v5.6.8...v5.6.9) (2023-02-10)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.8](https://github.com/mikro-orm/mikro-orm/compare/v5.6.7...v5.6.8) (2023-01-25)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)


### Bug Fixes

* **core:** improve inference of driver exported `MikroORM.init()` ([497f274](https://github.com/mikro-orm/mikro-orm/commit/497f27451bbca37c7dd9222716257692724d3a0d))





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.6.1](https://github.com/mikro-orm/mikro-orm/compare/v5.6.0...v5.6.1) (2022-12-20)


### Bug Fixes

* **postgres:** ignore internal timescale schemas automatically ([85d9083](https://github.com/mikro-orm/mikro-orm/commit/85d9083766ccff50680517289c2a28e0512e02e5))





# [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)


### Bug Fixes

* **postgres:** quote array literal items containing a comma ([5ffa81c](https://github.com/mikro-orm/mikro-orm/commit/5ffa81c02ac01cc3420ca345b05835e331c879e9)), closes [#3810](https://github.com/mikro-orm/mikro-orm/issues/3810)
* **postgres:** use `postgres` as the management db name + allow override ([eab1668](https://github.com/mikro-orm/mikro-orm/commit/eab16681681b13b40f183dc8ec6b26e3171edc11)), closes [#3769](https://github.com/mikro-orm/mikro-orm/issues/3769)
* **query-builder:** respect case-insensitive regexp flag ([1a1d381](https://github.com/mikro-orm/mikro-orm/commit/1a1d381cfe30bd97a038109e7d2e5ea9ce660062)), closes [#3801](https://github.com/mikro-orm/mikro-orm/issues/3801)





## [5.5.3](https://github.com/mikro-orm/mikro-orm/compare/v5.5.2...v5.5.3) (2022-11-10)


### Bug Fixes

* **postgres:** fix ensuring database exists ([d23dde0](https://github.com/mikro-orm/mikro-orm/commit/d23dde098b691741f76b17176d97a057d22c4c8a)), closes [#3713](https://github.com/mikro-orm/mikro-orm/issues/3713)





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)


### Bug Fixes

* **postgres:** fix ensuring database exists when `postgres` database does not exist ([b1a867d](https://github.com/mikro-orm/mikro-orm/commit/b1a867d27697f0f2cf4d1a747c15d1773b8a0f86)), closes [#3671](https://github.com/mikro-orm/mikro-orm/issues/3671)





# [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)


### Bug Fixes

* **query-builder:** support top level `$not` operator in join condition ([#3609](https://github.com/mikro-orm/mikro-orm/issues/3609)) ([047504f](https://github.com/mikro-orm/mikro-orm/commit/047504f2404194ea969cca4f600005103c855e58))


### Features

* **core:** add `defineConfig` helper ([#3500](https://github.com/mikro-orm/mikro-orm/issues/3500)) ([67d3c68](https://github.com/mikro-orm/mikro-orm/commit/67d3c682bf11d8e9369e351da6e4ee20958b9581))
* **core:** add `MikroORM` and `Options` exports to each driver package ([#3499](https://github.com/mikro-orm/mikro-orm/issues/3499)) ([b68ed47](https://github.com/mikro-orm/mikro-orm/commit/b68ed47acac2da8b845ec33d6f30692b88c04acd))


### Performance Improvements

* **schema:** improve schema inspection speed in SQL drivers ([#3549](https://github.com/mikro-orm/mikro-orm/issues/3549)) ([74dc3b1](https://github.com/mikro-orm/mikro-orm/commit/74dc3b1aba07666911fb6fc74b55f6547b2c5b4b))





## [5.4.2](https://github.com/mikro-orm/mikro-orm/compare/v5.4.1...v5.4.2) (2022-09-12)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)
* **postgres:** fix parsing enum definition when one of the items has comma ([c8062cb](https://github.com/mikro-orm/mikro-orm/commit/c8062cb11d80161d8a2db4a3dfec09e199a99f5f)), closes [#3460](https://github.com/mikro-orm/mikro-orm/issues/3460)





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

* **postgres:** fix escaping of special chars in string arrays ([#3405](https://github.com/mikro-orm/mikro-orm/issues/3405)) ([cd7c42f](https://github.com/mikro-orm/mikro-orm/commit/cd7c42f242c5c957e5e81e406881ddcc0a17e5d0))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/postgresql





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Features

* add support for full text searches ([#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)) ([8b8f140](https://github.com/mikro-orm/mikro-orm/commit/8b8f14071b92e91161a32aa272315a0ecce1bc0b))





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)


### Features

* **core:** allow to adjust default type mapping ([ca8ce57](https://github.com/mikro-orm/mikro-orm/commit/ca8ce5721f0d547ceec1cf645443b6ae00deaf09)), closes [#3066](https://github.com/mikro-orm/mikro-orm/issues/3066)





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* **schema:** do not consider autoincrement columns as primary automatically ([088afdb](https://github.com/mikro-orm/mikro-orm/commit/088afdb96ef8fd20a3868c050bb749a4e825fd19)), closes [#3187](https://github.com/mikro-orm/mikro-orm/issues/3187)
* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)

**Note:** Version bump only for package @mikro-orm/postgresql





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)


### Bug Fixes

* **mongo:** support queries with mongo specific operators on embeddables ([2fb9002](https://github.com/mikro-orm/mikro-orm/commit/2fb900294acef87bc939e0417ec3fd720f806ffd))
* **postgres:** do not try to create schema for migrations when it exists ([d6af811](https://github.com/mikro-orm/mikro-orm/commit/d6af81160b4099436237dc312f7dbb4bbffc4378)), closes [#3106](https://github.com/mikro-orm/mikro-orm/issues/3106)
* **postgres:** fix resolving knex when other version is explicitly installed ([41f5665](https://github.com/mikro-orm/mikro-orm/commit/41f5665bcf234cdccf5a466173b7937acd3c9a1a)), closes [#3129](https://github.com/mikro-orm/mikro-orm/issues/3129)
* **postgres:** ignore schemas prefixed with `crdb_` too ([049fea3](https://github.com/mikro-orm/mikro-orm/commit/049fea3f77063f504a617e32cb9a4e303fbbf0be)), closes [#3021](https://github.com/mikro-orm/mikro-orm/issues/3021)
* **schema:** always ignore PostGIS schemas when diffing ([#3096](https://github.com/mikro-orm/mikro-orm/issues/3096)) ([626e3db](https://github.com/mikro-orm/mikro-orm/commit/626e3dbe1edeb2b43bbe08aa2a025524da65a790))


### Features

* **postgres:** allow ignoring specified schemas ([3f1d2da](https://github.com/mikro-orm/mikro-orm/commit/3f1d2da742bc1301d4ab89d42be37a694a69edcd))





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)


### Bug Fixes

* **postgres:** allow using special characters in string arrays ([366da5f](https://github.com/mikro-orm/mikro-orm/commit/366da5f420f2487fbc7d79fb662ec7db0931afc0)), closes [#3037](https://github.com/mikro-orm/mikro-orm/issues/3037)
* **schema:** fix diffing of indexes with too long inferred name ([01ba9ed](https://github.com/mikro-orm/mikro-orm/commit/01ba9edef9b202f324f6e580b0f55161ca927801)), closes [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)


### Bug Fixes

* **postgres:** do not ignore custom PK constraint names ([#2931](https://github.com/mikro-orm/mikro-orm/issues/2931)) ([24bf10e](https://github.com/mikro-orm/mikro-orm/commit/24bf10e668dd2d3b4b6cc4c52ed215fbffcc9d45))
* **postgres:** drop enum constraints only when the column was an enum ([76fef39](https://github.com/mikro-orm/mikro-orm/commit/76fef399ac01ffd22f5b652701e0769ae5161838))
* **postgres:** ensure correct column order in compound index/uniques ([321be79](https://github.com/mikro-orm/mikro-orm/commit/321be7992dd7007425fcf5277f09171639db0e28)), closes [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)
* **postgres:** fix pagination with order by bool column ([d5476cd](https://github.com/mikro-orm/mikro-orm/commit/d5476cd04b0eca4fb7c98d790013e6532fdd57fc)), closes [#2910](https://github.com/mikro-orm/mikro-orm/issues/2910)
* **postgres:** fix schema diffing on enums with case-sensitive names ([050875b](https://github.com/mikro-orm/mikro-orm/commit/050875b2f3582499440b14cda1cb04dd2883c6b8)), closes [#2938](https://github.com/mikro-orm/mikro-orm/issues/2938) [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)


### Features

* **schema:** support mysql 8 ([#2961](https://github.com/mikro-orm/mikro-orm/issues/2961)) ([acc960e](https://github.com/mikro-orm/mikro-orm/commit/acc960ebc694c61a959f48e89a9fee5513f6bdfa))





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)


### Bug Fixes

* **postgres:** fix pagination with order by UUID PK ([042626c](https://github.com/mikro-orm/mikro-orm/commit/042626c6aa1c1538ce65fb12db435b088e11e518)), closes [#2910](https://github.com/mikro-orm/mikro-orm/issues/2910)





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)


### Bug Fixes

* **core:** do not alias JSON conditions on update/delete queries ([5c0674e](https://github.com/mikro-orm/mikro-orm/commit/5c0674e61d97f9b143b48ae5314e5e7d1eeb4529)), closes [#2839](https://github.com/mikro-orm/mikro-orm/issues/2839)


### Features

* **core:** map check constraint failures to specific error type ([ebcbdff](https://github.com/mikro-orm/mikro-orm/commit/ebcbdfff43cdc4069fc1c70de516493782619123)), closes [#2836](https://github.com/mikro-orm/mikro-orm/issues/2836)





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)

**Note:** Version bump only for package @mikro-orm/postgresql





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
