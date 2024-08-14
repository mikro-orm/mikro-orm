# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.3.6](https://github.com/mikro-orm/mikro-orm/compare/v6.3.5...v6.3.6) (2024-08-14)


### Bug Fixes

* **core:** fix hydration of polymorphic embeddables with overlapping property names ([ab5c595](https://github.com/mikro-orm/mikro-orm/commit/ab5c595e3fb97e95a6e86d4d8c32d4e030a84ba4)), closes [#5935](https://github.com/mikro-orm/mikro-orm/issues/5935)





## [6.3.5](https://github.com/mikro-orm/mikro-orm/compare/v6.3.4...v6.3.5) (2024-08-11)


### Bug Fixes

* **core:** track changes on non-scalar properties ([a02c727](https://github.com/mikro-orm/mikro-orm/commit/a02c727233fab72a23f0fd4c4419f17ab552fd5d)), closes [#5750](https://github.com/mikro-orm/mikro-orm/issues/5750)
* **entity-generator:** ensure `columnType` is emitted correctly and when necessary ([#5930](https://github.com/mikro-orm/mikro-orm/issues/5930)) ([72333ad](https://github.com/mikro-orm/mikro-orm/commit/72333ad506129834185f39d44457fdfb947df35c)), closes [#5928](https://github.com/mikro-orm/mikro-orm/issues/5928)
* **entity-generator:** unknown type defaults always use default/defaultRaw, never runtime ([#5927](https://github.com/mikro-orm/mikro-orm/issues/5927)) ([dcc8227](https://github.com/mikro-orm/mikro-orm/commit/dcc8227e2623d47ea4562c9c575e5ab9c3d2417f))
* **postgres:** allow string value for `$overlap/$contains/$contained` operators ([6c1b12a](https://github.com/mikro-orm/mikro-orm/commit/6c1b12af7c04414b156180e72c95118f8a5858fb))
* **postgres:** do not produce extra updates for fulltext properties ([d18e5ed](https://github.com/mikro-orm/mikro-orm/commit/d18e5ede53886abdf32ac036e41a3bc4e8f293cf)), closes [#5908](https://github.com/mikro-orm/mikro-orm/issues/5908)
* **postgres:** respect `timezone` option and interpret `timestamp` columns in UTC by default ([#5916](https://github.com/mikro-orm/mikro-orm/issues/5916)) ([1da0722](https://github.com/mikro-orm/mikro-orm/commit/1da07220ea5ac3f70b9244605b5e6367cf8f8d0c)), closes [#5591](https://github.com/mikro-orm/mikro-orm/issues/5591)


### Features

* **cli:** detect `bun` when checking for TS support ([e87ebc9](https://github.com/mikro-orm/mikro-orm/commit/e87ebc92e6cf59af65303b21ee38a675ce608d64))
* **core:** add `RequestContext.enter()` which uses `ALS.enterWith()` ([dc06f60](https://github.com/mikro-orm/mikro-orm/commit/dc06f60cc42f4359a5c7a06248767d86cd9c84e9))





## [6.3.4](https://github.com/mikro-orm/mikro-orm/compare/v6.3.3...v6.3.4) (2024-08-06)


### Bug Fixes

* **core:** adjust collection owner's serialization context when lazy-loading ([#5903](https://github.com/mikro-orm/mikro-orm/issues/5903)) ([57f234b](https://github.com/mikro-orm/mikro-orm/commit/57f234bae7ecb212f19f85de78234280f6d35f3a)), closes [#5559](https://github.com/mikro-orm/mikro-orm/issues/5559)
* **core:** do not convert bigints with mapping to `number` to `string` on serialization ([ee24f1f](https://github.com/mikro-orm/mikro-orm/commit/ee24f1f0f017d8e7b4544f6cb1a39eab29dfb413)), closes [#5839](https://github.com/mikro-orm/mikro-orm/issues/5839)
* **core:** fix populating lazy properties inside inlined embeddables ([8d1e925](https://github.com/mikro-orm/mikro-orm/commit/8d1e9252771c9d6069afd3a227fdb38cf3d0d86a)), closes [#5848](https://github.com/mikro-orm/mikro-orm/issues/5848)
* **core:** merge enum items from STI entities with the same name ([06fffbd](https://github.com/mikro-orm/mikro-orm/commit/06fffbd1e1fb5097d2b6affb4f5b216ccb391093)), closes [#5807](https://github.com/mikro-orm/mikro-orm/issues/5807)
* **mssql:** convert tuple comparison queries to simple `and/or` conditions ([#5906](https://github.com/mikro-orm/mikro-orm/issues/5906)) ([c3c3519](https://github.com/mikro-orm/mikro-orm/commit/c3c3519db72ab15810fcb65d764541ab1fcc0130))
* **schema:** respect check constraints from base entities ([22b7e97](https://github.com/mikro-orm/mikro-orm/commit/22b7e97040792d7b56676daab99de69a5ae58b6c))





## [6.3.3](https://github.com/mikro-orm/mikro-orm/compare/v6.3.2...v6.3.3) (2024-08-03)


### Bug Fixes

* **core:** ensure `@CreateRequestContext()` works when invoked from explicit transaction ([de0b515](https://github.com/mikro-orm/mikro-orm/commit/de0b51526e8e5e58b73069a3e53083f5f5139aed))
* **core:** fix unnecessary populate query when partial loading via joined strategy ([33da574](https://github.com/mikro-orm/mikro-orm/commit/33da5747b5b52ccdd36ec3aced707a6a90423f47)), closes [#5889](https://github.com/mikro-orm/mikro-orm/issues/5889)
* **knex:** update `PoolConfig` interface to match what knex supports ([#5892](https://github.com/mikro-orm/mikro-orm/issues/5892)) ([eb5d4a1](https://github.com/mikro-orm/mikro-orm/commit/eb5d4a1d065b4028e0ba211a6783014a645e50cc))


### Features

* **query-builder:** add `qb.applyFilters()` method ([0aaaa4f](https://github.com/mikro-orm/mikro-orm/commit/0aaaa4fe7087e874cdb97b81ddf6c9da90def259)), closes [#4876](https://github.com/mikro-orm/mikro-orm/issues/4876)





## [6.3.2](https://github.com/mikro-orm/mikro-orm/compare/v6.3.1...v6.3.2) (2024-08-01)


### Bug Fixes

* **core:** fix cancelling orphan removal on m:1 relations ([7b30844](https://github.com/mikro-orm/mikro-orm/commit/7b30844d8046bfd74d6c346b3bcd566b2f879a10)), closes [#5884](https://github.com/mikro-orm/mikro-orm/issues/5884)





## [6.3.1](https://github.com/mikro-orm/mikro-orm/compare/v6.3.0...v6.3.1) (2024-07-25)


### Bug Fixes

* **core:** always check TS config files if TS support is detected ([eb100fe](https://github.com/mikro-orm/mikro-orm/commit/eb100fec7b06deb1e653b594f730c901ec8ce8e7)), closes [#5852](https://github.com/mikro-orm/mikro-orm/issues/5852)
* **core:** discover base entities first to fix detection of STI when root entity not explicitly listed ([7c1976f](https://github.com/mikro-orm/mikro-orm/commit/7c1976f0d03fcef2012fbf3e87158cae4cfee81a))
* **core:** fix CreateRequestContext not working with callback returning EntityManager ([#5873](https://github.com/mikro-orm/mikro-orm/issues/5873)) ([3de546d](https://github.com/mikro-orm/mikro-orm/commit/3de546d9c972c6c351db6dceed7a86dec6fac3b2)), closes [1#L132](https://github.com/1/issues/L132)
* **schema:** skip db default inference only for polymorphic embeddables ([925c69e](https://github.com/mikro-orm/mikro-orm/commit/925c69ef6c406fb73acada47484b9e74fe796520)), closes [#5847](https://github.com/mikro-orm/mikro-orm/issues/5847)


### Features

* **core:** support `Date` type on primary keys ([#5855](https://github.com/mikro-orm/mikro-orm/issues/5855)) ([f91d57c](https://github.com/mikro-orm/mikro-orm/commit/f91d57c4a82754dfe0c055bcc6813cbec8ac9c1b)), closes [#5842](https://github.com/mikro-orm/mikro-orm/issues/5842)





## [6.3.0](https://github.com/mikro-orm/mikro-orm/compare/v6.2.9...v6.3.0) (2024-07-18)


### Bug Fixes

* **cli:** enforce `moduleResolution: 'nodenext'` for CLI context ([d5d7f38](https://github.com/mikro-orm/mikro-orm/commit/d5d7f381363ab776b3c3af04a925a5547dbcdb65)), closes [#5514](https://github.com/mikro-orm/mikro-orm/issues/5514)
* **core:** allow `em.transactional` handler to be synchronous ([#5696](https://github.com/mikro-orm/mikro-orm/issues/5696)) ([fd56714](https://github.com/mikro-orm/mikro-orm/commit/fd56714e06e39c2724a3193b8b07279b8fb6c91f))
* **core:** allow passing `null` to optional properties in `em.create()` ([df0db99](https://github.com/mikro-orm/mikro-orm/commit/df0db996aad03a1ad98bf4c45dbb4832cd50a1d8)), closes [#5827](https://github.com/mikro-orm/mikro-orm/issues/5827)
* **core:** ensure correct identity when upserting without primary key ([cdbab12](https://github.com/mikro-orm/mikro-orm/commit/cdbab12977cd9b6709442bb4b0838326b2501e98)), closes [#5702](https://github.com/mikro-orm/mikro-orm/issues/5702)
* **core:** ensure correct mapping of related columns to owning entity fields for complex relations ([#5630](https://github.com/mikro-orm/mikro-orm/issues/5630)) ([302600e](https://github.com/mikro-orm/mikro-orm/commit/302600e1fe670b562fa926c7239451a510808b24)), closes [#5629](https://github.com/mikro-orm/mikro-orm/issues/5629)
* **core:** ensure correct mapping to native bigint in sqlite and mysql ([a16b801](https://github.com/mikro-orm/mikro-orm/commit/a16b801f1f4ed8bfa01cf236a25c391c70a3cbba)), closes [#5737](https://github.com/mikro-orm/mikro-orm/issues/5737)
* **core:** fix auto flush mode for `em.count()` ([62db127](https://github.com/mikro-orm/mikro-orm/commit/62db127f343f366d7aca5293aa718ca63d265369))
* **core:** fix auto flush mode for `em.findAndCount()` ([a572869](https://github.com/mikro-orm/mikro-orm/commit/a572869316660d26645d04f748cdf653b0989924))
* **core:** fix batch update of nullable embedded arrays ([c1ea284](https://github.com/mikro-orm/mikro-orm/commit/c1ea284bb78f16b56278cd4a4b219516fc9681e7)), closes [#5723](https://github.com/mikro-orm/mikro-orm/issues/5723)
* **core:** fix detection of constructor parameters with default object value ([58e8c2a](https://github.com/mikro-orm/mikro-orm/commit/58e8c2afea24dbd45428b83343e6a344a6ae302d)), closes [#5710](https://github.com/mikro-orm/mikro-orm/issues/5710)
* **core:** fix handling of pivot entities with M:N relations ([fa89731](https://github.com/mikro-orm/mikro-orm/commit/fa8973166373b45ceeebeb9279786498ce24362e)), closes [#5774](https://github.com/mikro-orm/mikro-orm/issues/5774)
* **core:** fix handling of raw query key of where condition with `[]` on right side ([1e76509](https://github.com/mikro-orm/mikro-orm/commit/1e76509792d4f1b0172c77b2d6204b283d101cc2)), closes [#5825](https://github.com/mikro-orm/mikro-orm/issues/5825)
* **core:** fix populating entity graph with cycles ([6505510](https://github.com/mikro-orm/mikro-orm/commit/6505510f56cab1b2f09edb02e488782ef160ebd7))
* **core:** fix processing of nullable embedded arrays ([01612a1](https://github.com/mikro-orm/mikro-orm/commit/01612a15b3dee19fc603c8fcc7f65d4c4948e5a2)), closes [#5715](https://github.com/mikro-orm/mikro-orm/issues/5715)
* **core:** ignore existing contexts in `@CreateRequestContext()` ([1bb4e22](https://github.com/mikro-orm/mikro-orm/commit/1bb4e22e17537600ef7f10f02aa638c3b9ce609e)), closes [#5801](https://github.com/mikro-orm/mikro-orm/issues/5801)
* **core:** improve handling of JSON properties to support numeric strings in all drivers ([#5780](https://github.com/mikro-orm/mikro-orm/issues/5780)) ([fc50c5f](https://github.com/mikro-orm/mikro-orm/commit/fc50c5f5f28f0764115631900edac24bc734afa4)), closes [#5773](https://github.com/mikro-orm/mikro-orm/issues/5773)
* **core:** make `raw()` accept readonly params ([#5832](https://github.com/mikro-orm/mikro-orm/issues/5832)) ([7f9daf7](https://github.com/mikro-orm/mikro-orm/commit/7f9daf76907b1832a52caf9b909516746bfe9c4d))
* **core:** respect `populate` option in `Reference.load` for loaded relations ([04fb826](https://github.com/mikro-orm/mikro-orm/commit/04fb826ba96426eb700284d923887594f3f7f09e)), closes [#5711](https://github.com/mikro-orm/mikro-orm/issues/5711)
* **core:** respect `populateOrderBy` with `select-in` strategy ([3b83d29](https://github.com/mikro-orm/mikro-orm/commit/3b83d29783266e86e711440ad8f9725710ca205d)), closes [#5693](https://github.com/mikro-orm/mikro-orm/issues/5693)
* **core:** respect nullability of wrapped types for ScalarReference's ([#5722](https://github.com/mikro-orm/mikro-orm/issues/5722)) ([a1b8f07](https://github.com/mikro-orm/mikro-orm/commit/a1b8f075e6c71d45e764cc9342058d3bfd2d2406))
* **core:** respect parent property prefix when child has `prefix: false` ([94367b8](https://github.com/mikro-orm/mikro-orm/commit/94367b80543a0efdd8225b897a2255f976bbe2cc)), closes [#5642](https://github.com/mikro-orm/mikro-orm/issues/5642)
* **core:** support for TS 5.5 ([2fd7359](https://github.com/mikro-orm/mikro-orm/commit/2fd7359467ed2e5d8409b342a4bc2b2d52a1bb7c))
* **core:** support overloading embedded properties ([#5784](https://github.com/mikro-orm/mikro-orm/issues/5784)) ([c57b528](https://github.com/mikro-orm/mikro-orm/commit/c57b528645042876d71d5816156679a31bdbf215)), closes [#2987](https://github.com/mikro-orm/mikro-orm/issues/2987)
* **core:** use `NonNullable` instead of the internal `Defined` type ([8ef28c4](https://github.com/mikro-orm/mikro-orm/commit/8ef28c4f34eacce23a5958be9e04d6f3bdcb1029))
* **core:** use the same transaction context in `em.refresh()` ([dd17706](https://github.com/mikro-orm/mikro-orm/commit/dd177066d61f9d2ca6c9a7fc9611d8a5477487dc)), closes [#5753](https://github.com/mikro-orm/mikro-orm/issues/5753)
* **core:** using `EntityData<Entity, true>` now works with `IType` ([#5810](https://github.com/mikro-orm/mikro-orm/issues/5810)) ([f339ef5](https://github.com/mikro-orm/mikro-orm/commit/f339ef561285576a032bb12c1236bbe77888bce0))
* **entity-generator:** correctly serialize string prefixes in embedded references ([#5826](https://github.com/mikro-orm/mikro-orm/issues/5826)) ([7882bca](https://github.com/mikro-orm/mikro-orm/commit/7882bca1f029f331ea4af4e52e7f76c02ede0c84))
* **entity-generator:** fix handling of primary keys that are foreign keys or enums ([#5673](https://github.com/mikro-orm/mikro-orm/issues/5673)) ([b10413f](https://github.com/mikro-orm/mikro-orm/commit/b10413f3b1b5548118b02aa90e39bb69d8473d4f))
* **entity-generator:** fixed default values for enums ([#5765](https://github.com/mikro-orm/mikro-orm/issues/5765)) ([58d914d](https://github.com/mikro-orm/mikro-orm/commit/58d914db32c8a06727fd9087bbcc4fda1117d086))
* **entity-generator:** generate all bidirectional relations in case of conflicts ([#5779](https://github.com/mikro-orm/mikro-orm/issues/5779)) ([af845f1](https://github.com/mikro-orm/mikro-orm/commit/af845f1aee8b8925498b2bb53fbf74e522efc2cc)), closes [#5738](https://github.com/mikro-orm/mikro-orm/issues/5738)
* **entity-generator:** include all entity options in EntitySchema definitions ([#5674](https://github.com/mikro-orm/mikro-orm/issues/5674)) ([94ef44e](https://github.com/mikro-orm/mikro-orm/commit/94ef44e28aa3420e0ba2f83d9f6830dcb3e56302))
* **entity-generator:** output all DB related info even for virtual properties ([#5817](https://github.com/mikro-orm/mikro-orm/issues/5817)) ([845b75c](https://github.com/mikro-orm/mikro-orm/commit/845b75ce3b23fc9957edd4db0a19774ca648fdf5))
* **entity-generator:** output entity and prop comments ([#5699](https://github.com/mikro-orm/mikro-orm/issues/5699)) ([4ef21c4](https://github.com/mikro-orm/mikro-orm/commit/4ef21c4388c488fdb4db1f159f0d8250fd620fc6))
* **entity-generator:** support complex enum names and values ([#5670](https://github.com/mikro-orm/mikro-orm/issues/5670)) ([7dcb7be](https://github.com/mikro-orm/mikro-orm/commit/7dcb7beff1a74606831f073549b530ba0e1bb7a1))
* **entity-generator:** when using esmImport, FKs are now wrapped with Rel ([#5771](https://github.com/mikro-orm/mikro-orm/issues/5771)) ([c28ab16](https://github.com/mikro-orm/mikro-orm/commit/c28ab16810bb62aa6dd20dd8442eef902cd68a4d))
* **mssql:** add proper support for MSSQL's native "varchar" type ([#5685](https://github.com/mikro-orm/mikro-orm/issues/5685)) ([0b514ce](https://github.com/mikro-orm/mikro-orm/commit/0b514ce7378df21ef414027f993267f2ecbe681a))
* **mssql:** fix handling of non-UTC timezones ([e78696c](https://github.com/mikro-orm/mikro-orm/commit/e78696c548e14be3e00ba5595697816db4c9dd52)), closes [#5695](https://github.com/mikro-orm/mikro-orm/issues/5695)
* **mssql:** only escape strings and unicode strings when necessary ([#5786](https://github.com/mikro-orm/mikro-orm/issues/5786)) ([b4e0914](https://github.com/mikro-orm/mikro-orm/commit/b4e0914772356285bcbb9362a4df2044438b4cd7)), closes [#5811](https://github.com/mikro-orm/mikro-orm/issues/5811)
* **mysql:** fix support for older MySQL versions than v8.0.13 when reading indexes ([#5654](https://github.com/mikro-orm/mikro-orm/issues/5654)) ([3c4f665](https://github.com/mikro-orm/mikro-orm/commit/3c4f6658d05d2b71c79ba672e1f20c44f43da1f2)), closes [#5653](https://github.com/mikro-orm/mikro-orm/issues/5653)
* **postgres:** implement diffing support for `vector` type ([9eadac1](https://github.com/mikro-orm/mikro-orm/commit/9eadac187eb92d6ef098a0552e2c94967ebf2a60)), closes [#5739](https://github.com/mikro-orm/mikro-orm/issues/5739)
* **postgres:** put new native enum values into the correct position ([f79e3bc](https://github.com/mikro-orm/mikro-orm/commit/f79e3bc9063ce34e6fc5ad1c3a9abc3630c1cabe)), closes [#5791](https://github.com/mikro-orm/mikro-orm/issues/5791)
* **postgresql:** ignore tables that use inheritance during schema diffing ([#5648](https://github.com/mikro-orm/mikro-orm/issues/5648)) ([55f452a](https://github.com/mikro-orm/mikro-orm/commit/55f452a7d9061d04244178f87b21df3e0d32f6f4))
* **postgres:** respect empty string in enum items ([c02f12e](https://github.com/mikro-orm/mikro-orm/commit/c02f12e3d835101041fe62a92fd32908d346b789)), closes [#5751](https://github.com/mikro-orm/mikro-orm/issues/5751)
* **postgres:** support enum arrays with special characters ([54b30cb](https://github.com/mikro-orm/mikro-orm/commit/54b30cb8e043cd9cc5d960a609363cc7d5c4ba5a)), closes [#5781](https://github.com/mikro-orm/mikro-orm/issues/5781)
* **query-builder:** don't use alias in more complex queries when not needed ([#5679](https://github.com/mikro-orm/mikro-orm/issues/5679)) ([ad347e7](https://github.com/mikro-orm/mikro-orm/commit/ad347e797a48aef8f91c66ddf67dcf9b3332ed75)), closes [#5676](https://github.com/mikro-orm/mikro-orm/issues/5676)
* **query-builder:** interpolate raw query params early to ensure the correct binding position ([9bd0fe9](https://github.com/mikro-orm/mikro-orm/commit/9bd0fe90c0649d0342de5eca7c19fc48de9ba65f)), closes [#5706](https://github.com/mikro-orm/mikro-orm/issues/5706)
* **query-builder:** process raw query fragments under operator value ([98510a3](https://github.com/mikro-orm/mikro-orm/commit/98510a357590c734e185be939d0e0a30c8e2a41c)), closes [#5724](https://github.com/mikro-orm/mikro-orm/issues/5724)
* **query-builder:** quote alias in formulas when joining virtual relations ([68b64ec](https://github.com/mikro-orm/mikro-orm/commit/68b64ece8f61acbe33bee347c06108bc959b1caa)), closes [#5705](https://github.com/mikro-orm/mikro-orm/issues/5705)
* **query-builder:** skip inner select for properties that map to a raw query fragment during pagination ([1c5154a](https://github.com/mikro-orm/mikro-orm/commit/1c5154ab389ff9daff38f61f9e407969a5de6f83)), closes [#5709](https://github.com/mikro-orm/mikro-orm/issues/5709)
* **schema:** always prefer index/unique expression ([96dff53](https://github.com/mikro-orm/mikro-orm/commit/96dff537486359d968bb4da5e0e8d73ccdd89ad9)), closes [#5668](https://github.com/mikro-orm/mikro-orm/issues/5668)
* **schema:** do not drop FKs in down migrations when they are disabled ([0dcfa80](https://github.com/mikro-orm/mikro-orm/commit/0dcfa800528700799bb07971e25b09063a1563eb)), closes [#4993](https://github.com/mikro-orm/mikro-orm/issues/4993)
* **schema:** skip implicit FK index when defined explicitly by user on entity level ([ff6bfdc](https://github.com/mikro-orm/mikro-orm/commit/ff6bfdcf6e89b68875cf7f5c6a02a915344f6de5)), closes [#5725](https://github.com/mikro-orm/mikro-orm/issues/5725)
* **sql:** fix ordering by m:1 and 1:1 relations with joined strategy ([28119c6](https://github.com/mikro-orm/mikro-orm/commit/28119c649c61f070fbe396c4a879f9d071d9aabd))
* **sql:** ignore generated columns when computing changesets ([55dfbf9](https://github.com/mikro-orm/mikro-orm/commit/55dfbf900911f32068096e412191d2d25415ed80)), closes [#5660](https://github.com/mikro-orm/mikro-orm/issues/5660)
* **sqlite:** fix altering tables via malformed temp table ([#5683](https://github.com/mikro-orm/mikro-orm/issues/5683)) ([1b9087c](https://github.com/mikro-orm/mikro-orm/commit/1b9087ce3a0002d41a6722e22ad789cc67f9d362)), closes [#5672](https://github.com/mikro-orm/mikro-orm/issues/5672)
* **sql:** rework detection of problematic batch updates and split more aggressively ([b045033](https://github.com/mikro-orm/mikro-orm/commit/b0450338f16bda43f986f07715d2e51516ac580b)), closes [#5656](https://github.com/mikro-orm/mikro-orm/issues/5656)


### Features

* **cli:** always check TS files regardless of `useTsNode` ([#5650](https://github.com/mikro-orm/mikro-orm/issues/5650)) ([7c34416](https://github.com/mikro-orm/mikro-orm/commit/7c34416d61d5c2d3e63dbb7725774e04e6de604d))
* **core:** addz `Platform.getDefaultVarcharLength` and optional `Type.getDefaultLength` ([#5749](https://github.com/mikro-orm/mikro-orm/issues/5749)) ([29dcdeb](https://github.com/mikro-orm/mikro-orm/commit/29dcdeb5e4c3f84e43c154fe3eb81a113c6d1470))
* **core:** allow passing `raw()` into `onConflictFields` of upsert methods ([#5691](https://github.com/mikro-orm/mikro-orm/issues/5691)) ([bff90f2](https://github.com/mikro-orm/mikro-orm/commit/bff90f2353a411a7cb0c6d838da12118147cef21)), closes [#5668](https://github.com/mikro-orm/mikro-orm/issues/5668)
* **core:** allow upserting without a unique value ([#5726](https://github.com/mikro-orm/mikro-orm/issues/5726)) ([75a4706](https://github.com/mikro-orm/mikro-orm/commit/75a470629c9eb7aaa25415cd54dc1b4148f2ac97))
* **core:** check for ORM extensions dynamically ([#5651](https://github.com/mikro-orm/mikro-orm/issues/5651)) ([68a3c1f](https://github.com/mikro-orm/mikro-orm/commit/68a3c1fe0b84cf1646501025b948de58911293f6))
* **core:** implement "character" type (DB type "char") ([#5684](https://github.com/mikro-orm/mikro-orm/issues/5684)) ([9fa5fad](https://github.com/mikro-orm/mikro-orm/commit/9fa5fad5e3955cdcdee89aa12c8b3dd4841b2045))
* **entity-generator:** add a coreImportsPrefix option ([#5669](https://github.com/mikro-orm/mikro-orm/issues/5669)) ([b9ab69a](https://github.com/mikro-orm/mikro-orm/commit/b9ab69a5e86ce118cb209d2fdc5a76f2c4b80620))
* **entity-generator:** added option to output pure pivot tables ([#5809](https://github.com/mikro-orm/mikro-orm/issues/5809)) ([832a626](https://github.com/mikro-orm/mikro-orm/commit/832a62612d6cf3cc8a44f0c0c7ad6b1cec1bf402))
* **entity-generator:** added the ability to add extra names to be imported ([#5797](https://github.com/mikro-orm/mikro-orm/issues/5797)) ([82696b3](https://github.com/mikro-orm/mikro-orm/commit/82696b30c2a14cd68879c421ab4a8b182c3093ab))
* **entity-generator:** allow custom types for scalar relations ([#5435](https://github.com/mikro-orm/mikro-orm/issues/5435)) ([a8a9126](https://github.com/mikro-orm/mikro-orm/commit/a8a9126ebdfb57cce14d1931b5cce5dfb1ade27f))
* **entity-generator:** enable the generator to dictate import specs via `extraImport` ([#5772](https://github.com/mikro-orm/mikro-orm/issues/5772)) ([effd9fb](https://github.com/mikro-orm/mikro-orm/commit/effd9fbc9426bc49a2acb3bed1b982eed4f38b3e))
* **entity-generator:** repository class reference can be added from hooks ([#5785](https://github.com/mikro-orm/mikro-orm/issues/5785)) ([44a49a9](https://github.com/mikro-orm/mikro-orm/commit/44a49a9aad455db59e08e48ef2ce58f112671f97))
* **entity-generator:** support adding groups through metadata hooks ([#5793](https://github.com/mikro-orm/mikro-orm/issues/5793)) ([a756271](https://github.com/mikro-orm/mikro-orm/commit/a756271a94af3806a38111d301fd907f870dd057))
* **libsql:** support connecting to remote turso database ([#5764](https://github.com/mikro-orm/mikro-orm/issues/5764)) ([6255a33](https://github.com/mikro-orm/mikro-orm/commit/6255a3302890a02c501357426937d29e393c02f9))
* **migrations:** allow initial migration to be blank if no entities are defined ([#5802](https://github.com/mikro-orm/mikro-orm/issues/5802)) ([a8f6864](https://github.com/mikro-orm/mikro-orm/commit/a8f68645727103b7af0cfe59c33ac199fa28e1de))
* **migrations:** make `--blank` also generate a `down` migration ([#5657](https://github.com/mikro-orm/mikro-orm/issues/5657)) ([056d336](https://github.com/mikro-orm/mikro-orm/commit/056d3360e8c338b8a5431533fd9e12a5e5206fef))
* **postgres:** allow specifying deferred mode on unique constraints ([#5537](https://github.com/mikro-orm/mikro-orm/issues/5537)) ([7672b56](https://github.com/mikro-orm/mikro-orm/commit/7672b56b0efaed26d87651e256866c8ac8ca72ed))
* **postgres:** support `on delete set null/default` with subset of columns ([5353e6a](https://github.com/mikro-orm/mikro-orm/commit/5353e6a97cdea224ce19fe3b5745951411a12282)), closes [#5568](https://github.com/mikro-orm/mikro-orm/issues/5568)
* **postresql:** add support for varchar with unlimited length ([#5707](https://github.com/mikro-orm/mikro-orm/issues/5707)) ([c22e971](https://github.com/mikro-orm/mikro-orm/commit/c22e97147877d0081b7310452b19acbd4609b2a2))
* **query-builder:** infer `Loaded` hint based on `joinAndSelect` calls ([#5482](https://github.com/mikro-orm/mikro-orm/issues/5482)) ([d18da6b](https://github.com/mikro-orm/mikro-orm/commit/d18da6b8cfce84ffaf480a27b869b79efbc70fb6))


### Performance Improvements

* **core:** improve serialization speed ([136f704](https://github.com/mikro-orm/mikro-orm/commit/136f70455c7965a4363a69d95092300cfd906cce))
* **core:** rework `EntityKey` type to improve tsserver performance ([#5762](https://github.com/mikro-orm/mikro-orm/issues/5762)) ([dabe734](https://github.com/mikro-orm/mikro-orm/commit/dabe734274b5e2663bf45482e5e81897b0a8a456)), closes [#5708](https://github.com/mikro-orm/mikro-orm/issues/5708)





## [6.2.9](https://github.com/mikro-orm/mikro-orm/compare/v6.2.8...v6.2.9) (2024-05-31)


### Bug Fixes

* **cli:** use `module: 'nodenext'` when registering ts-node ([#5514](https://github.com/mikro-orm/mikro-orm/issues/5514)) ([8695524](https://github.com/mikro-orm/mikro-orm/commit/869552411c65e5a42362277555f71549a64fccc7)), closes [#5427](https://github.com/mikro-orm/mikro-orm/issues/5427)
* **core:** detect path from decorator for each class only once ([#5545](https://github.com/mikro-orm/mikro-orm/issues/5545)) ([9af0e38](https://github.com/mikro-orm/mikro-orm/commit/9af0e3815c9e8200ace3e6a09e5ebd23c6f768f8))
* **core:** improve support for `clientUrl` with additional query parameters ([1472705](https://github.com/mikro-orm/mikro-orm/commit/1472705bc1e974b09aa00a495b79f07cb776f5b8)), closes [#5608](https://github.com/mikro-orm/mikro-orm/issues/5608)
* **core:** improve support for sharing columns in composite PK and FK ([#5623](https://github.com/mikro-orm/mikro-orm/issues/5623)) ([7190879](https://github.com/mikro-orm/mikro-orm/commit/7190879bdf64e51d31b61b275b98df84de02004e)), closes [#5622](https://github.com/mikro-orm/mikro-orm/issues/5622)
* **core:** improve validation for missing `dbName` when `clientUrl` is provided ([c21359e](https://github.com/mikro-orm/mikro-orm/commit/c21359efe92c7abb22f706b00ac1aa1da38cffdf))
* **core:** respect `ignoreNestedTransactions` from upper context ([eab4df6](https://github.com/mikro-orm/mikro-orm/commit/eab4df67b22d636c0a76703c6f48dc0c76cc2433)), closes [#5585](https://github.com/mikro-orm/mikro-orm/issues/5585)
* **core:** use explicit `NoInfer` type helper to support TS\<5.4 ([c38b366](https://github.com/mikro-orm/mikro-orm/commit/c38b36609a5264a2b2a49a87a89091003fcf6f42)), closes [#5613](https://github.com/mikro-orm/mikro-orm/issues/5613)
* **knex:** explicitly declare all the extended drivers as optional peer dependencies ([#5647](https://github.com/mikro-orm/mikro-orm/issues/5647)) ([64045ad](https://github.com/mikro-orm/mikro-orm/commit/64045adadae9f6c98e205927210de62ebb095adb))
* **mssql:** account for quotes in table names ([#5637](https://github.com/mikro-orm/mikro-orm/issues/5637)) ([0343609](https://github.com/mikro-orm/mikro-orm/commit/0343609c3e99d1fe5e4024a7afe0aaa2b2d6d980))
* **mssql:** fix creating migrations due to a missing helper method ([#5644](https://github.com/mikro-orm/mikro-orm/issues/5644)) ([90e27c2](https://github.com/mikro-orm/mikro-orm/commit/90e27c275d7db46269ee721e049dcfe09b274abe)), closes [#5633](https://github.com/mikro-orm/mikro-orm/issues/5633)
* **mssql:** fix creating schema for migrations table ([fe1be6f](https://github.com/mikro-orm/mikro-orm/commit/fe1be6f099888ad9e289f091d53428a4498f4b0d)), closes [#5644](https://github.com/mikro-orm/mikro-orm/issues/5644)
* **mssql:** fix ensuring the database exists on older SQL Server versions ([f0a5790](https://github.com/mikro-orm/mikro-orm/commit/f0a5790de0b08978983a3af82122e0f5045531dc)), closes [#5638](https://github.com/mikro-orm/mikro-orm/issues/5638)
* **postgres:** respect `deferMode` option in 1:1 relations ([#5641](https://github.com/mikro-orm/mikro-orm/issues/5641)) ([101c0a8](https://github.com/mikro-orm/mikro-orm/commit/101c0a85cacfd20e7d4857646d7c7242e4ec1cd1))
* **reflection:** detect complex runtime types and don't use them as column types ([0c8a587](https://github.com/mikro-orm/mikro-orm/commit/0c8a58726c0a69f91c1494570029e36c89d1a64a)), closes [#5601](https://github.com/mikro-orm/mikro-orm/issues/5601)
* **reflection:** support entities compiled by babel ([#5628](https://github.com/mikro-orm/mikro-orm/issues/5628)) ([26f627e](https://github.com/mikro-orm/mikro-orm/commit/26f627e3df2b66782e446de2419c350cf17c74ac)), closes [#5610](https://github.com/mikro-orm/mikro-orm/issues/5610)
* **schema:** fix diffing renamed indexes and columns when the names are not lowercase ([4019dc3](https://github.com/mikro-orm/mikro-orm/commit/4019dc336f24bd79daeb8fd7997c06d055d23933)), closes [#5617](https://github.com/mikro-orm/mikro-orm/issues/5617)
* **sql:** implement batching of M:N collection update queries ([d97979b](https://github.com/mikro-orm/mikro-orm/commit/d97979b236b8a7e40f64848e88602c531b8ebb84)), closes [#5627](https://github.com/mikro-orm/mikro-orm/issues/5627)


### Features

* **core:** allow overriding the `--config` argument name ([8b304ab](https://github.com/mikro-orm/mikro-orm/commit/8b304abecad740ac6b7f7820dafc6e7f8d6f5e6f))


### Performance Improvements

* **sql:** optimize diffing M:N collection state ([f46e7c8](https://github.com/mikro-orm/mikro-orm/commit/f46e7c86e29727b57f3220901ac5b14a6f1719c1)), closes [#5627](https://github.com/mikro-orm/mikro-orm/issues/5627)





## [6.2.8](https://github.com/mikro-orm/mikro-orm/compare/v6.2.7...v6.2.8) (2024-05-21)


### Bug Fixes

* **cli:** disable eager connection when creating the ORM instance ([ef5d14a](https://github.com/mikro-orm/mikro-orm/commit/ef5d14ad0f0ccf153c373991e2545851d10566cf)), closes [#5030](https://github.com/mikro-orm/mikro-orm/issues/5030)
* **core:** allow hydration of non persistent embedded properties ([#5579](https://github.com/mikro-orm/mikro-orm/issues/5579)) ([e8c0c3f](https://github.com/mikro-orm/mikro-orm/commit/e8c0c3fe1d539d363f254ba039182eca4f15d39c)), closes [#5578](https://github.com/mikro-orm/mikro-orm/issues/5578)
* **core:** always use root entity when computing M:N field names with STI ([568e57f](https://github.com/mikro-orm/mikro-orm/commit/568e57f7b513c2af774d74492474a6d5183d7658)), closes [#5586](https://github.com/mikro-orm/mikro-orm/issues/5586)
* **core:** map embedded constructor parameters ([24f3ee6](https://github.com/mikro-orm/mikro-orm/commit/24f3ee6acfd7636102f1d438c19472374d5c6ca7))
* **postgres:** support `lockTableAliases` with explicit schema name in config ([3fdb077](https://github.com/mikro-orm/mikro-orm/commit/3fdb077893144111cf4d8b2ea5a22271d0f405df)), closes [#5125](https://github.com/mikro-orm/mikro-orm/issues/5125) [#5404](https://github.com/mikro-orm/mikro-orm/issues/5404)
* **schema:** use `type` as `columnType` when no matching mapping found ([cd7f85c](https://github.com/mikro-orm/mikro-orm/commit/cd7f85c576f3424479bb161972a7152b84dbf2f8)), closes [#5587](https://github.com/mikro-orm/mikro-orm/issues/5587)
* **sql:** respect `timezone` when mapping joined properties to `Date` ([7f9bb0b](https://github.com/mikro-orm/mikro-orm/commit/7f9bb0be291088b0098b839753bc7ca65fed1e99)), closes [#5577](https://github.com/mikro-orm/mikro-orm/issues/5577)





## [6.2.7](https://github.com/mikro-orm/mikro-orm/compare/v6.2.6...v6.2.7) (2024-05-18)


### Bug Fixes

* **core:** fix ordering by joined embedded object properties ([cbd7c3e](https://github.com/mikro-orm/mikro-orm/commit/cbd7c3eaac520fdd9eda61fcb7321fea87bb9bdf)), closes [#5560](https://github.com/mikro-orm/mikro-orm/issues/5560)
* **mongo:** ensure JSON values are properly diffed ([577166a](https://github.com/mikro-orm/mikro-orm/commit/577166abb18ed1e6bc11c973fc774cc1e7a95fd7)), closes [#5572](https://github.com/mikro-orm/mikro-orm/issues/5572)
* **query-builder:** improve handling of nested `$and/$or` queries ([567d65a](https://github.com/mikro-orm/mikro-orm/commit/567d65ae27ea3627518d8d06119ac4b412d6e622))
* **schema:** revert the `dbName` after dropping the database ([725f7e9](https://github.com/mikro-orm/mikro-orm/commit/725f7e9e0940bfd60a6cd9992f567b21fb7c96fa)), closes [#5583](https://github.com/mikro-orm/mikro-orm/issues/5583)





## [6.2.6](https://github.com/mikro-orm/mikro-orm/compare/v6.2.5...v6.2.6) (2024-05-14)


### Bug Fixes

* **core:** fix mapping of `Date` properties from `bigint` values ([05c802b](https://github.com/mikro-orm/mikro-orm/commit/05c802b5c33ed87cf57c119208dd34294c09c8b5)), closes [#5540](https://github.com/mikro-orm/mikro-orm/issues/5540)
* **core:** quote column name for the returning statement when using `convertToJSValueSQL` ([4783945](https://github.com/mikro-orm/mikro-orm/commit/4783945b22ab3acb0893df52e4534963269444cf)), closes [#5563](https://github.com/mikro-orm/mikro-orm/issues/5563)
* **core:** respect `runtimeType` override with reflect-metadata provider ([f1c9740](https://github.com/mikro-orm/mikro-orm/commit/f1c9740d940af0f2c09af1464fa8f6e7caef0ba3))
* **query-builder:** don't remove joins used by other joins during pagination ([#5566](https://github.com/mikro-orm/mikro-orm/issues/5566)) ([b05c434](https://github.com/mikro-orm/mikro-orm/commit/b05c434485d3a85dd775d6c084faafb8899ac6c3)), closes [#5565](https://github.com/mikro-orm/mikro-orm/issues/5565)
* **reflection:** allow inference of `Ref<boolean> & Opt` ([534f088](https://github.com/mikro-orm/mikro-orm/commit/534f0883667a126fd06e7c9ba4da44883f1996a6)), closes [#5557](https://github.com/mikro-orm/mikro-orm/issues/5557)
* **sqlite:** fix mapping of joined results with `DateTimeType` properties ([4001d2b](https://github.com/mikro-orm/mikro-orm/commit/4001d2b4e50efe9ecdcb95c114ddd5c1bb9ccb9c)), closes [#5550](https://github.com/mikro-orm/mikro-orm/issues/5550)





## [6.2.5](https://github.com/mikro-orm/mikro-orm/compare/v6.2.4...v6.2.5) (2024-05-05)


### Bug Fixes

* **core:** fix extra updates on embedded array properties ([48fde11](https://github.com/mikro-orm/mikro-orm/commit/48fde11a78f9566885881c0f55fb4085896bfb26)), closes [#5530](https://github.com/mikro-orm/mikro-orm/issues/5530)
* **core:** fix hydration of relations with custom types via joined strategy ([07f10c8](https://github.com/mikro-orm/mikro-orm/commit/07f10c83606e71ff59f94884a8d1402d17ff8efd)), closes [#5518](https://github.com/mikro-orm/mikro-orm/issues/5518)
* **core:** improve support for mapping `DecimalType` to `number` ([5a3e30e](https://github.com/mikro-orm/mikro-orm/commit/5a3e30e526f66d8ee7ae6ba323c6737050661bae))
* **core:** limit depth in custom `inspect` methods to get around debugging issues in vscode ([f706c06](https://github.com/mikro-orm/mikro-orm/commit/f706c06ff0219093644d90934d0b342ec4cbd075)), closes [#5525](https://github.com/mikro-orm/mikro-orm/issues/5525)
* **core:** support path detection from decorators in bun ([6683bcc](https://github.com/mikro-orm/mikro-orm/commit/6683bcc13561f009189e78325b9e9e476f452524)), closes [#5496](https://github.com/mikro-orm/mikro-orm/issues/5496)
* **mongo:** support cursor pagination on `Date` properties ([4281320](https://github.com/mikro-orm/mikro-orm/commit/4281320f233efb56d012da4fe60d380e8aa701a3)), closes [#5496](https://github.com/mikro-orm/mikro-orm/issues/5496)
* **mysql:** infer unsigned value for FKs based on the target PK ([b7ae145](https://github.com/mikro-orm/mikro-orm/commit/b7ae1450121b4e6a024ce4069f4f378e36064016)), closes [#5485](https://github.com/mikro-orm/mikro-orm/issues/5485)
* **query-builder:** do not reset join conditions when paginating ([0b851e5](https://github.com/mikro-orm/mikro-orm/commit/0b851e50b1fa64c76ead91c046aa5d3e231cfab4)), closes [#5538](https://github.com/mikro-orm/mikro-orm/issues/5538)
* **schema:** skip extra columns in nested pivot entities ([f34e4d7](https://github.com/mikro-orm/mikro-orm/commit/f34e4d77fa75e842b898ee1a554d1bc6fd960aac)), closes [#5276](https://github.com/mikro-orm/mikro-orm/issues/5276)


### Features

* **core:** allow specifying the `runtimeType` explicitly ([e9c0c07](https://github.com/mikro-orm/mikro-orm/commit/e9c0c0758dd20c7674ed5df421bc3795212068a8))





## [6.2.4](https://github.com/mikro-orm/mikro-orm/compare/v6.2.3...v6.2.4) (2024-05-02)


### Bug Fixes

* **core:** do not issue extra updates when there are no matching changesets ([03934d0](https://github.com/mikro-orm/mikro-orm/commit/03934d072d545f4f6b01754eec9120b55dfbfc0a)), closes [#5510](https://github.com/mikro-orm/mikro-orm/issues/5510)
* **core:** fix extra updates with `forceEntityConstructor` and JSON properties ([5ef57b6](https://github.com/mikro-orm/mikro-orm/commit/5ef57b684bf19c5ed7abed66e2a07cab1e5e655a)), closes [#5499](https://github.com/mikro-orm/mikro-orm/issues/5499)
* **core:** keep transaction context when forking for `disableIdentityMap` ([ed88a02](https://github.com/mikro-orm/mikro-orm/commit/ed88a02470f3da101db4abfae125b318da8bc8c2)), closes [#5527](https://github.com/mikro-orm/mikro-orm/issues/5527)
* **core:** keep transaction context when forking for `disableIdentityMap` ([8d4fe98](https://github.com/mikro-orm/mikro-orm/commit/8d4fe985bdd2aa331415fa0e9fa0c62295b41921)), closes [#5528](https://github.com/mikro-orm/mikro-orm/issues/5528)
* **core:** support `onCreate` with `ScalarReference` properties ([09e5ca8](https://github.com/mikro-orm/mikro-orm/commit/09e5ca89e7eeedfed3f4d155bf4844ee99f1d2a8)), closes [#5506](https://github.com/mikro-orm/mikro-orm/issues/5506)





## [6.2.3](https://github.com/mikro-orm/mikro-orm/compare/v6.2.2...v6.2.3) (2024-04-24)


### Bug Fixes

* **core:** fix handling of `first/last: 0` with cursor-based pagination ([508389e](https://github.com/mikro-orm/mikro-orm/commit/508389ea71cf63f4965d42b74a993572f388092b)), closes [#5501](https://github.com/mikro-orm/mikro-orm/issues/5501)
* **core:** ignore upsert with inlined embedded properties ([7d2bed6](https://github.com/mikro-orm/mikro-orm/commit/7d2bed627ef0ed65206b59c4d5143eff9fe0326b)), closes [#5500](https://github.com/mikro-orm/mikro-orm/issues/5500)
* **migrations:** fix reading migration snapshot ([096dcee](https://github.com/mikro-orm/mikro-orm/commit/096dcee04994d9c53f7e1bef6a6edf16589dddd4)), closes [#5497](https://github.com/mikro-orm/mikro-orm/issues/5497)
* **query-builder:** do not prune join branches when paginating and there are raw fragments in select clause ([4d0fe15](https://github.com/mikro-orm/mikro-orm/commit/4d0fe152c1ca9479668b6a8bf9a5019575388917)), closes [#5490](https://github.com/mikro-orm/mikro-orm/issues/5490)





## [6.2.2](https://github.com/mikro-orm/mikro-orm/compare/v6.2.1...v6.2.2) (2024-04-20)


### Bug Fixes

* **core:** do not enforce `require()` when running via ts-jest or on JSON imports ([7e8409b](https://github.com/mikro-orm/mikro-orm/commit/7e8409bb86ca6a35c755700b77e17b425c5ab186)), closes [#5461](https://github.com/mikro-orm/mikro-orm/issues/5461)
* **core:** fix folder-based discovery for multiple entities in single file ([#5464](https://github.com/mikro-orm/mikro-orm/issues/5464)) ([d64be7e](https://github.com/mikro-orm/mikro-orm/commit/d64be7ef5ba7c2a655ea014992905d8afde3c231))
* **core:** ignore serialization options when using `toPOJO()` ([#5481](https://github.com/mikro-orm/mikro-orm/issues/5481)) ([46d6eb4](https://github.com/mikro-orm/mikro-orm/commit/46d6eb4248903f6729b6263dbafd171b8782178c)), closes [#5479](https://github.com/mikro-orm/mikro-orm/issues/5479)
* **migrator:** store snapshot only after migration is generated ([#5470](https://github.com/mikro-orm/mikro-orm/issues/5470)) ([65ec57c](https://github.com/mikro-orm/mikro-orm/commit/65ec57cb441820c3db468869ab2ed9ce84aa9c5d))
* **mssql:** declare `import` types explicitly ([02494bf](https://github.com/mikro-orm/mikro-orm/commit/02494bf129e15261ba17218288a840120fedb089)), closes [#5462](https://github.com/mikro-orm/mikro-orm/issues/5462)
* **mysql:** fix reading `auto_increment_increment` value ([1da88af](https://github.com/mikro-orm/mikro-orm/commit/1da88af065d17e7550d12b67bfac715a7041e9f9)), closes [#5460](https://github.com/mikro-orm/mikro-orm/issues/5460)
* **postgres:** support wildcard native enums ([e183de3](https://github.com/mikro-orm/mikro-orm/commit/e183de3588437db2c41c9fb9d18940116f591a25)), closes [#5456](https://github.com/mikro-orm/mikro-orm/issues/5456)


### Features

* **entity-generator:** extend filtering options for EntityGenerator ([#5473](https://github.com/mikro-orm/mikro-orm/issues/5473)) ([0894ac9](https://github.com/mikro-orm/mikro-orm/commit/0894ac963bc3886e7a52596b4627c08627877afd)), closes [#5469](https://github.com/mikro-orm/mikro-orm/issues/5469)
* **query-builder:** allow returning promise from virtual entity `expression` ([ee98412](https://github.com/mikro-orm/mikro-orm/commit/ee9841287c2fe312ef342e16d1396f620e575d3e)), closes [#5475](https://github.com/mikro-orm/mikro-orm/issues/5475)





## [6.2.1](https://github.com/mikro-orm/mikro-orm/compare/v6.2.0...v6.2.1) (2024-04-12)


### Bug Fixes

* **core:** skip 1:1 owner auto-joins for lazy properties ([6442e57](https://github.com/mikro-orm/mikro-orm/commit/6442e5739fb8e3ed8284ec3bba64c7ee14808b97))
* **knex:** rework postgres and mysql dialect imports to fix compilation errors ([ffdca15](https://github.com/mikro-orm/mikro-orm/commit/ffdca15b5aa897f07988eb2218be893301636a5f))
* **mssql:** support instance names in `host` ([dc7dc4c](https://github.com/mikro-orm/mikro-orm/commit/dc7dc4cecfc8e3c426ce8c679365c8efa7705370)), closes [#5441](https://github.com/mikro-orm/mikro-orm/issues/5441)
* **query-builder:** do not ignore unmatching partial loading hints in `qb.joinAndSelect` ([ccdf018](https://github.com/mikro-orm/mikro-orm/commit/ccdf018efd879419729b3fab4d08b2d4c6b29140)), closes [#5445](https://github.com/mikro-orm/mikro-orm/issues/5445)
* **query-builder:** fix partial loading via `qb.joinAndSelect` with explicit aliasing ([da68503](https://github.com/mikro-orm/mikro-orm/commit/da6850329b93a5e6104acd2aa3ab946a805f045c)), closes [#5445](https://github.com/mikro-orm/mikro-orm/issues/5445)
* **query-builder:** generate join on condition for subquery joins with known property name ([3dfbbde](https://github.com/mikro-orm/mikro-orm/commit/3dfbbde23b576aec2a0c8ed455627e2ee5e78749)), closes [#5445](https://github.com/mikro-orm/mikro-orm/issues/5445)
* **query-builder:** respect collection property where conditions (declarative partial loading) ([3b4fc41](https://github.com/mikro-orm/mikro-orm/commit/3b4fc417c9f85f7309d78faddcf11985667c5c20)), closes [#5445](https://github.com/mikro-orm/mikro-orm/issues/5445)





## [6.2.0](https://github.com/mikro-orm/mikro-orm/compare/v6.1.12...v6.2.0) (2024-04-09)


### Bug Fixes

* **core:** do not select 1:1 owning FK twice ([fa69276](https://github.com/mikro-orm/mikro-orm/commit/fa6927617f490c272ba2c7fe30d8bac688c6b613))
* **core:** fix querying by embedded properties inside relations ([2e74699](https://github.com/mikro-orm/mikro-orm/commit/2e746991f964072d3afcad621b10424485e8466e)), closes [#5391](https://github.com/mikro-orm/mikro-orm/issues/5391)
* **core:** fix support for custom repositories in `@CreateRequestContext` on type level ([aacac83](https://github.com/mikro-orm/mikro-orm/commit/aacac830e7185fb923ad287bfd485fcc04fe0c4a))
* **core:** fix TypeError when ordering by embedded populating properties ([2c472ab](https://github.com/mikro-orm/mikro-orm/commit/2c472abaeb033347bca2cddd8820d0c97201a91d)), closes [#5389](https://github.com/mikro-orm/mikro-orm/issues/5389)
* **core:** ignore current context when creating repository instance ([4c12fc5](https://github.com/mikro-orm/mikro-orm/commit/4c12fc5bd3b8d3dbad6711eaeaf839cf3470dcc8)), closes [#5395](https://github.com/mikro-orm/mikro-orm/issues/5395)
* **core:** prefer entity type inference from the first parameter of entity manager methods ([523963b](https://github.com/mikro-orm/mikro-orm/commit/523963b459c0f5af4d9d0d78c03be9487efc9e9a))
* **core:** respect custom `EntityManager` type in `em.fork()` ([bb1a3f9](https://github.com/mikro-orm/mikro-orm/commit/bb1a3f917d9ed56aa274c9f3baf4d69aa893051e)), closes [#5415](https://github.com/mikro-orm/mikro-orm/issues/5415)
* **core:** support passing `Configuration` instance to `MikroORM.init` ([54a37d0](https://github.com/mikro-orm/mikro-orm/commit/54a37d016755f989545145e43abb56771b1e19ba)), closes [#5413](https://github.com/mikro-orm/mikro-orm/issues/5413)
* **entity-generator:** allow arbitrary class and prop names as identifiers ([#5359](https://github.com/mikro-orm/mikro-orm/issues/5359)) ([b0c0236](https://github.com/mikro-orm/mikro-orm/commit/b0c0236ac8a2154e7181ac737baccbe95782f337))
* **mariadb:** rework pagination mechanism to fix extra results ([a57cb19](https://github.com/mikro-orm/mikro-orm/commit/a57cb198654c541968e0c90d89d7186e7bb71b1a))
* **mysql:** support `order by nulls first/last` for raw query fragments in order by keys ([a2a8f0d](https://github.com/mikro-orm/mikro-orm/commit/a2a8f0df09c5e6f5420ecc352d1d034d84816a37))
* **postgres:** drop text enum check constraints only when necessary ([#5414](https://github.com/mikro-orm/mikro-orm/issues/5414)) ([5162345](https://github.com/mikro-orm/mikro-orm/commit/516234542373b6d62135b88e45df17d4e41cdf08)), closes [#4112](https://github.com/mikro-orm/mikro-orm/issues/4112)
* **postgres:** removed erroneous duplicates in FK discovery query ([#5376](https://github.com/mikro-orm/mikro-orm/issues/5376)) ([eec2b38](https://github.com/mikro-orm/mikro-orm/commit/eec2b387f165b5390185887b695e219c09bd9b60))
* **query-builder:** fix serialization hint of nested `qb.joinAndSelect()` calls ([c2843b9](https://github.com/mikro-orm/mikro-orm/commit/c2843b9fc5598b5f3af57cbf9f6105a35b0d3536))
* **schema:** improve detection of renamed columns ([4d13c58](https://github.com/mikro-orm/mikro-orm/commit/4d13c585e0b0ea5552eba606897370c8aeab4b57))
* **schema:** rework dropping columns to support custom schemas and merge drop column queries ([255f425](https://github.com/mikro-orm/mikro-orm/commit/255f42594652453ba39676ff22af88dbb5f1990d))


### Features

* **core:** add support for serialization groups ([#5416](https://github.com/mikro-orm/mikro-orm/issues/5416)) ([818c290](https://github.com/mikro-orm/mikro-orm/commit/818c29001a448e3d06fdc88e71f6a65ce9ff8b45))
* **core:** allow better type-safety for custom types via `IType` ([#5383](https://github.com/mikro-orm/mikro-orm/issues/5383)) ([0e18346](https://github.com/mikro-orm/mikro-orm/commit/0e183461026efb6d20c71623f366e7baa8041c40))
* **core:** allow configuring `driverOptions` on replica level ([05e81f8](https://github.com/mikro-orm/mikro-orm/commit/05e81f893a32b990d8bc0bebd22d86603242f156))
* **core:** include all dirty collections to `UoW.getCollectionUpdates()` ([e7bd66f](https://github.com/mikro-orm/mikro-orm/commit/e7bd66f523f6a12d89e16b4480a76321018c7e8b))
* **core:** make `assign` options configurable globally ([bc9f6f5](https://github.com/mikro-orm/mikro-orm/commit/bc9f6f5bbecac302f0beb227703a9654f71d967b)), closes [#5410](https://github.com/mikro-orm/mikro-orm/issues/5410)
* **libsql:** add libSQL driver ([#5417](https://github.com/mikro-orm/mikro-orm/issues/5417)) ([6c63e4b](https://github.com/mikro-orm/mikro-orm/commit/6c63e4bd45c81b3a09b668f13dc0ce240e85107c)), closes [#5283](https://github.com/mikro-orm/mikro-orm/issues/5283)
* **mssql:** add MS SQL Server driver ([#1375](https://github.com/mikro-orm/mikro-orm/issues/1375)) ([eeaad45](https://github.com/mikro-orm/mikro-orm/commit/eeaad45a60b3ef4732d5ba9eafc8719998e52181)), closes [#771](https://github.com/mikro-orm/mikro-orm/issues/771)
* **postgres:** allow defining deferred FK constraints ([#5384](https://github.com/mikro-orm/mikro-orm/issues/5384)) ([f42d171](https://github.com/mikro-orm/mikro-orm/commit/f42d171f8bc7604c7b36f15f680f37402990bf9e)), closes [#5306](https://github.com/mikro-orm/mikro-orm/issues/5306)
* **query-builder:** add `limit 1` when executing query via `getSingleResult()` or `execute('get')` ([c2b22e8](https://github.com/mikro-orm/mikro-orm/commit/c2b22e80c47eabd2284dca41cedd7c871a78eac4)), closes [#5379](https://github.com/mikro-orm/mikro-orm/issues/5379)
* **query-builder:** add `qb.getLoggerContext()` and `qb.setLoggerContext()` ([779fa15](https://github.com/mikro-orm/mikro-orm/commit/779fa15ac762a9bae843a8b2f009e1861527469f)), closes [#5358](https://github.com/mikro-orm/mikro-orm/issues/5358)
* **schema:** allow configuring `updateRule` and `deleteRule` for pivot tables ([cc69c3c](https://github.com/mikro-orm/mikro-orm/commit/cc69c3c391259c6160b3522c89b0852b3366921a))
* **schema:** improve `orm.schema.execute()` to support executing batches ([3c5a347](https://github.com/mikro-orm/mikro-orm/commit/3c5a347d0ce277dc8b33ed6f3dd6e6e4315aa4eb))
* **schema:** support recreating the whole database via `orm.schema.refreshDatabase()` ([2e4ab49](https://github.com/mikro-orm/mikro-orm/commit/2e4ab49e5abbb3ee6a6f19fd028cbce6d93e4aa0))


### Performance Improvements

* **core:** optimize metadata discovery ([c322f9b](https://github.com/mikro-orm/mikro-orm/commit/c322f9bcca087180a77c5ed006b1624dd4879790))
* **query-builder:** remove unnecessary join branches when pagination is applied ([d228976](https://github.com/mikro-orm/mikro-orm/commit/d228976d9ca4b8a2e69361ad31f63ef88977ee9e))





## [6.1.12](https://github.com/mikro-orm/mikro-orm/compare/v6.1.11...v6.1.12) (2024-03-24)


### Bug Fixes

* **core:** fix assignability of partially loaded entities ([9de4965](https://github.com/mikro-orm/mikro-orm/commit/9de4965dc1ec952b3addc2d902ee5587c2f38f05)), closes [#5374](https://github.com/mikro-orm/mikro-orm/issues/5374)
* **core:** fix inlining of `$and` conditions ([8ddb3e4](https://github.com/mikro-orm/mikro-orm/commit/8ddb3e4f5166a0e425c4a895fde003e80e0c6bdb)), closes [#5368](https://github.com/mikro-orm/mikro-orm/issues/5368)
* **entity-generator:** try to resolve errors for foreign keys without indexes ([f2094ab](https://github.com/mikro-orm/mikro-orm/commit/f2094ab3383bc7de9da892b8d259c67b1144c741)), closes [#5364](https://github.com/mikro-orm/mikro-orm/issues/5364)
* **postgres:** fix query for loading all foreign keys from existing schema ([2eb85d5](https://github.com/mikro-orm/mikro-orm/commit/2eb85d501727601ee86eba8c2c1a11d994cce8cf)), closes [#5364](https://github.com/mikro-orm/mikro-orm/issues/5364)
* **reflection:** fallback to not proving path to tsconfig if not found ([a24d80d](https://github.com/mikro-orm/mikro-orm/commit/a24d80dc3353a6a84c9c6f1ac26b3c7e3e824901))


### Features

* **cli:** add reason for failed connection check in `debug` command ([d61e248](https://github.com/mikro-orm/mikro-orm/commit/d61e248688676a875cdd16c9d780fe8485687c09))
* **core:** allow passing `EntityManager` or `EntityRepository` to `@CreateRequestContext` decorator ([184cdd4](https://github.com/mikro-orm/mikro-orm/commit/184cdd43ce4dcee5288b3297719914e9f25e50cb))
* **postgres:** add `?`, `?|` and `?&` json operators ([#5366](https://github.com/mikro-orm/mikro-orm/issues/5366)) ([6418872](https://github.com/mikro-orm/mikro-orm/commit/641887245abbded5df2d984fc24c6fe3cea80c9b)), closes [#4678](https://github.com/mikro-orm/mikro-orm/issues/4678)


### Performance Improvements

* **postgres:** try to optimize loading of foreign keys ([2dff96b](https://github.com/mikro-orm/mikro-orm/commit/2dff96bc48c6a84bc1fc213e8044b0ac722d4792)), closes [#5364](https://github.com/mikro-orm/mikro-orm/issues/5364)





## [6.1.11](https://github.com/mikro-orm/mikro-orm/compare/v6.1.10...v6.1.11) (2024-03-18)


### Bug Fixes

* **core:** improve serialization of lazily partially loaded entities ([1c7b446](https://github.com/mikro-orm/mikro-orm/commit/1c7b44652100aa4e940787b3ee7ca4e208039984)), closes [#5139](https://github.com/mikro-orm/mikro-orm/issues/5139)
* **core:** support unsetting composite FKs via flush ([64f2afd](https://github.com/mikro-orm/mikro-orm/commit/64f2afd1a899b86e54eef6e58d6f475b28f67c6f))
* **migrator:** type mismatch between Migration interface and class ([#5343](https://github.com/mikro-orm/mikro-orm/issues/5343)) ([2fba5ee](https://github.com/mikro-orm/mikro-orm/commit/2fba5eebbc118c98a890b3083d521b52b263ba30)), closes [#5340](https://github.com/mikro-orm/mikro-orm/issues/5340)
* **query-builder:** fix aliasing of FK when used in deeply nested and/or conditions ([ebb966c](https://github.com/mikro-orm/mikro-orm/commit/ebb966caae9f06a8c4a9fec7a642e678ddfebb66)), closes [#5086](https://github.com/mikro-orm/mikro-orm/issues/5086)
* **reflection:** respect custom tsconfig options ([e8cfdc0](https://github.com/mikro-orm/mikro-orm/commit/e8cfdc04cb5beed30f3ce144d7d57ee6d95e0c60))
* **sql:** fix aliasing of nested composite FK queries ([60b2c91](https://github.com/mikro-orm/mikro-orm/commit/60b2c9197249c8f982423ef320463cc8357b6542))





## [6.1.10](https://github.com/mikro-orm/mikro-orm/compare/v6.1.9...v6.1.10) (2024-03-14)


### Bug Fixes

* **core:** detect `ts-node` when using esm loader ([#5332](https://github.com/mikro-orm/mikro-orm/issues/5332)) ([23cc880](https://github.com/mikro-orm/mikro-orm/commit/23cc8803d22d90868e3411e77d5c81b04e7bc651))
* **core:** don't alias formulas in update/delete queries ([9e35642](https://github.com/mikro-orm/mikro-orm/commit/9e3564234ba80546df162b628bfebadad6b5c036)), closes [#5334](https://github.com/mikro-orm/mikro-orm/issues/5334)
* **core:** fix populating references for 1:m collections ([9b9027d](https://github.com/mikro-orm/mikro-orm/commit/9b9027d65a3dff6822b3463871e6571b3aa22a76)), closes [#5336](https://github.com/mikro-orm/mikro-orm/issues/5336)
* **core:** fix value of `hasPrev[/Next]Page` when paginating backwards ([#5320](https://github.com/mikro-orm/mikro-orm/issues/5320)) ([00239eb](https://github.com/mikro-orm/mikro-orm/commit/00239ebe97d65aef520c39fdc6121fc138ebb8ce))
* **postgres:** fix diffing of native enums (create/remove via `schema:update`) ([7c8be79](https://github.com/mikro-orm/mikro-orm/commit/7c8be795e5c5b365dbb03ecadc7709cc42794b12)), closes [#5322](https://github.com/mikro-orm/mikro-orm/issues/5322)
* **query-builder:** allow joining object/array properties ([fd90bae](https://github.com/mikro-orm/mikro-orm/commit/fd90bae88e02cda9f1f8fcb6246c723464209a00)), closes [#5325](https://github.com/mikro-orm/mikro-orm/issues/5325)
* **query-builder:** fix `join on` conditions where `or` operator ([92936ef](https://github.com/mikro-orm/mikro-orm/commit/92936efd8ba5aa97c5c204127116f48133d63f90))
* **schema:** support compound index over JSON property and a regular column ([319df49](https://github.com/mikro-orm/mikro-orm/commit/319df499742475c68df3581f4863be649aa564d7)), closes [#5333](https://github.com/mikro-orm/mikro-orm/issues/5333)
* **sql:** allow creating query builder from a global context ([9217bb3](https://github.com/mikro-orm/mikro-orm/commit/9217bb3fefe3bfa4570160b46f8475f2148bde97))
* **sql:** override FK value when it's disallowed by query condition ([0d20847](https://github.com/mikro-orm/mikro-orm/commit/0d20847ad10ba29f8bcab1c033400f6a2bf7b43a))


### Features

* **core:** add `onlyOwnProperties` option to `assign` helper ([#5330](https://github.com/mikro-orm/mikro-orm/issues/5330)) ([a081bea](https://github.com/mikro-orm/mikro-orm/commit/a081bea80d17c01213c26a9cf7ad4b89e05ab33a)), closes [#5327](https://github.com/mikro-orm/mikro-orm/issues/5327)
* **postgres:** provide more details in driver exceptions ([e782d06](https://github.com/mikro-orm/mikro-orm/commit/e782d0686e45ddfd1e91e613ed83b0b5a046dc6f))


### Performance Improvements

* **core:** disable change tracking on scalars when `flushMode: auto` ([fc30bfe](https://github.com/mikro-orm/mikro-orm/commit/fc30bfe13888293a9ac9b91d8bbc874eb3c98e31))





## [6.1.9](https://github.com/mikro-orm/mikro-orm/compare/v6.1.8...v6.1.9) (2024-03-10)


### Bug Fixes

* **core:** don't propagate changes from `em.transactional()` to upper context if its global ([7ac9a19](https://github.com/mikro-orm/mikro-orm/commit/7ac9a1945469264ea32727c2e63fd89d9f2d7ec8)), closes [#5309](https://github.com/mikro-orm/mikro-orm/issues/5309)
* **core:** ignore filters on relations inside embedded properties ([1e4b2ce](https://github.com/mikro-orm/mikro-orm/commit/1e4b2ce41d66e1686aac0d28bf8b6a06b2cbf9b4)), closes [#5310](https://github.com/mikro-orm/mikro-orm/issues/5310)
* **core:** improve checks for generated columns ([0396e1e](https://github.com/mikro-orm/mikro-orm/commit/0396e1e8c0cd65f1dcd4ea4d29419ed2b5e7446a))
* **core:** map virtual relations with `persist: false` as formulas to preserve aliasing ([20a4cfb](https://github.com/mikro-orm/mikro-orm/commit/20a4cfb005fed168786d0da806d1c89e29b6f4ab))
* **entity-generator:** emit missing imports in `EntitySchema` generated files ([#5311](https://github.com/mikro-orm/mikro-orm/issues/5311)) ([f680d66](https://github.com/mikro-orm/mikro-orm/commit/f680d66d8da08f0c6c898c3dd300bf1e920439b4))
* **entity-generator:** output type import statements for type only core imports ([#5317](https://github.com/mikro-orm/mikro-orm/issues/5317)) ([bd3f160](https://github.com/mikro-orm/mikro-orm/commit/bd3f160988ac48c9d1a0b591f5674f9b8f5e16e7))
* **migrator:** allow `up` and `down` methods to be synchronous ([#5316](https://github.com/mikro-orm/mikro-orm/issues/5316)) ([dd6daf9](https://github.com/mikro-orm/mikro-orm/commit/dd6daf9fb212c643bb1cc7679e47ed027847b656))


### Features

* **postgres:** add support for native enum arrays ([c2e362b](https://github.com/mikro-orm/mikro-orm/commit/c2e362bc6fe19ec792d13f475a11cf2290b94fde)), closes [#5322](https://github.com/mikro-orm/mikro-orm/issues/5322)





## [6.1.8](https://github.com/mikro-orm/mikro-orm/compare/v6.1.7...v6.1.8) (2024-03-06)


### Bug Fixes

* **core:** allow setting values to `null` on unloaded references ([1cbead6](https://github.com/mikro-orm/mikro-orm/commit/1cbead6eec839777e5f8f00e9fcdfe7a9a8088bf)), closes [#5274](https://github.com/mikro-orm/mikro-orm/issues/5274)
* **core:** fix bulk-inserting entities with nullable embedded arrays ([f16551e](https://github.com/mikro-orm/mikro-orm/commit/f16551ec37e4a12b29c7ada2427a29b81d15996e))
* **core:** skip STI discriminator condition when bulk-deleting entities ([fa712ca](https://github.com/mikro-orm/mikro-orm/commit/fa712ca134d16334aaba275779df14970ed8bfb8)), closes [#5303](https://github.com/mikro-orm/mikro-orm/issues/5303)
* **query-builder:** fix `qb.getResultAndCount()` when pagination is triggered ([67444c0](https://github.com/mikro-orm/mikro-orm/commit/67444c08a27af1a2d6d65ee061a4e54f1dac0734))





## [6.1.7](https://github.com/mikro-orm/mikro-orm/compare/v6.1.6...v6.1.7) (2024-03-04)


### Bug Fixes

* **core:** add `em.addFilter()` fallback signature that allows more than 3 types ([b6efd44](https://github.com/mikro-orm/mikro-orm/commit/b6efd4470e9c060c3611c1e3395bd9f500cd0376))
* **core:** fix aliasing of queries with collection operators ([0435faf](https://github.com/mikro-orm/mikro-orm/commit/0435faf712783c89ed8b9de456c8da1c4f551c91)), closes [#5301](https://github.com/mikro-orm/mikro-orm/issues/5301)
* **core:** ignore collection operators in `populateWhere` conditions ([7b6b363](https://github.com/mikro-orm/mikro-orm/commit/7b6b3634301469cd39fa18f39e6761f01a0d94bb))
* **query-builder:** check for duplicate selects when wrapping pagination query ([e005cc2](https://github.com/mikro-orm/mikro-orm/commit/e005cc22ef4e247f9741bdcaf1af012337977b7e))
* **query-builder:** fix cloning of alias map ([50d8fb9](https://github.com/mikro-orm/mikro-orm/commit/50d8fb9b1b3f9b59768badd70138c4b83e516bf1))


### Features

* **core:** validate wrong placement of collection operators ([c35e705](https://github.com/mikro-orm/mikro-orm/commit/c35e705714f2f88b8da8a0264b5517d6f991274f))





## [6.1.6](https://github.com/mikro-orm/mikro-orm/compare/v6.1.5...v6.1.6) (2024-02-28)


### Bug Fixes

* **core:** don't refresh collection state via `Collection.load()` ([f5be639](https://github.com/mikro-orm/mikro-orm/commit/f5be6393a272b7d2d6d4083361573b574d865ae6)), closes [#5268](https://github.com/mikro-orm/mikro-orm/issues/5268)
* **core:** fix type of `options` parameter in `repository.upsert/Many()` ([4c12e7f](https://github.com/mikro-orm/mikro-orm/commit/4c12e7f202ce93e884b4da87a8b3a5a42ee63216))
* **core:** support raw fragments in `orderBy` of 1:m and m:n relations ([ed80163](https://github.com/mikro-orm/mikro-orm/commit/ed801634b6677da9f123f7033f27452a40558602)), closes [#5277](https://github.com/mikro-orm/mikro-orm/issues/5277)
* **mysql:** apply current context when fetching `auto_increment_increment` ([#5280](https://github.com/mikro-orm/mikro-orm/issues/5280)) ([c8021da](https://github.com/mikro-orm/mikro-orm/commit/c8021da020d7afa0f338319811a72ef4c1877d12)), closes [#5279](https://github.com/mikro-orm/mikro-orm/issues/5279)


### Performance Improvements

* **core:** improve composite PK hashing ([73094ef](https://github.com/mikro-orm/mikro-orm/commit/73094efb8f140f57bf6e1f160edf209812182eab))
* **core:** improve hydration of simple FKs ([c4bd1f0](https://github.com/mikro-orm/mikro-orm/commit/c4bd1f0317a481df6fc55625353dd79f8dd056c4))
* **core:** optimize adding entities to large collections ([8a960d5](https://github.com/mikro-orm/mikro-orm/commit/8a960d571fc9c245d5dd10e5973e5b83ce454d92))





## [6.1.5](https://github.com/mikro-orm/mikro-orm/compare/v6.1.4...v6.1.5) (2024-02-21)


### Bug Fixes

* **core:** allow serializing raw SQL fragments outside of entity serialization ([9158f51](https://github.com/mikro-orm/mikro-orm/commit/9158f515e513310f593aade04e6bedaa29cd6459)), closes [#5257](https://github.com/mikro-orm/mikro-orm/issues/5257)
* **core:** ensure missing type validation ignores enums ([a916710](https://github.com/mikro-orm/mikro-orm/commit/a916710dfb48156976c45fb824f95fb958c87409)), closes [#5255](https://github.com/mikro-orm/mikro-orm/issues/5255)
* **core:** fix `orderBy` option on to-many properties with arrays ([fae2302](https://github.com/mikro-orm/mikro-orm/commit/fae2302bdfdc28629a8c21a6d53782d7d61b6240)), closes [#5265](https://github.com/mikro-orm/mikro-orm/issues/5265)
* **core:** ignore virtual properties in partial loading hint ([d327db5](https://github.com/mikro-orm/mikro-orm/commit/d327db528529298dd23d8eb089a67a5b5e96a7fb)), closes [#5261](https://github.com/mikro-orm/mikro-orm/issues/5261)
* **entity-generator:** fixed generation of unsigned columns ([#5254](https://github.com/mikro-orm/mikro-orm/issues/5254)) ([d78da29](https://github.com/mikro-orm/mikro-orm/commit/d78da297c701a319ea704847e97c2186934831bc))
* **entity-generator:** optional and hidden properties get type option + string defaults ([#5264](https://github.com/mikro-orm/mikro-orm/issues/5264)) ([12d3b54](https://github.com/mikro-orm/mikro-orm/commit/12d3b54118035195f5ee0ee5665e37a7f2e37164)), closes [#5260](https://github.com/mikro-orm/mikro-orm/issues/5260)
* **schema:** allow 1:m properties in pivot entities ([c370578](https://github.com/mikro-orm/mikro-orm/commit/c37057808aca5b6a4ac190d38374405edc833762))





## [6.1.4](https://github.com/mikro-orm/mikro-orm/compare/v6.1.3...v6.1.4) (2024-02-16)


### Bug Fixes

* **core:** fix populating 1:1 inverse sides when virtual FK is not selected ([46cb6a1](https://github.com/mikro-orm/mikro-orm/commit/46cb6a1ec91fe2b11dc6c8a0045c36ed194cabc8)), closes [#5245](https://github.com/mikro-orm/mikro-orm/issues/5245)
* **entity-generator:** use `Ref` wrapper on all lazy properties ([#5252](https://github.com/mikro-orm/mikro-orm/issues/5252)) ([50311cb](https://github.com/mikro-orm/mikro-orm/commit/50311cbdd66d289e7048c8d77b395a541a9f2605))
* **query-builder:** fix caching of raw query fragments when `qb.getQuery()` is called ([f79a752](https://github.com/mikro-orm/mikro-orm/commit/f79a752eee23b555927610cf9d75739294302029)), closes [#5247](https://github.com/mikro-orm/mikro-orm/issues/5247)


### Features

* **entity-generator:** added support for generated columns ([#5250](https://github.com/mikro-orm/mikro-orm/issues/5250)) ([d2186da](https://github.com/mikro-orm/mikro-orm/commit/d2186da4ed3265d8667069c3ac0514843987cb2b))





## [6.1.3](https://github.com/mikro-orm/mikro-orm/compare/v6.1.2...v6.1.3) (2024-02-13)


### Bug Fixes

* **core:** fix extra updates when embedded property name matches inner field name ([e008dab](https://github.com/mikro-orm/mikro-orm/commit/e008dabc3d22c011a67ac0d0004e67c200410557)), closes [#5240](https://github.com/mikro-orm/mikro-orm/issues/5240)
* **core:** fix validation for removing items from 1:m collections ([34b8473](https://github.com/mikro-orm/mikro-orm/commit/34b8473d7056b864f0b4c7825f784368299edcfa)), closes [#5243](https://github.com/mikro-orm/mikro-orm/issues/5243)
* **postgres:** implement casting for JSON queries on types like `double` or `bigint` ([b00eae6](https://github.com/mikro-orm/mikro-orm/commit/b00eae695aae3258e68799dc4e2101123eeac866)), closes [#5239](https://github.com/mikro-orm/mikro-orm/issues/5239)


### Features

* **entity-generator:** support `mapToPk` option ([#5241](https://github.com/mikro-orm/mikro-orm/issues/5241)) ([3afaa29](https://github.com/mikro-orm/mikro-orm/commit/3afaa29704c5889e24806a6f2027a465c53e0f2e))





## [6.1.2](https://github.com/mikro-orm/mikro-orm/compare/v6.1.1...v6.1.2) (2024-02-11)


### Bug Fixes

* **core:** allow multiple abstract levels for STI entities ([0c56118](https://github.com/mikro-orm/mikro-orm/commit/0c56118603c25a471a0c636912b976a4291290b3)), closes [#3745](https://github.com/mikro-orm/mikro-orm/issues/3745)
* **core:** respect user provided env vars over those from `.env` file ([e25ca11](https://github.com/mikro-orm/mikro-orm/commit/e25ca11c20ebbf83946c9e29b9beee8d08cd97e3))


### Features

* **entity-generator:** add the ability to use custom and/or core base entity ([#5232](https://github.com/mikro-orm/mikro-orm/issues/5232)) ([066dac1](https://github.com/mikro-orm/mikro-orm/commit/066dac1828802dca82361146b6eae012386baeff))





## [6.1.1](https://github.com/mikro-orm/mikro-orm/compare/v6.1.0...v6.1.1) (2024-02-10)


### Bug Fixes

* **core:** consider star populates on nested positions only for one level ([65d1575](https://github.com/mikro-orm/mikro-orm/commit/65d15753774aa5e61fbefaf86d9004ac206bec19)), closes [#5213](https://github.com/mikro-orm/mikro-orm/issues/5213)
* **core:** do not enforce `discriminatorColumn` type ([d2a016e](https://github.com/mikro-orm/mikro-orm/commit/d2a016eccceec59de5b9ee62e6905110951f4d92)), closes [#5224](https://github.com/mikro-orm/mikro-orm/issues/5224)
* **core:** fix change detection on STI entities ([3c43251](https://github.com/mikro-orm/mikro-orm/commit/3c43251d900f2b7bccd4117fd8cd57b1904232c8)), closes [#5224](https://github.com/mikro-orm/mikro-orm/issues/5224)
* **core:** fix optimistic locking on STI entities ([36ad806](https://github.com/mikro-orm/mikro-orm/commit/36ad8066858ad8cbfd6af5fc3bcf6e0c87dbf020)), closes [#5224](https://github.com/mikro-orm/mikro-orm/issues/5224)
* **core:** respect star in `parent.*` populate hints ([39910ab](https://github.com/mikro-orm/mikro-orm/commit/39910abb4d263c614868fcd4edc91cf12042ae32)), closes [#5213](https://github.com/mikro-orm/mikro-orm/issues/5213)
* **postgres:** declare dependency on `postgres-array` ([e73fd1a](https://github.com/mikro-orm/mikro-orm/commit/e73fd1a2ec92534c2889255132fb95129de1bb23))
* **postgres:** fix parsing of date properties inside object emebddables ([760ec77](https://github.com/mikro-orm/mikro-orm/commit/760ec77b1f852103f878998bb2c76edce1fb5c77)), closes [#5216](https://github.com/mikro-orm/mikro-orm/issues/5216)
* **reflection:** only validate known types to allow using type aliases ([d6b93be](https://github.com/mikro-orm/mikro-orm/commit/d6b93bee537e3e1b05756fda39c9bc320c93d4c1)), closes [#5221](https://github.com/mikro-orm/mikro-orm/issues/5221)


### Features

* **entity-generator:** support functions in extension hooks ([#5218](https://github.com/mikro-orm/mikro-orm/issues/5218)) ([b28321c](https://github.com/mikro-orm/mikro-orm/commit/b28321c14a848dcc5528044d5a4c0fe2a5bab6ba))





## [6.1.0](https://github.com/mikro-orm/mikro-orm/compare/v6.0.7...v6.1.0) (2024-02-04)


### Bug Fixes

* **core:** allow `CacheAdapter.get` to return `Promise<undefined>` ([#5200](https://github.com/mikro-orm/mikro-orm/issues/5200)) ([98ce1e5](https://github.com/mikro-orm/mikro-orm/commit/98ce1e5509e5f97f1ab7568593ee973b1ed49eb5)), closes [#5199](https://github.com/mikro-orm/mikro-orm/issues/5199)
* **core:** fix broken inference of `AutoPath` in TS 5.4 ([#5197](https://github.com/mikro-orm/mikro-orm/issues/5197)) ([8bbc252](https://github.com/mikro-orm/mikro-orm/commit/8bbc252cf1639a7653119bbc84bdf1a04e0410e1))
* **core:** handle possible match between virtual property name and another property's field name ([7fc779f](https://github.com/mikro-orm/mikro-orm/commit/7fc779f9b19271b12d2822ae754e80b309d361a9)), closes [#5191](https://github.com/mikro-orm/mikro-orm/issues/5191)
* **core:** make `wrap(e, true).__em` correctly typed to `EntityManager` ([35d607c](https://github.com/mikro-orm/mikro-orm/commit/35d607cba16d551a36085d93f68acb8ec693ee60))
* **core:** process upsert data to allow using entity instances in place of relations ([9305653](https://github.com/mikro-orm/mikro-orm/commit/930565364dbf9aee4a7f79034768ce0f665e731c)), closes [#5165](https://github.com/mikro-orm/mikro-orm/issues/5165)
* **core:** respect `upsertMany` options when batching ([d6d1381](https://github.com/mikro-orm/mikro-orm/commit/d6d138179f4f60071ce5efafc7a84e2befdae604)), closes [#5209](https://github.com/mikro-orm/mikro-orm/issues/5209)
* **core:** respect hidden properties of composite PKs during serialization ([3d1cba3](https://github.com/mikro-orm/mikro-orm/commit/3d1cba32dfbed2094943091a8b25e186b24d2b1d)), closes [#5203](https://github.com/mikro-orm/mikro-orm/issues/5203)
* **postgres:** improve diffing of native postgres enums ([49d6b4d](https://github.com/mikro-orm/mikro-orm/commit/49d6b4d561196c7c1e0c6f94e6cc1ee1966b9178)), closes [#5108](https://github.com/mikro-orm/mikro-orm/issues/5108)
* **query-builder:** support `convertToJSValueSQL` on returning statement of update queries ([2e1d6c8](https://github.com/mikro-orm/mikro-orm/commit/2e1d6c80d108b2b736a44fba87592604127ed266)), closes [#5176](https://github.com/mikro-orm/mikro-orm/issues/5176)


### Features

* **core:** add second EM parameter to `onCreate` and `onUpdate` callback ([a964aeb](https://github.com/mikro-orm/mikro-orm/commit/a964aeb54bd4082f3fcbb8848739223bcdbc1c05)), closes [#5201](https://github.com/mikro-orm/mikro-orm/issues/5201)
* **core:** allow declarative partial loading of collection items ([#5210](https://github.com/mikro-orm/mikro-orm/issues/5210)) ([5e4fa60](https://github.com/mikro-orm/mikro-orm/commit/5e4fa6024d803a410fa8cc3bb8ff9fd451e26ea2)), closes [#4963](https://github.com/mikro-orm/mikro-orm/issues/4963)
* **core:** allow mapping array columns to arrays of objects via `ArrayType` ([#5204](https://github.com/mikro-orm/mikro-orm/issues/5204)) ([42cc9cc](https://github.com/mikro-orm/mikro-orm/commit/42cc9ccf4639d430d8d1cc60bb5c3385b0e501f2)), closes [#5188](https://github.com/mikro-orm/mikro-orm/issues/5188)
* **entity-generator:** allow post processing the metadata ([#5113](https://github.com/mikro-orm/mikro-orm/issues/5113)) ([e82058f](https://github.com/mikro-orm/mikro-orm/commit/e82058f173f7f8404828b5974884b06d83f2b1eb)), closes [#5010](https://github.com/mikro-orm/mikro-orm/issues/5010)
* **knex:** add `loggerContext` parameter to `em.execute` ([b6d46df](https://github.com/mikro-orm/mikro-orm/commit/b6d46dfa779462a630e12983454f83bfdd409b58))





## [6.0.7](https://github.com/mikro-orm/mikro-orm/compare/v6.0.6...v6.0.7) (2024-01-30)


### Bug Fixes

* **core:** consider `PrimaryKeyProp` as optional properties for `em.create()` ([69522f2](https://github.com/mikro-orm/mikro-orm/commit/69522f2e7bee589cf3363bae9e65f5d1ed498405)), closes [#5187](https://github.com/mikro-orm/mikro-orm/issues/5187)
* **core:** do not add `undefined` to `null` types in `EntityDTO` ([d661c68](https://github.com/mikro-orm/mikro-orm/commit/d661c68dd8f529e92fc2275ce72fda0341d4e7bb)), closes [#5186](https://github.com/mikro-orm/mikro-orm/issues/5186)
* **core:** fix ignoring function properties when they are optional ([fb33934](https://github.com/mikro-orm/mikro-orm/commit/fb339341661afa3d8fde8f357028f05e64ae846f))
* **reflection:** fix validation of string enums when loading via `QueryBuilder` ([908864c](https://github.com/mikro-orm/mikro-orm/commit/908864c741b3cd42498852f926253b6dbc523530)), closes [#5185](https://github.com/mikro-orm/mikro-orm/issues/5185)


### Features

* **postgres:** add support for `interval` type ([659a613](https://github.com/mikro-orm/mikro-orm/commit/659a613f802b7c47f94ee2729425c8576b20146a)), closes [#5181](https://github.com/mikro-orm/mikro-orm/issues/5181)





## [6.0.6](https://github.com/mikro-orm/mikro-orm/compare/v6.0.5...v6.0.6) (2024-01-29)


### Bug Fixes

* **core:** ensure `em.insertMany` returns array of PKs for a single item too ([#5180](https://github.com/mikro-orm/mikro-orm/issues/5180)) ([0d58aaf](https://github.com/mikro-orm/mikro-orm/commit/0d58aaf77400638471f369406485fb3f42349ca6)), closes [#5179](https://github.com/mikro-orm/mikro-orm/issues/5179)
* **core:** fix TypeError caused by validation of duplicate field names ([01d8c26](https://github.com/mikro-orm/mikro-orm/commit/01d8c261b9a92e9e0b067e2f38875ac5c419bf86)), closes [#5163](https://github.com/mikro-orm/mikro-orm/issues/5163)
* **core:** make PK properties non-nullable in `EntityDTO` ([dc4fc6f](https://github.com/mikro-orm/mikro-orm/commit/dc4fc6f265ca0eb96fe647c16c3018014b91e5dc))
* **core:** respect optionality in `EntityDTO` type ([1691a79](https://github.com/mikro-orm/mikro-orm/commit/1691a799ff762e1ecde15388433cd2544e42fc5e))
* **core:** validate missing populate hint for cursor based pagination on relation properties ([ea48db0](https://github.com/mikro-orm/mikro-orm/commit/ea48db0c258080e6e98242a684122ba436c3cc04)), closes [#5155](https://github.com/mikro-orm/mikro-orm/issues/5155)
* **mongo:** ensure `assign` on object properties won't ignore changes ([a360300](https://github.com/mikro-orm/mikro-orm/commit/a360300d64b7de1bb31b281949f64180f412ac66)), closes [#5158](https://github.com/mikro-orm/mikro-orm/issues/5158)
* **query-builder:** only map the first result with `qb.getSingleResult()` ([0e56fe1](https://github.com/mikro-orm/mikro-orm/commit/0e56fe134775ed800bea99752a98ecd615c9d4a6)), closes [#5182](https://github.com/mikro-orm/mikro-orm/issues/5182)





## [6.0.5](https://github.com/mikro-orm/mikro-orm/compare/v6.0.4...v6.0.5) (2024-01-18)


### Bug Fixes

* **cli:** try to respect windows ESM binary ([57e91e2](https://github.com/mikro-orm/mikro-orm/commit/57e91e2d9a2ac6fbe51e503e9208fc300e6b0d13)), closes [#5147](https://github.com/mikro-orm/mikro-orm/issues/5147)
* **core:** do not infer `populate: ['*']` from `fields: ['*']` ([f658376](https://github.com/mikro-orm/mikro-orm/commit/f658376c81ad4636efbe21ee03df58bf5bf7d471)), closes [#5139](https://github.com/mikro-orm/mikro-orm/issues/5139)
* **core:** do not mutate data provided to `em.upsert/Many` ([3d8c242](https://github.com/mikro-orm/mikro-orm/commit/3d8c242f6576c234c9d6b1eabbebe510039e3099)), closes [#5136](https://github.com/mikro-orm/mikro-orm/issues/5136)
* **core:** don't convert mapped types for constructor parameters when creating new entity ([37befd3](https://github.com/mikro-orm/mikro-orm/commit/37befd30e7125a4248600b0324109664729ef75f)), closes [#5150](https://github.com/mikro-orm/mikro-orm/issues/5150)
* **core:** fix bigint mode detection when hydrating new entity from returning statement ([a42321d](https://github.com/mikro-orm/mikro-orm/commit/a42321d422b6a2f86e6e6e319627dba13f2d7461)), closes [#5146](https://github.com/mikro-orm/mikro-orm/issues/5146)
* **core:** merge serialization hints when lazy populating ([f1d2487](https://github.com/mikro-orm/mikro-orm/commit/f1d2487c690da948cedd77bcfd0e82048b8592b4)), closes [#5138](https://github.com/mikro-orm/mikro-orm/issues/5138)
* **query-builder:** cache knex QB instance to get around issues with raw fragments ([f6e76d8](https://github.com/mikro-orm/mikro-orm/commit/f6e76d858e1b4869a8f9a93a518df4837d294df1))
* **reflection:** improve detection of `Ref` types with FK as PK ([c8858d2](https://github.com/mikro-orm/mikro-orm/commit/c8858d225f514957fc13591bb8806dbba2227e45)), closes [#5144](https://github.com/mikro-orm/mikro-orm/issues/5144)





## [6.0.4](https://github.com/mikro-orm/mikro-orm/compare/v6.0.3...v6.0.4) (2024-01-15)


### Bug Fixes

* **core:** respect reloaded properties of partially loaded entity during serialization ([f7b6497](https://github.com/mikro-orm/mikro-orm/commit/f7b649738a484cbe87c908ca42ec1fa53d963de5)), closes [#5128](https://github.com/mikro-orm/mikro-orm/issues/5128)


### Features

* **core:** allow reusing single `raw` fragment in multiple keys ([fc967e2](https://github.com/mikro-orm/mikro-orm/commit/fc967e23f40c5201125ad3ab43be6bece4573862)), closes [#5129](https://github.com/mikro-orm/mikro-orm/issues/5129)





## [6.0.3](https://github.com/mikro-orm/mikro-orm/compare/v6.0.2...v6.0.3) (2024-01-13)


### Bug Fixes

* **core:** allow raw fragments as keys with multiple conditions ([d0d5de8](https://github.com/mikro-orm/mikro-orm/commit/d0d5de8cc0b0f290a75dbd5962953b8e4065d02e)), closes [#5112](https://github.com/mikro-orm/mikro-orm/issues/5112)
* **core:** fix leaking raw fragments cache ([9638410](https://github.com/mikro-orm/mikro-orm/commit/9638410583fb660de807dd1e18777d26bec9bfd6))
* **core:** respect raw fragments in `orderBy` and `populateOrderBy` ([7bf986c](https://github.com/mikro-orm/mikro-orm/commit/7bf986cebba090207f7d42f1c1d66fed919e7c77)), closes [#5110](https://github.com/mikro-orm/mikro-orm/issues/5110)
* **core:** support raw fragments in order by with pagination ([67ee6f5](https://github.com/mikro-orm/mikro-orm/commit/67ee6f59d5f26d283080a686a001ab6dfa8ea515)), closes [#5110](https://github.com/mikro-orm/mikro-orm/issues/5110)


### Features

* **core:** do not map array types as `Loaded` when partially loaded ([75d035d](https://github.com/mikro-orm/mikro-orm/commit/75d035dbb56dfe4aec78db39a7dfbc99e1d372a2)), closes [#5123](https://github.com/mikro-orm/mikro-orm/issues/5123)
* **core:** export `AutoPath` and `UnboxArray` types ([000c50c](https://github.com/mikro-orm/mikro-orm/commit/000c50c2dd1e6c8d74ee4994633c65192f420105)), closes [#5124](https://github.com/mikro-orm/mikro-orm/issues/5124)
* **core:** map double and decimal properties to `number` or `string` based on the runtime type ([312f293](https://github.com/mikro-orm/mikro-orm/commit/312f293cb9a23115da440c64e0a8ff7e21ae13c2)), closes [#5120](https://github.com/mikro-orm/mikro-orm/issues/5120)
* **core:** provide mapped custom types into constructor with `forceEntityConstructor` ([b293789](https://github.com/mikro-orm/mikro-orm/commit/b293789441ee179dcfac4016774bfd2ccb6f830b)), closes [#5118](https://github.com/mikro-orm/mikro-orm/issues/5118)





## [6.0.2](https://github.com/mikro-orm/mikro-orm/compare/v6.0.1...v6.0.2) (2024-01-09)


### Bug Fixes

* **core:** allow calling `em.remove` with not managed entity ([88e055e](https://github.com/mikro-orm/mikro-orm/commit/88e055e09b2b2c9ef0abe192dbec7f175fe9fd4e)), closes [#5103](https://github.com/mikro-orm/mikro-orm/issues/5103)
* **core:** respect `logging` options in `em.count` ([3b94bf9](https://github.com/mikro-orm/mikro-orm/commit/3b94bf957243e8ded787c853915c84cfc94832d7)), closes [#5085](https://github.com/mikro-orm/mikro-orm/issues/5085)
* **core:** respect `logging` options in `em.count` ([481d02e](https://github.com/mikro-orm/mikro-orm/commit/481d02ed393a582856404be6cdf86ae028b5ba34)), closes [#5085](https://github.com/mikro-orm/mikro-orm/issues/5085)
* **core:** support `$some/$none/$every` on nested relations ([2b3bd4d](https://github.com/mikro-orm/mikro-orm/commit/2b3bd4d15c9daac2cb2ba058bca3e74be8ca9cbc)), closes [#5099](https://github.com/mikro-orm/mikro-orm/issues/5099)
* **reflection:** fix processing of `Opt` and `Hidden` types when used in intersection ([2bd612e](https://github.com/mikro-orm/mikro-orm/commit/2bd612ec70d73bf7f5e6e5d70e2c7259e8d9c90b))


### Features

* **core:** add `wrap(entity).isManaged()` ([5931649](https://github.com/mikro-orm/mikro-orm/commit/59316495304199b93685324d0077b22fec502fb6)), closes [#5082](https://github.com/mikro-orm/mikro-orm/issues/5082)
* **entity-generator:** allow customizing entity name based on schema name ([1e5afb8](https://github.com/mikro-orm/mikro-orm/commit/1e5afb8acbb7a8f06da1245d419074272d685f0f)), closes [#5084](https://github.com/mikro-orm/mikro-orm/issues/5084)





## [6.0.1](https://github.com/mikro-orm/mikro-orm/compare/v6.0.0...v6.0.1) (2024-01-08)

**Note:** Version bump only for package @mikro-orm/root





## [6.0.0](https://github.com/mikro-orm/mikro-orm/compare/v5.9.7...v6.0.0) (2024-01-08)


### Bug Fixes

* **core:** allow using classes with private constructor with `EntitySchema` ([d4d5b5e](https://github.com/mikro-orm/mikro-orm/commit/d4d5b5e9ca58d8c8b9be1acfc76c40d79e55622c))
* **core:** collection.loadItems() should respect wildcard populate ([7f3065f](https://github.com/mikro-orm/mikro-orm/commit/7f3065ff0b20cf3280f201119d3c9cdd632953ef)), closes [#4977](https://github.com/mikro-orm/mikro-orm/issues/4977)
* **core:** do not load all env vars from `.env` files automatically ([09e60f7](https://github.com/mikro-orm/mikro-orm/commit/09e60f7e1ccce96c98edcbef32ea005e2b957564))
* **core:** ensure correct serialization of not fully populated collections ([a39a850](https://github.com/mikro-orm/mikro-orm/commit/a39a850ee6b7d9173dadb654a1718d374783f38c))
* **core:** ensure propagation and change-tracking works with `useDefineForClassFields` ([#4730](https://github.com/mikro-orm/mikro-orm/issues/4730)) ([83f24aa](https://github.com/mikro-orm/mikro-orm/commit/83f24aa3fc065fdfa50ae3df6af5ea14516018e1)), closes [#4216](https://github.com/mikro-orm/mikro-orm/issues/4216)
* **core:** fix automatic calling of `ensureDatabase` on `init` ([827b1f1](https://github.com/mikro-orm/mikro-orm/commit/827b1f1e5fb25b8b29a75a5877c23806bf6dbc33))
* **core:** fix hydration of complex FKs with joined strategy ([a4f30ac](https://github.com/mikro-orm/mikro-orm/commit/a4f30ac14d75c73d78eac6039dc544083d1eddee))
* **core:** fix hydration of object embeddables via joined strategy ([b3e3e55](https://github.com/mikro-orm/mikro-orm/commit/b3e3e555758ab250f6d1ba478b596f9eb5cbb6bd)), closes [#5020](https://github.com/mikro-orm/mikro-orm/issues/5020)
* **core:** ignore SQL converter on object embeddables with custom types ([83b989e](https://github.com/mikro-orm/mikro-orm/commit/83b989ebdb2adc27c2f42f717f5d95abd01c109c)), closes [#5074](https://github.com/mikro-orm/mikro-orm/issues/5074)
* **core:** improve `EntitySchema` typing for `repository` option ([37ee42e](https://github.com/mikro-orm/mikro-orm/commit/37ee42e1db019cfaae3f7ff743377c7596b594f9)), closes [#5006](https://github.com/mikro-orm/mikro-orm/issues/5006)
* **core:** make `em.create` strictly typed for relations too ([#4752](https://github.com/mikro-orm/mikro-orm/issues/4752)) ([3535cc0](https://github.com/mikro-orm/mikro-orm/commit/3535cc05fc87bb46bfac46b91465587f08328153)), closes [#4748](https://github.com/mikro-orm/mikro-orm/issues/4748)
* **core:** make `Loaded` type more flexible ([c95e3b6](https://github.com/mikro-orm/mikro-orm/commit/c95e3b635f70bfecbef31ec1a416c5f7014f3ade)), closes [#3277](https://github.com/mikro-orm/mikro-orm/issues/3277)
* **core:** mark `Reference.set()` as private ([#5017](https://github.com/mikro-orm/mikro-orm/issues/5017)) ([5aebf0b](https://github.com/mikro-orm/mikro-orm/commit/5aebf0bddfdef41edbce737286faa52dd7783cd1)), closes [#5003](https://github.com/mikro-orm/mikro-orm/issues/5003)
* **core:** refactor mapping of `Date` properties ([#4391](https://github.com/mikro-orm/mikro-orm/issues/4391)) ([3a80369](https://github.com/mikro-orm/mikro-orm/commit/3a8036928ce36d31a2005b7e5133cf825b84a1b5)), closes [#4362](https://github.com/mikro-orm/mikro-orm/issues/4362) [#4360](https://github.com/mikro-orm/mikro-orm/issues/4360) [#1476](https://github.com/mikro-orm/mikro-orm/issues/1476)
* **core:** respect `@Index` and `@Unique` decorators on embeddables ([#4736](https://github.com/mikro-orm/mikro-orm/issues/4736)) ([c3d7717](https://github.com/mikro-orm/mikro-orm/commit/c3d77178f50d0b162baa95cf3dedb9065666e582))
* **core:** respect global `schema` option in first level cache ([1833455](https://github.com/mikro-orm/mikro-orm/commit/18334552e69d39d5e344bbf62a95888c24ff7349))
* **core:** respect schema option for entity instances in `em.insert/Many` ([7eae031](https://github.com/mikro-orm/mikro-orm/commit/7eae031a6b31eb29f38afb0d3359fec5116685c7)), closes [#4424](https://github.com/mikro-orm/mikro-orm/issues/4424)
* **core:** return managed entity from `em.refresh()` ([0bf5363](https://github.com/mikro-orm/mikro-orm/commit/0bf5363ef8fff4b3b965d744d18d51af55eb45cf))
* **core:** return managed entity from `em.refresh()` ([55815f4](https://github.com/mikro-orm/mikro-orm/commit/55815f4511750dbac4da8358bff115a54221425a))
* **core:** rework `Collection` initialization to use `em.populate()` ([#4571](https://github.com/mikro-orm/mikro-orm/issues/4571)) ([7495142](https://github.com/mikro-orm/mikro-orm/commit/749514234752274212203b18189ba72494cd246e)), closes [#4464](https://github.com/mikro-orm/mikro-orm/issues/4464)
* **core:** rework pivot table joining ([#4438](https://github.com/mikro-orm/mikro-orm/issues/4438)) ([0506d36](https://github.com/mikro-orm/mikro-orm/commit/0506d36dc1e5bad16aeefee8419717e0054c6764)), closes [#4423](https://github.com/mikro-orm/mikro-orm/issues/4423)
* **core:** support embedded properties with conflicting property names ([b43ef63](https://github.com/mikro-orm/mikro-orm/commit/b43ef6334b28cf8a128260886c3453bac8c510ff)), closes [#5065](https://github.com/mikro-orm/mikro-orm/issues/5065)
* **core:** use `join on` conditions for `populateWhere` ([#4025](https://github.com/mikro-orm/mikro-orm/issues/4025)) ([a03e57c](https://github.com/mikro-orm/mikro-orm/commit/a03e57c5c70ed08de9626e454e1b8d0d17df574a)), closes [#3871](https://github.com/mikro-orm/mikro-orm/issues/3871)
* **entity-generator:** use index expressions for complex indexes (e.g. conditional) ([64a39f8](https://github.com/mikro-orm/mikro-orm/commit/64a39f82c7d391d28e28c639512a810c516f08a9)), closes [#4911](https://github.com/mikro-orm/mikro-orm/issues/4911)
* **knex:** respect connection type in `em.getKnex()` ([46957ba](https://github.com/mikro-orm/mikro-orm/commit/46957ba7a7a89004fe6cd40ebc226911fca9ca89))
* **mongo:** don't rename `id` to `_id` for embeddables and entities without serialized PK ([0cee82d](https://github.com/mikro-orm/mikro-orm/commit/0cee82d1806456443ec5d096a574f856c7d1102e)), closes [#4960](https://github.com/mikro-orm/mikro-orm/issues/4960)
* **postgres:** allow postgres array operators on embedded array properties ([ecf1f0c](https://github.com/mikro-orm/mikro-orm/commit/ecf1f0c96484178a4d7fc8228c2a41198d20ec30)), closes [#4930](https://github.com/mikro-orm/mikro-orm/issues/4930)
* **postgres:** parse timestamp dates less than year 100 ([e774d40](https://github.com/mikro-orm/mikro-orm/commit/e774d4092eb13d81772701f7d8e35ada55fb4d45)), closes [#5071](https://github.com/mikro-orm/mikro-orm/issues/5071)
* respect postgresql no timestamptz precision default ([#3832](https://github.com/mikro-orm/mikro-orm/issues/3832)) ([9fd7e26](https://github.com/mikro-orm/mikro-orm/commit/9fd7e2610912971ae5cccf307fc97dc2a02706fa))
* **sql:** do not alias conditions for update queries with collection operators ([5820d66](https://github.com/mikro-orm/mikro-orm/commit/5820d66cc7a81a357d6397f1e234a5485f2054d5)), closes [#4956](https://github.com/mikro-orm/mikro-orm/issues/4956)
* **sql:** do not branch to-many joins for `$and` with a single item ([a737b20](https://github.com/mikro-orm/mikro-orm/commit/a737b207744a85b2034a5e4a2b362e4aaefea570))
* **test:** fixed seed-manager.test.js on windows ([#4924](https://github.com/mikro-orm/mikro-orm/issues/4924)) ([27a4504](https://github.com/mikro-orm/mikro-orm/commit/27a4504e2984393b8c0065b4adab4ebe913fa222))


### Code Refactoring

* remove `JavaScriptMetadataProvider` ([4e337cb](https://github.com/mikro-orm/mikro-orm/commit/4e337cb55f765196c31f93a01bb6380708f63a0b))
* remove `Reference.load(prop: keyof T)` signature ([#5015](https://github.com/mikro-orm/mikro-orm/issues/5015)) ([32b48f7](https://github.com/mikro-orm/mikro-orm/commit/32b48f7ea959880bd6b61720c83515f2bfcb8822))


### Features

* **core:** add `@EnsureRequestContext` decorator + rename `@UseRequestContext` ([5e088ae](https://github.com/mikro-orm/mikro-orm/commit/5e088ae837f4c91ae5c5a27964b7ee94db82fc48)), closes [#4009](https://github.com/mikro-orm/mikro-orm/issues/4009)
* **core:** add `Collection.load()` method ([8aa1ad1](https://github.com/mikro-orm/mikro-orm/commit/8aa1ad1fef91869b43ec17cc36bbe627d6bb9b7a))
* **core:** add `EagerProps` symbol to respect eager props on type level ([dfcf1f8](https://github.com/mikro-orm/mikro-orm/commit/dfcf1f88be79f855a45e5d5545118d6e541dc1a3))
* **core:** add `em.findAll()` with optional `where` option ([#4946](https://github.com/mikro-orm/mikro-orm/issues/4946)) ([23b0551](https://github.com/mikro-orm/mikro-orm/commit/23b05510b833c970e3af3930dcb82fe74f61a798)), closes [#3982](https://github.com/mikro-orm/mikro-orm/issues/3982)
* **core:** add `FindOptions.exclude` ([#5024](https://github.com/mikro-orm/mikro-orm/issues/5024)) ([fe239cf](https://github.com/mikro-orm/mikro-orm/commit/fe239cf1c273af0e0128b38b7bd6d47064081194))
* **core:** add `GeneratedCacheAdapter` for production usage ([#4167](https://github.com/mikro-orm/mikro-orm/issues/4167)) ([bd478af](https://github.com/mikro-orm/mikro-orm/commit/bd478affd81f61f9aab8b94752d897ef871e1f0a)), closes [#4164](https://github.com/mikro-orm/mikro-orm/issues/4164)
* **core:** add `Hidden`type as an alternative to `HiddenProps` symbol ([#5009](https://github.com/mikro-orm/mikro-orm/issues/5009)) ([c047bb1](https://github.com/mikro-orm/mikro-orm/commit/c047bb1e702a1a59fb6bf5efff26cbb41c2b6cdc))
* **core:** add `HiddenProps` symbol as type-level companion for `hidden: true` ([7984769](https://github.com/mikro-orm/mikro-orm/commit/79847697d8a93ca5ea967d34ace81719e621ae4e)), closes [#4093](https://github.com/mikro-orm/mikro-orm/issues/4093)
* **core:** add `MikroORM.initSync()` helper ([#4166](https://github.com/mikro-orm/mikro-orm/issues/4166)) ([8b1a1fa](https://github.com/mikro-orm/mikro-orm/commit/8b1a1fa324db9227f5caae35fb2d8ab6a2b76e8a)), closes [#4164](https://github.com/mikro-orm/mikro-orm/issues/4164)
* **core:** add `Opt` type as an alternative to `OptionalProps` symbol ([#4753](https://github.com/mikro-orm/mikro-orm/issues/4753)) ([8853904](https://github.com/mikro-orm/mikro-orm/commit/8853904e8f09a96cb0b66fdb4f4f658a60a1c8ba))
* **core:** add `orm.checkConnection()` helper ([#4961](https://github.com/mikro-orm/mikro-orm/issues/4961)) ([b868f02](https://github.com/mikro-orm/mikro-orm/commit/b868f02870c116315513188d4bf24bee5c362d24)), closes [#4959](https://github.com/mikro-orm/mikro-orm/issues/4959)
* **core:** add `ScalarRef` and `EntityRef` types to allow explicit control ([1ef7856](https://github.com/mikro-orm/mikro-orm/commit/1ef7856a1cdf8d327765fc86e450b06c9ddd97c9)), closes [#4907](https://github.com/mikro-orm/mikro-orm/issues/4907)
* **core:** add `sql.now()`, `sql.lower()` and `sql.upper()` functions ([#5044](https://github.com/mikro-orm/mikro-orm/issues/5044)) ([016fe63](https://github.com/mikro-orm/mikro-orm/commit/016fe63e0e0db448a31da00c4690fc5c5ae59069))
* **core:** add `sql.ref()` helper ([#4402](https://github.com/mikro-orm/mikro-orm/issues/4402)) ([b695811](https://github.com/mikro-orm/mikro-orm/commit/b6958115a52c500c2b61b6a91b8ef3a9abb2a8e9))
* **core:** add cursor-based pagination via `em.findByCursor()` ([#3975](https://github.com/mikro-orm/mikro-orm/issues/3975)) ([1e6825f](https://github.com/mikro-orm/mikro-orm/commit/1e6825f2ff5a7d505b73225b1696b44629a7eebb))
* **core:** add customizable `LoggerContext` with labeling support ([#4233](https://github.com/mikro-orm/mikro-orm/issues/4233)) ([b985646](https://github.com/mikro-orm/mikro-orm/commit/b985646d77590c7b36757381aff5da5256b5bc12)), closes [#4230](https://github.com/mikro-orm/mikro-orm/issues/4230)
* **core:** add discovery hooks `onMetadata` and `afterDiscovered` ([#4799](https://github.com/mikro-orm/mikro-orm/issues/4799)) ([5f6c4f8](https://github.com/mikro-orm/mikro-orm/commit/5f6c4f8b5af2586e0d01af7014e6f1f614fd8b02))
* **core:** add entity to identity map on `em.persist()` ([1b09d26](https://github.com/mikro-orm/mikro-orm/commit/1b09d263f94f4c216936f6f85673810f7c6f9099)), closes [#4905](https://github.com/mikro-orm/mikro-orm/issues/4905)
* **core:** add global `serialization.forceObject` option ([731087d](https://github.com/mikro-orm/mikro-orm/commit/731087def690418b39089a1e08d982d16004ed94)), closes [#4881](https://github.com/mikro-orm/mikro-orm/issues/4881)
* **core:** add optional `Type.compareValues` method to allow custom comparators ([732307a](https://github.com/mikro-orm/mikro-orm/commit/732307a1ec9a6ab7309ba43c7f835c067079c7cd)), closes [#4870](https://github.com/mikro-orm/mikro-orm/issues/4870)
* **core:** add support for indexes on JSON properties ([#4735](https://github.com/mikro-orm/mikro-orm/issues/4735)) ([82c8629](https://github.com/mikro-orm/mikro-orm/commit/82c8629d5e96a8552890cd17eb485ca3020156dc)), closes [#1230](https://github.com/mikro-orm/mikro-orm/issues/1230)
* **core:** allow all `CountOptions` in `Collection.loadCount()` ([25d1851](https://github.com/mikro-orm/mikro-orm/commit/25d18512d44ca1d57514d6df235db650045253a7))
* **core:** allow auto-discovery of base classes with `EntitySchema` ([10cfd28](https://github.com/mikro-orm/mikro-orm/commit/10cfd28785b01cebdbf80686debec8567ee1ba30))
* **core:** allow class references in `subscribers` array ([7c8f776](https://github.com/mikro-orm/mikro-orm/commit/7c8f776c70450319d8d3e47902cf7ce67fc046d6)), closes [#4231](https://github.com/mikro-orm/mikro-orm/issues/4231)
* **core:** allow configuring filters in `Reference.load()` and `Collection.load()` ([#5025](https://github.com/mikro-orm/mikro-orm/issues/5025)) ([06012f7](https://github.com/mikro-orm/mikro-orm/commit/06012f79f06d1f7378da1c5083d17c20ebf0839a)), closes [#4975](https://github.com/mikro-orm/mikro-orm/issues/4975)
* **core:** allow defining `serialization.forceObject: true` on type level ([#5045](https://github.com/mikro-orm/mikro-orm/issues/5045)) ([88eb3e5](https://github.com/mikro-orm/mikro-orm/commit/88eb3e5a24284b523437de55e7f019689cf65c3d))
* **core:** allow disabling colors via `colors` ORM config option ([1bcaf09](https://github.com/mikro-orm/mikro-orm/commit/1bcaf0954292e952bf5413466bb33b8ac1595cdd)), closes [#5037](https://github.com/mikro-orm/mikro-orm/issues/5037)
* **core:** allow extending `EntityManager` ([#5064](https://github.com/mikro-orm/mikro-orm/issues/5064)) ([6c363e7](https://github.com/mikro-orm/mikro-orm/commit/6c363e7666ddf713ae601d1c9325c5b7f4523fbe))
* **core:** allow inferring populate hint from filter via `populate: ['$infer']` ([#4939](https://github.com/mikro-orm/mikro-orm/issues/4939)) ([080fdbb](https://github.com/mikro-orm/mikro-orm/commit/080fdbb7cde3a1c5d158330eeef0b6b855712c9d)), closes [#1309](https://github.com/mikro-orm/mikro-orm/issues/1309)
* **core:** allow M:1 and 1:1 relations in virtual entities ([#4932](https://github.com/mikro-orm/mikro-orm/issues/4932)) ([164a69e](https://github.com/mikro-orm/mikro-orm/commit/164a69eaa13a66805423071f7ccd4ddbe8a15c59))
* **core:** allow mapping database defaults from inline embeddables ([#4384](https://github.com/mikro-orm/mikro-orm/issues/4384)) ([22ad61e](https://github.com/mikro-orm/mikro-orm/commit/22ad61e5b6487947c60334739db3e197a9934417)), closes [#3887](https://github.com/mikro-orm/mikro-orm/issues/3887)
* **core:** allow overriding global logging options on per-query basis ([#4273](https://github.com/mikro-orm/mikro-orm/issues/4273)) ([51b6250](https://github.com/mikro-orm/mikro-orm/commit/51b62507e2bbed5f9fbc07c02451aadb49d5cd88)), closes [#4223](https://github.com/mikro-orm/mikro-orm/issues/4223)
* **core:** allow overriding ORM config path via `--config` ([#3924](https://github.com/mikro-orm/mikro-orm/issues/3924)) ([2c929e0](https://github.com/mikro-orm/mikro-orm/commit/2c929e06ffab996fa23664a19c7429305868b5c1))
* **core:** allow passing string values for `PopulateHint` enum (`populateWhere`) ([2bd21eb](https://github.com/mikro-orm/mikro-orm/commit/2bd21ebc431ba7ff0e9cf0d488ff5455aa707203))
* **core:** allow populating collections with references ([#4776](https://github.com/mikro-orm/mikro-orm/issues/4776)) ([3da6c39](https://github.com/mikro-orm/mikro-orm/commit/3da6c39aeef295aa63eed7ce52630c9c5840e158)), closes [#1158](https://github.com/mikro-orm/mikro-orm/issues/1158)
* **core:** allow setting logger context on EM level ([#5023](https://github.com/mikro-orm/mikro-orm/issues/5023)) ([7e56104](https://github.com/mikro-orm/mikro-orm/commit/7e5610400ba30623f31c56ffd480de1bbe37b9c6)), closes [#5022](https://github.com/mikro-orm/mikro-orm/issues/5022)
* **core:** allow type-safe populate all via `populate: ['*']` ([#4927](https://github.com/mikro-orm/mikro-orm/issues/4927)) ([7780f34](https://github.com/mikro-orm/mikro-orm/commit/7780f34fae2a34b38f9e291b302b1e38ece447a6)), closes [#4920](https://github.com/mikro-orm/mikro-orm/issues/4920)
* **core:** allow using `Ref` wrapper on scalar properties ([#4358](https://github.com/mikro-orm/mikro-orm/issues/4358)) ([f9c30f1](https://github.com/mikro-orm/mikro-orm/commit/f9c30f1f6ea5788f72cc50b37411de6ea31068e5))
* **core:** allow using dataloader for references and collections ([#4321](https://github.com/mikro-orm/mikro-orm/issues/4321)) ([8f4790f](https://github.com/mikro-orm/mikro-orm/commit/8f4790f01b0704cb18d31ff89686ec2eb80b6537)), closes [#266](https://github.com/mikro-orm/mikro-orm/issues/266)
* **core:** allow using string values for `loadStrategy` and `flushMode` ([f4e4e3b](https://github.com/mikro-orm/mikro-orm/commit/f4e4e3b8fd9e7e13796a000008d88eab789605de))
* **core:** auto-join M:1 and 1:1 relations with filters ([#5063](https://github.com/mikro-orm/mikro-orm/issues/5063)) ([66a6b75](https://github.com/mikro-orm/mikro-orm/commit/66a6b75632d6df46445898233e2dd28067497e98)), closes [#4975](https://github.com/mikro-orm/mikro-orm/issues/4975)
* **core:** improve validation of bidirectional 1:1 relations ([7eb6ee6](https://github.com/mikro-orm/mikro-orm/commit/7eb6ee62095b1a985db57786aef9e81744cef50f))
* **core:** infer property type from default value ([#4150](https://github.com/mikro-orm/mikro-orm/issues/4150)) ([38be986](https://github.com/mikro-orm/mikro-orm/commit/38be986876df7e4fec5d93a8028e8ff48222e4c0)), closes [#4060](https://github.com/mikro-orm/mikro-orm/issues/4060)
* **core:** make `em.insert/Many` strictly typed (require all properties) ([01935e6](https://github.com/mikro-orm/mikro-orm/commit/01935e6ffad670d36e9905efe11e2f0eeff52beb))
* **core:** native `BigInt` support ([#4719](https://github.com/mikro-orm/mikro-orm/issues/4719)) ([31a905c](https://github.com/mikro-orm/mikro-orm/commit/31a905cf84e9abfd823cfb160276a96467a6ea7f))
* **core:** re-export the core package from all drivers ([#3816](https://github.com/mikro-orm/mikro-orm/issues/3816)) ([175c059](https://github.com/mikro-orm/mikro-orm/commit/175c05912d3f53eac0788ecd32002cb9a30e7cfa))
* **core:** remove static require calls ([#3814](https://github.com/mikro-orm/mikro-orm/issues/3814)) ([b58f476](https://github.com/mikro-orm/mikro-orm/commit/b58f4763995738cad11d08665b239443f9fb4499)), closes [#3743](https://github.com/mikro-orm/mikro-orm/issues/3743)
* **core:** require `mappedBy` option for 1:m properties ([716aa76](https://github.com/mikro-orm/mikro-orm/commit/716aa76111c07c9a25ddf601c3fe1f3d2edcc81f))
* **core:** require explicitly marked raw queries via `raw()` helper ([#4197](https://github.com/mikro-orm/mikro-orm/issues/4197)) ([9c1b205](https://github.com/mikro-orm/mikro-orm/commit/9c1b205f4cb9fede6330360982f23cf6ef37f346))
* **core:** respect `ignoreFields` on type level in `wrap().toObject()` ([15de7a0](https://github.com/mikro-orm/mikro-orm/commit/15de7a0249d4bdc5485b43815e2c6c0d269a33aa)), closes [#4198](https://github.com/mikro-orm/mikro-orm/issues/4198)
* **core:** respect `schema` parameter in `clientUrl` ([#4998](https://github.com/mikro-orm/mikro-orm/issues/4998)) ([9176ee0](https://github.com/mikro-orm/mikro-orm/commit/9176ee080fc4051c4b149a8c8ba2b83ed1794446)), closes [#4997](https://github.com/mikro-orm/mikro-orm/issues/4997)
* **core:** respect naming strategy and explicit field names on embedded properties ([#4866](https://github.com/mikro-orm/mikro-orm/issues/4866)) ([6151f3b](https://github.com/mikro-orm/mikro-orm/commit/6151f3b96ce478de81d697c658bcccf89cfee669)), closes [#4371](https://github.com/mikro-orm/mikro-orm/issues/4371) [#2165](https://github.com/mikro-orm/mikro-orm/issues/2165) [#2361](https://github.com/mikro-orm/mikro-orm/issues/2361)
* **core:** respect updates to M:N inverse sides and batch them ([#4798](https://github.com/mikro-orm/mikro-orm/issues/4798)) ([ec65001](https://github.com/mikro-orm/mikro-orm/commit/ec650013f3486a89a12c105ea49a8fc28b1f8072)), closes [#4564](https://github.com/mikro-orm/mikro-orm/issues/4564)
* **core:** return `Loaded` type from `Ref.load()` ([bc3ffa9](https://github.com/mikro-orm/mikro-orm/commit/bc3ffa9b650366bac2a00b50ab6f7657fbe01505)), closes [#3755](https://github.com/mikro-orm/mikro-orm/issues/3755)
* **core:** return single entity from `em.populate()` when called on single entity ([4c4ec23](https://github.com/mikro-orm/mikro-orm/commit/4c4ec2312ea9d6930b342c3707c54d6fa7c26ab7))
* **core:** rework serialization rules to always respect populate hint ([#4203](https://github.com/mikro-orm/mikro-orm/issues/4203)) ([32d7c5f](https://github.com/mikro-orm/mikro-orm/commit/32d7c5f79fc7c8796e5ad24d3f89484a0a5d537a)), closes [#4138](https://github.com/mikro-orm/mikro-orm/issues/4138) [#4199](https://github.com/mikro-orm/mikro-orm/issues/4199)
* **core:** strict partial loading ([#4092](https://github.com/mikro-orm/mikro-orm/issues/4092)) ([d5d8c2d](https://github.com/mikro-orm/mikro-orm/commit/d5d8c2d487f7f676b1a237042c57aa323e29fbab)), closes [#3443](https://github.com/mikro-orm/mikro-orm/issues/3443)
* **core:** support atomic updates via `raw()` helper ([#4094](https://github.com/mikro-orm/mikro-orm/issues/4094)) ([1cd0d1e](https://github.com/mikro-orm/mikro-orm/commit/1cd0d1ed7fe4b434402230f0af5f1c176e44086c)), closes [#3657](https://github.com/mikro-orm/mikro-orm/issues/3657)
* **core:** support mapping one column to different STI properties ([#4769](https://github.com/mikro-orm/mikro-orm/issues/4769)) ([e8d391b](https://github.com/mikro-orm/mikro-orm/commit/e8d391bb6814de6b2fb94d504e249a1ed2f5a40e)), closes [#2388](https://github.com/mikro-orm/mikro-orm/issues/2388) [#4440](https://github.com/mikro-orm/mikro-orm/issues/4440)
* **core:** throw when trying to iterate on a not initialized collection ([2a3fd27](https://github.com/mikro-orm/mikro-orm/commit/2a3fd273980e9948458e2ac7e7dc7f6fd5bfda76)), closes [#3750](https://github.com/mikro-orm/mikro-orm/issues/3750)
* **core:** validate abstract target in relation decorators ([dddb901](https://github.com/mikro-orm/mikro-orm/commit/dddb9015d8dee5a56e680b3fcd75c0a3ec1c298e))
* **core:** validate duplicate field names ([#4968](https://github.com/mikro-orm/mikro-orm/issues/4968)) ([71fead4](https://github.com/mikro-orm/mikro-orm/commit/71fead4577d89e4ef39e9b1d17c8069c0b33ce6c)), closes [#4359](https://github.com/mikro-orm/mikro-orm/issues/4359)
* **core:** validate missing relation decorator ([af31b3b](https://github.com/mikro-orm/mikro-orm/commit/af31b3b9c52c4c3e9c404d17f174863218ff5ce0)), closes [#3807](https://github.com/mikro-orm/mikro-orm/issues/3807)
* **entity-generator:** added ability to output type option in decorator ([#4935](https://github.com/mikro-orm/mikro-orm/issues/4935)) ([2d1936a](https://github.com/mikro-orm/mikro-orm/commit/2d1936a80f948e0fd83b8fc89bb48feb132537d6))
* **entity-generator:** allow generating scalar properties for FKs ([#4892](https://github.com/mikro-orm/mikro-orm/issues/4892)) ([abad6ca](https://github.com/mikro-orm/mikro-orm/commit/abad6ca9dcafaaf9319261b4ac116ef5ad6485b3)), closes [#4898](https://github.com/mikro-orm/mikro-orm/issues/4898)
* **entity-generator:** allow local and global configuration of all options ([#4965](https://github.com/mikro-orm/mikro-orm/issues/4965)) ([2876b8a](https://github.com/mikro-orm/mikro-orm/commit/2876b8a74560e60605ff0de2feaba0d29c28d4aa))
* **entity-generator:** allow overriding generated entity file name ([4ebc8e3](https://github.com/mikro-orm/mikro-orm/commit/4ebc8e3665d7c75788b51a6da59575ccff19f612)), closes [#5026](https://github.com/mikro-orm/mikro-orm/issues/5026)
* **entity-generator:** detect more ManyToMany relations ([#4974](https://github.com/mikro-orm/mikro-orm/issues/4974)) ([d0e3ac9](https://github.com/mikro-orm/mikro-orm/commit/d0e3ac97d6443c050ce4c9a1a4fab6a20edaf9c0))
* **entity-generator:** generate `OptionalProps` and other symbols for `EntitySchema` ([00f0a34](https://github.com/mikro-orm/mikro-orm/commit/00f0a3465808670a79d47ea345dfd50706f843b7))
* **mysql:** support `order by nulls first/last` ([#5021](https://github.com/mikro-orm/mikro-orm/issues/5021)) ([df75b24](https://github.com/mikro-orm/mikro-orm/commit/df75b2452a72adfc473772c37342c75e7e731d50)), closes [#5004](https://github.com/mikro-orm/mikro-orm/issues/5004)
* **postgres:** add support for native enums ([#4296](https://github.com/mikro-orm/mikro-orm/issues/4296)) ([8515380](https://github.com/mikro-orm/mikro-orm/commit/8515380b7d54aabdef89098139d533ae15adc91b)), closes [#2764](https://github.com/mikro-orm/mikro-orm/issues/2764)
* **postgres:** add support for weighted tsvectors and a custom regconfig ([#3805](https://github.com/mikro-orm/mikro-orm/issues/3805)) ([a0e2c7f](https://github.com/mikro-orm/mikro-orm/commit/a0e2c7f4063d0774afd608a178b0e1edc220c3d5)), closes [#3317](https://github.com/mikro-orm/mikro-orm/pull/3317)
* **query-builder:** add support for lateral sub-query joins ([99f87c4](https://github.com/mikro-orm/mikro-orm/commit/99f87c487d1d23f772562eb7e243b160e6a2cfda)), closes [#624](https://github.com/mikro-orm/mikro-orm/issues/624)
* **query-builder:** allow joining sub-queries ([#4747](https://github.com/mikro-orm/mikro-orm/issues/4747)) ([613332c](https://github.com/mikro-orm/mikro-orm/commit/613332c1664648a0f7d90f4e6cb1966a8e510fc9)), closes [#4429](https://github.com/mikro-orm/mikro-orm/issues/4429) [#4549](https://github.com/mikro-orm/mikro-orm/issues/4549)
* **query-builder:** respect discriminator column when joining STI relation ([57b7094](https://github.com/mikro-orm/mikro-orm/commit/57b7094b40e5d2ff2d1c2eaa8da36064fe6da1b4)), closes [#4351](https://github.com/mikro-orm/mikro-orm/issues/4351)
* **query-builder:** support virtual entities ([27f0c83](https://github.com/mikro-orm/mikro-orm/commit/27f0c83e11ea74513279c05b84c81707a1e7e8c3)), closes [#5069](https://github.com/mikro-orm/mikro-orm/issues/5069)
* **schema:** add options to `schema.ensureDatabase()` method to create/clear ([6a12fe1](https://github.com/mikro-orm/mikro-orm/commit/6a12fe18b0713cc8161318764badd6b00271382f))
* **sql:** add native support for generated columns ([#4884](https://github.com/mikro-orm/mikro-orm/issues/4884)) ([a928291](https://github.com/mikro-orm/mikro-orm/commit/a928291335f6867e02ed948afb5c9abd17975dba))
* **sql:** print number of affected rows for insert and update queries ([36336d9](https://github.com/mikro-orm/mikro-orm/commit/36336d9e17a4bf67d8f78fa00feb777fb9ea00f0))
* **sql:** rework joined strategy to support the default `populateWhere: 'all'` ([#4957](https://github.com/mikro-orm/mikro-orm/issues/4957)) ([e5dbc24](https://github.com/mikro-orm/mikro-orm/commit/e5dbc245d0a3eebc5013321345d2d5d7630cc312))
* **sql:** support `$some`, `$none` and `$every` subquery operators ([#4917](https://github.com/mikro-orm/mikro-orm/issues/4917)) ([50d2265](https://github.com/mikro-orm/mikro-orm/commit/50d2265507e5add684317e2722666ac817bae804)), closes [#2916](https://github.com/mikro-orm/mikro-orm/issues/2916)
* **sql:** use joined strategy as default for SQL drivers ([#4958](https://github.com/mikro-orm/mikro-orm/issues/4958)) ([90ec766](https://github.com/mikro-orm/mikro-orm/commit/90ec7663d01ea0bd577b15051f7bfb02afc687e2))
* **sql:** use returning statements for reloading version fields on update ([0a3abd7](https://github.com/mikro-orm/mikro-orm/commit/0a3abd7d9142377fc823dfadcccf6b365f3f53a7))


### Performance Improvements

* **core:** cache if entity has event listeners ([cfa8d52](https://github.com/mikro-orm/mikro-orm/commit/cfa8d52fa0c3e783ae7842ef7932cc1f73663942))
* **core:** optimize handling of FK value propagation ([f3d0ec5](https://github.com/mikro-orm/mikro-orm/commit/f3d0ec5b19a0d9b3fb4db051eaa9d5e3ac439c01))
* **core:** speed up detection of constructor/toJSON parameters during discovery ([a1288de](https://github.com/mikro-orm/mikro-orm/commit/a1288deb5e58805c6d0af3604d24f19837d57282))


### BREAKING CHANGES

Please see the [upgrading guide](https://mikro-orm.io/docs/upgrading-v5-to-v6).


## [5.9.7](https://github.com/mikro-orm/mikro-orm/compare/v5.9.5...v5.9.7) (2023-12-30)


### Bug Fixes

* **core:** check for root entity properties in `em.canPopulate()` when using STI ([b8fcf45](https://github.com/mikro-orm/mikro-orm/commit/b8fcf45932e5021541b4782b39b139bccd09cae6)), closes [#5043](https://github.com/mikro-orm/mikro-orm/issues/5043)
* **core:** fix eager loading detection with multiple populate hints for one property ([da1daf5](https://github.com/mikro-orm/mikro-orm/commit/da1daf5c416684fd49c5fd0261732dd6faa77b60)), closes [#5057](https://github.com/mikro-orm/mikro-orm/issues/5057)
* **core:** support pivot entities with autoincrement PK ([e250634](https://github.com/mikro-orm/mikro-orm/commit/e250634e1d4bc18b8e0f47cbed17b4d3bef78787)), closes [#4988](https://github.com/mikro-orm/mikro-orm/issues/4988)
* **postgres:** respect column length in down migrations ([222e2b8](https://github.com/mikro-orm/mikro-orm/commit/222e2b8a25692535490b8bc8dd700b23f931b474)), closes [#5048](https://github.com/mikro-orm/mikro-orm/issues/5048)


## [5.9.6](https://github.com/mikro-orm/mikro-orm/compare/v5.9.5...v5.9.6) (2023-12-21)


### Bug Fixes

* **core:** fix `assign` on collections of unloaded entities ([b60e4ee](https://github.com/mikro-orm/mikro-orm/commit/b60e4ee207849425b6faf7c8fa677388e16bb22e))
* **core:** fix extra updates with select-in strategy and composite FKs ([c848f8c](https://github.com/mikro-orm/mikro-orm/commit/c848f8c840cd2c4690e5852e06d36dc5b2393d9b))


## [5.9.5](https://github.com/mikro-orm/mikro-orm/compare/v5.9.4...v5.9.5) (2023-12-15)


### Bug Fixes

* **core:** ensure eager loading on deeper levels work with joined strategy ([cc5f476](https://github.com/mikro-orm/mikro-orm/commit/cc5f476ad481097e392b75e3507a17b6b9171432))
* **core:** fix extra updates for composite FKs that share a column ([78772fb](https://github.com/mikro-orm/mikro-orm/commit/78772fb3173822facd8a94c1e9d224130a41d8d9))
* **core:** fix infinite loop with `populate: true` and `refresh: true` ([#5001](https://github.com/mikro-orm/mikro-orm/issues/5001)) ([9f63378](https://github.com/mikro-orm/mikro-orm/commit/9f63378ee7896c04cb5f727e9e6d827f5a9c3117))
* **core:** fix returning statement hydration after `em.upsert` ([a7e9a82](https://github.com/mikro-orm/mikro-orm/commit/a7e9a82710b3b1451dba5d60add87c85393ec74b)), closes [#4945](https://github.com/mikro-orm/mikro-orm/issues/4945)
* **core:** respect context in virtual entity expression callback ([84d42a7](https://github.com/mikro-orm/mikro-orm/commit/84d42a73fb26170ffe9fe97ca15bfb7b3897e313))
* **postgres:** allow using array operators (e.g. `@>`) with object arrays ([6a5a1ef](https://github.com/mikro-orm/mikro-orm/commit/6a5a1efe9c7266ffd80c77c956433bc5345fa543)), closes [#4973](https://github.com/mikro-orm/mikro-orm/issues/4973)
* **schema:** improve json default diffing for down migrations ([5bc19ba](https://github.com/mikro-orm/mikro-orm/commit/5bc19baf5ee4808c9f20806ebe0946f3fd43f83d))
* **sql:** deduplicate keys in batch update queries ([7de7a48](https://github.com/mikro-orm/mikro-orm/commit/7de7a48b555f5059fb5eb8d29e22c241a7fb61ca))


## [5.9.4](https://github.com/mikro-orm/mikro-orm/compare/v5.9.3...v5.9.4) (2023-11-17)


### Bug Fixes

* **cli:** support `mikro-orm-esm` on windows ([c491af9](https://github.com/mikro-orm/mikro-orm/commit/c491af9113eed8d274c2ec1f2a736a4cfbaa81f7))
* **core:** fix auto-refresh detection in `em.find` for inlined embedded properties ([759b7b8](https://github.com/mikro-orm/mikro-orm/commit/759b7b8b5aa95bea8c6b1074ec1f5c2c9ffc5286)), closes [#4904](https://github.com/mikro-orm/mikro-orm/issues/4904)
* **core:** support composite PKs in `em.upsertMany()` ([85c38d4](https://github.com/mikro-orm/mikro-orm/commit/85c38d4465bf37b8448522c835ad77ce6300e317)), closes [#4923](https://github.com/mikro-orm/mikro-orm/issues/4923)
* **mysql:** improve diffing of defaults for JSON columns ([d92a440](https://github.com/mikro-orm/mikro-orm/commit/d92a44059b3b6dc8eeb107e8bd6fd4644f18383a)), closes [#4926](https://github.com/mikro-orm/mikro-orm/issues/4926)
* **schema:** do not inherit schema for FKs if not a wildcard entity ([cc7fed9](https://github.com/mikro-orm/mikro-orm/commit/cc7fed9fcdf62e6ff76f4fa9d2b65192d6ca5f46)), closes [#4918](https://github.com/mikro-orm/mikro-orm/issues/4918)
* **schema:** respect explicit schema in FKs to STI entities ([cc19ebb](https://github.com/mikro-orm/mikro-orm/commit/cc19ebb3addf6e68891e78c36b8857280ddae4a5)), closes [#4933](https://github.com/mikro-orm/mikro-orm/issues/4933)
* **schema:** respect up migration when detecting column renaming in down migration ([d5af5bd](https://github.com/mikro-orm/mikro-orm/commit/d5af5bdd3a709212edb9aa0127d29d8bd9610f25)), closes [#4919](https://github.com/mikro-orm/mikro-orm/issues/4919)


## [5.9.3](https://github.com/mikro-orm/mikro-orm/compare/v5.9.2...v5.9.3) (2023-11-06)


### Bug Fixes

* **core:** only check the same entity type when detecting early update/delete ([fef7a1b](https://github.com/mikro-orm/mikro-orm/commit/fef7a1b5f0dc6a013134ae43d7b2de32418ec26c)), closes [#4895](https://github.com/mikro-orm/mikro-orm/issues/4895)
* **core:** return `DriverException` from `em.upsertMany()` ([1ebfbdd](https://github.com/mikro-orm/mikro-orm/commit/1ebfbdd3eaec3910c44eb5c6d4ef8d25eae6031b)), closes [#4897](https://github.com/mikro-orm/mikro-orm/issues/4897)
* **core:** fix populating relations with cycles via select-in strategy ([d0b35da](https://github.com/mikro-orm/mikro-orm/commit/d0b35da672bb8f367346bbb2f2b15a6ab851485e)), closes [#4899](https://github.com/mikro-orm/mikro-orm/issues/4899)


## [5.9.2](https://github.com/mikro-orm/mikro-orm/compare/v5.9.1...v5.9.2) (2023-11-02)


### Bug Fixes

* **core:** fix partial loading of embedded properties with joined strategy ([f887e77](https://github.com/mikro-orm/mikro-orm/commit/f887e77686635c9a9d8928c528bbea4bad5254af))
* **core:** ignore limit, offset and order in `em.count` on virtual entity ([03a7b86](https://github.com/mikro-orm/mikro-orm/commit/03a7b86106f0ec600365504ffa6f6707a6dcd1d6))
* **mongo:** fix support for `ignoreUndefinedInQuery` ([cef26c5](https://github.com/mikro-orm/mikro-orm/commit/cef26c5e32ef09fd6be8262ef691f50d4832e0c6)), closes [#4891](https://github.com/mikro-orm/mikro-orm/issues/4891)





## [5.9.1](https://github.com/mikro-orm/mikro-orm/compare/v5.9.0...v5.9.1) (2023-10-31)


### Bug Fixes

* **core:** propagate to owning side of 1:1 relation even if not initialized ([9b2c9fe](https://github.com/mikro-orm/mikro-orm/commit/9b2c9fe89b67f3f1190dc0cdd7bab9911c2f9efa)), closes [#4879](https://github.com/mikro-orm/mikro-orm/issues/4879)
* **postgres:** fix hydrating of serial properties via returning statement ([620309c](https://github.com/mikro-orm/mikro-orm/commit/620309cbf3db0a97280c894c24647cfbe242dd5e))





## [5.9.0](https://github.com/mikro-orm/mikro-orm/compare/v5.8.10...v5.9.0) (2023-10-24)


### Bug Fixes

* **core:** apply `convertToJSValueSQL` on composite FKs too ([41425cb](https://github.com/mikro-orm/mikro-orm/commit/41425cbad836a9e81ffa09c5d9ef881a7e7e8b9d)), closes [#4843](https://github.com/mikro-orm/mikro-orm/issues/4843)
* **core:** clean up removed entities from relations in identity map ([1e3bb0e](https://github.com/mikro-orm/mikro-orm/commit/1e3bb0e1e7b8e76fa42fa1573d0f5265f83508aa)), closes [#4863](https://github.com/mikro-orm/mikro-orm/issues/4863)
* **core:** infer property type from `columnType` for non-inferrable types (e.g. unions with `null`) ([6bc116a](https://github.com/mikro-orm/mikro-orm/commit/6bc116aabdc9ca958238faaa7ac4a44cf3c71c08)), closes [#4833](https://github.com/mikro-orm/mikro-orm/issues/4833)
* **core:** remove some computed properties from metadata cache ([eb138ad](https://github.com/mikro-orm/mikro-orm/commit/eb138adb74237f98cf001b4b84e13e7f2636fb61))
* **core:** use write connection for fetching changes after upsert/upsertMany ([#4872](https://github.com/mikro-orm/mikro-orm/issues/4872)) ([6b444ed](https://github.com/mikro-orm/mikro-orm/commit/6b444edef5333265ad4f20154a6151f6f0f3a1b5)), closes [#4868](https://github.com/mikro-orm/mikro-orm/issues/4868)
* **query-builder:** do not alias formula expressions used in `qb.groupBy()` ([e27e4b9](https://github.com/mikro-orm/mikro-orm/commit/e27e4b907154933feba985badd4f6a60dee06317)), closes [#2929](https://github.com/mikro-orm/mikro-orm/issues/2929)
* **query-builder:** respect `preferReadReplicas` in `QueryBuilder` ([22e140e](https://github.com/mikro-orm/mikro-orm/commit/22e140e986420105c1b5941aae92a7bca1be6fef)), closes [#4847](https://github.com/mikro-orm/mikro-orm/issues/4847)
* **serialization:** run custom serializer on getters ([#4860](https://github.com/mikro-orm/mikro-orm/issues/4860)) ([e76836e](https://github.com/mikro-orm/mikro-orm/commit/e76836e75fbb9b9226078496d59e251baaced074)), closes [#4859](https://github.com/mikro-orm/mikro-orm/issues/4859)


### Features

* **core:** allow ignoring `undefined` values in `em.find` queries ([#4875](https://github.com/mikro-orm/mikro-orm/issues/4875)) ([e163bfb](https://github.com/mikro-orm/mikro-orm/commit/e163bfb43c64ff8fa356c30e1523334e06e5e1aa)), closes [#4873](https://github.com/mikro-orm/mikro-orm/issues/4873)
* **core:** create context from async orm instance ([#4812](https://github.com/mikro-orm/mikro-orm/issues/4812)) ([fbf3a4d](https://github.com/mikro-orm/mikro-orm/commit/fbf3a4dca6767e74579620b6aec020ac1cc07c0d)), closes [#4805](https://github.com/mikro-orm/mikro-orm/issues/4805)
* **query-builder:** respect `EntityManager` schema ([#4849](https://github.com/mikro-orm/mikro-orm/issues/4849)) ([5bc12a9](https://github.com/mikro-orm/mikro-orm/commit/5bc12a9e53f27f4e5b89b39bae5d5aaa00b12936))





## [5.8.10](https://github.com/mikro-orm/mikro-orm/compare/v5.8.9...v5.8.10) (2023-10-18)


### Bug Fixes

* **knex:** fix populating M:N from inverse side with joined strategy ([9f82e95](https://github.com/mikro-orm/mikro-orm/commit/9f82e95b3353be2ef476dc3ce129674e863b44b8))
* **reflection:** ensure complete stripping of relative paths with multiple leading slashes ([#4844](https://github.com/mikro-orm/mikro-orm/issues/4844)) ([8a635c7](https://github.com/mikro-orm/mikro-orm/commit/8a635c79d8939251545f02f3e569a0589c64f33a))





## [5.8.9](https://github.com/mikro-orm/mikro-orm/compare/v5.8.8...v5.8.9) (2023-10-15)


### Bug Fixes

* **core:** ignore SQL convertor methods on object embeddables ([92e1d6f](https://github.com/mikro-orm/mikro-orm/commit/92e1d6f663cf44a52db21b105ed0ffbca59cdf59)), closes [#4824](https://github.com/mikro-orm/mikro-orm/issues/4824)
* **core:** respect database name in `clientUrl` of read replicas ([015d4f4](https://github.com/mikro-orm/mikro-orm/commit/015d4f4b96ca5329f89df4b8666e9781efbba96c)), closes [#4813](https://github.com/mikro-orm/mikro-orm/issues/4813)
* **query-builder:** merge raw join results in `qb.execute()` ([#4825](https://github.com/mikro-orm/mikro-orm/issues/4825)) ([5a28e9b](https://github.com/mikro-orm/mikro-orm/commit/5a28e9b4d7fd627e1a1689d16e877740ca2a3d2d)), closes [#4816](https://github.com/mikro-orm/mikro-orm/issues/4816) [#4741](https://github.com/mikro-orm/mikro-orm/issues/4741)
* **schema:** skip changes of enum items on enum arrays ([9accdf6](https://github.com/mikro-orm/mikro-orm/commit/9accdf60fbed330a039d013495b5b4f44c181657)), closes [#476](https://github.com/mikro-orm/mikro-orm/issues/476)





## [5.8.8](https://github.com/mikro-orm/mikro-orm/compare/v5.8.7...v5.8.8) (2023-10-11)


### Bug Fixes

* **core:** do not rehydrate values provided to constructor ([8ff3f65](https://github.com/mikro-orm/mikro-orm/commit/8ff3f65907e37f971edd0cc7542d62b7646ec958)), closes [#4790](https://github.com/mikro-orm/mikro-orm/issues/4790)
* **core:** hydrate relations with `mapToPk` as scalars to support custom types ([4118076](https://github.com/mikro-orm/mikro-orm/commit/4118076d985191f8c57f66042e71e835616e4931)), closes [#4803](https://github.com/mikro-orm/mikro-orm/issues/4803)
* **postgres:** escape array literal values containing backslash ([#4797](https://github.com/mikro-orm/mikro-orm/issues/4797)) ([20179ec](https://github.com/mikro-orm/mikro-orm/commit/20179ec839def5f8144e56f3a6bc89131f7e72a4)), closes [#4796](https://github.com/mikro-orm/mikro-orm/issues/4796)


### Performance Improvements

* **core:** fix duplicate processing of collection items when flushing ([a8a1021](https://github.com/mikro-orm/mikro-orm/commit/a8a1021a423ba0d17a16848f51b54360241eb3d5)), closes [#4807](https://github.com/mikro-orm/mikro-orm/issues/4807)





## [5.8.7](https://github.com/mikro-orm/mikro-orm/compare/v5.8.6...v5.8.7) (2023-10-05)


### Bug Fixes

* **core:** ensure virtual relation properties have no effect on commit order ([606d633](https://github.com/mikro-orm/mikro-orm/commit/606d63315cde1fc1ae409c816f81882713e515cf)), closes [#4781](https://github.com/mikro-orm/mikro-orm/issues/4781)
* **core:** fix conditions in `em.upsertMany` with composite keys ([2f58556](https://github.com/mikro-orm/mikro-orm/commit/2f58556023c3f4777b4bccb2242ad6286dca22c4)), closes [#4786](https://github.com/mikro-orm/mikro-orm/issues/4786)
* **core:** fix extra updates when nullable embedded properties contain FK ([77ffa4f](https://github.com/mikro-orm/mikro-orm/commit/77ffa4f46c06425e25761e936679d8f2e455921b)), closes [#4788](https://github.com/mikro-orm/mikro-orm/issues/4788)
* **core:** improve handling of nullable embedded properties ([eae7e38](https://github.com/mikro-orm/mikro-orm/commit/eae7e3856a3eb2a5cc8889162fd3e090a2ff3b81)), closes [#4787](https://github.com/mikro-orm/mikro-orm/issues/4787)
* **schema:** respect length of default value of datetime columns ([cbc0c50](https://github.com/mikro-orm/mikro-orm/commit/cbc0c50d8b4ec9b31b29ff825c32b0ee828ec846)), closes [#4782](https://github.com/mikro-orm/mikro-orm/issues/4782)





## [5.8.6](https://github.com/mikro-orm/mikro-orm/compare/v5.8.5...v5.8.6) (2023-10-02)


### Bug Fixes

* **core:** alias joins on non persistent properties ([d70d323](https://github.com/mikro-orm/mikro-orm/commit/d70d3237fd653b2675fe869c42bdec0a4f06a3cd)), closes [#4773](https://github.com/mikro-orm/mikro-orm/issues/4773)
* **core:** respect `disableContextResolution` option when forking ([5964e52](https://github.com/mikro-orm/mikro-orm/commit/5964e5276e30543f9be5c3f0309f057301dc2d70)), closes [#4717](https://github.com/mikro-orm/mikro-orm/issues/4717) [#3338](https://github.com/mikro-orm/mikro-orm/issues/3338)
* **migrations:** allow running migrations outside of main transaction ([e0dfb0c](https://github.com/mikro-orm/mikro-orm/commit/e0dfb0c07f4cad5dc428132cdcf65f6570caad1a)), closes [#4775](https://github.com/mikro-orm/mikro-orm/issues/4775)





## [5.8.5](https://github.com/mikro-orm/mikro-orm/compare/v5.8.4...v5.8.5) (2023-09-30)


### Bug Fixes

* **core:** allow joining a formula property ([1200e5b](https://github.com/mikro-orm/mikro-orm/commit/1200e5b3e30361ec225bfa56a2f37b23dd58dfbc)), closes [#4759](https://github.com/mikro-orm/mikro-orm/issues/4759)
* **core:** map virtual properties that shadow a regular property from joined results ([d0b3698](https://github.com/mikro-orm/mikro-orm/commit/d0b3698eebbbd2a74809b70f7aa37c82cee0359e)), closes [#4764](https://github.com/mikro-orm/mikro-orm/issues/4764)
* **core:** pin all internal dependencies ([f4868ed](https://github.com/mikro-orm/mikro-orm/commit/f4868edec97457e7c4548d887fb3ba23cf266c59)), closes [#4764](https://github.com/mikro-orm/mikro-orm/issues/4764)
* **core:** support overlapping composite FKs with different nullability ([208fbaa](https://github.com/mikro-orm/mikro-orm/commit/208fbaac0fbead9c0122f410d93289d7fe822013)), closes [#4478](https://github.com/mikro-orm/mikro-orm/issues/4478)
* **mongo:** fix querying object embedded JSON properties ([b38a327](https://github.com/mikro-orm/mikro-orm/commit/b38a327d852597cda9105f299e329c27a5222d1e)), closes [#4755](https://github.com/mikro-orm/mikro-orm/issues/4755)
* **reflection:** detect JSON properties defined with `Record` or `Dictionary` types ([62740d1](https://github.com/mikro-orm/mikro-orm/commit/62740d187e16c2d22140ec5649c19af6964951f8)), closes [#4755](https://github.com/mikro-orm/mikro-orm/issues/4755)





## [5.8.4](https://github.com/mikro-orm/mikro-orm/compare/v5.8.3...v5.8.4) (2023-09-27)


### Bug Fixes

* **core:** fix recomputing of changesets when entity has unique properties ([d03afad](https://github.com/mikro-orm/mikro-orm/commit/d03afad05327d66edee48186313589ee4b975ea5)), closes [#4749](https://github.com/mikro-orm/mikro-orm/issues/4749)
* **query-builder:** fix mapping of complex joined results with cycles ([a9846dd](https://github.com/mikro-orm/mikro-orm/commit/a9846dda01c4cdcf584452add15a4dea70c805a3)), closes [#4741](https://github.com/mikro-orm/mikro-orm/issues/4741)


### Features

* **core:** add `EntityRepository.getEntityName()` method ([#4745](https://github.com/mikro-orm/mikro-orm/issues/4745)) ([47bfedd](https://github.com/mikro-orm/mikro-orm/commit/47bfeddc282580dc90d61cffa68c32e50ecf11db))
* **core:** allow setting default `schema` on `EntityManager` ([#4717](https://github.com/mikro-orm/mikro-orm/issues/4717)) ([f7c1ef2](https://github.com/mikro-orm/mikro-orm/commit/f7c1ef24076ef760cabe3e73356d7f35999ddf6f))
* **core:** deprecate `UseRequestContext` decorator ([#4744](https://github.com/mikro-orm/mikro-orm/issues/4744)) ([280733f](https://github.com/mikro-orm/mikro-orm/commit/280733f46ae48bf6c2ceb2c847f3e3fb106ca116))





## [5.8.3](https://github.com/mikro-orm/mikro-orm/compare/v5.8.2...v5.8.3) (2023-09-24)


### Bug Fixes

* **core:** do not skip `cjs/mjs/cts/mts` extensions during folder-based discovery ([ce574a4](https://github.com/mikro-orm/mikro-orm/commit/ce574a4f2c861b1953c9ae37f79ad7308101f9d0)), closes [#4727](https://github.com/mikro-orm/mikro-orm/issues/4727)
* **core:** ensure no duplicates exist in checks/indexes/hooks ([fb523c8](https://github.com/mikro-orm/mikro-orm/commit/fb523c8a4e684dbd6ab32086059d15f765d3aaca)), closes [#4733](https://github.com/mikro-orm/mikro-orm/issues/4733)
* **core:** fix updating complex composite key entities via UoW ([#4739](https://github.com/mikro-orm/mikro-orm/issues/4739)) ([898dcda](https://github.com/mikro-orm/mikro-orm/commit/898dcda9680e03c882910d3ee2980ff7ee664ff5)), closes [#4720](https://github.com/mikro-orm/mikro-orm/issues/4720)
* **knex:** allow using knex query builder as virtual entity expression ([#4740](https://github.com/mikro-orm/mikro-orm/issues/4740)) ([427cc88](https://github.com/mikro-orm/mikro-orm/commit/427cc88e4c428709e8643bed6b6914585dd57c85)), closes [#4628](https://github.com/mikro-orm/mikro-orm/issues/4628)
* **knex:** hydrate nullable relations with joined strategy ([8ddaa93](https://github.com/mikro-orm/mikro-orm/commit/8ddaa93f1401d86e05b8b839b9456ae3623ff250)), closes [#4675](https://github.com/mikro-orm/mikro-orm/issues/4675)
* **mongo-migrations:** fix logging of executed migrations ([8ae7eeb](https://github.com/mikro-orm/mikro-orm/commit/8ae7eebe9b04f1514e881c004b31f55a03bd4eab)), closes [#4698](https://github.com/mikro-orm/mikro-orm/issues/4698)





## [5.8.2](https://github.com/mikro-orm/mikro-orm/compare/v5.8.1...v5.8.2) (2023-09-20)


### Bug Fixes

* **core:** fix query processing when PK is falsy ([#4713](https://github.com/mikro-orm/mikro-orm/issues/4713)) ([3624cb7](https://github.com/mikro-orm/mikro-orm/commit/3624cb7e3362a2625076072a7150f60e625b9100))
* **mongo-migrations:** fix logging of executed migrations ([2d9fc86](https://github.com/mikro-orm/mikro-orm/commit/2d9fc86ccdbcf31efffff4a05df0e31a21e9534f)), closes [#4698](https://github.com/mikro-orm/mikro-orm/issues/4698)
* **query-builder:** fix aliasing of joined embedded properties ([24c4ece](https://github.com/mikro-orm/mikro-orm/commit/24c4ece2775c0dbfc4e53ffbc3f33ec5524e5760)), closes [#4711](https://github.com/mikro-orm/mikro-orm/issues/4711)


### Features

* **core:** allow to use `.ts` files as configuration without `ts-node` ([#4702](https://github.com/mikro-orm/mikro-orm/issues/4702)) ([bda7eca](https://github.com/mikro-orm/mikro-orm/commit/bda7eca955124e13f68aaf1fecdb993f0f3eb8b1)), closes [#4701](https://github.com/mikro-orm/mikro-orm/issues/4701)
* **entity-generator:** generate `PrimaryKeyProp` and `PrimaryKeyType` symbols ([605446a](https://github.com/mikro-orm/mikro-orm/commit/605446a5f9f19fc9c67e7dd758132e487c28a29a))





## [5.8.1](https://github.com/mikro-orm/mikro-orm/compare/v5.8.0...v5.8.1) (2023-09-12)


### Bug Fixes

* **core:** ensure entity is not in persist stack after `em.insert/Many()` is called ([94eed5e](https://github.com/mikro-orm/mikro-orm/commit/94eed5e1aa7192d1b0658eb5b0cc3589cfaacff5)), closes [#4692](https://github.com/mikro-orm/mikro-orm/issues/4692)
* **core:** ensure merging of data to already loaded entities won't fail in some cases ([f6e8204](https://github.com/mikro-orm/mikro-orm/commit/f6e8204f6c4fbafe882c0cb0b475dd45e19a4777)), closes [#4688](https://github.com/mikro-orm/mikro-orm/issues/4688)
* **core:** fix merging of collections loaded via joined strategy ([b4a0260](https://github.com/mikro-orm/mikro-orm/commit/b4a0260afb3c41da4c15a8f69b09c228303b7a3f)), closes [#4694](https://github.com/mikro-orm/mikro-orm/issues/4694)
* **core:** try to fix merging of large collections loaded via joined strategy ([faae84e](https://github.com/mikro-orm/mikro-orm/commit/faae84e19b40f0a5fcbf057cce5370602b34ec80)), closes [#4694](https://github.com/mikro-orm/mikro-orm/issues/4694)





## [5.8.0](https://github.com/mikro-orm/mikro-orm/compare/v5.7.14...v5.8.0) (2023-09-10)


### Bug Fixes

* **core:** default baseUrl value to '.' when registering ts-node ([#4680](https://github.com/mikro-orm/mikro-orm/issues/4680)) ([cc0fc5f](https://github.com/mikro-orm/mikro-orm/commit/cc0fc5f8e4190270c197c3f0c1d2f326fd133212)), closes [#4679](https://github.com/mikro-orm/mikro-orm/issues/4679)
* **core:** ensure partial loading respects advanced mapped type methods ([72554fd](https://github.com/mikro-orm/mikro-orm/commit/72554fddf8fae907c47fed2e22820960bee296fa)), closes [#4622](https://github.com/mikro-orm/mikro-orm/issues/4622)
* **core:** fix assigning collection items with `updateNestedEntities: false` ([e1bfd20](https://github.com/mikro-orm/mikro-orm/commit/e1bfd20502d22d4760e3edebc142f356ab4043f3))
* **core:** fix metadata cache for `@Check()` with callback signature ([44d973e](https://github.com/mikro-orm/mikro-orm/commit/44d973e2e041440bbca69978a3e8e0409862ed5b)), closes [#4505](https://github.com/mikro-orm/mikro-orm/issues/4505)
* **core:** fix removing entity that has an inverse relation with M:1 `owner` property ([fbed4a6](https://github.com/mikro-orm/mikro-orm/commit/fbed4a67d56301e90b85eb7c09423532e12dcb6f)), closes [#4578](https://github.com/mikro-orm/mikro-orm/issues/4578)
* **core:** ignore null values of unknown properties in `assign()` ([a600f55](https://github.com/mikro-orm/mikro-orm/commit/a600f55c0c75400c33dffd845feb4938f256a86e)), closes [#4566](https://github.com/mikro-orm/mikro-orm/issues/4566)
* **core:** map property names to column names in `qb.onConflict()` ([e38d126](https://github.com/mikro-orm/mikro-orm/commit/e38d126b219d5b004a3dfeb777a0c9cad59e0502)), closes [#4483](https://github.com/mikro-orm/mikro-orm/issues/4483)
* **core:** remove old items from 1:m collections via `set()` even if not initialized ([b03e165](https://github.com/mikro-orm/mikro-orm/commit/b03e1656d6bf0a626bdca2f4395ef3a221acfcbf))
* **core:** respect explicit schema name of pivot tables ([af74491](https://github.com/mikro-orm/mikro-orm/commit/af74491aaa3706d205fa3526d4eff4eb31ecd9ee)), closes [#4516](https://github.com/mikro-orm/mikro-orm/issues/4516)
* **core:** respect filters with joined loading strategy ([#4683](https://github.com/mikro-orm/mikro-orm/issues/4683)) ([847c35a](https://github.com/mikro-orm/mikro-orm/commit/847c35a5ae263ea876012747308994d458b1a5f0)), closes [#704](https://github.com/mikro-orm/mikro-orm/issues/704) [#2440](https://github.com/mikro-orm/mikro-orm/issues/2440)
* **core:** support calling `em.findAndCount()` on virtual entities with `orderBy` ([7f328ac](https://github.com/mikro-orm/mikro-orm/commit/7f328acd733460709df9101248488fd7adfdf1f4)), closes [#4628](https://github.com/mikro-orm/mikro-orm/issues/4628)
* **core:** support calling `em.insertMany()` with empty array ([2f65bc8](https://github.com/mikro-orm/mikro-orm/commit/2f65bc8f71d776b8b38658edf23d37cc5f5daabc)), closes [#4640](https://github.com/mikro-orm/mikro-orm/issues/4640)
* **core:** use join on conditions for `populateWhere` ([#4682](https://github.com/mikro-orm/mikro-orm/issues/4682)) ([99177cc](https://github.com/mikro-orm/mikro-orm/commit/99177cc94f9b0347c2e0a5e41dcbe347936e74b3)), closes [#3871](https://github.com/mikro-orm/mikro-orm/issues/3871)
* **entity-generator:** respect `precision` and `scale` in numeric column type ([3a52c39](https://github.com/mikro-orm/mikro-orm/commit/3a52c399ce5188125704c29417f8587a02c05637))
* **mysql:** fix extra updates on entities with non-primary autoincrement property ([5d6ebe3](https://github.com/mikro-orm/mikro-orm/commit/5d6ebe326a3e26343c268f55806a9aa97d66f439)), closes [#4577](https://github.com/mikro-orm/mikro-orm/issues/4577)
* **query-builder:** apply join condition to the target entity in M:N relations ([c78d812](https://github.com/mikro-orm/mikro-orm/commit/c78d812e53f4ac6b12ad186e327f1e9fbcaf30b6)), closes [#4644](https://github.com/mikro-orm/mikro-orm/issues/4644)
* **query-builder:** make `QBFilterQuery` type more strict ([755ef67](https://github.com/mikro-orm/mikro-orm/commit/755ef67fd6fa8a3764314c4c7d3fe70b53d9330d))
* **schema:** respect `columnType` on enum properties ([#4601](https://github.com/mikro-orm/mikro-orm/issues/4601)) ([0eae590](https://github.com/mikro-orm/mikro-orm/commit/0eae5900f42d6c7394dfc57422c84975cc7127fb))


### Features

* **cli:** add `--drop-db` flag to `migration:fresh` and `schema:fresh` ([cf1db80](https://github.com/mikro-orm/mikro-orm/commit/cf1db80b26a2f4e9f6fd917ee78a0925bebc215d)), closes [#4569](https://github.com/mikro-orm/mikro-orm/issues/4569)
* **core:** add `clear` option to `em.transactional()` ([01d1ad7](https://github.com/mikro-orm/mikro-orm/commit/01d1ad7a3fc4d07c7605b34609c60ae8dce000d8))
* **core:** add `Collection.isEmpty()` method ([#4599](https://github.com/mikro-orm/mikro-orm/issues/4599)) ([2d8d506](https://github.com/mikro-orm/mikro-orm/commit/2d8d506f9ea689ddbde41dafc454bbd59fe6f7e9))
* **core:** add `Collection.slice()` method ([#4608](https://github.com/mikro-orm/mikro-orm/issues/4608)) ([7c99c37](https://github.com/mikro-orm/mikro-orm/commit/7c99c37faec3f0c77fb897b0853930a75c2cd760))
* **core:** add `Collection` helpers `map/filter/reduce/exists/findFirst/indexBy` ([3ba33ac](https://github.com/mikro-orm/mikro-orm/commit/3ba33aca5a73649a7290d5daf9c6d85af3c33d93)), closes [#4592](https://github.com/mikro-orm/mikro-orm/issues/4592)
* **core:** allow disabling duplicate entities discovery validation ([#4618](https://github.com/mikro-orm/mikro-orm/issues/4618)) ([3ff0dda](https://github.com/mikro-orm/mikro-orm/commit/3ff0ddae5d56ad36009531cafedaab931c522300))
* **core:** allow enabling result cache globally ([5876c99](https://github.com/mikro-orm/mikro-orm/commit/5876c99e398919ca63ce105c644a8621813ffffa)), closes [#4656](https://github.com/mikro-orm/mikro-orm/issues/4656)
* **core:** allow fine-grained control over `em.upsert()` ([#4669](https://github.com/mikro-orm/mikro-orm/issues/4669)) ([ab0ddee](https://github.com/mikro-orm/mikro-orm/commit/ab0ddee271149dd201e5661fa38f6d7b1b9054ef)), closes [#4325](https://github.com/mikro-orm/mikro-orm/issues/4325) [#4602](https://github.com/mikro-orm/mikro-orm/issues/4602)
* **core:** allow global config option for `disableIdentityMap` ([ef32b14](https://github.com/mikro-orm/mikro-orm/commit/ef32b14111245caba8cc9f7298eb8f81a88488a6)), closes [#4653](https://github.com/mikro-orm/mikro-orm/issues/4653)
* **core:** respect `batchSize` in `em.upsertMany()` ([4a21c33](https://github.com/mikro-orm/mikro-orm/commit/4a21c33954649a031460fa474539f54b81eec5a0)), closes [#4421](https://github.com/mikro-orm/mikro-orm/issues/4421)
* **entity-generator:** allow skipping some tables or columns ([e603108](https://github.com/mikro-orm/mikro-orm/commit/e603108445ed97b05cb48dd60830bb04cb095d57)), closes [#4584](https://github.com/mikro-orm/mikro-orm/issues/4584)
* **migrations:** add `Migration.getEntityManager()` helper ([79af75c](https://github.com/mikro-orm/mikro-orm/commit/79af75ceac90f1acb48628d1a2d987261f72a550)), closes [#4605](https://github.com/mikro-orm/mikro-orm/issues/4605)
* **mongo:** support indexes on embedded properties ([040896e](https://github.com/mikro-orm/mikro-orm/commit/040896e43664507d010692649d6b331567150e23)), closes [#2129](https://github.com/mikro-orm/mikro-orm/issues/2129)
* **sql:** add `readOnly` option to `em.begin()` and `em.transactional()` ([86bb7d4](https://github.com/mikro-orm/mikro-orm/commit/86bb7d4f99f37409180274c4e13c0bac82d4f334))
* **sql:** allow specifying query comments ([06d4d20](https://github.com/mikro-orm/mikro-orm/commit/06d4d203cc28e33d664b48b907d3e372fc90f516))





## [5.7.14](https://github.com/mikro-orm/mikro-orm/compare/v5.7.13...v5.7.14) (2023-07-27)


### Bug Fixes

* **core:** ensure JSON arrays are correctly handled ([5327bcc](https://github.com/mikro-orm/mikro-orm/commit/5327bccd52596fe1368f2766e38300b0d4cda03c)), closes [#4555](https://github.com/mikro-orm/mikro-orm/issues/4555)
* **core:** inferring JSON type based on `columnType` when mapping to array ([96d87ba](https://github.com/mikro-orm/mikro-orm/commit/96d87ba50b0e31dd66ae194caab70f41c0747e73)), closes [#4548](https://github.com/mikro-orm/mikro-orm/issues/4548)
* **entity-generator:** use ref instead of wrappedReference ([#4559](https://github.com/mikro-orm/mikro-orm/issues/4559)) ([be02aa4](https://github.com/mikro-orm/mikro-orm/commit/be02aa4eba3706023eb474e8cfa222f31a95a494))
* **mongo:** do not create collections for embeddable entities ([0759df0](https://github.com/mikro-orm/mikro-orm/commit/0759df0f463a575940d3f8514291c59c8482b4d9)), closes [#4495](https://github.com/mikro-orm/mikro-orm/issues/4495)
* **seeder:** allow run method to return without promise ([#4541](https://github.com/mikro-orm/mikro-orm/issues/4541)) ([8012507](https://github.com/mikro-orm/mikro-orm/commit/80125071510ace0c0376d026065b607f9e7b33bd))





## [5.7.13](https://github.com/mikro-orm/mikro-orm/compare/v5.7.12...v5.7.13) (2023-07-16)


### Bug Fixes

* **core:** deprecate `wrappedReference` on m:1 decorator options ([d7f362e](https://github.com/mikro-orm/mikro-orm/commit/d7f362eae354437e0d2427f680420f370c6038fd))
* **core:** do not fail when detecting mapped type for enum columns ([b94048b](https://github.com/mikro-orm/mikro-orm/commit/b94048bc2aa8cd537edd9bf34333996f2c4bef7c)), closes [#2323](https://github.com/mikro-orm/mikro-orm/issues/2323)
* **core:** fix handling shared columns in composite foreign keys ([fbb6958](https://github.com/mikro-orm/mikro-orm/commit/fbb6958944998ca1abee331002e5aedd8bfa9c37))
* **core:** fix multiple `?` in fulltext fields updates ([9c9915e](https://github.com/mikro-orm/mikro-orm/commit/9c9915eb54b3d6989ea05938498f6e0b84397e5f)), closes [#4484](https://github.com/mikro-orm/mikro-orm/issues/4484)
* **core:** fix updating composite key entities via flush ([733cb80](https://github.com/mikro-orm/mikro-orm/commit/733cb80918fa83a2d028b59ee807e0a3bb9b72b7)), closes [#4533](https://github.com/mikro-orm/mikro-orm/issues/4533)
* **core:** respect `persist: false` on relations ([a127fff](https://github.com/mikro-orm/mikro-orm/commit/a127fff66914add81a6f54fd1f8f9f5ae56366ee)), closes [#4504](https://github.com/mikro-orm/mikro-orm/issues/4504)
* **migrations:** support reverting migrations that had extenion in the database ([72df9ad](https://github.com/mikro-orm/mikro-orm/commit/72df9ad3dfa497111fa7c949ae1a0d60e5cca6d0)), closes [#4528](https://github.com/mikro-orm/mikro-orm/issues/4528)
* **mongo:** drop migrations table when requested ([278ba3a](https://github.com/mikro-orm/mikro-orm/commit/278ba3a36b087fc1e8a65a1b9114a7a21c8da76c)), closes [#4513](https://github.com/mikro-orm/mikro-orm/issues/4513)
* **postgres:** fix hydration of 1:1 properties when entity has version fields ([474eb73](https://github.com/mikro-orm/mikro-orm/commit/474eb73c1551a3a9ee05170760b9f377fe10d749)), closes [#4497](https://github.com/mikro-orm/mikro-orm/issues/4497)
* **sqlite:** allow using `clientUrl` without a `host` ([#4447](https://github.com/mikro-orm/mikro-orm/issues/4447)) ([9a01bbd](https://github.com/mikro-orm/mikro-orm/commit/9a01bbd5f535a4c31520bce3c27eb8fb2b461283))
* **sqlite:** fix processing queries with large parameters ([48ee8c2](https://github.com/mikro-orm/mikro-orm/commit/48ee8c28ecb7664c0cd3d8540162687ec96c4bd1)), closes [#4526](https://github.com/mikro-orm/mikro-orm/issues/4526)
* **sql:** schema not inherited in query with relations ([#4477](https://github.com/mikro-orm/mikro-orm/issues/4477)) ([b680477](https://github.com/mikro-orm/mikro-orm/commit/b680477ddda430b443c1127ab4a9c91ec4c96a5f)), closes [#4472](https://github.com/mikro-orm/mikro-orm/issues/4472)





## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)


### Bug Fixes

* **core:** allow async filter callbacks in `em.addFilter()` on type level ([308c45b](https://github.com/mikro-orm/mikro-orm/commit/308c45bcdc0ae88b263cf6f35f7ab66f91cf97df))
* **core:** fallback to direct property access ([320c52f](https://github.com/mikro-orm/mikro-orm/commit/320c52f8066bb5471a72c70e6bb87aa9b562e17f)), closes [#4434](https://github.com/mikro-orm/mikro-orm/issues/4434) [#4216](https://github.com/mikro-orm/mikro-orm/issues/4216)
* **core:** fix extra updates when `forceEntityConstructor` enabled ([41874eb](https://github.com/mikro-orm/mikro-orm/commit/41874eb8c8c5ec3f62894d0b79e66df2ef799b56)), closes [#4426](https://github.com/mikro-orm/mikro-orm/issues/4426)
* **core:** fix returning clause for upsert with embeddables ([#4427](https://github.com/mikro-orm/mikro-orm/issues/4427)) ([b9682f0](https://github.com/mikro-orm/mikro-orm/commit/b9682f03b34dc028cc593f8a3ffbd672d3e9bcee))
* **core:** respect `undefined` when assigning to object properties ([217ff8f](https://github.com/mikro-orm/mikro-orm/commit/217ff8f7321b6ed2551df5214f9f5934bb6d8896)), closes [#4428](https://github.com/mikro-orm/mikro-orm/issues/4428)
* **core:** respect falsy values in `em.upsert` ([ef22b21](https://github.com/mikro-orm/mikro-orm/commit/ef22b21ad853c020fcd1c149d61714b40d7d390a)), closes [#4420](https://github.com/mikro-orm/mikro-orm/issues/4420)
* **mongo:** allow saving self-references inside M:N properties in one flush ([c1b5fc4](https://github.com/mikro-orm/mikro-orm/commit/c1b5fc49de2b962e4d44b5673a8df1437f0f71ab)), closes [#4431](https://github.com/mikro-orm/mikro-orm/issues/4431)


### Features

* **core:** add `em.getMetadata(Entity)` shortcut ([e5834b4](https://github.com/mikro-orm/mikro-orm/commit/e5834b4314c190c1557aeddf31c88131ea855d89))
* **core:** support Uint8Array ([#4419](https://github.com/mikro-orm/mikro-orm/issues/4419)) ([01a9c59](https://github.com/mikro-orm/mikro-orm/commit/01a9c5973d723827e485ce0f9a36ea03b24db676)), closes [#4418](https://github.com/mikro-orm/mikro-orm/issues/4418)





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)


### Bug Fixes

* **cli:** expose missing `migration:check` command ([#4388](https://github.com/mikro-orm/mikro-orm/issues/4388)) ([79e128e](https://github.com/mikro-orm/mikro-orm/commit/79e128e34fd1587e345716174fcb7c11ce983568))
* **core:** fix change tracking of optional properties with `forceUndefined` ([9303c3f](https://github.com/mikro-orm/mikro-orm/commit/9303c3f58c05b266307c774134cb0057e03d29fa)), closes [#4412](https://github.com/mikro-orm/mikro-orm/issues/4412)
* **core:** fix populating relations in parallel via `Promise.all` ([#4415](https://github.com/mikro-orm/mikro-orm/issues/4415)) ([f4127a7](https://github.com/mikro-orm/mikro-orm/commit/f4127a7e9f28151c1043a0463c17cc0480ee3e90)), closes [#4213](https://github.com/mikro-orm/mikro-orm/issues/4213) [#4343](https://github.com/mikro-orm/mikro-orm/issues/4343)





## [5.7.10](https://github.com/mikro-orm/mikro-orm/compare/v5.7.9...v5.7.10) (2023-05-23)


### Bug Fixes

* **core:** exclude collections from `returning` clause from `em.upsert` ([e342449](https://github.com/mikro-orm/mikro-orm/commit/e342449c1c291b74de8821afc43236f217260165)), closes [#4382](https://github.com/mikro-orm/mikro-orm/issues/4382)
* **core:** re-export `Reference` class as `Ref` ([50eea37](https://github.com/mikro-orm/mikro-orm/commit/50eea370a43d70366643c8578c51ea427b79a64c)), closes [#4161](https://github.com/mikro-orm/mikro-orm/issues/4161)
* **core:** respect `skipNull` when serializing object properties/embeddables ([f27ee9a](https://github.com/mikro-orm/mikro-orm/commit/f27ee9a6dcaf4b9ad72c4aba652c1afb23b74577)), closes [#4383](https://github.com/mikro-orm/mikro-orm/issues/4383)


### Features

* **core:** add `meta` to `EventArgs` to the upsert events ([ed431ea](https://github.com/mikro-orm/mikro-orm/commit/ed431eaba1c62aa9d3cc5e664c1ec73eef59fceb))


### Performance Improvements

* **core:** set `Collection._property` early for managed entities ([23ca682](https://github.com/mikro-orm/mikro-orm/commit/23ca682ad8792de145a5c4c7e32c8ff226c0cae1)), closes [#4376](https://github.com/mikro-orm/mikro-orm/issues/4376)





## [5.7.9](https://github.com/mikro-orm/mikro-orm/compare/v5.7.8...v5.7.9) (2023-05-22)


### Bug Fixes

* **core:** fix mapping of results from partial loading ([541c449](https://github.com/mikro-orm/mikro-orm/commit/541c449e00d49c42e57ca0be536f26a4799bfa3c)), closes [#4377](https://github.com/mikro-orm/mikro-orm/issues/4377)


### Performance Improvements

* **core:** don't double clone when merging data to exiting entity ([c175652](https://github.com/mikro-orm/mikro-orm/commit/c175652445a58e26fac79eb6e7546a5397f2ee4c)), closes [#4376](https://github.com/mikro-orm/mikro-orm/issues/4376)





## [5.7.8](https://github.com/mikro-orm/mikro-orm/compare/v5.7.7...v5.7.8) (2023-05-21)


### Bug Fixes

* **core:** ensure `em.upsert` returns initialized entity ([#4370](https://github.com/mikro-orm/mikro-orm/issues/4370)) ([bad0b37](https://github.com/mikro-orm/mikro-orm/commit/bad0b37b83552cf6da6606b547ccb19d91062acc)), closes [#4242](https://github.com/mikro-orm/mikro-orm/issues/4242)
* **core:** ensure correct number of results is logged in SQL drivers ([e3cd184](https://github.com/mikro-orm/mikro-orm/commit/e3cd1845365c59fc3e8cdabd97a6be74c6374d79))
* **core:** ensure strict type-checking of enum queries ([8f8464a](https://github.com/mikro-orm/mikro-orm/commit/8f8464a53cb8125b8fe7f9cf11c4962b435c9f24))
* **query-builder:** `qb.clone()` shouldn't ignore `groupBy` and `having` clauses ([7127ff6](https://github.com/mikro-orm/mikro-orm/commit/7127ff623b1f64940e9f24d658a2f2a258227c19))


### Features

* **query-builder:** add `qb.returning()` ([b5ab66b](https://github.com/mikro-orm/mikro-orm/commit/b5ab66bccf4dc3867194a6ba50626d4891646fe1))
* **query-builder:** allow partial loading via `qb.(left/inner)JoinAndSelect()` ([22c8c84](https://github.com/mikro-orm/mikro-orm/commit/22c8c84d9852008522e21389b2304f7f646cdb99)), closes [#4364](https://github.com/mikro-orm/mikro-orm/issues/4364)





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)


### Bug Fixes

* **core:** deprecate `@Subscriber()` decorator ([033b71d](https://github.com/mikro-orm/mikro-orm/commit/033b71d8ecb3313a51fb042b088c886f303c72f0))
* **core:** revert the `const enums` as they break projects with `isolatedModules` ([8b23674](https://github.com/mikro-orm/mikro-orm/commit/8b2367401d055590e402241a46a996c2b026e873)), closes [#4350](https://github.com/mikro-orm/mikro-orm/issues/4350)
* **knex:** remove constraints from knex's peer dependencies ([ce81071](https://github.com/mikro-orm/mikro-orm/commit/ce8107169d817f794766f1470cb3eabb19de3cd7))
* **query-builder:** do not enable query pagination when explicit `groupBy` is set ([921251a](https://github.com/mikro-orm/mikro-orm/commit/921251a5d9cfdeefb0adabddcd889c305b1ef696)), closes [#4353](https://github.com/mikro-orm/mikro-orm/issues/4353)


### Features

* **core:** add `options` argument to filter callback ([c57ee5e](https://github.com/mikro-orm/mikro-orm/commit/c57ee5e3efda1d1516a0295a5b395f01dccdcad3)), closes [#4352](https://github.com/mikro-orm/mikro-orm/issues/4352)
* **query-builder:** validate unknown alias when explicitly joining ([8d4a83a](https://github.com/mikro-orm/mikro-orm/commit/8d4a83a08aee3e280356a8321f78085ff36bea5c)), closes [#4353](https://github.com/mikro-orm/mikro-orm/issues/4353)





## [5.7.6](https://github.com/mikro-orm/mikro-orm/compare/v5.7.5...v5.7.6) (2023-05-13)


### Bug Fixes

* **core:** allow `em.populate()` on lazy formula properties ([5c6bb13](https://github.com/mikro-orm/mikro-orm/commit/5c6bb13fd92ad941f1f8de1982544620bb3e1547))
* **core:** ensure database values are used in the identity map keys ([46b5e3a](https://github.com/mikro-orm/mikro-orm/commit/46b5e3ab50e8347fa6af0ca4289bf7d7ed7653d3)), closes [#4335](https://github.com/mikro-orm/mikro-orm/issues/4335)
* **core:** fix re-populating relations with `refresh: true` ([74b6a98](https://github.com/mikro-orm/mikro-orm/commit/74b6a98d1157a27ee57c7233c92cd460d787adb8)), closes [#4339](https://github.com/mikro-orm/mikro-orm/issues/4339)


### Features

* **core:** add `wrap(entity).populate([...])` shortcut ([6b519c4](https://github.com/mikro-orm/mikro-orm/commit/6b519c4a7336ba0df023e0067701f4b46dc15343))
* **core:** log number of results ([261b3d9](https://github.com/mikro-orm/mikro-orm/commit/261b3d95ac225b819a26b67a65f4c32c3e34e52f))


### Performance Improvements

* **core:** define some enums as const enums, so they get inlined ([3cb43ba](https://github.com/mikro-orm/mikro-orm/commit/3cb43baf14e4aa9b23d6085756198b6dbc796fb9))





## [5.7.5](https://github.com/mikro-orm/mikro-orm/compare/v5.7.4...v5.7.5) (2023-05-09)


### Bug Fixes

* **core:** deprecate `wrappedReference` and `IdentifiedReference` ([ab79832](https://github.com/mikro-orm/mikro-orm/commit/ab79832a8f119bc5c473ee8fb749ba1c9e4d01b3))
* **core:** detect early deletes for compound unique constraints ([f9530e4](https://github.com/mikro-orm/mikro-orm/commit/f9530e4b24bd806e33f1997d4e1ef548e02b6b90)), closes [#4305](https://github.com/mikro-orm/mikro-orm/issues/4305)
* **core:** fix extra updates caused by bigint type ([2acd25e](https://github.com/mikro-orm/mikro-orm/commit/2acd25e1dfd2eb7764e38c4ff224a84e52d5ed0f)), closes [#4249](https://github.com/mikro-orm/mikro-orm/issues/4249)
* **core:** fix extra updates caused by property initializers when `forceEntityConstructor` is enabled ([7ee883d](https://github.com/mikro-orm/mikro-orm/commit/7ee883df04be893a1c01b3ef0b41a736f5d6b3b9)), closes [#4323](https://github.com/mikro-orm/mikro-orm/issues/4323)
* **core:** respect schema name when checking duplicate table names ([5b89b00](https://github.com/mikro-orm/mikro-orm/commit/5b89b0056b6f87e6d5f4960bb2395d37bb9b3c28)), closes [#4332](https://github.com/mikro-orm/mikro-orm/issues/4332)
* **mongo:** sorting with UnderscoreNamingStrategy ([#4314](https://github.com/mikro-orm/mikro-orm/issues/4314)) ([a5b0f94](https://github.com/mikro-orm/mikro-orm/commit/a5b0f94895a1485249156d26290f60cc7080b65a)), closes [#4313](https://github.com/mikro-orm/mikro-orm/issues/4313)
* **postgres:** improve enum/check constraint inspection in schema diffing ([6c44b42](https://github.com/mikro-orm/mikro-orm/commit/6c44b4277976c2c4bd79818d997a1a6bff861d7c)), closes [#4312](https://github.com/mikro-orm/mikro-orm/issues/4312)





## [5.7.4](https://github.com/mikro-orm/mikro-orm/compare/v5.7.3...v5.7.4) (2023-05-01)


### Bug Fixes

* **core:** expand PK conditions inside top level operators ([305ce5d](https://github.com/mikro-orm/mikro-orm/commit/305ce5d6eef0971440f8bf7b01106f2da6fcfccc)), closes [#4222](https://github.com/mikro-orm/mikro-orm/issues/4222)
* **core:** fix extra updates when caching inlined embedded entities ([3dc3b32](https://github.com/mikro-orm/mikro-orm/commit/3dc3b3267ea7a2c4cbc9835214b84165d816adb2)), closes [#4295](https://github.com/mikro-orm/mikro-orm/issues/4295)
* **core:** fix object merging in `assign` helper when current value is scalar ([c012f95](https://github.com/mikro-orm/mikro-orm/commit/c012f95cfe0e4cd312652ff2d541a09b6ddfcde6)), closes [#4290](https://github.com/mikro-orm/mikro-orm/issues/4290)
* **core:** only consider valid query as tuple comparison ([7212a53](https://github.com/mikro-orm/mikro-orm/commit/7212a53fddc8c7712d7b2ec1eba8df41ccdab0eb)), closes [#4220](https://github.com/mikro-orm/mikro-orm/issues/4220)
* **migrations:** respect custom migration name in migration class names ([#4294](https://github.com/mikro-orm/mikro-orm/issues/4294)) ([c402a99](https://github.com/mikro-orm/mikro-orm/commit/c402a993b75a09a78f8fb9ea3de44f5298729689))





## [5.7.3](https://github.com/mikro-orm/mikro-orm/compare/v5.7.2...v5.7.3) (2023-04-28)


### Bug Fixes

* **core:** merge returned values to the initial entity snapshot ([e123076](https://github.com/mikro-orm/mikro-orm/commit/e1230764633ecdc906f3b1a4073f1dc44100e5a1)), closes [#4284](https://github.com/mikro-orm/mikro-orm/issues/4284)
* **postgres:** do not convert `date` column type to `Date` object automatically ([a7d1d09](https://github.com/mikro-orm/mikro-orm/commit/a7d1d09e710497d08d2c12346a76c664ed2d67e5)), closes [#4194](https://github.com/mikro-orm/mikro-orm/issues/4194) [#4276](https://github.com/mikro-orm/mikro-orm/issues/4276)


### Features

* **core:** add `beforeUpsert` and `afterUpsert` events ([db9ff09](https://github.com/mikro-orm/mikro-orm/commit/db9ff0974c0c51450729aec81436bacffb2362f6)), closes [#4282](https://github.com/mikro-orm/mikro-orm/issues/4282)
* **core:** allow creating DELETE changesets via `uow.computeChangeSet()` ([61479b6](https://github.com/mikro-orm/mikro-orm/commit/61479b642751f9bc347ae2ab6f0bbf630d6a6295)), closes [#4280](https://github.com/mikro-orm/mikro-orm/issues/4280)
* **core:** allow disabling validation for duplicate `tableName` ([dfb87bf](https://github.com/mikro-orm/mikro-orm/commit/dfb87bf96d801666edb30a35da41a6cf9e2369d9))





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)


### Bug Fixes

* **cli:** await the yargs.parse call in esm.ts ([#4272](https://github.com/mikro-orm/mikro-orm/issues/4272)) ([dcdf70a](https://github.com/mikro-orm/mikro-orm/commit/dcdf70a537eb733d7b4f0dea054bbef0b72b48a0))
* **core:** don't skip updates from propagation triggered via `em.create()` ([30778c3](https://github.com/mikro-orm/mikro-orm/commit/30778c35667d275bf4407a762feb1a92d91f7fe2)), closes [#4209](https://github.com/mikro-orm/mikro-orm/issues/4209)
* **core:** quote JSON property paths if they contain special characters ([a94bbce](https://github.com/mikro-orm/mikro-orm/commit/a94bbcec526fd372ef4d34be06fb7b79197e3878)), closes [#4264](https://github.com/mikro-orm/mikro-orm/issues/4264)
* **core:** respect `forceUndefined` in the original entity data ([d2d9cc0](https://github.com/mikro-orm/mikro-orm/commit/d2d9cc0bd45dd775aa0e951578b6f9f88fd01cec)), closes [#4262](https://github.com/mikro-orm/mikro-orm/issues/4262) [#4266](https://github.com/mikro-orm/mikro-orm/issues/4266)
* **core:** respect `serialize()` `skipNull` option inside embeddables ([4cf7669](https://github.com/mikro-orm/mikro-orm/commit/4cf766932e902cc96d56b2a9aa9d1215785c8ad6)), closes [#4263](https://github.com/mikro-orm/mikro-orm/issues/4263)
* **migrations:** allow generating named initial migration ([01d6a39](https://github.com/mikro-orm/mikro-orm/commit/01d6a39b22885ffa16332122d6279911440448dc)), closes [#4271](https://github.com/mikro-orm/mikro-orm/issues/4271)





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)


### Bug Fixes

* **cli:** await the `yargs.parse` call ([3757472](https://github.com/mikro-orm/mikro-orm/commit/37574723d0ce37a8d0d3284124d836a517f451a7)), closes [#4265](https://github.com/mikro-orm/mikro-orm/issues/4265)





## [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)


### Bug Fixes

* **core:** clean up bidirectional references after removal of entity ([bfd3840](https://github.com/mikro-orm/mikro-orm/commit/bfd3840a81ae01cc9f2b8fce77edf2f7e814d5fa)), closes [#4234](https://github.com/mikro-orm/mikro-orm/issues/4234)
* **core:** detect `JsonType` based on `columnType` ([#4252](https://github.com/mikro-orm/mikro-orm/issues/4252)) ([2e01622](https://github.com/mikro-orm/mikro-orm/commit/2e01622963c8b22c6468b93a9cd3bc4d8e13bada)), closes [#4229](https://github.com/mikro-orm/mikro-orm/issues/4229)
* **core:** do not try to propagate changes to `mapToPk` relations ([7028890](https://github.com/mikro-orm/mikro-orm/commit/7028890a3c902ed042e89da10168572544f0e595)), closes [#4254](https://github.com/mikro-orm/mikro-orm/issues/4254)
* **core:** fix mapping of joined relations with buffer PKs ([8e9e7ee](https://github.com/mikro-orm/mikro-orm/commit/8e9e7ee5fc4cbea0225113b735628a1f0298c5f5)), closes [#4219](https://github.com/mikro-orm/mikro-orm/issues/4219)
* **core:** merge env vars with explicit configuration recursively ([392a623](https://github.com/mikro-orm/mikro-orm/commit/392a623a9602eb42e8215dd71381c215d4ac1503)), closes [#4235](https://github.com/mikro-orm/mikro-orm/issues/4235)
* **core:** prevent tuple type properties from being converted to array when serializing entities ([#4205](https://github.com/mikro-orm/mikro-orm/issues/4205)) ([04ad72e](https://github.com/mikro-orm/mikro-orm/commit/04ad72e968b997fdc113b11db605fbb119a52f77))
* **core:** propagate changes from extra updates back to the original changeset ([77f5c14](https://github.com/mikro-orm/mikro-orm/commit/77f5c147efc5e96007908a481cf2d3c34ac321fa)), closes [#4245](https://github.com/mikro-orm/mikro-orm/issues/4245)
* **core:** rework JSON value processing ([#4194](https://github.com/mikro-orm/mikro-orm/issues/4194)) ([5594c46](https://github.com/mikro-orm/mikro-orm/commit/5594c469f05d2c1fc76f3cc1a388f5e7162f4e72)), closes [#4193](https://github.com/mikro-orm/mikro-orm/issues/4193)
* **mariadb:** use `json_extract` when querying JSON fields ([ca96acc](https://github.com/mikro-orm/mikro-orm/commit/ca96acc640ae36a1b9d5992b248a8d32f019e18c))
* **query-builder:** fix pagination when PK uses `BigIntType` ([b789031](https://github.com/mikro-orm/mikro-orm/commit/b789031300e752cfd9565371e7989776b18bd3a0)), closes [#4227](https://github.com/mikro-orm/mikro-orm/issues/4227)
* **query-builder:** support `onConflict().ignore()` without parameters ([3a3b0bd](https://github.com/mikro-orm/mikro-orm/commit/3a3b0bd956354917f31481582cc2e6381951a7c5)), closes [#4224](https://github.com/mikro-orm/mikro-orm/issues/4224)
* **schema:** fix comparing default value of JSON properties ([41277a1](https://github.com/mikro-orm/mikro-orm/commit/41277a1376904b197851bbc3a6cb7692187d90d0)), closes [#4212](https://github.com/mikro-orm/mikro-orm/issues/4212)


### Features

* **core:** allow disabling transactions ([#4260](https://github.com/mikro-orm/mikro-orm/issues/4260)) ([8e8bc38](https://github.com/mikro-orm/mikro-orm/commit/8e8bc38d7d4056d59dc7058b0f2d2c3827588bc0)), closes [#3747](https://github.com/mikro-orm/mikro-orm/issues/3747) [#3992](https://github.com/mikro-orm/mikro-orm/issues/3992)
* **core:** deprecate `persist/flush/remove` methods from `EntityRepository` ([#4259](https://github.com/mikro-orm/mikro-orm/issues/4259)) ([eba4563](https://github.com/mikro-orm/mikro-orm/commit/eba45635c61c13f3646a19e640522bce09f5a24a)), closes [#3989](https://github.com/mikro-orm/mikro-orm/issues/3989)
* **core:** validate repository type in `repo.populate()` and `repo.assign()` ([301bdf8](https://github.com/mikro-orm/mikro-orm/commit/301bdf881b56ffb373c168f7be9af71a061466da)), closes [#3989](https://github.com/mikro-orm/mikro-orm/issues/3989)
* **core:** validate unique `tableName` ([0693029](https://github.com/mikro-orm/mikro-orm/commit/069302936bfa1fd10aeb2636ccdc3ca6ea021c4b)), closes [#4149](https://github.com/mikro-orm/mikro-orm/issues/4149)
* **migrations:** add support for custom migration names ([#4250](https://github.com/mikro-orm/mikro-orm/issues/4250)) ([fb2879e](https://github.com/mikro-orm/mikro-orm/commit/fb2879e21575a54d1b05c7d1fc250d5f713d9b44))
* **mongo:** allow setting weights on index ([299b188](https://github.com/mikro-orm/mikro-orm/commit/299b18861339a8e7d5ebb5ac06a9350d0983a1a7)), closes [#4172](https://github.com/mikro-orm/mikro-orm/issues/4172)


### Performance Improvements

* **core:** fix eager loading of multiple properties causing a cycles ([ecbecfc](https://github.com/mikro-orm/mikro-orm/commit/ecbecfc9b46ea7402024e7fd31e3f818b361d860)), closes [#4213](https://github.com/mikro-orm/mikro-orm/issues/4213)





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Bug Fixes

* **core:** don't override discovery options when `alwaysAnalyseProperties` is used ([f4acc91](https://github.com/mikro-orm/mikro-orm/commit/f4acc918ad25af3a97c2673de36922d5ce90eccf)), closes [#4181](https://github.com/mikro-orm/mikro-orm/issues/4181)
* **core:** ensure correct FK as PK identity map key ([475e2a3](https://github.com/mikro-orm/mikro-orm/commit/475e2a33d1a2682cc9168269e36f14b10b6fe7fd))
* **core:** fix hydration of 1:1 FK as PK property via joined strategy ([75653f0](https://github.com/mikro-orm/mikro-orm/commit/75653f0d857e74ab83f06290ffc8ed59f7e91f3c)), closes [#4160](https://github.com/mikro-orm/mikro-orm/issues/4160)
* **core:** hydrate collection items when merging data in `factory.create` ([493d653](https://github.com/mikro-orm/mikro-orm/commit/493d653d84442cd854f3c6d1e67ce92d688f5924)), closes [#4173](https://github.com/mikro-orm/mikro-orm/issues/4173)
* **core:** normalize zero in bigint type to string ([78a8e48](https://github.com/mikro-orm/mikro-orm/commit/78a8e48bec188fbe17d8b9deb4b623a4d1810a3b)), closes [#4159](https://github.com/mikro-orm/mikro-orm/issues/4159)
* **core:** use JsonType automatically when `type: 'jsonb'` ([43cb6d7](https://github.com/mikro-orm/mikro-orm/commit/43cb6d70ed38694424fcc6a218a1a3063991de8a))
* **migrations:** do not interact with the database when snapshot exists ([48df462](https://github.com/mikro-orm/mikro-orm/commit/48df46219811e33c296ad3bd182a95702d3a2007))
* **mysql:** fix mapping of PK in `upsertMany` ([0f4cf85](https://github.com/mikro-orm/mikro-orm/commit/0f4cf85f8655326727f6fd27c6dbb66c606e922a)), closes [#4153](https://github.com/mikro-orm/mikro-orm/issues/4153)


### Features

* **migrator:** allow disabling logging via `migrations.silent` ([#4182](https://github.com/mikro-orm/mikro-orm/issues/4182)) ([4b778bf](https://github.com/mikro-orm/mikro-orm/commit/4b778bf2db55bdc678a13c7dd6c27c3d72fde97d)), closes [#4124](https://github.com/mikro-orm/mikro-orm/issues/4124)


### Performance Improvements

* **core:** populating many large 1:M collections ([875d966](https://github.com/mikro-orm/mikro-orm/commit/875d966db9b4d4ea313709e0f1382f025599edbf)), closes [#4171](https://github.com/mikro-orm/mikro-orm/issues/4171)





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)


### Bug Fixes

* **core:** deduplicate columns in insert queries ([db734d6](https://github.com/mikro-orm/mikro-orm/commit/db734d69b23a97f1cca186dba6629b112d788b16))
* **core:** fix nested inlined embedded property hydration ([2bbcb47](https://github.com/mikro-orm/mikro-orm/commit/2bbcb477890fc87cb2a349922d83bfdb54f68b59)), closes [#4145](https://github.com/mikro-orm/mikro-orm/issues/4145)
* **core:** fix snapshot of relation properties loaded via joined strategy ([6015f3f](https://github.com/mikro-orm/mikro-orm/commit/6015f3fb2b09ca920d0fbe3329733d3d5f8d134e)), closes [#4129](https://github.com/mikro-orm/mikro-orm/issues/4129)
* **core:** respect explicit `unsigned` option ([#4126](https://github.com/mikro-orm/mikro-orm/issues/4126)) ([846a57d](https://github.com/mikro-orm/mikro-orm/commit/846a57dc3baffe8897065710a6368efd91985401))
* **sqlite:** fix detecting multi-line `returning` queries ([ba1a5fc](https://github.com/mikro-orm/mikro-orm/commit/ba1a5fc95c611ffd2c393e7dc8763255fa0ca6c7)), closes [#4133](https://github.com/mikro-orm/mikro-orm/issues/4133)





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)


### Bug Fixes

* **core:** allow comparing `{}` with `Object.create(null)` ([955895e](https://github.com/mikro-orm/mikro-orm/commit/955895ec9b29caf4172852efd3da90cef8d7d0f5)), closes [#4109](https://github.com/mikro-orm/mikro-orm/issues/4109)
* **core:** assigning to reference properties inside embeddables ([ede04e6](https://github.com/mikro-orm/mikro-orm/commit/ede04e6d9c77f064268eb94937a64bfd4666e42c)), closes [#4106](https://github.com/mikro-orm/mikro-orm/issues/4106)
* **core:** discover pivot entities automatically when specified by reference ([3ea4776](https://github.com/mikro-orm/mikro-orm/commit/3ea47760faa1bb1092be374105fe85f0ffb2408d))
* **core:** ensure `populate: true` supports nested relations inside M:N ([b42f0f3](https://github.com/mikro-orm/mikro-orm/commit/b42f0f3a54cb3e3f7146584caf4d34f200ccc195))
* **core:** extra update on a reference with 1:1 self-reference ([f2fa2bd](https://github.com/mikro-orm/mikro-orm/commit/f2fa2bd5c30d70f511009a8cbc20966587be46c5)), closes [#4121](https://github.com/mikro-orm/mikro-orm/issues/4121)
* **core:** fix nested object merging in JSON properties ([694ef28](https://github.com/mikro-orm/mikro-orm/commit/694ef281abf970434f42c7b620bfb81b1c794815)), closes [#4101](https://github.com/mikro-orm/mikro-orm/issues/4101)
* **core:** improve handling of complex pivot table entities ([45449c4](https://github.com/mikro-orm/mikro-orm/commit/45449c4fd263198fb6220267ab1070a38ca3ef03)), closes [#4083](https://github.com/mikro-orm/mikro-orm/issues/4083)
* **postgres:** use explicit schema in table identifier when altering comments ([#4123](https://github.com/mikro-orm/mikro-orm/issues/4123)) ([60d96de](https://github.com/mikro-orm/mikro-orm/commit/60d96de64de7f01a4d9baab485046c7f7f43ee7c)), closes [#4108](https://github.com/mikro-orm/mikro-orm/issues/4108)
* **query-builder:** ensure inner paginate query selects sub-queries used in orderBy ([22b7146](https://github.com/mikro-orm/mikro-orm/commit/22b7146cae14a3e153ed4d144f18de1fb6b8cc45)), closes [#4104](https://github.com/mikro-orm/mikro-orm/issues/4104)
* **query-builder:** fix update query with auto-join of 1:1 owner ([0a053fe](https://github.com/mikro-orm/mikro-orm/commit/0a053fe8854a088be8262291f51697749e89cd05)), closes [#4122](https://github.com/mikro-orm/mikro-orm/issues/4122)


### Features

* **core:** allow skipping `convertToDatabaseValue` during hydration ([d1ce240](https://github.com/mikro-orm/mikro-orm/commit/d1ce2408306a9bdd805077ef1a3f9c561eefe982)), closes [#4120](https://github.com/mikro-orm/mikro-orm/issues/4120)
* **migrations:** add `params` to the `Migration.execute` method ([f280e6d](https://github.com/mikro-orm/mikro-orm/commit/f280e6d0d39dcd5a087497c7d533bec79b32f7cb)), closes [#4099](https://github.com/mikro-orm/mikro-orm/issues/4099)





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)


### Bug Fixes

* **core:** fix deep assigning of collection items with complex composite keys ([95631f4](https://github.com/mikro-orm/mikro-orm/commit/95631f4234cfc943c215c11097a21df325a1709d)), closes [#4074](https://github.com/mikro-orm/mikro-orm/issues/4074)
* **core:** fix diffing of JSON properties ([2e9a026](https://github.com/mikro-orm/mikro-orm/commit/2e9a02689adb7129f9671aa4038076d3504fa986)), closes [#4078](https://github.com/mikro-orm/mikro-orm/issues/4078)
* **core:** log abstract entity names during discovery ([e721ad7](https://github.com/mikro-orm/mikro-orm/commit/e721ad757ecf6df7da466c589bce772f4589fc72)), closes [#4080](https://github.com/mikro-orm/mikro-orm/issues/4080)
* **postgres:** use quoted schema+table name when dropping constraints ([#4079](https://github.com/mikro-orm/mikro-orm/issues/4079)) ([ff1dfb6](https://github.com/mikro-orm/mikro-orm/commit/ff1dfb69ff9841d45cb9ce78c37341748df47c08))





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)


### Bug Fixes

* **core:** enforce select-in strategy for self-referencing eager relations ([cc07c6b](https://github.com/mikro-orm/mikro-orm/commit/cc07c6b3393e220da8afb7bec615b2fd553921ed)), closes [#4061](https://github.com/mikro-orm/mikro-orm/issues/4061)
* **core:** ensure custom types are processed in `em.upsert/upsertMany/insertMany` ([53a08ac](https://github.com/mikro-orm/mikro-orm/commit/53a08acfa285edb0c9da7185a3de9c763361245d)), closes [#4070](https://github.com/mikro-orm/mikro-orm/issues/4070)
* **core:** move repository cache to the EM fork ([05fabb9](https://github.com/mikro-orm/mikro-orm/commit/05fabb9c3b06fa8a811a9ef475281c0df5836ee2)), closes [#3074](https://github.com/mikro-orm/mikro-orm/issues/3074)
* **mongo:** move $fulltext from $and to top level ([#4066](https://github.com/mikro-orm/mikro-orm/issues/4066)) ([680a99c](https://github.com/mikro-orm/mikro-orm/commit/680a99c19a5636e9cdb3ec06ec5d4b185f077eeb)), closes [#4065](https://github.com/mikro-orm/mikro-orm/issues/4065)
* **mysql:** fix reloading of db defaults for complex composite PKs ([8dcc1bd](https://github.com/mikro-orm/mikro-orm/commit/8dcc1bd5a9039475f97d1d817e13d1d32af5271d)), closes [#4062](https://github.com/mikro-orm/mikro-orm/issues/4062)





## [5.6.11](https://github.com/mikro-orm/mikro-orm/compare/v5.6.10...v5.6.11) (2023-02-17)


### Bug Fixes

* **core:** do not process custom types twice in `em.upsertMany` ([3928e78](https://github.com/mikro-orm/mikro-orm/commit/3928e789d9efec0def8fd62f24d11b020a70ca25)), closes [#3787](https://github.com/mikro-orm/mikro-orm/issues/3787)
* **core:** fix mapping of `null` in datetime columns ([73e483a](https://github.com/mikro-orm/mikro-orm/commit/73e483ae7bb821a6abd188803765ed3ff0b25775)), closes [#4057](https://github.com/mikro-orm/mikro-orm/issues/4057)
* **core:** infer custom type even if there is explicit `columnType` option ([a901112](https://github.com/mikro-orm/mikro-orm/commit/a9011124fbcc5b5e1db9a655fa37f290a2d7771f))
* **schema:** fix merging of primary keys from base entity ([c40e15c](https://github.com/mikro-orm/mikro-orm/commit/c40e15ca5c500878acd047a2f22adbe3e83d50a9)), closes [#4051](https://github.com/mikro-orm/mikro-orm/issues/4051)





## [5.6.10](https://github.com/mikro-orm/mikro-orm/compare/v5.6.9...v5.6.10) (2023-02-17)


### Bug Fixes

* **core:** convert custom types in delete queries from orphan removal ([b32df88](https://github.com/mikro-orm/mikro-orm/commit/b32df88db95e4aa3da703026b25d9dc7b78eca3f)), closes [#4033](https://github.com/mikro-orm/mikro-orm/issues/4033)
* **core:** convert custom types when snapshotting scalar composite keys ([391732e](https://github.com/mikro-orm/mikro-orm/commit/391732ee9fd35d1f245f2420f99d58bc986a6375)), closes [#3988](https://github.com/mikro-orm/mikro-orm/issues/3988)
* **core:** map returned values correctly after batch insert ([a61a84f](https://github.com/mikro-orm/mikro-orm/commit/a61a84f82caa0185bdc809fb7c76854bdf259811))
* **core:** map values from returning statement in `em.upsert` ([bed72fe](https://github.com/mikro-orm/mikro-orm/commit/bed72fe20ff236a059756a6b20f21fc13bed7d2a)), closes [#4020](https://github.com/mikro-orm/mikro-orm/issues/4020)
* **core:** use types from `discovery.getMappedType` on runtime too ([2f682e3](https://github.com/mikro-orm/mikro-orm/commit/2f682e33587bf31c5020d66b1d963d60cbc39cac)), closes [#4042](https://github.com/mikro-orm/mikro-orm/issues/4042)


### Performance Improvements

* **core:** improve result mapping and snapshotting ([#4053](https://github.com/mikro-orm/mikro-orm/issues/4053)) ([8bb0268](https://github.com/mikro-orm/mikro-orm/commit/8bb0268a6d67143b0aa4dd0a5c6a6fb1bd0f8374))





## [5.6.9](https://github.com/mikro-orm/mikro-orm/compare/v5.6.8...v5.6.9) (2023-02-10)


### Bug Fixes

* **core:** add missing `repo.upsertMany` shortcut ([c101d51](https://github.com/mikro-orm/mikro-orm/commit/c101d51dcb550acb4705653a42bfd3066b2fd347))
* **core:** do not serialize JSON values twice ([f06eeb0](https://github.com/mikro-orm/mikro-orm/commit/f06eeb02a9e9038f107a338b1a51a5db1973e83d))
* **core:** do not snapshot missing embedded properties as `undefined` ([4ad4cdf](https://github.com/mikro-orm/mikro-orm/commit/4ad4cdf7a8a081b4bfa1e14695bd446dac49d9e1))
* **core:** ensure json type is recognized with `type: 'jsonb'` ([e1f82bc](https://github.com/mikro-orm/mikro-orm/commit/e1f82bc5b63ea7547685244fa42a7f612250b909)), closes [#3998](https://github.com/mikro-orm/mikro-orm/issues/3998)
* **core:** improve handling of not managed references created via `ref()/rel()` ([2e814e8](https://github.com/mikro-orm/mikro-orm/commit/2e814e89e78a3ac0d5dcedf88d9acdb1be06e287)), closes [#4027](https://github.com/mikro-orm/mikro-orm/issues/4027)
* **query-builder:** respect `qb.joinAndSelect` when serializing ([4025869](https://github.com/mikro-orm/mikro-orm/commit/4025869c5183899b459c6dc7a88d8b60cd4e2689)), closes [#4034](https://github.com/mikro-orm/mikro-orm/issues/4034) [#3812](https://github.com/mikro-orm/mikro-orm/issues/3812)


### Features

* **core:** optionally log if entity is managed or not ([68e073b](https://github.com/mikro-orm/mikro-orm/commit/68e073bc07281ebbfe0cef4008a3c2ff0006d953))
* **migrations:** add `cjs` option for emit ([#4016](https://github.com/mikro-orm/mikro-orm/issues/4016)) ([d5cfa22](https://github.com/mikro-orm/mikro-orm/commit/d5cfa2239e7a2686b6d820371e9dd06920cf75fd)), closes [#4005](https://github.com/mikro-orm/mikro-orm/issues/4005)





## [5.6.8](https://github.com/mikro-orm/mikro-orm/compare/v5.6.7...v5.6.8) (2023-01-25)


### Bug Fixes

* **mysql:** fix reloading of database defaults for complex composite PKs ([d36af00](https://github.com/mikro-orm/mikro-orm/commit/d36af00514d96d1060fb18e68ac66b1117e706cb)), closes [#3965](https://github.com/mikro-orm/mikro-orm/issues/3965)
* **reflection:** do not rehydrate metadata cache for enum items unless needed ([e4761b6](https://github.com/mikro-orm/mikro-orm/commit/e4761b66f556476544ebbed240178e6cfc582a99)), closes [#3955](https://github.com/mikro-orm/mikro-orm/issues/3955)


### Features

* **core:** add `forceConstructor` option to `@Entity()` decorator ([c89b4af](https://github.com/mikro-orm/mikro-orm/commit/c89b4af628e8fc895f4dfd49a8ccb53692979808))
* **core:** add `hydrate` option to `@Property()` decorator ([f4ba092](https://github.com/mikro-orm/mikro-orm/commit/f4ba0928d8cf6109b9c88b2220ec8eac8cb6981c)), closes [#3936](https://github.com/mikro-orm/mikro-orm/issues/3936)
* **core:** allow filtering in `Collection.loadCount()` ([#3958](https://github.com/mikro-orm/mikro-orm/issues/3958)) ([08ea320](https://github.com/mikro-orm/mikro-orm/commit/08ea320f3c13e73db9e995eaf5b9b22a45f33fe9)), closes [#3527](https://github.com/mikro-orm/mikro-orm/issues/3527)
* **migrations-mongo:** replace backslash in the glob to fix windows support ([d904ba0](https://github.com/mikro-orm/mikro-orm/commit/d904ba0039847638dd8f1b3ecb33b594fdddd812)), closes [#3957](https://github.com/mikro-orm/mikro-orm/issues/3957)
* **mongo:** add missing `MongoEntityRepository.getCollection()` shortcut ([5e4e126](https://github.com/mikro-orm/mikro-orm/commit/5e4e1266eb704d458c98bed902c6424d2e358b70)), closes [#3951](https://github.com/mikro-orm/mikro-orm/issues/3951)





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)


### Bug Fixes

* **core:** ensure propagation during hydration dont produce extra updates ([88595bd](https://github.com/mikro-orm/mikro-orm/commit/88595bdf450d2b93fd9a1c18449fc27ee7229738)), closes [#3941](https://github.com/mikro-orm/mikro-orm/issues/3941)
* **core:** propagate ManyToOne only to matching collections (STI) ([#3940](https://github.com/mikro-orm/mikro-orm/issues/3940)) ([8ff7ed1](https://github.com/mikro-orm/mikro-orm/commit/8ff7ed193738cf518b54995eeb1f6a5bd59f052f)), closes [#3939](https://github.com/mikro-orm/mikro-orm/issues/3939)
* **core:** respect `mapToPk` during hydration with custom type FK ([75d05ee](https://github.com/mikro-orm/mikro-orm/commit/75d05ee7ed57107072a44c29be24a64ff27e6db0)), closes [#3921](https://github.com/mikro-orm/mikro-orm/issues/3921)


### Features

* **seeder:** expose `Factory.makeEntity` method that does not call `em.persist()` ([bb8f1b0](https://github.com/mikro-orm/mikro-orm/commit/bb8f1b03f7c25811f87311e997646bf793b52a13)), closes [#3932](https://github.com/mikro-orm/mikro-orm/issues/3932)





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)


### Bug Fixes

* **core:** do not allow functions and symbols in `FilterQuery` ([85b1fc1](https://github.com/mikro-orm/mikro-orm/commit/85b1fc13399a04539f8dcfa31ef12aaef540aa95)), closes [#3928](https://github.com/mikro-orm/mikro-orm/issues/3928)
* **core:** make `FilterQuery` strict again! ([5427097](https://github.com/mikro-orm/mikro-orm/commit/5427097c9987e3d428c43df12373dcc4496b38f8))





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)


### Bug Fixes

* **core:** do not fail on serialization when POJO instead of embeddable instance found ([c8de84b](https://github.com/mikro-orm/mikro-orm/commit/c8de84babe28c13eaf3efb62e27a0fea3337f9ac))
* **core:** make serialization of embedded properties support `null` instead of value ([3006507](https://github.com/mikro-orm/mikro-orm/commit/3006507132b7ba465430af6e0f918179f08ab5c6)), closes [#3906](https://github.com/mikro-orm/mikro-orm/issues/3906)
* **entity-generator:** use table name instead of class name in `EntitySchema` ([#3916](https://github.com/mikro-orm/mikro-orm/issues/3916)) ([84d9407](https://github.com/mikro-orm/mikro-orm/commit/84d9407b75137b1e69d66d257fb0a72ab2229558)), closes [#3915](https://github.com/mikro-orm/mikro-orm/issues/3915)


### Features

* **cli:** add check for migrations command ([#3923](https://github.com/mikro-orm/mikro-orm/issues/3923)) ([a0ac946](https://github.com/mikro-orm/mikro-orm/commit/a0ac946be35e6dd5bebd263036ce10c068a81af6))
* **core:** add `em.insertMany()` ([5d1565d](https://github.com/mikro-orm/mikro-orm/commit/5d1565dca46f91058720b6ad8df1b373bdb8ff65))





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)


### Bug Fixes

* **core:** improve inference of driver exported `MikroORM.init()` ([497f274](https://github.com/mikro-orm/mikro-orm/commit/497f27451bbca37c7dd9222716257692724d3a0d))
* **core:** respect transaction context in `em.execute()` ([832105d](https://github.com/mikro-orm/mikro-orm/commit/832105d23de63df29010ccf62f4ec7a67955a47f)), closes [#3896](https://github.com/mikro-orm/mikro-orm/issues/3896)
* **mongo:** register serialized PK get/set pair only when explicitly requested ([7004100](https://github.com/mikro-orm/mikro-orm/commit/700410075e0ff83207c17fe6a0413cd534208472)), closes [#3900](https://github.com/mikro-orm/mikro-orm/issues/3900)
* **mongo:** respect field names in batch update conditions ([3466c86](https://github.com/mikro-orm/mikro-orm/commit/3466c86e9bf6bbffea1f661186c854b9d1c976e9)), closes [#3897](https://github.com/mikro-orm/mikro-orm/issues/3897)


### Features

* **cli:** check database connection in debug command ([#3875](https://github.com/mikro-orm/mikro-orm/issues/3875)) ([3523410](https://github.com/mikro-orm/mikro-orm/commit/35234100b68cc1e56e4149821f2cd664f09eb32a)), closes [#3855](https://github.com/mikro-orm/mikro-orm/issues/3855)
* **core:** add getResultAndCount() ([#3891](https://github.com/mikro-orm/mikro-orm/issues/3891)) ([11956c8](https://github.com/mikro-orm/mikro-orm/commit/11956c8bc31e140ba73353eb1057d91e001986c5)), closes [#3885](https://github.com/mikro-orm/mikro-orm/issues/3885)





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)


### Bug Fixes

* **core:** delay snapshotting of entity state to fix differences with joined strategy ([cbf62fa](https://github.com/mikro-orm/mikro-orm/commit/cbf62faa61c376c9065ff30005ada442c90fb158)), closes [#3876](https://github.com/mikro-orm/mikro-orm/issues/3876)
* **core:** do not convert custom mapped type twice in `Reference.createFromPK` ([7dfff45](https://github.com/mikro-orm/mikro-orm/commit/7dfff45cb09cedee994070fe432f1b4821b73494)), closes [#3878](https://github.com/mikro-orm/mikro-orm/issues/3878)





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)


### Bug Fixes

* **core:** fix assignability of `Loaded` type to naked entity ([e574924](https://github.com/mikro-orm/mikro-orm/commit/e574924fa6a1559d1dd5a7331c29e5205b77921f)), closes [#3865](https://github.com/mikro-orm/mikro-orm/issues/3865)
* **core:** respect `*` in partial loading with joined strategy ([7781f84](https://github.com/mikro-orm/mikro-orm/commit/7781f84537eac9a53d16ff2514bcaa051ece23c5)), closes [#3868](https://github.com/mikro-orm/mikro-orm/issues/3868)


### Features

* **core:** validate bidirectional M:N with `pivotEntity` ([5e793a2](https://github.com/mikro-orm/mikro-orm/commit/5e793a2ef956ea9bf324c950c5e975f5d75ceb99)), closes [#3860](https://github.com/mikro-orm/mikro-orm/issues/3860)
* **core:** validate FK as PK is always an owning side ([330c4e2](https://github.com/mikro-orm/mikro-orm/commit/330c4e28b14df245d189d0e558cc5d68cfa348f2)), closes [#3869](https://github.com/mikro-orm/mikro-orm/issues/3869)





## [5.6.1](https://github.com/mikro-orm/mikro-orm/compare/v5.6.0...v5.6.1) (2022-12-20)


### Bug Fixes

* **core:** allow adding array of refs to collection ([#3859](https://github.com/mikro-orm/mikro-orm/issues/3859)) ([0ce85e9](https://github.com/mikro-orm/mikro-orm/commit/0ce85e92caa9d115956237281f7bfaf43dd54139))
* **core:** clone event manager when forking in `em.transactional` ([0e523b3](https://github.com/mikro-orm/mikro-orm/commit/0e523b3fa59a7e26faad9393465c6b2b609f9643)), closes [#3857](https://github.com/mikro-orm/mikro-orm/issues/3857)
* **core:** do not unset non-null relations when propagating remove operation ([69a7f94](https://github.com/mikro-orm/mikro-orm/commit/69a7f9469250f2951e8e19b66bb92b444f2dd7fe)), closes [#3854](https://github.com/mikro-orm/mikro-orm/issues/3854)
* **core:** fix compiled functions when relation property uses hyphens ([22350bd](https://github.com/mikro-orm/mikro-orm/commit/22350bdb1ce70163de8fe6dbd6a34cb3e372a2cc)), closes [#3813](https://github.com/mikro-orm/mikro-orm/issues/3813)
* **core:** fix populating relation with composite FK as primary key ([b27578f](https://github.com/mikro-orm/mikro-orm/commit/b27578ffd1f6185022f249a69e33b86791809aaf)), closes [#3844](https://github.com/mikro-orm/mikro-orm/issues/3844)
* **core:** improve inference in `em.findX()` methods ([fcb1739](https://github.com/mikro-orm/mikro-orm/commit/fcb17392ca8270926b6f725010c0f181243fb018))
* **core:** propagation with nullable 1:1 relation ([#3851](https://github.com/mikro-orm/mikro-orm/issues/3851)) ([d77c370](https://github.com/mikro-orm/mikro-orm/commit/d77c3704561ee0e2a4cb01f40e1cb36f2e1f89e4)), closes [#3850](https://github.com/mikro-orm/mikro-orm/issues/3850)
* **core:** remove `readonly` modifier from `Populate` type ([7b2dfb9](https://github.com/mikro-orm/mikro-orm/commit/7b2dfb91cd791fe3f3bcfc1d18520804dafe2907))
* **mariadb:** do not force date strings ([8861354](https://github.com/mikro-orm/mikro-orm/commit/8861354ca378a70ec6ff2f1bf926c5fb110a7643)), closes [#3853](https://github.com/mikro-orm/mikro-orm/issues/3853)
* **postgres:** compare only simplified versions of check constraints ([0fd8530](https://github.com/mikro-orm/mikro-orm/commit/0fd853001334032b71a0ff42fbdb585655717216)), closes [#3827](https://github.com/mikro-orm/mikro-orm/issues/3827)
* **postgres:** ignore internal timescale schemas automatically ([85d9083](https://github.com/mikro-orm/mikro-orm/commit/85d9083766ccff50680517289c2a28e0512e02e5))





## [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)


### Bug Fixes

* **core:** deprecate `type` option in favour of driver exports ([7180f23](https://github.com/mikro-orm/mikro-orm/commit/7180f23e2d97a0f1d9d208a91e5b0230d1712acd)), closes [#3743](https://github.com/mikro-orm/mikro-orm/issues/3743)
* **core:** do not mark entities as populated via `em.merge()` ([bfa4962](https://github.com/mikro-orm/mikro-orm/commit/bfa4962764b2e65cb9ee559e98e38035063c1e43)), closes [#3812](https://github.com/mikro-orm/mikro-orm/issues/3812)
* **core:** do not process mapped types twice in `em.upsert()` ([434d417](https://github.com/mikro-orm/mikro-orm/commit/434d417b6a38a4cd8293882061067cf6d89ba003)), closes [#3787](https://github.com/mikro-orm/mikro-orm/issues/3787)
* **core:** ensure correct result in `ChangeSet.getPrimaryKey(true)` ([2e74a34](https://github.com/mikro-orm/mikro-orm/commit/2e74a3445e5e42d4fb1a11bc1b1212b5099f58c3)), closes [#3737](https://github.com/mikro-orm/mikro-orm/issues/3737)
* **core:** fix query execution inside hooks sometimes hanging ([d68b9bd](https://github.com/mikro-orm/mikro-orm/commit/d68b9bd6721b7e2a715cea65b20c7db03b51ff93))
* **core:** make `ChangeSet.getPrimaryKey()` response stable ([d32c956](https://github.com/mikro-orm/mikro-orm/commit/d32c956aa3ff66796e4b48b060242195b223c162))
* **core:** remove `readonly` from properties of `FilterQuery` ([2a2a13d](https://github.com/mikro-orm/mikro-orm/commit/2a2a13d96a443f1b3165d6c43a61fba9e3b019e7)), closes [#3836](https://github.com/mikro-orm/mikro-orm/issues/3836)
* **core:** return `Ref & LoadedReference` from `ref()` ([c85e507](https://github.com/mikro-orm/mikro-orm/commit/c85e5070e6aeabea457c22d3cc95e0cb5270f062)), closes [#3840](https://github.com/mikro-orm/mikro-orm/issues/3840)
* **core:** serialize not managed relations as populated ([89b4dab](https://github.com/mikro-orm/mikro-orm/commit/89b4dab31bdac52e1a6a4a281dd3bbd50b3745ec)), closes [#3788](https://github.com/mikro-orm/mikro-orm/issues/3788)
* **core:** support `hidden` flag on primary keys ([4935505](https://github.com/mikro-orm/mikro-orm/commit/49355058b1032f217292a88c3109cd746b52e9e2))
* **embeddables:** respect explicit `null` only for object embeddables ([6e0bedf](https://github.com/mikro-orm/mikro-orm/commit/6e0bedf5610b6e423605d250ed2ac1a15a63381e)), closes [#3772](https://github.com/mikro-orm/mikro-orm/issues/3772)
* **mysql:** ensure bigint columns are mapped to string ([d3d50ba](https://github.com/mikro-orm/mikro-orm/commit/d3d50ba6da8d4c244bc45387f56a97b7706ef6b1)), closes [#3739](https://github.com/mikro-orm/mikro-orm/issues/3739)
* **mysql:** respect `auto_increment_increment` when batch inserting ([516db6d](https://github.com/mikro-orm/mikro-orm/commit/516db6d3e97b6309d55e8a73a73bb85144af1196)), closes [#3828](https://github.com/mikro-orm/mikro-orm/issues/3828)
* **postgres:** quote array literal items containing a comma ([5ffa81c](https://github.com/mikro-orm/mikro-orm/commit/5ffa81c02ac01cc3420ca345b05835e331c879e9)), closes [#3810](https://github.com/mikro-orm/mikro-orm/issues/3810)
* **postgres:** use `postgres` as the management db name + allow override ([eab1668](https://github.com/mikro-orm/mikro-orm/commit/eab16681681b13b40f183dc8ec6b26e3171edc11)), closes [#3769](https://github.com/mikro-orm/mikro-orm/issues/3769)
* **query-builder:** fix cloning QB in some cases ([c3b4c20](https://github.com/mikro-orm/mikro-orm/commit/c3b4c2089d80a2d1431cc663e767b01be6fe891b)), closes [#3720](https://github.com/mikro-orm/mikro-orm/issues/3720)
* **query-builder:** fix querying for a composite FK when target is joined ([dec4c9c](https://github.com/mikro-orm/mikro-orm/commit/dec4c9c46b1ecf3105f78b77a698c30ef8670c14)), closes [#3738](https://github.com/mikro-orm/mikro-orm/issues/3738)
* **query-builder:** respect case-insensitive regexp flag ([1a1d381](https://github.com/mikro-orm/mikro-orm/commit/1a1d381cfe30bd97a038109e7d2e5ea9ce660062)), closes [#3801](https://github.com/mikro-orm/mikro-orm/issues/3801)
* **query-build:** fix query execution inside hooks sometimes hanging ([dba6ce2](https://github.com/mikro-orm/mikro-orm/commit/dba6ce299341d4345243083313f129e8a3da43ac))
* **schema:** do not cache knex instance ([dc00374](https://github.com/mikro-orm/mikro-orm/commit/dc00374585a0ff3f7686a422143c5c128ddbb87f)), closes [#3713](https://github.com/mikro-orm/mikro-orm/issues/3713)
* **schema:** ensure database exists before dropping schema ([fd4c416](https://github.com/mikro-orm/mikro-orm/commit/fd4c416472ca5b25dd353f324e86fd9ce59521db)), closes [#3713](https://github.com/mikro-orm/mikro-orm/issues/3713)
* **ts:** allow string dates in `em.create()` ([d0607d5](https://github.com/mikro-orm/mikro-orm/commit/d0607d50899fc90c899f28941f5b41c0b3bc8ace))


### Features

* **cli:** added option to generate cache via ts-node ([#3796](https://github.com/mikro-orm/mikro-orm/issues/3796)) ([268bd68](https://github.com/mikro-orm/mikro-orm/commit/268bd681993edd5a8fd754658a96c26d5c970350)), closes [#3795](https://github.com/mikro-orm/mikro-orm/discussions/3795)
* **core:** add `em.upsertMany` ([#3825](https://github.com/mikro-orm/mikro-orm/issues/3825)) ([83ac12a](https://github.com/mikro-orm/mikro-orm/commit/83ac12a4d517b199a2efd364f61356cc6b08407a))
* **core:** add `serialize()` helper for explicit serialization ([#3728](https://github.com/mikro-orm/mikro-orm/issues/3728)) ([f22cd6f](https://github.com/mikro-orm/mikro-orm/commit/f22cd6f77c20c044b1ece0b988ea6055a917eece))
* **core:** allow creating entity from PK via `rel()` and `ref()` ([#3837](https://github.com/mikro-orm/mikro-orm/issues/3837)) ([72ca8e7](https://github.com/mikro-orm/mikro-orm/commit/72ca8e77cb3239e561d7ab187be0c149792a8c80)), closes [#3835](https://github.com/mikro-orm/mikro-orm/issues/3835)
* **core:** ensure database exists automatically ([#3830](https://github.com/mikro-orm/mikro-orm/issues/3830)) ([f92da01](https://github.com/mikro-orm/mikro-orm/commit/f92da01101fbb212dec5d8648a51068da7122ea8))
* **core:** introduce ORM extensions ([#3773](https://github.com/mikro-orm/mikro-orm/issues/3773)) ([0f36967](https://github.com/mikro-orm/mikro-orm/commit/0f36967d3c227465ea9c23aa8f290cd8fe383bad))


### Performance Improvements

* **core:** never clone Platform and EntityMetadata instances ([9e05104](https://github.com/mikro-orm/mikro-orm/commit/9e051043fafdbc415d7f6f1306261b351397a086)), closes [#3720](https://github.com/mikro-orm/mikro-orm/issues/3720)



## [5.5.3](https://github.com/mikro-orm/mikro-orm/compare/v5.5.2...v5.5.3) (2022-11-10)


### Bug Fixes

* **core:** respect filters when loading m:n relations ([#3716](https://github.com/mikro-orm/mikro-orm/issues/3716)) ([86a65a7](https://github.com/mikro-orm/mikro-orm/commit/86a65a77cbfb8909511cb3bf269517feb2921e06))
* **postgres:** fix ensuring database exists ([d23dde0](https://github.com/mikro-orm/mikro-orm/commit/d23dde098b691741f76b17176d97a057d22c4c8a)), closes [#3713](https://github.com/mikro-orm/mikro-orm/issues/3713)


### Features

* **mongo:** allow passing transaction options to the mongo client ([d52c747](https://github.com/mikro-orm/mikro-orm/commit/d52c747156b59f14f0b2883ac9615c5b1a85bea0)), closes [#3703](https://github.com/mikro-orm/mikro-orm/issues/3703)


### Performance Improvements

* **core:** redefine the internal `__helper` getter with a static value ([77d0549](https://github.com/mikro-orm/mikro-orm/commit/77d05495478705b8b5b15bbc6fbb9080361899ab))





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)


### Bug Fixes

* **core:** prefer custom pivot entity for inference of FK names ([08a7dc2](https://github.com/mikro-orm/mikro-orm/commit/08a7dc2ed8f64ede8217b6f46ff22c166c488d92)), closes [#3626](https://github.com/mikro-orm/mikro-orm/issues/3626)
* **knex:** always skip virtual properties in returning clause ([#3699](https://github.com/mikro-orm/mikro-orm/issues/3699)) ([c084dde](https://github.com/mikro-orm/mikro-orm/commit/c084dde32860485f6d63872effcaa76b2d35aed1))





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)


### Bug Fixes

* **core:** compare original entity data when checking for unique props ([53ff984](https://github.com/mikro-orm/mikro-orm/commit/53ff984723c905a0f7dc5d27b2941b663d9d41cc)), closes [#3644](https://github.com/mikro-orm/mikro-orm/issues/3644)
* **core:** fix `em.upsert()` when entity is already in context ([f590b79](https://github.com/mikro-orm/mikro-orm/commit/f590b796684cca88c055c8fd3234f3cb9ca85a10)), closes [#3667](https://github.com/mikro-orm/mikro-orm/issues/3667)
* **core:** fix comparing empty arrays ([be4cdf3](https://github.com/mikro-orm/mikro-orm/commit/be4cdf312f25a01df686f5137340726e92924a0e)), closes [#3694](https://github.com/mikro-orm/mikro-orm/issues/3694)
* **core:** fix orphan removal for collections of complex/nested composite keys ([925c1d2](https://github.com/mikro-orm/mikro-orm/commit/925c1d23ada128a8429223c14811d5357f43f2dc)), closes [#3666](https://github.com/mikro-orm/mikro-orm/issues/3666)
* **core:** fix querying for a complex composite key via inverse side ([b99e7bb](https://github.com/mikro-orm/mikro-orm/commit/b99e7bb4d6dd1c0657ea0ddf28fb0c3a1986e5b7)), closes [#3669](https://github.com/mikro-orm/mikro-orm/issues/3669)
* **core:** handle `$fulltext` search correctly in nested queries ([9a2f535](https://github.com/mikro-orm/mikro-orm/commit/9a2f5350df3101f67c5609aaf4bde0cc6cd17a61)), closes [#3696](https://github.com/mikro-orm/mikro-orm/issues/3696)
* **core:** improve detection of entity file path via stack trace ([d329d32](https://github.com/mikro-orm/mikro-orm/commit/d329d322f4264f5e97ddc658fdc4ce240f8c7526)), closes [#3668](https://github.com/mikro-orm/mikro-orm/issues/3668)
* **core:** improve propagation of changes to 1:1 relations ([389b4a2](https://github.com/mikro-orm/mikro-orm/commit/389b4a2a750a45ecb9806640613de016132d2dfa)), closes [#3614](https://github.com/mikro-orm/mikro-orm/issues/3614)
* **embeddables:** support partial loading hints ([0c33e00](https://github.com/mikro-orm/mikro-orm/commit/0c33e000082dc9f6c585648da3156825c38790cc)), closes [#3673](https://github.com/mikro-orm/mikro-orm/issues/3673)
* **knex:** ensure virtual properties are never part of `returning` clause ([35d51fe](https://github.com/mikro-orm/mikro-orm/commit/35d51fecff9479f3d704bfcffa90d4fd5dcaf21a)), closes [#3664](https://github.com/mikro-orm/mikro-orm/issues/3664)
* **postgres:** fix ensuring database exists when `postgres` database does not exist ([b1a867d](https://github.com/mikro-orm/mikro-orm/commit/b1a867d27697f0f2cf4d1a747c15d1773b8a0f86)), closes [#3671](https://github.com/mikro-orm/mikro-orm/issues/3671)
* **reflection:** fix reflection of embedded array types ([786ba42](https://github.com/mikro-orm/mikro-orm/commit/786ba4281b12ebe089394ec64b32653bfaae5013)), closes [#3690](https://github.com/mikro-orm/mikro-orm/issues/3690)
* **reflection:** improve detection of array properties ([8f8f820](https://github.com/mikro-orm/mikro-orm/commit/8f8f820ca6e60937e4da82825f9afba9087459ee)), closes [#3690](https://github.com/mikro-orm/mikro-orm/issues/3690)


### Features

* **core:** add `em.repo()` shortcut ([feebd7c](https://github.com/mikro-orm/mikro-orm/commit/feebd7c80096a0b497f025f4f909eccd0ae05e4c))
* **core:** add `EntityOptions.repository` shortcut ([2cbb129](https://github.com/mikro-orm/mikro-orm/commit/2cbb129f5efab59d607908c891b55cc5e03f8020))
* **core:** add `EntityRepository.upsert()` shortcut ([31d6d77](https://github.com/mikro-orm/mikro-orm/commit/31d6d77c65dcf9ad3bb782af59f3a919845e531c))
* **core:** add `ref` alias for `wrappedReference` relation property option ([249a407](https://github.com/mikro-orm/mikro-orm/commit/249a4074e3367213898ed8c6fd26cc874ae1d7cf))
* **core:** add `Rel<T>` and `Ref<T>` relation types ([44acefb](https://github.com/mikro-orm/mikro-orm/commit/44acefb6ca538788f2c8d89e43755571ad747cfd))
* **core:** add context param to `Type.convertToDatabaseValue()` ([a933e98](https://github.com/mikro-orm/mikro-orm/commit/a933e98e98f366014e1a5af2c1444aaf330a09a0)), closes [#3567](https://github.com/mikro-orm/mikro-orm/issues/3567)
* **core:** allow using second argument of `@OneToOne` as options ([115462d](https://github.com/mikro-orm/mikro-orm/commit/115462db343276fa3ae4ddcd68f8e27c2647b737))
* **core:** propagate parent entity to collection item payload in `assign` ([6045511](https://github.com/mikro-orm/mikro-orm/commit/6045511700321d953035ddab21ac98b96640358f)), closes [#3654](https://github.com/mikro-orm/mikro-orm/issues/3654)
* **core:** propagate parent entity to collection item payload in `create` ([bb9f8d9](https://github.com/mikro-orm/mikro-orm/commit/bb9f8d90ec695a941cc12382e43b3d5510be5fe0)), closes [#3654](https://github.com/mikro-orm/mikro-orm/issues/3654)
* **core:** support composite unique keys in `em.upsert()` ([3cf79d6](https://github.com/mikro-orm/mikro-orm/commit/3cf79d6e583fc8c10549af0237d4d77e3eaa404d)), closes [#3656](https://github.com/mikro-orm/mikro-orm/issues/3656)





## [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)


### Bug Fixes

* **cli:** fix using `npx --workspace` with `mikro-orm-esm` ([#3560](https://github.com/mikro-orm/mikro-orm/issues/3560)) ([64777af](https://github.com/mikro-orm/mikro-orm/commit/64777af47619435808dfe3aeb492cb97701d1b74))
* **cli:** improve success message of `schema:update/drop` commands ([11d0fd9](https://github.com/mikro-orm/mikro-orm/commit/11d0fd961b98db14517aae53d8d82756b0b54312))
* **core:** always compare boolean properties as booleans ([c30c680](https://github.com/mikro-orm/mikro-orm/commit/c30c68054268bce87a8ec55e39d392d1c153edfd)), closes [#3576](https://github.com/mikro-orm/mikro-orm/issues/3576)
* **core:** do not ignore `default` option in version properties ([1572008](https://github.com/mikro-orm/mikro-orm/commit/1572008ed78e645d303583a0b0820f913a711f52))
* **core:** do not ignore falsy version values like `0` ([754d672](https://github.com/mikro-orm/mikro-orm/commit/754d67271f2333e2dd9912c3c9f3aac53b4ed3d6))
* **core:** fix assigning objects to collections ([#3628](https://github.com/mikro-orm/mikro-orm/issues/3628)) ([82a9708](https://github.com/mikro-orm/mikro-orm/commit/82a9708090df7b9c9b07fa663b2e75e9b4ac2afe))
* **core:** fix changing 1:1 relations value ([7b6e6f7](https://github.com/mikro-orm/mikro-orm/commit/7b6e6f799fbf6a4915ffc5fbf873382f6d9baf8b)), closes [#3614](https://github.com/mikro-orm/mikro-orm/issues/3614)
* **core:** fix removing entities with complex composite keys ([6d6e9f4](https://github.com/mikro-orm/mikro-orm/commit/6d6e9f43d0f7ba6ef0e507ce08151d905e8470c4)), closes [#3543](https://github.com/mikro-orm/mikro-orm/issues/3543)
* **core:** fix validation of EM param in `assign` ([6572a59](https://github.com/mikro-orm/mikro-orm/commit/6572a5946dd2c85124d934b8bd4de33751fdd680)), closes [#3571](https://github.com/mikro-orm/mikro-orm/issues/3571)
* **core:** hydrate `mapToPk` properties with the PK value ([559ae28](https://github.com/mikro-orm/mikro-orm/commit/559ae2840ea023853a04ca507274d1cea68c1b5c))
* **core:** improve entity path detection with SWC 1.3.4+ ([#3568](https://github.com/mikro-orm/mikro-orm/issues/3568)) ([9a2cb8c](https://github.com/mikro-orm/mikro-orm/commit/9a2cb8c8446937e78c822c8c42f02dee726b775f))
* **core:** merge entity automatically via `em.create(E, {}, { managed: true })` ([24d206f](https://github.com/mikro-orm/mikro-orm/commit/24d206fab5d9c226273bb155e55bbfec83130f2d)), closes [#3571](https://github.com/mikro-orm/mikro-orm/issues/3571)
* **core:** propagate entity removal to collection properties ([25c1c06](https://github.com/mikro-orm/mikro-orm/commit/25c1c06c13c66cb5743c45a9f554d8977057c935))
* **core:** rework handling of orphan removal for 1:m collections ([925c798](https://github.com/mikro-orm/mikro-orm/commit/925c7989bbc2adf4b7fb2c0f41dff580046e86eb)), closes [#3564](https://github.com/mikro-orm/mikro-orm/issues/3564)
* **core:** serialize embedded JSON properties correctly when used in inline embeddable ([feef8b3](https://github.com/mikro-orm/mikro-orm/commit/feef8b3a0ef3aafb140becfb68bfa73f20b326e8)), closes [#3519](https://github.com/mikro-orm/mikro-orm/issues/3519)
* **mongo:** fix populating 1:1 owners from inverse side ([25ee03a](https://github.com/mikro-orm/mikro-orm/commit/25ee03a4da35949db5b6e63288133aac6411342c))
* **query-builder:** support top level `$not` operator in join condition ([#3609](https://github.com/mikro-orm/mikro-orm/issues/3609)) ([047504f](https://github.com/mikro-orm/mikro-orm/commit/047504f2404194ea969cca4f600005103c855e58))


### Features

* **core:** add `defineConfig` helper ([#3500](https://github.com/mikro-orm/mikro-orm/issues/3500)) ([67d3c68](https://github.com/mikro-orm/mikro-orm/commit/67d3c682bf11d8e9369e351da6e4ee20958b9581))
* **core:** add `em.refresh(entity)` method ([#3522](https://github.com/mikro-orm/mikro-orm/issues/3522)) ([dbe8aa4](https://github.com/mikro-orm/mikro-orm/commit/dbe8aa417abd1849fa9fe4ece72ca0760d3bbd4d))
* **core:** add `em.upsert()` method ([#3525](https://github.com/mikro-orm/mikro-orm/issues/3525)) ([3285cdb](https://github.com/mikro-orm/mikro-orm/commit/3285cdb6a615420bb7e079e17f945007e0b07a46)), closes [#3515](https://github.com/mikro-orm/mikro-orm/issues/3515)
* **core:** add `MikroORM` and `Options` exports to each driver package ([#3499](https://github.com/mikro-orm/mikro-orm/issues/3499)) ([b68ed47](https://github.com/mikro-orm/mikro-orm/commit/b68ed47acac2da8b845ec33d6f30692b88c04acd))
* **core:** add the `offset` into `FindOneOptions` ([#3574](https://github.com/mikro-orm/mikro-orm/issues/3574)) ([9d5d457](https://github.com/mikro-orm/mikro-orm/commit/9d5d457e4bcf67b03c4c0982b838163b382bf3b8))
* **core:** automatically detect `src/dist/build` folders and adjust configuration ([#3497](https://github.com/mikro-orm/mikro-orm/issues/3497)) ([a8c8baf](https://github.com/mikro-orm/mikro-orm/commit/a8c8baf558267a1c2440adad4ec756fb19559241))
* **core:** enable `persistOnCreate` by default ([8424976](https://github.com/mikro-orm/mikro-orm/commit/8424976b512b1e9aee010ce623545947fbdc229a))
* **core:** maintain identity for the `Reference` wrapper ([da1a0ef](https://github.com/mikro-orm/mikro-orm/commit/da1a0effcc35d0a6613f9ca4455717b22927e192)), closes [#3582](https://github.com/mikro-orm/mikro-orm/issues/3582)
* **core:** provide `meta` and `prop` on custom mapped type instance ([c1251d0](https://github.com/mikro-orm/mikro-orm/commit/c1251d0e64fad974cfb9c83c01c5d288faf2cbd5)), closes [#3538](https://github.com/mikro-orm/mikro-orm/issues/3538)
* **core:** track changes on entity references ([#3521](https://github.com/mikro-orm/mikro-orm/issues/3521)) ([0fb17bb](https://github.com/mikro-orm/mikro-orm/commit/0fb17bbb4ff3af3eac3edd89e549fe1673b20448))
* **core:** validate missing items in enum definition ([659c2de](https://github.com/mikro-orm/mikro-orm/commit/659c2dec3209f6ed4eaef05ccf244bbc87a4a54e))
* **core:** validate missing types in `EntitySchema` definition ([0716566](https://github.com/mikro-orm/mikro-orm/commit/0716566788eb231c78b5ed5bd04f8e007d860e88)), closes [#3603](https://github.com/mikro-orm/mikro-orm/issues/3603)
* **migrations:** allow configuring snapshot name ([4bbe355](https://github.com/mikro-orm/mikro-orm/commit/4bbe355a56a53eba285470eab178087b8ba9487d)), closes [#3562](https://github.com/mikro-orm/mikro-orm/issues/3562)
* **mongo:** do not expand array queries to `$in` operator when nested inside `$eq` ([e25d28e](https://github.com/mikro-orm/mikro-orm/commit/e25d28e7c12a655d2373e14fd74e9cc68c2b1c5d))
* **postgres:** add `qb.distinctOn()` support ([307d3a1](https://github.com/mikro-orm/mikro-orm/commit/307d3a1dae1ababbb47595fe70b0888de3b9a557))
* **query-builder:** validate modification of finalized QB ([b23f015](https://github.com/mikro-orm/mikro-orm/commit/b23f01526a9287dd07f9eb42e1b68e41cf568f40)), closes [#3534](https://github.com/mikro-orm/mikro-orm/issues/3534)
* **schema:** add ability to ignore specific column changes ([#3503](https://github.com/mikro-orm/mikro-orm/issues/3503)) ([05fb1ce](https://github.com/mikro-orm/mikro-orm/commit/05fb1ce56fd53a5263967d600027f077ae2e10ea)), closes [#1904](https://github.com/mikro-orm/mikro-orm/issues/1904) [#1904](https://github.com/mikro-orm/mikro-orm/issues/1904)
* **schema:** try to infer runtime default values automatically ([#3529](https://github.com/mikro-orm/mikro-orm/issues/3529)) ([d035781](https://github.com/mikro-orm/mikro-orm/commit/d035781bc64f935d09b82660f67604e986df1c53))
* **sqlite:** enable returning statements in both SQLite drivers ([eaf83c8](https://github.com/mikro-orm/mikro-orm/commit/eaf83c83d8f102f3da62e134959fac2afc3671f1))


### Performance Improvements

* **core:** don't propagate serialization context to hidden relations ([#3592](https://github.com/mikro-orm/mikro-orm/issues/3592)) ([e706ba2](https://github.com/mikro-orm/mikro-orm/commit/e706ba276159a547dcfa855801ea7e46abf13212))
* **core:** improve support for large collections ([#3573](https://github.com/mikro-orm/mikro-orm/issues/3573)) ([ea3f6fd](https://github.com/mikro-orm/mikro-orm/commit/ea3f6fd5db55d9959d70afde77c1873f0a453323))
* **schema:** improve schema inspection speed in SQL drivers ([#3549](https://github.com/mikro-orm/mikro-orm/issues/3549)) ([74dc3b1](https://github.com/mikro-orm/mikro-orm/commit/74dc3b1aba07666911fb6fc74b55f6547b2c5b4b))





## [5.4.2](https://github.com/mikro-orm/mikro-orm/compare/v5.4.1...v5.4.2) (2022-09-12)


### Bug Fixes

* **core:** do not double serialize nested JSON properties in embedded arrays ([11112c6](https://github.com/mikro-orm/mikro-orm/commit/11112c6662925fc88e88699273bf0653aa6b627a)), closes [#3327](https://github.com/mikro-orm/mikro-orm/issues/3327)
* **core:** fix dynamic loading of entities with default export ([14f88cc](https://github.com/mikro-orm/mikro-orm/commit/14f88ccbe1da7666c203ff26d54818fce0689dc9)), closes [#3491](https://github.com/mikro-orm/mikro-orm/issues/3491)
* **core:** fix extracting entity reference for constructor params in `em.create()` ([797cc3a](https://github.com/mikro-orm/mikro-orm/commit/797cc3add4aec590a5ff03b7e042af008a0788ba))
* **core:** fix populating of self referencing relationships ([e3c835a](https://github.com/mikro-orm/mikro-orm/commit/e3c835a67a39f5bc085733b131be0729bc73903c)), closes [#3490](https://github.com/mikro-orm/mikro-orm/issues/3490)
* **core:** fix serialization of virtual entities ([a15fc13](https://github.com/mikro-orm/mikro-orm/commit/a15fc1355bc2dbb131fc12f4eec01db544d323a4)), closes [#3493](https://github.com/mikro-orm/mikro-orm/issues/3493)
* **core:** ignore `*` populate hints inferred from `fields` ([c11bda6](https://github.com/mikro-orm/mikro-orm/commit/c11bda61e1ac7114fa351b5e711aa24558f3c136))
* **core:** omit internal symbols from logged entities ([29c430c](https://github.com/mikro-orm/mikro-orm/commit/29c430c3f158af22d897caa32ae3e12bf1426edd))
* **core:** respect serialization flags on embedded properties ([8e9f6d9](https://github.com/mikro-orm/mikro-orm/commit/8e9f6d9820bb5d48b715862b920d9735659839c4)), closes [#3429](https://github.com/mikro-orm/mikro-orm/issues/3429)


### Features

* **cli:** add `mikro-orm-esm` CLI script with registered ts-node/esm loader ([443f0c8](https://github.com/mikro-orm/mikro-orm/commit/443f0c81f1a882cbba944522eb77d10c946f5e4b)), closes [#3485](https://github.com/mikro-orm/mikro-orm/issues/3485)
* **entity-generator:** generate `OptionalProps` symbols ([#3482](https://github.com/mikro-orm/mikro-orm/issues/3482)) ([6ba3d40](https://github.com/mikro-orm/mikro-orm/commit/6ba3d4004deef00b754a4ca2011cf64e44a4a3a3))
* **knex:** allow changing `FROM` clause using `QueryBuilder` ([#3378](https://github.com/mikro-orm/mikro-orm/issues/3378)) ([df7d939](https://github.com/mikro-orm/mikro-orm/commit/df7d939f5cc28716dc556074563c8b56d32fb371))





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **cli:** only use dynamic imports for ESM projects ([b3e43d0](https://github.com/mikro-orm/mikro-orm/commit/b3e43d0fd98c090a47059597b719924260573e3b)), closes [#3442](https://github.com/mikro-orm/mikro-orm/issues/3442)
* **core:** add missing `MIKRO_ORM_SCHEMA` env var ([#3464](https://github.com/mikro-orm/mikro-orm/issues/3464)) ([47fccac](https://github.com/mikro-orm/mikro-orm/commit/47fccacfbeab319d60d0ef7b53b9d7694d1e7d0f))
* **core:** allow symbol as propertyKey in `@UseRequestContext` decorator ([#3444](https://github.com/mikro-orm/mikro-orm/issues/3444)) ([6a60295](https://github.com/mikro-orm/mikro-orm/commit/6a60295235dfcf417d1b3381c1570ae4d47c7d97))
* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)
* **core:** support partial loading of inlined embeddables ([9654e6e](https://github.com/mikro-orm/mikro-orm/commit/9654e6e9685afb686eacda9ea84916e9ca0962c5)), closes [#3365](https://github.com/mikro-orm/mikro-orm/issues/3365)
* **migrations:** replace backslash in the `glob` to fix windows support ([9e2b549](https://github.com/mikro-orm/mikro-orm/commit/9e2b549f071b112df0fb473ac194ef5118e99496)), closes [#2243](https://github.com/mikro-orm/mikro-orm/issues/2243)
* **postgres:** fix inserting values with `?` into `FullTextType` properties ([5095ddb](https://github.com/mikro-orm/mikro-orm/commit/5095ddb2a95cf4183e08a6a9f509ca442783136e)), closes [#3457](https://github.com/mikro-orm/mikro-orm/issues/3457)
* **postgres:** fix parsing enum definition when one of the items has comma ([c8062cb](https://github.com/mikro-orm/mikro-orm/commit/c8062cb11d80161d8a2db4a3dfec09e199a99f5f)), closes [#3460](https://github.com/mikro-orm/mikro-orm/issues/3460)
* **reflection:** fix inference of nullability ([5f57ee1](https://github.com/mikro-orm/mikro-orm/commit/5f57ee1c8b15940d208c0d3b84955561b38f9889)), closes [#3447](https://github.com/mikro-orm/mikro-orm/issues/3447)


### Features

* **core:** allow custom ORM prop name in `@UseRequestContext()` ([#3475](https://github.com/mikro-orm/mikro-orm/issues/3475)) ([d87219e](https://github.com/mikro-orm/mikro-orm/commit/d87219e04a359cafa2223e8e1f6bdb2ee2cfff72))





## [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

* **cli:** allow working with mongo migrations via CLI ([14a07df](https://github.com/mikro-orm/mikro-orm/commit/14a07df05a3431ca8a81d8ddca30214533af6a25))
* **core:** allow embedded properties inside virtual entities ([541d62d](https://github.com/mikro-orm/mikro-orm/commit/541d62d45f297790cbbf911e7b9d6a18a3950ef5))
* **core:** allow using `$ne` operator on embedded properties ([89706b6](https://github.com/mikro-orm/mikro-orm/commit/89706b66ea6c8fb96768814a50987fc46bb5681d)), closes [#3430](https://github.com/mikro-orm/mikro-orm/issues/3430)
* **core:** always use dynamic import, don't depend on `MIKRO_ORM_DYNAMIC_IMPORTS` ([ba7eac6](https://github.com/mikro-orm/mikro-orm/commit/ba7eac6c7a60c2b70a02e7dedeaa0e0b76c6fe78))
* **core:** compile with `module: 'Node16'` to have real dynamic imports ([#3439](https://github.com/mikro-orm/mikro-orm/issues/3439)) ([50347ef](https://github.com/mikro-orm/mikro-orm/commit/50347efd909dafd0bceae09dc35019010cab8329))
* **core:** fix optimistic locking for entities with custom type on PK ([e36bac5](https://github.com/mikro-orm/mikro-orm/commit/e36bac52969b6ee329c8c0c46e43be1132235848)), closes [#3440](https://github.com/mikro-orm/mikro-orm/issues/3440)
* **core:** lock entities in `flush()` to get around race conditions with `Promise.all` ([b62799a](https://github.com/mikro-orm/mikro-orm/commit/b62799a2ee4e0b1dc57207c4fe2700a70e3eb0dc)), closes [#2934](https://github.com/mikro-orm/mikro-orm/issues/2934) [#3383](https://github.com/mikro-orm/mikro-orm/issues/3383)
* **core:** respect serialization options like `hidden` on embeddables ([d198e44](https://github.com/mikro-orm/mikro-orm/commit/d198e44a243bda8dec3d58e9f21d8194570a67d6)), closes [#3429](https://github.com/mikro-orm/mikro-orm/issues/3429)
* **core:** support result caching on virtual entities ([ce2b051](https://github.com/mikro-orm/mikro-orm/commit/ce2b05123ee7b27a6f9d3a3ee7706b0df36cf06a))
* **core:** update to TypeScript 4.8 and improve `EntityDTO` type ([#3389](https://github.com/mikro-orm/mikro-orm/issues/3389)) ([f2957fb](https://github.com/mikro-orm/mikro-orm/commit/f2957fb14141294cfdffebf6cce6eaa937538cfb))
* **core:** use acorn instead of escaya for extraction of method params ([c5c09c5](https://github.com/mikro-orm/mikro-orm/commit/c5c09c57016158d6e7f09410d2ab67adbadbd0ce))
* **knex:** support `em.count()` on virtual entities ([5bb4ebe](https://github.com/mikro-orm/mikro-orm/commit/5bb4ebedfcb5df4d2e27dce66bcdc644e6d7d611))
* **postgres:** fix escaping of special chars in string arrays ([#3405](https://github.com/mikro-orm/mikro-orm/issues/3405)) ([cd7c42f](https://github.com/mikro-orm/mikro-orm/commit/cd7c42f242c5c957e5e81e406881ddcc0a17e5d0))
* **query-builder:** allow using alias for delete queries ([aa19a85](https://github.com/mikro-orm/mikro-orm/commit/aa19a8561cff5e4765c060e86d860635458b2ed5)), closes [#3366](https://github.com/mikro-orm/mikro-orm/issues/3366)
* **query-builder:** support more operators in join conditions ([#3399](https://github.com/mikro-orm/mikro-orm/issues/3399)) ([af885c8](https://github.com/mikro-orm/mikro-orm/commit/af885c8884dc10dcc1ee61bc3eeb0a9922708e52))
* **reflection:** do not override user defined `nullable` attribute ([75a6487](https://github.com/mikro-orm/mikro-orm/commit/75a6487cc45eefd5ca7e4bd530b0522222e632ee))
* **reflection:** fix array property type inference ([4a69871](https://github.com/mikro-orm/mikro-orm/commit/4a6987127c3fd487d9b4c4b1db597fac17a41fd8))


### Features

* **core:** add `MikroORM.reconnect()` method ([53b836e](https://github.com/mikro-orm/mikro-orm/commit/53b836e75b21b42935f0ced9dfa30d350b1a5b71))
* **core:** add `schema/migrator/seeder` shortcuts to `MikroORM` class ([95c8dd5](https://github.com/mikro-orm/mikro-orm/commit/95c8dd5ca4f795c7be5950c4ce02b0cf725a49ff))
* **entity-generator:** add import extension for referenced entities ([#3420](https://github.com/mikro-orm/mikro-orm/issues/3420)) ([f80809a](https://github.com/mikro-orm/mikro-orm/commit/f80809a7bade25f30c8ae1aff3aa85d04249d853))
* **knex:** add options params to `create` + `assign` methods within EntityRepository ([#3431](https://github.com/mikro-orm/mikro-orm/issues/3431)) ([cf7e9e1](https://github.com/mikro-orm/mikro-orm/commit/cf7e9e15bb29c762844b6167c54cb1200f9e4f9e))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)


### Bug Fixes

* **core:** copy orphan removal stack to forks when `clear: false` ([ab72144](https://github.com/mikro-orm/mikro-orm/commit/ab721442ad089bafd518bc442d04269a0717c44c)), closes [#3360](https://github.com/mikro-orm/mikro-orm/issues/3360)
* **core:** improve check for global context usage ([6c906bf](https://github.com/mikro-orm/mikro-orm/commit/6c906bf3e66efdbb849c860ca31f0523c5cd61b8)), closes [#3361](https://github.com/mikro-orm/mikro-orm/issues/3361)
* **core:** improve cycle detection when serializing (mainly via `toPOJO`) ([aa10802](https://github.com/mikro-orm/mikro-orm/commit/aa10802e53e0d6500a02230b01292de08f9fb9bc)), closes [#3354](https://github.com/mikro-orm/mikro-orm/issues/3354)
* **core:** respect `contextName` in `TransactionContext` ([b2b6a7d](https://github.com/mikro-orm/mikro-orm/commit/b2b6a7d468431ff0a661fb081086f64cb70eac31)), closes [#3362](https://github.com/mikro-orm/mikro-orm/issues/3362)





## [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Bug Fixes

* **core:** do not trigger auto flush from inside flush hooks ([e3f34aa](https://github.com/mikro-orm/mikro-orm/commit/e3f34aa52f7d76f12e51065f589f03454fba48f4)), closes [#3345](https://github.com/mikro-orm/mikro-orm/issues/3345)
* **entity-generator:** ensure stable order of generated entities ([06e0e05](https://github.com/mikro-orm/mikro-orm/commit/06e0e05bf91d111a231a5d135add496928468498))
* **postgres:** fix having non-PK serial column next to a non-serial PK ([6c589b0](https://github.com/mikro-orm/mikro-orm/commit/6c589b0c534b8fa5994363f5ed718b9be8840e8d)), closes [#3350](https://github.com/mikro-orm/mikro-orm/issues/3350)
* **query-builder:** fix `qb.insert()/update()` on embeddables in inline mode ([#3340](https://github.com/mikro-orm/mikro-orm/issues/3340)) ([e611fa0](https://github.com/mikro-orm/mikro-orm/commit/e611fa060f392f60f239d53788d24b1ca7c36d7c))
* **schema:** ensure stable order queries ([e56a259](https://github.com/mikro-orm/mikro-orm/commit/e56a259e5d7e2c29858a2c1568d7b901a923867a)), closes [#3330](https://github.com/mikro-orm/mikro-orm/issues/3330)
* **schema:** respect explicit `columnType` when comparing columns ([f0a20fa](https://github.com/mikro-orm/mikro-orm/commit/f0a20fafa1425ca20f4f6fb2977eae7773d6ac6a)), closes [#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)
* **schema:** respect schema when renaming columns in postgres ([#3344](https://github.com/mikro-orm/mikro-orm/issues/3344)) ([f905336](https://github.com/mikro-orm/mikro-orm/commit/f9053368c0c3b2c771f1a3a273a19a4b8d374556))
* **sqlite:** throw `ForeignKeyConstraintViolationException` where appropriate ([#3343](https://github.com/mikro-orm/mikro-orm/issues/3343)) ([508e262](https://github.com/mikro-orm/mikro-orm/commit/508e262abcb5302cb6831d3fab6920798a4f5477))


### Features

* add support for full text searches ([#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)) ([8b8f140](https://github.com/mikro-orm/mikro-orm/commit/8b8f14071b92e91161a32aa272315a0ecce1bc0b))
* **core:** add `$exists` mongodb operator with SQL fallback to `is not null` ([112f2be](https://github.com/mikro-orm/mikro-orm/commit/112f2be85fabefc8e9562962945d3bd13b64025e)), closes [#3295](https://github.com/mikro-orm/mikro-orm/issues/3295)
* **core:** add `disableContextResolution` option to `em.fork()` ([94442f9](https://github.com/mikro-orm/mikro-orm/commit/94442f9a96d8a71f68d447f9e2018dd4bb84da4b)), closes [#3338](https://github.com/mikro-orm/mikro-orm/issues/3338)
* **core:** add support for virtual entities ([#3351](https://github.com/mikro-orm/mikro-orm/issues/3351)) ([dcd62ac](https://github.com/mikro-orm/mikro-orm/commit/dcd62ac1155e20e7e58d7de4c5fe1a22a422e201))
* **core:** add validation when using non-discovered entities in `em.populate()` ([ab93106](https://github.com/mikro-orm/mikro-orm/commit/ab93106fd104be3ae12efb7c2fa680ad6f348d27))
* **core:** improve autocomplete for `columnType` ([6bf616d](https://github.com/mikro-orm/mikro-orm/commit/6bf616dd824bbd61831e74a901af29ff91eae61d))
* **core:** improve autocomplete for `type`, `onUpdateIntegrity` and `onDelete` ([7ee2dcb](https://github.com/mikro-orm/mikro-orm/commit/7ee2dcb500db3fa22dac83e38831920056fa6ff4))
* **entity-generator:** allow defining entities with `EntitySchema` instead of decorators ([b423c10](https://github.com/mikro-orm/mikro-orm/commit/b423c104d942bfdb4a875a64c52f98ec85899c6c))
* **mongo:** add support for migrations in mongo driver ([#3347](https://github.com/mikro-orm/mikro-orm/issues/3347)) ([c5c6115](https://github.com/mikro-orm/mikro-orm/commit/c5c61152e0ad1b98fe9b00875ce0da9039b34d4a))
* **mongo:** allow reusing mongo client via `driverOptions` ([df59ebf](https://github.com/mikro-orm/mikro-orm/commit/df59ebf6cc46121a81c008a0d174b1dff7256997)), closes [#3352](https://github.com/mikro-orm/mikro-orm/issues/3352)





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)


### Bug Fixes

* **core:** do not allow passing `null` to required properties in `em.create()` ([e7843fb](https://github.com/mikro-orm/mikro-orm/commit/e7843fbe2f02ee8922d99a2f0209e4e261898a66)), closes [#3289](https://github.com/mikro-orm/mikro-orm/issues/3289)
* **core:** do not run `onUpdate` before we know something changed ([6faa367](https://github.com/mikro-orm/mikro-orm/commit/6faa3673266abd2f6fec5620e4e3e9e32e223ffc)), closes [#3328](https://github.com/mikro-orm/mikro-orm/issues/3328)
* **core:** ensure m:n collection is not dirty after hydration ([66e0a21](https://github.com/mikro-orm/mikro-orm/commit/66e0a21bb12a716afd2b0ba700ff7df14a5f0dc0)), closes [#3323](https://github.com/mikro-orm/mikro-orm/issues/3323) [#3287](https://github.com/mikro-orm/mikro-orm/issues/3287)
* **core:** hidden properties are included in cache ([#3300](https://github.com/mikro-orm/mikro-orm/issues/3300)) ([f0bc261](https://github.com/mikro-orm/mikro-orm/commit/f0bc2610ee5b041fee9fc85e6cc5101169629298))
* **core:** respect schema when lazy loading reference via `init` ([c876c9f](https://github.com/mikro-orm/mikro-orm/commit/c876c9f6b2c970530a8890fa14397c423d602c81)), closes [#3318](https://github.com/mikro-orm/mikro-orm/issues/3318)
* **knex:** fix $or over 1:m and m:1 auto-joined relations ([#3307](https://github.com/mikro-orm/mikro-orm/issues/3307)) ([b6f12b2](https://github.com/mikro-orm/mikro-orm/commit/b6f12b21d04d5974e6fd082b4d9984c80129b9cc))


### Features

* **knex:** allow partial loading of 1:1 owner property from inverse side ([d642018](https://github.com/mikro-orm/mikro-orm/commit/d64201835362a42768562891663c3dda1745bda0)), closes [#3324](https://github.com/mikro-orm/mikro-orm/issues/3324)





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)


### Bug Fixes

* **core:** ensure M:N collections are not dirty after populating of inverse side ([21ba9b2](https://github.com/mikro-orm/mikro-orm/commit/21ba9b212473a9347b2bd38a048710a9628c05ee)), closes [#3287](https://github.com/mikro-orm/mikro-orm/issues/3287)
* **mariadb:** backport some fixes from the mysql driver ([9a57386](https://github.com/mikro-orm/mikro-orm/commit/9a57386af03a268302b88aa70b20038911bd0cc3))
* **mariadb:** fix inference of nullable columns when generating entities ([4bd606a](https://github.com/mikro-orm/mikro-orm/commit/4bd606ace99cfa5c2216aac5880128bb736dd199)), closes [#3285](https://github.com/mikro-orm/mikro-orm/issues/3285)
* **mongo:** fix wrog filter of entity name ([#3276](https://github.com/mikro-orm/mikro-orm/issues/3276)) ([da20e1f](https://github.com/mikro-orm/mikro-orm/commit/da20e1f74329f6fe6913e4a483bde7e71bfec17b))





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)


### Bug Fixes

* **core:** consider two `NaN` as equal when computing changesets ([#3250](https://github.com/mikro-orm/mikro-orm/issues/3250)) ([95116a0](https://github.com/mikro-orm/mikro-orm/commit/95116a05bb142ed90f5b572e109d6740900c5cf1))
* **core:** ensure correct context usage in all `EntityManager` public methods ([cc6d59b](https://github.com/mikro-orm/mikro-orm/commit/cc6d59b9a96fbfd4106e37c21814ded84b56588a)), closes [#3271](https://github.com/mikro-orm/mikro-orm/issues/3271)
* **core:** ensure FK as PK is not marked as initialized too early ([f12f92f](https://github.com/mikro-orm/mikro-orm/commit/f12f92f185eb78fc1471c5ec1411cd2bf5d11308)), closes [#3269](https://github.com/mikro-orm/mikro-orm/issues/3269)
* **core:** fix populating of 1:m collections between wildcard schema entities ([69c06aa](https://github.com/mikro-orm/mikro-orm/commit/69c06aa5b3ac553bb6c1438a7143d56d18fcf894)), closes [#3270](https://github.com/mikro-orm/mikro-orm/issues/3270)
* **core:** fix populating of relations in `afterFlush` hook ([26ab686](https://github.com/mikro-orm/mikro-orm/commit/26ab6861ba0c0b64563c69d91f85e17776a58e71)), closes [#3005](https://github.com/mikro-orm/mikro-orm/issues/3005)
* **core:** fix querying JSON properties with operators directly ([077ca62](https://github.com/mikro-orm/mikro-orm/commit/077ca623e6d8f0faff8e6af9ea468cf9b525d61a)), closes [#3246](https://github.com/mikro-orm/mikro-orm/issues/3246)
* **mongo:** persist explicit `null` value on object embeddable as `null` ([1c56e7a](https://github.com/mikro-orm/mikro-orm/commit/1c56e7ab1b2d5325588b444998ffa53adce6f699)), closes [#3258](https://github.com/mikro-orm/mikro-orm/issues/3258)
* **mongo:** retry only 3 times if ensuring indexes fails ([#3272](https://github.com/mikro-orm/mikro-orm/issues/3272)) ([299a028](https://github.com/mikro-orm/mikro-orm/commit/299a028739879d87e5b16a497d3333780502a112))
* **seeder:** fs-extra dep ([#3268](https://github.com/mikro-orm/mikro-orm/issues/3268)) ([972e5ba](https://github.com/mikro-orm/mikro-orm/commit/972e5bac8d679303422a07a19b07a352529c4ff6))
* **sql:** fix prefixing of JSON queries nested on relations ([847ff46](https://github.com/mikro-orm/mikro-orm/commit/847ff468f48dbb99e06ffe713e5d66a461e524b2)), closes [#3242](https://github.com/mikro-orm/mikro-orm/issues/3242)


### Features

* **core:** propagate add operation to m:n owner even if not initialized ([#3273](https://github.com/mikro-orm/mikro-orm/issues/3273)) ([dc9255c](https://github.com/mikro-orm/mikro-orm/commit/dc9255cb4c26291c7e33a7c38da0475fb20f3832))





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)


### Bug Fixes

* **core:** fix reloading version values with custom types on PKs ([ebd7888](https://github.com/mikro-orm/mikro-orm/commit/ebd78882cc910f3cd965ec2299a8b67958d36747)), closes [#3209](https://github.com/mikro-orm/mikro-orm/issues/3209)
* **core:** fix serialization of entities wrapped in POJOs ([af4fadf](https://github.com/mikro-orm/mikro-orm/commit/af4fadffe9fb78341e45c016836be0824aaaac8d)), closes [#3221](https://github.com/mikro-orm/mikro-orm/issues/3221)
* **core:** ignore `undefined` values during options merge ([9e0f559](https://github.com/mikro-orm/mikro-orm/commit/9e0f559c3c265540e89ca6eeafe5a3b836c01fba)), closes [#3234](https://github.com/mikro-orm/mikro-orm/issues/3234)
* **core:** prefer current schema for loading wild card pivot table entities ([f40cafa](https://github.com/mikro-orm/mikro-orm/commit/f40cafa6ec81263ccbd94b9367bff7662333e67c)), closes [#3177](https://github.com/mikro-orm/mikro-orm/issues/3177)
* **mongo:** recreate indexes when they differ ([60fc7f6](https://github.com/mikro-orm/mikro-orm/commit/60fc7f65b52a503abb3ccf7d99766ca4d4ba820c)), closes [#3118](https://github.com/mikro-orm/mikro-orm/issues/3118)
* **mongo:** use `$unset` when property value is `undefined` ([f059811](https://github.com/mikro-orm/mikro-orm/commit/f05981135d984b73b5f8144758ab7055c533d3cc)), closes [#3233](https://github.com/mikro-orm/mikro-orm/issues/3233)
* **mysql:** handle mediumint PKs correctly ([0bbbe5c](https://github.com/mikro-orm/mikro-orm/commit/0bbbe5c7827875a88a199b94add9ae81776dce42)), closes [#3230](https://github.com/mikro-orm/mikro-orm/issues/3230)
* **types:** fix inference of optional PKs ([424e0bb](https://github.com/mikro-orm/mikro-orm/commit/424e0bb5c50248ac2d45da55dd1a451663944d31)), closes [#3230](https://github.com/mikro-orm/mikro-orm/issues/3230)


### Features

* **core:** allow to adjust default type mapping ([ca8ce57](https://github.com/mikro-orm/mikro-orm/commit/ca8ce5721f0d547ceec1cf645443b6ae00deaf09)), closes [#3066](https://github.com/mikro-orm/mikro-orm/issues/3066)


### Performance Improvements

* **core:** allow disabling change tracking on property level ([7d5e32d](https://github.com/mikro-orm/mikro-orm/commit/7d5e32d8eb7ec25ace2336e1bd4da5d97d015c08)), closes [#3019](https://github.com/mikro-orm/mikro-orm/issues/3019)
* **core:** make `Collection.add` on not managed entities much faster ([75adda9](https://github.com/mikro-orm/mikro-orm/commit/75adda9b9a714b7918ec76fb7d5cd50f084cd6ba)), closes [#3211](https://github.com/mikro-orm/mikro-orm/issues/3211)





## [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* **core:** allow changing PK via UoW ([32ab215](https://github.com/mikro-orm/mikro-orm/commit/32ab21583d2718ab874ff71b3f13c9e6a9e5faf0)), closes [#3184](https://github.com/mikro-orm/mikro-orm/issues/3184)
* **core:** ensure correct cached value in `loadCount` ([4471bb8](https://github.com/mikro-orm/mikro-orm/commit/4471bb8b59151e8e450ab8f557a5337862aa88fc))
* **query-builder:** fix calling `qb.count('id', true).getCount()` ([a97324a](https://github.com/mikro-orm/mikro-orm/commit/a97324a2b85dd8463f300004bee82b906a68251d)), closes [#3182](https://github.com/mikro-orm/mikro-orm/issues/3182)
* **query-builder:** fix processing of custom types in explicitly aliased queries ([db137a6](https://github.com/mikro-orm/mikro-orm/commit/db137a6cdbe182363d0e4a743b8b8f915e324b09)), closes [#3172](https://github.com/mikro-orm/mikro-orm/issues/3172)
* **schema:** do not consider autoincrement columns as primary automatically ([088afdb](https://github.com/mikro-orm/mikro-orm/commit/088afdb96ef8fd20a3868c050bb749a4e825fd19)), closes [#3187](https://github.com/mikro-orm/mikro-orm/issues/3187)
* **ts-morph:** use module: 'node16' for reflection ([024d9d9](https://github.com/mikro-orm/mikro-orm/commit/024d9d997728b91c7530280ccf4f49bf154a4330)), closes [#3168](https://github.com/mikro-orm/mikro-orm/issues/3168)
* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))


### Features

* **core:** automatically discover target embeddables and relationships ([#3190](https://github.com/mikro-orm/mikro-orm/issues/3190)) ([8624dc5](https://github.com/mikro-orm/mikro-orm/commit/8624dc5228e63cdadf38a13ee29a554d844ef4ac))
* **entity-generator:** allow generating bidirectional relations ([8b93400](https://github.com/mikro-orm/mikro-orm/commit/8b93400f2bc3569375d7316cf5b995fc1c6821c6)), closes [#3181](https://github.com/mikro-orm/mikro-orm/issues/3181)
* **entity-generator:** allow generating identified references ([1fbf5ac](https://github.com/mikro-orm/mikro-orm/commit/1fbf5ac1ab2334c7e7ccbe190ded411a9490431c))
* **knex:** allow reusing existing knex client via `driverOptions` ([c169eda](https://github.com/mikro-orm/mikro-orm/commit/c169eda1907f3af217ed77fecce8df1f20c45872)), closes [#3167](https://github.com/mikro-orm/mikro-orm/issues/3167)
* **schema:** add logging to schema comparator ([f96eaaf](https://github.com/mikro-orm/mikro-orm/commit/f96eaaf52a02c14e5413cbd25267a272bfeee92f))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)


### Bug Fixes

* **cli:** disable TS mode when we fail to register ts-node ([457d9d3](https://github.com/mikro-orm/mikro-orm/commit/457d9d32d78ed34b254aae3b2b2f29b382e7175e)), closes [#3152](https://github.com/mikro-orm/mikro-orm/issues/3152)
* **core:** assign new embeddable entity only when it is null or undefined ([#3135](https://github.com/mikro-orm/mikro-orm/issues/3135)) ([4f870fb](https://github.com/mikro-orm/mikro-orm/commit/4f870fb4a650ad7a00524424494ea31cd484af60))
* **core:** support TypeScript 4.7 ([06b6e4e](https://github.com/mikro-orm/mikro-orm/commit/06b6e4ead56ce8a8429e707492a1e190291d7f2c))
* **query-builder:** fix aliasing of relations with composite PK ([095e241](https://github.com/mikro-orm/mikro-orm/commit/095e2416026b926edd07da2eb694b31101e873c3)), closes [#3053](https://github.com/mikro-orm/mikro-orm/issues/3053)


### Performance Improvements

* **query-builder:** use distinct counts only when joining to-many relations ([eebe34d](https://github.com/mikro-orm/mikro-orm/commit/eebe34d8a11725c35b9e857f1ff4a1967cc6c1f8)), closes [#3044](https://github.com/mikro-orm/mikro-orm/issues/3044)





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)


### Bug Fixes

* **core:** allow asterisk in `FindOptions.fields` on TS level ([43e1d0b](https://github.com/mikro-orm/mikro-orm/commit/43e1d0b765e3c6346340e6c734af7826d3ab3486)), closes [#3127](https://github.com/mikro-orm/mikro-orm/issues/3127)
* **core:** fix aliasing of formula properties in complex conditions ([#3130](https://github.com/mikro-orm/mikro-orm/issues/3130)) ([071846e](https://github.com/mikro-orm/mikro-orm/commit/071846ee77ae453a3e26a244ea8c2f0966ab6942))
* **core:** improve type of `em.getContext()` ([158f077](https://github.com/mikro-orm/mikro-orm/commit/158f077d1d0fbe4fd0edcf736a2f6a49a336fb14)), closes [#3120](https://github.com/mikro-orm/mikro-orm/issues/3120)
* **core:** improve validation of wrong entity references ([#3085](https://github.com/mikro-orm/mikro-orm/issues/3085)) ([f5de135](https://github.com/mikro-orm/mikro-orm/commit/f5de135b5eff3d0ad1b26de7a2af5925c3ef7f37))
* **core:** wrap relations in `Reference` wrapper when assigning entity instance ([97f1f59](https://github.com/mikro-orm/mikro-orm/commit/97f1f59f29522074b5cd5f86579dc1dd6a1b4c9d)), closes [#3092](https://github.com/mikro-orm/mikro-orm/issues/3092)
* **mongo:** support queries with mongo specific operators on embeddables ([2fb9002](https://github.com/mikro-orm/mikro-orm/commit/2fb900294acef87bc939e0417ec3fd720f806ffd))
* **postgres:** do not try to create schema for migrations when it exists ([d6af811](https://github.com/mikro-orm/mikro-orm/commit/d6af81160b4099436237dc312f7dbb4bbffc4378)), closes [#3106](https://github.com/mikro-orm/mikro-orm/issues/3106)
* **postgres:** fix resolving knex when other version is explicitly installed ([41f5665](https://github.com/mikro-orm/mikro-orm/commit/41f5665bcf234cdccf5a466173b7937acd3c9a1a)), closes [#3129](https://github.com/mikro-orm/mikro-orm/issues/3129)
* **postgres:** ignore schemas prefixed with `crdb_` too ([049fea3](https://github.com/mikro-orm/mikro-orm/commit/049fea3f77063f504a617e32cb9a4e303fbbf0be)), closes [#3021](https://github.com/mikro-orm/mikro-orm/issues/3021)
* **schema:** always ignore PostGIS schemas when diffing ([#3096](https://github.com/mikro-orm/mikro-orm/issues/3096)) ([626e3db](https://github.com/mikro-orm/mikro-orm/commit/626e3dbe1edeb2b43bbe08aa2a025524da65a790))
* **ts-morph:** do not mark properties as enums automatically based on type ([c3923df](https://github.com/mikro-orm/mikro-orm/commit/c3923dffd98d651abef4008d1078b512540b80f0)), closes [#3099](https://github.com/mikro-orm/mikro-orm/issues/3099)


### Features

* **core:** add `strict` option to `em.findOneOrFail()` ([#3088](https://github.com/mikro-orm/mikro-orm/issues/3088)) ([d38242a](https://github.com/mikro-orm/mikro-orm/commit/d38242aba2d669355522fff57e30c10f64427173))
* **postgres:** allow ignoring specified schemas ([3f1d2da](https://github.com/mikro-orm/mikro-orm/commit/3f1d2da742bc1301d4ab89d42be37a694a69edcd))





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)


### Bug Fixes

* **core:** allow replacing target entity in relations with `assign` ([90ec83f](https://github.com/mikro-orm/mikro-orm/commit/90ec83fc01296dc6f3560df00e637b050852b7f2)), closes [#3026](https://github.com/mikro-orm/mikro-orm/issues/3026)
* **core:** do not inline query for JSON properties that match PK names ([e6005d8](https://github.com/mikro-orm/mikro-orm/commit/e6005d838f6faccb56f2082ecf93c23f74cbc08a)), closes [#3054](https://github.com/mikro-orm/mikro-orm/issues/3054)
* **core:** fix serialization when using partial loading for nested relations ([00be9f1](https://github.com/mikro-orm/mikro-orm/commit/00be9f1e0cefad70e70a66859c0466c3fd60fade)), closes [#3011](https://github.com/mikro-orm/mikro-orm/issues/3011)
* **core:** hydrate nullable embedded properties as `null` ([e8490f6](https://github.com/mikro-orm/mikro-orm/commit/e8490f68dae699de99b93616c9a10ba2bf0417f4)), closes [#3063](https://github.com/mikro-orm/mikro-orm/issues/3063)
* **core:** respect mapToPk when expanding properties ([#3031](https://github.com/mikro-orm/mikro-orm/issues/3031)) ([757801e](https://github.com/mikro-orm/mikro-orm/commit/757801e9260b4cc89577b89ddbeec7a428fdb9a0))
* **mongo:** fix ensuring indexes with polymorphic embeddables ([aa5e4d2](https://github.com/mikro-orm/mikro-orm/commit/aa5e4d230f1cf9541d14f1c5a7c5a8b69d1a0dfd)), closes [#3013](https://github.com/mikro-orm/mikro-orm/issues/3013)
* **postgres:** allow using special characters in string arrays ([366da5f](https://github.com/mikro-orm/mikro-orm/commit/366da5f420f2487fbc7d79fb662ec7db0931afc0)), closes [#3037](https://github.com/mikro-orm/mikro-orm/issues/3037)
* **postgres:** ensure schema exists before creating migrations table ([f211813](https://github.com/mikro-orm/mikro-orm/commit/f21181377fd9ff9885e3b0610394d0c7002614bf)), closes [#3039](https://github.com/mikro-orm/mikro-orm/issues/3039)
* **schema:** fix diffing of indexes with too long inferred name ([01ba9ed](https://github.com/mikro-orm/mikro-orm/commit/01ba9edef9b202f324f6e580b0f55161ca927801)), closes [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)
* **schema:** remove FKs first when trying to `dropSchema` without disabled FKs ([b1b5f55](https://github.com/mikro-orm/mikro-orm/commit/b1b5f553d3710893cdfdcc842e6e367f0b34a621)), closes [#3004](https://github.com/mikro-orm/mikro-orm/issues/3004)
* **seeder:** explicitly flush forks when calling `Seeder.call()` ([c8ece7c](https://github.com/mikro-orm/mikro-orm/commit/c8ece7cd2b1c5b3972e0375d7c941196e6b57031)), closes [#2998](https://github.com/mikro-orm/mikro-orm/issues/2998)
* **seeder:** fix type of Factory methods ([#3064](https://github.com/mikro-orm/mikro-orm/issues/3064)) ([06e88e7](https://github.com/mikro-orm/mikro-orm/commit/06e88e72d3a4393190fe46c8de9578c7f3ff2812))
* **sqlite:** fix reflection of tables with FKs ([389bc0d](https://github.com/mikro-orm/mikro-orm/commit/389bc0ddc69cf9d58c9fecc1440a6bcdfe62af7f)), closes [#2959](https://github.com/mikro-orm/mikro-orm/issues/2959)
* **sqlite:** upgrade knex to v2 + switch back to sqlite3 ([f3e4b9d](https://github.com/mikro-orm/mikro-orm/commit/f3e4b9dd8a29e44510e5549b773205d52475cb72)), closes [#3046](https://github.com/mikro-orm/mikro-orm/issues/3046)


### Features

* **core:** try to fix FK order automatically for custom pivot entities ([cc9e427](https://github.com/mikro-orm/mikro-orm/commit/cc9e4277ac348b16de72eddbf339d2494e1533fb)), closes [#3040](https://github.com/mikro-orm/mikro-orm/issues/3040)
* **core:** validate decorator parameters are used properly ([cb3e1dd](https://github.com/mikro-orm/mikro-orm/commit/cb3e1ddf45b8d8196ca1f61afef223eca06ac0b7)), closes [#3040](https://github.com/mikro-orm/mikro-orm/issues/3040)
* **seeder:** created shared context when calling other seeders ([6fa04ae](https://github.com/mikro-orm/mikro-orm/commit/6fa04ae4d98756544d9215cd62863707158193ba)), closes [#3022](https://github.com/mikro-orm/mikro-orm/issues/3022)


### Performance Improvements

* **core:** do not use contextual EM where we know we are in a fork already ([ba16532](https://github.com/mikro-orm/mikro-orm/commit/ba165328055454ae971fe5c6016e83883566cbc0))





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)


### Bug Fixes

* **core:** allow converting custom types via `em.nativeInsert()` ([#2979](https://github.com/mikro-orm/mikro-orm/issues/2979)) ([8d76852](https://github.com/mikro-orm/mikro-orm/commit/8d7685224eaf6f111807a61e4a1ba3ce39453717))
* **core:** do not clean up UoW before each "flush step" ([3ae732d](https://github.com/mikro-orm/mikro-orm/commit/3ae732d3d27ef842bfa16470fbf2b04860259af2)), closes [#2934](https://github.com/mikro-orm/mikro-orm/issues/2934)
* **core:** do not quote knex.raw() instances returned from custom types ([8a4c836](https://github.com/mikro-orm/mikro-orm/commit/8a4c8367a8af032ff3e4ab00825f5fc5aa605ae8)), closes [#1841](https://github.com/mikro-orm/mikro-orm/issues/1841)
* **core:** fix eager loading of nested embeddable m:1 properties ([4867db9](https://github.com/mikro-orm/mikro-orm/commit/4867db9f60ff25b35503b229845fb06eb02621ee)), closes [#2975](https://github.com/mikro-orm/mikro-orm/issues/2975)
* **core:** fix eager loading when multiple relations target same entity ([21922ce](https://github.com/mikro-orm/mikro-orm/commit/21922ce175cbe0ceb73b9765087976dac159294b)), closes [#2990](https://github.com/mikro-orm/mikro-orm/issues/2990)
* **core:** fix mapping of inserted PKs with custom field names from batch insert ([080d8e0](https://github.com/mikro-orm/mikro-orm/commit/080d8e0249391e437abc371a375ce62e5de0ba93)), closes [#2977](https://github.com/mikro-orm/mikro-orm/issues/2977)
* **core:** never reassign the same entity via `em.assign()` ([cdfbabd](https://github.com/mikro-orm/mikro-orm/commit/cdfbabd5d30d40df061a75b79cc1fc52a6cf6b39)), closes [#2974](https://github.com/mikro-orm/mikro-orm/issues/2974)
* **core:** propagate entity removal in `em.transactional()` to upper context ([6e5166b](https://github.com/mikro-orm/mikro-orm/commit/6e5166b5eb8b89d6c0448c32b7deb46e310d0c58)), closes [#2973](https://github.com/mikro-orm/mikro-orm/issues/2973)
* **core:** respect `connectionType` in populate queries ([fe40a9f](https://github.com/mikro-orm/mikro-orm/commit/fe40a9f5663d5a886e975ca049f41a67da60f569)), closes [#2994](https://github.com/mikro-orm/mikro-orm/issues/2994)
* **core:** support `PopulateHint.INFER` with pagination and joined strategy ([56f8737](https://github.com/mikro-orm/mikro-orm/commit/56f873706132678c0129148a114fa94503f734a8)), closes [#2985](https://github.com/mikro-orm/mikro-orm/issues/2985)
* **core:** use correct path for relations inside embeddables with populate: true ([4735dba](https://github.com/mikro-orm/mikro-orm/commit/4735dba93f2b7f89a6232aa2b27297fa3aa9418a)), closes [#2948](https://github.com/mikro-orm/mikro-orm/issues/2948)
* **postgres:** do not ignore custom PK constraint names ([#2931](https://github.com/mikro-orm/mikro-orm/issues/2931)) ([24bf10e](https://github.com/mikro-orm/mikro-orm/commit/24bf10e668dd2d3b4b6cc4c52ed215fbffcc9d45))
* **postgres:** drop enum constraints only when the column was an enum ([76fef39](https://github.com/mikro-orm/mikro-orm/commit/76fef399ac01ffd22f5b652701e0769ae5161838))
* **postgres:** ensure correct column order in compound index/uniques ([321be79](https://github.com/mikro-orm/mikro-orm/commit/321be7992dd7007425fcf5277f09171639db0e28)), closes [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)
* **postgres:** fix pagination with order by bool column ([d5476cd](https://github.com/mikro-orm/mikro-orm/commit/d5476cd04b0eca4fb7c98d790013e6532fdd57fc)), closes [#2910](https://github.com/mikro-orm/mikro-orm/issues/2910)
* **postgres:** fix schema diffing on enums with case-sensitive names ([050875b](https://github.com/mikro-orm/mikro-orm/commit/050875b2f3582499440b14cda1cb04dd2883c6b8)), closes [#2938](https://github.com/mikro-orm/mikro-orm/issues/2938) [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)
* **schema:** do not create FK index for 1:1 properties (they are unique already) ([473795c](https://github.com/mikro-orm/mikro-orm/commit/473795c26f0b54b3997ce4c839a2834ff43290d8)), closes [#2942](https://github.com/mikro-orm/mikro-orm/issues/2942)


### Features

* **mariadb:** implement check constraint support + fix json column diffing ([b513b16](https://github.com/mikro-orm/mikro-orm/commit/b513b1636964a9185f5abfc19b5762a57c5c9006)), closes [#2151](https://github.com/mikro-orm/mikro-orm/issues/2151)
* **schema:** support mysql 8 ([#2961](https://github.com/mikro-orm/mikro-orm/issues/2961)) ([acc960e](https://github.com/mikro-orm/mikro-orm/commit/acc960ebc694c61a959f48e89a9fee5513f6bdfa))





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)


### Bug Fixes

* **core:** fix custom pivot table entities for unidirectional relations ([01bdbf6](https://github.com/mikro-orm/mikro-orm/commit/01bdbf65836b6db1c7353d4dd14032645df3a978))
* **knex:** `order by` with a formula field should not include `as` for sub-queries ([#2929](https://github.com/mikro-orm/mikro-orm/issues/2929)) ([74751fb](https://github.com/mikro-orm/mikro-orm/commit/74751fbb2a14f2b6029df5f07fac99310df75f31))
* **postgres:** allow explicit schema name in `prop.pivotTable` ([1860ff5](https://github.com/mikro-orm/mikro-orm/commit/1860ff5e335b4142e4d7917ac5c4d1c18ba4044d)), closes [#2919](https://github.com/mikro-orm/mikro-orm/issues/2919)
* **postgres:** fix pagination with order by UUID PK ([042626c](https://github.com/mikro-orm/mikro-orm/commit/042626c6aa1c1538ce65fb12db435b088e11e518)), closes [#2910](https://github.com/mikro-orm/mikro-orm/issues/2910)
* **postgres:** respect known schema when loading wild card entity relations ([61d1e85](https://github.com/mikro-orm/mikro-orm/commit/61d1e853db610d46c23d56b0bc9fe03383da005d)), closes [#2909](https://github.com/mikro-orm/mikro-orm/issues/2909)
* **schema:** respect `disableForeignKeys` in schema generator ([f1b8e46](https://github.com/mikro-orm/mikro-orm/commit/f1b8e46af0f9b01c9c2fc1372c588dce98313656)), closes [#2912](https://github.com/mikro-orm/mikro-orm/issues/2912)


### Features

* **core:** validate `em.begin` was called when using `em.commit/rollback` ([67fa076](https://github.com/mikro-orm/mikro-orm/commit/67fa076df1753e9dc433dbc79657b4f240949d8d)), closes [#2918](https://github.com/mikro-orm/mikro-orm/issues/2918)





## [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)


### Bug Fixes

* **core:** do not alias JSON conditions on update/delete queries ([5c0674e](https://github.com/mikro-orm/mikro-orm/commit/5c0674e61d97f9b143b48ae5314e5e7d1eeb4529)), closes [#2839](https://github.com/mikro-orm/mikro-orm/issues/2839)
* **core:** ensure all entities from inner context are merged to the upper one ([7b3a6b4](https://github.com/mikro-orm/mikro-orm/commit/7b3a6b4fb2ea2850959160cb9462c1992f1bd7bd)), closes [#2882](https://github.com/mikro-orm/mikro-orm/issues/2882)
* **core:** fix object key utilities for null prototype objects ([#2847](https://github.com/mikro-orm/mikro-orm/issues/2847)) ([b2cf01e](https://github.com/mikro-orm/mikro-orm/commit/b2cf01ee8b3f00273a8a8af88f56e7af97f02cc8)), closes [#2846](https://github.com/mikro-orm/mikro-orm/issues/2846)
* **core:** fix ordering by complex composite PKs ([dde11d3](https://github.com/mikro-orm/mikro-orm/commit/dde11d3b2fdd62df28f57c6410e47e14a087ecf3)), closes [#2886](https://github.com/mikro-orm/mikro-orm/issues/2886)
* **core:** fix strict type for `orderBy` when entity has `length` property ([ef45871](https://github.com/mikro-orm/mikro-orm/commit/ef4587143d614d71c16f7576c04ed6d74b77fa80)), closes [#2829](https://github.com/mikro-orm/mikro-orm/issues/2829)
* **core:** type global `entityRepository` option weakly ([3faf8bc](https://github.com/mikro-orm/mikro-orm/commit/3faf8bcea57a7e32886ce67cae94321e873b1f9a))
* **knex:** `order by` with a formula field should not include `as` ([#2848](https://github.com/mikro-orm/mikro-orm/issues/2848)) ([09e8bfa](https://github.com/mikro-orm/mikro-orm/commit/09e8bfa036962af13449d5e164ce6a983aa48094))
* **knex:** fully qualify sub-query order-by fields ([#2835](https://github.com/mikro-orm/mikro-orm/issues/2835)) ([f74dc73](https://github.com/mikro-orm/mikro-orm/commit/f74dc73ef8aa0c256b30811aeb3c2269a8a94aa1))
* **mysql:** mark FK columns as unsigned for mixed composite PKs ([67806cb](https://github.com/mikro-orm/mikro-orm/commit/67806cb8ff79ae312295e615533ebec399823579)), closes [#2844](https://github.com/mikro-orm/mikro-orm/issues/2844)
* **postgres:** respect schema name in migration storage ([fbf9bfa](https://github.com/mikro-orm/mikro-orm/commit/fbf9bfa3aad21a4175dea91cd1a6c9742541cbc6)), closes [#2828](https://github.com/mikro-orm/mikro-orm/issues/2828)


### Features

* **core:** allow better control over connection type when using read-replicas ([#2896](https://github.com/mikro-orm/mikro-orm/issues/2896)) ([e40ae2d](https://github.com/mikro-orm/mikro-orm/commit/e40ae2d65abe3d49435356cf79068de5c3d73bd1))
* **core:** allow specifying custom pivot table entity ([#2901](https://github.com/mikro-orm/mikro-orm/issues/2901)) ([8237d16](https://github.com/mikro-orm/mikro-orm/commit/8237d168479c5a61af28cf1a51fcd52f23079179))
* **core:** allow using hooks for interface entities ([#2895](https://github.com/mikro-orm/mikro-orm/issues/2895)) ([aee99b1](https://github.com/mikro-orm/mikro-orm/commit/aee99b1a7ecf392ed4233c2ac5bbc365dfd278c1))
* **core:** enable `QueryFlag.PAGINATE` automatically for `em.find()` ([ccb4223](https://github.com/mikro-orm/mikro-orm/commit/ccb4223c2a6ea39103fa9b82ccee8f0b3a9e4f1e)), closes [#2867](https://github.com/mikro-orm/mikro-orm/issues/2867)
* **core:** map check constraint failures to specific error type ([ebcbdff](https://github.com/mikro-orm/mikro-orm/commit/ebcbdfff43cdc4069fc1c70de516493782619123)), closes [#2836](https://github.com/mikro-orm/mikro-orm/issues/2836)





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)


### Bug Fixes

* **core:** fix auto-joining multiple 1:1 properties ([0566e74](https://github.com/mikro-orm/mikro-orm/commit/0566e74b9587f28318bfbef384cb7ead8203aed9)), closes [#2821](https://github.com/mikro-orm/mikro-orm/issues/2821)
* **core:** respect `orphanRemoval` in 1:1 relations ([#2816](https://github.com/mikro-orm/mikro-orm/issues/2816)) ([55ff07b](https://github.com/mikro-orm/mikro-orm/commit/55ff07be3f781d2c6a788a463d26dec38570509c))
* **knex:** respect explicit transaction in `em.count()` ([#2818](https://github.com/mikro-orm/mikro-orm/issues/2818)) ([2d26a63](https://github.com/mikro-orm/mikro-orm/commit/2d26a631ebcc2bb1d1315f40f95594dca0abe9fc))
* **migrations:** ensure executedAt is a `Date` when listing executed migrations ([c8753ee](https://github.com/mikro-orm/mikro-orm/commit/c8753eec7b1130bf084d04ce32f9fe23aced7e21)), closes [#2817](https://github.com/mikro-orm/mikro-orm/issues/2817)
* **query-builder:** use paginate flag automatically based on to-many joins ([db9963f](https://github.com/mikro-orm/mikro-orm/commit/db9963fff8ceb980354b328f2d59353b9177aef3)), closes [#2823](https://github.com/mikro-orm/mikro-orm/issues/2823)





## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)


### Bug Fixes

* **core:** always create new entities as initialized ([bbb30c5](https://github.com/mikro-orm/mikro-orm/commit/bbb30c5bfb5fbda0b0d7464abd64b07d4166c58d))
* **core:** fix mapping default values of relation properties ([bc57ed0](https://github.com/mikro-orm/mikro-orm/commit/bc57ed0e2d0e5a2f92e4ddaa5cdd77ff88195a85))
* **core:** fix propagation of FK as PK with not flushed entity ([25be857](https://github.com/mikro-orm/mikro-orm/commit/25be857354999626abdf17c386a95559d37b3b56)), closes [#2810](https://github.com/mikro-orm/mikro-orm/issues/2810)
* **core:** fix unsetting identity of orphans (1:1 with orphan removal) ([91e7315](https://github.com/mikro-orm/mikro-orm/commit/91e7315f86f6e31f7ff30589dac82882a9f09783)), closes [#2806](https://github.com/mikro-orm/mikro-orm/issues/2806)
* **core:** respect schema from config when adding new entities to context ([7a6b6e2](https://github.com/mikro-orm/mikro-orm/commit/7a6b6e2f130527909887643765c0c051f57a052a))
* **core:** respect load strategy specified in property definition ([1a6b4b2](https://github.com/mikro-orm/mikro-orm/commit/1a6b4b2c7cc902c32aeff2d99a5dd666b221089e)), closes [#2803](https://github.com/mikro-orm/mikro-orm/issues/2803)
* **entity-generator:** fix property names for columns with dashes ([#2813](https://github.com/mikro-orm/mikro-orm/issues/2813)) ([c920d5f](https://github.com/mikro-orm/mikro-orm/commit/c920d5f1e025d1602d04f6d339f2e3f697049035))
* **schema:** escape table/column comments ([fff1581](https://github.com/mikro-orm/mikro-orm/commit/fff1581d7ff8f2ab5014e57d14c3938e120eb272)), closes [#2805](https://github.com/mikro-orm/mikro-orm/issues/2805)





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **core:** do not trigger global context validation from repositories ([f651865](https://github.com/mikro-orm/mikro-orm/commit/f651865a3adab17a3025e76dc094b04b1f004181)), closes [#2778](https://github.com/mikro-orm/mikro-orm/issues/2778)
* **core:** fix processing of `onUpdate` properties ([9cf454e](https://github.com/mikro-orm/mikro-orm/commit/9cf454ef8a91239e00fad27d41d00b18c8f18263)), closes [#2781](https://github.com/mikro-orm/mikro-orm/issues/2781)
* **core:** fix processing of multiple `onUpdate` properties on one entity ([4f0e4cc](https://github.com/mikro-orm/mikro-orm/commit/4f0e4cc959269a8485684d18e156795372a9bd37)), closes [#2784](https://github.com/mikro-orm/mikro-orm/issues/2784)
* **core:** hydrate not-null embeddable prop even with all null values ([09aee05](https://github.com/mikro-orm/mikro-orm/commit/09aee05105c2da231a18afaf639285e74da62a3a)), closes [#2774](https://github.com/mikro-orm/mikro-orm/issues/2774)
* **core:** register entity to identity map as early as possible ([d8f3613](https://github.com/mikro-orm/mikro-orm/commit/d8f3613402ca51d02f74a3f8af4dae63ffdfcd60)), closes [#2777](https://github.com/mikro-orm/mikro-orm/issues/2777)
* **core:** respect `onDelete: cascade` when propagating removal ([f1e8578](https://github.com/mikro-orm/mikro-orm/commit/f1e85787703a93d33ff47bdd155afc8f0b3f6777)), closes [#2703](https://github.com/mikro-orm/mikro-orm/issues/2703)
* **core:** revert to `require()` when getting ORM version to fix webpack support ([6cfb526](https://github.com/mikro-orm/mikro-orm/commit/6cfb5269696a9c0991198b238667c40f0dae2250)), closes [#2799](https://github.com/mikro-orm/mikro-orm/issues/2799)
* **migrations:** generate snapshot too when using `--initial` ([4857be7](https://github.com/mikro-orm/mikro-orm/commit/4857be73d5f21b7152dcf2e1acd31327d600d37f)), closes [#2800](https://github.com/mikro-orm/mikro-orm/issues/2800)
* **postgres:** consider int8 as numeric when inferring autoincrement value ([64bc99d](https://github.com/mikro-orm/mikro-orm/commit/64bc99d3ddb2293dbf4a3cb70aa22e16ac813b2d)), closes [#2791](https://github.com/mikro-orm/mikro-orm/issues/2791)
* **sqlite:** respect `autoincrement: false` in schema diffing ([b39b6ad](https://github.com/mikro-orm/mikro-orm/commit/b39b6ada0e276a21c3089558a996092174b546fc)), closes [#2800](https://github.com/mikro-orm/mikro-orm/issues/2800)
* **typing:** fix populate hints on collections where both type args are provided ([e39ef5b](https://github.com/mikro-orm/mikro-orm/commit/e39ef5b9acdb5f052d9e4f0d3d6c04af5f43eefb)), closes [#2771](https://github.com/mikro-orm/mikro-orm/issues/2771)


### Features

* add better-sqlite driver ([#2792](https://github.com/mikro-orm/mikro-orm/issues/2792)) ([1b39d66](https://github.com/mikro-orm/mikro-orm/commit/1b39d6687fc2db64e85a45f6a964cf1776a374aa))
* **core:** add `connect` config option ([8aaad33](https://github.com/mikro-orm/mikro-orm/commit/8aaad33a6ea8008450ccb8847237510400e00b94))
* **core:** add `SchemaGenerator.clearDatabase()` ([ecad9c6](https://github.com/mikro-orm/mikro-orm/commit/ecad9c68e8013350bef75b402d6f3c526389765b)), closes [#2220](https://github.com/mikro-orm/mikro-orm/issues/2220)
* **core:** add populate option to `Reference.load` and `Collection.loadItems` ([1527c1a](https://github.com/mikro-orm/mikro-orm/commit/1527c1a1c2ec7034f6deabf4f37134562aa59a3c)), closes [#2796](https://github.com/mikro-orm/mikro-orm/issues/2796)





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)


### Bug Fixes

* **core:** allow passing entity instance in `repo.nativeInsert()` ([791c009](https://github.com/mikro-orm/mikro-orm/commit/791c009e4dadc99137b6337c22d00a73d52087f9))
* **core:** do not ignore schema name from config in `em.getReference()` ([58680fc](https://github.com/mikro-orm/mikro-orm/commit/58680fc28a672abdfeff2636bfbecbfdef500e7d))
* **core:** do not ignore schema name in batch queries ([b47393e](https://github.com/mikro-orm/mikro-orm/commit/b47393e30eb495b81d124c523b00cb4620593ff0))
* **core:** do not ignore schema name in collection updates ([d688dc1](https://github.com/mikro-orm/mikro-orm/commit/d688dc19270277370f129f67e4347f2139a9313e))
* **core:** do not ignore value from database even if we only have a getter ([35103b3](https://github.com/mikro-orm/mikro-orm/commit/35103b335727a19bc12f95b3cc5918058917722f)), closes [#2760](https://github.com/mikro-orm/mikro-orm/issues/2760)
* **core:** respect global schema ([b569686](https://github.com/mikro-orm/mikro-orm/commit/b569686af7746551bd8779d694fa11035b80a736))
* **postgres:** do not ignore custom PK constraint names ([3201ef7](https://github.com/mikro-orm/mikro-orm/commit/3201ef7b2b2f4ea745f946da0966da9f94fd2cc8)), closes [#2762](https://github.com/mikro-orm/mikro-orm/issues/2762)
* **seeder:** declare missing dependency on globby ([0599032](https://github.com/mikro-orm/mikro-orm/commit/05990328ccad8b0e8a37b0eb323a89d1df876976))
* **typing:** remove overloads for `em.nativeInsert()` ([e21d470](https://github.com/mikro-orm/mikro-orm/commit/e21d47013b2ece6768caebc813c869e1cf2a35f2))





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)


### Bug Fixes

* **core:** allow cloning QB with raw conditions ([04d9d88](https://github.com/mikro-orm/mikro-orm/commit/04d9d885492e845bb25c33a3c9ff3a2b9d448d38)), closes [#2748](https://github.com/mikro-orm/mikro-orm/issues/2748)
* **core:** allow using 0 as PK ([a2e423c](https://github.com/mikro-orm/mikro-orm/commit/a2e423c5e7006f4869e87b842f646f502ab3846b)), closes [#2729](https://github.com/mikro-orm/mikro-orm/issues/2729)
* **core:** do not propagate removal to FK as PK ([a0a19c2](https://github.com/mikro-orm/mikro-orm/commit/a0a19c22604586c1f3256aba7759c3204e1f02b0)), closes [#2723](https://github.com/mikro-orm/mikro-orm/issues/2723)
* **core:** fix support for complex composite (nested) PKs ([a7fc7a1](https://github.com/mikro-orm/mikro-orm/commit/a7fc7a19125e43a8cc9edca8cb8e50e5d54b58b1)), closes [#2647](https://github.com/mikro-orm/mikro-orm/issues/2647)
* **core:** ignore ORM packages where we failed to extract version ([b1627c5](https://github.com/mikro-orm/mikro-orm/commit/b1627c502949ef73530dd0c20a829f0bdc5de2fc)), closes [#2732](https://github.com/mikro-orm/mikro-orm/issues/2732)
* **core:** respect `null` in `Loaded` type ([72385b3](https://github.com/mikro-orm/mikro-orm/commit/72385b3d752e07a7c17ba4f329018de2b16fbfbf)), closes [#2750](https://github.com/mikro-orm/mikro-orm/issues/2750)
* **core:** return entity type from `em.create()` instead of `New<T>` ([8ff277d](https://github.com/mikro-orm/mikro-orm/commit/8ff277dbf5ea5919445c318bbb74c2c823b53fc4)), closes [#2727](https://github.com/mikro-orm/mikro-orm/issues/2727)
* **core:** support special characters in `clientUrl` ([43e28b8](https://github.com/mikro-orm/mikro-orm/commit/43e28b8739f4e60814328d99129943c8a3975082)), closes [#2730](https://github.com/mikro-orm/mikro-orm/issues/2730)
* **core:** use `createRequire` instead of dynamic import for JSON files ([f567d2d](https://github.com/mikro-orm/mikro-orm/commit/f567d2d073854163e6de8bddbf8e1a256a6fcaed)), closes [#2738](https://github.com/mikro-orm/mikro-orm/issues/2738)
* **embeddables:** fix loading inline embeddables with joined strategy ([adaa5c6](https://github.com/mikro-orm/mikro-orm/commit/adaa5c648f5f7466aa149a7cee02f0d83abe032e)), closes [#2717](https://github.com/mikro-orm/mikro-orm/issues/2717)
* **esm:** fix getting ORM version on windows with ESM ([eb3a1be](https://github.com/mikro-orm/mikro-orm/commit/eb3a1be5d777252685e401c978a28c86a60c8bde))
* **mongo:** fix caching populated results in mongo ([42ea5be](https://github.com/mikro-orm/mikro-orm/commit/42ea5be05677c85315ea65ac2e47f82d9de03754)), closes [#2754](https://github.com/mikro-orm/mikro-orm/issues/2754)
* **query-builder:** respect explicit entity schema ([717aa5e](https://github.com/mikro-orm/mikro-orm/commit/717aa5e823e02c4d0ee6d7ab7afc8afa28887433)), closes [#2740](https://github.com/mikro-orm/mikro-orm/issues/2740)
* **schema:** fix explicit schema name support ([#2752](https://github.com/mikro-orm/mikro-orm/issues/2752)) ([68631ea](https://github.com/mikro-orm/mikro-orm/commit/68631ea786e40aecd8ffc31baead9a23699874b7))
* **seeder:** fix Factory type for entity with constructor params ([#2745](https://github.com/mikro-orm/mikro-orm/issues/2745)) ([8b7b977](https://github.com/mikro-orm/mikro-orm/commit/8b7b97729935d9fe35f8b57cd9e64dddc8fa86e6))
* **typing:** exclude symbols and functions from `FilterQuery` ([1d24eb8](https://github.com/mikro-orm/mikro-orm/commit/1d24eb87b2e833cd9ab86f2859fc7fee0db3e378)), closes [#2742](https://github.com/mikro-orm/mikro-orm/issues/2742)


### Features

* **core:** add `getContext` parameter to `@UseRequestContext()` ([9516b48](https://github.com/mikro-orm/mikro-orm/commit/9516b48525929d3bbef1794b25fa862048c589f7)), closes [#2721](https://github.com/mikro-orm/mikro-orm/issues/2721)
* **query-builder:** allow autocomplete on `qb.orderBy()` ([fdf03c3](https://github.com/mikro-orm/mikro-orm/commit/fdf03c38322f79e0b41181b834db903d5138124d)), closes [#2747](https://github.com/mikro-orm/mikro-orm/issues/2747)
* **schema:** ensure database when calling `refreshDatabase()` ([7ce12d6](https://github.com/mikro-orm/mikro-orm/commit/7ce12d6f54845d169c769084d90ec82a1ab15c35))
* **seeder:** refactor seeder to support running compiled files ([#2751](https://github.com/mikro-orm/mikro-orm/issues/2751)) ([8d9c4c0](https://github.com/mikro-orm/mikro-orm/commit/8d9c4c0454d06920cd59647f1f2ea4070ea2bd5a)), closes [#2728](https://github.com/mikro-orm/mikro-orm/issues/2728)





## [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.10...v5.0.0) (2022-02-06)

### Bug Fixes

* **assign:** do not convert FK to entity when assigning to `mapToPK` property ([b14c8fb](https://github.com/mikro-orm/mikro-orm/commit/b14c8fbacfb3cf9e6b1991f268b73cd193890190)), closes [#2337](https://github.com/mikro-orm/mikro-orm/issues/2337)
* **cli:** validate configuration in CLI cache commands ([#2146](https://github.com/mikro-orm/mikro-orm/issues/2146)) ([544583b](https://github.com/mikro-orm/mikro-orm/commit/544583b3158ff408eab3982b63585adc9a637b5a)), closes [#2145](https://github.com/mikro-orm/mikro-orm/issues/2145)
* **core**: allow calling `em.create()` with reference wrapper ([c069960](https://github.com/mikro-orm/mikro-orm/commit/c069960))
* **core**: allow empty strings in postgres arrays ([#2680](https://github.com/mikro-orm/mikro-orm/issues/2680)) ([5a33722](https://github.com/mikro-orm/mikro-orm/commit/5a33722))
* **core**: allow using MongoNamingStrategy with SQL drivers ([c38c66c](https://github.com/mikro-orm/mikro-orm/commit/c38c66c))
* **core**: fix pivot tables for wild card schema entities ([623dc91](https://github.com/mikro-orm/mikro-orm/commit/623dc91))
* **core**: fix populating entities with wildcard schema ([98d0bfb](https://github.com/mikro-orm/mikro-orm/commit/98d0bfb))
* **core**: fix support for nested composite PKs ([14dcff8](https://github.com/mikro-orm/mikro-orm/commit/14dcff8))
* **core**: handle `file://` urls in normalizePath ([#2697](https://github.com/mikro-orm/mikro-orm/issues/2697)) ([127b0ae](https://github.com/mikro-orm/mikro-orm/commit/127b0ae))
* **core**: respect request context when creating QB ([a2b7b84](https://github.com/mikro-orm/mikro-orm/commit/a2b7b84))
* **core**: respect specified schema when populating (select-in) ([#2676](https://github.com/mikro-orm/mikro-orm/issues/2676)) ([21a1be0](https://github.com/mikro-orm/mikro-orm/commit/21a1be0))
* **core:** allow non-standard property names (hyphens, spaces, ...) ([cc68230](https://github.com/mikro-orm/mikro-orm/commit/cc682305b44bd4ef886e7a744f8f4b1d69d090ff)), closes [#1958](https://github.com/mikro-orm/mikro-orm/issues/1958)
* **core:** allow propagation to multiple matching inverse sides ([cf7d538](https://github.com/mikro-orm/mikro-orm/commit/cf7d5387a26016b78c11a54d96686eea7ae7b73f)), closes [#2371](https://github.com/mikro-orm/mikro-orm/issues/2371)
* **core:** consider objects without prototype as POJO ([b49807f](https://github.com/mikro-orm/mikro-orm/commit/b49807f181365367ecdb25c85bddabe8e2ca3c5a)), closes [#2274](https://github.com/mikro-orm/mikro-orm/issues/2274)
* **core:** declare peer dependencies on driver packages ([1873e8c](https://github.com/mikro-orm/mikro-orm/commit/1873e8c4b9b5b9cb5979604f529ddd0cc6717042)), closes [#2110](https://github.com/mikro-orm/mikro-orm/issues/2110)
* **core:** detect ts-jest usage ([94acc18](https://github.com/mikro-orm/mikro-orm/commit/94acc187b01950124ce8a54eadd3e8cee144e35a))
* **core:** do not check stack trace when detecting ts-node ([06cca85](https://github.com/mikro-orm/mikro-orm/commit/06cca8542677691eaf35f8b037151050c93d2bbc))
* **core:** do not override existing values via `prop.onCreate` ([fb67ea6](https://github.com/mikro-orm/mikro-orm/commit/fb67ea6c984302273df9915811aff7dcba795ff7))
* **core:** do not propagate `mapToPk` properties ([b93c59e](https://github.com/mikro-orm/mikro-orm/commit/b93c59ec8224ceb9f5070e3fa722a1b32fb39577))
* **core:** fix conversion of custom type PKs in some cases ([28e83ef](https://github.com/mikro-orm/mikro-orm/commit/28e83ef9364293fa450877b79401aac18ade6ed7)), closes [#1263](https://github.com/mikro-orm/mikro-orm/issues/1263)
* **core:** fix nested query with fk as pk ([#2650](https://github.com/mikro-orm/mikro-orm/issues/2650)) ([cc54ff9](https://github.com/mikro-orm/mikro-orm/commit/cc54ff94e6c3bc79fd6fb67b169df7489cd1405c)), closes [#2648](https://github.com/mikro-orm/mikro-orm/issues/2648)
* **core:** fix ordering by pivot table with explicit schema name ([eb1f9bb](https://github.com/mikro-orm/mikro-orm/commit/eb1f9bb1b10beedfbd5bf4b27aabe485e68e1dc9)), closes [#2621](https://github.com/mikro-orm/mikro-orm/issues/2621)
* **core:** fix propagation of locking option with select-in population ([f3990d0](https://github.com/mikro-orm/mikro-orm/commit/f3990d0e6eabd40434bbf8d5259519a99423e514)), closes [#1670](https://github.com/mikro-orm/mikro-orm/issues/1670)
* **core:** improve partial loading of 1:m relations ([3ddde1e](https://github.com/mikro-orm/mikro-orm/commit/3ddde1e9a5e31c245da44ebaa96332ee61ef0c61)), closes [#2651](https://github.com/mikro-orm/mikro-orm/issues/2651)
* **core:** issue early delete queries for recreating unique properties ([decfd10](https://github.com/mikro-orm/mikro-orm/commit/decfd10721958db51752e59c1827c6ad2e29ab55)), closes [#2273](https://github.com/mikro-orm/mikro-orm/issues/2273)
* **core:** propagate `em.remove()` to 1:m collections ([c23c39c](https://github.com/mikro-orm/mikro-orm/commit/c23c39cf70a3f417a6537a2941db87b89b6d78db)), closes [#2395](https://github.com/mikro-orm/mikro-orm/issues/2395)
* **core:** propagate `em.remove()` to m:1 properties of 1:m relations ([e6fa2f7](https://github.com/mikro-orm/mikro-orm/commit/e6fa2f7841b4508406d3a36caec31f63b2aaa4bf)), closes [#2636](https://github.com/mikro-orm/mikro-orm/issues/2636)
* **core:** reload default values after flush in mysql/sqlite ([d57a6a9](https://github.com/mikro-orm/mikro-orm/commit/d57a6a9a4583c4771777bd60ad914647cad8cdb0)), closes [#2581](https://github.com/mikro-orm/mikro-orm/issues/2581)
* **core:** respect read replica options ([#2152](https://github.com/mikro-orm/mikro-orm/issues/2152)) ([9ec668d](https://github.com/mikro-orm/mikro-orm/commit/9ec668d201d9017359812d8bebcfc063aac60f55)), closes [#1963](https://github.com/mikro-orm/mikro-orm/issues/1963)
* **core:** rework orphan removal and cascading ([#2532](https://github.com/mikro-orm/mikro-orm/issues/2532)) ([eb3ea4a](https://github.com/mikro-orm/mikro-orm/commit/eb3ea4a5c187706ea745cb160d2078d57a975e53))
* **core:** save collection snapshots recursively after flush ([3f5ba2f](https://github.com/mikro-orm/mikro-orm/commit/3f5ba2fb27695da6731d6f79937c849aa0137b8d)), closes [#2410](https://github.com/mikro-orm/mikro-orm/issues/2410) [#2411](https://github.com/mikro-orm/mikro-orm/issues/2411)
* **core:** schedule orphan removal on 1:1 inverse sides when relation nulled ([a904fe8](https://github.com/mikro-orm/mikro-orm/commit/a904fe841f15334ed79fdb41d63af0036c7e628d)), closes [#2273](https://github.com/mikro-orm/mikro-orm/issues/2273)
* **core:** support loading lazy scalar properties via `em.populate()` ([c20fe88](https://github.com/mikro-orm/mikro-orm/commit/c20fe883268ecd844d31818dd59cf0cf24b16d2b)), closes [#1479](https://github.com/mikro-orm/mikro-orm/issues/1479)
* **core:** sync `MigrateOptions` type in core with migrations package ([#2259](https://github.com/mikro-orm/mikro-orm/issues/2259)) ([d4b8c2c](https://github.com/mikro-orm/mikro-orm/commit/d4b8c2ca07fda96c0935b595fabd7c19ceed904f))
* **core:** truly load the whole entity graph when `populate: true` ([3c21663](https://github.com/mikro-orm/mikro-orm/commit/3c216638f2f472bffd90a41dea69e1db2ecfe23d)), closes [#1134](https://github.com/mikro-orm/mikro-orm/issues/1134)
* **core:** use clean internal identity map with `disableIdentityMap` ([0677d74](https://github.com/mikro-orm/mikro-orm/commit/0677d74664e975c0b16afb1b90da260e9d7df1a3)), closes [#1307](https://github.com/mikro-orm/mikro-orm/issues/1307)
* **embeddables:** order of discovery of embeddables should not matter ([d955b29](https://github.com/mikro-orm/mikro-orm/commit/d955b29913906a23ecc767c41c42292271fe7a8d)), closes [#2149](https://github.com/mikro-orm/mikro-orm/issues/2149)
* **knex:** quote version column ([#2402](https://github.com/mikro-orm/mikro-orm/issues/2402)) ([5bbbd15](https://github.com/mikro-orm/mikro-orm/commit/5bbbd159375c273743e2e3d6bc5233d2eb8b8f1c)), closes [#2401](https://github.com/mikro-orm/mikro-orm/issues/2401)
* **migrations**: clear the migrations table in `migration:fresh` ([63eb4e6](https://github.com/mikro-orm/mikro-orm/commit/63eb4e6))
* **migrations**: respect `baseDir` and allow absolute paths for sqlite `dbName` ([36a3ae5](https://github.com/mikro-orm/mikro-orm/commit/36a3ae5))
* **postgres:** allow type casting in nested conditions ([bbd0eb4](https://github.com/mikro-orm/mikro-orm/commit/bbd0eb42f530105d27752c7b713a1fdf7b505ae7)), closes [#2227](https://github.com/mikro-orm/mikro-orm/issues/2227)
* **postgres:** fix runtime support for native pg enum arrays ([#2584](https://github.com/mikro-orm/mikro-orm/issues/2584)) ([fcdb9b0](https://github.com/mikro-orm/mikro-orm/commit/fcdb9b02b2d2f85f858ec64d8590e8d984a85f08))
* **postgres:** limit index names to 64 characters ([48c105a](https://github.com/mikro-orm/mikro-orm/commit/48c105a1d5705a0ec42b3a017790ab8537ec6114)), closes [#1915](https://github.com/mikro-orm/mikro-orm/issues/1915)
* **postgres:** support comparing array columns via `$eq` ([6eb320e](https://github.com/mikro-orm/mikro-orm/commit/6eb320e233633af7c9b26219393e2caa816fd59f)), closes [#2462](https://github.com/mikro-orm/mikro-orm/issues/2462)
* **query-builder**: fix mapping of formula properties ([2607266](https://github.com/mikro-orm/mikro-orm/commit/2607266))
* **query-builder**: respect `0` as limit ([#2700](https://github.com/mikro-orm/mikro-orm/issues/2700)) ([3f284ed](https://github.com/mikro-orm/mikro-orm/commit/3f284ed))
* **query-builder:** fix nested ordered pagination ([#2351](https://github.com/mikro-orm/mikro-orm/issues/2351)) ([c5a5c6b](https://github.com/mikro-orm/mikro-orm/commit/c5a5c6b1a49bae334d6e061ae06ffd8c5496b161))
* **query-builder:** support joining same property multiple times ([b62fb05](https://github.com/mikro-orm/mikro-orm/commit/b62fb0533d8e845d3b8db31bafde8ad44c51f2dc)), closes [#2602](https://github.com/mikro-orm/mikro-orm/issues/2602)
* **query-builder:** translate field names in `qb.merge()` ([5aead23](https://github.com/mikro-orm/mikro-orm/commit/5aead23e547027bf97f91b2111f5345aa8590135)), closes [#2177](https://github.com/mikro-orm/mikro-orm/issues/2177)
* **query-builder:** validate missing `onConflict` calls ([30392bc](https://github.com/mikro-orm/mikro-orm/commit/30392bcdce9d2d5b585fd7aa2d01f87a2d25d4a2)), closes [#1803](https://github.com/mikro-orm/mikro-orm/issues/1803)
* **schema**: do not ignore entity level indexes with just expression ([0ee9c4d](https://github.com/mikro-orm/mikro-orm/commit/0ee9c4d))
* **schema:** improve diffing of default values for strings and dates ([d4ac638](https://github.com/mikro-orm/mikro-orm/commit/d4ac6385aa84208732f144e6bd9f68e8cf5c6697)), closes [#2385](https://github.com/mikro-orm/mikro-orm/issues/2385)
* **seeder**: fork EM in the seeder manager so we don't use global context ([022a1cc](https://github.com/mikro-orm/mikro-orm/commit/022a1cc))
* **sql**: split `$and` branches when auto joining to-many relations ([70c795a](https://github.com/mikro-orm/mikro-orm/commit/70c795a))
* **sti:** allow m:n relations between two STI entities ([6c797e9](https://github.com/mikro-orm/mikro-orm/commit/6c797e9e8f578bbcd77bdd1220e7b07e3d4d46e8)), closes [#2246](https://github.com/mikro-orm/mikro-orm/issues/2246)
* **ts-morph:** fix validation of embedded polymorphic arrays ([b6a068a](https://github.com/mikro-orm/mikro-orm/commit/b6a068ae16c5bb9355c7544b7480e89923fa6560))
* **types**: fix populate type hints for nullable properties ([bc1bf76](https://github.com/mikro-orm/mikro-orm/commit/bc1bf76))
* **validation:** throw when calling `qb.update/delete()` after `qb.where()` ([96893e0](https://github.com/mikro-orm/mikro-orm/commit/96893e01d0f7044f878e8dbe3d355ba11132eafe)), closes [#2390](https://github.com/mikro-orm/mikro-orm/issues/2390)


### Features

* **cli**: validate CLI package is installed locally ([8952149](https://github.com/mikro-orm/mikro-orm/commit/8952149))
* **cli:** add `database:create` command ([#1778](https://github.com/mikro-orm/mikro-orm/issues/1778)) ([7e9d97d](https://github.com/mikro-orm/mikro-orm/commit/7e9d97d06c7f07db93a3b033909bda21594e7ac6)), closes [#1757](https://github.com/mikro-orm/mikro-orm/issues/1757)
* **cli:** allow exporting async functions from CLI config ([912728d](https://github.com/mikro-orm/mikro-orm/commit/912728d491be22aee7e893bbd854d0722b9e9f7b))
* **cli:** improve loading of CLI settings from package.json ([03f9ddd](https://github.com/mikro-orm/mikro-orm/commit/03f9dddcc748ee322adcf2886a05ef0605b36d95)), closes [#545](https://github.com/mikro-orm/mikro-orm/issues/545)
* **cli:** only warn with `useTsNode: true` without ts-node available ([5aff134](https://github.com/mikro-orm/mikro-orm/commit/5aff134d6c2a2be7093a465de68a33b41829cc0a)), closes [#1957](https://github.com/mikro-orm/mikro-orm/issues/1957)
* **core**: add `em.clearCache(key)` method ([1ccfad8](https://github.com/mikro-orm/mikro-orm/commit/1ccfad8))
* **core**: add `persistOnCreate` option and enable it for seeder ([f0fec1b](https://github.com/mikro-orm/mikro-orm/commit/f0fec1b))
* **core**: add custom table check constraint support for postgres ([#2688](https://github.com/mikro-orm/mikro-orm/issues/2688)) ([89aca5f](https://github.com/mikro-orm/mikro-orm/commit/89aca5f))
* **core**: allow defining check constraints via callback ([965f740](https://github.com/mikro-orm/mikro-orm/commit/965f740))
* **core**: expose `referencedColumnNames` on m:1/1:1 decorators ([2f5a5e1](https://github.com/mikro-orm/mikro-orm/commit/2f5a5e1))
* **core**: make `em.create()` respect required properties ([2385f1d](https://github.com/mikro-orm/mikro-orm/commit/2385f1d))
* **core**: validate required properties before flushing new entities ([9eec3a9](https://github.com/mikro-orm/mikro-orm/commit/9eec3a9))
* **core**: validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf70219))
* **core:** add `EventType.onLoad` that fires after entity is fully loaded ([14c2fa9](https://github.com/mikro-orm/mikro-orm/commit/14c2fa9763d9bbabc43e2b513d9285ed52df3de2))
* **core:** add `freshEventManager` to `em.fork()` options ([a0f3fd0](https://github.com/mikro-orm/mikro-orm/commit/a0f3fd09a7818ad9bebf6074b44c09ecced23858)), closes [#1741](https://github.com/mikro-orm/mikro-orm/issues/1741)
* **core:** add `populateWhere` option ([#2660](https://github.com/mikro-orm/mikro-orm/pull/2660)) ([16c5e91](https://github.com/mikro-orm/mikro-orm/commit/16c5e91545b11057b9e78c3f6d910cc409f7f8c1))
* **core:** add `QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER` ([be9d9e1](https://github.com/mikro-orm/mikro-orm/commit/be9d9e16d59991fe2ea7a20db56602557845d813)), closes [#1660](https://github.com/mikro-orm/mikro-orm/issues/1660)
* **core:** add `Reference.createFromPK()` helper method ([2217154](https://github.com/mikro-orm/mikro-orm/commit/2217154f15f1f2263bbe7c8c81b789c95eb7f6bb))
* **core:** add callback parameter to `Collection.remove()` ([0b37654](https://github.com/mikro-orm/mikro-orm/commit/0b376544d4dd6ff551e4b65bede225b110e0e4b4)), closes [#2398](https://github.com/mikro-orm/mikro-orm/issues/2398)
* **core:** add index/key name to naming strategy ([a842e3e](https://github.com/mikro-orm/mikro-orm/commit/a842e3eea80349777ccdf7b8840b3c1860e9607f))
* **core:** add PlainObject class that DTO's can extend to treat class as POJO ([#1837](https://github.com/mikro-orm/mikro-orm/issues/1837)) ([645b27a](https://github.com/mikro-orm/mikro-orm/commit/645b27a4d00a8d607e1d18303be8896a5c87a25b))
* **core:** add support for advanced locking ([0cbed9c](https://github.com/mikro-orm/mikro-orm/commit/0cbed9ccead86cda46cb5d1715fd0b2382d5da18)), closes [#1786](https://github.com/mikro-orm/mikro-orm/issues/1786)
* **core:** add support for concurrency checks ([#2437](https://github.com/mikro-orm/mikro-orm/issues/2437)) ([acd43fe](https://github.com/mikro-orm/mikro-orm/commit/acd43feb0f391ec96f82916d94422c8d9b1341b0))
* **core:** add support for custom property ordering ([#2444](https://github.com/mikro-orm/mikro-orm/issues/2444)) ([40ae4d6](https://github.com/mikro-orm/mikro-orm/commit/40ae4d6b96fbc68ac8ff99edc3cd5209e0968527))
* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** add support for multiple schemas (including UoW) ([#2296](https://github.com/mikro-orm/mikro-orm/issues/2296)) ([d64d100](https://github.com/mikro-orm/mikro-orm/commit/d64d100b0ef6fd3335d234aeac1ffa9b34b8f7ea)), closes [#2074](https://github.com/mikro-orm/mikro-orm/issues/2074)
* **core:** add support for polymorphic embeddables ([#2426](https://github.com/mikro-orm/mikro-orm/issues/2426)) ([7b7c3a2](https://github.com/mikro-orm/mikro-orm/commit/7b7c3a22fe517e13a1a610f142c59e758acd3c3f)), closes [#1165](https://github.com/mikro-orm/mikro-orm/issues/1165)
* **core:** allow configuring aliasing naming strategy ([#2419](https://github.com/mikro-orm/mikro-orm/issues/2419)) ([89d63b3](https://github.com/mikro-orm/mikro-orm/commit/89d63b399e66cc61a7ba9294b39dacb9a9bf8cd1))
* **core:** allow passing arrays in `orderBy` parameter ([#2211](https://github.com/mikro-orm/mikro-orm/issues/2211)) ([0ec22ed](https://github.com/mikro-orm/mikro-orm/commit/0ec22ed3c88ea0e8c749dc164bb5c1d23ac7b9dc)), closes [#2010](https://github.com/mikro-orm/mikro-orm/issues/2010)
* **core:** allow providing custom `Logger` instance ([#2443](https://github.com/mikro-orm/mikro-orm/issues/2443)) ([c7a75e0](https://github.com/mikro-orm/mikro-orm/commit/c7a75e00de01b85ece282cd64429a57a49e5842d))
* **core:** allow using short lived tokens in config ([4499838](https://github.com/mikro-orm/mikro-orm/commit/44998383b21a3aef943a922a3e75426369178f35)), closes [#1818](https://github.com/mikro-orm/mikro-orm/issues/1818)
* **core:** automatically infer `populate` hint based on `fields` ([0097539](https://github.com/mikro-orm/mikro-orm/commit/0097539c762c7c79e703bf02cffb24321f11a2b0)), closes [#2468](https://github.com/mikro-orm/mikro-orm/issues/2468)
* **core:** conditionally support folder based discovery of ESM ([8c8f0d0](https://github.com/mikro-orm/mikro-orm/commit/8c8f0d0a472c29ddd0696ccdd145ac138a9a8f69)), closes [#2631](https://github.com/mikro-orm/mikro-orm/issues/2631)
* **core:** implement auto-flush mode ([#2491](https://github.com/mikro-orm/mikro-orm/issues/2491)) ([f1d8bf1](https://github.com/mikro-orm/mikro-orm/commit/f1d8bf1dcdc769d4db2d79c7fb022b8d11007ce5)), closes [#2359](https://github.com/mikro-orm/mikro-orm/issues/2359)
* **core:** implement auto-refreshing of loaded entities ([#2263](https://github.com/mikro-orm/mikro-orm/issues/2263)) ([9dce38c](https://github.com/mikro-orm/mikro-orm/commit/9dce38cd69667907e1eba5cef609ac4ddf6a2945)), closes [#2292](https://github.com/mikro-orm/mikro-orm/issues/2292)
* **core:** implement partial loading support for joined loading strategy ([2bebb5e](https://github.com/mikro-orm/mikro-orm/commit/2bebb5e75595ae3369887ee8bed7be48efc45173)), closes [#1707](https://github.com/mikro-orm/mikro-orm/issues/1707)
* **core:** keep collection state of dirty collections after initializing ([49ed651](https://github.com/mikro-orm/mikro-orm/commit/49ed65149c6cf02ef6afb533c697a8e0ae281a3a)), closes [#2408](https://github.com/mikro-orm/mikro-orm/issues/2408)
* **core:** make `FindOptions.fields` strictly typed (dot notation) ([fd43099](https://github.com/mikro-orm/mikro-orm/commit/fd43099a63cae31ba32f833bed1b75c13f2dd43c))
* **core:** make `populate` parameter strictly typed with dot notation ([3372f02](https://github.com/mikro-orm/mikro-orm/commit/3372f0243f1af34e22a16be2cecba6dc5c04dd0d))
* **core:** move `@UseRequestContext()` decorator to `core` package ([253216d](https://github.com/mikro-orm/mikro-orm/commit/253216d25ef49b32f14958e8892adb00b5d46482))
* **core:** rework deep assigning of entities and enable it by default ([#1978](https://github.com/mikro-orm/mikro-orm/issues/1978)) ([8f455ad](https://github.com/mikro-orm/mikro-orm/commit/8f455ad7dfe37d75f5abb3a83ac4610be74d43a7))
* **core:** support column names with spaces ([00b54b4](https://github.com/mikro-orm/mikro-orm/commit/00b54b46f627cf820d40e0f68eaadcea86236801)), closes [#1617](https://github.com/mikro-orm/mikro-orm/issues/1617)
* **core:** use `AsyncLocalStorage` instead of `domain` API ([be27bf7](https://github.com/mikro-orm/mikro-orm/commit/be27bf7329675e0f4371f9d47800ea8fcbe6ca3f))
* **core:** validate populate hint on runtime for joined strategy too ([94877e3](https://github.com/mikro-orm/mikro-orm/commit/94877e3d7800c325cfe7e4b75380df8d8e224718)), closes [#2527](https://github.com/mikro-orm/mikro-orm/issues/2527)
* **core:** validate usage of global context ([#2381](https://github.com/mikro-orm/mikro-orm/issues/2381)) ([f0cbcc2](https://github.com/mikro-orm/mikro-orm/commit/f0cbcc2d977ffb8b867a21ee2ac857ef26986d73))
* **embeddables:** allow using m:1 properties inside embeddables ([#1948](https://github.com/mikro-orm/mikro-orm/issues/1948)) ([ffca73e](https://github.com/mikro-orm/mikro-orm/commit/ffca73ecf3ecf405dee3042ad0ab60848721ab7b))
* **embeddables:** support `onCreate` and `onUpdate` ([288899d](https://github.com/mikro-orm/mikro-orm/commit/288899d34966775133321ef1f06d20a914955dfe)), closes [#2283](https://github.com/mikro-orm/mikro-orm/issues/2283) [#2391](https://github.com/mikro-orm/mikro-orm/issues/2391)
* **entity-generator**: add support for generating M:N properties ([c0628c5](https://github.com/mikro-orm/mikro-orm/commit/c0628c5))
* **entity-generator:** add enum generation support ([#2608](https://github.com/mikro-orm/mikro-orm/issues/2608)) ([1e0b411](https://github.com/mikro-orm/mikro-orm/commit/1e0b411dad3cb0ebb456b34e1bcac9a71f059c48))
* **entity-generator:** allow specifying schema ([beb2993](https://github.com/mikro-orm/mikro-orm/commit/beb299383c647f9f2d7431e177659d299fb0f041)), closes [#1301](https://github.com/mikro-orm/mikro-orm/issues/1301)
* **filters:** add `em` parameter to the filter callback parameters ([6858986](https://github.com/mikro-orm/mikro-orm/commit/6858986060e10e6170186094469df6e354a7413e)), closes [#2214](https://github.com/mikro-orm/mikro-orm/issues/2214)
* **knex:** export also global `knex` function ([383bc24](https://github.com/mikro-orm/mikro-orm/commit/383bc24143d11f1034b6025bd73389f046ae172b))
* **migrations:** allow providing custom `MigrationGenerator` ([3cc366b](https://github.com/mikro-orm/mikro-orm/commit/3cc366b7a7e269a2c527edc324695620e8025163)), closes [#1913](https://github.com/mikro-orm/mikro-orm/issues/1913)
* **migrations:** allow using migrations with ES modules ([072f23f](https://github.com/mikro-orm/mikro-orm/commit/072f23fe873c969f77a519ef5b997c30e3246093)), closes [#2631](https://github.com/mikro-orm/mikro-orm/issues/2631)
* **migrations:** ensure the database exists when using migrator ([02dd67c](https://github.com/mikro-orm/mikro-orm/commit/02dd67cc0048aa0d9469e62ccb566b56db8e05a0)), closes [#1757](https://github.com/mikro-orm/mikro-orm/issues/1757)
* **migrations:** store migrations without extensions ([4036716](https://github.com/mikro-orm/mikro-orm/commit/40367166f9e74a042e2f6314f31877f27a15a14d)), closes [#2239](https://github.com/mikro-orm/mikro-orm/issues/2239)
* **migrations:** use snapshots for generating diffs in new migrations ([#1815](https://github.com/mikro-orm/mikro-orm/issues/1815)) ([9c37f61](https://github.com/mikro-orm/mikro-orm/commit/9c37f6141d8723d6c472dfd3557a1d749d344455))
* **mongo:** add `SchemaGenerator` support for mongo ([#2658](https://github.com/mikro-orm/mikro-orm/issues/2658)) ([cc11859](https://github.com/mikro-orm/mikro-orm/commit/cc1185971d1ee5780b183623a8afb455b3f79d3a))
* **mongo:** upgrade node-mongodb to v4 ([#2425](https://github.com/mikro-orm/mikro-orm/issues/2425)) ([2e4c135](https://github.com/mikro-orm/mikro-orm/commit/2e4c1350be693dbdde4ce99f720cf23202ae6f76))
* **query-builder:** add `qb.getCount()` method ([f773736](https://github.com/mikro-orm/mikro-orm/commit/f773736a8a1db7d2d441d8879b27c1bd8e1aa90a)), closes [#2066](https://github.com/mikro-orm/mikro-orm/issues/2066)
* **query-builder:** allow awaiting the `QueryBuilder` instance ([#2446](https://github.com/mikro-orm/mikro-orm/issues/2446)) ([c1c4d51](https://github.com/mikro-orm/mikro-orm/commit/c1c4d51650950c7d9dcf1500cf26ccf8bfb16057))
* **query-builder:** improve typing of `qb.execute()` ([c4cfedb](https://github.com/mikro-orm/mikro-orm/commit/c4cfedbc71032de229d7d5a3c669a1edf306cadf)), closes [#2396](https://github.com/mikro-orm/mikro-orm/issues/2396)
* **schema:** add support for timestamp columns in mysql ([a224ec9](https://github.com/mikro-orm/mikro-orm/commit/a224ec9137afe035bd0ed8d6e77376bc076a0f45)), closes [#2386](https://github.com/mikro-orm/mikro-orm/issues/2386)
* **schema:** allow disabling foreign key constraints ([fcdb236](https://github.com/mikro-orm/mikro-orm/commit/fcdb236eb8112ebaed3450892f51fd469902ac62)), closes [#2548](https://github.com/mikro-orm/mikro-orm/issues/2548)
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **seeder**: use community driven faker fork and reexport it ([3c9f8e9](https://github.com/mikro-orm/mikro-orm/commit/3c9f8e9))
* **seeder:** add seeder package ([#929](https://github.com/mikro-orm/mikro-orm/issues/929)) ([2b86e22](https://github.com/mikro-orm/mikro-orm/commit/2b86e22eb061060ee2c67a85741b99c1ddcac9c0)), closes [#251](https://github.com/mikro-orm/mikro-orm/issues/251)
* **sql:** add `qb.indexHint()` method that appends to the from clause ([ce89e1f](https://github.com/mikro-orm/mikro-orm/commit/ce89e1fdca7622ca8343568b14ac8687f947dc6a)), closes [#1663](https://github.com/mikro-orm/mikro-orm/issues/1663)
* **sql:** add callback signature to `expr()` with alias parameter ([48702c7](https://github.com/mikro-orm/mikro-orm/commit/48702c7576f63f0a19dd81612ffae339b2988e62)), closes [#2405](https://github.com/mikro-orm/mikro-orm/issues/2405)
* **sql:** allow setting transaction isolation level ([6ae5fbf](https://github.com/mikro-orm/mikro-orm/commit/6ae5fbf70dd87fe2380b74d83bc8a04bb8f447fe)), closes [#819](https://github.com/mikro-orm/mikro-orm/issues/819)
* **sql:** allow tuple comparison via `expr` helper ([90777a7](https://github.com/mikro-orm/mikro-orm/commit/90777a7f5ac3619d2ef902eb9dc69ed6d762ca33)), closes [#2399](https://github.com/mikro-orm/mikro-orm/issues/2399)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))
* **typings:** make `em.create()` and other methods strict ([#1718](https://github.com/mikro-orm/mikro-orm/issues/1718)) ([e8b7119](https://github.com/mikro-orm/mikro-orm/commit/e8b7119eca0df7d686a7d3d91bfc17b74baaeea1)), closes [#1456](https://github.com/mikro-orm/mikro-orm/issues/1456)
* **typings:** make `toObject()` and similar strict ([#1719](https://github.com/mikro-orm/mikro-orm/issues/1719)) ([c202396](https://github.com/mikro-orm/mikro-orm/commit/c202396a205b710b8afcd68f6a7ccc5a0ab64769))
* support flushing via `Promise.all()` ([f788773](https://github.com/mikro-orm/mikro-orm/commit/f788773de2b6cbefbff6cc72600017eae1f4df22)), closes [#2412](https://github.com/mikro-orm/mikro-orm/issues/2412)


### Performance Improvements

* **core:** do not update entity state on forking EM ([de3191c](https://github.com/mikro-orm/mikro-orm/commit/de3191c55b58aeba33704c085755bec170db7f07))


### BREAKING CHANGES

Please see the [upgrading guide](https://mikro-orm.io/docs/upgrading-v4-to-v5).



## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)


### Bug Fixes

* **core:** allow putting not managed entities to remove stack ([7a47151](https://github.com/mikro-orm/mikro-orm/commit/7a47151d363ba162a51edade0125dbe34aa44adb)), closes [#2395](https://github.com/mikro-orm/mikro-orm/issues/2395)
* **core:** defer cascading of persist operation ([6abb3b0](https://github.com/mikro-orm/mikro-orm/commit/6abb3b07e4a2209f64cc9a16f6ba8bc322c184ac)), closes [#2161](https://github.com/mikro-orm/mikro-orm/issues/2161)
* **core:** do not override internal EM instance when forking EM ([8139174](https://github.com/mikro-orm/mikro-orm/commit/813917404f65f74265d6b9f31d5ff060fa8b6ead)), closes [#2342](https://github.com/mikro-orm/mikro-orm/issues/2342)
* **core:** do not save entity state in `merge` when it's not initialized ([4141539](https://github.com/mikro-orm/mikro-orm/commit/41415397a751c238e7b9746ff89b16ce865e224e)), closes [#1927](https://github.com/mikro-orm/mikro-orm/issues/1927)
* **core:** fix assigning to object property without value ([90165ab](https://github.com/mikro-orm/mikro-orm/commit/90165ab589627e43199c66fc2373562872ec4ba5)), closes [#2492](https://github.com/mikro-orm/mikro-orm/issues/2492)
* **core:** fix collection state when `forceEntityConstructor` is used ([674abbb](https://github.com/mikro-orm/mikro-orm/commit/674abbb28d9c5d5caf0cea441a447af7c987cdb0)), closes [#2406](https://github.com/mikro-orm/mikro-orm/issues/2406) [#2409](https://github.com/mikro-orm/mikro-orm/issues/2409)
* **core:** fix reflection of enums in babel ([a5b8ee9](https://github.com/mikro-orm/mikro-orm/commit/a5b8ee9f20b6aceff6871765feff41b016fc6acc)), closes [#2198](https://github.com/mikro-orm/mikro-orm/issues/2198)
* **core:** fix serialization of self referencing collections ([79c2a10](https://github.com/mikro-orm/mikro-orm/commit/79c2a10ba077c29c4d233abe22da8f8b389efdb1)), closes [#2059](https://github.com/mikro-orm/mikro-orm/issues/2059)
* **core:** rehydrate custom types when using metadata cache ([3bcb9a5](https://github.com/mikro-orm/mikro-orm/commit/3bcb9a52d1bcfd2596826603f2e090b7c8baddf9)), closes [#2489](https://github.com/mikro-orm/mikro-orm/issues/2489)
* **core:** remove entity from its bidirectional relations after delete ([7e40b5c](https://github.com/mikro-orm/mikro-orm/commit/7e40b5cb664cb8f3fef5623308f0a6849392f80e)), closes [#2238](https://github.com/mikro-orm/mikro-orm/issues/2238)
* **embeddables:** add missing serialization options to `@Embedded()` ([9f91578](https://github.com/mikro-orm/mikro-orm/commit/9f91578ce55a5d80e908c8bef2c7cbac3d6eb73b)), closes [#2464](https://github.com/mikro-orm/mikro-orm/issues/2464)
* **embeddables:** ensure order of discovery does not matter for embeddables ([b095d9e](https://github.com/mikro-orm/mikro-orm/commit/b095d9e70770e478b85d5ca644fa0f8e42365e2a)), closes [#2242](https://github.com/mikro-orm/mikro-orm/issues/2242)
* **embeddables:** fix validating nullable object embeddables ([8ab2941](https://github.com/mikro-orm/mikro-orm/commit/8ab2941d819b839cf588a04630fa69c5a9072f83)), closes [#2233](https://github.com/mikro-orm/mikro-orm/issues/2233)
* **mongo:** allow using `pool.min/max` options in mongo driver ([9223055](https://github.com/mikro-orm/mikro-orm/commit/9223055e4661400bd662fb989d55fcc75244f61b)), closes [#2228](https://github.com/mikro-orm/mikro-orm/issues/2228)
* **mongo:** do not use separate update queries for M:N collections if not needed ([e57984d](https://github.com/mikro-orm/mikro-orm/commit/e57984d0d3048637c75b1f3f5ff46d0ed5528e92)), closes [#2483](https://github.com/mikro-orm/mikro-orm/issues/2483)
* **postgres:** add extra array operators ([#2467](https://github.com/mikro-orm/mikro-orm/issues/2467)) ([576117e](https://github.com/mikro-orm/mikro-orm/commit/576117e23699c5ce5ab954c9fbec8b6297e6b359))
* **reflection:** relative paths not stripped completely ([#2164](https://github.com/mikro-orm/mikro-orm/issues/2164)) ([ab3f1c6](https://github.com/mikro-orm/mikro-orm/commit/ab3f1c648d8d1210230f1c0068673bc6563114fe))
* **sqlite:** patch dialect only once ([ea6a764](https://github.com/mikro-orm/mikro-orm/commit/ea6a764d74eebf070be8d24efc1664f5dace940f)), closes [#2422](https://github.com/mikro-orm/mikro-orm/issues/2422)
* **sti:** fix prototype of child entity after it gets loaded ([a0827f5](https://github.com/mikro-orm/mikro-orm/commit/a0827f53c3dd28233406cc912ab772b97c3ad697)), closes [#2493](https://github.com/mikro-orm/mikro-orm/issues/2493) [#2364](https://github.com/mikro-orm/mikro-orm/issues/2364)
* **sti:** respect custom table names ([42a9522](https://github.com/mikro-orm/mikro-orm/commit/42a952213f4a33cab3f1e49bd215ebac9693aadd)), closes [#2356](https://github.com/mikro-orm/mikro-orm/issues/2356)
* **validation:** validate missing 1:m mappedBy key in factory ([e75fcff](https://github.com/mikro-orm/mikro-orm/commit/e75fcff68e2e2f9f66a84887ecd8aa4166d8bb2c)), closes [#2393](https://github.com/mikro-orm/mikro-orm/issues/2393)


### Performance Improvements

* **core:** define `Reference` properties on prototype ([4ef2623](https://github.com/mikro-orm/mikro-orm/commit/4ef2623680734403453961559c13383a979c8ae6))
* **core:** do not redefine `Collection` properties as non-enumerable ([523addd](https://github.com/mikro-orm/mikro-orm/commit/523addd05b4e79021a4c63490ae3afb2a9789d66)), closes [#2543](https://github.com/mikro-orm/mikro-orm/issues/2543)
* **core:** reuse EntityComparator on fork() ([#2496](https://github.com/mikro-orm/mikro-orm/issues/2496)) ([bd2ccfd](https://github.com/mikro-orm/mikro-orm/commit/bd2ccfda950d4fce6dc33b35c35b833d70837a2c))
* **core:** use shared memory for cycles when computing change sets ([c12ff4b](https://github.com/mikro-orm/mikro-orm/commit/c12ff4bb126185e08ea9f86c9b166fcc3fa67082)), closes [#2379](https://github.com/mikro-orm/mikro-orm/issues/2379)
* **core:** various small performance improvements in UoW ([d8ea1c2](https://github.com/mikro-orm/mikro-orm/commit/d8ea1c2053f4cf201e4aa621c42fc33e0ac09012))





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/core





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)


### Bug Fixes

* **core:** detect ts-jest usage ([d54ccc2](https://github.com/mikro-orm/mikro-orm/commit/d54ccc2406829e86aae04400c562e9b489c9eae6))
* **core:** do not apply limit/offset to populate pivot table queries ([1f2d430](https://github.com/mikro-orm/mikro-orm/commit/1f2d43059673f59de1b48230f32d54cd40374d10)), closes [#2121](https://github.com/mikro-orm/mikro-orm/issues/2121)
* **core:** do not propagate mapToPk properties ([c37f42e](https://github.com/mikro-orm/mikro-orm/commit/c37f42ee6b6f96ea6d0eebb1ff99a36549492be5))
* **query-builder:** do not wipe previously defined conditions with `qb.delete()` ([380fe3d](https://github.com/mikro-orm/mikro-orm/commit/380fe3d561a11db29dc44410b984e90f1a6284ef)), closes [#2136](https://github.com/mikro-orm/mikro-orm/issues/2136)
* **reflection:** support virtual method properties ([3a8c344](https://github.com/mikro-orm/mikro-orm/commit/3a8c3445c6ab14ed61e25d204e13bb69a2431b1b))





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)


### Bug Fixes

* **core:** fix clearing 1:m collections ([29cd17b](https://github.com/mikro-orm/mikro-orm/commit/29cd17b62cac23a9eea69219de27fd987f2f0ca6)), closes [#1914](https://github.com/mikro-orm/mikro-orm/issues/1914)
* **core:** fix M:N relations with custom type PKs ([ed399b1](https://github.com/mikro-orm/mikro-orm/commit/ed399b19ad08ba8df8effbc632bdf7bd943cf972)), closes [#1930](https://github.com/mikro-orm/mikro-orm/issues/1930)
* **core:** fix removing of m:n items when one is composite ([8084845](https://github.com/mikro-orm/mikro-orm/commit/808484559c2dc30aca729a9e5a5ab7256b48427a)), closes [#1961](https://github.com/mikro-orm/mikro-orm/issues/1961)
* **core:** fix transaction context in nested transactions ([d88dd8b](https://github.com/mikro-orm/mikro-orm/commit/d88dd8bbc7dc3fad623a7ee37031cf534a955112)), closes [#1910](https://github.com/mikro-orm/mikro-orm/issues/1910)
* **core:** make entity helper property non-enumerable ([ce99eb2](https://github.com/mikro-orm/mikro-orm/commit/ce99eb2707466db14c121b6b039119d3f2ff2dd6))
* **core:** respect filters defined on base entities ([4657d05](https://github.com/mikro-orm/mikro-orm/commit/4657d0553d44e8530bdab0000183e4f48456f026)), closes [#1979](https://github.com/mikro-orm/mikro-orm/issues/1979)
* **embeddables:** allow using more than 10 embedded arrays ([ab8e706](https://github.com/mikro-orm/mikro-orm/commit/ab8e7063a42f45ed6c872913abafdce733d06edc)), closes [#1912](https://github.com/mikro-orm/mikro-orm/issues/1912)
* **entity-generator:** fix boolean default values ([219fc0c](https://github.com/mikro-orm/mikro-orm/commit/219fc0c9376b32928bcc5a6d73053d2d2384eb44)), closes [#1917](https://github.com/mikro-orm/mikro-orm/issues/1917)
* **mysql:** use current schema when reading enum definitions ([c769871](https://github.com/mikro-orm/mikro-orm/commit/c769871867a5307b74dce6746f14fb89af38e856)), closes [#1923](https://github.com/mikro-orm/mikro-orm/issues/1923) [#1866](https://github.com/mikro-orm/mikro-orm/issues/1866)
* **postgres:** fix propagation of PKs with custom names ([9ce0c37](https://github.com/mikro-orm/mikro-orm/commit/9ce0c37223b75461bab040f0b98e4fd932b3a457)), closes [#1990](https://github.com/mikro-orm/mikro-orm/issues/1990)


### Features

* **cli:** only warn with `useTsNode: true` without ts-node available ([3aa3a6c](https://github.com/mikro-orm/mikro-orm/commit/3aa3a6ca5525abe1a5a122fbd3673cf2e39d2bee)), closes [#1957](https://github.com/mikro-orm/mikro-orm/issues/1957)





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)


### Bug Fixes

* **core:** fix extraction of child condition when populating 2 ([f22eec1](https://github.com/mikro-orm/mikro-orm/commit/f22eec18789bfa98f191b7162f0b89967a60fc94)), closes [#1882](https://github.com/mikro-orm/mikro-orm/issues/1882)
* **core:** fix hydrating of inlined embeddables via `em.create()` ([34391cd](https://github.com/mikro-orm/mikro-orm/commit/34391cd4b092ee5d19376b79b1468c7667c7016b)), closes [#1840](https://github.com/mikro-orm/mikro-orm/issues/1840)
* **core:** fix joined strategy with FK as PK ([adaa59b](https://github.com/mikro-orm/mikro-orm/commit/adaa59bbbc1e41a4194eb00f63a2d341bca2bfb3)), closes [#1902](https://github.com/mikro-orm/mikro-orm/issues/1902)
* **core:** mark entity generator and migrations as peer deps of knex ([4ad80af](https://github.com/mikro-orm/mikro-orm/commit/4ad80afc89414ed64f44dbd954c121bd99e0cbf3)), closes [#1879](https://github.com/mikro-orm/mikro-orm/issues/1879)
* **core:** propagate unsetting of 1:1 from inverse side ([903d484](https://github.com/mikro-orm/mikro-orm/commit/903d4847aa138388c95235c650b71601c5f2fe3c)), closes [#1872](https://github.com/mikro-orm/mikro-orm/issues/1872)
* **core:** reset current transaction before running `afterFlush` event ([539311e](https://github.com/mikro-orm/mikro-orm/commit/539311efe4d450c48fb0be2aff372bd5b64dd483)), closes [#1824](https://github.com/mikro-orm/mikro-orm/issues/1824)
* **core:** support getters in `EntitySchema` property types ([0b831d0](https://github.com/mikro-orm/mikro-orm/commit/0b831d09c03b36df8150235826c22a3a7d717a26)), closes [#1867](https://github.com/mikro-orm/mikro-orm/issues/1867)
* **core:** use tsconfig-paths loadConfig function ([#1854](https://github.com/mikro-orm/mikro-orm/issues/1854)) ([fbfb148](https://github.com/mikro-orm/mikro-orm/commit/fbfb14873002ae14bcadf2a7aa2f7e1ffb4acbdf)), closes [#1849](https://github.com/mikro-orm/mikro-orm/issues/1849)
* **entity-generator:** do not infer `cascade` value based on update/delete rules ([dca4f21](https://github.com/mikro-orm/mikro-orm/commit/dca4f21ca210ec34f60017860ddd1bb95b4dc333)), closes [#1857](https://github.com/mikro-orm/mikro-orm/issues/1857)
* **mongo:** fix extraction of child condition when populating ([3cf30e1](https://github.com/mikro-orm/mikro-orm/commit/3cf30e1d93f2a225952c390daa7a2d05a5fcda7c)), closes [#1891](https://github.com/mikro-orm/mikro-orm/issues/1891)


### Features

* **core:** add PlainObject class that DTO's can extend to treat class as POJO ([#1837](https://github.com/mikro-orm/mikro-orm/issues/1837)) ([2e9c361](https://github.com/mikro-orm/mikro-orm/commit/2e9c36101f79b98898f43ba4f9149a78fafe37b6))





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)


### Bug Fixes

* **core:** allow using `updateNestedEntities` flag with collections ([db77e8b](https://github.com/mikro-orm/mikro-orm/commit/db77e8b9b9e7b3c29120333142f517b98b915755)), closes [#1717](https://github.com/mikro-orm/mikro-orm/issues/1717)
* **core:** convert custom types for `onCreate` & `onUpdate` ([34c1aa5](https://github.com/mikro-orm/mikro-orm/commit/34c1aa54bd8a79e1cf2c962fc1382c345aef6561)), closes [#1751](https://github.com/mikro-orm/mikro-orm/issues/1751)
* **core:** convert custom types for collection items in joined strategy ([bea37e0](https://github.com/mikro-orm/mikro-orm/commit/bea37e0e96db151ab054be600b03cc5c1f73789b)), closes [#1754](https://github.com/mikro-orm/mikro-orm/issues/1754)
* **core:** convert custom types on PKs in update and delete queries ([1b5270d](https://github.com/mikro-orm/mikro-orm/commit/1b5270d0328afc254e8fc908628e71719c3686fe)), closes [#1798](https://github.com/mikro-orm/mikro-orm/issues/1798)
* **core:** do not ignore `qb.onConflict(...).merge()` without params ([68b570e](https://github.com/mikro-orm/mikro-orm/commit/68b570ecf79705ed661a2f9be2ea23fece2752ef)), closes [#1774](https://github.com/mikro-orm/mikro-orm/issues/1774)
* **core:** ensure correct aliasing when auto-joining PKs in group conditions ([ec971b6](https://github.com/mikro-orm/mikro-orm/commit/ec971b68d8955df40dafcc81eb221fbd94b9cb1c)), closes [#1734](https://github.com/mikro-orm/mikro-orm/issues/1734)
* **core:** ensure correct casting in deep JSON queries with operators ([0441967](https://github.com/mikro-orm/mikro-orm/commit/04419671dfc3088e8f70fc65f76a5edd8b798656)), closes [#1734](https://github.com/mikro-orm/mikro-orm/issues/1734)
* **core:** fix `findAndCount` with populate ([61bc7cf](https://github.com/mikro-orm/mikro-orm/commit/61bc7cfd2621bd91fa4b3f21d7c6b78509903262)), closes [#1736](https://github.com/mikro-orm/mikro-orm/issues/1736)
* **core:** fix ordering by json properties ([53bef71](https://github.com/mikro-orm/mikro-orm/commit/53bef7184f19c1a7598180e85369e2b2c6042e12))
* **core:** issue delete queries after extra/collection updates ([fc48890](https://github.com/mikro-orm/mikro-orm/commit/fc4889012808cb80e702d68d2c5bbc47e8e26ff9))
* **core:** support extending in `tsconfig.json` ([#1804](https://github.com/mikro-orm/mikro-orm/issues/1804)) ([6597552](https://github.com/mikro-orm/mikro-orm/commit/6597552db8cc8c8cf329fe5329bef719395f0293)), closes [#1792](https://github.com/mikro-orm/mikro-orm/issues/1792)
* **core:** use `$and` for merging of multiple filter conditions ([19f3f1d](https://github.com/mikro-orm/mikro-orm/commit/19f3f1d89cee416566e0f1e44350edfbcd3f34eb)), closes [#1776](https://github.com/mikro-orm/mikro-orm/issues/1776)
* **mongo:** validate usage of migrator and entity generator ([e41d1c5](https://github.com/mikro-orm/mikro-orm/commit/e41d1c5c77c4e80111cfd528ceab64e6cccf91cd)), closes [#1801](https://github.com/mikro-orm/mikro-orm/issues/1801)
* **query-builder:** allow passing array of keys to `qb.onConflict().merge()` ([fc3cf01](https://github.com/mikro-orm/mikro-orm/commit/fc3cf013accc3fbe3b7b59595a1007cb5a74f022)), closes [#1774](https://github.com/mikro-orm/mikro-orm/issues/1774)
* **query-builder:** validate missing `onConflict` calls ([d9ae997](https://github.com/mikro-orm/mikro-orm/commit/d9ae997a3963b96545b70fc8ea177a8231d0ee85)), closes [#1803](https://github.com/mikro-orm/mikro-orm/issues/1803)





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)


### Bug Fixes

* **core:** consider non-plain objects as PKs ([82387ad](https://github.com/mikro-orm/mikro-orm/commit/82387adb31b76b204cfa902058eeb71431fd56a8)), closes [#1721](https://github.com/mikro-orm/mikro-orm/issues/1721)
* **core:** fix `QueryFlag.PAGINATE` with joined loading strategy ([11aa0a3](https://github.com/mikro-orm/mikro-orm/commit/11aa0a34b75844efb405b14bf098e79a64f5be00))
* **core:** fix assigning embedded arrays ([9ee8f5c](https://github.com/mikro-orm/mikro-orm/commit/9ee8f5c6fd5da41bab2b75d5ab0164e92f8edb54)), closes [#1699](https://github.com/mikro-orm/mikro-orm/issues/1699)
* **core:** fix persisting complex composite keys in m:1 relations ([a932366](https://github.com/mikro-orm/mikro-orm/commit/a9323663f6cb52765e80c5933173c57758c2fc87)), closes [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **core:** fix querying by complex composite keys via entity instance ([b1b7894](https://github.com/mikro-orm/mikro-orm/commit/b1b78947283db4f863b897d34e4ee692f019e3ba)), closes [#1695](https://github.com/mikro-orm/mikro-orm/issues/1695)
* **core:** fix querying by JSON properties ([bc5e1a9](https://github.com/mikro-orm/mikro-orm/commit/bc5e1a91e0c9da4c969f4a47e811ec19ef54fcf4)), closes [#1673](https://github.com/mikro-orm/mikro-orm/issues/1673)
* **core:** fix state of entities from result cached ([8d0f076](https://github.com/mikro-orm/mikro-orm/commit/8d0f0762bd4521fdc960f0c7609265feb4f72d42)), closes [#1704](https://github.com/mikro-orm/mikro-orm/issues/1704)
* **core:** initialize empty collections when fetch joining ([6fb9560](https://github.com/mikro-orm/mikro-orm/commit/6fb956049d3febdc5acb322416f086db66e6d9c5))
* **core:** update version values in batch updates ([f5c8ed8](https://github.com/mikro-orm/mikro-orm/commit/f5c8ed8cf3af6fff07c83367628ac2908e428b7d)), closes [#1703](https://github.com/mikro-orm/mikro-orm/issues/1703)


### Features

* **core:** add `QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER` ([378e468](https://github.com/mikro-orm/mikro-orm/commit/378e4684441880977c565c1267f7c5aafd630ca8)), closes [#1660](https://github.com/mikro-orm/mikro-orm/issues/1660)





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)


### Bug Fixes

* **core:** do not auto-join composite relations when not needed ([b1420a6](https://github.com/mikro-orm/mikro-orm/commit/b1420a668ca410b3f65b94343fa1e5bb44f56fb0)), closes [#1658](https://github.com/mikro-orm/mikro-orm/issues/1658)
* **core:** ensure eager loaded relations are actually loaded ([897c7bd](https://github.com/mikro-orm/mikro-orm/commit/897c7bdafe745dc3370f5abc1f41e7128d030572)), closes [#1657](https://github.com/mikro-orm/mikro-orm/issues/1657)
* **core:** fix aliasing of embeddables in update query ([#1650](https://github.com/mikro-orm/mikro-orm/issues/1650)) ([6cb5f62](https://github.com/mikro-orm/mikro-orm/commit/6cb5f62db0b160bee70ff55093cec68658677a76))
* **discovery:** fix metadata validation of nested embeddables ([1d7c123](https://github.com/mikro-orm/mikro-orm/commit/1d7c123140709aa5fc1c870e62d57261924a72e0)), closes [#1616](https://github.com/mikro-orm/mikro-orm/issues/1616)
* **knex:** find by custom types with object subconditions ([#1656](https://github.com/mikro-orm/mikro-orm/issues/1656)) ([d8c328a](https://github.com/mikro-orm/mikro-orm/commit/d8c328a1658dfce2a967148568002142607d5e75))
* **postgres:** improve extra updates logic for batch updates ([84b40bc](https://github.com/mikro-orm/mikro-orm/commit/84b40bcabae214274fd634065992ca8bd172272c)), closes [#1664](https://github.com/mikro-orm/mikro-orm/issues/1664)


### Features

* **postgres:** fix batch inserts with PKs with custom field name ([4500ca7](https://github.com/mikro-orm/mikro-orm/commit/4500ca79e884ddfb2ae53418a0c629343c66e17a)), closes [#1595](https://github.com/mikro-orm/mikro-orm/issues/1595)
* **query-builder:** allow passing raw query bindings via `qb.raw()` ([aa423a5](https://github.com/mikro-orm/mikro-orm/commit/aa423a5876935c76e5e22d2c32bbe06071ec9e8a)), closes [#1654](https://github.com/mikro-orm/mikro-orm/issues/1654)





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)


### Bug Fixes

* **core:** fix mapping of complex composite keys ([c0c658e](https://github.com/mikro-orm/mikro-orm/commit/c0c658eb125695bd1aed760aa95f2eadc1da8d43)), closes [#1624](https://github.com/mikro-orm/mikro-orm/issues/1624)
* **core:** fix querying embeddables over cast fields ([#1639](https://github.com/mikro-orm/mikro-orm/issues/1639)) ([cb5b25c](https://github.com/mikro-orm/mikro-orm/commit/cb5b25cdf84dfe237ce35871c87fa5028762286e))
* **core:** support advanced custom types in batch queries ([88cc71e](https://github.com/mikro-orm/mikro-orm/commit/88cc71e933d99416fa6a6e24759db281194e97c1)), closes [#1625](https://github.com/mikro-orm/mikro-orm/issues/1625)
* **core:** support native bigint as primary key ([#1626](https://github.com/mikro-orm/mikro-orm/issues/1626)) ([bce7afe](https://github.com/mikro-orm/mikro-orm/commit/bce7afe539f9c866d6672bb8aeabd18425ea2a7a))
* **knex:** find entity by advanced custom types ([#1630](https://github.com/mikro-orm/mikro-orm/issues/1630)) ([ef945d5](https://github.com/mikro-orm/mikro-orm/commit/ef945d5c4730997cd6daaefe84fc0eb77ed4693f))





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)


### Bug Fixes

* **core:** create child entities that use Reference wrapper as new ([b14cdcb](https://github.com/mikro-orm/mikro-orm/commit/b14cdcbf1a5e6459c00a43b1066b56a0f3fb96eb)), closes [#1592](https://github.com/mikro-orm/mikro-orm/issues/1592)
* **core:** support `Collection.loadCount` for unidirectional M:N ([27e4dd2](https://github.com/mikro-orm/mikro-orm/commit/27e4dd2d93006f632e332e0e689a22ba61835acd)), closes [#1608](https://github.com/mikro-orm/mikro-orm/issues/1608)
* **core:** support nested embeddables inside embedded arrays ([088c65d](https://github.com/mikro-orm/mikro-orm/commit/088c65d816e7b6d2f76b0fbba737db91b1830c21)), closes [#1585](https://github.com/mikro-orm/mikro-orm/issues/1585)
* **core:** support sql fragments in custom types with joined strategy ([527579d](https://github.com/mikro-orm/mikro-orm/commit/527579d314dfafa880b2c3de465c085f74e92fb4)), closes [#1594](https://github.com/mikro-orm/mikro-orm/issues/1594)





## [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)


### Bug Fixes

* **core:** apply filters when populating M:N relations ([cd8330a](https://github.com/mikro-orm/mikro-orm/commit/cd8330a7a71caadf8fed1e97e7d1db28a1a17b27)), closes [#1232](https://github.com/mikro-orm/mikro-orm/issues/1232)
* **core:** do not process knex.ref() via custom types ([ba2ee70](https://github.com/mikro-orm/mikro-orm/commit/ba2ee70bc7e1a74102fd5e1a00c3f48bb0dcee58)), closes [#1538](https://github.com/mikro-orm/mikro-orm/issues/1538)
* **core:** do not update entity state when cascade merging ([6c74109](https://github.com/mikro-orm/mikro-orm/commit/6c741092ca33aea92fe8cdee4f948f3deaae5ef4)), closes [#1523](https://github.com/mikro-orm/mikro-orm/issues/1523)
* **core:** expose filters in some repository methods ([a1e1553](https://github.com/mikro-orm/mikro-orm/commit/a1e1553fa96188c0ec7e2e841611cbdfa2f9b01c)), closes [#1236](https://github.com/mikro-orm/mikro-orm/issues/1236)
* **core:** fix auto-joining with `$not` operator ([8071fd0](https://github.com/mikro-orm/mikro-orm/commit/8071fd07282685e20702cfcb1ec5e7c82fd47e34)), closes [#1537](https://github.com/mikro-orm/mikro-orm/issues/1537)
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

* **cli:** fix debug command with file globs ([5ec60e2](https://github.com/mikro-orm/mikro-orm/commit/5ec60e20db8d13ed44d1b3f129fd48f3362cb893)), closes [#1465](https://github.com/mikro-orm/mikro-orm/issues/1465)
* **core:** allow extending existing custom types ([cc34d7e](https://github.com/mikro-orm/mikro-orm/commit/cc34d7e1eef10902f82b913bb1a271b2281f25c7)), closes [#1442](https://github.com/mikro-orm/mikro-orm/issues/1442)
* **core:** do not define dynamic id property if not needed ([e13188f](https://github.com/mikro-orm/mikro-orm/commit/e13188fc8aa62498e69dfa24fe3787f2ba9d2eab)), closes [#1444](https://github.com/mikro-orm/mikro-orm/issues/1444)
* **core:** improve quoting of advanced custom types ([cda3638](https://github.com/mikro-orm/mikro-orm/commit/cda3638e4c07fa8247afa7f1f5c80bb28240c066))


### Performance Improvements

* **core:** improve processing of 1:m relations ([#1450](https://github.com/mikro-orm/mikro-orm/issues/1450)) ([f5c1818](https://github.com/mikro-orm/mikro-orm/commit/f5c18183ea03d7360d298a95e5848aa698c25e1b))





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)


### Bug Fixes

* **core:** handle `convertToJSValueSQL` at QB level too ([fbb2825](https://github.com/mikro-orm/mikro-orm/commit/fbb28252d0d27256dd10c4f8ddcf37c942152a83)), closes [#1432](https://github.com/mikro-orm/mikro-orm/issues/1432)
* **core:** ignore falsy values in `Collection.remove()` ([3447039](https://github.com/mikro-orm/mikro-orm/commit/3447039572956004472cf5ea31b695df28916dc1)), closes [#1408](https://github.com/mikro-orm/mikro-orm/issues/1408)
* **core:** propagate custom join columns to inverse side (m:n) ([3f0a7b2](https://github.com/mikro-orm/mikro-orm/commit/3f0a7b2ecbd00630d2bad0d8c3d1a734ed260d1c)), closes [#1429](https://github.com/mikro-orm/mikro-orm/issues/1429)
* **core:** quote custom type aliases ([#1415](https://github.com/mikro-orm/mikro-orm/issues/1415)) ([6f6d1ec](https://github.com/mikro-orm/mikro-orm/commit/6f6d1ec886b7d2b9968d61d082777236e024b337))
* **core:** respect `mergeObjects` only for POJOs in assign helper ([c5bbcee](https://github.com/mikro-orm/mikro-orm/commit/c5bbcee3aaccd4a76763a23f86d9d9367aabc4bd)), closes [#1406](https://github.com/mikro-orm/mikro-orm/issues/1406)
* **core:** use generic comparison for object properties ([e9073cf](https://github.com/mikro-orm/mikro-orm/commit/e9073cfed9c13fc362017f0913b46d7e461c9c4b)), closes [#1395](https://github.com/mikro-orm/mikro-orm/issues/1395)





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)


### Features

* **core:** allow querying by JSON properties ([#1384](https://github.com/mikro-orm/mikro-orm/issues/1384)) ([69c2493](https://github.com/mikro-orm/mikro-orm/commit/69c24934db478eb07d9c88541527b7be40a26483)), closes [#1359](https://github.com/mikro-orm/mikro-orm/issues/1359) [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)
* **core:** allow using SQL expressions with custom types ([#1389](https://github.com/mikro-orm/mikro-orm/issues/1389)) ([83fe6ea](https://github.com/mikro-orm/mikro-orm/commit/83fe6ea11810e045f5f793ad0f084e3fdf64812a)), closes [#735](https://github.com/mikro-orm/mikro-orm/issues/735)





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)


### Bug Fixes

* **core:** alias pivot fields when loading m:n relations ([56682be](https://github.com/mikro-orm/mikro-orm/commit/56682bec4d3a3144ac26d592cd7c5d603ad9ad54)), closes [#1346](https://github.com/mikro-orm/mikro-orm/issues/1346) [#1349](https://github.com/mikro-orm/mikro-orm/issues/1349)
* **core:** allow assigning null to embeddable property ([#1356](https://github.com/mikro-orm/mikro-orm/issues/1356)) ([f3a091e](https://github.com/mikro-orm/mikro-orm/commit/f3a091ec1afcd9e9f058f59839778171fac73169))
* **core:** fix `eager` relations with joined loading strategy ([ba94e28](https://github.com/mikro-orm/mikro-orm/commit/ba94e2884fa4d99882980db144d6fd4c07bd6754)), closes [#1352](https://github.com/mikro-orm/mikro-orm/issues/1352)
* **migrations:** fix generation of empty migrations ([#1362](https://github.com/mikro-orm/mikro-orm/issues/1362)) ([7ec9f30](https://github.com/mikro-orm/mikro-orm/commit/7ec9f3068709be0664966d18bc6d3ba88ae48b33))
* **sti:** respect child types when querying for STI entity ([df298a1](https://github.com/mikro-orm/mikro-orm/commit/df298a12c52675d0b3a0a5040ae3e16cd2ceedd4)), closes [#1252](https://github.com/mikro-orm/mikro-orm/issues/1252)
* **typing:** improve handling of array properties ([9d82ffb](https://github.com/mikro-orm/mikro-orm/commit/9d82ffb77f13163a80e9b87c552a5640837fdb92)), closes [#1077](https://github.com/mikro-orm/mikro-orm/issues/1077)





## [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)


### Bug Fixes

* **core:** `em.create()` should not mutate the input object ([b83b211](https://github.com/mikro-orm/mikro-orm/commit/b83b21132fe8c7188cb881e11c80b5ad966421ef)), closes [#1294](https://github.com/mikro-orm/mikro-orm/issues/1294)
* **core:** allow using `lazy` flag with formulas ([4b2b5ce](https://github.com/mikro-orm/mikro-orm/commit/4b2b5ce9ea4587703fea04e6047e03814b3c65b4)), closes [#1229](https://github.com/mikro-orm/mikro-orm/issues/1229)
* **core:** always make new entity snapshot ([1dacf1e](https://github.com/mikro-orm/mikro-orm/commit/1dacf1edecced98e20e97c2bef271537c6a3cebf)), closes [#1334](https://github.com/mikro-orm/mikro-orm/issues/1334)
* **core:** apply discriminator condition when loading STI entities ([9c62370](https://github.com/mikro-orm/mikro-orm/commit/9c623706695c21ef035799c00edd2c1aa2b12170)), closes [#1252](https://github.com/mikro-orm/mikro-orm/issues/1252)
* **core:** clear inverse references to removed entities ([3a1d927](https://github.com/mikro-orm/mikro-orm/commit/3a1d927b51185407e33ae78ca6026b70234ad1b4)), closes [#1278](https://github.com/mikro-orm/mikro-orm/issues/1278)
* **core:** fix creating entity graph from deeply nested structures ([833d246](https://github.com/mikro-orm/mikro-orm/commit/833d2463132a52d6ebd60c72a8a941f1db552dcb)), closes [#1326](https://github.com/mikro-orm/mikro-orm/issues/1326)
* **core:** fix custom types with joined loading strategy ([f64e657](https://github.com/mikro-orm/mikro-orm/commit/f64e6571b037e46487ed33f9b4e9326ebfaab998)), closes [#1237](https://github.com/mikro-orm/mikro-orm/issues/1237)
* **core:** fix nullable embeddables in object mode ([bb8dbce](https://github.com/mikro-orm/mikro-orm/commit/bb8dbcee75428678ce363ae8f0d4ad4516f14c61)), closes [#1296](https://github.com/mikro-orm/mikro-orm/issues/1296)
* **core:** fix pessimistic locking via `em.findOne()` ([a0419a4](https://github.com/mikro-orm/mikro-orm/commit/a0419a409fbebf0e1db88bfd7ed0c78fc970b4a5)), closes [#1291](https://github.com/mikro-orm/mikro-orm/issues/1291)
* **core:** improve custom sql expression detection ([cf8c5cd](https://github.com/mikro-orm/mikro-orm/commit/cf8c5cd3653600e90034e82c8095828e78dd9270)), closes [#1261](https://github.com/mikro-orm/mikro-orm/issues/1261)
* **core:** make PK property of `Reference` required ([5e1cf23](https://github.com/mikro-orm/mikro-orm/commit/5e1cf23c5d630359d48005e71719c1c013524bb5))
* **core:** respect context when working with filter params ([97ed314](https://github.com/mikro-orm/mikro-orm/commit/97ed3148c827d99c405b0a9500fd7dd696d1a493)), closes [#1312](https://github.com/mikro-orm/mikro-orm/issues/1312)
* **core:** support FK as PK in `Collection.getIdentifiers()` ([#1225](https://github.com/mikro-orm/mikro-orm/issues/1225)) ([f8024c9](https://github.com/mikro-orm/mikro-orm/commit/f8024c9fc2315efddb398e34f3e358cdf0fd04a6)), closes [#1224](https://github.com/mikro-orm/mikro-orm/issues/1224)
* **entity-generator:** emit collection name in decorator ([#1338](https://github.com/mikro-orm/mikro-orm/issues/1338)) ([33574e8](https://github.com/mikro-orm/mikro-orm/commit/33574e8b46235637128f516ce83d290c57e2a7ba)), closes [#1328](https://github.com/mikro-orm/mikro-orm/issues/1328)
* **mongo:** fix using custom field name on relations ([44becca](https://github.com/mikro-orm/mikro-orm/commit/44becca5359bc8ff89c04c44a208b79f4fa2411a)), closes [#1279](https://github.com/mikro-orm/mikro-orm/issues/1279)
* **mysql:** enforce 64 character limit for identifier names in SQL ([#1297](https://github.com/mikro-orm/mikro-orm/issues/1297)) ([9c83b6d](https://github.com/mikro-orm/mikro-orm/commit/9c83b6d4b64c7fd618f309919967249b33e4ea64)), closes [#1271](https://github.com/mikro-orm/mikro-orm/issues/1271)
* **schema:** fix index name with explicit schema ([b62d9ec](https://github.com/mikro-orm/mikro-orm/commit/b62d9ec0f9121db5ad5e4b50010c4a3dc5255796)), closes [#1215](https://github.com/mikro-orm/mikro-orm/issues/1215)
* **schema:** fix renaming of multiple columns at the same time ([677a2b7](https://github.com/mikro-orm/mikro-orm/commit/677a2b705a679dc972ade64a82399ef50d0b76cc)), closes [#1262](https://github.com/mikro-orm/mikro-orm/issues/1262)
* **sql:** sort fetch-joined properties on their orderBy ([#1336](https://github.com/mikro-orm/mikro-orm/issues/1336)) ([f18cd88](https://github.com/mikro-orm/mikro-orm/commit/f18cd88cea50fda66261de5adaf2d267604e3170)), closes [#1331](https://github.com/mikro-orm/mikro-orm/issues/1331)


### Features

* **core:** add support for nested embedddables ([#1311](https://github.com/mikro-orm/mikro-orm/issues/1311)) ([aee2abd](https://github.com/mikro-orm/mikro-orm/commit/aee2abd4cdb9f8ded0920f2786fd80a32cef41f7)), closes [#1017](https://github.com/mikro-orm/mikro-orm/issues/1017)
* **core:** add support for nested partial loading ([#1306](https://github.com/mikro-orm/mikro-orm/issues/1306)) ([3878e6b](https://github.com/mikro-orm/mikro-orm/commit/3878e6b672f02d533e15d0b576cac4ea45a4d74a)), closes [#221](https://github.com/mikro-orm/mikro-orm/issues/221)
* **core:** allow disabling identity map and change set tracking ([#1307](https://github.com/mikro-orm/mikro-orm/issues/1307)) ([03da184](https://github.com/mikro-orm/mikro-orm/commit/03da1845aab53b07a3d2cc008945158163d3107a)), closes [#1267](https://github.com/mikro-orm/mikro-orm/issues/1267)
* **core:** allow using native private properties ([fc35c22](https://github.com/mikro-orm/mikro-orm/commit/fc35c22094f4b6f5301beb72fe73feff25291905)), closes [#1226](https://github.com/mikro-orm/mikro-orm/issues/1226)
* **core:** implement transaction lifecycle hooks ([#1213](https://github.com/mikro-orm/mikro-orm/issues/1213)) ([0f81ff1](https://github.com/mikro-orm/mikro-orm/commit/0f81ff12d316cec3fcd8e6de623232458799a4f6)), closes [#1175](https://github.com/mikro-orm/mikro-orm/issues/1175)
* **core:** support handling `Set` as array-like input ([#1277](https://github.com/mikro-orm/mikro-orm/issues/1277)) ([2945b8c](https://github.com/mikro-orm/mikro-orm/commit/2945b8cc9345deb7af748cf61378e16a8483b973))
* **mysql:** allow specifying collation globally ([cd95572](https://github.com/mikro-orm/mikro-orm/commit/cd95572675997fba40e2141258528fc0b19cd1f5)), closes [#1012](https://github.com/mikro-orm/mikro-orm/issues/1012)
* **query-builder:** add support for `onConflict()` ([b97ecb5](https://github.com/mikro-orm/mikro-orm/commit/b97ecb547282a5563b47e2c624ceb9d2833bbb38)), closes [#1240](https://github.com/mikro-orm/mikro-orm/issues/1240)


### Performance Improvements

* **core:** make `IdentityMap` iterable ([e13757a](https://github.com/mikro-orm/mikro-orm/commit/e13757a0510d576561b124f1072c314c864ae443))



## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)


### Bug Fixes

* **core:** hydrate embeddable scalar properties ([#1192](https://github.com/mikro-orm/mikro-orm/issues/1192)) ([eb73093](https://github.com/mikro-orm/mikro-orm/commit/eb73093fe2df2f2c3d9cd6c7d23b648d67de0683))
* **core:** validate overridden properties by embeddables ([#1172](https://github.com/mikro-orm/mikro-orm/issues/1172)) ([6629a08](https://github.com/mikro-orm/mikro-orm/commit/6629a0829a921efd249707766a47a472a8f8f4d7)), closes [#1169](https://github.com/mikro-orm/mikro-orm/issues/1169)
* **knex:** reject in `commit()` method if commit statement fails ([#1177](https://github.com/mikro-orm/mikro-orm/issues/1177)) ([f3beb7f](https://github.com/mikro-orm/mikro-orm/commit/f3beb7f8ceb943309ed35075e1a021627cf7634e)), closes [#1176](https://github.com/mikro-orm/mikro-orm/issues/1176)
* **mariadb:** fix transforming of raw results in `run` mode ([417a4c9](https://github.com/mikro-orm/mikro-orm/commit/417a4c9451cc6b0d4e7a0bf545e2db4996a35da3))
* **sql:** ensure correct order of results when fetch joining ([7453816](https://github.com/mikro-orm/mikro-orm/commit/74538166c4cd9ff9fcd77689f946a0e1cb2f1f04)), closes [#1171](https://github.com/mikro-orm/mikro-orm/issues/1171)
* **sql:** use `__` when aliasing fetch-joined properties ([1479366](https://github.com/mikro-orm/mikro-orm/commit/1479366aab9754a3d3e168962c1143876fead43a)), closes [#1171](https://github.com/mikro-orm/mikro-orm/issues/1171)


### Features

* **core:** auto-discover base entities ([33bda07](https://github.com/mikro-orm/mikro-orm/commit/33bda07082787d996719535c08fa569d052e0158))





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)


### Bug Fixes

* **cli:** print both `entities` and `entitiesTs` in debug command ([90b85e4](https://github.com/mikro-orm/mikro-orm/commit/90b85e4a540bf0a385ba34c4ca7ff0859039abcf)), closes [#1139](https://github.com/mikro-orm/mikro-orm/issues/1139)
* **core:** fix em.create() with nested relations ([dde119f](https://github.com/mikro-orm/mikro-orm/commit/dde119f7483971d32a9def2bf10dce4e25806fd3)), closes [#1150](https://github.com/mikro-orm/mikro-orm/issues/1150)
* **core:** fix populating 1:m where the owner uses `mapToPk` ([85a7c9d](https://github.com/mikro-orm/mikro-orm/commit/85a7c9dbcfd17922efcececd7619ddcc58aed87f)), closes [#1128](https://github.com/mikro-orm/mikro-orm/issues/1128)
* **core:** fix propagating of changes to 1:m with `mapToPk` ([b38df3e](https://github.com/mikro-orm/mikro-orm/commit/b38df3e2a1fb2470365569557a0a9ac953dcf11d)), closes [#1128](https://github.com/mikro-orm/mikro-orm/issues/1128)
* **core:** fix snapshotting of composite properties ([b5f19f2](https://github.com/mikro-orm/mikro-orm/commit/b5f19f2fff9d31138e23c12dc430249ca2854026)), closes [#1079](https://github.com/mikro-orm/mikro-orm/issues/1079)
* **schema:** allow using const enums ([e02ffea](https://github.com/mikro-orm/mikro-orm/commit/e02ffea5669ac50245a6616b930e7d6532f28486)), closes [#1096](https://github.com/mikro-orm/mikro-orm/issues/1096)
* **schema:** fix diffing tables in other than default schema ([429d832](https://github.com/mikro-orm/mikro-orm/commit/429d8321d4c9962082af7cf4b2284204342a285b)), closes [#1142](https://github.com/mikro-orm/mikro-orm/issues/1142) [#1143](https://github.com/mikro-orm/mikro-orm/issues/1143)
* **sql:** allow no results in `em.count()` ([bc3cdf6](https://github.com/mikro-orm/mikro-orm/commit/bc3cdf6ae39a809b9507d888f2d190ccde1ece75)), closes [#1135](https://github.com/mikro-orm/mikro-orm/issues/1135)
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
* **core:** do not interpolate escaped question marks ([c54c2a2](https://github.com/mikro-orm/mikro-orm/commit/c54c2a25314f7c086d590aa0574f713f44363463))
* **core:** rework unique property extra updates ([bd19d03](https://github.com/mikro-orm/mikro-orm/commit/bd19d038879e6c95768703e78ed9f4236deea48a)), closes [#1025](https://github.com/mikro-orm/mikro-orm/issues/1025) [#1084](https://github.com/mikro-orm/mikro-orm/issues/1084)
* **postgres:** use `->>` to search in object embeddables ([78c9373](https://github.com/mikro-orm/mikro-orm/commit/78c93738ba875eb7195460fe6503da784db038a1)), closes [#1091](https://github.com/mikro-orm/mikro-orm/issues/1091)
* **ts-morph:** fix discovery of `IdentifiedReference` with ts-morph ([d94bd91](https://github.com/mikro-orm/mikro-orm/commit/d94bd9106948d2ca583aaff9125486987ffc5243)), closes [#1088](https://github.com/mikro-orm/mikro-orm/issues/1088)





## [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **cli:** add missing peer dependencies ([#1057](https://github.com/mikro-orm/mikro-orm/issues/1057)) ([83bd6b3](https://github.com/mikro-orm/mikro-orm/commit/83bd6b3ce0fe47cb0d1052ec200ecc49fe3728b5))
* **core:** always check remove stack when cascade persisting ([a9a1bee](https://github.com/mikro-orm/mikro-orm/commit/a9a1bee55dcdaa3b0804a95643e44660b0a62a83)), closes [#1003](https://github.com/mikro-orm/mikro-orm/issues/1003)
* **core:** do not override child class properties ([#1000](https://github.com/mikro-orm/mikro-orm/issues/1000)) ([6d91f1f](https://github.com/mikro-orm/mikro-orm/commit/6d91f1f4dfb61694511b1e65b8b0e8da8e70291d))
* **core:** ensure correct grouping and commit order for STI ([8b77525](https://github.com/mikro-orm/mikro-orm/commit/8b7752545654b5a60cbc6eaf4f12e0b91e4d5cea)), closes [#845](https://github.com/mikro-orm/mikro-orm/issues/845)
* **core:** ensure correct handling of empty arrays ([c9afabb](https://github.com/mikro-orm/mikro-orm/commit/c9afabb5819a05006d0c13ed3de51b43d2052abc))
* **core:** ensure correct handling of empty arrays ([1c4ba75](https://github.com/mikro-orm/mikro-orm/commit/1c4ba75bd7167a71d986c3794eea12dd8c162fb3))
* **core:** ensure we store the right value for bigint PKs ([7d7a1c9](https://github.com/mikro-orm/mikro-orm/commit/7d7a1c9881125930e08c096601f2816db50fab6e)), closes [#1038](https://github.com/mikro-orm/mikro-orm/issues/1038)
* **core:** fix cascading when assigning collections ([d40fcfa](https://github.com/mikro-orm/mikro-orm/commit/d40fcfa772efa9f84484293a3b24da1cbd085add)), closes [#1048](https://github.com/mikro-orm/mikro-orm/issues/1048)
* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)
* **deps:** update dependency @docusaurus/core to v2.0.0-alpha.66 ([#978](https://github.com/mikro-orm/mikro-orm/issues/978)) ([475d3b0](https://github.com/mikro-orm/mikro-orm/commit/475d3b0758c8e1e96f17bf8ca58b7e6c2379bf0d))
* **deps:** update dependency @types/mongodb to v3.5.33 ([#1045](https://github.com/mikro-orm/mikro-orm/issues/1045)) ([81514d8](https://github.com/mikro-orm/mikro-orm/commit/81514d8bf6a691bd015d198a44ea01f5b4b0eb66))
* **discovery:** allow using absolute paths in `entities` ([584854c](https://github.com/mikro-orm/mikro-orm/commit/584854cca4b0a0bf96902524f8c6d171317e7d98)), closes [#1073](https://github.com/mikro-orm/mikro-orm/issues/1073)
* **mongo:** do not create collections for embeddables ([a0cc877](https://github.com/mikro-orm/mikro-orm/commit/a0cc87791f8a503ad13b3fd34e72d68e758b3d39)), closes [#1040](https://github.com/mikro-orm/mikro-orm/issues/1040)
* **schema:** do not add unique constraint to PKs ([a7da03d](https://github.com/mikro-orm/mikro-orm/commit/a7da03d2a2a937a1a2642cb34f7583a333fd50da)), closes [#1064](https://github.com/mikro-orm/mikro-orm/issues/1064)
* **schema:** ensure we do not ignore some columns ([5d7dfc1](https://github.com/mikro-orm/mikro-orm/commit/5d7dfc14212a4371611e058c377293e05d00c034)), closes [#1009](https://github.com/mikro-orm/mikro-orm/issues/1009)
* **schema:** fix diffing FKs in MySQL 8 ([#1030](https://github.com/mikro-orm/mikro-orm/issues/1030)) ([b6f31a5](https://github.com/mikro-orm/mikro-orm/commit/b6f31a5db38d2b803a7efc1d0e476afd331d4a50))
* **schema:** pass entity name to `joinKeyColumnName()` ([fe4b7bd](https://github.com/mikro-orm/mikro-orm/commit/fe4b7bd30eebeb8b94be9648b4583b1047a62b55)), closes [#1026](https://github.com/mikro-orm/mikro-orm/issues/1026)
* **sql:** allow using dot inside custom order by expression ([11e8c56](https://github.com/mikro-orm/mikro-orm/commit/11e8c56f5998eadcb5d81d31a4d30470ea8cf02e)), closes [#1067](https://github.com/mikro-orm/mikro-orm/issues/1067)
* **sql:** convert custom types at query builder level ([83d3ab2](https://github.com/mikro-orm/mikro-orm/commit/83d3ab27f63216aab385500ab73639fa39dcfe90))
* **sql:** do not batch update unique properties ([87b722a](https://github.com/mikro-orm/mikro-orm/commit/87b722a792e8a49c4ffa52e5b21444748c48b224)), closes [#1025](https://github.com/mikro-orm/mikro-orm/issues/1025)
* **sql:** fix populating M:N via joined strategy with conditions ([7113827](https://github.com/mikro-orm/mikro-orm/commit/7113827500079efb844df7bddf0b7443ab098185)), closes [#1043](https://github.com/mikro-orm/mikro-orm/issues/1043)
* **sql:** implement diffing of simple scalar indexes ([dc81ef0](https://github.com/mikro-orm/mikro-orm/commit/dc81ef098bcbfbc0e7215b539dbe7d24fce03bf6)), closes [#957](https://github.com/mikro-orm/mikro-orm/issues/957)
* **sql:** inline array parameters when formatting queries ([a21735f](https://github.com/mikro-orm/mikro-orm/commit/a21735f85f3a9de533212151bee8df55810b25b1)), closes [#1021](https://github.com/mikro-orm/mikro-orm/issues/1021)
* **sql:** interpolate `??` as identifier ([a3d4c09](https://github.com/mikro-orm/mikro-orm/commit/a3d4c09b393e2ca7e2bc2ad7c98b9f403559f4bd)), closes [#983](https://github.com/mikro-orm/mikro-orm/issues/983)
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
* **release:** add automatic nightly releases ([7f8a10c](https://github.com/mikro-orm/mikro-orm/commit/7f8a10cbb063ed93531b2276e426508ffaa9ad6a)), closes [#339](https://github.com/mikro-orm/mikro-orm/issues/339)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)


### Bug Fixes

* **core:** ensure `qb.getFormattedQuery()` works with postgres ([63b2521](https://github.com/mikro-orm/mikro-orm/commit/63b2521b38ddba2ba5853ee56d28ea7300064f61))
* **core:** ensure global filters are enabled by default ([#952](https://github.com/mikro-orm/mikro-orm/issues/952)) ([28124fb](https://github.com/mikro-orm/mikro-orm/commit/28124fb43be9dc4c2f4d1d6b88406dbce33375a9))
* **core:** rework access to target entity metadata from collections ([10ca335](https://github.com/mikro-orm/mikro-orm/commit/10ca335fc220699e3aa7ced828cd7d6fb1bc821f)), closes [#956](https://github.com/mikro-orm/mikro-orm/issues/956)





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)


### Bug Fixes

* **core:** fix mapping of params with custom types ([e5049b1](https://github.com/mikro-orm/mikro-orm/commit/e5049b192d13ea41747e1340715e288084a0015d)), closes [#940](https://github.com/mikro-orm/mikro-orm/issues/940)
* **schema:** make sure we do not create FK columns twice in sqlite ([1eb6374](https://github.com/mikro-orm/mikro-orm/commit/1eb6374092caaae35acde46197d506ddf68a9ed9)), closes [#942](https://github.com/mikro-orm/mikro-orm/issues/942)
* only create migrations folder if migrationsList is not used ([#941](https://github.com/mikro-orm/mikro-orm/issues/941)) ([1e5c5e8](https://github.com/mikro-orm/mikro-orm/commit/1e5c5e83013894d9546c894e83c5965c5bafd4e5)), closes [#907](https://github.com/mikro-orm/mikro-orm/issues/907)
* **core:** fix wrongly inferred 1:m metadata ([82f7f0a](https://github.com/mikro-orm/mikro-orm/commit/82f7f0a7e003e81255ccb74e435e9ac920db8cca)), closes [#936](https://github.com/mikro-orm/mikro-orm/issues/936)


### Features

* **core:** add MetadataStorage.clear() to clear the global storage ([c6fa0f4](https://github.com/mikro-orm/mikro-orm/commit/c6fa0f49acebd452368700d2c9ff813f221da530)), closes [#936](https://github.com/mikro-orm/mikro-orm/issues/936)





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)


### Bug Fixes

* **core:** make sure refreshing of loaded entities works ([45f3f42](https://github.com/mikro-orm/mikro-orm/commit/45f3f42bfa010a9691cbc50b0a957e4b8ec3b0f2))
* **core:** validate object embeddable values on flush ([cd38e17](https://github.com/mikro-orm/mikro-orm/commit/cd38e17e993e763fba3fed68cdc4ecedd9960e1c)), closes [#466](https://github.com/mikro-orm/mikro-orm/issues/466)
* **core:** validate the object passed to `em.persist()` ([90678c2](https://github.com/mikro-orm/mikro-orm/commit/90678c2a2a4896608e7bee727c262212f9c92693))





## [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)


### Bug Fixes

* **core:** fix propagation of conditions with operators ([05acd34](https://github.com/mikro-orm/mikro-orm/commit/05acd34b89bdce50d4e759a21400c913f5e4c383))
* **core:** reset the working state of UoW after failures ([6423cf7](https://github.com/mikro-orm/mikro-orm/commit/6423cf7fc705ed4d6f3f00eca9c8f2e73602ae9a))
* **core:** update umzug types to 2.3 ([4668e78](https://github.com/mikro-orm/mikro-orm/commit/4668e78d1c900d1718625364b603dda1b707dd82)), closes [#926](https://github.com/mikro-orm/mikro-orm/issues/926)
* **core:** use entity ctors also when all PKs are provided in `em.create()` ([b45b60b](https://github.com/mikro-orm/mikro-orm/commit/b45b60b328821950d4198fa12813bea26e0b6f2f)), closes [#924](https://github.com/mikro-orm/mikro-orm/issues/924)
* **schema:** fix automatic discriminator map values in STI ([7cd3c6f](https://github.com/mikro-orm/mikro-orm/commit/7cd3c6f092afd11089ce72672dfb389dec345fec)), closes [#923](https://github.com/mikro-orm/mikro-orm/issues/923)
* **schema:** improve column type equality check ([#925](https://github.com/mikro-orm/mikro-orm/issues/925)) ([152f399](https://github.com/mikro-orm/mikro-orm/commit/152f3991db57d771869a3f83b102d9bd14400fe9))


### Features

* **core:** add basic (in-memory) result caching ([2f8253d](https://github.com/mikro-orm/mikro-orm/commit/2f8253d9db9ae0c469e2dcf976aa20546f3b9b8c))
* **core:** add native support for enum arrays ([9053450](https://github.com/mikro-orm/mikro-orm/commit/9053450634a606356b609ff64fc2a0da026ab730)), closes [#476](https://github.com/mikro-orm/mikro-orm/issues/476)
* **core:** allow defining multiple entities in single file ([e3ab336](https://github.com/mikro-orm/mikro-orm/commit/e3ab33699b116e25e09a7449589db7955899c8ac)), closes [#922](https://github.com/mikro-orm/mikro-orm/issues/922)
* **core:** allow mapping m:1/1:1 relations to PK ([#921](https://github.com/mikro-orm/mikro-orm/issues/921)) ([894f17e](https://github.com/mikro-orm/mikro-orm/commit/894f17e4fa24ac45d7872bd5e52ae9e9fbf014df)), closes [#750](https://github.com/mikro-orm/mikro-orm/issues/750)
* **core:** allow storing embeddables as objects ([#927](https://github.com/mikro-orm/mikro-orm/issues/927)) ([ba881e6](https://github.com/mikro-orm/mikro-orm/commit/ba881e6257dd5d72bb10ca402b0322f7dbbda69c)), closes [#906](https://github.com/mikro-orm/mikro-orm/issues/906)
* **serialization:** rework handling of cycles ([1a2d026](https://github.com/mikro-orm/mikro-orm/commit/1a2d026c13be8a62c77bbae4ec6e3519b1c7209f))





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)


### Bug Fixes

* **postgres:** escape question marks in parameters ([813e3cd](https://github.com/mikro-orm/mikro-orm/commit/813e3cd3fad2f1975c0158bf7265e7f58d1437b5)), closes [#920](https://github.com/mikro-orm/mikro-orm/issues/920)





## [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Bug Fixes

* **core:** allow defining PKs inside `@BeforeCreate()` ([0a2299f](https://github.com/mikro-orm/mikro-orm/commit/0a2299f78eea99c5a2af400f4e93938467925e3e)), closes [#893](https://github.com/mikro-orm/mikro-orm/issues/893) [#892](https://github.com/mikro-orm/mikro-orm/issues/892)
* **core:** do not cascade remove FK primary keys ([37415ce](https://github.com/mikro-orm/mikro-orm/commit/37415ce7c0d519b3145122045acfb7d1c85a65f4)), closes [#915](https://github.com/mikro-orm/mikro-orm/issues/915)
* **core:** do not fire onInit event twice ([9485f48](https://github.com/mikro-orm/mikro-orm/commit/9485f48978e630126125e411ebfb83dedae2963e)), closes [#900](https://github.com/mikro-orm/mikro-orm/issues/900)
* **core:** ensure custom types are comparable ([3714a51](https://github.com/mikro-orm/mikro-orm/commit/3714a51cd3aac94726194255ec8dc9128c145cdb)), closes [#864](https://github.com/mikro-orm/mikro-orm/issues/864)
* **core:** fix detection of custom type PKs with object value ([61095ce](https://github.com/mikro-orm/mikro-orm/commit/61095ce957f2d8b39ed83dbee14e4db289d0baac)), closes [#910](https://github.com/mikro-orm/mikro-orm/issues/910)
* **core:** fix mapping of returning zero values in embeddables ([e42ae4a](https://github.com/mikro-orm/mikro-orm/commit/e42ae4ad5ae3ca7a6895a7debac6ac4ce7752a19)), closes [#905](https://github.com/mikro-orm/mikro-orm/issues/905)
* **core:** skip index initialization for abstract entities ([#881](https://github.com/mikro-orm/mikro-orm/issues/881)) ([a2d381f](https://github.com/mikro-orm/mikro-orm/commit/a2d381fe03353dad40e8fe78bd443fc6e23de02c))
* **migrations:** always ensure the migrations folder exists ([a1e0703](https://github.com/mikro-orm/mikro-orm/commit/a1e0703dbf1572e95bf11b353f2872742fdecaef)), closes [#907](https://github.com/mikro-orm/mikro-orm/issues/907)
* **migrations:** respect custom file names when running by name ([80e5b58](https://github.com/mikro-orm/mikro-orm/commit/80e5b584594da89a11b61d1ac2fecdb61dd4106a)), closes [#883](https://github.com/mikro-orm/mikro-orm/issues/883)
* **mongo:** filter by serialized PK inside group condition ([a492a64](https://github.com/mikro-orm/mikro-orm/commit/a492a64e08fc4fac5b447d0928bbc6d7b453e29f)), closes [#908](https://github.com/mikro-orm/mikro-orm/issues/908)
* **postgres:** do not convert date type columns to Date js objects ([2cfb145](https://github.com/mikro-orm/mikro-orm/commit/2cfb14594608f9de89a68464afc838d0925eb68d)), closes [#864](https://github.com/mikro-orm/mikro-orm/issues/864)
* **schema:** allow using non-abstract root entity in STI ([9dd3aed](https://github.com/mikro-orm/mikro-orm/commit/9dd3aede0484b5e31e10e9ce0ce92f4e0f5d6f55)), closes [#874](https://github.com/mikro-orm/mikro-orm/issues/874)
* **schema:** make STI metadata discovery order independent ([f477a48](https://github.com/mikro-orm/mikro-orm/commit/f477a48562d09373a2e78dea6bc72f21e2c6d64d)), closes [#909](https://github.com/mikro-orm/mikro-orm/issues/909)
* **sqlite:** rework schema support for composite keys in sqlite ([82e2efd](https://github.com/mikro-orm/mikro-orm/commit/82e2efd2d285c507c9205bffced4a9afa920f259)), closes [#887](https://github.com/mikro-orm/mikro-orm/issues/887)
* **typings:** improve inference of the entity type ([67f8015](https://github.com/mikro-orm/mikro-orm/commit/67f80157ae013479b6fc47ae1c08a5cd31a6c32d)), closes [#876](https://github.com/mikro-orm/mikro-orm/issues/876)


### Features

* **core:** add EntityRepository.merge() method ([f459334](https://github.com/mikro-orm/mikro-orm/commit/f45933476177fe0503f0679cf7e947db224a450f)), closes [#868](https://github.com/mikro-orm/mikro-orm/issues/868)


### Performance Improvements

* **core:** implement bulk updates in mongo driver ([5f347c1](https://github.com/mikro-orm/mikro-orm/commit/5f347c1de4e5dd6f30305275c86d333611edc27c)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
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
* **core:** use raw sql for batch updates ([1089c57](https://github.com/mikro-orm/mikro-orm/commit/1089c57b4cea71b1319b913026e8b198985258e7)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





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
* **migrations:** migrate only one version down with explicit tx ([50567dd](https://github.com/mikro-orm/mikro-orm/commit/50567ddd384ac2b53512925cade28e8debbb9f3b)), closes [#855](https://github.com/mikro-orm/mikro-orm/issues/855)
* **query-builder:** do not select 1:1 owner when auto-joining ([86c3032](https://github.com/mikro-orm/mikro-orm/commit/86c303229c2ac7b77d245000f64562c0cc529320)), closes [#858](https://github.com/mikro-orm/mikro-orm/issues/858)
* **query-builder:** fix auto-joining of 1:m PKs ([920995f](https://github.com/mikro-orm/mikro-orm/commit/920995f94070ff242b297d2837d83c7d9a9cb776)), closes [#857](https://github.com/mikro-orm/mikro-orm/issues/857)
* **query-builder:** fix count query with auto-joining of 1:1 ([9b8056c](https://github.com/mikro-orm/mikro-orm/commit/9b8056c7440b836d22c8175ba90adf70fc3b052e)), closes [#858](https://github.com/mikro-orm/mikro-orm/issues/858)
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
* **query-builder:** fix mapping of 1:1 inverse sides ([a46281e](https://github.com/mikro-orm/mikro-orm/commit/a46281e0d8de6385e2c49fd250d284293421f2dc)), closes [#849](https://github.com/mikro-orm/mikro-orm/issues/849)
* **query-builder:** fix mapping of nested 1:1 properties ([9799e70](https://github.com/mikro-orm/mikro-orm/commit/9799e70bd7235695f4f1e55b25fe61bbc158eb38))


### Features

* **core:** allow setting loading strategy globally ([e4378ee](https://github.com/mikro-orm/mikro-orm/commit/e4378ee6dca5607a82e2bff3450e18f0a6668354)), closes [#834](https://github.com/mikro-orm/mikro-orm/issues/834)
* **migrations:** allow providing transaction context ([1089c86](https://github.com/mikro-orm/mikro-orm/commit/1089c861afcb31703a0dbdc82edf9674b2dd1576)), closes [#851](https://github.com/mikro-orm/mikro-orm/issues/851)


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


### Features

* **entity-generator:** do not use ts-morph ([478a7bb](https://github.com/mikro-orm/mikro-orm/commit/478a7bb7f9ea80062caaef666b8308086842a44b))
* **migrations:** do not use ts-morph in migrations ([9800dc1](https://github.com/mikro-orm/mikro-orm/commit/9800dc114ae32d31bb3621fc771a8eb5324ae044))





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)


### Bug Fixes

* **core:** hydrate user defined discriminator columns ([#831](https://github.com/mikro-orm/mikro-orm/issues/831)) ([8671440](https://github.com/mikro-orm/mikro-orm/commit/867144005f18ab7780b60803c40ed448e0b31a8c)), closes [#827](https://github.com/mikro-orm/mikro-orm/issues/827)
* **core:** refactor internals to reduce number of cycles ([#830](https://github.com/mikro-orm/mikro-orm/issues/830)) ([3994767](https://github.com/mikro-orm/mikro-orm/commit/3994767d93ef119d229bedffa77eb2ea3af5c775))



## [4.0.0](https://github.com/mikro-orm/mikro-orm/compare/v3.6.15...v4.0.0) (2020-09-08)

### Bug Fixes

* **cli:** custom tsconfig gets wrong path ([#597](https://github.com/mikro-orm/mikro-orm/issues/597)) ([3cdb5dd](https://github.com/mikro-orm/mikro-orm/commit/3cdb5ddab076c0d33008023c1a987e701c3b164f))
* **core:** add `RequestContext.createAsync()` for Koa ([ae3bc0f](https://github.com/mikro-orm/mikro-orm/commit/ae3bc0fa39404b879a215f575751fb591d40d01c)), closes [#709](https://github.com/mikro-orm/mikro-orm/issues/709)
* **core:** allow date to be used as primary key ([#609](https://github.com/mikro-orm/mikro-orm/issues/609)) ([d421be8](https://github.com/mikro-orm/mikro-orm/commit/d421be8dc463d36b94687477c999289fe31c5e59))
* **core:** allow having same property name as entity name ([6b9d4cd](https://github.com/mikro-orm/mikro-orm/commit/6b9d4cd6f66769d49ad2b16a570a888c27859396)), closes [#655](https://github.com/mikro-orm/mikro-orm/issues/655)
* **core:** allow hiding PKs in `toObject()` ([0a920dd](https://github.com/mikro-orm/mikro-orm/commit/0a920ddabfb98dc72061361d8630b9e64a16d8ea)), closes [#644](https://github.com/mikro-orm/mikro-orm/issues/644)
* **core:** allow populating FK as PK in `toJSON()` ([e05d780](https://github.com/mikro-orm/mikro-orm/commit/e05d780e8d1cb5a6506aaf12f4c7faec559dbff6))
* **core:** do not cascade merge new entities ([2b0f208](https://github.com/mikro-orm/mikro-orm/commit/2b0f208b3915cde1f7135b26539f7e57da465a4f))
* **core:** do not lookup in identity map with non-PK conditions ([4fb0e52](https://github.com/mikro-orm/mikro-orm/commit/4fb0e52534fd065897e9da794ba39ad05dd3d5d8)), closes [#625](https://github.com/mikro-orm/mikro-orm/issues/625)
* **core:** do not merge entity instances in `em.create()` ([50aaef8](https://github.com/mikro-orm/mikro-orm/commit/50aaef8ba2fb9d774c67f5568935b1f989bae625))
* **core:** fix `em.create()` with deeply nested data ([#683](https://github.com/mikro-orm/mikro-orm/issues/683)) ([a302473](https://github.com/mikro-orm/mikro-orm/commit/a302473164961e682c1d41ae27c9b5cc4d937204)), closes [#678](https://github.com/mikro-orm/mikro-orm/issues/678)
* **core:** fix default value for `cache.enabled` ([9be725f](https://github.com/mikro-orm/mikro-orm/commit/9be725fa3906323d4bc9788f54eccf74109d632b))
* **core:** fix extracting PK out of reference wrapper ([db037dc](https://github.com/mikro-orm/mikro-orm/commit/db037dc23e3343486266ecb84347c9148bd3747e)), closes [#589](https://github.com/mikro-orm/mikro-orm/issues/589)
* **core:** map values from returning clause via hydrator ([c5384b4](https://github.com/mikro-orm/mikro-orm/commit/c5384b4a61b8638d8a2b6aa9ffc3f1219930b83b)), closes [#725](https://github.com/mikro-orm/mikro-orm/issues/725)
* **core:** mark all properties as populated for new entities ([5f7fb8f](https://github.com/mikro-orm/mikro-orm/commit/5f7fb8f0cf17b9325e7f282eb969eaa4f1f0141b)), closes [#784](https://github.com/mikro-orm/mikro-orm/issues/784)
* **core:** reset collections when assigning to those not initialized ([e19a6b4](https://github.com/mikro-orm/mikro-orm/commit/e19a6b4b6b3b0ef12f1945d214794715f353dabd))
* **core:** support comments in tsconfig.json ([6506695](https://github.com/mikro-orm/mikro-orm/commit/6506695e1fe3e15ac4709bdb7eca46523c683ae6)), closes [#730](https://github.com/mikro-orm/mikro-orm/issues/730)
* **core:** support nullable bigints ([3bb2a2d](https://github.com/mikro-orm/mikro-orm/commit/3bb2a2d46e647309d7167fdfbf1e5e9dbc25cc9e)), closes [#631](https://github.com/mikro-orm/mikro-orm/issues/631)
* **core:** support self referencing with Reference wrapper ([fd1e158](https://github.com/mikro-orm/mikro-orm/commit/fd1e158d32ff4a911800d459f24246ad9409ee0d)), closes [#610](https://github.com/mikro-orm/mikro-orm/issues/610)
* **core:** throw when trying to call `em.remove(..., null)` ([77c52dd](https://github.com/mikro-orm/mikro-orm/commit/77c52dd191c9d5bbcc0e668ba3ea045344516a8f))
* **mapping:** support mixed M:N with composite PK on one side only ([a951918](https://github.com/mikro-orm/mikro-orm/commit/a95191831ce4e406cbbf43cc6ee27b1eecd3c31d))
* **mariadb:** enable `bigNumberStrings` toggle ([ee90c64](https://github.com/mikro-orm/mikro-orm/commit/ee90c64120460bcc2fa3af0f55213166411ed54a)), closes [#578](https://github.com/mikro-orm/mikro-orm/issues/578)
* **mongo:** add support for `$re` operator in mongo ([13fe6e5](https://github.com/mikro-orm/mikro-orm/commit/13fe6e5ce208fba6d7da23a2365b6e62bf5f88f8)), closes [#613](https://github.com/mikro-orm/mikro-orm/issues/613)
* **postgres:** time column type should be a string ([#774](https://github.com/mikro-orm/mikro-orm/issues/774)) ([237ddbf](https://github.com/mikro-orm/mikro-orm/commit/237ddbf24efe76a0457b92848e23a82defd0912e))
* **query-builder:** make sure `$or` and `$and` combined works correctly ([c8d3a34](https://github.com/mikro-orm/mikro-orm/commit/c8d3a3495861e497921fa5108c58497428247511)), closes [#792](https://github.com/mikro-orm/mikro-orm/issues/792)
* **query-builder:** make sure we use the right alias in complex `$and` queries ([522787e](https://github.com/mikro-orm/mikro-orm/commit/522787e6005555feece6e934f2badcb9a762fc35)), closes [#786](https://github.com/mikro-orm/mikro-orm/issues/786)
* **query-builder:** use correct operators in complex and/or conditions ([#803](https://github.com/mikro-orm/mikro-orm/issues/803)) ([aca0e10](https://github.com/mikro-orm/mikro-orm/commit/aca0e1053f3ab811b7af289d8f6d9f95f65daf7e))
* **schema:** do not create indexes for each composite PK ([91b38cb](https://github.com/mikro-orm/mikro-orm/commit/91b38cb2a93007862496ec9e7a8fff4a399af1ca)), closes [#760](https://github.com/mikro-orm/mikro-orm/issues/760)
* **postgres:** keep `bigint`/`numeric` types as string ([014f3b5](https://github.com/mikro-orm/mikro-orm/commit/014f3b5510d441b3cebbf511c679e77e661021d2)), closes [#324](https://github.com/mikro-orm/mikro-orm/issues/324)
* **sql:** pivot joining of m:n when no target entity needed directly ([2b0bb72](https://github.com/mikro-orm/mikro-orm/commit/2b0bb72a5c2819de96008ccdd597787d4ccc0625)), closes [#549](https://github.com/mikro-orm/mikro-orm/issues/549)
* **sql:** pivot joining of m:n when target entity is null ([3b05a59](https://github.com/mikro-orm/mikro-orm/commit/3b05a5918f490037b0c618e76b139dc8f57a1343)), closes [#548](https://github.com/mikro-orm/mikro-orm/issues/548)
* **sql:** rework implicit m:n pivot joining ([7928c50](https://github.com/mikro-orm/mikro-orm/commit/7928c50a6f5a2fea9c593c3ef4d70a73942a6dba))
* **sql:** support composite keys in `EntityCaseNamingStrategy` ([8d07727](https://github.com/mikro-orm/mikro-orm/commit/8d077272e0d69b9eec52fd4efa8f29f7a0f01cfa))
* **sql:** use composite FKs instead in schema generator ([f5c2302](https://github.com/mikro-orm/mikro-orm/commit/f5c2302041bd52e7e746655dc70e38055a3a161c))
* **utils:** ts-node check now runs in a webpack environment ([#657](https://github.com/mikro-orm/mikro-orm/issues/657)) ([4384019](https://github.com/mikro-orm/mikro-orm/commit/438401935ce2a36e46cebaba7911b33d0cc11657))


### Features

* **core:** add `driver.nativeInsertMany()` method ([#688](https://github.com/mikro-orm/mikro-orm/issues/688)) ([78b2341](https://github.com/mikro-orm/mikro-orm/commit/78b2341bb08214858d53c80594d47e7fe8d10edd)), closes [#442](https://github.com/mikro-orm/mikro-orm/issues/442)
* **core:** add `em.begin/commit/rollback` methods ([#717](https://github.com/mikro-orm/mikro-orm/issues/717)) ([5414c52](https://github.com/mikro-orm/mikro-orm/commit/5414c5224cf018f5ac38aac9b56c42eb2b5df324))
* **core:** add `EntityRepositoryType` symbol ([#698](https://github.com/mikro-orm/mikro-orm/issues/698)) ([ffae0a8](https://github.com/mikro-orm/mikro-orm/commit/ffae0a827025060963bf7599f0ed8d17633eadd2)), closes [#696](https://github.com/mikro-orm/mikro-orm/issues/696)
* **core:** add `expr` helper to allow custom expressions in EM API ([39ced1b](https://github.com/mikro-orm/mikro-orm/commit/39ced1b8e4f088e2806721247ac56349c15f1ef8)), closes [#802](https://github.com/mikro-orm/mikro-orm/issues/802)
* **core:** add property serializers ([3d94b93](https://github.com/mikro-orm/mikro-orm/commit/3d94b936bc7d1ca2fe0b355c272c22413b6dcfd1)), closes [#809](https://github.com/mikro-orm/mikro-orm/issues/809)
* **core:** add support for entity and property comment ([#668](https://github.com/mikro-orm/mikro-orm/issues/668)) ([c01b338](https://github.com/mikro-orm/mikro-orm/commit/c01b3386f8592fbbde204e02b38889ae3d80b0c0))
* **core:** add support for filters/scopes ([#663](https://github.com/mikro-orm/mikro-orm/issues/663)) ([c1025b9](https://github.com/mikro-orm/mikro-orm/commit/c1025b9de77d59f43e4786cbc56a792134bf8696)), closes [#385](https://github.com/mikro-orm/mikro-orm/issues/385)
* **core:** add support for flush events ([#642](https://github.com/mikro-orm/mikro-orm/issues/642)) ([1f12aff](https://github.com/mikro-orm/mikro-orm/commit/1f12affaf532e86cb75abc66e7e04f1f2a5ac0c7)), closes [#637](https://github.com/mikro-orm/mikro-orm/issues/637)
* **core:** add support for ordering by NULLS ([#677](https://github.com/mikro-orm/mikro-orm/issues/677)) ([74ee0cb](https://github.com/mikro-orm/mikro-orm/commit/74ee0cb1ccaac26fb4742d2ed6ae9f7c184ddf8c)), closes [#675](https://github.com/mikro-orm/mikro-orm/issues/675)
* **core:** allow persisting 1:m collections ([#686](https://github.com/mikro-orm/mikro-orm/issues/686)) ([379b289](https://github.com/mikro-orm/mikro-orm/commit/379b2891a1a71467db3ad0fb50ba328a09913a7b)), closes [#467](https://github.com/mikro-orm/mikro-orm/issues/467)
* **core:** allow using `knex.raw` in query params ([e6b9f0e](https://github.com/mikro-orm/mikro-orm/commit/e6b9f0ef696b0c13693222cbb6a843930f525812)), closes [#802](https://github.com/mikro-orm/mikro-orm/issues/802)
* **core:** allow using destructing assignments in entity ctors ([06a5490](https://github.com/mikro-orm/mikro-orm/commit/06a54908db89b9f438d8ce9308045a6c383b8120)), closes [#781](https://github.com/mikro-orm/mikro-orm/issues/781)
* **core:** execute hooks via `EventManager` ([#623](https://github.com/mikro-orm/mikro-orm/issues/623)) ([6a7f627](https://github.com/mikro-orm/mikro-orm/commit/6a7f6278a955ad4ace6dc398487db25a7c58d70e)), closes [#622](https://github.com/mikro-orm/mikro-orm/issues/622)
* **core:** expose populate parameter in `wrap(e).init()` ([d33432a](https://github.com/mikro-orm/mikro-orm/commit/d33432abdbf92060d4946f1a408f94eb51bfab87)), closes [#814](https://github.com/mikro-orm/mikro-orm/issues/814)
* **core:** readonly entity ([#738](https://github.com/mikro-orm/mikro-orm/issues/738)) ([7581592](https://github.com/mikro-orm/mikro-orm/commit/7581592644ac2c3be2fc98fdc3eb89afc67112f2))
* **core:** refactor internal dependencies to support Yarn PnP ([#645](https://github.com/mikro-orm/mikro-orm/issues/645)) ([7e21bb8](https://github.com/mikro-orm/mikro-orm/commit/7e21bb8ac64c235083708a522fdca60d458aaeb6))
* **core:** refactor merging to allow querying by custom type ([#800](https://github.com/mikro-orm/mikro-orm/issues/800)) ([bfbc5f8](https://github.com/mikro-orm/mikro-orm/commit/bfbc5f8df4c6b541983dfefb75467be5dc3b8901)), closes [#739](https://github.com/mikro-orm/mikro-orm/issues/739)
* **core:** support globs in `entities` ([#618](https://github.com/mikro-orm/mikro-orm/issues/618)) ([ee81b61](https://github.com/mikro-orm/mikro-orm/commit/ee81b618cc8dc53fc026be2533843f92a8353b3b)), closes [#605](https://github.com/mikro-orm/mikro-orm/issues/605)
* **core:** type safe references ([#691](https://github.com/mikro-orm/mikro-orm/issues/691)) ([77d64ba](https://github.com/mikro-orm/mikro-orm/commit/77d64ba4a137b14dd665a1e1b7cc400cbb6aa399)), closes [#214](https://github.com/mikro-orm/mikro-orm/issues/214)
* **core:** use custom errors for failHandler and metadata ([6db22af](https://github.com/mikro-orm/mikro-orm/commit/6db22af044aa1181050675ff04184ccb37d38bb5)), closes [#611](https://github.com/mikro-orm/mikro-orm/issues/611)
* **migrations:** add `Migration.execute()` method ([5c1f60a](https://github.com/mikro-orm/mikro-orm/commit/5c1f60aeeb128c2dfedfa08cc9b98d05c1582434)), closes [#770](https://github.com/mikro-orm/mikro-orm/issues/770)
* **migrations:** add support for initial migrations ([#818](https://github.com/mikro-orm/mikro-orm/issues/818)) ([26b2228](https://github.com/mikro-orm/mikro-orm/commit/26b2228740b1b47a73e3e037f210ebe0b64fefd9)), closes [#772](https://github.com/mikro-orm/mikro-orm/issues/772)
* **migrations:** allow specifying list of migrations ([#741](https://github.com/mikro-orm/mikro-orm/issues/741)) ([5a0f2a6](https://github.com/mikro-orm/mikro-orm/commit/5a0f2a6caebff1d40b47fcb49adb15d87413b4b8)), closes [#705](https://github.com/mikro-orm/mikro-orm/issues/705)
* **migrations:** allow using knex in migrations ([fc2fbaa](https://github.com/mikro-orm/mikro-orm/commit/fc2fbaac425ec608b0108c3128d23f9115707f99)), closes [#799](https://github.com/mikro-orm/mikro-orm/issues/799)
* **postgres:** add `$ilike`, `$overlap`, `$contains`, `$contained` ([3c59885](https://github.com/mikro-orm/mikro-orm/commit/3c59885a7bf8fc87f69f9bbb2c46012094b08f70)), closes [#641](https://github.com/mikro-orm/mikro-orm/issues/641)
* **query-builder:** allow ordering by custom expressions ([e4674c7](https://github.com/mikro-orm/mikro-orm/commit/e4674c7cfed8642d10e80ef75afed32b006f7faa)), closes [#707](https://github.com/mikro-orm/mikro-orm/issues/707)
* **query-builder:** make sure we do not prefix virtual props ([fd0766c](https://github.com/mikro-orm/mikro-orm/commit/fd0766c0b202f27c3379f7bbfc5322cd648cbfc6)), closes [#734](https://github.com/mikro-orm/mikro-orm/issues/734)
* **cli:** allow the use of TS path mapping ([#554](https://github.com/mikro-orm/mikro-orm/issues/554)) ([2444192](https://github.com/mikro-orm/mikro-orm/commit/2444192907374e984ff972e5754df667860da3f5))
* **core:** accept references in collection `add/remove/set` methods ([26d132f](https://github.com/mikro-orm/mikro-orm/commit/26d132faa9ec7cfea5e7dd0bf2585bd90bb56d59))
* **core:** add `connect: boolean` param to `MikroORM.init()` ([43a9ce9](https://github.com/mikro-orm/mikro-orm/commit/43a9ce9c108945b1b48677919113e4a2c1c3886e))
* **core:** add `having` to `FindOptions` ([952fd2f](https://github.com/mikro-orm/mikro-orm/commit/952fd2fe7ba619a0906133694e4888f57ad8cecc))
* **core:** add custom types for array, blob and json ([#559](https://github.com/mikro-orm/mikro-orm/issues/559)) ([7703cc5](https://github.com/mikro-orm/mikro-orm/commit/7703cc5fa5fa88fce8b589d0a51c8601211cc9f5)), closes [#476](https://github.com/mikro-orm/mikro-orm/issues/476)
* **core:** add pagination support (`QueryFlag.PAGINATE`) ([#544](https://github.com/mikro-orm/mikro-orm/issues/544)) ([d43241e](https://github.com/mikro-orm/mikro-orm/commit/d43241e4c5d36c38b3698bd586462d1d1c6126c7))
* **core:** add support for alternative loading strategies ([#556](https://github.com/mikro-orm/mikro-orm/issues/556)) ([0b89d4a](https://github.com/mikro-orm/mikro-orm/commit/0b89d4af61e3baf9d6be0b8ab1c16be7d337b8a5)), closes [#440](https://github.com/mikro-orm/mikro-orm/issues/440)
* **core:** add support for event subscribers ([#614](https://github.com/mikro-orm/mikro-orm/issues/614)) ([1281356](https://github.com/mikro-orm/mikro-orm/commit/1281356e94bcd93f3bb265bca784a0a25bd70cb5)), closes [#516](https://github.com/mikro-orm/mikro-orm/issues/516)
* **core:** add support for lazy scalar properties ([#585](https://github.com/mikro-orm/mikro-orm/issues/585)) ([cd8c683](https://github.com/mikro-orm/mikro-orm/commit/cd8c6833964d3cddf5b8d645a65839ee98bd1e8c)), closes [#427](https://github.com/mikro-orm/mikro-orm/issues/427)
* **core:** add support for Node.js 14 ([#522](https://github.com/mikro-orm/mikro-orm/issues/522)) ([2093af8](https://github.com/mikro-orm/mikro-orm/commit/2093af80e9973b998477cb67a235060e417cb8cd))
* **core:** add support for single table inheritance ([#503](https://github.com/mikro-orm/mikro-orm/issues/503)) ([8c45339](https://github.com/mikro-orm/mikro-orm/commit/8c453390457df6d915d11dcaaf26b83f6f549254)), closes [#33](https://github.com/mikro-orm/mikro-orm/issues/33)
* **core:** allow adding items to not initialized collections ([#489](https://github.com/mikro-orm/mikro-orm/issues/489)) ([8be8a4d](https://github.com/mikro-orm/mikro-orm/commit/8be8a4d5664005c137e1293c7907aa233e874324))
* **core:** allow adding items to not initialized collections ([#489](https://github.com/mikro-orm/mikro-orm/issues/489)) ([ca5eb64](https://github.com/mikro-orm/mikro-orm/commit/ca5eb64e16138a8f9cb5f72d69c4da165c8d2a13))
* **core:** do not cache metadata for other than ts-morph provider ([#569](https://github.com/mikro-orm/mikro-orm/issues/569)) ([49fb4eb](https://github.com/mikro-orm/mikro-orm/commit/49fb4eb42e72d73efe42532283359bb3a351f635))
* **core:** pass entity as parameter in `onCreate` and `onUpdate` ([#564](https://github.com/mikro-orm/mikro-orm/issues/564)) ([3044a19](https://github.com/mikro-orm/mikro-orm/commit/3044a1919607ee4e27fe0fc57135e9cc1b919ff0))
* **core:** split project into multiple packages ([#475](https://github.com/mikro-orm/mikro-orm/issues/475)) ([636e861](https://github.com/mikro-orm/mikro-orm/commit/636e8610573bd0f0c69da6331d048213794114e3))
* **core:** use custom exceptions for driver related errors ([#539](https://github.com/mikro-orm/mikro-orm/issues/539)) ([2c30679](https://github.com/mikro-orm/mikro-orm/commit/2c30679dffcfa195f6d88f885885b975c3b6dfdf))
* **discovery:** use both entity name and path as key in Metadat… ([#488](https://github.com/mikro-orm/mikro-orm/issues/488)) ([72f0aca](https://github.com/mikro-orm/mikro-orm/commit/72f0acaac2b6451b319af3f00bbcc7721ad89821))
* **mapping:** add support for embeddables ([#514](https://github.com/mikro-orm/mikro-orm/issues/514)) ([0fa06b1](https://github.com/mikro-orm/mikro-orm/commit/0fa06b1490894b395de1987fa414a7ac00f97307))
* **migrations:** support custom migration names ([8ea71b6](https://github.com/mikro-orm/mikro-orm/commit/8ea71b6e53d3683f695646ce2813d8285e5a3687)), closes [#449](https://github.com/mikro-orm/mikro-orm/issues/449)
* **mongo:** add `getCollection()` method to `MongoEntityManager` ([79a9a7d](https://github.com/mikro-orm/mikro-orm/commit/79a9a7d2e83afc74ff1e3b0abdf41124134e542f))
* **mongo:** allow creating any kind of index in mongo ([8fbe48a](https://github.com/mikro-orm/mikro-orm/commit/8fbe48a8485595fbb3363a5c2e8725be9bc23957))
* **mongo:** allow using different primary key types than ObjectId ([#568](https://github.com/mikro-orm/mikro-orm/issues/568)) ([e523794](https://github.com/mikro-orm/mikro-orm/commit/e523794126ffec7b541bc3bf79d02d26f5afcc9e)), closes [#349](https://github.com/mikro-orm/mikro-orm/issues/349)
* **postgres:** use `jsonb` column type by default ([b6c0578](https://github.com/mikro-orm/mikro-orm/commit/b6c057800234531d1ee8323d31d3649a7abd4853))
* **sql:** add `execute()` method to `SqlEntityManager` ([e389d40](https://github.com/mikro-orm/mikro-orm/commit/e389d4015c580ec3cdc81836ae910899aa901552))
* **sql:** add `groupBy` to `FindOptions` ([2f6687a](https://github.com/mikro-orm/mikro-orm/commit/2f6687ababadde684f9ca1e6dfb2912bd658a95e))
* **sql:** add `qb.raw()` to allow using raw snippets in QB ([c09a5b6](https://github.com/mikro-orm/mikro-orm/commit/c09a5b661d4b06c94017a78acce1ccee8479417e)), closes [#598](https://github.com/mikro-orm/mikro-orm/issues/598)
* **sql:** add support for computed properties via `@Formula()` ([#553](https://github.com/mikro-orm/mikro-orm/issues/553)) ([68b9336](https://github.com/mikro-orm/mikro-orm/commit/68b9336aed3f098dea9c91fc3a060fb87449f0e0))
* **sql:** add support for sub-queries ([#525](https://github.com/mikro-orm/mikro-orm/issues/525)) ([e07f8ad](https://github.com/mikro-orm/mikro-orm/commit/e07f8ad2d474a3fe3d0084e1b24750d3bd2d5b0a))
* **sql:** allow delete queries with auto-joining via sub-queries ([#538](https://github.com/mikro-orm/mikro-orm/issues/538)) ([e44bc56](https://github.com/mikro-orm/mikro-orm/commit/e44bc56997fef12bd2d5f4e849e931694b1dc5d0)), closes [#492](https://github.com/mikro-orm/mikro-orm/issues/492)
* **sql:** allow update queries with auto-joining via sub-queries ([#537](https://github.com/mikro-orm/mikro-orm/issues/537)) ([cff9a3a](https://github.com/mikro-orm/mikro-orm/commit/cff9a3a1e758856a43fb188c5a5cb2e511f532dc)), closes [#319](https://github.com/mikro-orm/mikro-orm/issues/319)
* **sql:** ensure correct table order in schema generator ([#617](https://github.com/mikro-orm/mikro-orm/issues/617)) ([b3949cf](https://github.com/mikro-orm/mikro-orm/commit/b3949cf06c413cebbda4dabc5fdb91952b35bb36))
* **sql:** initialize query builder in select mode ([#565](https://github.com/mikro-orm/mikro-orm/issues/565)) ([3e3abe7](https://github.com/mikro-orm/mikro-orm/commit/3e3abe7eb2d76711dd7fe0490f4557ea0fa1fbf2))
* **ts-morph:** add ORM version to cache invalidation logic ([f28119a](https://github.com/mikro-orm/mikro-orm/commit/f28119a8271c3037053924d39816d74880687865))
* **ts-morph:** infer nullability from property types ([4c45e00](https://github.com/mikro-orm/mikro-orm/commit/4c45e00373b2110896660ffc24f37cf8f6b28f82))
* **ts-morph:** use `.d.ts` files for ts-morph discovery ([#616](https://github.com/mikro-orm/mikro-orm/issues/616)) ([54ce064](https://github.com/mikro-orm/mikro-orm/commit/54ce064a7c9d90432d1eaeca3619abd252da345c))


### Performance Improvements

* **cli:** transpile only when using ts-node in CLI ([f739f39](https://github.com/mikro-orm/mikro-orm/commit/f739f397affa89b3bfed7ff5aad14246f79ebb60))
* **core:** do not generate sql when logging disabled ([f232bb3](https://github.com/mikro-orm/mikro-orm/commit/f232bb32c35880a716571dc12c4162e0b963b436)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** implement bulk deletes ([#757](https://github.com/mikro-orm/mikro-orm/issues/757)) ([d83f648](https://github.com/mikro-orm/mikro-orm/commit/d83f648f2c0bb45667de737ca34a34ea292100b1)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** improve performance of QB a bit ([efc044f](https://github.com/mikro-orm/mikro-orm/commit/efc044fe2ca69d5cadb9579adaf1f34d57762605)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** improve speed of inserting new items ([bfeb2e3](https://github.com/mikro-orm/mikro-orm/commit/bfeb2e3ed80e546c4e4b96f768881ca931351201)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** optimize QB for simple cases ([99cfca7](https://github.com/mikro-orm/mikro-orm/commit/99cfca7f53ce7247cd32d5aea027b66a7a2ae5d5)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** reduce usage of `wrap` helper internally ([66ffc3b](https://github.com/mikro-orm/mikro-orm/commit/66ffc3be4e0a6ac02657131d8d81c2188c3389fb)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** simplify `MetadataStorage.find()` method ([9abbe03](https://github.com/mikro-orm/mikro-orm/commit/9abbe03b957e48dfb80ebf61c4268149bab3f72c)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use actual Map for identity maps ([3645a20](https://github.com/mikro-orm/mikro-orm/commit/3645a200afc064160d696288aa33a212d51da456)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use `Set` instead of array for cycle lookups ([dff0c9d](https://github.com/mikro-orm/mikro-orm/commit/dff0c9dc43baf13ca79fa0b30a044a91257996d6)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)
* **core:** use `Set` instead of array for stacks in UoW ([12ba811](https://github.com/mikro-orm/mikro-orm/commit/12ba8111d1e0a282fcb2bc5c0d3f2dd5ab2fa532)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)


### BREAKING CHANGES

Please see the [upgrading guide](https://mikro-orm.io/docs/upgrading-v3-to-v4).
