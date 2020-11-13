# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


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





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)


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





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


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



# [4.0.0](https://github.com/mikro-orm/mikro-orm/compare/v3.6.15...v4.0.0) (2020-09-08)

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

Please see the [upgrading guide](docs/docs/upgrading-v3-to-v4.md).



## [3.6.15](https://github.com/mikro-orm/mikro-orm/compare/v3.6.14...v3.6.15) (2020-06-05)


### Bug Fixes

* **core:** do not merge entity instances in `em.create()` ([30010f8](https://github.com/mikro-orm/mikro-orm/commit/30010f8f782f73fcd3c5be5746c3b1f65a4a419d))
* **core:** fix extracting PK out of reference wrapper ([79a4f5a](https://github.com/mikro-orm/mikro-orm/commit/79a4f5a4f990e4d00a87d35dad249bb647291291)), closes [#589](https://github.com/mikro-orm/mikro-orm/issues/589)
* **mapping:** support mixed M:N with composite PK on one side only ([a55ea22](https://github.com/mikro-orm/mikro-orm/commit/a55ea22ae2589350b876cc6da8f78a0981799e2d))



## [3.6.14](https://github.com/mikro-orm/mikro-orm/compare/v3.6.13...v3.6.14) (2020-05-21)


### Bug Fixes

* **core:** do not extend domain typings (collides with sentry) ([#563](https://github.com/mikro-orm/mikro-orm/issues/563)) ([e3cd0bd](https://github.com/mikro-orm/mikro-orm/commit/e3cd0bd8e5aebf9bc574dac09058f64b86cd7b2c))
* **core:** propagate PKs created via `prop.onCreate` ([#561](https://github.com/mikro-orm/mikro-orm/issues/561)) ([83873ec](https://github.com/mikro-orm/mikro-orm/commit/83873ec70c763e5e7dca524162e60da06dbc8539))
* **mapping:** fix handling of `fieldName` vs `joinColumn` in m:1/1:1 ([#573](https://github.com/mikro-orm/mikro-orm/issues/573)) ([6e2f200](https://github.com/mikro-orm/mikro-orm/commit/6e2f20048f1b45bed2615248a2c614722b6a5c0b))
* **validation:** throw when trying to call `em.flush()` from hooks ([#574](https://github.com/mikro-orm/mikro-orm/issues/574)) ([c3d0ce6](https://github.com/mikro-orm/mikro-orm/commit/c3d0ce6a1e2bbea14257cf118a20422294bd5283)), closes [#493](https://github.com/mikro-orm/mikro-orm/issues/493)



## [3.6.13](https://github.com/mikro-orm/mikro-orm/compare/v3.6.12...v3.6.13) (2020-05-03)


### Bug Fixes

* **core:** avoid evaluating virtual properties on find ([d234178](https://github.com/mikro-orm/mikro-orm/commit/d23417874f3d8934f026eb947ed03c3476714895)), closes [#535](https://github.com/mikro-orm/mikro-orm/issues/535)
* **core:** fix lazy initializing of composite PK collections ([a4c56ed](https://github.com/mikro-orm/mikro-orm/commit/a4c56ed7b05d4ceef87ce3b554351ff4d31241b2)), closes [#529](https://github.com/mikro-orm/mikro-orm/issues/529)
* **core:** fix propagation of query when populating ([23b2d06](https://github.com/mikro-orm/mikro-orm/commit/23b2d0616a2b36ca3a92b6ac22d8cfb8d070238b)), closes [#533](https://github.com/mikro-orm/mikro-orm/issues/533)
* **schema:** support empty string in `@Property({ default: '' })` ([4ec19c7](https://github.com/mikro-orm/mikro-orm/commit/4ec19c737d1b630559aa575dc262e1454b10ad8a)), closes [#534](https://github.com/mikro-orm/mikro-orm/issues/534)



## [3.6.12](https://github.com/mikro-orm/mikro-orm/compare/v3.6.11...v3.6.12) (2020-04-28)


### Bug Fixes

* **core:** fix `qb.count()` with composite keys ([#520](https://github.com/mikro-orm/mikro-orm/issues/520)) ([51f229a](https://github.com/mikro-orm/mikro-orm/commit/51f229a0779ff527e4594f80b9fc4b8726ca361a))
* **mapping:** do not require method definitions in `EntitySchema` ([58c9643](https://github.com/mikro-orm/mikro-orm/commit/58c96430d84c67415c21bc1265874e88c79736db)), closes [#512](https://github.com/mikro-orm/mikro-orm/issues/512)
* **mongo:** restrict object id conversion only to known properties ([86cd027](https://github.com/mikro-orm/mikro-orm/commit/86cd0277d048021ee244c3cf3537afc187d69683)), closes [#401](https://github.com/mikro-orm/mikro-orm/issues/401)
* **schema:** use `utf8mb4` charset in mysql schema ([82fa93d](https://github.com/mikro-orm/mikro-orm/commit/82fa93dde0c9b303213aad1d750b325b4f95d050)), closes [#513](https://github.com/mikro-orm/mikro-orm/issues/513)



## [3.6.11](https://github.com/mikro-orm/mikro-orm/compare/v3.6.10...v3.6.11) (2020-04-23)


### Bug Fixes

* **core:** throw when trying to call `em.remove(..., null)` ([f6e3a39](https://github.com/mikro-orm/mikro-orm/commit/f6e3a3943511200718b6c127b4d16c804cd8c57a))
* **schema:** improve diffing of nullable columns ([#508](https://github.com/mikro-orm/mikro-orm/issues/508)) ([166a29f](https://github.com/mikro-orm/mikro-orm/commit/166a29fa388da528b1ad0e8d5ff5fc460e61ef92)), closes [#507](https://github.com/mikro-orm/mikro-orm/issues/507)



## [3.6.10](https://github.com/mikro-orm/mikro-orm/compare/v3.6.9...v3.6.10) (2020-04-22)


### Bug Fixes

* **core:** do not run `onUpdate` when persisting new entity ([10c0c40](https://github.com/mikro-orm/mikro-orm/commit/10c0c40b5c3d86bc8841d81c4df7392ed4f0e3c8)), closes [#504](https://github.com/mikro-orm/mikro-orm/issues/504)
* **postgres:** do not map returned values that are already present ([99a4f01](https://github.com/mikro-orm/mikro-orm/commit/99a4f0141a7686ede4646e65613d35efa5441e73)), closes [#501](https://github.com/mikro-orm/mikro-orm/issues/501) [#465](https://github.com/mikro-orm/mikro-orm/issues/465)



## [3.6.9](https://github.com/mikro-orm/mikro-orm/compare/v3.6.8...v3.6.9) (2020-04-19)


### Bug Fixes

* **mariadb:** fix diffing nullable columns in mariadb 10.4 ([#496](https://github.com/mikro-orm/mikro-orm/issues/496)) ([c36b495](https://github.com/mikro-orm/mikro-orm/commit/c36b495244c4b5f861c7c3c20c1b401161baf877)), closes [#491](https://github.com/mikro-orm/mikro-orm/issues/491)
* **schema:** fix handling of FKs in updateSchema() ([#498](https://github.com/mikro-orm/mikro-orm/issues/498)) ([72088ba](https://github.com/mikro-orm/mikro-orm/commit/72088baf3cef9b0112f2dd6da1601b37d7f13fa5)), closes [#494](https://github.com/mikro-orm/mikro-orm/issues/494)



## [3.6.8](https://github.com/mikro-orm/mikro-orm/compare/v3.6.7...v3.6.8) (2020-04-18)


### Bug Fixes

* **core:** do not override internal copy of entity data when merging ([40830d5](https://github.com/mikro-orm/mikro-orm/commit/40830d52781747dc365ccb45bc2af47406b46f2b)), closes [#486](https://github.com/mikro-orm/mikro-orm/issues/486)
* **core:** ignore removed entities during commit discovery ([7581a3d](https://github.com/mikro-orm/mikro-orm/commit/7581a3d5a3e8ce9889989ea20ef3a4add7d5b63e))



## [3.6.7](https://github.com/mikro-orm/mikro-orm/compare/v3.6.6...v3.6.7) (2020-04-16)


### Bug Fixes

* **core:** do not propagate remove action to m:1 with orphan removal ([94c71c8](https://github.com/mikro-orm/mikro-orm/commit/94c71c89a648e03fad38a93cced7fa92bbfd7ff7)), closes [#482](https://github.com/mikro-orm/mikro-orm/issues/482)
* **core:** export `AbstractSqlConnection` from `mikro-orm` ([d38cdde](https://github.com/mikro-orm/mikro-orm/commit/d38cdde26b21fc59c2ffdc5c58688ca2299f5183)), closes [#483](https://github.com/mikro-orm/mikro-orm/issues/483)
* **metadata:** fix validation of inversedBy/mappedBy ([d2c3ce6](https://github.com/mikro-orm/mikro-orm/commit/d2c3ce6552069106cc67c86036c349fcf68da769))


### Features

* **mongo:** add support for mongodb text indexes ([#481](https://github.com/mikro-orm/mikro-orm/issues/481)) ([75f20f6](https://github.com/mikro-orm/mikro-orm/commit/75f20f6ad7627313a9a340789d581534d95dbaee))
* **mongo:** add support for nullable unique indexes ([#485](https://github.com/mikro-orm/mikro-orm/issues/485)) ([e8424a0](https://github.com/mikro-orm/mikro-orm/commit/e8424a032a3c01a11bea7701cdf0553666f3e71c))



## [3.6.6](https://github.com/mikro-orm/mikro-orm/compare/v3.6.5...v3.6.6) (2020-04-12)


### Bug Fixes

* **discovery:** ignore files that does not return classes ([0226137](https://github.com/mikro-orm/mikro-orm/commit/02261378f7dc37e6d7fb33c3dd591681801e9481)), closes [#474](https://github.com/mikro-orm/mikro-orm/issues/474)
* **postgres:** handle case sensitive table names correctly ([aa3a087](https://github.com/mikro-orm/mikro-orm/commit/aa3a087181ecb780d8db064057c5ea85ae130a5d)), closes [#472](https://github.com/mikro-orm/mikro-orm/issues/472)
* **sql:** do not prefix virtual columns in QueryBuilder ([38eaae3](https://github.com/mikro-orm/mikro-orm/commit/38eaae3bece1623f33125af3877520ffe43bdf49)), closes [#473](https://github.com/mikro-orm/mikro-orm/issues/473)
* **typings:** improve support for Reference wrapper in FilterQuery ([7497c45](https://github.com/mikro-orm/mikro-orm/commit/7497c45d49fcc167a9757bbe400642086d7d4e42))



## [3.6.5](https://github.com/mikro-orm/mikro-orm/compare/v3.6.4...v3.6.5) (2020-04-08)


### Bug Fixes

* **core:** do not take snapshots of collection in `assign()` ([b9fe617](https://github.com/mikro-orm/mikro-orm/commit/b9fe617a3003caa3db996593d732af1f18f56e47)), closes [#467](https://github.com/mikro-orm/mikro-orm/issues/467)
* **typings:** add `customType` to PropertyOptions ([46edde0](https://github.com/mikro-orm/mikro-orm/commit/46edde06472d61908890ca09694f69315fc3f656))
* **typings:** improve typing of `PropertyOptions.type` ([587f81d](https://github.com/mikro-orm/mikro-orm/commit/587f81dd2a28677abc9c7db9aab4a9b952b715a0))
* **typings:** improve typing of onDelete and onUpdateIntegrity ([0a6ae55](https://github.com/mikro-orm/mikro-orm/commit/0a6ae5563d961133b4b941796a36c19b0778f4d7))



## [3.6.4](https://github.com/mikro-orm/mikro-orm/compare/v3.6.3...v3.6.4) (2020-04-07)


### Bug Fixes

* **core:** fix conversion of date strings to Date objects ([6342ff0](https://github.com/mikro-orm/mikro-orm/commit/6342ff0d9b1448b901af0be32cf9c5a6c16d5c69))
* **schema:** inherit indexes from base entities ([bae46c7](https://github.com/mikro-orm/mikro-orm/commit/bae46c7281cfd32490eb2af85c06def2005a4720)), closes [#463](https://github.com/mikro-orm/mikro-orm/issues/463)



## [3.6.3](https://github.com/mikro-orm/mikro-orm/compare/v3.6.2...v3.6.3) (2020-04-06)


### Bug Fixes

* **mapping:** support multiple base entities (A extends B extends C) ([6e72881](https://github.com/mikro-orm/mikro-orm/commit/6e72881cc937526ce341dabd9b46822ddab3ffaf)), closes [#459](https://github.com/mikro-orm/mikro-orm/issues/459)
* **mapping:** support returning knex.raw from custom type ([3dd41ad](https://github.com/mikro-orm/mikro-orm/commit/3dd41adfca37326fc8c1d5caee4dbbbd639858a0)), closes [#372](https://github.com/mikro-orm/mikro-orm/issues/372)



## [3.6.2](https://github.com/mikro-orm/mikro-orm/compare/v3.6.1...v3.6.2) (2020-04-04)


### Bug Fixes

* **cli:** respect `baseDir` in `migrations.path` ([943b0d9](https://github.com/mikro-orm/mikro-orm/commit/943b0d9b522e1351f90d3a55bc7a6d5a99e51710)), closes [#448](https://github.com/mikro-orm/mikro-orm/issues/448)
* **cli:** respect baseDir in debug command ([aa653f1](https://github.com/mikro-orm/mikro-orm/commit/aa653f1255d606440dfcea9fc2ed02d54c2cfd64)), closes [#447](https://github.com/mikro-orm/mikro-orm/issues/447)
* **core:** fix circular dependency in EntityGenerator ([b886abe](https://github.com/mikro-orm/mikro-orm/commit/b886abe5ad0759e011e6c5477547d2f41d4053af)), closes [#451](https://github.com/mikro-orm/mikro-orm/issues/451)
* **core:** map `prop.name` to `prop.fieldName` when it does not match ([98d4328](https://github.com/mikro-orm/mikro-orm/commit/98d43288ede21a1b8f7a13df26ee147ef042ba80))
* **mapping:** fix inference of chained PK column type ([05b86cf](https://github.com/mikro-orm/mikro-orm/commit/05b86cfa9fec42dbb408f90f64f0071bc1e56b8f)), closes [#446](https://github.com/mikro-orm/mikro-orm/issues/446)
* **migrations:** enforce single connection usage for transactions ([9fc1e25](https://github.com/mikro-orm/mikro-orm/commit/9fc1e25ba533461a7685874dd94632c98a44a507)), closes [#444](https://github.com/mikro-orm/mikro-orm/issues/444)
* **sql:** fix support for cross schema m:n collections ([36cf26c](https://github.com/mikro-orm/mikro-orm/commit/36cf26c00746c587dcd954dd167d2e0126341833)), closes [#450](https://github.com/mikro-orm/mikro-orm/issues/450)



## [3.6.1](https://github.com/mikro-orm/mikro-orm/compare/v3.6.0...v3.6.1) (2020-04-02)


### Bug Fixes

* **core:** do not call convertToJSValue when we already have an entity ([3cf3da6](https://github.com/mikro-orm/mikro-orm/commit/3cf3da60af7ba08279ae24a44694f4d123b4bc0b)), closes [#435](https://github.com/mikro-orm/mikro-orm/issues/435)
* **schema:** rework enum handling in schema generator ([#445](https://github.com/mikro-orm/mikro-orm/issues/445)) ([c041b54](https://github.com/mikro-orm/mikro-orm/commit/c041b549949b7493acc9276a9f6157a6dba0e019)), closes [#397](https://github.com/mikro-orm/mikro-orm/issues/397) [#432](https://github.com/mikro-orm/mikro-orm/issues/432)



# [3.6.0](https://github.com/mikro-orm/mikro-orm/compare/v3.5.2...v3.6.0) (2020-03-30)


### Bug Fixes

* **core:** fix explicit usage of `joinColumn` option ([bcf2546](https://github.com/mikro-orm/mikro-orm/commit/bcf2546662805d2104acf06c29f91810bc9efc7a)), closes [#425](https://github.com/mikro-orm/mikro-orm/issues/425)


### Features

* **core:** allow for the number zero as a primary key ([#426](https://github.com/mikro-orm/mikro-orm/issues/426)) ([88b979a](https://github.com/mikro-orm/mikro-orm/commit/88b979a22ac991df0a3d9401a153415ff928204f))
* **core:** improve ts-node detection ([f1afaa6](https://github.com/mikro-orm/mikro-orm/commit/f1afaa679a52ab3fb7689dd5603e2264b1aed6e7))
* **core:** support indexes in entity generator ([#437](https://github.com/mikro-orm/mikro-orm/issues/437)) ([90c0162](https://github.com/mikro-orm/mikro-orm/commit/90c0162af0e49574e1fdfa87504634716d1dba46)), closes [#421](https://github.com/mikro-orm/mikro-orm/issues/421)
* **schema:** add `safe` and `dropTables` options to schema generator ([2d2c73d](https://github.com/mikro-orm/mikro-orm/commit/2d2c73d550cc5afcc72af9cf687da0746dbe76ef)), closes [#416](https://github.com/mikro-orm/mikro-orm/issues/416)



## [3.5.2](https://github.com/mikro-orm/mikro-orm/compare/v3.5.1...v3.5.2) (2020-03-23)


### Bug Fixes

* **mapping:** respect columnType option ([e96d63d](https://github.com/mikro-orm/mikro-orm/commit/e96d63da1c885726b911175c19dca55de48cdc7a)), closes [#420](https://github.com/mikro-orm/mikro-orm/issues/420)
* **sql:** simplify transactions handling with knex ([9a5763b](https://github.com/mikro-orm/mikro-orm/commit/9a5763b494f2fa7d28720098c913e23700f8b0d7))



## [3.5.1](https://github.com/mikro-orm/mikro-orm/compare/v3.5.0...v3.5.1) (2020-03-22)


### Bug Fixes

* **mysql:** add timezone config option and fix TZ docs ([e0a5597](https://github.com/mikro-orm/mikro-orm/commit/e0a5597d4ba849eaba4708260802b7d0cba3f973)), closes [#418](https://github.com/mikro-orm/mikro-orm/issues/418)
* **typings:** simplify `FilterQuery` type, remove `UnionOfArrays` ([d919eec](https://github.com/mikro-orm/mikro-orm/commit/d919eecfed55ed4357b4997ad7778b46e8eabcb1))



# [3.5.0](https://github.com/mikro-orm/mikro-orm/compare/v3.4.1...v3.5.0) (2020-03-21)


### Bug Fixes

* **core:** export ValidationError directly ([e3e02ea](https://github.com/mikro-orm/mikro-orm/commit/e3e02ea566703d3bfa36429095a92d96f0c01a22)), closes [#404](https://github.com/mikro-orm/mikro-orm/issues/404)
* **mongodb:** do not convert payloads to ObjectId ([9a9d9e0](https://github.com/mikro-orm/mikro-orm/commit/9a9d9e00c5f8ce140d59a1df163094753b57fb69)), closes [#401](https://github.com/mikro-orm/mikro-orm/issues/401)
* **mongodb:** keep topmost transaction context when nesting ([d921bc1](https://github.com/mikro-orm/mikro-orm/commit/d921bc1c32327511c03d732d9e113b75aae89aa3)), closes [#400](https://github.com/mikro-orm/mikro-orm/issues/400)
* **schema:** fix schema generator in MySQL 8 ([#398](https://github.com/mikro-orm/mikro-orm/issues/398)) ([955b0ac](https://github.com/mikro-orm/mikro-orm/commit/955b0acc2c9952e40f52aebe193ab671adf635e2))
* **sql:** do not serialize db values from custom types ([894e055](https://github.com/mikro-orm/mikro-orm/commit/894e0553ec7285e67be4332f12c8404bb3ecb2e8)), closes [#372](https://github.com/mikro-orm/mikro-orm/issues/372)
* **webpack:** do not analyze enum values when already provided ([3efd6ca](https://github.com/mikro-orm/mikro-orm/commit/3efd6ca07dfa5c6226ce44bdc10aec330f274825)), closes [#413](https://github.com/mikro-orm/mikro-orm/issues/413)


### Features

* **core:** add support for composite keys ([#395](https://github.com/mikro-orm/mikro-orm/issues/395)) ([0574dc8](https://github.com/mikro-orm/mikro-orm/commit/0574dc89ed5b9045cace5c1287e7c54d05ca9086)), closes [#66](https://github.com/mikro-orm/mikro-orm/issues/66)
* **core:** allow manually specifying on update/on delete clause ([fc9d86a](https://github.com/mikro-orm/mikro-orm/commit/fc9d86a418d1cf3d9b8275c46988cbf3dc3b43d0))
* **discovery:** validate not discovered entities used in relations ([12338da](https://github.com/mikro-orm/mikro-orm/commit/12338dadc2dea1a1a88806cd09233b2b368491bf))
* **migrations:** do not create empty migrations without -b ([564e988](https://github.com/mikro-orm/mikro-orm/commit/564e9881ddda8dfd4041dbb49cc0245ebf417565)), closes [#399](https://github.com/mikro-orm/mikro-orm/issues/399)
* **mongo:** allow passing additional index options ([dd3f795](https://github.com/mikro-orm/mikro-orm/commit/dd3f79507cf73d4006d45163a9e9e30e2665d86d)), closes [#415](https://github.com/mikro-orm/mikro-orm/issues/415)
* **sql:** use collection snapshots to compute precise diff ([#405](https://github.com/mikro-orm/mikro-orm/issues/405)) ([d4bda99](https://github.com/mikro-orm/mikro-orm/commit/d4bda99fb5532142f92404a90ba683b222739a85))



## [3.4.1](https://github.com/mikro-orm/mikro-orm/compare/v3.4.0...v3.4.1) (2020-03-09)


### Bug Fixes

* **build:** ignore MongoDB data directory ([#394](https://github.com/mikro-orm/mikro-orm/issues/394)) ([fea6df0](https://github.com/mikro-orm/mikro-orm/commit/fea6df0c71608976400571a7c6b0a8b0e6983597))
* **postgres:** ignore other than the current schema ([c05bec1](https://github.com/mikro-orm/mikro-orm/commit/c05bec1bd2ebbe24f5f8e9055de0db1c57ae106d)), closes [#386](https://github.com/mikro-orm/mikro-orm/issues/386)



# [3.4.0](https://github.com/mikro-orm/mikro-orm/compare/v3.3.6...v3.4.0) (2020-03-08)


### Features

* **migrations:** add support for JS migrations ([#384](https://github.com/mikro-orm/mikro-orm/issues/384)) ([b41f0bc](https://github.com/mikro-orm/mikro-orm/commit/b41f0bce01b90c1d15581b17f15ff6042f2e521d))
* **mongo:** add support for transactions in mongodb ([#392](https://github.com/mikro-orm/mikro-orm/issues/392)) ([8988202](https://github.com/mikro-orm/mikro-orm/commit/8988202259e9d58a16588af92a9f4e50a7fb8fe3)), closes [#34](https://github.com/mikro-orm/mikro-orm/issues/34)
* **mongo:** add support for indexes in mongo driver ([#393](https://github.com/mikro-orm/mikro-orm/issues/393)) ([7155549](https://github.com/mikro-orm/mikro-orm/commit/71555494c7a20fc90fe8452905981426caefdaf7)), closes [#159](https://github.com/mikro-orm/mikro-orm/issues/159)
* **sql:** add `schema` param to `FindOptions` and QB ([#388](https://github.com/mikro-orm/mikro-orm/issues/388)) ([0c8ef92](https://github.com/mikro-orm/mikro-orm/commit/0c8ef929ea99e448190473af329a78c53814e5b2)), closes [#284](https://github.com/mikro-orm/mikro-orm/issues/284)
* **sql:** add support for bigint ([#389](https://github.com/mikro-orm/mikro-orm/issues/389)) ([5ddd573](https://github.com/mikro-orm/mikro-orm/commit/5ddd5734c1bc7e51ec36c2b75aa3056223feb279)), closes [#361](https://github.com/mikro-orm/mikro-orm/issues/361)



## [3.3.6](https://github.com/mikro-orm/mikro-orm/compare/v3.3.5...v3.3.6) (2020-03-06)


### Bug Fixes

* **core:** add `tableName` alias for `collection` ([9d19263](https://github.com/mikro-orm/mikro-orm/commit/9d19263f264248e95aa49ac9c8e8da6cd53b2d71))
* **core:** make `dbName` optional (infer from `clientUrl`) ([30427c5](https://github.com/mikro-orm/mikro-orm/commit/30427c5b205cf6e35d81b427334c261e253c7fff))
* **mysql:** normalize `false` to `0` in defaults ([caff3fd](https://github.com/mikro-orm/mikro-orm/commit/caff3fd3b5efa1f86df9d03a39e00df871632c3e))
* **postgres:** fix mapping of `double` type ([8f0547f](https://github.com/mikro-orm/mikro-orm/commit/8f0547f15b476c7b81124507c5f49acf769c5afe))
* **schema:** postpone FK constraints in schema updates ([d0c5fdf](https://github.com/mikro-orm/mikro-orm/commit/d0c5fdfe727913f41b59348628ba32ceeb6fe210)), closes [#327](https://github.com/mikro-orm/mikro-orm/issues/327)
* **sqlite:** support pivot tables with composite key ([25598e2](https://github.com/mikro-orm/mikro-orm/commit/25598e260b97ccba5b59b43c78f719905f8050b7)), closes [#382](https://github.com/mikro-orm/mikro-orm/issues/382)



## [3.3.5](https://github.com/mikro-orm/mikro-orm/compare/v3.3.4...v3.3.5) (2020-03-03)


### Bug Fixes

* **core:** improve default value handling in postgres ([#381](https://github.com/mikro-orm/mikro-orm/issues/381)) ([154aab2](https://github.com/mikro-orm/mikro-orm/commit/154aab2f6752890cb0b34a97602b60ca78591f56)), closes [#380](https://github.com/mikro-orm/mikro-orm/issues/380)
* **mapping:** infer correct type of enums with ts-morph ([2aae486](https://github.com/mikro-orm/mikro-orm/commit/2aae48673827b8e49711072ca1049bf8171bf5ff))
* **mapping:** throw when only abstract entities were discovered ([00d7543](https://github.com/mikro-orm/mikro-orm/commit/00d754368be5f812f37b84cc6f8211cd0c672ebb))
* **utils:** improve path detection based in decorators ([#378](https://github.com/mikro-orm/mikro-orm/issues/378)) ([c3c5a43](https://github.com/mikro-orm/mikro-orm/commit/c3c5a4305da8c8accd9545665a4448b4ac35b44a))
* **validation:** throw when multiple property decorators are used ([5a8d3f2](https://github.com/mikro-orm/mikro-orm/commit/5a8d3f2dce5e1c0a4dd381326a1d38cfb94ed96d))



## [3.3.4](https://github.com/mikro-orm/mikro-orm/compare/v3.3.3...v3.3.4) (2020-03-02)


### Bug Fixes

* **core:** do not cascade persist removed entities ([d2fd33f](https://github.com/mikro-orm/mikro-orm/commit/d2fd33fbbfc6b8b546885193e65160d7fb756e00)), closes [#369](https://github.com/mikro-orm/mikro-orm/issues/369)
* **query-builder:** substitute top level operators with primary keys ([861a0ca](https://github.com/mikro-orm/mikro-orm/commit/861a0caec690b902528163e7053fe671c0262583))



## [3.3.3](https://github.com/mikro-orm/mikro-orm/compare/v3.3.2...v3.3.3) (2020-02-27)


### Bug Fixes

* **core:** allow entity in constructor params in em.create() ([2846ab4](https://github.com/mikro-orm/mikro-orm/commit/2846ab4764c42927667f3bb220b8e0f4bb4a1f10))
* **mapping:** allow using custom types on primary keys ([ff2b7c9](https://github.com/mikro-orm/mikro-orm/commit/ff2b7c96cfdc25206902033265e3a1267711e3d1)), closes [#361](https://github.com/mikro-orm/mikro-orm/issues/361)
* **mapping:** create dirty collections via `em.create()` ([b864038](https://github.com/mikro-orm/mikro-orm/commit/b8640385aec7e3bb23edc6aeb4e185629b65d258))
* **mapping:** remove *Entity interfaces ([f5181b2](https://github.com/mikro-orm/mikro-orm/commit/f5181b2a42a5f1aa0100f1c49421929b8073403e))



## [3.3.2](https://github.com/mikro-orm/mikro-orm/compare/v3.3.1...v3.3.2) (2020-02-26)


### Bug Fixes

* **core:** make entity manager instance protected in repository ([477ed7b](https://github.com/mikro-orm/mikro-orm/commit/477ed7be6026b63e0248b4e67b5fcc3d15376f63)), closes [#367](https://github.com/mikro-orm/mikro-orm/issues/367)
* **utils:** treat Buffer as scalar when merging objects ([#366](https://github.com/mikro-orm/mikro-orm/issues/366)) ([c88e669](https://github.com/mikro-orm/mikro-orm/commit/c88e669295b57e0a36b52b3135191092ecaf45a6)), closes [#365](https://github.com/mikro-orm/mikro-orm/issues/365)



## [3.3.1](https://github.com/mikro-orm/mikro-orm/compare/v3.3.0...v3.3.1) (2020-02-25)


### Bug Fixes

* **mapping:** allow enum keys with names matching their value ([28315d0](https://github.com/mikro-orm/mikro-orm/commit/28315d0b4e514590cdebabc8aaf35f926901cfc4)), closes [#359](https://github.com/mikro-orm/mikro-orm/issues/359)



# [3.3.0](https://github.com/mikro-orm/mikro-orm/compare/v3.2.1...v3.3.0) (2020-02-25)


### Bug Fixes

* **core:** do not re-hydrate existing entities in `EntityFactory` ([a727052](https://github.com/mikro-orm/mikro-orm/commit/a727052f57f6eaf0789a985be1078cd089f3aaff))
* **core:** do not require entity reference to have collection props ([3331931](https://github.com/mikro-orm/mikro-orm/commit/33319311a0441c657b69ca46b00ccf3095388156))
* **deps:** update dependency `uuid` to v7 ([#355](https://github.com/mikro-orm/mikro-orm/issues/355)) ([f2a96aa](https://github.com/mikro-orm/mikro-orm/commit/f2a96aaecf20e76c8ea22e4f5f42ce3df8fd4449))


### Features

* **core:** add `loadItems()` method to `Collection` ([#347](https://github.com/mikro-orm/mikro-orm/issues/347)) ([de566c5](https://github.com/mikro-orm/mikro-orm/commit/de566c5cbb82b146dc87cf535151a31a1faa9365))
* **core:** propagate changes to 1:1 and m:1 relations ([#352](https://github.com/mikro-orm/mikro-orm/issues/352)) ([4903a48](https://github.com/mikro-orm/mikro-orm/commit/4903a48dfbd08aaa08f014d13f632474d1b2a6db)), closes [#307](https://github.com/mikro-orm/mikro-orm/issues/307)
* **core:** rework commit logic of UoW to ensure right query order ([#351](https://github.com/mikro-orm/mikro-orm/issues/351)) ([52e4b8a](https://github.com/mikro-orm/mikro-orm/commit/52e4b8aa5f7a9194b993aac0f77243babb810f2d))



## [3.2.1](https://github.com/mikro-orm/mikro-orm/compare/v3.2.0...v3.2.1) (2020-02-20)


### Bug Fixes

* **schema:** fix `@Index` and `@Unique` decorators on entity level ([c6e3646](https://github.com/mikro-orm/mikro-orm/commit/c6e36468b4016ab4b6829c7df4a89fdcff02f18d)), closes [#344](https://github.com/mikro-orm/mikro-orm/issues/344)



# [3.2.0](https://github.com/mikro-orm/mikro-orm/compare/v3.1.1...v3.2.0) (2020-02-19)


### Bug Fixes

* **cli:** do not require existing entities in generate-entities command ([4d5853f](https://github.com/mikro-orm/mikro-orm/commit/4d5853f9fa3c9832c9f9272a8e9624b71883f056)), closes [#340](https://github.com/mikro-orm/mikro-orm/issues/340)
* **discovery:** fix support for globbing ([995a3e8](https://github.com/mikro-orm/mikro-orm/commit/995a3e86e0b339023734b2f2cc01fb59a5da22db)), closes [#341](https://github.com/mikro-orm/mikro-orm/issues/341)
* **typing:** align EntityRepository populate signature to EntityManager ([#343](https://github.com/mikro-orm/mikro-orm/issues/343)) ([ec5a30e](https://github.com/mikro-orm/mikro-orm/commit/ec5a30e871b85705b2bdc30711e8b94b4a9634ad))


### Features

* **mapping:** allow defining schema via EntitySchema helper ([#335](https://github.com/mikro-orm/mikro-orm/issues/335)) ([6d1a24c](https://github.com/mikro-orm/mikro-orm/commit/6d1a24c4be1e1fd6c9d39489b61328a3bb15175e)), closes [#283](https://github.com/mikro-orm/mikro-orm/issues/283)
* **sql:** add @Index() and @Unique() decorators ([#331](https://github.com/mikro-orm/mikro-orm/issues/331)) ([6f86db3](https://github.com/mikro-orm/mikro-orm/commit/6f86db3b019e6b6bec8bc0bb8de6452ed0ca616a)), closes [#328](https://github.com/mikro-orm/mikro-orm/issues/328) [#226](https://github.com/mikro-orm/mikro-orm/issues/226)



## [3.1.1](https://github.com/mikro-orm/mikro-orm/compare/v3.1.0...v3.1.1) (2020-02-15)


### Bug Fixes

* **cli:** remove unused flag from `migration:create` ([45a8d48](https://github.com/mikro-orm/mikro-orm/commit/45a8d48045ef92360927f17496efae56b7849e43)), closes [#326](https://github.com/mikro-orm/mikro-orm/issues/326)
* **core:** add TS non-null assertion operator for non-nullable columns ([#323](https://github.com/mikro-orm/mikro-orm/issues/323)) ([e6d6f21](https://github.com/mikro-orm/mikro-orm/commit/e6d6f21804f6cc1d326e8822b1c991ebba23afe1))
* **core:** report failure of connection during initialization ([3153aa9](https://github.com/mikro-orm/mikro-orm/commit/3153aa974fe9b5adb235716df5e07e8a38c55303)), closes [#325](https://github.com/mikro-orm/mikro-orm/issues/325)
* **postgres:** map numeric columns to number properties automatically ([60c71a4](https://github.com/mikro-orm/mikro-orm/commit/60c71a4c26c12c230a5f77aa130574fc1940c6cb)), closes [#324](https://github.com/mikro-orm/mikro-orm/issues/324)


## [3.1.0](https://github.com/mikro-orm/mikro-orm/compare/v3.0.1...v3.1.0) (2020-01-27)


### Bug Fixes

* **core:** do not reset collections too early ([ad6337e](https://github.com/mikro-orm/mikro-orm/commit/ad6337e3df5a5a5c2283343e37f735814a4644a0)), closes [#312](https://github.com/mikro-orm/mikro-orm/issues/312)


### Features

* **core:** add `em.populate()` helper method ([26d2f33](https://github.com/mikro-orm/mikro-orm/commit/26d2f33d0619e7e3b5c2b3728815f8d2f5faf0ac)), closes [#310](https://github.com/mikro-orm/mikro-orm/issues/310)
* **core:** add `Reference.getEntity()` and `Reference.getProperty()` ([05dc5ce](https://github.com/mikro-orm/mikro-orm/commit/05dc5ceb00d96a1080a49c472edab1036d2370d7)), closes [#304](https://github.com/mikro-orm/mikro-orm/issues/304)



## [3.0.1](https://github.com/mikro-orm/mikro-orm/compare/v3.0.0...v3.0.1) (2020-01-23)

### Bug Fixes

* **core:** fix populate of 1:m with reference wrapper on inverse side ([d048b64](https://github.com/mikro-orm/mikro-orm/commit/d048b64af4f35c036d5cf96a656774f8056e23a4)), closes [#302](https://github.com/mikro-orm/mikro-orm/issues/302)
* **typing:** support reference wrapper in `FilterQuery` type ([950d996](https://github.com/mikro-orm/mikro-orm/commit/950d996acf1a9892d61fb7440e09f7d44d4de60f)), closes [#305](https://github.com/mikro-orm/mikro-orm/issues/305)



# [3.0.0](https://github.com/mikro-orm/mikro-orm/compare/v2.7.9...v3.0.0) (2020-01-15)

### Bug Fixes

* **core:** allow object constructor parameters in entities ([967f239](https://github.com/mikro-orm/mikro-orm/commit/967f239fbbd4aa6ca32f4cf66e0a2d6ac8686994)), closes [#166](https://github.com/mikro-orm/mikro-orm/issues/166)
* **core:** allow persisting 1:1 from inverse side ([a1320ba](https://github.com/mikro-orm/mikro-orm/commit/a1320baf3fece75de44199798acfbf65366e82a4)), closes [#210](https://github.com/mikro-orm/mikro-orm/issues/210)
* **core:** always ensure correct EM instance when merging entity ([72f4525](https://github.com/mikro-orm/mikro-orm/commit/72f4525e6d2048691fb0b9875a025ae5dfea7c5f))
* **core:** always init collections when creating entity via em.create() ([2500cf3](https://github.com/mikro-orm/mikro-orm/commit/2500cf3ef764f1f288cd62bb121c33f87ecc402e))
* **core:** always query inverse side of 1:1 association ([5a77a39](https://github.com/mikro-orm/mikro-orm/commit/5a77a39d923f7c7295012f18b6d2d4135061aeda))
* **core:** auto-wire 1:1 owner to inverse side ([b11d316](https://github.com/mikro-orm/mikro-orm/commit/b11d3161d1681ebc775a1eda8d3b2ba724c24479)), closes [#151](https://github.com/mikro-orm/mikro-orm/issues/151)
* **core:** disable auto flushing by default [BC] ([#79](https://github.com/mikro-orm/mikro-orm/issues/79)) ([3258c50](https://github.com/mikro-orm/mikro-orm/commit/3258c50e2dadf327a9ff1f03f1bf37f23c496a6f)), closes [#63](https://github.com/mikro-orm/mikro-orm/issues/63)
* **core:** do not map null value in bool props to false ([e54dbbd](https://github.com/mikro-orm/mikro-orm/commit/e54dbbd93ab056dd9903e72e67b552bcb38f2778)), closes [#262](https://github.com/mikro-orm/mikro-orm/issues/262)
* **core:** do not set EM to entity until merging [BC] ([#270](https://github.com/mikro-orm/mikro-orm/issues/270)) ([d09c3ab](https://github.com/mikro-orm/mikro-orm/commit/d09c3ab1debeaf5e701c0a069ababbd93d775d15)), closes [#267](https://github.com/mikro-orm/mikro-orm/issues/267)
* **core:** do not use request context in transactional/user forks ([a2d7cbb](https://github.com/mikro-orm/mikro-orm/commit/a2d7cbbd5eb75654d9551ef7784b435eaab8272c)), closes [#182](https://github.com/mikro-orm/mikro-orm/issues/182)
* **core:** fix querying by m:n primary keys ([cb568ee](https://github.com/mikro-orm/mikro-orm/commit/cb568ee04b4f585f87e84ee31ff6eae2ae908c4a)), closes [#234](https://github.com/mikro-orm/mikro-orm/issues/234)
* **core:** ignore inverse side of 1:1 when computing change set ([a2768dd](https://github.com/mikro-orm/mikro-orm/commit/a2768dd4eb8e66033b1748e227e1032c53e43064)), closes [#183](https://github.com/mikro-orm/mikro-orm/issues/183)
* **core:** make `em.find()` where parameter required ([3393d52](https://github.com/mikro-orm/mikro-orm/commit/3393d52a98f83169fe84eae1cfbf2d79aa4e7d62))
* **core:** make sure constructor params are sniffer from the constructor ([fdd157c](https://github.com/mikro-orm/mikro-orm/commit/fdd157ca21618611a010a100d6fddb882e09d0d2))
* **core:** `requireEntitiesArray` should be used only for validation ([066b0ea](https://github.com/mikro-orm/mikro-orm/commit/066b0eab58972d8bc5567ee131226472ec0e1ddb)), closes [#293](https://github.com/mikro-orm/mikro-orm/issues/293)
* **deps:** update dependency chalk to v3 ([#243](https://github.com/mikro-orm/mikro-orm/issues/243)) ([0a17eb7](https://github.com/mikro-orm/mikro-orm/commit/0a17eb7ba7d8711d20c6c9adcbe80a3f934ff5ff))
* **deps:** update dependency fast-deep-equal to v3 ([#250](https://github.com/mikro-orm/mikro-orm/issues/250)) ([546e950](https://github.com/mikro-orm/mikro-orm/commit/546e95023b36b7ca13b5aa6e4df56f0f7effbf08))
* **deps:** update dependency ts-morph to v4 ([#162](https://github.com/mikro-orm/mikro-orm/issues/162)) ([b6dd073](https://github.com/mikro-orm/mikro-orm/commit/b6dd07305b940b9db28af4a0711101a0f5744163))
* **deps:** update dependency ts-morph to v5 ([#229](https://github.com/mikro-orm/mikro-orm/issues/229)) ([ab66d9c](https://github.com/mikro-orm/mikro-orm/commit/ab66d9c1b2d1a34db747a5168c500d85ced64c8d))
* **deps:** update dependency yargs to v15 ([#244](https://github.com/mikro-orm/mikro-orm/issues/244)) ([0fe3a55](https://github.com/mikro-orm/mikro-orm/commit/0fe3a5592c2bb70e93a2f6cf2e1a0d4ac7a2cc37))
* **generator:** fixed default values and types for nullable properties ([#191](https://github.com/mikro-orm/mikro-orm/issues/191)) ([1cdccd3](https://github.com/mikro-orm/mikro-orm/commit/1cdccd3276bd5e4a3bcf2a1710996d6cb8829f40))
* **mapping:** do not override user defined nullable value in m:1 and 1:1 ([b22567d](https://github.com/mikro-orm/mikro-orm/commit/b22567d7878fcab51398bcebe8a888cdfc180eed))
* **mapping:** remove deprecated `fk` option from 1:m and m:1 decorators [BC] ([#87](https://github.com/mikro-orm/mikro-orm/issues/87)) ([99b436a](https://github.com/mikro-orm/mikro-orm/commit/99b436a2c53a7ef29d6db451f0262e4a1bd27f54))
* **mapping:** remove obsolete parameter in UnderscoreNamingStrategy ([#134](https://github.com/mikro-orm/mikro-orm/issues/134)) ([8afa9a7](https://github.com/mikro-orm/mikro-orm/commit/8afa9a7ef2f42cc5de2349c426a2ab07834cb3f2))
* **metadata:** fix lookup of path to entity file on windows with tslib ([a3c2900](https://github.com/mikro-orm/mikro-orm/commit/a3c29007e0734ff6de649b6c264bf29d02677ba6)), closes [#194](https://github.com/mikro-orm/mikro-orm/issues/194)
* **query-builder:** do not ignore parent operator in complex conditions ([b9c00bc](https://github.com/mikro-orm/mikro-orm/commit/b9c00bc61befa271d9007ed7cec8374ed134ba9a)), closes [#247](https://github.com/mikro-orm/mikro-orm/issues/247)
* **query-builder:** do not trigger auto-joining when not needed ([b7b7a46](https://github.com/mikro-orm/mikro-orm/commit/b7b7a46bdbd2710ebf901b075dd2b0c09739fd83)), closes [#249](https://github.com/mikro-orm/mikro-orm/issues/249)
* **query-builder:** fix malformed query when populate and join are used ([244db67](https://github.com/mikro-orm/mikro-orm/commit/244db6724635cecf9b2a29ac442a4b602e561723))
* **query-builder:** do not auto-join already auto-joined relation ([6895e08](https://github.com/mikro-orm/mikro-orm/commit/6895e08236865503ca1ebdd24647c3d38d42eb4e)), closes [#277](https://github.com/mikro-orm/mikro-orm/issues/277)
* **schema:** do not make FK fields nullable if not needed ([9c0ffc1](https://github.com/mikro-orm/mikro-orm/commit/9c0ffc1390ff9ce19f69ea54137977bff40f8d0b)), closes [#218](https://github.com/mikro-orm/mikro-orm/issues/218)
* **schema:** prefer user-defined collection names in naming strategy ([28f59ec](https://github.com/mikro-orm/mikro-orm/commit/28f59ec746f7ff99396d2cf337e6d78250b14f2e)), closes [#111](https://github.com/mikro-orm/mikro-orm/issues/111)
* **serializing:** add check for circular references in toObject() ([f7eaabb](https://github.com/mikro-orm/mikro-orm/commit/f7eaabb73f6f26c97bcc13f606a6bf328021cb81)), closes [#205](https://github.com/mikro-orm/mikro-orm/issues/205)
* **serializing:** do not ignore already visited collection items ([ee4b50b](https://github.com/mikro-orm/mikro-orm/commit/ee4b50b08d8cde789170df3182847771d5b2b30f)), closes [#222](https://github.com/mikro-orm/mikro-orm/issues/222)
* **sql:** support self-referencing m:n in pivot tables ([3157572](https://github.com/mikro-orm/mikro-orm/commit/3157572846befd24347e6645ccfbec0f411e934f))
* **sql:** support uuid like PKs in M:N references ([#272](https://github.com/mikro-orm/mikro-orm/issues/272)) ([2abc19f](https://github.com/mikro-orm/mikro-orm/commit/2abc19f770331d6d5a033f09297523217fb17217)), closes [#268](https://github.com/mikro-orm/mikro-orm/issues/268)
* **sql:** support $ne and $eq operators with null ([5f16f0a](https://github.com/mikro-orm/mikro-orm/commit/5f16f0a6e960442004cb802fd3550bbf64ac6722)), closes [#285](https://github.com/mikro-orm/mikro-orm/issues/285)


### Features

* **cli:** add `cache:generate` command to warm up production cache ([9b4f8b6](https://github.com/mikro-orm/mikro-orm/commit/9b4f8b687cc80e1299a164722c74982c3f963b10)), closes [#225](https://github.com/mikro-orm/mikro-orm/issues/225)
* **cli:** add `database:import` command to run external sql dumps ([aea3614](https://github.com/mikro-orm/mikro-orm/commit/aea3614f019d860c15603a839f0e7d5a58b785ae))
* **cli:** add `debug` command to help with setting up the CLI ([7919071](https://github.com/mikro-orm/mikro-orm/commit/7919071e4f64f0a205a45841c66813ee21866022)), closes [#136](https://github.com/mikro-orm/mikro-orm/issues/136)
* **cli:** add basic CLI tool ([#102](https://github.com/mikro-orm/mikro-orm/issues/102)) ([d20db41](https://github.com/mikro-orm/mikro-orm/commit/d20db41873786e8289fe7b10a42ef3f5e3dc433a)), closes [#101](https://github.com/mikro-orm/mikro-orm/issues/101)
* **cli:** allow specifying path to tsconfig.json ([00a1a4d](https://github.com/mikro-orm/mikro-orm/commit/00a1a4ddcac1d60bc77f36b460bcc81a54a57f66)), closes [#298](https://github.com/mikro-orm/mikro-orm/issues/298)
* **core:** add support for custom types ([#276](https://github.com/mikro-orm/mikro-orm/issues/276)) ([96b2cad](https://github.com/mikro-orm/mikro-orm/commit/96b2cad350063e1cbf3f2485a762fba83c6f448c))
* **core:** add `@Repository` decorator ([e4ca716](https://github.com/mikro-orm/mikro-orm/commit/e4ca7165a3753b1cf58a96c0cba7ac292aba302e))
* **core:** add `em.findAndCount()` method ([1be8eb1](https://github.com/mikro-orm/mikro-orm/commit/1be8eb1915bc2a5a21a815eedb9512faf2c2c99a)), closes [#123](https://github.com/mikro-orm/mikro-orm/issues/123)
* **core:** add `findOneOrFail` method to entity manager and repository ([#142](https://github.com/mikro-orm/mikro-orm/issues/142)) ([0d57b7b](https://github.com/mikro-orm/mikro-orm/commit/0d57b7b3320e3292247f6919ac1a336dc1981afb)), closes [#133](https://github.com/mikro-orm/mikro-orm/issues/133)
* **core:** add `Reference.set()` method ([08cbead](https://github.com/mikro-orm/mikro-orm/commit/08cbead10a5c637dc44194786d9a062f81579d46)), closes [#264](https://github.com/mikro-orm/mikro-orm/issues/264)
* **core:** add `Reference<T>` wrapper to allow improved type safety ([#117](https://github.com/mikro-orm/mikro-orm/issues/117)) ([cdd44da](https://github.com/mikro-orm/mikro-orm/commit/cdd44dab5e31cb962f2d706db8c358760994a4ab)), closes [#107](https://github.com/mikro-orm/mikro-orm/issues/107)
* **core:** add `refresh` parameter to `FindOptions` ([#271](https://github.com/mikro-orm/mikro-orm/issues/271)) ([a558935](https://github.com/mikro-orm/mikro-orm/commit/a558935b20576e5a343c81aa434364e1b251a60b)), closes [#269](https://github.com/mikro-orm/mikro-orm/issues/269)
* **core:** add `WrappedEntity.toReference()` method ([de01463](https://github.com/mikro-orm/mikro-orm/commit/de014635090540b79a5ae69536ddc9fa960f8ed1)), closes [#264](https://github.com/mikro-orm/mikro-orm/issues/264)
* **core:** add support for bundling with Webpack ([#200](https://github.com/mikro-orm/mikro-orm/issues/200)) ([9db3633](https://github.com/mikro-orm/mikro-orm/commit/9db36330879cb2f6c9735b88c0b1e81252408d92)), closes [#196](https://github.com/mikro-orm/mikro-orm/issues/196)
* **core:** add support for deep nested conditions with operators ([#185](https://github.com/mikro-orm/mikro-orm/issues/185)) ([0fa78e6](https://github.com/mikro-orm/mikro-orm/commit/0fa78e687da1e0d3950dd2e74b49c2248def5371)), closes [#172](https://github.com/mikro-orm/mikro-orm/issues/172)
* **core:** add support for eager loading ([93a875d](https://github.com/mikro-orm/mikro-orm/commit/93a875d33c7dfea25f4838c41d670d391e655a05)), closes [#168](https://github.com/mikro-orm/mikro-orm/issues/168)
* **core:** add support for enums via `@Enum()` decorator ([#232](https://github.com/mikro-orm/mikro-orm/issues/232)) ([82ca105](https://github.com/mikro-orm/mikro-orm/commit/82ca1052175d6490741909fcb2a0828099264aed)), closes [#215](https://github.com/mikro-orm/mikro-orm/issues/215)
* **core:** add support for filtering and ordering of Collection items ([672bf3b](https://github.com/mikro-orm/mikro-orm/commit/672bf3b5a9a63909eb1d208619d5cc435bcd7fc4)), closes [#195](https://github.com/mikro-orm/mikro-orm/issues/195)
* **core:** add support for migrations via umzug ([#209](https://github.com/mikro-orm/mikro-orm/issues/209)) ([38ec973](https://github.com/mikro-orm/mikro-orm/commit/38ec9734839db099775dd58dc6c46df831e50a8b))
* **core:** add support for read connections ([#116](https://github.com/mikro-orm/mikro-orm/issues/116)) ([bc66fd6](https://github.com/mikro-orm/mikro-orm/commit/bc66fd6cf525a9e16c1298f29c207951a8569fb0)), closes [#77](https://github.com/mikro-orm/mikro-orm/issues/77)
* **core:** add support for virtual property getters ([#93](https://github.com/mikro-orm/mikro-orm/issues/93)) ([f413b41](https://github.com/mikro-orm/mikro-orm/commit/f413b41ab71cdf30e86580df1430b252e5c2dfa8)), closes [#82](https://github.com/mikro-orm/mikro-orm/issues/82)
* **core:** allow assigning PK to undefined/null ([72167bd](https://github.com/mikro-orm/mikro-orm/commit/72167bd773cd25a3426dc6e5f71c010d3ee803eb)), closes [#166](https://github.com/mikro-orm/mikro-orm/issues/166)
* **core:** allow empty where condition in `em.count()` ([ee62b3e](https://github.com/mikro-orm/mikro-orm/commit/ee62b3e8af547ca9d00c9ac734962f63310e8db9)), closes [#163](https://github.com/mikro-orm/mikro-orm/issues/163)
* **core:** allow filtering and sorting by nested query ([bc2b91f](https://github.com/mikro-orm/mikro-orm/commit/bc2b91f5f95aabbdfa0e52dd0d66391750d84c2b)), closes [#157](https://github.com/mikro-orm/mikro-orm/issues/157)
* **core:** allow populating all relations via `populate: true` ([1012420](https://github.com/mikro-orm/mikro-orm/commit/101242073e1d142e45a3307c821ed73523e3cf03)), closes [#160](https://github.com/mikro-orm/mikro-orm/issues/160)
* **core:** allow whitelisting entity fields in `em.find()` ([881b114](https://github.com/mikro-orm/mikro-orm/commit/881b1141c064c1baa0afd9dbb3cb20a7296e80ac)), closes [#176](https://github.com/mikro-orm/mikro-orm/issues/176)
* **core:** do not require entity attribute in collection decorators ([#207](https://github.com/mikro-orm/mikro-orm/issues/207)) ([89bbeb0](https://github.com/mikro-orm/mikro-orm/commit/89bbeb04fb4bfda0506ebf16326908efb99bb5d2))
* **core:** improve logging - add namespaces, colors and highlighting ([#109](https://github.com/mikro-orm/mikro-orm/issues/109)) ([64376ec](https://github.com/mikro-orm/mikro-orm/commit/64376eca9a57c1069c83866dacfc4e01c916f3c9)), closes [#108](https://github.com/mikro-orm/mikro-orm/issues/108)
* **core:** propagate nested where and orderBy when populating ([226af1c](https://github.com/mikro-orm/mikro-orm/commit/226af1c0f470e4f15d616186ab57f648344decb8)), closes [#195](https://github.com/mikro-orm/mikro-orm/issues/195)
* **core:** simplify entity definition and rework typings of FilterQuery ([#193](https://github.com/mikro-orm/mikro-orm/issues/193)) ([a343763](https://github.com/mikro-orm/mikro-orm/commit/a343763ec4eab56a6c378a9fb96524e9563ff0cc)), closes [#124](https://github.com/mikro-orm/mikro-orm/issues/124) [#171](https://github.com/mikro-orm/mikro-orm/issues/171)
* **core:** use composite PK in many to many relations ([#204](https://github.com/mikro-orm/mikro-orm/issues/204)) ([e73bbdb](https://github.com/mikro-orm/mikro-orm/commit/e73bbdb4b6bfb03e08807e64807fd8b67ed92458)), closes [#121](https://github.com/mikro-orm/mikro-orm/issues/121)
* **core:** use knex to generate sql + enable connection pooling [BC] ([#76](https://github.com/mikro-orm/mikro-orm/issues/76)) ([6d79e57](https://github.com/mikro-orm/mikro-orm/commit/6d79e57dacba9a4e07d3d9e027a68ed7fd7188e2)), closes [#64](https://github.com/mikro-orm/mikro-orm/issues/64)
* **core:** make options parameter optional in MikroORM.init() ([280d9a8](https://github.com/mikro-orm/mikro-orm/commit/280d9a8ebca2a16c94e703658a3e84d08c2c0b06))
* **core:** support default exported entities ([9065ff6](https://github.com/mikro-orm/mikro-orm/commit/9065ff61227a27f62f0fc82e2067f3b11da74ca0)), closes [#294](https://github.com/mikro-orm/mikro-orm/issues/294)
* **drivers:** add native UUID postgres type ([#188](https://github.com/mikro-orm/mikro-orm/issues/188)) ([8fd89fd](https://github.com/mikro-orm/mikro-orm/commit/8fd89fdd0fcdee37112ebfffd3fe14e6555bb2f7))
* **drivers:** add support for MariaDB ([#120](https://github.com/mikro-orm/mikro-orm/issues/120)) ([833834b](https://github.com/mikro-orm/mikro-orm/commit/833834b8d4149a849c8d1b7224de9193008281af)), closes [#110](https://github.com/mikro-orm/mikro-orm/issues/110)
* **drivers:** allow passing additional driver options ([1ceb0c1](https://github.com/mikro-orm/mikro-orm/commit/1ceb0c1a60015ba203c39bb20215630817e0019f))
* **hooks:** add onInit hook fired after entity is created ([#92](https://github.com/mikro-orm/mikro-orm/issues/92)) ([64e68ed](https://github.com/mikro-orm/mikro-orm/commit/64e68edf6fb19161d759e77d3ca4c0207e5cca03)), closes [#83](https://github.com/mikro-orm/mikro-orm/issues/83)
* **logging:** allow logging full query including params ([#155](https://github.com/mikro-orm/mikro-orm/issues/155)) ([6050dbf](https://github.com/mikro-orm/mikro-orm/commit/6050dbfcc286e9fb31a3c68f95185dd7cea292eb))
* **mapping:** add `EntityCaseNamingStrategy` ([fc6da6b](https://github.com/mikro-orm/mikro-orm/commit/fc6da6bd0453ef7898309c628acd908d5ba2d9ed)), closes [#135](https://github.com/mikro-orm/mikro-orm/issues/135)
* **mapping:** add type-safe way to define relationships ([423bb33](https://github.com/mikro-orm/mikro-orm/commit/423bb33ac9833e8306d39e8b83dc5c214cb3f78d)), closes [#146](https://github.com/mikro-orm/mikro-orm/issues/146) [#158](https://github.com/mikro-orm/mikro-orm/issues/158)
* **mapping:** allow overriding `getClassName()` in `NamingStrategy` ([#88](https://github.com/mikro-orm/mikro-orm/issues/88)) ([b6700b6](https://github.com/mikro-orm/mikro-orm/commit/b6700b6fb9b51dbd1c2ca5c99bbb3c8630abd3ca)), closes [#15](https://github.com/mikro-orm/mikro-orm/issues/15)
* **mapping:** auto-wire missing references from owner to inverse side ([fc61be9](https://github.com/mikro-orm/mikro-orm/commit/fc61be9de68d7b0ec6ba35312fee7bd800661b7d)), closes [#149](https://github.com/mikro-orm/mikro-orm/issues/149)
* **metadata:** add `ReflectMetadataProvider`, rename the `ts-morph` one ([#240](https://github.com/mikro-orm/mikro-orm/issues/240)) ([d740eb3](https://github.com/mikro-orm/mikro-orm/commit/d740eb38dc9ea36e2430000316b79400330ba83d)), closes [#235](https://github.com/mikro-orm/mikro-orm/issues/235)
* **metadata:** auto-detect optional properties ([cff0dd4](https://github.com/mikro-orm/mikro-orm/commit/cff0dd4c117db0efa1edcaa4a9403a6a8490a8ab))
* **metadata:** create instance of metadata instead of static one [BC] ([#91](https://github.com/mikro-orm/mikro-orm/issues/91)) ([e4acef0](https://github.com/mikro-orm/mikro-orm/commit/e4acef0a5d47af2b2f34ea8abd78c94b45f7cd31))
* **metadata:** improve validation during metadata discovery ([1bd1899](https://github.com/mikro-orm/mikro-orm/commit/1bd1899a1a8ddc2a274cc48222318fd668a6f94c)), closes [#114](https://github.com/mikro-orm/mikro-orm/issues/114)
* **mongo:** improve query logging, use `inspect` instead of `stringify` ([da842a3](https://github.com/mikro-orm/mikro-orm/commit/da842a3adbfe5a1e200e8aa88ac9de5b0142587f))
* **postgres:** use timestamps with time zone by default ([bd48124](https://github.com/mikro-orm/mikro-orm/commit/bd48124d3a32b4abc13c2dee4ddeceb351c1f520)), closes [#161](https://github.com/mikro-orm/mikro-orm/issues/161)
* **query-builder:** allow mapping to entities directly via getResult() ([beca08e](https://github.com/mikro-orm/mikro-orm/commit/beca08edf15eb86a36124ecc5053797aea5e5b34))
* **query-builder:** add $like and $re operators (regexp support) ([e6da98f](https://github.com/mikro-orm/mikro-orm/commit/e6da98fe68a47fc56acd9451c634c0c8bc8239b3))
* **schema:** add basic entity generator ([#98](https://github.com/mikro-orm/mikro-orm/issues/98)) ([cc48b52](https://github.com/mikro-orm/mikro-orm/commit/cc48b52adf2dd4859286897e109ccb1da02d1179)), closes [#78](https://github.com/mikro-orm/mikro-orm/issues/78)
* **schema:** add basic schema update ([#97](https://github.com/mikro-orm/mikro-orm/issues/97)) ([9bff976](https://github.com/mikro-orm/mikro-orm/commit/9bff97634d6087f591aa56325ac6f9e43e0e2bcc))
* **schema:** add support for create/drop database ([#237](https://github.com/mikro-orm/mikro-orm/issues/237)) ([6e58332](https://github.com/mikro-orm/mikro-orm/commit/6e583320b470cdce2a9b2285ba79f17533d8d65c))
* **schema:** allow dropping migrations table via `schema:drop` cli cmd ([36402b9](https://github.com/mikro-orm/mikro-orm/commit/36402b90070a7d56666e2080e267977cc67807ef)), closes [#220](https://github.com/mikro-orm/mikro-orm/issues/220)
* **schema:** use knex in schema generator ([#81](https://github.com/mikro-orm/mikro-orm/issues/81)) ([31bc56e](https://github.com/mikro-orm/mikro-orm/commit/31bc56ed5d191f77692884de52603f28506132c2))
* **sql:** add `autoJoinOneToOneOwner` option ([f2db3e0](https://github.com/mikro-orm/mikro-orm/commit/f2db3e05c27b7fe0d679b1e0e8cf86ff2542fe06)), closes [#248](https://github.com/mikro-orm/mikro-orm/issues/248)
* **sql:** add `forceUtcTimezone` option ([6bf747d](https://github.com/mikro-orm/mikro-orm/commit/6bf747ddef1920ffcc419859ef4d9582480693c3)), closes [#181](https://github.com/mikro-orm/mikro-orm/issues/181)
* **sql:** support multiple conditions in JOINs ([#94](https://github.com/mikro-orm/mikro-orm/issues/94)) ([60b6885](https://github.com/mikro-orm/mikro-orm/commit/60b6885c5f0b7958bca5c65358b38b2cce4892af)), closes [#70](https://github.com/mikro-orm/mikro-orm/issues/70)
* **sqlite:** ensure the directory with database exists ([908aba2](https://github.com/mikro-orm/mikro-orm/commit/908aba2432907f3c467f74512e80afdecf900bfb))
* **validation:** validate one to one relationship metadata ([ce57a3c](https://github.com/mikro-orm/mikro-orm/commit/ce57a3ccf7c38c64268e8fd6fcc9e60c1307c302)), closes [#149](https://github.com/mikro-orm/mikro-orm/issues/149)
* **validation:** warn when failing to get metadata of an entity ([33ce7d3](https://github.com/mikro-orm/mikro-orm/commit/33ce7d339a9aab2ebf6169f7c0be08cadfced441)), closes [#153](https://github.com/mikro-orm/mikro-orm/issues/153)



### Performance Improvements

* **core:** do not cascade persist entity references ([#279](https://github.com/mikro-orm/mikro-orm/issues/279)) ([9d9e261](https://github.com/mikro-orm/mikro-orm/commit/9d9e26151c538d4bb41565ba4433752c522dc4c7))
* **core:** make Utils.prepareEntity() faster ([69d2cf4](https://github.com/mikro-orm/mikro-orm/commit/69d2cf49115e9d4d1b5ff993e8f170f7c8b38d6c))
* **sql:** use multi-insert when populating m:n collections ([5ece088](https://github.com/mikro-orm/mikro-orm/commit/5ece0880811675fda69fbcbd1febf3d30f3b6788))


### BREAKING CHANGES

Please see the [upgrading guide](docs/docs/upgrading-v2-to-v3.md).



## [2.7.9](https://github.com/B4nan/mikro-orm/compare/v2.7.8...v2.7.9) (2019-10-10)

### Bug Fixes

* **deps:** update dependency ts-morph to v4 ([#162](https://github.com/B4nan/mikro-orm/issues/162) ([b6dd073](https://github.com/B4nan/mikro-orm/commit/b6dd073))
* **metadata:** fix lookup of path to entity file on windows with tslib ([a3c2900](https://github.com/B4nan/mikro-orm/commit/a3c2900)), closes [#194](https://github.com/B4nan/mikro-orm/issues/194)



## [2.7.8](https://github.com/mikro-orm/mikro-orm/compare/v2.7.7...v2.7.8) (2019-09-19)

### Bug Fixes

* **validation:**  allow undefined in nullable entity properties ([b5eafc3](https://github.com/mikro-orm/mikro-orm/commit/b5eafc3)), closes [#132](https://github.com/mikro-orm/mikro-orm/issues/132)



## [2.7.7](https://github.com/mikro-orm/mikro-orm/compare/v2.7.6...v2.7.7) (2019-09-01)

### Bug Fixes

* **mapping:** allow defining hooks on base entities ([6938398](https://github.com/mikro-orm/mikro-orm/commit/6938398)), closes [#104](https://github.com/mikro-orm/mikro-orm/issues/104)



## [2.7.6](https://github.com/mikro-orm/mikro-orm/compare/v2.7.5...v2.7.6) (2019-08-15)

### Bug Fixes

* **metadata:** add support for `tslib` ([5ffcb24](https://github.com/mikro-orm/mikro-orm/commit/5ffcb24)), closes [#100](https://github.com/mikro-orm/mikro-orm/issues/100)



## [2.7.5](https://github.com/mikro-orm/mikro-orm/compare/v2.7.4...v2.7.5) (2019-08-08)

### Features

* **core:** propagate changes in collections to both inverse/owner sides ([c10f8e8](https://github.com/mikro-orm/mikro-orm/commit/c10f8e8))



## [2.7.4](https://github.com/mikro-orm/mikro-orm/compare/v2.7.3...v2.7.4) (2019-07-23)

### Bug Fixes

* **core:** normalize path to entity to unix style separators ([c5933c7](https://github.com/mikro-orm/mikro-orm/commit/c5933c7))



## [2.7.3](https://github.com/mikro-orm/mikro-orm/compare/v2.7.2...v2.7.3) (2019-07-02)

### Bug Fixes

* **deps:** update dependency globby to v10 ([#72](https://github.com/mikro-orm/mikro-orm/issues/72)) ([4fdda82](https://github.com/mikro-orm/mikro-orm/commit/4fdda82))
* **deps:** update dependency ts-morph to v3 ([#71](https://github.com/mikro-orm/mikro-orm/issues/71)) ([abf671b](https://github.com/mikro-orm/mikro-orm/commit/abf671b))
* **mapping:** map raw results to entities when setting collection items ([b562ec1](https://github.com/mikro-orm/mikro-orm/commit/b562ec1)), closes [#67](https://github.com/mikro-orm/mikro-orm/issues/67)
* **metadata:** implement version property validation ([37a9cf2](https://github.com/mikro-orm/mikro-orm/commit/37a9cf2))



## [2.7.2](https://github.com/mikro-orm/mikro-orm/compare/v2.7.1...v2.7.2) (2019-06-14)

### Bug Fixes

* **sql:** support `IS NULL` queries in `QueryBuilder` ([fd6edd5](https://github.com/mikro-orm/mikro-orm/commit/fd6edd5))



## [2.7.1](https://github.com/mikro-orm/mikro-orm/compare/v2.7.0...v2.7.1) (2019-06-12)

### Bug Fixes

* **core:** allow 1 and -1 in `QueryOrderMap` to maintain BC ([3024386](https://github.com/mikro-orm/mikro-orm/commit/3024386))



# [2.7.0](https://github.com/mikro-orm/mikro-orm/compare/v2.6.0...v2.7.0) (2019-06-11)

### Features

* **core:** add support for mapping raw DB results via EM.map() ([#61](https://github.com/mikro-orm/mikro-orm/issues/61)) ([5d227ae](https://github.com/mikro-orm/mikro-orm/commit/5d227ae)), closes [#56](https://github.com/mikro-orm/mikro-orm/issues/56)
* **core:** automatically fix wrongly assigned associations ([#62](https://github.com/mikro-orm/mikro-orm/issues/62)) ([05e6ce5](https://github.com/mikro-orm/mikro-orm/commit/05e6ce5))
* **core:** change `QueryOrder` enum values to `ASC/DESC/asc/desc` ([5c18fda](https://github.com/mikro-orm/mikro-orm/commit/5c18fda))



# [2.6.0](https://github.com/mikro-orm/mikro-orm/compare/v2.5.0...v2.6.0) (2019-05-27)

### Features

* **core:** add support for partial selects ([bcc005e](https://github.com/mikro-orm/mikro-orm/commit/bcc005e))
* **core:** add support for refreshing managed entity via `init()` ([8ae5323](https://github.com/mikro-orm/mikro-orm/commit/8ae5323))
* **core:** add support for transaction locking ([#57](https://github.com/mikro-orm/mikro-orm/issues/57)), closes [#41](https://github.com/mikro-orm/mikro-orm/issues/41)
* **query-builder:** allow selecting numeric literals ([280e6ea](https://github.com/mikro-orm/mikro-orm/commit/280e6ea))
* **serializing:** add support for hidden properties ([4f6f013](https://github.com/mikro-orm/mikro-orm/commit/4f6f013))

### Performance Improvements

* **context:** use Domain API instead of async_hooks ([#58](https://github.com/mikro-orm/mikro-orm/issues/58))



# [2.5.0](https://github.com/mikro-orm/mikro-orm/compare/v2.4.0...v2.5.0) (2019-05-13)

### Bug Fixes

* **core:** support creating entity with client side UUID via `EM.create()` ([0752fa4](https://github.com/mikro-orm/mikro-orm/commit/0752fa4))
* **deps:** update dependencies to support **node 12** ([#52](https://github.com/mikro-orm/mikro-orm/issues/52)), closes [#50](https://github.com/mikro-orm/mikro-orm/issues/50)
* **deps:** update dependency fs-extra to v8 ([#54](https://github.com/mikro-orm/mikro-orm/issues/54))
* **metadata:** fix error message for missing TS source file ([cb799ca](https://github.com/mikro-orm/mikro-orm/commit/cb799ca))
* **mongo:** log correct taken time in `deleteMany` ([f6fe821](https://github.com/mikro-orm/mikro-orm/commit/f6fe821))

### Features

* **core:** persist all managed entities automatically when flushing ([dbf6b43](https://github.com/mikro-orm/mikro-orm/commit/dbf6b43)), closes [#51](https://github.com/mikro-orm/mikro-orm/issues/51)
* **metadata:** validate missing base entities ([03d61a8](https://github.com/mikro-orm/mikro-orm/commit/03d61a8))



# [2.4.0](https://github.com/mikro-orm/mikro-orm/compare/v2.3.2...v2.4.0) (2019-04-27)

### Bug Fixes

* **query-builder:** do not ignore nested and group conditions ([ab64d5a](https://github.com/mikro-orm/mikro-orm/commit/ab64d5a))
* **query-builder:** support calling `andWhere()`/`orWhere()` without previous `where()` ([516e863](https://github.com/mikro-orm/mikro-orm/commit/516e863))

### Features

* **query-builder:** add `groupBy()` and `having()` to `QueryBuilder` ([1487803](https://github.com/mikro-orm/mikro-orm/commit/1487803))
* **query-builder:** add `QueryBuilder.clone()` method ([313deb1](https://github.com/mikro-orm/mikro-orm/commit/313deb1))
* **query-builder:** allow DISTINCT selects via `qb.select('...', true)` ([31d6079](https://github.com/mikro-orm/mikro-orm/commit/31d6079))
* **query-builder:** do not wrap fields that contain space ([7ee2e5a](https://github.com/mikro-orm/mikro-orm/commit/7ee2e5a))
* **query-builder:** allow string literals in where conditions ([ec27c33](https://github.com/mikro-orm/mikro-orm/commit/ec27c33))
* **query-builder:** support smart query conditions in `QueryBuilder` ([2c5bca4](https://github.com/mikro-orm/mikro-orm/commit/2c5bca4))



## [2.3.2](https://github.com/mikro-orm/mikro-orm/compare/v2.3.1...v2.3.2) (2019-04-26)

### Bug Fixes

* **mongo:** support entity names in mongo connection API ([c719b1e](https://github.com/mikro-orm/mikro-orm/commit/c719b1e))
* **mongo:** support other top level keys than $set in `EM.nativeUpdate()` ([d12bd78](https://github.com/mikro-orm/mikro-orm/commit/d12bd78))
* **serializing:** do not strip falsy values from serialized DTO ([93e806f](https://github.com/mikro-orm/mikro-orm/commit/93e806f))



## [2.3.1](https://github.com/mikro-orm/mikro-orm/compare/v2.3.0...v2.3.1) (2019-04-25)

### Bug Fixes

* **core:** do not override loaded entity state when loading it again ([79fabcb](https://github.com/mikro-orm/mikro-orm/commit/79fabcb))



# [2.3.0](https://github.com/mikro-orm/mikro-orm/compare/v2.2.2...v2.3.0) (2019-04-24)

### Bug Fixes

* **deps:** update dependency ts-morph to v2 ([#47](https://github.com/mikro-orm/mikro-orm/issues/47))
* **sql:** support custom field names in select clause of query builder ([b10c67f](https://github.com/mikro-orm/mikro-orm/commit/b10c67f))

### Features

* **core:** implement orphan removal ([#48](https://github.com/mikro-orm/mikro-orm/issues/48)), closes [#36](https://github.com/mikro-orm/mikro-orm/issues/36)
* **core:** support lookup by array instead of explicit `$in` condition ([4f600d6](https://github.com/mikro-orm/mikro-orm/commit/4f600d6))
* **query-builder:** add support for `join()` and `leftJoin()` ([#46](https://github.com/mikro-orm/mikro-orm/issues/46)), closes [#45](https://github.com/mikro-orm/mikro-orm/issues/45)



## [2.2.2](https://github.com/mikro-orm/mikro-orm/compare/v2.2.1...v2.2.2) (2019-04-18)

### Bug Fixes

* **serializing:** allow serializing deeply nested structures ([04c5190](https://github.com/mikro-orm/mikro-orm/commit/04c5190))



## [2.2.1](https://github.com/mikro-orm/mikro-orm/compare/v2.2.0...v2.2.1) (2019-04-18)

### Bug Fixes

* **entity:** allow boolean onlyProperties parameter in entity.assign() ([9f318f7](https://github.com/mikro-orm/mikro-orm/commit/9f318f7))
* **entity:** set dirty flag on collections updated via entity.assign() ([d9d71fe](https://github.com/mikro-orm/mikro-orm/commit/d9d71fe))
* **sql-drivers:** work around empty IN () and NOT IN () conditions ([13a1832](https://github.com/mikro-orm/mikro-orm/commit/13a1832))

### Features

* **core:** allow forking EM without clearing identity map ([5e4603c](https://github.com/mikro-orm/mikro-orm/commit/5e4603c))



# [2.2.0](https://github.com/mikro-orm/mikro-orm/compare/v2.1.1...v2.2.0) (2019-04-14)

### Bug Fixes

* **core:** ignore rest parameter in `entity.toJSON()` ([147de7d](https://github.com/mikro-orm/mikro-orm/commit/147de7d))
* **core:** merge only objects in `assign()` with `mergeObjects` flag ([749ca6f](https://github.com/mikro-orm/mikro-orm/commit/749ca6f))
* **core:** use serialized PK in `Collection.getIdentifiers()` ([a24b6bc](https://github.com/mikro-orm/mikro-orm/commit/a24b6bc))
* **mongo:** include missing query condition in logger in `deleteMany()` ([bf280b4](https://github.com/mikro-orm/mikro-orm/commit/bf280b4))

### Features

* **core:** add `@OneToOne` decorator ([#42](https://github.com/mikro-orm/mikro-orm/pull/42)), closes [#37](https://github.com/mikro-orm/mikro-orm/issues/37)
* **core:** add `createQueryBuilder()` to `EntityRepository` API ([a8ab04e](https://github.com/mikro-orm/mikro-orm/commit/a8ab04e))
* **core:** add support for `nullable` columns in schema generator ([8e508d3](https://github.com/mikro-orm/mikro-orm/commit/8e508d3)), closes [#39](https://github.com/mikro-orm/mikro-orm/issues/39)
* **core:** add support for `unique` index in schema generator ([f8a614b](https://github.com/mikro-orm/mikro-orm/commit/f8a614b)), closes [#38](https://github.com/mikro-orm/mikro-orm/issues/38)
* **core:** allow changing join columns in 1:m, m:n and 1:1 ([dd97760](https://github.com/mikro-orm/mikro-orm/commit/dd97760))
* **core:** allow entities in query data and where (convert them to PK) ([e3a4962](https://github.com/mikro-orm/mikro-orm/commit/e3a4962))
* **core:** allow orderBy in `EM.findOne()` and support `FindOneOptions` ([0c61703](https://github.com/mikro-orm/mikro-orm/commit/0c61703))
* **core:** allow self-referencing in M:N collections ([5fda213](https://github.com/mikro-orm/mikro-orm/commit/5fda213))
* **core:** implement shadow properties - `@Property({ persist: false })` ([6062118](https://github.com/mikro-orm/mikro-orm/commit/6062118)), closes [#40](https://github.com/mikro-orm/mikro-orm/issues/40)
* **mapping:** use `mappedBy`/`inversedBy` in 1:m/m:1 to be consistent ([305dc6e](https://github.com/mikro-orm/mikro-orm/commit/305dc6e))
* **metadata:** do not require source files when type provided ([f9a237f](https://github.com/mikro-orm/mikro-orm/commit/f9a237f))
* **query-builder:** add `andWhere()` and `orWhere()` to `QueryBuilder` ([d1a1127](https://github.com/mikro-orm/mikro-orm/commit/d1a1127))



## [2.1.1](https://github.com/mikro-orm/mikro-orm/compare/v2.1.0...v2.1.1) (2019-04-05)

### Features

* **core:** add support for merging object properties in `IEntity.assign()` ([3b401ed](https://github.com/mikro-orm/mikro-orm/commit/3b401ed)), closes [#35](https://github.com/mikro-orm/mikro-orm/issues/35)



# [2.1.0](https://github.com/mikro-orm/mikro-orm/compare/v2.0.3...v2.1.0) (2019-04-04)

### Bug Fixes

* **core:** rename `IEntity.uuid` to `__uuid` to allow using uuid as property ([44eb778](https://github.com/mikro-orm/mikro-orm/commit/44eb778))
* **core:** do not require PK when computing change set ([67415f6](https://github.com/mikro-orm/mikro-orm/commit/67415f6))
* **core:** support custom `toJSON` implementation in complex structures ([2a9f6da](https://github.com/mikro-orm/mikro-orm/commit/2a9f6da))
* **core:** support self-referencing in many to one association ([0fe4ec7](https://github.com/mikro-orm/mikro-orm/commit/0fe4ec7), [2499019](https://github.com/mikro-orm/mikro-orm/commit/2499019))
* **drivers:** log correct client url (based on other connection options) ([79f37bd](https://github.com/mikro-orm/mikro-orm/commit/79f37bd)), closes [#29](https://github.com/mikro-orm/mikro-orm/issues/29)
* **mysql:** convert numeric value of bool fields to boolean ([133afaa](https://github.com/mikro-orm/mikro-orm/commit/133afaa))
* **serializing:** always initialize collections when populating ([5290737](https://github.com/mikro-orm/mikro-orm/commit/5290737))

### Features

* **core:** add support for complex query conditions in SQL QueryBuilder ([0ea3f41](https://github.com/mikro-orm/mikro-orm/commit/0ea3f41))
* **core:** allow using different PK than id (e.g. uuid) ([40bcdc0](https://github.com/mikro-orm/mikro-orm/commit/40bcdc0))
* **core:** improve support for ts-node ([220bcaa](https://github.com/mikro-orm/mikro-orm/commit/220bcaa))
* **core:** implement `Cascade.MERGE` and `Cascade.ALL` ([#27](https://github.com/mikro-orm/mikro-orm/issues/27)), closes [#16](https://github.com/mikro-orm/mikro-orm/issues/16)
* **core:** support cascade merging detached entity ([8801960](https://github.com/mikro-orm/mikro-orm/commit/8801960))
* **core:** support smart search conditions ([5537156](https://github.com/mikro-orm/mikro-orm/commit/5537156)), closes [#20](https://github.com/mikro-orm/mikro-orm/issues/20)
* **core:** support wrapped query with operator in QueryBuilder ([8a967b4](https://github.com/mikro-orm/mikro-orm/commit/8a967b4))
* **drivers:** add support for **PostgreSQL** ([edb6eec](https://github.com/mikro-orm/mikro-orm/commit/edb6eec)), closes [#17](https://github.com/mikro-orm/mikro-orm/issues/17)
* **drivers:** allow choosing driver via new `type` option ([9e765aa](https://github.com/mikro-orm/mikro-orm/commit/9e765aa))
* **drivers:** allow ordering of 1:M collections ([8cfb62d](https://github.com/mikro-orm/mikro-orm/commit/8cfb62d))
* **mongo:** support using native helpers on collections directly ([5d727e9](https://github.com/mikro-orm/mikro-orm/commit/5d727e9))
* **mongo:** support user and password connection options ([a2d9250](https://github.com/mikro-orm/mikro-orm/commit/a2d9250))
* **query-builder:** add support for custom query expressions ([#28](https://github.com/mikro-orm/mikro-orm/pull/28))
* **schema:** add schema generator for SQL ([#26](https://github.com/mikro-orm/mikro-orm/pull/26))



## [2.0.3](https://github.com/mikro-orm/mikro-orm/compare/v2.0.2...v2.0.3) (2019-03-12)

### Bug Fixes

* allow masking of passwords with special characters ([e2bf26d](https://github.com/mikro-orm/mikro-orm/commit/e2bf26d))
* do not cache Hydrator as it would have reference to wrong factory ([fd124d5](https://github.com/mikro-orm/mikro-orm/commit/fd124d5))
* require generic type of ChangeSet (fixes older TS compatibility) ([d8503d7](https://github.com/mikro-orm/mikro-orm/commit/d8503d7))



## [2.0.2](https://github.com/mikro-orm/mikro-orm/compare/v2.0.1...v2.0.2) (2019-03-10)

### Bug Fixes

* require path in JS entity schema to fix support of entities array ([de63f35](https://github.com/mikro-orm/mikro-orm/commit/de63f35))



## [2.0.1](https://github.com/mikro-orm/mikro-orm/compare/v2.0.0...v2.0.1) (2019-03-10)

### Bug Fixes

* reorganize imports to fix circular dependency in built JS code ([bf23587](https://github.com/mikro-orm/mikro-orm/commit/bf23587))

### Features

* introduce `Configuration` object ([5916435](https://github.com/mikro-orm/mikro-orm/commit/5916435))



# [2.0.0](https://github.com/mikro-orm/mikro-orm/compare/v1.2.3...v2.0.0) (2019-03-09)

### Bug Fixes

* improve hooks - allow changing db properties in beforeCreate/beforeUpdate hooks (closes #5) ([26008a0](https://github.com/mikro-orm/mikro-orm/commit/26008a0))
* initialize 1:M collection when loading owner from EM ([7c052bc](https://github.com/mikro-orm/mikro-orm/commit/7c052bc))
* remove index type signature from PropertyOptions interface ([19816ff](https://github.com/mikro-orm/mikro-orm/commit/19816ff))

### Features

* add support for **MySQL** ([bcf2a65](https://github.com/mikro-orm/mikro-orm/commit/bcf2a65))
* add support for **SQLite** ([d3adbb4](https://github.com/mikro-orm/mikro-orm/commit/d3adbb4))
* add support for **vanilla JS** ([1a38f2f](https://github.com/mikro-orm/mikro-orm/commit/1a38f2f), [9fc4454](https://github.com/mikro-orm/mikro-orm/commit/9fc4454), [a8b1d1f](https://github.com/mikro-orm/mikro-orm/commit/a8b1d1f), [e123d82](https://github.com/mikro-orm/mikro-orm/commit/e123d82))
* add support for **nested populate** ([28fe1e6](https://github.com/mikro-orm/mikro-orm/commit/28fe1e6))
* add support for WHERE LIKE clauses in SQL drivers via native regexps ([2ad681e](https://github.com/mikro-orm/mikro-orm/commit/2ad681e))
* add support for different naming of entity files (e.g. `book-tag.ts` or `book-tag.model.ts`) ([8fe2816](https://github.com/mikro-orm/mikro-orm/commit/8fe2816))
* add basic transactions api to EM ([88872ea](https://github.com/mikro-orm/mikro-orm/commit/88872ea))
* add NamingStrategy support ([5dd2c65](https://github.com/mikro-orm/mikro-orm/commit/5dd2c65), [e0d1e30](https://github.com/mikro-orm/mikro-orm/commit/e0d1e30))
* add persistAndFlush() and persistLater() methods ([3b1ff7a](https://github.com/mikro-orm/mikro-orm/commit/3b1ff7a))
* add possibility to disable auto-flush globally ([39ae0ec](https://github.com/mikro-orm/mikro-orm/commit/39ae0ec))
* allow async methods in hooks ([9722e75](https://github.com/mikro-orm/mikro-orm/commit/9722e75))
* allow passing array of entities via `entities` option ([26093f9](https://github.com/mikro-orm/mikro-orm/commit/26093f9))
* allow passing entity class instead of string name in EM methods (CRUD, getRepository, ...) ([86acead](https://github.com/mikro-orm/mikro-orm/commit/86acead))
* allow setting custom base repository globally ([9ad19f2](https://github.com/mikro-orm/mikro-orm/commit/9ad19f2))
* allow usage **without `BaseEntity`** ([af352f7](https://github.com/mikro-orm/mikro-orm/commit/af352f7))
* allow using options object in EntityManager.find() ([e5abcfd](https://github.com/mikro-orm/mikro-orm/commit/e5abcfd))
* implement **cascade persist and remove** ([7836626](https://github.com/mikro-orm/mikro-orm/commit/7836626))
* implement metadata caching to JSON files ([d958e4d](https://github.com/mikro-orm/mikro-orm/commit/d958e4d))
* improve `Collection` definition - only owner reference is now required ([49224cc](https://github.com/mikro-orm/mikro-orm/commit/49224cc))
* improve internal typings, enable noImplicitAny and strict null checks ([1a5e32d](https://github.com/mikro-orm/mikro-orm/commit/1a5e32d), [271bffb](https://github.com/mikro-orm/mikro-orm/commit/271bffb))
* read m:1 referenced type via reflection, do not require its definition ([5cbb29a](https://github.com/mikro-orm/mikro-orm/commit/5cbb29a))
* run all queries in transaction when flushing ([8c233c0](https://github.com/mikro-orm/mikro-orm/commit/8c233c0))
* validate each entity after discovery ([06b432e](https://github.com/mikro-orm/mikro-orm/commit/06b432e))

### BREAKING CHANGES

* **introduced new layer of drivers**, require [manual installation of underlying db driver](https://mikro-orm.io/installation/)
* **refactor entity definition**, remove `BaseEntity`, require [merging with `IEntity` interface and defining @PrimaryKey](https://mikro-orm.io/defining-entities/)
* change default key in Collection#getIdentifiers() to `id` as that one is required ([1f16ef9](https://github.com/mikro-orm/mikro-orm/commit/1f16ef9))
* remove identity map API from entity manager, use unit of work directly ([b27326c](https://github.com/mikro-orm/mikro-orm/commit/b27326c))
