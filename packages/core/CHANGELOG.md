# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/core





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)


### Bug Fixes

* **core:** detect ts-jest usage ([d54ccc2](https://github.com/mikro-orm/mikro-orm/commit/d54ccc2406829e86aae04400c562e9b489c9eae6))
* **core:** do not apply limit/offset to populate pivot table queries ([1f2d430](https://github.com/mikro-orm/mikro-orm/commit/1f2d43059673f59de1b48230f32d54cd40374d10)), closes [#2121](https://github.com/mikro-orm/mikro-orm/issues/2121)
* **core:** do not propagate mapToPk properties ([c37f42e](https://github.com/mikro-orm/mikro-orm/commit/c37f42ee6b6f96ea6d0eebb1ff99a36549492be5))





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)


### Bug Fixes

* **core:** fix clearing 1:m collections ([29cd17b](https://github.com/mikro-orm/mikro-orm/commit/29cd17b62cac23a9eea69219de27fd987f2f0ca6)), closes [#1914](https://github.com/mikro-orm/mikro-orm/issues/1914)
* **core:** fix M:N relations with custom type PKs ([ed399b1](https://github.com/mikro-orm/mikro-orm/commit/ed399b19ad08ba8df8effbc632bdf7bd943cf972)), closes [#1930](https://github.com/mikro-orm/mikro-orm/issues/1930)
* **core:** fix transaction context in nested transactions ([d88dd8b](https://github.com/mikro-orm/mikro-orm/commit/d88dd8bbc7dc3fad623a7ee37031cf534a955112)), closes [#1910](https://github.com/mikro-orm/mikro-orm/issues/1910)
* **core:** make entity helper property non-enumerable ([ce99eb2](https://github.com/mikro-orm/mikro-orm/commit/ce99eb2707466db14c121b6b039119d3f2ff2dd6))
* **core:** respect filters defined on base entities ([4657d05](https://github.com/mikro-orm/mikro-orm/commit/4657d0553d44e8530bdab0000183e4f48456f026)), closes [#1979](https://github.com/mikro-orm/mikro-orm/issues/1979)
* **embeddables:** allow using more than 10 embedded arrays ([ab8e706](https://github.com/mikro-orm/mikro-orm/commit/ab8e7063a42f45ed6c872913abafdce733d06edc)), closes [#1912](https://github.com/mikro-orm/mikro-orm/issues/1912)
* **postgres:** fix propagation of PKs with custom names ([9ce0c37](https://github.com/mikro-orm/mikro-orm/commit/9ce0c37223b75461bab040f0b98e4fd932b3a457)), closes [#1990](https://github.com/mikro-orm/mikro-orm/issues/1990)


### Features

* **cli:** only warn with `useTsNode: true` without ts-node available ([3aa3a6c](https://github.com/mikro-orm/mikro-orm/commit/3aa3a6ca5525abe1a5a122fbd3673cf2e39d2bee)), closes [#1957](https://github.com/mikro-orm/mikro-orm/issues/1957)





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)


### Bug Fixes

* **core:** fix extraction of child condition when populating 2 ([f22eec1](https://github.com/mikro-orm/mikro-orm/commit/f22eec18789bfa98f191b7162f0b89967a60fc94)), closes [#1882](https://github.com/mikro-orm/mikro-orm/issues/1882)
* **core:** fix hydrating of inlined embeddables via `em.create()` ([34391cd](https://github.com/mikro-orm/mikro-orm/commit/34391cd4b092ee5d19376b79b1468c7667c7016b)), closes [#1840](https://github.com/mikro-orm/mikro-orm/issues/1840)
* **core:** fix joined strategy with FK as PK ([adaa59b](https://github.com/mikro-orm/mikro-orm/commit/adaa59bbbc1e41a4194eb00f63a2d341bca2bfb3)), closes [#1902](https://github.com/mikro-orm/mikro-orm/issues/1902)
* **core:** propagate unsetting of 1:1 from inverse side ([903d484](https://github.com/mikro-orm/mikro-orm/commit/903d4847aa138388c95235c650b71601c5f2fe3c)), closes [#1872](https://github.com/mikro-orm/mikro-orm/issues/1872)
* **core:** reset current transaction before running `afterFlush` event ([539311e](https://github.com/mikro-orm/mikro-orm/commit/539311efe4d450c48fb0be2aff372bd5b64dd483)), closes [#1824](https://github.com/mikro-orm/mikro-orm/issues/1824)
* **core:** support getters in `EntitySchema` property types ([0b831d0](https://github.com/mikro-orm/mikro-orm/commit/0b831d09c03b36df8150235826c22a3a7d717a26)), closes [#1867](https://github.com/mikro-orm/mikro-orm/issues/1867)
* **core:** use tsconfig-paths loadConfig function ([#1854](https://github.com/mikro-orm/mikro-orm/issues/1854)) ([fbfb148](https://github.com/mikro-orm/mikro-orm/commit/fbfb14873002ae14bcadf2a7aa2f7e1ffb4acbdf)), closes [#1849](https://github.com/mikro-orm/mikro-orm/issues/1849)
* **mongo:** fix extraction of child condition when populating ([3cf30e1](https://github.com/mikro-orm/mikro-orm/commit/3cf30e1d93f2a225952c390daa7a2d05a5fcda7c)), closes [#1891](https://github.com/mikro-orm/mikro-orm/issues/1891)


### Features

* **core:** add PlainObject class that DTO's can extend to treat class as POJO ([#1837](https://github.com/mikro-orm/mikro-orm/issues/1837)) ([2e9c361](https://github.com/mikro-orm/mikro-orm/commit/2e9c36101f79b98898f43ba4f9149a78fafe37b6))





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)


### Bug Fixes

* **core:** allow using `updateNestedEntities` flag with collections ([db77e8b](https://github.com/mikro-orm/mikro-orm/commit/db77e8b9b9e7b3c29120333142f517b98b915755)), closes [#1717](https://github.com/mikro-orm/mikro-orm/issues/1717)
* **core:** convert custom types for `onCreate` & `onUpdate` ([34c1aa5](https://github.com/mikro-orm/mikro-orm/commit/34c1aa54bd8a79e1cf2c962fc1382c345aef6561)), closes [#1751](https://github.com/mikro-orm/mikro-orm/issues/1751)
* **core:** convert custom types for collection items in joined strategy ([bea37e0](https://github.com/mikro-orm/mikro-orm/commit/bea37e0e96db151ab054be600b03cc5c1f73789b)), closes [#1754](https://github.com/mikro-orm/mikro-orm/issues/1754)
* **core:** convert custom types on PKs in update and delete queries ([1b5270d](https://github.com/mikro-orm/mikro-orm/commit/1b5270d0328afc254e8fc908628e71719c3686fe)), closes [#1798](https://github.com/mikro-orm/mikro-orm/issues/1798)
* **core:** ensure correct casting in deep JSON queries with operators ([0441967](https://github.com/mikro-orm/mikro-orm/commit/04419671dfc3088e8f70fc65f76a5edd8b798656)), closes [#1734](https://github.com/mikro-orm/mikro-orm/issues/1734)
* **core:** fix `findAndCount` with populate ([61bc7cf](https://github.com/mikro-orm/mikro-orm/commit/61bc7cfd2621bd91fa4b3f21d7c6b78509903262)), closes [#1736](https://github.com/mikro-orm/mikro-orm/issues/1736)
* **core:** issue delete queries after extra/collection updates ([fc48890](https://github.com/mikro-orm/mikro-orm/commit/fc4889012808cb80e702d68d2c5bbc47e8e26ff9))
* **core:** support extending in `tsconfig.json` ([#1804](https://github.com/mikro-orm/mikro-orm/issues/1804)) ([6597552](https://github.com/mikro-orm/mikro-orm/commit/6597552db8cc8c8cf329fe5329bef719395f0293)), closes [#1792](https://github.com/mikro-orm/mikro-orm/issues/1792)
* **core:** use `$and` for merging of multiple filter conditions ([19f3f1d](https://github.com/mikro-orm/mikro-orm/commit/19f3f1d89cee416566e0f1e44350edfbcd3f34eb)), closes [#1776](https://github.com/mikro-orm/mikro-orm/issues/1776)
* **mongo:** validate usage of migrator and entity generator ([e41d1c5](https://github.com/mikro-orm/mikro-orm/commit/e41d1c5c77c4e80111cfd528ceab64e6cccf91cd)), closes [#1801](https://github.com/mikro-orm/mikro-orm/issues/1801)





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)


### Bug Fixes

* **core:** consider non-plain objects as PKs ([82387ad](https://github.com/mikro-orm/mikro-orm/commit/82387adb31b76b204cfa902058eeb71431fd56a8)), closes [#1721](https://github.com/mikro-orm/mikro-orm/issues/1721)
* **core:** fix `QueryFlag.PAGINATE` with joined loading strategy ([11aa0a3](https://github.com/mikro-orm/mikro-orm/commit/11aa0a34b75844efb405b14bf098e79a64f5be00))
* **core:** fix assigning embedded arrays ([9ee8f5c](https://github.com/mikro-orm/mikro-orm/commit/9ee8f5c6fd5da41bab2b75d5ab0164e92f8edb54)), closes [#1699](https://github.com/mikro-orm/mikro-orm/issues/1699)
* **core:** fix persisting complex composite keys in m:1 relations ([a932366](https://github.com/mikro-orm/mikro-orm/commit/a9323663f6cb52765e80c5933173c57758c2fc87)), closes [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **core:** fix querying by complex composite keys via entity instance ([b1b7894](https://github.com/mikro-orm/mikro-orm/commit/b1b78947283db4f863b897d34e4ee692f019e3ba)), closes [#1695](https://github.com/mikro-orm/mikro-orm/issues/1695)
* **core:** fix querying by JSON properties ([bc5e1a9](https://github.com/mikro-orm/mikro-orm/commit/bc5e1a91e0c9da4c969f4a47e811ec19ef54fcf4)), closes [#1673](https://github.com/mikro-orm/mikro-orm/issues/1673)
* **core:** fix state of entities from result cached ([8d0f076](https://github.com/mikro-orm/mikro-orm/commit/8d0f0762bd4521fdc960f0c7609265feb4f72d42)), closes [#1704](https://github.com/mikro-orm/mikro-orm/issues/1704)


### Features

* **core:** add `QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER` ([378e468](https://github.com/mikro-orm/mikro-orm/commit/378e4684441880977c565c1267f7c5aafd630ca8)), closes [#1660](https://github.com/mikro-orm/mikro-orm/issues/1660)





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)


### Bug Fixes

* **core:** ensure eager loaded relations are actually loaded ([897c7bd](https://github.com/mikro-orm/mikro-orm/commit/897c7bdafe745dc3370f5abc1f41e7128d030572)), closes [#1657](https://github.com/mikro-orm/mikro-orm/issues/1657)
* **discovery:** fix metadata validation of nested embeddables ([1d7c123](https://github.com/mikro-orm/mikro-orm/commit/1d7c123140709aa5fc1c870e62d57261924a72e0)), closes [#1616](https://github.com/mikro-orm/mikro-orm/issues/1616)
* **postgres:** improve extra updates logic for batch updates ([84b40bc](https://github.com/mikro-orm/mikro-orm/commit/84b40bcabae214274fd634065992ca8bd172272c)), closes [#1664](https://github.com/mikro-orm/mikro-orm/issues/1664)


### Features

* **postgres:** fix batch inserts with PKs with custom field name ([4500ca7](https://github.com/mikro-orm/mikro-orm/commit/4500ca79e884ddfb2ae53418a0c629343c66e17a)), closes [#1595](https://github.com/mikro-orm/mikro-orm/issues/1595)





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)


### Bug Fixes

* **core:** fix mapping of complex composite keys ([c0c658e](https://github.com/mikro-orm/mikro-orm/commit/c0c658eb125695bd1aed760aa95f2eadc1da8d43)), closes [#1624](https://github.com/mikro-orm/mikro-orm/issues/1624)
* **core:** support native bigint as primary key ([#1626](https://github.com/mikro-orm/mikro-orm/issues/1626)) ([bce7afe](https://github.com/mikro-orm/mikro-orm/commit/bce7afe539f9c866d6672bb8aeabd18425ea2a7a))





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)


### Bug Fixes

* **core:** create child entities that use Reference wrapper as new ([b14cdcb](https://github.com/mikro-orm/mikro-orm/commit/b14cdcbf1a5e6459c00a43b1066b56a0f3fb96eb)), closes [#1592](https://github.com/mikro-orm/mikro-orm/issues/1592)
* **core:** support `Collection.loadCount` for unidirectional M:N ([27e4dd2](https://github.com/mikro-orm/mikro-orm/commit/27e4dd2d93006f632e332e0e689a22ba61835acd)), closes [#1608](https://github.com/mikro-orm/mikro-orm/issues/1608)
* **core:** support nested embeddables inside embedded arrays ([088c65d](https://github.com/mikro-orm/mikro-orm/commit/088c65d816e7b6d2f76b0fbba737db91b1830c21)), closes [#1585](https://github.com/mikro-orm/mikro-orm/issues/1585)
* **core:** support sql fragments in custom types with joined strategy ([527579d](https://github.com/mikro-orm/mikro-orm/commit/527579d314dfafa880b2c3de465c085f74e92fb4)), closes [#1594](https://github.com/mikro-orm/mikro-orm/issues/1594)





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)


### Bug Fixes

* **core:** apply filters when populating M:N relations ([cd8330a](https://github.com/mikro-orm/mikro-orm/commit/cd8330a7a71caadf8fed1e97e7d1db28a1a17b27)), closes [#1232](https://github.com/mikro-orm/mikro-orm/issues/1232)
* **core:** do not process knex.ref() via custom types ([ba2ee70](https://github.com/mikro-orm/mikro-orm/commit/ba2ee70bc7e1a74102fd5e1a00c3f48bb0dcee58)), closes [#1538](https://github.com/mikro-orm/mikro-orm/issues/1538)
* **core:** do not update entity state when cascade merging ([6c74109](https://github.com/mikro-orm/mikro-orm/commit/6c741092ca33aea92fe8cdee4f948f3deaae5ef4)), closes [#1523](https://github.com/mikro-orm/mikro-orm/issues/1523)
* **core:** expose filters in some repository methods ([a1e1553](https://github.com/mikro-orm/mikro-orm/commit/a1e1553fa96188c0ec7e2e841611cbdfa2f9b01c)), closes [#1236](https://github.com/mikro-orm/mikro-orm/issues/1236)
* **core:** support operators in json property queries ([cb5e715](https://github.com/mikro-orm/mikro-orm/commit/cb5e7155b9b0cf52bc567ebce4dd501ea7273e47)), closes [#1487](https://github.com/mikro-orm/mikro-orm/issues/1487)
* **sqlite:** ensure booleans are hydrated as booleans ([4e36df2](https://github.com/mikro-orm/mikro-orm/commit/4e36df284bca80ecade04dbc720939f1788102f0)), closes [#1553](https://github.com/mikro-orm/mikro-orm/issues/1553)
* **sqlite:** fix calling `em.find()` from hooks ([fec3285](https://github.com/mikro-orm/mikro-orm/commit/fec3285ba7224847617da2249e53d85bd2035b22)), closes [#1503](https://github.com/mikro-orm/mikro-orm/issues/1503)


### Features

* **cli:** allow mikro-orm config to return Promise ([#1495](https://github.com/mikro-orm/mikro-orm/issues/1495)) ([629aae9](https://github.com/mikro-orm/mikro-orm/commit/629aae9e9036e3045e9d33a9ce42bef4c87a2aa6))
* **core:** add `Collection.matching()` method to allow pagination ([#1502](https://github.com/mikro-orm/mikro-orm/issues/1502)) ([1ad3448](https://github.com/mikro-orm/mikro-orm/commit/1ad34488b6ac0c51a75aea9ff505598ea776960e)), closes [#334](https://github.com/mikro-orm/mikro-orm/issues/334)
* **core:** add close method to `CacheAdapter` interface ([2795b5a](https://github.com/mikro-orm/mikro-orm/commit/2795b5ab13fa16b5d865fe9dd4f20273cba4a110)), closes [#1509](https://github.com/mikro-orm/mikro-orm/issues/1509)
* **core:** allow updating nested 1:1 and m:1 references with EntityAssigner ([#1535](https://github.com/mikro-orm/mikro-orm/issues/1535)) ([c1dd048](https://github.com/mikro-orm/mikro-orm/commit/c1dd048dea8fc4bec112092fb88bd10eddb52f55))
* **core:** infer configuration from environment variables ([#1498](https://github.com/mikro-orm/mikro-orm/issues/1498)) ([1ff07a7](https://github.com/mikro-orm/mikro-orm/commit/1ff07a76b2a5e6c9c958586e4bb7a6a2c270e1ab)), closes [#1472](https://github.com/mikro-orm/mikro-orm/issues/1472)
* **core:** support custom types in embeddables ([53305d3](https://github.com/mikro-orm/mikro-orm/commit/53305d3d649f90dbd0d0338e10dfb8e7f8d9c89e)), closes [#1519](https://github.com/mikro-orm/mikro-orm/issues/1519)
* **core:** support embeddable arrays ([#1496](https://github.com/mikro-orm/mikro-orm/issues/1496)) ([57b605c](https://github.com/mikro-orm/mikro-orm/commit/57b605ccef8c8104db73270effa62d85fd1ed223)), closes [#1369](https://github.com/mikro-orm/mikro-orm/issues/1369)
* **reflection:** support enum arrays and custom types ([dc65527](https://github.com/mikro-orm/mikro-orm/commit/dc65527913acd16ce4588c05deffaf3782782d83)), closes [#1497](https://github.com/mikro-orm/mikro-orm/issues/1497)
* **validation:** validate correct reference types ([381b5b9](https://github.com/mikro-orm/mikro-orm/commit/381b5b9617ef1a4320a7e122b1e5498a3d5af7ad)), closes [#1568](https://github.com/mikro-orm/mikro-orm/issues/1568)





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)


### Bug Fixes

* **core:** allow extending existing custom types ([cc34d7e](https://github.com/mikro-orm/mikro-orm/commit/cc34d7e1eef10902f82b913bb1a271b2281f25c7)), closes [#1442](https://github.com/mikro-orm/mikro-orm/issues/1442)
* **core:** do not define dynamic id property if not needed ([e13188f](https://github.com/mikro-orm/mikro-orm/commit/e13188fc8aa62498e69dfa24fe3787f2ba9d2eab)), closes [#1444](https://github.com/mikro-orm/mikro-orm/issues/1444)


### Performance Improvements

* **core:** improve processing of 1:m relations ([#1450](https://github.com/mikro-orm/mikro-orm/issues/1450)) ([f5c1818](https://github.com/mikro-orm/mikro-orm/commit/f5c18183ea03d7360d298a95e5848aa698c25e1b))





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)


### Bug Fixes

* **core:** ignore falsy values in `Collection.remove()` ([3447039](https://github.com/mikro-orm/mikro-orm/commit/3447039572956004472cf5ea31b695df28916dc1)), closes [#1408](https://github.com/mikro-orm/mikro-orm/issues/1408)
* **core:** propagate custom join columns to inverse side (m:n) ([3f0a7b2](https://github.com/mikro-orm/mikro-orm/commit/3f0a7b2ecbd00630d2bad0d8c3d1a734ed260d1c)), closes [#1429](https://github.com/mikro-orm/mikro-orm/issues/1429)
* **core:** respect `mergeObjects` only for POJOs in assign helper ([c5bbcee](https://github.com/mikro-orm/mikro-orm/commit/c5bbcee3aaccd4a76763a23f86d9d9367aabc4bd)), closes [#1406](https://github.com/mikro-orm/mikro-orm/issues/1406)
* **core:** use generic comparison for object properties ([e9073cf](https://github.com/mikro-orm/mikro-orm/commit/e9073cfed9c13fc362017f0913b46d7e461c9c4b)), closes [#1395](https://github.com/mikro-orm/mikro-orm/issues/1395)





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)


### Features

* **core:** allow querying by JSON properties ([#1384](https://github.com/mikro-orm/mikro-orm/issues/1384)) ([69c2493](https://github.com/mikro-orm/mikro-orm/commit/69c24934db478eb07d9c88541527b7be40a26483)), closes [#1359](https://github.com/mikro-orm/mikro-orm/issues/1359) [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)
* **core:** allow using SQL expressions with custom types ([#1389](https://github.com/mikro-orm/mikro-orm/issues/1389)) ([83fe6ea](https://github.com/mikro-orm/mikro-orm/commit/83fe6ea11810e045f5f793ad0f084e3fdf64812a)), closes [#735](https://github.com/mikro-orm/mikro-orm/issues/735)





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)


### Bug Fixes

* **core:** allow assigning null to embeddable property ([#1356](https://github.com/mikro-orm/mikro-orm/issues/1356)) ([f3a091e](https://github.com/mikro-orm/mikro-orm/commit/f3a091ec1afcd9e9f058f59839778171fac73169))
* **core:** fix `eager` relations with joined loading strategy ([ba94e28](https://github.com/mikro-orm/mikro-orm/commit/ba94e2884fa4d99882980db144d6fd4c07bd6754)), closes [#1352](https://github.com/mikro-orm/mikro-orm/issues/1352)
* **sti:** respect child types when querying for STI entity ([df298a1](https://github.com/mikro-orm/mikro-orm/commit/df298a12c52675d0b3a0a5040ae3e16cd2ceedd4)), closes [#1252](https://github.com/mikro-orm/mikro-orm/issues/1252)
* **typing:** improve handling of array properties ([9d82ffb](https://github.com/mikro-orm/mikro-orm/commit/9d82ffb77f13163a80e9b87c552a5640837fdb92)), closes [#1077](https://github.com/mikro-orm/mikro-orm/issues/1077)





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)


### Bug Fixes

* **core:** `em.create()` should not mutate the input object ([b83b211](https://github.com/mikro-orm/mikro-orm/commit/b83b21132fe8c7188cb881e11c80b5ad966421ef)), closes [#1294](https://github.com/mikro-orm/mikro-orm/issues/1294)
* **core:** allow using `lazy` flag with formulas ([4b2b5ce](https://github.com/mikro-orm/mikro-orm/commit/4b2b5ce9ea4587703fea04e6047e03814b3c65b4)), closes [#1229](https://github.com/mikro-orm/mikro-orm/issues/1229)
* **core:** always make new entity snapshot ([1dacf1e](https://github.com/mikro-orm/mikro-orm/commit/1dacf1edecced98e20e97c2bef271537c6a3cebf)), closes [#1334](https://github.com/mikro-orm/mikro-orm/issues/1334)
* **core:** apply discriminator condition when loading STI entities ([9c62370](https://github.com/mikro-orm/mikro-orm/commit/9c623706695c21ef035799c00edd2c1aa2b12170)), closes [#1252](https://github.com/mikro-orm/mikro-orm/issues/1252)
* **core:** clear inverse references to removed entities ([3a1d927](https://github.com/mikro-orm/mikro-orm/commit/3a1d927b51185407e33ae78ca6026b70234ad1b4)), closes [#1278](https://github.com/mikro-orm/mikro-orm/issues/1278)
* **core:** fix creating entity graph from deeply nested structures ([833d246](https://github.com/mikro-orm/mikro-orm/commit/833d2463132a52d6ebd60c72a8a941f1db552dcb)), closes [#1326](https://github.com/mikro-orm/mikro-orm/issues/1326)
* **core:** fix custom types with joined loading strategy ([f64e657](https://github.com/mikro-orm/mikro-orm/commit/f64e6571b037e46487ed33f9b4e9326ebfaab998)), closes [#1237](https://github.com/mikro-orm/mikro-orm/issues/1237)
* **core:** fix nullable embeddables in object mode ([bb8dbce](https://github.com/mikro-orm/mikro-orm/commit/bb8dbcee75428678ce363ae8f0d4ad4516f14c61)), closes [#1296](https://github.com/mikro-orm/mikro-orm/issues/1296)
* **core:** improve custom sql expression detection ([cf8c5cd](https://github.com/mikro-orm/mikro-orm/commit/cf8c5cd3653600e90034e82c8095828e78dd9270)), closes [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)
* **core:** make PK property of `Reference` required ([5e1cf23](https://github.com/mikro-orm/mikro-orm/commit/5e1cf23c5d630359d48005e71719c1c013524bb5))
* **core:** respect context when working with filter params ([97ed314](https://github.com/mikro-orm/mikro-orm/commit/97ed3148c827d99c405b0a9500fd7dd696d1a493)), closes [#1312](https://github.com/mikro-orm/mikro-orm/issues/1312)
* **core:** support FK as PK in `Collection.getIdentifiers()` ([#1225](https://github.com/mikro-orm/mikro-orm/issues/1225)) ([f8024c9](https://github.com/mikro-orm/mikro-orm/commit/f8024c9fc2315efddb398e34f3e358cdf0fd04a6)), closes [#1224](https://github.com/mikro-orm/mikro-orm/issues/1224)


### Features

* **core:** add support for nested embedddables ([#1311](https://github.com/mikro-orm/mikro-orm/issues/1311)) ([aee2abd](https://github.com/mikro-orm/mikro-orm/commit/aee2abd4cdb9f8ded0920f2786fd80a32cef41f7)), closes [#1017](https://github.com/mikro-orm/mikro-orm/issues/1017)
* **core:** add support for nested partial loading ([#1306](https://github.com/mikro-orm/mikro-orm/issues/1306)) ([3878e6b](https://github.com/mikro-orm/mikro-orm/commit/3878e6b672f02d533e15d0b576cac4ea45a4d74a)), closes [#221](https://github.com/mikro-orm/mikro-orm/issues/221)
* **core:** allow disabling identity map and change set tracking ([#1307](https://github.com/mikro-orm/mikro-orm/issues/1307)) ([03da184](https://github.com/mikro-orm/mikro-orm/commit/03da1845aab53b07a3d2cc008945158163d3107a)), closes [#1267](https://github.com/mikro-orm/mikro-orm/issues/1267)
* **core:** allow using native private properties ([fc35c22](https://github.com/mikro-orm/mikro-orm/commit/fc35c22094f4b6f5301beb72fe73feff25291905)), closes [#1226](https://github.com/mikro-orm/mikro-orm/issues/1226)
* **core:** implement transaction lifecycle hooks ([#1213](https://github.com/mikro-orm/mikro-orm/issues/1213)) ([0f81ff1](https://github.com/mikro-orm/mikro-orm/commit/0f81ff12d316cec3fcd8e6de623232458799a4f6)), closes [#1175](https://github.com/mikro-orm/mikro-orm/issues/1175)
* **core:** support handling `Set` as array-like input ([#1277](https://github.com/mikro-orm/mikro-orm/issues/1277)) ([2945b8c](https://github.com/mikro-orm/mikro-orm/commit/2945b8cc9345deb7af748cf61378e16a8483b973))
* **mysql:** allow specifying collation globally ([cd95572](https://github.com/mikro-orm/mikro-orm/commit/cd95572675997fba40e2141258528fc0b19cd1f5)), closes [#1012](https://github.com/mikro-orm/mikro-orm/issues/1012)


### Performance Improvements

* **core:** make `IdentityMap` iterable ([e13757a](https://github.com/mikro-orm/mikro-orm/commit/e13757a0510d576561b124f1072c314c864ae443))





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)


### Bug Fixes

* **core:** hydrate embeddable scalar properties ([#1192](https://github.com/mikro-orm/mikro-orm/issues/1192)) ([eb73093](https://github.com/mikro-orm/mikro-orm/commit/eb73093fe2df2f2c3d9cd6c7d23b648d67de0683))
* **core:** validate overridden properties by embeddables ([#1172](https://github.com/mikro-orm/mikro-orm/issues/1172)) ([6629a08](https://github.com/mikro-orm/mikro-orm/commit/6629a0829a921efd249707766a47a472a8f8f4d7)), closes [#1169](https://github.com/mikro-orm/mikro-orm/issues/1169)
* **sql:** ensure correct order of results when fetch joining ([7453816](https://github.com/mikro-orm/mikro-orm/commit/74538166c4cd9ff9fcd77689f946a0e1cb2f1f04)), closes [#1171](https://github.com/mikro-orm/mikro-orm/issues/1171)


### Features

* **core:** auto-discover base entities ([33bda07](https://github.com/mikro-orm/mikro-orm/commit/33bda07082787d996719535c08fa569d052e0158))





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)


### Bug Fixes

* **core:** fix em.create() with nested relations ([dde119f](https://github.com/mikro-orm/mikro-orm/commit/dde119f7483971d32a9def2bf10dce4e25806fd3)), closes [#1150](https://github.com/mikro-orm/mikro-orm/issues/1150)
* **core:** fix populating 1:m where the owner uses `mapToPk` ([85a7c9d](https://github.com/mikro-orm/mikro-orm/commit/85a7c9dbcfd17922efcececd7619ddcc58aed87f)), closes [#1128](https://github.com/mikro-orm/mikro-orm/issues/1128)
* **core:** fix propagating of changes to 1:m with `mapToPk` ([b38df3e](https://github.com/mikro-orm/mikro-orm/commit/b38df3e2a1fb2470365569557a0a9ac953dcf11d)), closes [#1128](https://github.com/mikro-orm/mikro-orm/issues/1128)
* **core:** fix snapshotting of composite properties ([b5f19f2](https://github.com/mikro-orm/mikro-orm/commit/b5f19f2fff9d31138e23c12dc430249ca2854026)), closes [#1079](https://github.com/mikro-orm/mikro-orm/issues/1079)
* **schema:** allow using const enums ([e02ffea](https://github.com/mikro-orm/mikro-orm/commit/e02ffea5669ac50245a6616b930e7d6532f28486)), closes [#1096](https://github.com/mikro-orm/mikro-orm/issues/1096)
* **sqlite:** fix querying by 1:1 relation with composite PK ([0da6347](https://github.com/mikro-orm/mikro-orm/commit/0da63476f4d0226d0d4bcee793ef143f6ecf475b)), closes [#1157](https://github.com/mikro-orm/mikro-orm/issues/1157)





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)


### Bug Fixes

* **core:** disable propagation when `mapToPk` is used ([6f6a204](https://github.com/mikro-orm/mikro-orm/commit/6f6a204b6a73a6bbfea65f5511c5fe1f29a9a199)), closes [#1124](https://github.com/mikro-orm/mikro-orm/issues/1124)
* **core:** do not use custom toJSON when storing result cache ([86ec3b3](https://github.com/mikro-orm/mikro-orm/commit/86ec3b3a543a1091d5ec500287e9ee870ddde186))
* **core:** fix comparison of object properties and bigints ([2119a65](https://github.com/mikro-orm/mikro-orm/commit/2119a65f29dcb583a3a28e8dadb3c68240634632)), closes [#1117](https://github.com/mikro-orm/mikro-orm/issues/1117)
* **core:** fix computing changesets with reference as PK ([5504436](https://github.com/mikro-orm/mikro-orm/commit/55044366242f6592565f85ad035e059ec3081ee0)), closes [#1111](https://github.com/mikro-orm/mikro-orm/issues/1111)
* **core:** fix serialization of properties with same name ([d4d9c48](https://github.com/mikro-orm/mikro-orm/commit/d4d9c48bd17ad2cca5b9c134c2ca433040bf32ee)), closes [#1115](https://github.com/mikro-orm/mikro-orm/issues/1115)
* **sql:** allow using raw value for JSON prop with custom type ([2a17c59](https://github.com/mikro-orm/mikro-orm/commit/2a17c59cf2db4c6c211ca80ad9c82d64c94289df)), closes [#1112](https://github.com/mikro-orm/mikro-orm/issues/1112)





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)


### Bug Fixes

* **core:** assign embedded properties from class objects ([#1087](https://github.com/mikro-orm/mikro-orm/issues/1087)) ([c2b4972](https://github.com/mikro-orm/mikro-orm/commit/c2b49726ad601516c36e8c289c1ef6a358d54780)), closes [#1083](https://github.com/mikro-orm/mikro-orm/issues/1083)
* **core:** rework unique property extra updates ([bd19d03](https://github.com/mikro-orm/mikro-orm/commit/bd19d038879e6c95768703e78ed9f4236deea48a)), closes [#1025](https://github.com/mikro-orm/mikro-orm/issues/1025) [#1084](https://github.com/mikro-orm/mikro-orm/issues/1084)
* **ts-morph:** fix discovery of `IdentifiedReference` with ts-morph ([d94bd91](https://github.com/mikro-orm/mikro-orm/commit/d94bd9106948d2ca583aaff9125486987ffc5243)), closes [#1088](https://github.com/mikro-orm/mikro-orm/issues/1088)





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** always check remove stack when cascade persisting ([a9a1bee](https://github.com/mikro-orm/mikro-orm/commit/a9a1bee55dcdaa3b0804a95643e44660b0a62a83)), closes [#1003](https://github.com/mikro-orm/mikro-orm/issues/1003)
* **core:** do not override child class properties ([#1000](https://github.com/mikro-orm/mikro-orm/issues/1000)) ([6d91f1f](https://github.com/mikro-orm/mikro-orm/commit/6d91f1f4dfb61694511b1e65b8b0e8da8e70291d))
* **core:** ensure correct grouping and commit order for STI ([8b77525](https://github.com/mikro-orm/mikro-orm/commit/8b7752545654b5a60cbc6eaf4f12e0b91e4d5cea)), closes [#845](https://github.com/mikro-orm/mikro-orm/issues/845)
* **core:** ensure correct handling of empty arrays ([c9afabb](https://github.com/mikro-orm/mikro-orm/commit/c9afabb5819a05006d0c13ed3de51b43d2052abc))
* **core:** ensure correct handling of empty arrays ([1c4ba75](https://github.com/mikro-orm/mikro-orm/commit/1c4ba75bd7167a71d986c3794eea12dd8c162fb3))
* **core:** ensure we store the right value for bigint PKs ([7d7a1c9](https://github.com/mikro-orm/mikro-orm/commit/7d7a1c9881125930e08c096601f2816db50fab6e)), closes [#1038](https://github.com/mikro-orm/mikro-orm/issues/1038)
* **core:** fix cascading when assigning collections ([d40fcfa](https://github.com/mikro-orm/mikro-orm/commit/d40fcfa772efa9f84484293a3b24da1cbd085add)), closes [#1048](https://github.com/mikro-orm/mikro-orm/issues/1048)
* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)
* **discovery:** allow using absolute paths in `entities` ([584854c](https://github.com/mikro-orm/mikro-orm/commit/584854cca4b0a0bf96902524f8c6d171317e7d98)), closes [#1073](https://github.com/mikro-orm/mikro-orm/issues/1073)
* **schema:** pass entity name to `joinKeyColumnName()` ([fe4b7bd](https://github.com/mikro-orm/mikro-orm/commit/fe4b7bd30eebeb8b94be9648b4583b1047a62b55)), closes [#1026](https://github.com/mikro-orm/mikro-orm/issues/1026)
* **sql:** convert custom types at query builder level ([83d3ab2](https://github.com/mikro-orm/mikro-orm/commit/83d3ab27f63216aab385500ab73639fa39dcfe90))
* **sql:** do not batch update unique properties ([87b722a](https://github.com/mikro-orm/mikro-orm/commit/87b722a792e8a49c4ffa52e5b21444748c48b224)), closes [#1025](https://github.com/mikro-orm/mikro-orm/issues/1025)
* **sql:** inline array parameters when formatting queries ([a21735f](https://github.com/mikro-orm/mikro-orm/commit/a21735f85f3a9de533212151bee8df55810b25b1)), closes [#1021](https://github.com/mikro-orm/mikro-orm/issues/1021)
* **sql:** take snapshots of collections populated via joined strategy ([5f3288a](https://github.com/mikro-orm/mikro-orm/commit/5f3288af5761f1cba12098a26532ce602c241af1)), closes [#1041](https://github.com/mikro-orm/mikro-orm/issues/1041)
* **validation:** don't validate inherited STI props ([#998](https://github.com/mikro-orm/mikro-orm/issues/998)) ([63d1f57](https://github.com/mikro-orm/mikro-orm/commit/63d1f57f467f9d5c6d12b1c0fa212a922d0f6907)), closes [#997](https://github.com/mikro-orm/mikro-orm/issues/997)


### Features

* **core:** allow calling `Collection.set()` on not initialized collections ([1d0bb85](https://github.com/mikro-orm/mikro-orm/commit/1d0bb85598536d3e11e39a9f6cc5c6c919c8aa22)), closes [#1048](https://github.com/mikro-orm/mikro-orm/issues/1048)
* **core:** allow extending embeddables ([#1051](https://github.com/mikro-orm/mikro-orm/issues/1051)) ([89d3250](https://github.com/mikro-orm/mikro-orm/commit/89d325061aaa600e479009ac2bc59304ca46aa4b)), closes [#1049](https://github.com/mikro-orm/mikro-orm/issues/1049)
* **core:** allow mapping `null` to `undefined` optionally ([55de84e](https://github.com/mikro-orm/mikro-orm/commit/55de84ecabc5e3916f8c8c178f56834f7ec75b2f)), closes [#1019](https://github.com/mikro-orm/mikro-orm/issues/1019)
* **core:** allow using multiple ORM instances with RequestContext ([e11040d](https://github.com/mikro-orm/mikro-orm/commit/e11040d2b11ab97f2264f002908ea3dfcf514773)), closes [#872](https://github.com/mikro-orm/mikro-orm/issues/872)
* **core:** maintain transaction context automatically ([#959](https://github.com/mikro-orm/mikro-orm/issues/959)) ([e0064e4](https://github.com/mikro-orm/mikro-orm/commit/e0064e44acb05eb559dcbd47ffff8dafb814149f))
* **count:** initial implementation of loadCount ([#955](https://github.com/mikro-orm/mikro-orm/issues/955)) ([3371415](https://github.com/mikro-orm/mikro-orm/commit/3371415f7af82ce2996954d623e0bd377c81b41b)), closes [#949](https://github.com/mikro-orm/mikro-orm/issues/949)
* **query-builder:** allow mapping of complex joined results ([#988](https://github.com/mikro-orm/mikro-orm/issues/988)) ([60dd2d8](https://github.com/mikro-orm/mikro-orm/commit/60dd2d8e951dd94946888765a5e81f4f16c3e7c1)), closes [#932](https://github.com/mikro-orm/mikro-orm/issues/932)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)


### Bug Fixes

* **core:** ensure global filters are enabled by default ([#952](https://github.com/mikro-orm/mikro-orm/issues/952)) ([28124fb](https://github.com/mikro-orm/mikro-orm/commit/28124fb43be9dc4c2f4d1d6b88406dbce33375a9))
* **core:** rework access to target entity metadata from collections ([10ca335](https://github.com/mikro-orm/mikro-orm/commit/10ca335fc220699e3aa7ced828cd7d6fb1bc821f)), closes [#956](https://github.com/mikro-orm/mikro-orm/issues/956)





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)


### Bug Fixes

* **core:** fix mapping of params with custom types ([e5049b1](https://github.com/mikro-orm/mikro-orm/commit/e5049b192d13ea41747e1340715e288084a0015d)), closes [#940](https://github.com/mikro-orm/mikro-orm/issues/940)
* **core:** fix wrongly inferred 1:m metadata ([82f7f0a](https://github.com/mikro-orm/mikro-orm/commit/82f7f0a7e003e81255ccb74e435e9ac920db8cca)), closes [#936](https://github.com/mikro-orm/mikro-orm/issues/936)


### Features

* **core:** add MetadataStorage.clear() to clear the global storage ([c6fa0f4](https://github.com/mikro-orm/mikro-orm/commit/c6fa0f49acebd452368700d2c9ff813f221da530)), closes [#936](https://github.com/mikro-orm/mikro-orm/issues/936)





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)


### Bug Fixes

* **core:** make sure refreshing of loaded entities works ([45f3f42](https://github.com/mikro-orm/mikro-orm/commit/45f3f42bfa010a9691cbc50b0a957e4b8ec3b0f2))
* **core:** validate object embeddable values on flush ([cd38e17](https://github.com/mikro-orm/mikro-orm/commit/cd38e17e993e763fba3fed68cdc4ecedd9960e1c)), closes [#466](https://github.com/mikro-orm/mikro-orm/issues/466)
* **core:** validate the object passed to `em.persist()` ([90678c2](https://github.com/mikro-orm/mikro-orm/commit/90678c2a2a4896608e7bee727c262212f9c92693))





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)


### Bug Fixes

* **core:** fix propagation of conditions with operators ([05acd34](https://github.com/mikro-orm/mikro-orm/commit/05acd34b89bdce50d4e759a21400c913f5e4c383))
* **core:** reset the working state of UoW after failures ([6423cf7](https://github.com/mikro-orm/mikro-orm/commit/6423cf7fc705ed4d6f3f00eca9c8f2e73602ae9a))
* **core:** update umzug types to 2.3 ([4668e78](https://github.com/mikro-orm/mikro-orm/commit/4668e78d1c900d1718625364b603dda1b707dd82)), closes [#926](https://github.com/mikro-orm/mikro-orm/issues/926)
* **core:** use entity ctors also when all PKs are provided in `em.create()` ([b45b60b](https://github.com/mikro-orm/mikro-orm/commit/b45b60b328821950d4198fa12813bea26e0b6f2f)), closes [#924](https://github.com/mikro-orm/mikro-orm/issues/924)
* **schema:** fix automatic discriminator map values in STI ([7cd3c6f](https://github.com/mikro-orm/mikro-orm/commit/7cd3c6f092afd11089ce72672dfb389dec345fec)), closes [#923](https://github.com/mikro-orm/mikro-orm/issues/923)


### Features

* **core:** add basic (in-memory) result caching ([2f8253d](https://github.com/mikro-orm/mikro-orm/commit/2f8253d9db9ae0c469e2dcf976aa20546f3b9b8c))
* **core:** add native support for enum arrays ([9053450](https://github.com/mikro-orm/mikro-orm/commit/9053450634a606356b609ff64fc2a0da026ab730)), closes [#476](https://github.com/mikro-orm/mikro-orm/issues/476)
* **core:** allow defining multiple entities in single file ([e3ab336](https://github.com/mikro-orm/mikro-orm/commit/e3ab33699b116e25e09a7449589db7955899c8ac)), closes [#922](https://github.com/mikro-orm/mikro-orm/issues/922)
* **core:** allow mapping m:1/1:1 relations to PK ([#921](https://github.com/mikro-orm/mikro-orm/issues/921)) ([894f17e](https://github.com/mikro-orm/mikro-orm/commit/894f17e4fa24ac45d7872bd5e52ae9e9fbf014df)), closes [#750](https://github.com/mikro-orm/mikro-orm/issues/750)
* **core:** allow storing embeddables as objects ([#927](https://github.com/mikro-orm/mikro-orm/issues/927)) ([ba881e6](https://github.com/mikro-orm/mikro-orm/commit/ba881e6257dd5d72bb10ca402b0322f7dbbda69c)), closes [#906](https://github.com/mikro-orm/mikro-orm/issues/906)
* **serialization:** rework handling of cycles ([1a2d026](https://github.com/mikro-orm/mikro-orm/commit/1a2d026c13be8a62c77bbae4ec6e3519b1c7209f))





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Bug Fixes

* **core:** allow defining PKs inside `@BeforeCreate()` ([0a2299f](https://github.com/mikro-orm/mikro-orm/commit/0a2299f78eea99c5a2af400f4e93938467925e3e)), closes [#893](https://github.com/mikro-orm/mikro-orm/issues/893) [#892](https://github.com/mikro-orm/mikro-orm/issues/892)
* **core:** do not cascade remove FK primary keys ([37415ce](https://github.com/mikro-orm/mikro-orm/commit/37415ce7c0d519b3145122045acfb7d1c85a65f4)), closes [#915](https://github.com/mikro-orm/mikro-orm/issues/915)
* **core:** do not fire onInit event twice ([9485f48](https://github.com/mikro-orm/mikro-orm/commit/9485f48978e630126125e411ebfb83dedae2963e)), closes [#900](https://github.com/mikro-orm/mikro-orm/issues/900)
* **core:** ensure custom types are comparable ([3714a51](https://github.com/mikro-orm/mikro-orm/commit/3714a51cd3aac94726194255ec8dc9128c145cdb)), closes [#864](https://github.com/mikro-orm/mikro-orm/issues/864)
* **core:** fix detection of custom type PKs with object value ([61095ce](https://github.com/mikro-orm/mikro-orm/commit/61095ce957f2d8b39ed83dbee14e4db289d0baac)), closes [#910](https://github.com/mikro-orm/mikro-orm/issues/910)
* **core:** fix mapping of returning zero values in embeddables ([e42ae4a](https://github.com/mikro-orm/mikro-orm/commit/e42ae4ad5ae3ca7a6895a7debac6ac4ce7752a19)), closes [#905](https://github.com/mikro-orm/mikro-orm/issues/905)
* **core:** skip index initialization for abstract entities ([#881](https://github.com/mikro-orm/mikro-orm/issues/881)) ([a2d381f](https://github.com/mikro-orm/mikro-orm/commit/a2d381fe03353dad40e8fe78bd443fc6e23de02c))
* **mongo:** filter by serialized PK inside group condition ([a492a64](https://github.com/mikro-orm/mikro-orm/commit/a492a64e08fc4fac5b447d0928bbc6d7b453e29f)), closes [#908](https://github.com/mikro-orm/mikro-orm/issues/908)
* **schema:** make STI metadata discovery order independent ([f477a48](https://github.com/mikro-orm/mikro-orm/commit/f477a48562d09373a2e78dea6bc72f21e2c6d64d)), closes [#909](https://github.com/mikro-orm/mikro-orm/issues/909)
* **sqlite:** rework schema support for composite keys in sqlite ([82e2efd](https://github.com/mikro-orm/mikro-orm/commit/82e2efd2d285c507c9205bffced4a9afa920f259)), closes [#887](https://github.com/mikro-orm/mikro-orm/issues/887)
* **typings:** improve inference of the entity type ([67f8015](https://github.com/mikro-orm/mikro-orm/commit/67f80157ae013479b6fc47ae1c08a5cd31a6c32d)), closes [#876](https://github.com/mikro-orm/mikro-orm/issues/876)


### Features

* **core:** add EntityRepository.merge() method ([f459334](https://github.com/mikro-orm/mikro-orm/commit/f45933476177fe0503f0679cf7e947db224a450f)), closes [#868](https://github.com/mikro-orm/mikro-orm/issues/868)


### Performance Improvements

* **core:** implement bulk updates in sql drivers ([b005353](https://github.com/mikro-orm/mikro-orm/commit/b00535349368ba18a5e0a5452ae7e2b567e12952)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** improve hydration performance ([3cafbf3](https://github.com/mikro-orm/mikro-orm/commit/3cafbf39c52e02d3bd2bfc3686d3ffdeb7614586)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** interpolate query parameters at ORM level ([742b813](https://github.com/mikro-orm/mikro-orm/commit/742b8131ba7d0acec2cca3f289237fd0e757baa5)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** optimize entity hydration ([6c56a05](https://github.com/mikro-orm/mikro-orm/commit/6c56a05a86b78fc9c3ebc6ddceb75072289e6b48)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use batching in uow deletes ([8cbb22a](https://github.com/mikro-orm/mikro-orm/commit/8cbb22a841035debda5bafa6100c1a4075954d3d)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use bulk inserts in all drivers ([10f2e55](https://github.com/mikro-orm/mikro-orm/commit/10f2e55f6710822c9fca272b01c278ff80065096)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use dedicated identity maps for each entity ([84667f9](https://github.com/mikro-orm/mikro-orm/commit/84667f9e97323e4b054db2c0c70939ab0ca86c86)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use faster way to check number of object keys ([82f3ee4](https://github.com/mikro-orm/mikro-orm/commit/82f3ee4d4169def8ce8fe31764171193e8b8b5dc)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use JIT compilation for diffing entities ([60f10a4](https://github.com/mikro-orm/mikro-orm/commit/60f10a4cf5fcdbe397c8d7410ece9ffc7a272d6c)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use JIT compilation for snapshotting entities ([5612759](https://github.com/mikro-orm/mikro-orm/commit/561275918c0da27e612084c1c0a7b8bd473ef081)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use JIT compilation in hydrator ([1f06a52](https://github.com/mikro-orm/mikro-orm/commit/1f06a52392114a9c478b83ff98a1616acb44400a)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use JIT compiled PK getters/serializers ([0ec99dc](https://github.com/mikro-orm/mikro-orm/commit/0ec99dc75690bf15df3897b4da0fc3b2ab709cdd)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)


### Bug Fixes

* **core:** do not store original data for references ([0a9ef65](https://github.com/mikro-orm/mikro-orm/commit/0a9ef6591befe593af2c707eea36398f866bc133)), closes [#864](https://github.com/mikro-orm/mikro-orm/issues/864)


### Features

* **core:** add groupBy, having and schema to `CountOptions` ([d3c3858](https://github.com/mikro-orm/mikro-orm/commit/d3c38584c38e11002460a6556405e136aabefa93))


### Performance Improvements

* **core:** use batch inserts in UoW (postgres & mongodb) ([#865](https://github.com/mikro-orm/mikro-orm/issues/865)) ([54ad928](https://github.com/mikro-orm/mikro-orm/commit/54ad928aab44d0c42e3f7b306eef0c07ed65dfc1)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)


### Bug Fixes

* **deps:** update dependency escaya to ^0.0.49 ([#854](https://github.com/mikro-orm/mikro-orm/issues/854)) ([d4737b6](https://github.com/mikro-orm/mikro-orm/commit/d4737b646fe52c5bf4797312835cc974f4fe7b7c))
* **query-builder:** wrap nested array conditions with `$in` operator ([939989a](https://github.com/mikro-orm/mikro-orm/commit/939989add4f670deefe44f5a7faedb9b64155ba5)), closes [#860](https://github.com/mikro-orm/mikro-orm/issues/860)





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)


### Bug Fixes

* **core:** fix merging results from QB to existing entity ([218098a](https://github.com/mikro-orm/mikro-orm/commit/218098ababb47dc3ad3e441d631cab5615251a0e))
* **schema:** defer creating of composite indexes + implement diffing ([f57b457](https://github.com/mikro-orm/mikro-orm/commit/f57b4571feb2aea7c955c5f7eb7470530133271e)), closes [#850](https://github.com/mikro-orm/mikro-orm/issues/850)


### Features

* **mapping:** make `@Unique` and `@Index` (optionally) typesafe ([afe6801](https://github.com/mikro-orm/mikro-orm/commit/afe68015765478d40fbab6701c11661d74e2cf77)), closes [#850](https://github.com/mikro-orm/mikro-orm/issues/850)





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)


### Bug Fixes

* **core:** allow filter condition callbacks without arguments ([5b3401f](https://github.com/mikro-orm/mikro-orm/commit/5b3401f28cbfcc4e78707fb8110be418a695932a)), closes [#847](https://github.com/mikro-orm/mikro-orm/issues/847)
* **core:** allow filter condition callbacks without arguments ([da8fbfc](https://github.com/mikro-orm/mikro-orm/commit/da8fbfc5aa7c2a4a3b58325b4874125d2f67d2c1)), closes [#847](https://github.com/mikro-orm/mikro-orm/issues/847)
* **core:** allow querying `ArrayType` with a value ([e505358](https://github.com/mikro-orm/mikro-orm/commit/e50535816f318ff0c0c5edf68270920ff2cef520)), closes [#844](https://github.com/mikro-orm/mikro-orm/issues/844)
* **core:** improve metadata validation of STI relations ([0b97af8](https://github.com/mikro-orm/mikro-orm/commit/0b97af8404fd557836f8afae9cce255aca083873)), closes [#845](https://github.com/mikro-orm/mikro-orm/issues/845)
* **core:** update filter typing to allow async condition ([#848](https://github.com/mikro-orm/mikro-orm/issues/848)) ([2188f62](https://github.com/mikro-orm/mikro-orm/commit/2188f621163bebe9bbb74d1b693871fe22017d38))
* **deps:** update dependency escaya to ^0.0.44 ([#839](https://github.com/mikro-orm/mikro-orm/issues/839)) ([fedb41c](https://github.com/mikro-orm/mikro-orm/commit/fedb41cc53eeafb3e3e1540c46acc5f8f58f43b2))
* **deps:** update dependency escaya to ^0.0.45 ([#842](https://github.com/mikro-orm/mikro-orm/issues/842)) ([d9f9f05](https://github.com/mikro-orm/mikro-orm/commit/d9f9f0572a1bb1d5a5567a46b835fa1877cb3806))
* **query-builder:** fix mapping of nested 1:1 properties ([9799e70](https://github.com/mikro-orm/mikro-orm/commit/9799e70bd7235695f4f1e55b25fe61bbc158eb38))


### Features

* **core:** allow setting loading strategy globally ([e4378ee](https://github.com/mikro-orm/mikro-orm/commit/e4378ee6dca5607a82e2bff3450e18f0a6668354)), closes [#834](https://github.com/mikro-orm/mikro-orm/issues/834)


### Performance Improvements

* move reference to metadata to entity prototype + more improvements ([#843](https://github.com/mikro-orm/mikro-orm/issues/843)) ([f71e4c2](https://github.com/mikro-orm/mikro-orm/commit/f71e4c2b8dd0bbfb0658dc8a366444ec1a49c187)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)


### Reverts

* Revert "refactor: return `target` from decorator definition" ([e021617](https://github.com/mikro-orm/mikro-orm/commit/e02161774a904748cfa13e683fb2ce93d66403ca))





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)


### Bug Fixes

* **core:** make a copy of custom type values to allow array diffing ([6ae72ae](https://github.com/mikro-orm/mikro-orm/commit/6ae72ae03054df16717a52041d5574a6f4a0d66d))


### Features

* **core:** allow using `AsyncLocalStorage` for request context ([47cd9a5](https://github.com/mikro-orm/mikro-orm/commit/47cd9a5798a70d57cfb9ac3ec7f2254a77aafdfb)), closes [#575](https://github.com/mikro-orm/mikro-orm/issues/575)


### Performance Improvements

* **core:** create the helper instance early ([f4f90eb](https://github.com/mikro-orm/mikro-orm/commit/f4f90ebe7d540164c2959c554a5245dda712b612))
* **core:** do not generate internal entity uuid ([9f46aa4](https://github.com/mikro-orm/mikro-orm/commit/9f46aa4a79c0ead726af3b2001f7edb257ecd676))
* **core:** do not use `em.merge()` internally ([6a1a6d6](https://github.com/mikro-orm/mikro-orm/commit/6a1a6d68b65a20b8f1a78bf644844427f3b2dd1a))
* **core:** remove WrappedEntity.__internal map ([2228fcb](https://github.com/mikro-orm/mikro-orm/commit/2228fcbd2eb7e19b2067b78f7b8fd2d2a5ce0916))
* **core:** skip processing of hooks when there are no hooks ([425784b](https://github.com/mikro-orm/mikro-orm/commit/425784bda59bee84a3663e133f9c451e45587226))
* **core:** store entity identifier on entity helper ([403acca](https://github.com/mikro-orm/mikro-orm/commit/403acca1973279e7509f2707cfb0240b8c6f92ae))
* **core:** store original entity data on entity helper ([6a91b01](https://github.com/mikro-orm/mikro-orm/commit/6a91b0101553de397667c048f1f8deb0ff94370d))





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)


### Bug Fixes

* **core:** simplify `Collection` type args ([1fb6cec](https://github.com/mikro-orm/mikro-orm/commit/1fb6cecb29c95de9307c89518a99bbb35620b867))





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)


### Bug Fixes

* **core:** hydrate user defined discriminator columns ([#831](https://github.com/mikro-orm/mikro-orm/issues/831)) ([8671440](https://github.com/mikro-orm/mikro-orm/commit/867144005f18ab7780b60803c40ed448e0b31a8c)), closes [#827](https://github.com/mikro-orm/mikro-orm/issues/827)
* **core:** refactor internals to reduce number of cycles ([#830](https://github.com/mikro-orm/mikro-orm/issues/830)) ([3994767](https://github.com/mikro-orm/mikro-orm/commit/3994767d93ef119d229bedffa77eb2ea3af5c775))
