# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
