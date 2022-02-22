# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)


### Bug Fixes

* **core:** always create new entities as initialized ([bbb30c5](https://github.com/mikro-orm/mikro-orm/commit/bbb30c5bfb5fbda0b0d7464abd64b07d4166c58d))
* **core:** fix mapping default values of relation properties ([bc57ed0](https://github.com/mikro-orm/mikro-orm/commit/bc57ed0e2d0e5a2f92e4ddaa5cdd77ff88195a85))
* **core:** fix propagation of FK as PK with not flushed entity ([25be857](https://github.com/mikro-orm/mikro-orm/commit/25be857354999626abdf17c386a95559d37b3b56)), closes [#2810](https://github.com/mikro-orm/mikro-orm/issues/2810)
* **core:** fix unsetting identity of orphans (1:1 with orphan removal) ([91e7315](https://github.com/mikro-orm/mikro-orm/commit/91e7315f86f6e31f7ff30589dac82882a9f09783)), closes [#2806](https://github.com/mikro-orm/mikro-orm/issues/2806)
* **core:** respect schema from config when adding new entities to context ([7a6b6e2](https://github.com/mikro-orm/mikro-orm/commit/7a6b6e2f130527909887643765c0c051f57a052a))
* **entity-generator:** fix property names for columns with dashes ([#2813](https://github.com/mikro-orm/mikro-orm/issues/2813)) ([c920d5f](https://github.com/mikro-orm/mikro-orm/commit/c920d5f1e025d1602d04f6d339f2e3f697049035))


### Features

* **core:** respect load strategy specified in property definition ([1a6b4b2](https://github.com/mikro-orm/mikro-orm/commit/1a6b4b2c7cc902c32aeff2d99a5dd666b221089e)), closes [#2803](https://github.com/mikro-orm/mikro-orm/issues/2803)





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **core:** do not trigger global context validation from repositories ([f651865](https://github.com/mikro-orm/mikro-orm/commit/f651865a3adab17a3025e76dc094b04b1f004181)), closes [#2778](https://github.com/mikro-orm/mikro-orm/issues/2778)
* **core:** fix processing of `onUpdate` properties ([9cf454e](https://github.com/mikro-orm/mikro-orm/commit/9cf454ef8a91239e00fad27d41d00b18c8f18263)), closes [#2781](https://github.com/mikro-orm/mikro-orm/issues/2781)
* **core:** fix processing of multiple `onUpdate` properties on one entity ([4f0e4cc](https://github.com/mikro-orm/mikro-orm/commit/4f0e4cc959269a8485684d18e156795372a9bd37)), closes [#2784](https://github.com/mikro-orm/mikro-orm/issues/2784)
* **core:** hydrate not-null embeddable prop even with all null values ([09aee05](https://github.com/mikro-orm/mikro-orm/commit/09aee05105c2da231a18afaf639285e74da62a3a)), closes [#2774](https://github.com/mikro-orm/mikro-orm/issues/2774)
* **core:** register entity to identity map as early as possible ([d8f3613](https://github.com/mikro-orm/mikro-orm/commit/d8f3613402ca51d02f74a3f8af4dae63ffdfcd60)), closes [#2777](https://github.com/mikro-orm/mikro-orm/issues/2777)
* **core:** respect `onDelete: cascade` when propagating removal ([f1e8578](https://github.com/mikro-orm/mikro-orm/commit/f1e85787703a93d33ff47bdd155afc8f0b3f6777)), closes [#2703](https://github.com/mikro-orm/mikro-orm/issues/2703)
* **core:** revert to `require()` when getting ORM version to fix webpack support ([6cfb526](https://github.com/mikro-orm/mikro-orm/commit/6cfb5269696a9c0991198b238667c40f0dae2250)), closes [#2799](https://github.com/mikro-orm/mikro-orm/issues/2799)
* **postgres:** consider int8 as numeric when inferring autoincrement value ([64bc99d](https://github.com/mikro-orm/mikro-orm/commit/64bc99d3ddb2293dbf4a3cb70aa22e16ac813b2d)), closes [#2791](https://github.com/mikro-orm/mikro-orm/issues/2791)
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
* **core:** do not ignore value from database even if we only have a getter ([35103b3](https://github.com/mikro-orm/mikro-orm/commit/35103b335727a19bc12f95b3cc5918058917722f)), closes [#2760](https://github.com/mikro-orm/mikro-orm/issues/2760)
* **core:** respect global schema ([b569686](https://github.com/mikro-orm/mikro-orm/commit/b569686af7746551bd8779d694fa11035b80a736))
* **postgres:** do not ignore custom PK constraint names ([3201ef7](https://github.com/mikro-orm/mikro-orm/commit/3201ef7b2b2f4ea745f946da0966da9f94fd2cc8)), closes [#2762](https://github.com/mikro-orm/mikro-orm/issues/2762)
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
* **schema:** fix explicit schema name support ([#2752](https://github.com/mikro-orm/mikro-orm/issues/2752)) ([68631ea](https://github.com/mikro-orm/mikro-orm/commit/68631ea786e40aecd8ffc31baead9a23699874b7))
* **typing:** exclude symbols and functions from `FilterQuery` ([1d24eb8](https://github.com/mikro-orm/mikro-orm/commit/1d24eb87b2e833cd9ab86f2859fc7fee0db3e378)), closes [#2742](https://github.com/mikro-orm/mikro-orm/issues/2742)


### Features

* **core:** add `getContext` parameter to `@UseRequestContext()` ([9516b48](https://github.com/mikro-orm/mikro-orm/commit/9516b48525929d3bbef1794b25fa862048c589f7)), closes [#2721](https://github.com/mikro-orm/mikro-orm/issues/2721)
* **query-builder:** allow autocomplete on `qb.orderBy()` ([fdf03c3](https://github.com/mikro-orm/mikro-orm/commit/fdf03c38322f79e0b41181b834db903d5138124d)), closes [#2747](https://github.com/mikro-orm/mikro-orm/issues/2747)
* **schema:** ensure database when calling `refreshDatabase()` ([7ce12d6](https://github.com/mikro-orm/mikro-orm/commit/7ce12d6f54845d169c769084d90ec82a1ab15c35))
* **seeder:** refactor seeder to support running compiled files ([#2751](https://github.com/mikro-orm/mikro-orm/issues/2751)) ([8d9c4c0](https://github.com/mikro-orm/mikro-orm/commit/8d9c4c0454d06920cd59647f1f2ea4070ea2bd5a)), closes [#2728](https://github.com/mikro-orm/mikro-orm/issues/2728)





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **assign:** do not convert FK to entity when assigning to `mapToPK` property ([b14c8fb](https://github.com/mikro-orm/mikro-orm/commit/b14c8fbacfb3cf9e6b1991f268b73cd193890190)), closes [#2337](https://github.com/mikro-orm/mikro-orm/issues/2337)
* **core:** allow calling `em.create()` with reference wrapper ([c069960](https://github.com/mikro-orm/mikro-orm/commit/c06996096d8e6555af87aeeb06e66a47d57938df))
* **core:** allow non-standard property names (hyphens, spaces, ...) ([cc68230](https://github.com/mikro-orm/mikro-orm/commit/cc682305b44bd4ef886e7a744f8f4b1d69d090ff)), closes [#1958](https://github.com/mikro-orm/mikro-orm/issues/1958)
* **core:** allow propagation to multiple matching inverse sides ([cf7d538](https://github.com/mikro-orm/mikro-orm/commit/cf7d5387a26016b78c11a54d96686eea7ae7b73f)), closes [#2371](https://github.com/mikro-orm/mikro-orm/issues/2371)
* **core:** allow putting not managed entities to remove stack ([7a47151](https://github.com/mikro-orm/mikro-orm/commit/7a47151d363ba162a51edade0125dbe34aa44adb)), closes [#2395](https://github.com/mikro-orm/mikro-orm/issues/2395)
* **core:** allow using `updateNestedEntities` flag with collections ([65de1a5](https://github.com/mikro-orm/mikro-orm/commit/65de1a524bc8aa98b4e690304b36a9fb9f48f730)), closes [#1717](https://github.com/mikro-orm/mikro-orm/issues/1717)
* **core:** allow using MongoNamingStrategy with SQL drivers ([c38c66c](https://github.com/mikro-orm/mikro-orm/commit/c38c66c388b841122459132152c5baf21896e8a8)), closes [#2693](https://github.com/mikro-orm/mikro-orm/issues/2693)
* **core:** consider non-plain objects as PKs ([2fe9f2b](https://github.com/mikro-orm/mikro-orm/commit/2fe9f2be6184ab0d10a8f9292611dd7177fdb9cf)), closes [#1721](https://github.com/mikro-orm/mikro-orm/issues/1721)
* **core:** consider objects without prototype as POJO ([b49807f](https://github.com/mikro-orm/mikro-orm/commit/b49807f181365367ecdb25c85bddabe8e2ca3c5a)), closes [#2274](https://github.com/mikro-orm/mikro-orm/issues/2274)
* **core:** convert custom types for `onCreate` & `onUpdate` ([e5f5b38](https://github.com/mikro-orm/mikro-orm/commit/e5f5b38e9b656993a7cef16ef04cb57ea9c117fe)), closes [#1751](https://github.com/mikro-orm/mikro-orm/issues/1751)
* **core:** convert custom types for collection items in joined strategy ([5b76600](https://github.com/mikro-orm/mikro-orm/commit/5b76600bb1c1ee812ea7119d5819843c9e7dc866)), closes [#1754](https://github.com/mikro-orm/mikro-orm/issues/1754)
* **core:** convert custom types on PKs in update and delete queries ([b33be4a](https://github.com/mikro-orm/mikro-orm/commit/b33be4a3fca15b6aea9a37b8e41cd49c71a6ab78)), closes [#1798](https://github.com/mikro-orm/mikro-orm/issues/1798)
* **core:** defer cascading of persist operation ([6abb3b0](https://github.com/mikro-orm/mikro-orm/commit/6abb3b07e4a2209f64cc9a16f6ba8bc322c184ac)), closes [#2161](https://github.com/mikro-orm/mikro-orm/issues/2161)
* **core:** detect ts-jest usage ([94acc18](https://github.com/mikro-orm/mikro-orm/commit/94acc187b01950124ce8a54eadd3e8cee144e35a))
* **core:** do not apply limit/offset to populate pivot table queries ([a73c4e0](https://github.com/mikro-orm/mikro-orm/commit/a73c4e092138d95fe85cebc5b6c87e94746286ca)), closes [#2121](https://github.com/mikro-orm/mikro-orm/issues/2121)
* **core:** do not check stack trace when detecting ts-node ([06cca85](https://github.com/mikro-orm/mikro-orm/commit/06cca8542677691eaf35f8b037151050c93d2bbc))
* **core:** do not override existing values via `prop.onCreate` ([fb67ea6](https://github.com/mikro-orm/mikro-orm/commit/fb67ea6c984302273df9915811aff7dcba795ff7))
* **core:** do not override internal EM instance when forking EM ([8139174](https://github.com/mikro-orm/mikro-orm/commit/813917404f65f74265d6b9f31d5ff060fa8b6ead)), closes [#2342](https://github.com/mikro-orm/mikro-orm/issues/2342)
* **core:** do not propagate `mapToPk` properties ([b93c59e](https://github.com/mikro-orm/mikro-orm/commit/b93c59ec8224ceb9f5070e3fa722a1b32fb39577))
* **core:** do not save entity state in `merge` when it's not initialized ([4141539](https://github.com/mikro-orm/mikro-orm/commit/41415397a751c238e7b9746ff89b16ce865e224e)), closes [#1927](https://github.com/mikro-orm/mikro-orm/issues/1927)
* **core:** ensure correct casting in deep JSON queries with operators ([5c79e34](https://github.com/mikro-orm/mikro-orm/commit/5c79e34671b870119fbd38f230bb4b434d91c05e)), closes [#1734](https://github.com/mikro-orm/mikro-orm/issues/1734)
* **core:** fix `findAndCount` with populate ([d2f69ae](https://github.com/mikro-orm/mikro-orm/commit/d2f69ae8d2b5831047030c9891207625f2a476eb)), closes [#1736](https://github.com/mikro-orm/mikro-orm/issues/1736)
* **core:** fix `QueryFlag.PAGINATE` with joined loading strategy ([c6d72b8](https://github.com/mikro-orm/mikro-orm/commit/c6d72b864d7c36f219e5b0b1e2d3aa66586bf4b8))
* **core:** fix assigning embedded arrays ([f02fb75](https://github.com/mikro-orm/mikro-orm/commit/f02fb75b1ca4b91b906fcc3dbfa00b2551884525)), closes [#1699](https://github.com/mikro-orm/mikro-orm/issues/1699)
* **core:** fix assigning to object property without value ([90165ab](https://github.com/mikro-orm/mikro-orm/commit/90165ab589627e43199c66fc2373562872ec4ba5)), closes [#2492](https://github.com/mikro-orm/mikro-orm/issues/2492)
* **core:** fix clearing 1:m collections ([462a126](https://github.com/mikro-orm/mikro-orm/commit/462a12697e96740e5371b06ce2caf6e9c2bc14cd)), closes [#1914](https://github.com/mikro-orm/mikro-orm/issues/1914)
* **core:** fix collection state when `forceEntityConstructor` is used ([674abbb](https://github.com/mikro-orm/mikro-orm/commit/674abbb28d9c5d5caf0cea441a447af7c987cdb0)), closes [#2406](https://github.com/mikro-orm/mikro-orm/issues/2406) [#2409](https://github.com/mikro-orm/mikro-orm/issues/2409)
* **core:** fix conversion of custom type PKs in some cases ([28e83ef](https://github.com/mikro-orm/mikro-orm/commit/28e83ef9364293fa450877b79401aac18ade6ed7)), closes [#1263](https://github.com/mikro-orm/mikro-orm/issues/1263)
* **core:** fix extraction of child condition when populating 2 ([1653269](https://github.com/mikro-orm/mikro-orm/commit/16532691c769805e297818d9d1d275769e193434)), closes [#1882](https://github.com/mikro-orm/mikro-orm/issues/1882)
* **core:** fix hydrating of inlined embeddables via `em.create()` ([057317f](https://github.com/mikro-orm/mikro-orm/commit/057317f2ad39db2b46e50bb78b56f485b0cdb81d)), closes [#1840](https://github.com/mikro-orm/mikro-orm/issues/1840)
* **core:** fix joined strategy with FK as PK ([5412913](https://github.com/mikro-orm/mikro-orm/commit/5412913696ab62529b9a87f78ea9f97f6517073c)), closes [#1902](https://github.com/mikro-orm/mikro-orm/issues/1902)
* **core:** fix M:N relations with custom type PKs ([3cdc786](https://github.com/mikro-orm/mikro-orm/commit/3cdc78605c9ce8b204df431abba3aea2a0d24429)), closes [#1930](https://github.com/mikro-orm/mikro-orm/issues/1930)
* **core:** fix missing embedded columns on joined select query ([#2664](https://github.com/mikro-orm/mikro-orm/issues/2664)) ([88e2309](https://github.com/mikro-orm/mikro-orm/commit/88e23095ae0165ff792c2029222b1bf12038f09a))
* **core:** fix nested query with fk as pk ([#2650](https://github.com/mikro-orm/mikro-orm/issues/2650)) ([cc54ff9](https://github.com/mikro-orm/mikro-orm/commit/cc54ff94e6c3bc79fd6fb67b169df7489cd1405c)), closes [#2648](https://github.com/mikro-orm/mikro-orm/issues/2648)
* **core:** fix ordering by pivot table with explicit schema name ([eb1f9bb](https://github.com/mikro-orm/mikro-orm/commit/eb1f9bb1b10beedfbd5bf4b27aabe485e68e1dc9)), closes [#2621](https://github.com/mikro-orm/mikro-orm/issues/2621)
* **core:** fix persisting complex composite keys in m:1 relations ([9f91b54](https://github.com/mikro-orm/mikro-orm/commit/9f91b5470e3fba415ff239cc983680dee20dcaef)), closes [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **core:** fix pivot tables for wild card schema entities ([623dc91](https://github.com/mikro-orm/mikro-orm/commit/623dc9188b4cd1de30ac0feb190de036d1739e16)), closes [#2690](https://github.com/mikro-orm/mikro-orm/issues/2690)
* **core:** fix populating entities with wildcard schema ([98d0bfb](https://github.com/mikro-orm/mikro-orm/commit/98d0bfb30e268f1a391f4364fe6acb9049a607cb))
* **core:** fix propagation of locking option with select-in population ([f3990d0](https://github.com/mikro-orm/mikro-orm/commit/f3990d0e6eabd40434bbf8d5259519a99423e514)), closes [#1670](https://github.com/mikro-orm/mikro-orm/issues/1670)
* **core:** fix querying by complex composite keys via entity instance ([293a3cb](https://github.com/mikro-orm/mikro-orm/commit/293a3cbf4498a38ff7a8badaf7d5d4f1b46d2716)), closes [#1695](https://github.com/mikro-orm/mikro-orm/issues/1695)
* **core:** fix querying by JSON properties ([73108b1](https://github.com/mikro-orm/mikro-orm/commit/73108b183542ef34b4893d5859794e166a82ce39)), closes [#1673](https://github.com/mikro-orm/mikro-orm/issues/1673)
* **core:** fix reflection of enums in babel ([a5b8ee9](https://github.com/mikro-orm/mikro-orm/commit/a5b8ee9f20b6aceff6871765feff41b016fc6acc)), closes [#2198](https://github.com/mikro-orm/mikro-orm/issues/2198)
* **core:** fix serialization of self referencing collections ([79c2a10](https://github.com/mikro-orm/mikro-orm/commit/79c2a10ba077c29c4d233abe22da8f8b389efdb1)), closes [#2059](https://github.com/mikro-orm/mikro-orm/issues/2059)
* **core:** fix state of entities from result cached ([0d95eef](https://github.com/mikro-orm/mikro-orm/commit/0d95eef2311f671db18141e90d7521668f0e267a)), closes [#1704](https://github.com/mikro-orm/mikro-orm/issues/1704)
* **core:** fix support for nested composite PKs ([14dcff8](https://github.com/mikro-orm/mikro-orm/commit/14dcff8f301577d64d99b7d71e392f211a5e178e)), closes [#2647](https://github.com/mikro-orm/mikro-orm/issues/2647)
* **core:** fix transaction context in nested transactions ([091e60d](https://github.com/mikro-orm/mikro-orm/commit/091e60d5636959477176d851ef112ab53f1c6609)), closes [#1910](https://github.com/mikro-orm/mikro-orm/issues/1910)
* **core:** improve partial loading of 1:m relations ([3ddde1e](https://github.com/mikro-orm/mikro-orm/commit/3ddde1e9a5e31c245da44ebaa96332ee61ef0c61)), closes [#2651](https://github.com/mikro-orm/mikro-orm/issues/2651)
* **core:** issue delete queries after extra/collection updates ([66468da](https://github.com/mikro-orm/mikro-orm/commit/66468da1bcc2ea02fc9bf6b7f87ab5cc16b84cb0))
* **core:** issue early delete queries for recreating unique properties ([decfd10](https://github.com/mikro-orm/mikro-orm/commit/decfd10721958db51752e59c1827c6ad2e29ab55)), closes [#2273](https://github.com/mikro-orm/mikro-orm/issues/2273)
* **core:** make entity helper property non-enumerable ([3cac0cf](https://github.com/mikro-orm/mikro-orm/commit/3cac0cfccb0ae1145f9bb2260e7ecb8020275080))
* **core:** propagate `em.remove()` to 1:m collections ([c23c39c](https://github.com/mikro-orm/mikro-orm/commit/c23c39cf70a3f417a6537a2941db87b89b6d78db)), closes [#2395](https://github.com/mikro-orm/mikro-orm/issues/2395)
* **core:** propagate `em.remove()` to m:1 properties of 1:m relations ([e6fa2f7](https://github.com/mikro-orm/mikro-orm/commit/e6fa2f7841b4508406d3a36caec31f63b2aaa4bf)), closes [#2636](https://github.com/mikro-orm/mikro-orm/issues/2636)
* **core:** propagate unsetting of 1:1 from inverse side ([1e78977](https://github.com/mikro-orm/mikro-orm/commit/1e78977c4846b0436b5fc6e5f91137faefaf681b)), closes [#1872](https://github.com/mikro-orm/mikro-orm/issues/1872)
* **core:** rehydrate custom types when using metadata cache ([3bcb9a5](https://github.com/mikro-orm/mikro-orm/commit/3bcb9a52d1bcfd2596826603f2e090b7c8baddf9)), closes [#2489](https://github.com/mikro-orm/mikro-orm/issues/2489)
* **core:** reload default values after flush in mysql/sqlite ([d57a6a9](https://github.com/mikro-orm/mikro-orm/commit/d57a6a9a4583c4771777bd60ad914647cad8cdb0)), closes [#2581](https://github.com/mikro-orm/mikro-orm/issues/2581)
* **core:** remove entity from its bidirectional relations after delete ([7e40b5c](https://github.com/mikro-orm/mikro-orm/commit/7e40b5cb664cb8f3fef5623308f0a6849392f80e)), closes [#2238](https://github.com/mikro-orm/mikro-orm/issues/2238)
* **core:** reset current transaction before running `afterFlush` event ([d98837d](https://github.com/mikro-orm/mikro-orm/commit/d98837d5d67171a26f7cc8dc46f9ada9a5d42092)), closes [#1824](https://github.com/mikro-orm/mikro-orm/issues/1824)
* **core:** respect filters defined on base entities ([65fec06](https://github.com/mikro-orm/mikro-orm/commit/65fec06c6ed467a70cf80ff5eef49712aa8277bb)), closes [#1979](https://github.com/mikro-orm/mikro-orm/issues/1979)
* **core:** respect read replica options ([#2152](https://github.com/mikro-orm/mikro-orm/issues/2152)) ([9ec668d](https://github.com/mikro-orm/mikro-orm/commit/9ec668d201d9017359812d8bebcfc063aac60f55)), closes [#1963](https://github.com/mikro-orm/mikro-orm/issues/1963)
* **core:** respect specified schema when populating (select-in) ([#2676](https://github.com/mikro-orm/mikro-orm/issues/2676)) ([21a1be0](https://github.com/mikro-orm/mikro-orm/commit/21a1be0083a05576c49934db939b36e7dd30f391))
* **core:** rework orphan removal and cascading ([#2532](https://github.com/mikro-orm/mikro-orm/issues/2532)) ([eb3ea4a](https://github.com/mikro-orm/mikro-orm/commit/eb3ea4a5c187706ea745cb160d2078d57a975e53))
* **core:** save collection snapshots recursively after flush ([3f5ba2f](https://github.com/mikro-orm/mikro-orm/commit/3f5ba2fb27695da6731d6f79937c849aa0137b8d)), closes [#2410](https://github.com/mikro-orm/mikro-orm/issues/2410) [#2411](https://github.com/mikro-orm/mikro-orm/issues/2411)
* **core:** schedule orphan removal on 1:1 inverse sides when relation nulled ([a904fe8](https://github.com/mikro-orm/mikro-orm/commit/a904fe841f15334ed79fdb41d63af0036c7e628d)), closes [#2273](https://github.com/mikro-orm/mikro-orm/issues/2273)
* **core:** support extending in `tsconfig.json` ([#1804](https://github.com/mikro-orm/mikro-orm/issues/1804)) ([e1e0adb](https://github.com/mikro-orm/mikro-orm/commit/e1e0adb09fdfbb2f9bf57fdac68e2a5a2e21957d)), closes [#1792](https://github.com/mikro-orm/mikro-orm/issues/1792)
* **core:** support getters in `EntitySchema` property types ([9858205](https://github.com/mikro-orm/mikro-orm/commit/9858205facbed3935a081d493f629d031df2de01)), closes [#1867](https://github.com/mikro-orm/mikro-orm/issues/1867)
* **core:** support loading lazy scalar properties via `em.populate()` ([c20fe88](https://github.com/mikro-orm/mikro-orm/commit/c20fe883268ecd844d31818dd59cf0cf24b16d2b)), closes [#1479](https://github.com/mikro-orm/mikro-orm/issues/1479)
* **core:** sync `MigrateOptions` type in core with migrations package ([#2259](https://github.com/mikro-orm/mikro-orm/issues/2259)) ([d4b8c2c](https://github.com/mikro-orm/mikro-orm/commit/d4b8c2ca07fda96c0935b595fabd7c19ceed904f))
* **core:** truly load the whole entity graph when `populate: true` ([3c21663](https://github.com/mikro-orm/mikro-orm/commit/3c216638f2f472bffd90a41dea69e1db2ecfe23d)), closes [#1134](https://github.com/mikro-orm/mikro-orm/issues/1134)
* **core:** use `$and` for merging of multiple filter conditions ([0a0622a](https://github.com/mikro-orm/mikro-orm/commit/0a0622aecac0ba96a39172745fd4bad4ea44edb3)), closes [#1776](https://github.com/mikro-orm/mikro-orm/issues/1776)
* **core:** use clean internal identity map with `disableIdentityMap` ([0677d74](https://github.com/mikro-orm/mikro-orm/commit/0677d74664e975c0b16afb1b90da260e9d7df1a3)), closes [#1307](https://github.com/mikro-orm/mikro-orm/issues/1307)
* **core:** use tsconfig-paths loadConfig function ([#1854](https://github.com/mikro-orm/mikro-orm/issues/1854)) ([76e8d1c](https://github.com/mikro-orm/mikro-orm/commit/76e8d1c787bce0b432f3b171171edf65908e42f0)), closes [#1849](https://github.com/mikro-orm/mikro-orm/issues/1849)
* **embeddables:** add missing serialization options to `@Embedded()` ([9f91578](https://github.com/mikro-orm/mikro-orm/commit/9f91578ce55a5d80e908c8bef2c7cbac3d6eb73b)), closes [#2464](https://github.com/mikro-orm/mikro-orm/issues/2464)
* **embeddables:** allow using more than 10 embedded arrays ([7806667](https://github.com/mikro-orm/mikro-orm/commit/7806667afde2c4d76405b49c8e818dd4f0520104)), closes [#1912](https://github.com/mikro-orm/mikro-orm/issues/1912)
* **embeddables:** ensure order of discovery does not matter for embeddables ([b095d9e](https://github.com/mikro-orm/mikro-orm/commit/b095d9e70770e478b85d5ca644fa0f8e42365e2a)), closes [#2242](https://github.com/mikro-orm/mikro-orm/issues/2242)
* **embeddables:** fix validating nullable object embeddables ([8ab2941](https://github.com/mikro-orm/mikro-orm/commit/8ab2941d819b839cf588a04630fa69c5a9072f83)), closes [#2233](https://github.com/mikro-orm/mikro-orm/issues/2233)
* **embeddables:** order of discovery of embeddables should not matter ([d955b29](https://github.com/mikro-orm/mikro-orm/commit/d955b29913906a23ecc767c41c42292271fe7a8d)), closes [#2149](https://github.com/mikro-orm/mikro-orm/issues/2149)
* handle `file://` urls in normalizePath ([#2697](https://github.com/mikro-orm/mikro-orm/issues/2697)) ([127b0ae](https://github.com/mikro-orm/mikro-orm/commit/127b0ae8e5e1667484772286e7c26672dc01e16b))
* **mongo:** do not use separate update queries for M:N collections if not needed ([e57984d](https://github.com/mikro-orm/mikro-orm/commit/e57984d0d3048637c75b1f3f5ff46d0ed5528e92)), closes [#2483](https://github.com/mikro-orm/mikro-orm/issues/2483)
* **mongo:** fix extraction of child condition when populating ([66ab1c6](https://github.com/mikro-orm/mikro-orm/commit/66ab1c63dfa0ad71749aa11f996bc155848ec7ec)), closes [#1891](https://github.com/mikro-orm/mikro-orm/issues/1891)
* **mongo:** validate usage of migrator and entity generator ([1db1a63](https://github.com/mikro-orm/mikro-orm/commit/1db1a6376a4cd21412822cfbd1e68f7b178e54e6)), closes [#1801](https://github.com/mikro-orm/mikro-orm/issues/1801)
* **postgres:** add extra array operators ([#2467](https://github.com/mikro-orm/mikro-orm/issues/2467)) ([576117e](https://github.com/mikro-orm/mikro-orm/commit/576117e23699c5ce5ab954c9fbec8b6297e6b359))
* **postgres:** fix propagation of PKs with custom names ([41380de](https://github.com/mikro-orm/mikro-orm/commit/41380de018a4984bbfbc5e4fb27ec399225f88ac)), closes [#1990](https://github.com/mikro-orm/mikro-orm/issues/1990)
* **postgres:** support comparing array columns via `$eq` ([6eb320e](https://github.com/mikro-orm/mikro-orm/commit/6eb320e233633af7c9b26219393e2caa816fd59f)), closes [#2462](https://github.com/mikro-orm/mikro-orm/issues/2462)
* **schema:** improve diffing of default values for strings and dates ([d4ac638](https://github.com/mikro-orm/mikro-orm/commit/d4ac6385aa84208732f144e6bd9f68e8cf5c6697)), closes [#2385](https://github.com/mikro-orm/mikro-orm/issues/2385)
* **sti:** allow m:n relations between two STI entities ([6c797e9](https://github.com/mikro-orm/mikro-orm/commit/6c797e9e8f578bbcd77bdd1220e7b07e3d4d46e8)), closes [#2246](https://github.com/mikro-orm/mikro-orm/issues/2246)
* **sti:** fix prototype of child entity after it gets loaded ([a0827f5](https://github.com/mikro-orm/mikro-orm/commit/a0827f53c3dd28233406cc912ab772b97c3ad697)), closes [#2493](https://github.com/mikro-orm/mikro-orm/issues/2493) [#2364](https://github.com/mikro-orm/mikro-orm/issues/2364)
* **sti:** respect custom table names ([42a9522](https://github.com/mikro-orm/mikro-orm/commit/42a952213f4a33cab3f1e49bd215ebac9693aadd)), closes [#2356](https://github.com/mikro-orm/mikro-orm/issues/2356)
* **ts-morph:** fix validation of embedded polymorphic arrays ([b6a068a](https://github.com/mikro-orm/mikro-orm/commit/b6a068ae16c5bb9355c7544b7480e89923fa6560))
* **types:** fix populate type hints for nullable properties ([bc1bf76](https://github.com/mikro-orm/mikro-orm/commit/bc1bf763508af96fe8e64f7f806a8a70c1ba2e5a)), closes [#2701](https://github.com/mikro-orm/mikro-orm/issues/2701)
* **validation:** validate missing 1:m mappedBy key in factory ([e75fcff](https://github.com/mikro-orm/mikro-orm/commit/e75fcff68e2e2f9f66a84887ecd8aa4166d8bb2c)), closes [#2393](https://github.com/mikro-orm/mikro-orm/issues/2393)


### chore

* upgrade typescript to v4.5.2 ([2bd8220](https://github.com/mikro-orm/mikro-orm/commit/2bd8220378f47533ecc075ac5e04a4a50c4d9225))


### Code Refactoring

* **core:** `PrimaryKeyType` symbol should be defined as optional ([db0b399](https://github.com/mikro-orm/mikro-orm/commit/db0b399da133f7ca04c73347b1bd1a01c3c88001))
* **core:** remove `@Repository()` decorator ([17a55b6](https://github.com/mikro-orm/mikro-orm/commit/17a55b6ef726a8b696594e7bc2d63cb857b92559))
* **core:** remove `em.find/findOne` arguments in favour of options object ([7b577ab](https://github.com/mikro-orm/mikro-orm/commit/7b577ab88238f4ffccb593db50483ba61d037f23))
* **core:** return `Collection` instance from `LoadedCollection.get()/$` ([27cbe69](https://github.com/mikro-orm/mikro-orm/commit/27cbe6963ebca526395d44ed3ba95e58da14d4da)), closes [#2394](https://github.com/mikro-orm/mikro-orm/issues/2394)
* **core:** use options parameter in `em.merge()` ([aaee27c](https://github.com/mikro-orm/mikro-orm/commit/aaee27c1f475aab0eb3b3d9fea160f0bc941279e))
* **core:** use options parameters on `SchemaGenerator` ([7e48c5d](https://github.com/mikro-orm/mikro-orm/commit/7e48c5d2487d0f67838927f42efdcd4580a86fd0))
* enable `populateAfterFlush` by default ([6dc184c](https://github.com/mikro-orm/mikro-orm/commit/6dc184c84fd697f2a2660c14ed86de12c037dda3)), closes [#784](https://github.com/mikro-orm/mikro-orm/issues/784)
* use options parameters in `IDatabaseDriver` ([#2204](https://github.com/mikro-orm/mikro-orm/issues/2204)) ([9a32ac0](https://github.com/mikro-orm/mikro-orm/commit/9a32ac0655f7ec701399250b88605cc5f5fc3b2c))


### Features

* **cli:** allow exporting async functions from CLI config ([912728d](https://github.com/mikro-orm/mikro-orm/commit/912728d491be22aee7e893bbd854d0722b9e9f7b))
* **cli:** improve loading of CLI settings from package.json ([03f9ddd](https://github.com/mikro-orm/mikro-orm/commit/03f9dddcc748ee322adcf2886a05ef0605b36d95)), closes [#545](https://github.com/mikro-orm/mikro-orm/issues/545)
* **cli:** only warn with `useTsNode: true` without ts-node available ([5aff134](https://github.com/mikro-orm/mikro-orm/commit/5aff134d6c2a2be7093a465de68a33b41829cc0a)), closes [#1957](https://github.com/mikro-orm/mikro-orm/issues/1957)
* **core:** add `em.clearCache(key)` method ([1ccfad8](https://github.com/mikro-orm/mikro-orm/commit/1ccfad858ecb6e7130004c037a956cb5f15d7bc3))
* **core:** add `EventType.onLoad` that fires after entity is fully loaded ([14c2fa9](https://github.com/mikro-orm/mikro-orm/commit/14c2fa9763d9bbabc43e2b513d9285ed52df3de2))
* **core:** add `freshEventManager` to `em.fork()` options ([a0f3fd0](https://github.com/mikro-orm/mikro-orm/commit/a0f3fd09a7818ad9bebf6074b44c09ecced23858)), closes [#1741](https://github.com/mikro-orm/mikro-orm/issues/1741)
* **core:** add `persistOnCreate` option and enable it for seeder ([f0fec1b](https://github.com/mikro-orm/mikro-orm/commit/f0fec1b917a228869482bf781d256ab68c0b138c)), closes [#2629](https://github.com/mikro-orm/mikro-orm/issues/2629)
* **core:** add `populateWhere` option ([#2660](https://github.com/mikro-orm/mikro-orm/issues/2660)) ([16c5e91](https://github.com/mikro-orm/mikro-orm/commit/16c5e91545b11057b9e78c3f6d910cc409f7f8c1))
* **core:** add `QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER` ([be9d9e1](https://github.com/mikro-orm/mikro-orm/commit/be9d9e16d59991fe2ea7a20db56602557845d813)), closes [#1660](https://github.com/mikro-orm/mikro-orm/issues/1660)
* **core:** add `Reference.createFromPK()` helper method ([2217154](https://github.com/mikro-orm/mikro-orm/commit/2217154f15f1f2263bbe7c8c81b789c95eb7f6bb))
* **core:** add callback parameter to `Collection.remove()` ([0b37654](https://github.com/mikro-orm/mikro-orm/commit/0b376544d4dd6ff551e4b65bede225b110e0e4b4)), closes [#2398](https://github.com/mikro-orm/mikro-orm/issues/2398)
* **core:** add custom table check constraint support for postgres ([#2688](https://github.com/mikro-orm/mikro-orm/issues/2688)) ([89aca5f](https://github.com/mikro-orm/mikro-orm/commit/89aca5f41cf85bad8bbea51d0c1f9983ec01e903))
* **core:** add index/key name to naming strategy ([a842e3e](https://github.com/mikro-orm/mikro-orm/commit/a842e3eea80349777ccdf7b8840b3c1860e9607f))
* **core:** add PlainObject class that DTO's can extend to treat class as POJO ([#1837](https://github.com/mikro-orm/mikro-orm/issues/1837)) ([645b27a](https://github.com/mikro-orm/mikro-orm/commit/645b27a4d00a8d607e1d18303be8896a5c87a25b))
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
* **core:** automatically infer `populate` hint based on `fields` ([0097539](https://github.com/mikro-orm/mikro-orm/commit/0097539c762c7c79e703bf02cffb24321f11a2b0)), closes [#2468](https://github.com/mikro-orm/mikro-orm/issues/2468)
* **core:** conditionally support folder based discovery of ESM ([8c8f0d0](https://github.com/mikro-orm/mikro-orm/commit/8c8f0d0a472c29ddd0696ccdd145ac138a9a8f69)), closes [#2631](https://github.com/mikro-orm/mikro-orm/issues/2631)
* **core:** expose `referencedColumnNames` on m:1/1:1 decorators ([2f5a5e1](https://github.com/mikro-orm/mikro-orm/commit/2f5a5e1b3d3fb97da6b993c4c3795553300d8d15)), closes [#593](https://github.com/mikro-orm/mikro-orm/issues/593)
* **core:** implement auto-flush mode ([#2491](https://github.com/mikro-orm/mikro-orm/issues/2491)) ([f1d8bf1](https://github.com/mikro-orm/mikro-orm/commit/f1d8bf1dcdc769d4db2d79c7fb022b8d11007ce5)), closes [#2359](https://github.com/mikro-orm/mikro-orm/issues/2359)
* **core:** implement auto-refreshing of loaded entities ([#2263](https://github.com/mikro-orm/mikro-orm/issues/2263)) ([9dce38c](https://github.com/mikro-orm/mikro-orm/commit/9dce38cd69667907e1eba5cef609ac4ddf6a2945)), closes [#2292](https://github.com/mikro-orm/mikro-orm/issues/2292)
* **core:** implement partial loading support for joined loading strategy ([2bebb5e](https://github.com/mikro-orm/mikro-orm/commit/2bebb5e75595ae3369887ee8bed7be48efc45173)), closes [#1707](https://github.com/mikro-orm/mikro-orm/issues/1707)
* **core:** keep collection state of dirty collections after initializing ([49ed651](https://github.com/mikro-orm/mikro-orm/commit/49ed65149c6cf02ef6afb533c697a8e0ae281a3a)), closes [#2408](https://github.com/mikro-orm/mikro-orm/issues/2408)
* **core:** make `em.create()` respect required properties ([2385f1d](https://github.com/mikro-orm/mikro-orm/commit/2385f1d18b1b5235750fc5f29b4d51fe04aca7b8))
* **core:** make `FindOptions.fields` strictly typed (dot notation) ([fd43099](https://github.com/mikro-orm/mikro-orm/commit/fd43099a63cae31ba32f833bed1b75c13f2dd43c))
* **core:** make `populate` parameter strictly typed with dot notation ([3372f02](https://github.com/mikro-orm/mikro-orm/commit/3372f0243f1af34e22a16be2cecba6dc5c04dd0d))
* **core:** move `@UseRequestContext()` decorator to `core` package ([253216d](https://github.com/mikro-orm/mikro-orm/commit/253216d25ef49b32f14958e8892adb00b5d46482))
* **core:** rework deep assigning of entities and enable it by default ([#1978](https://github.com/mikro-orm/mikro-orm/issues/1978)) ([8f455ad](https://github.com/mikro-orm/mikro-orm/commit/8f455ad7dfe37d75f5abb3a83ac4610be74d43a7))
* **core:** support column names with spaces ([00b54b4](https://github.com/mikro-orm/mikro-orm/commit/00b54b46f627cf820d40e0f68eaadcea86236801)), closes [#1617](https://github.com/mikro-orm/mikro-orm/issues/1617)
* **core:** use `AsyncLocalStorage` instead of `domain` API ([be27bf7](https://github.com/mikro-orm/mikro-orm/commit/be27bf7329675e0f4371f9d47800ea8fcbe6ca3f))
* **core:** validate populate hint on runtime for joined strategy too ([94877e3](https://github.com/mikro-orm/mikro-orm/commit/94877e3d7800c325cfe7e4b75380df8d8e224718)), closes [#2527](https://github.com/mikro-orm/mikro-orm/issues/2527)
* **core:** validate required properties before flushing new entities ([9eec3a9](https://github.com/mikro-orm/mikro-orm/commit/9eec3a9b018830a37ba57e5e5cdd27a48e97d7b1)), closes [#2176](https://github.com/mikro-orm/mikro-orm/issues/2176)
* **core:** validate usage of global context ([#2381](https://github.com/mikro-orm/mikro-orm/issues/2381)) ([f0cbcc2](https://github.com/mikro-orm/mikro-orm/commit/f0cbcc2d977ffb8b867a21ee2ac857ef26986d73))
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **embeddables:** allow using m:1 properties inside embeddables ([#1948](https://github.com/mikro-orm/mikro-orm/issues/1948)) ([ffca73e](https://github.com/mikro-orm/mikro-orm/commit/ffca73ecf3ecf405dee3042ad0ab60848721ab7b))
* **embeddables:** support `onCreate` and `onUpdate` ([288899d](https://github.com/mikro-orm/mikro-orm/commit/288899d34966775133321ef1f06d20a914955dfe)), closes [#2283](https://github.com/mikro-orm/mikro-orm/issues/2283) [#2391](https://github.com/mikro-orm/mikro-orm/issues/2391)
* **entity-generator:** add enum generation support ([#2608](https://github.com/mikro-orm/mikro-orm/issues/2608)) ([1e0b411](https://github.com/mikro-orm/mikro-orm/commit/1e0b411dad3cb0ebb456b34e1bcac9a71f059c48))
* **entity-generator:** allow specifying schema ([beb2993](https://github.com/mikro-orm/mikro-orm/commit/beb299383c647f9f2d7431e177659d299fb0f041)), closes [#1301](https://github.com/mikro-orm/mikro-orm/issues/1301)
* **filters:** add `em` parameter to the filter callback parameters ([6858986](https://github.com/mikro-orm/mikro-orm/commit/6858986060e10e6170186094469df6e354a7413e)), closes [#2214](https://github.com/mikro-orm/mikro-orm/issues/2214)
* **migrations:** allow providing custom `MigrationGenerator` ([3cc366b](https://github.com/mikro-orm/mikro-orm/commit/3cc366b7a7e269a2c527edc324695620e8025163)), closes [#1913](https://github.com/mikro-orm/mikro-orm/issues/1913)
* **migrations:** allow using migrations with ES modules ([072f23f](https://github.com/mikro-orm/mikro-orm/commit/072f23fe873c969f77a519ef5b997c30e3246093)), closes [#2631](https://github.com/mikro-orm/mikro-orm/issues/2631)
* **migrations:** store migrations without extensions ([4036716](https://github.com/mikro-orm/mikro-orm/commit/40367166f9e74a042e2f6314f31877f27a15a14d)), closes [#2239](https://github.com/mikro-orm/mikro-orm/issues/2239)
* **migrations:** use snapshots for generating diffs in new migrations ([#1815](https://github.com/mikro-orm/mikro-orm/issues/1815)) ([9c37f61](https://github.com/mikro-orm/mikro-orm/commit/9c37f6141d8723d6c472dfd3557a1d749d344455))
* **mongo:** add `SchemaGenerator` support for mongo ([#2658](https://github.com/mikro-orm/mikro-orm/issues/2658)) ([cc11859](https://github.com/mikro-orm/mikro-orm/commit/cc1185971d1ee5780b183623a8afb455b3f79d3a))
* **mongo:** upgrade node-mongodb to v4 ([#2425](https://github.com/mikro-orm/mikro-orm/issues/2425)) ([2e4c135](https://github.com/mikro-orm/mikro-orm/commit/2e4c1350be693dbdde4ce99f720cf23202ae6f76))
* **schema:** add support for timestamp columns in mysql ([a224ec9](https://github.com/mikro-orm/mikro-orm/commit/a224ec9137afe035bd0ed8d6e77376bc076a0f45)), closes [#2386](https://github.com/mikro-orm/mikro-orm/issues/2386)
* **schema:** allow disabling foreign key constraints ([fcdb236](https://github.com/mikro-orm/mikro-orm/commit/fcdb236eb8112ebaed3450892f51fd469902ac62)), closes [#2548](https://github.com/mikro-orm/mikro-orm/issues/2548)
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)
* **seeder:** add seeder package ([#929](https://github.com/mikro-orm/mikro-orm/issues/929)) ([2b86e22](https://github.com/mikro-orm/mikro-orm/commit/2b86e22eb061060ee2c67a85741b99c1ddcac9c0)), closes [#251](https://github.com/mikro-orm/mikro-orm/issues/251)
* **sql:** add callback signature to `expr()` with alias parameter ([48702c7](https://github.com/mikro-orm/mikro-orm/commit/48702c7576f63f0a19dd81612ffae339b2988e62)), closes [#2405](https://github.com/mikro-orm/mikro-orm/issues/2405)
* **sql:** allow setting transaction isolation level ([6ae5fbf](https://github.com/mikro-orm/mikro-orm/commit/6ae5fbf70dd87fe2380b74d83bc8a04bb8f447fe)), closes [#819](https://github.com/mikro-orm/mikro-orm/issues/819)
* **sql:** allow tuple comparison via `expr` helper ([90777a7](https://github.com/mikro-orm/mikro-orm/commit/90777a7f5ac3619d2ef902eb9dc69ed6d762ca33)), closes [#2399](https://github.com/mikro-orm/mikro-orm/issues/2399)
* **sql:** generate down migrations automatically ([#2139](https://github.com/mikro-orm/mikro-orm/issues/2139)) ([7d78d0c](https://github.com/mikro-orm/mikro-orm/commit/7d78d0cb853250b20a8d79bf5036885256f19848))
* support flushing via `Promise.all()` ([f788773](https://github.com/mikro-orm/mikro-orm/commit/f788773de2b6cbefbff6cc72600017eae1f4df22)), closes [#2412](https://github.com/mikro-orm/mikro-orm/issues/2412)
* **typings:** make `em.create()` and other methods strict ([#1718](https://github.com/mikro-orm/mikro-orm/issues/1718)) ([e8b7119](https://github.com/mikro-orm/mikro-orm/commit/e8b7119eca0df7d686a7d3d91bfc17b74baaeea1)), closes [#1456](https://github.com/mikro-orm/mikro-orm/issues/1456)
* **typings:** make `toObject()` and similar strict ([#1719](https://github.com/mikro-orm/mikro-orm/issues/1719)) ([c202396](https://github.com/mikro-orm/mikro-orm/commit/c202396a205b710b8afcd68f6a7ccc5a0ab64769))


### Performance Improvements

* **core:** define `Reference` properties on prototype ([4ba390d](https://github.com/mikro-orm/mikro-orm/commit/4ba390d59bb65f56d8154e8b7a387c29ab01e3d5))
* **core:** do not redefine `Collection` properties as non-enumerable ([8a604a6](https://github.com/mikro-orm/mikro-orm/commit/8a604a69fe684fac7df8b93a3cc88d1ad47a76ff))
* **core:** do not update entity state on forking EM ([de3191c](https://github.com/mikro-orm/mikro-orm/commit/de3191c55b58aeba33704c085755bec170db7f07))
* **core:** reuse EntityComparator on fork() ([#2496](https://github.com/mikro-orm/mikro-orm/issues/2496)) ([b2a9b12](https://github.com/mikro-orm/mikro-orm/commit/b2a9b12d459ec7a5aab0b2e3cf1032715a9ef5c8))
* **core:** use shared memory for cycles when computing change sets ([ced0fad](https://github.com/mikro-orm/mikro-orm/commit/ced0fad3088239aeffee1e788008de56a9f51eec)), closes [#2379](https://github.com/mikro-orm/mikro-orm/issues/2379)
* **core:** various small performance improvements in UoW ([84b5d1b](https://github.com/mikro-orm/mikro-orm/commit/84b5d1b1b867de7cfa8e1349327dc96b7250d4eb))


### BREAKING CHANGES

* **core:** Previously the validation took place in the database, so it worked only for SQL
drivers. Now we have runtime validation based on the entity metadata. This means
mongo users now need to use `nullable: true` on their optional properties, or
disable the validation globally via `validateRequired: false` in the ORM config.
* **core:** Previously when we had nonstandard PK types, we could use `PrimaryKeyType` symbol
to let the type system know it. It was required to define this property as required,
now it can be defined as optional too.
* **core:** `em.create()` will now require you to pass all non-optional properties. Some properties
might be defined as required for TS but we have a default value for them (either runtime,
or database one) - for such we can use `OptionalProps` symbol to specify which properties
should be considered as optional.
* After flushing a new entity, all relations are marked as populated,
just like if the entity was loaded from the db. This aligns the serialized
output of `e.toJSON()` of a loaded entity and just-inserted one.

In v4 this behaviour was disabled by default, so even after the new entity was
flushed, the serialized form contained only FKs for its relations. We can opt in
to this old behaviour via `populateAfterFlush: false`.
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
* **core:** Previously those dynamically added getters returned the array copy of collection
items. In v5, we return the collection instance, which is also iterable and has
a `length` getter and indexed access support, so it mimics the array. To get the
array copy as before, call `getItems()` as with a regular collection.
* **core:** `em.getReference()` now has options parameter.
* Most of the methods on IDatabaseDriver interface now have different signature.
* **core:** The decorator was problematic as it could only work properly it the file was required
soon enough - before the ORM initialization, otherwise the repository would not be
registered at all.

Use `@Entity({ customRepository: () => CustomRepository })` in the entity definition
instead.
* **core:** `em.fork()` now has an options object parameter instead of the separate boolean params.
* **core:** `merge()` has now the last parameter as options object instead of two separate bool params.
* **core:** Populate parameter is now strictly typed and supports only array of strings or a boolean.
Object way is no longer supported. To set loading strategy, use `FindOptions.strategy`.
* **core:** Following method signatures changed, options parameter is now the only way to set things like
`populate`, `orderBy`, etc.
- `em.find()`
- `em.findOne()`
- `em.findOneOrFail()`
- `em.findAndCount()`
- `repo.find()`
- `repo.findOne()`
- `repo.findOneOrFail()`
- `repo.findAndCount()`
- `repo.findAll()`
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
* **typings:** Some methods are now strictly typed, so previously fine usages might be restricted on TS level.
To get around those, we might either cast as `any`, provide the generic `T` type as `any`, or
use `expr` helper.

```ts
em.create(User, { someNotDefinedProp: 123 }); // throws if someNotDefinedProp not on the User
em.create(User, { [expr('someNotDefinedProp')]: 123 }); // works, using expr
em.create<any>(User, { someNotDefinedProp: 123 }); // works, using type cast
em.create(User, { someNotDefinedProp: 123 } as any); // works, using type cast
```
* **core:** Node ">= 12.17.0 || >= 13.10.0" required.





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)


### Bug Fixes

* **core:** allow putting not managed entities to remove stack ([0edb72e](https://github.com/mikro-orm/mikro-orm/commit/0edb72e03486f4ae417c0f3d0719e61f6dd3ad5a)), closes [#2395](https://github.com/mikro-orm/mikro-orm/issues/2395)
* **core:** defer cascading of persist operation ([7d18310](https://github.com/mikro-orm/mikro-orm/commit/7d183105341336c3f407f90f800906373676e1a4)), closes [#2161](https://github.com/mikro-orm/mikro-orm/issues/2161)
* **core:** do not override internal EM instance when forking EM ([fb0abf9](https://github.com/mikro-orm/mikro-orm/commit/fb0abf93c8d33b73f82b748c0a175f753c77a4e0)), closes [#2342](https://github.com/mikro-orm/mikro-orm/issues/2342)
* **core:** do not save entity state in `merge` when it's not initialized ([bdd7452](https://github.com/mikro-orm/mikro-orm/commit/bdd745217d22515109649c5403230eb4fecf4a9b)), closes [#1927](https://github.com/mikro-orm/mikro-orm/issues/1927)
* **core:** fix assigning to object property without value ([aca56e1](https://github.com/mikro-orm/mikro-orm/commit/aca56e183ade6b402c615e628a9fb33da9f1706b)), closes [#2492](https://github.com/mikro-orm/mikro-orm/issues/2492)
* **core:** fix collection state when `forceEntityConstructor` is used ([53d4c39](https://github.com/mikro-orm/mikro-orm/commit/53d4c39ce2447978cb7b0e4a05a060c62cf738f5)), closes [#2406](https://github.com/mikro-orm/mikro-orm/issues/2406) [#2409](https://github.com/mikro-orm/mikro-orm/issues/2409)
* **core:** fix reflection of enums in babel ([05dee1d](https://github.com/mikro-orm/mikro-orm/commit/05dee1dbc355e6646374ec9115a4eaba4c0f900f)), closes [#2198](https://github.com/mikro-orm/mikro-orm/issues/2198)
* **core:** fix serialization of self referencing collections ([fdbe4f4](https://github.com/mikro-orm/mikro-orm/commit/fdbe4f4c4c29d7cf115631a3455acfcd1df658f6)), closes [#2059](https://github.com/mikro-orm/mikro-orm/issues/2059)
* **core:** rehydrate custom types when using metadata cache ([3ea37a6](https://github.com/mikro-orm/mikro-orm/commit/3ea37a6c7cb2761630c8a89e558bba2abfb9e261)), closes [#2489](https://github.com/mikro-orm/mikro-orm/issues/2489)
* **core:** remove entity from its bidirectional relations after delete ([c754a62](https://github.com/mikro-orm/mikro-orm/commit/c754a62f6b7659cf631f3b3ab49a60b3e626702f)), closes [#2238](https://github.com/mikro-orm/mikro-orm/issues/2238)
* **embeddables:** add missing serialization options to `@Embedded()` ([aca6d08](https://github.com/mikro-orm/mikro-orm/commit/aca6d080e206e5a7b7d11647c01fe0e457b409c1)), closes [#2464](https://github.com/mikro-orm/mikro-orm/issues/2464)
* **embeddables:** ensure order of discovery does not matter for embeddables ([e3f9dbc](https://github.com/mikro-orm/mikro-orm/commit/e3f9dbc10fdd2571fd83706a05cc1117eae8a58f)), closes [#2242](https://github.com/mikro-orm/mikro-orm/issues/2242)
* **embeddables:** fix validating nullable object embeddables ([d60dded](https://github.com/mikro-orm/mikro-orm/commit/d60dded063d2a94802575cdfd445df3cbfcd99b2)), closes [#2233](https://github.com/mikro-orm/mikro-orm/issues/2233)
* **mongo:** do not use separate update queries for M:N collections if not needed ([f6383a0](https://github.com/mikro-orm/mikro-orm/commit/f6383a0a2b49519114e2bf34786d91b17527db47)), closes [#2483](https://github.com/mikro-orm/mikro-orm/issues/2483)
* **postgres:** add extra array operators ([#2467](https://github.com/mikro-orm/mikro-orm/issues/2467)) ([a1fd357](https://github.com/mikro-orm/mikro-orm/commit/a1fd357eb26404a6638d52ddd5110771412dd922))
* **sti:** fix prototype of child entity after it gets loaded ([e78942a](https://github.com/mikro-orm/mikro-orm/commit/e78942ab93789be3c353c0d75444b80bbeee51e0)), closes [#2493](https://github.com/mikro-orm/mikro-orm/issues/2493) [#2364](https://github.com/mikro-orm/mikro-orm/issues/2364)
* **sti:** respect custom table names ([b17aea9](https://github.com/mikro-orm/mikro-orm/commit/b17aea9c05f0fbcd7cd9b646a9542cf733edaaf6)), closes [#2356](https://github.com/mikro-orm/mikro-orm/issues/2356)
* **validation:** validate missing 1:m mappedBy key in factory ([7ef40c0](https://github.com/mikro-orm/mikro-orm/commit/7ef40c04bfabee0b6278784f0241ffb4a66d484b)), closes [#2393](https://github.com/mikro-orm/mikro-orm/issues/2393)


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
