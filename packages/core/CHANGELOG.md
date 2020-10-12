# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
