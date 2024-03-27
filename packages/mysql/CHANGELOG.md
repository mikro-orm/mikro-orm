# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.1.12](https://github.com/mikro-orm/mikro-orm/compare/v6.1.11...v6.1.12) (2024-03-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.11](https://github.com/mikro-orm/mikro-orm/compare/v6.1.10...v6.1.11) (2024-03-18)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.10](https://github.com/mikro-orm/mikro-orm/compare/v6.1.9...v6.1.10) (2024-03-14)


### Bug Fixes

* **schema:** support compound index over JSON property and a regular column ([319df49](https://github.com/mikro-orm/mikro-orm/commit/319df499742475c68df3581f4863be649aa564d7)), closes [#5333](https://github.com/mikro-orm/mikro-orm/issues/5333)





## [6.1.9](https://github.com/mikro-orm/mikro-orm/compare/v6.1.8...v6.1.9) (2024-03-10)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.8](https://github.com/mikro-orm/mikro-orm/compare/v6.1.7...v6.1.8) (2024-03-06)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.7](https://github.com/mikro-orm/mikro-orm/compare/v6.1.6...v6.1.7) (2024-03-04)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.6](https://github.com/mikro-orm/mikro-orm/compare/v6.1.5...v6.1.6) (2024-02-28)


### Bug Fixes

* **mysql:** apply current context when fetching `auto_increment_increment` ([#5280](https://github.com/mikro-orm/mikro-orm/issues/5280)) ([c8021da](https://github.com/mikro-orm/mikro-orm/commit/c8021da020d7afa0f338319811a72ef4c1877d12)), closes [#5279](https://github.com/mikro-orm/mikro-orm/issues/5279)





## [6.1.5](https://github.com/mikro-orm/mikro-orm/compare/v6.1.4...v6.1.5) (2024-02-21)


### Bug Fixes

* **entity-generator:** optional and hidden properties get type option + string defaults ([#5264](https://github.com/mikro-orm/mikro-orm/issues/5264)) ([12d3b54](https://github.com/mikro-orm/mikro-orm/commit/12d3b54118035195f5ee0ee5665e37a7f2e37164)), closes [#5260](https://github.com/mikro-orm/mikro-orm/issues/5260)





## [6.1.4](https://github.com/mikro-orm/mikro-orm/compare/v6.1.3...v6.1.4) (2024-02-16)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.3](https://github.com/mikro-orm/mikro-orm/compare/v6.1.2...v6.1.3) (2024-02-13)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.2](https://github.com/mikro-orm/mikro-orm/compare/v6.1.1...v6.1.2) (2024-02-11)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.1.1](https://github.com/mikro-orm/mikro-orm/compare/v6.1.0...v6.1.1) (2024-02-10)

**Note:** Version bump only for package @mikro-orm/mysql





# [6.1.0](https://github.com/mikro-orm/mikro-orm/compare/v6.0.7...v6.1.0) (2024-02-04)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.7](https://github.com/mikro-orm/mikro-orm/compare/v6.0.6...v6.0.7) (2024-01-30)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.6](https://github.com/mikro-orm/mikro-orm/compare/v6.0.5...v6.0.6) (2024-01-29)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.5](https://github.com/mikro-orm/mikro-orm/compare/v6.0.4...v6.0.5) (2024-01-18)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.4](https://github.com/mikro-orm/mikro-orm/compare/v6.0.3...v6.0.4) (2024-01-15)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.3](https://github.com/mikro-orm/mikro-orm/compare/v6.0.2...v6.0.3) (2024-01-13)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.2](https://github.com/mikro-orm/mikro-orm/compare/v6.0.1...v6.0.2) (2024-01-09)

**Note:** Version bump only for package @mikro-orm/mysql





## [6.0.1](https://github.com/mikro-orm/mikro-orm/compare/v6.0.0...v6.0.1) (2024-01-08)

**Note:** Version bump only for package @mikro-orm/mysql





# [6.0.0](https://github.com/mikro-orm/mikro-orm/compare/v5.9.7...v6.0.0) (2024-01-08)


### Bug Fixes

* **core:** refactor mapping of `Date` properties ([#4391](https://github.com/mikro-orm/mikro-orm/issues/4391)) ([3a80369](https://github.com/mikro-orm/mikro-orm/commit/3a8036928ce36d31a2005b7e5133cf825b84a1b5)), closes [#4362](https://github.com/mikro-orm/mikro-orm/issues/4362) [#4360](https://github.com/mikro-orm/mikro-orm/issues/4360) [#1476](https://github.com/mikro-orm/mikro-orm/issues/1476)


### Features

* **core:** add `MikroORM.initSync()` helper ([#4166](https://github.com/mikro-orm/mikro-orm/issues/4166)) ([8b1a1fa](https://github.com/mikro-orm/mikro-orm/commit/8b1a1fa324db9227f5caae35fb2d8ab6a2b76e8a)), closes [#4164](https://github.com/mikro-orm/mikro-orm/issues/4164)
* **core:** add support for indexes on JSON properties ([#4735](https://github.com/mikro-orm/mikro-orm/issues/4735)) ([82c8629](https://github.com/mikro-orm/mikro-orm/commit/82c8629d5e96a8552890cd17eb485ca3020156dc)), closes [#1230](https://github.com/mikro-orm/mikro-orm/issues/1230)
* **core:** allow extending `EntityManager` ([#5064](https://github.com/mikro-orm/mikro-orm/issues/5064)) ([6c363e7](https://github.com/mikro-orm/mikro-orm/commit/6c363e7666ddf713ae601d1c9325c5b7f4523fbe))
* **core:** re-export the core package from all drivers ([#3816](https://github.com/mikro-orm/mikro-orm/issues/3816)) ([175c059](https://github.com/mikro-orm/mikro-orm/commit/175c05912d3f53eac0788ecd32002cb9a30e7cfa))
* **core:** remove static require calls ([#3814](https://github.com/mikro-orm/mikro-orm/issues/3814)) ([b58f476](https://github.com/mikro-orm/mikro-orm/commit/b58f4763995738cad11d08665b239443f9fb4499)), closes [#3743](https://github.com/mikro-orm/mikro-orm/issues/3743)
* **core:** require explicitly marked raw queries via `raw()` helper ([#4197](https://github.com/mikro-orm/mikro-orm/issues/4197)) ([9c1b205](https://github.com/mikro-orm/mikro-orm/commit/9c1b205f4cb9fede6330360982f23cf6ef37f346))
* **entity-generator:** allow generating scalar properties for FKs ([#4892](https://github.com/mikro-orm/mikro-orm/issues/4892)) ([abad6ca](https://github.com/mikro-orm/mikro-orm/commit/abad6ca9dcafaaf9319261b4ac116ef5ad6485b3)), closes [#4898](https://github.com/mikro-orm/mikro-orm/issues/4898)
* **mysql:** support `order by nulls first/last` ([#5021](https://github.com/mikro-orm/mikro-orm/issues/5021)) ([df75b24](https://github.com/mikro-orm/mikro-orm/commit/df75b2452a72adfc473772c37342c75e7e731d50)), closes [#5004](https://github.com/mikro-orm/mikro-orm/issues/5004)
* **sql:** add native support for generated columns ([#4884](https://github.com/mikro-orm/mikro-orm/issues/4884)) ([a928291](https://github.com/mikro-orm/mikro-orm/commit/a928291335f6867e02ed948afb5c9abd17975dba))





## [5.9.2](https://github.com/mikro-orm/mikro-orm/compare/v5.9.1...v5.9.2) (2023-11-02)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.9.1](https://github.com/mikro-orm/mikro-orm/compare/v5.9.0...v5.9.1) (2023-10-31)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.9.0](https://github.com/mikro-orm/mikro-orm/compare/v5.8.10...v5.9.0) (2023-10-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.10](https://github.com/mikro-orm/mikro-orm/compare/v5.8.9...v5.8.10) (2023-10-18)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.9](https://github.com/mikro-orm/mikro-orm/compare/v5.8.8...v5.8.9) (2023-10-15)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.8](https://github.com/mikro-orm/mikro-orm/compare/v5.8.7...v5.8.8) (2023-10-11)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.7](https://github.com/mikro-orm/mikro-orm/compare/v5.8.6...v5.8.7) (2023-10-05)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.6](https://github.com/mikro-orm/mikro-orm/compare/v5.8.5...v5.8.6) (2023-10-02)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.5](https://github.com/mikro-orm/mikro-orm/compare/v5.8.4...v5.8.5) (2023-09-30)


### Bug Fixes

* **core:** pin all internal dependencies ([f4868ed](https://github.com/mikro-orm/mikro-orm/commit/f4868edec97457e7c4548d887fb3ba23cf266c59)), closes [#4764](https://github.com/mikro-orm/mikro-orm/issues/4764)





## [5.8.4](https://github.com/mikro-orm/mikro-orm/compare/v5.8.3...v5.8.4) (2023-09-27)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.3](https://github.com/mikro-orm/mikro-orm/compare/v5.8.2...v5.8.3) (2023-09-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.2](https://github.com/mikro-orm/mikro-orm/compare/v5.8.1...v5.8.2) (2023-09-20)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.8.1](https://github.com/mikro-orm/mikro-orm/compare/v5.8.0...v5.8.1) (2023-09-12)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.8.0](https://github.com/mikro-orm/mikro-orm/compare/v5.7.14...v5.8.0) (2023-09-10)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.14](https://github.com/mikro-orm/mikro-orm/compare/v5.7.13...v5.7.14) (2023-07-27)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.13](https://github.com/mikro-orm/mikro-orm/compare/v5.7.12...v5.7.13) (2023-07-16)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.10](https://github.com/mikro-orm/mikro-orm/compare/v5.7.9...v5.7.10) (2023-05-23)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.9](https://github.com/mikro-orm/mikro-orm/compare/v5.7.8...v5.7.9) (2023-05-22)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.8](https://github.com/mikro-orm/mikro-orm/compare/v5.7.7...v5.7.8) (2023-05-21)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.6](https://github.com/mikro-orm/mikro-orm/compare/v5.7.5...v5.7.6) (2023-05-13)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.5](https://github.com/mikro-orm/mikro-orm/compare/v5.7.4...v5.7.5) (2023-05-09)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.4](https://github.com/mikro-orm/mikro-orm/compare/v5.7.3...v5.7.4) (2023-05-01)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.3](https://github.com/mikro-orm/mikro-orm/compare/v5.7.2...v5.7.3) (2023-04-28)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)


### Bug Fixes

* **core:** quote JSON property paths if they contain special characters ([a94bbce](https://github.com/mikro-orm/mikro-orm/commit/a94bbcec526fd372ef4d34be06fb7b79197e3878)), closes [#4264](https://github.com/mikro-orm/mikro-orm/issues/4264)





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)


### Bug Fixes

* **core:** rework JSON value processing ([#4194](https://github.com/mikro-orm/mikro-orm/issues/4194)) ([5594c46](https://github.com/mikro-orm/mikro-orm/commit/5594c469f05d2c1fc76f3cc1a388f5e7162f4e72)), closes [#4193](https://github.com/mikro-orm/mikro-orm/issues/4193)





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Reverts

* Revert "chore(release): v5.6.16 [skip ci]" ([49faac9](https://github.com/mikro-orm/mikro-orm/commit/49faac95c86d4c65fb6f66f76efa98ba221dd67e))
* Revert "chore(release): update internal dependencies to use tilde [skip ci]" ([381cba1](https://github.com/mikro-orm/mikro-orm/commit/381cba1fbf1141e1f754d25e1fd5748906425caa))





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)


### Bug Fixes

* **postgres:** use explicit schema in table identifier when altering comments ([#4123](https://github.com/mikro-orm/mikro-orm/issues/4123)) ([60d96de](https://github.com/mikro-orm/mikro-orm/commit/60d96de64de7f01a4d9baab485046c7f7f43ee7c)), closes [#4108](https://github.com/mikro-orm/mikro-orm/issues/4108)





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.11](https://github.com/mikro-orm/mikro-orm/compare/v5.6.10...v5.6.11) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.10](https://github.com/mikro-orm/mikro-orm/compare/v5.6.9...v5.6.10) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.9](https://github.com/mikro-orm/mikro-orm/compare/v5.6.8...v5.6.9) (2023-02-10)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.8](https://github.com/mikro-orm/mikro-orm/compare/v5.6.7...v5.6.8) (2023-01-25)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)


### Bug Fixes

* **core:** improve inference of driver exported `MikroORM.init()` ([497f274](https://github.com/mikro-orm/mikro-orm/commit/497f27451bbca37c7dd9222716257692724d3a0d))





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.6.1](https://github.com/mikro-orm/mikro-orm/compare/v5.6.0...v5.6.1) (2022-12-20)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)


### Bug Fixes

* **mysql:** respect `auto_increment_increment` when batch inserting ([516db6d](https://github.com/mikro-orm/mikro-orm/commit/516db6d3e97b6309d55e8a73a73bb85144af1196)), closes [#3828](https://github.com/mikro-orm/mikro-orm/issues/3828)


### Features

* **core:** ensure database exists automatically ([#3830](https://github.com/mikro-orm/mikro-orm/issues/3830)) ([f92da01](https://github.com/mikro-orm/mikro-orm/commit/f92da01101fbb212dec5d8648a51068da7122ea8))





## [5.5.3](https://github.com/mikro-orm/mikro-orm/compare/v5.5.2...v5.5.3) (2022-11-10)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)


### Features

* **core:** add `defineConfig` helper ([#3500](https://github.com/mikro-orm/mikro-orm/issues/3500)) ([67d3c68](https://github.com/mikro-orm/mikro-orm/commit/67d3c682bf11d8e9369e351da6e4ee20958b9581))
* **core:** add `MikroORM` and `Options` exports to each driver package ([#3499](https://github.com/mikro-orm/mikro-orm/issues/3499)) ([b68ed47](https://github.com/mikro-orm/mikro-orm/commit/b68ed47acac2da8b845ec33d6f30692b88c04acd))


### Performance Improvements

* **schema:** improve schema inspection speed in SQL drivers ([#3549](https://github.com/mikro-orm/mikro-orm/issues/3549)) ([74dc3b1](https://github.com/mikro-orm/mikro-orm/commit/74dc3b1aba07666911fb6fc74b55f6547b2c5b4b))





## [5.4.2](https://github.com/mikro-orm/mikro-orm/compare/v5.4.1...v5.4.2) (2022-09-12)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

* **core:** update to TypeScript 4.8 and improve `EntityDTO` type ([#3389](https://github.com/mikro-orm/mikro-orm/issues/3389)) ([f2957fb](https://github.com/mikro-orm/mikro-orm/commit/f2957fb14141294cfdffebf6cce6eaa937538cfb))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Features

* add support for full text searches ([#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)) ([8b8f140](https://github.com/mikro-orm/mikro-orm/commit/8b8f14071b92e91161a32aa272315a0ecce1bc0b))





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)


### Bug Fixes

* **mariadb:** backport some fixes from the mysql driver ([9a57386](https://github.com/mikro-orm/mikro-orm/commit/9a57386af03a268302b88aa70b20038911bd0cc3))





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)


### Bug Fixes

* **mysql:** handle mediumint PKs correctly ([0bbbe5c](https://github.com/mikro-orm/mikro-orm/commit/0bbbe5c7827875a88a199b94add9ae81776dce42)), closes [#3230](https://github.com/mikro-orm/mikro-orm/issues/3230)


### Features

* **core:** allow to adjust default type mapping ([ca8ce57](https://github.com/mikro-orm/mikro-orm/commit/ca8ce5721f0d547ceec1cf645443b6ae00deaf09)), closes [#3066](https://github.com/mikro-orm/mikro-orm/issues/3066)





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)


### Bug Fixes

* **schema:** fix diffing of indexes with too long inferred name ([01ba9ed](https://github.com/mikro-orm/mikro-orm/commit/01ba9edef9b202f324f6e580b0f55161ca927801)), closes [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)


### Bug Fixes

* **postgres:** do not ignore custom PK constraint names ([#2931](https://github.com/mikro-orm/mikro-orm/issues/2931)) ([24bf10e](https://github.com/mikro-orm/mikro-orm/commit/24bf10e668dd2d3b4b6cc4c52ed215fbffcc9d45))


### Features

* **schema:** support mysql 8 ([#2961](https://github.com/mikro-orm/mikro-orm/issues/2961)) ([acc960e](https://github.com/mikro-orm/mikro-orm/commit/acc960ebc694c61a959f48e89a9fee5513f6bdfa))





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)


### Bug Fixes

* **core:** do not alias JSON conditions on update/delete queries ([5c0674e](https://github.com/mikro-orm/mikro-orm/commit/5c0674e61d97f9b143b48ae5314e5e7d1eeb4529)), closes [#2839](https://github.com/mikro-orm/mikro-orm/issues/2839)


### Features

* **core:** map check constraint failures to specific error type ([ebcbdff](https://github.com/mikro-orm/mikro-orm/commit/ebcbdfff43cdc4069fc1c70de516493782619123)), closes [#2836](https://github.com/mikro-orm/mikro-orm/issues/2836)





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)


### Bug Fixes

* **schema:** escape table/column comments ([fff1581](https://github.com/mikro-orm/mikro-orm/commit/fff1581d7ff8f2ab5014e57d14c3938e120eb272)), closes [#2805](https://github.com/mikro-orm/mikro-orm/issues/2805)





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/mysql





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/mysql





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **core:** declare peer dependencies on driver packages ([1873e8c](https://github.com/mikro-orm/mikro-orm/commit/1873e8c4b9b5b9cb5979604f529ddd0cc6717042)), closes [#2110](https://github.com/mikro-orm/mikro-orm/issues/2110)


### Features

* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)


### Bug Fixes

* update mysql2 dependency to 2.3.2 ([#2376](https://github.com/mikro-orm/mikro-orm/issues/2376)) ([f9c417a](https://github.com/mikro-orm/mikro-orm/commit/f9c417aadedddc450c890020c0b213749fd51340))





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/mysql





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/mysql





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)

**Note:** Version bump only for package @mikro-orm/mysql





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/mysql





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)

**Note:** Version bump only for package @mikro-orm/mysql





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)


### Performance Improvements

* **core:** do not use `em.merge()` internally ([6a1a6d6](https://github.com/mikro-orm/mikro-orm/commit/6a1a6d68b65a20b8f1a78bf644844427f3b2dd1a))





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/mysql





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)

**Note:** Version bump only for package @mikro-orm/mysql
