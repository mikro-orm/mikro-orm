# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)


### Bug Fixes

* **core:** allow async filter callbacks in `em.addFilter()` on type level ([308c45b](https://github.com/mikro-orm/mikro-orm/commit/308c45bcdc0ae88b263cf6f35f7ab66f91cf97df))
* **core:** fallback to direct property access ([320c52f](https://github.com/mikro-orm/mikro-orm/commit/320c52f8066bb5471a72c70e6bb87aa9b562e17f)), closes [#4434](https://github.com/mikro-orm/mikro-orm/issues/4434) [#4216](https://github.com/mikro-orm/mikro-orm/issues/4216)
* **core:** fix extra updates when `forceEntityConstructor` enabled ([41874eb](https://github.com/mikro-orm/mikro-orm/commit/41874eb8c8c5ec3f62894d0b79e66df2ef799b56)), closes [#4426](https://github.com/mikro-orm/mikro-orm/issues/4426)
* **core:** respect `undefined` when assigning to object properties ([217ff8f](https://github.com/mikro-orm/mikro-orm/commit/217ff8f7321b6ed2551df5214f9f5934bb6d8896)), closes [#4428](https://github.com/mikro-orm/mikro-orm/issues/4428)
* **core:** respect falsy values in `em.upsert` ([ef22b21](https://github.com/mikro-orm/mikro-orm/commit/ef22b21ad853c020fcd1c149d61714b40d7d390a)), closes [#4420](https://github.com/mikro-orm/mikro-orm/issues/4420)
* **mongo:** allow saving self-references inside M:N properties in one flush ([c1b5fc4](https://github.com/mikro-orm/mikro-orm/commit/c1b5fc49de2b962e4d44b5673a8df1437f0f71ab)), closes [#4431](https://github.com/mikro-orm/mikro-orm/issues/4431)


### Features

* **core:** add `em.getMetadata(Entity)` shortcut ([e5834b4](https://github.com/mikro-orm/mikro-orm/commit/e5834b4314c190c1557aeddf31c88131ea855d89))
* **core:** support Uint8Array ([#4419](https://github.com/mikro-orm/mikro-orm/issues/4419)) ([01a9c59](https://github.com/mikro-orm/mikro-orm/commit/01a9c5973d723827e485ce0f9a36ea03b24db676)), closes [#4418](https://github.com/mikro-orm/mikro-orm/issues/4418)





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)


### Bug Fixes

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
* **core:** ensure strict type-checking of enum queries ([8f8464a](https://github.com/mikro-orm/mikro-orm/commit/8f8464a53cb8125b8fe7f9cf11c4962b435c9f24))


### Features

* **query-builder:** add `qb.returning()` ([b5ab66b](https://github.com/mikro-orm/mikro-orm/commit/b5ab66bccf4dc3867194a6ba50626d4891646fe1))





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)


### Bug Fixes

* **core:** deprecate `@Subscriber()` decorator ([033b71d](https://github.com/mikro-orm/mikro-orm/commit/033b71d8ecb3313a51fb042b088c886f303c72f0))
* **core:** revert the `const enums` as they break projects with `isolatedModules` ([8b23674](https://github.com/mikro-orm/mikro-orm/commit/8b2367401d055590e402241a46a996c2b026e873)), closes [#4350](https://github.com/mikro-orm/mikro-orm/issues/4350)


### Features

* **core:** add `options` argument to filter callback ([c57ee5e](https://github.com/mikro-orm/mikro-orm/commit/c57ee5e3efda1d1516a0295a5b395f01dccdcad3)), closes [#4352](https://github.com/mikro-orm/mikro-orm/issues/4352)





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


### Features

* **core:** add `beforeUpsert` and `afterUpsert` events ([db9ff09](https://github.com/mikro-orm/mikro-orm/commit/db9ff0974c0c51450729aec81436bacffb2362f6)), closes [#4282](https://github.com/mikro-orm/mikro-orm/issues/4282)
* **core:** allow creating DELETE changesets via `uow.computeChangeSet()` ([61479b6](https://github.com/mikro-orm/mikro-orm/commit/61479b642751f9bc347ae2ab6f0bbf630d6a6295)), closes [#4280](https://github.com/mikro-orm/mikro-orm/issues/4280)
* **core:** allow disabling validation for duplicate `tableName` ([dfb87bf](https://github.com/mikro-orm/mikro-orm/commit/dfb87bf96d801666edb30a35da41a6cf9e2369d9))





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)


### Bug Fixes

* **core:** don't skip updates from propagation triggered via `em.create()` ([30778c3](https://github.com/mikro-orm/mikro-orm/commit/30778c35667d275bf4407a762feb1a92d91f7fe2)), closes [#4209](https://github.com/mikro-orm/mikro-orm/issues/4209)
* **core:** respect `forceUndefined` in the original entity data ([d2d9cc0](https://github.com/mikro-orm/mikro-orm/commit/d2d9cc0bd45dd775aa0e951578b6f9f88fd01cec)), closes [#4262](https://github.com/mikro-orm/mikro-orm/issues/4262) [#4266](https://github.com/mikro-orm/mikro-orm/issues/4266)
* **core:** respect `serialize()` `skipNull` option inside embeddables ([4cf7669](https://github.com/mikro-orm/mikro-orm/commit/4cf766932e902cc96d56b2a9aa9d1215785c8ad6)), closes [#4263](https://github.com/mikro-orm/mikro-orm/issues/4263)





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/core





# [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)


### Bug Fixes

* **core:** clean up bidirectional references after removal of entity ([bfd3840](https://github.com/mikro-orm/mikro-orm/commit/bfd3840a81ae01cc9f2b8fce77edf2f7e814d5fa)), closes [#4234](https://github.com/mikro-orm/mikro-orm/issues/4234)
* **core:** detect `JsonType` based on `columnType` ([#4252](https://github.com/mikro-orm/mikro-orm/issues/4252)) ([2e01622](https://github.com/mikro-orm/mikro-orm/commit/2e01622963c8b22c6468b93a9cd3bc4d8e13bada)), closes [#4229](https://github.com/mikro-orm/mikro-orm/issues/4229)
* **core:** do not try to propagate changes to `mapToPk` relations ([7028890](https://github.com/mikro-orm/mikro-orm/commit/7028890a3c902ed042e89da10168572544f0e595)), closes [#4254](https://github.com/mikro-orm/mikro-orm/issues/4254)
* **core:** fix mapping of joined relations with buffer PKs ([8e9e7ee](https://github.com/mikro-orm/mikro-orm/commit/8e9e7ee5fc4cbea0225113b735628a1f0298c5f5)), closes [#4219](https://github.com/mikro-orm/mikro-orm/issues/4219)
* **core:** merge env vars with explicit configuration recursively ([392a623](https://github.com/mikro-orm/mikro-orm/commit/392a623a9602eb42e8215dd71381c215d4ac1503)), closes [#4235](https://github.com/mikro-orm/mikro-orm/issues/4235)
* **core:** prevent tuple type properties from being converted to array when serializing entities ([#4205](https://github.com/mikro-orm/mikro-orm/issues/4205)) ([04ad72e](https://github.com/mikro-orm/mikro-orm/commit/04ad72e968b997fdc113b11db605fbb119a52f77))
* **core:** propagate changes from extra updates back to the original changeset ([77f5c14](https://github.com/mikro-orm/mikro-orm/commit/77f5c147efc5e96007908a481cf2d3c34ac321fa)), closes [#4245](https://github.com/mikro-orm/mikro-orm/issues/4245)
* **core:** rework JSON value processing ([#4194](https://github.com/mikro-orm/mikro-orm/issues/4194)) ([5594c46](https://github.com/mikro-orm/mikro-orm/commit/5594c469f05d2c1fc76f3cc1a388f5e7162f4e72)), closes [#4193](https://github.com/mikro-orm/mikro-orm/issues/4193)
* **query-builder:** fix pagination when PK uses `BigIntType` ([b789031](https://github.com/mikro-orm/mikro-orm/commit/b789031300e752cfd9565371e7989776b18bd3a0)), closes [#4227](https://github.com/mikro-orm/mikro-orm/issues/4227)


### Features

* **core:** allow disabling transactions ([#4260](https://github.com/mikro-orm/mikro-orm/issues/4260)) ([8e8bc38](https://github.com/mikro-orm/mikro-orm/commit/8e8bc38d7d4056d59dc7058b0f2d2c3827588bc0)), closes [#3747](https://github.com/mikro-orm/mikro-orm/issues/3747) [#3992](https://github.com/mikro-orm/mikro-orm/issues/3992)
* **core:** deprecate `persist/flush/remove` methods from `EntityRepository` ([#4259](https://github.com/mikro-orm/mikro-orm/issues/4259)) ([eba4563](https://github.com/mikro-orm/mikro-orm/commit/eba45635c61c13f3646a19e640522bce09f5a24a)), closes [#3989](https://github.com/mikro-orm/mikro-orm/issues/3989)
* **core:** validate repository type in `repo.populate()` and `repo.assign()` ([301bdf8](https://github.com/mikro-orm/mikro-orm/commit/301bdf881b56ffb373c168f7be9af71a061466da)), closes [#3989](https://github.com/mikro-orm/mikro-orm/issues/3989)
* **core:** validate unique `tableName` ([0693029](https://github.com/mikro-orm/mikro-orm/commit/069302936bfa1fd10aeb2636ccdc3ca6ea021c4b)), closes [#4149](https://github.com/mikro-orm/mikro-orm/issues/4149)
* **migrations:** add support for custom migration names ([#4250](https://github.com/mikro-orm/mikro-orm/issues/4250)) ([fb2879e](https://github.com/mikro-orm/mikro-orm/commit/fb2879e21575a54d1b05c7d1fc250d5f713d9b44))


### Performance Improvements

* **core:** fix eager loading of multiple properties causing a cycles ([ecbecfc](https://github.com/mikro-orm/mikro-orm/commit/ecbecfc9b46ea7402024e7fd31e3f818b361d860)), closes [#4213](https://github.com/mikro-orm/mikro-orm/issues/4213)





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Bug Fixes

* **core:** don't override discovery options when `alwaysAnalyseProperties` is used ([f4acc91](https://github.com/mikro-orm/mikro-orm/commit/f4acc918ad25af3a97c2673de36922d5ce90eccf)), closes [#4181](https://github.com/mikro-orm/mikro-orm/issues/4181)
* **core:** ensure correct FK as PK identity map key ([475e2a3](https://github.com/mikro-orm/mikro-orm/commit/475e2a33d1a2682cc9168269e36f14b10b6fe7fd))
* **core:** fix hydration of 1:1 FK as PK property via joined strategy ([75653f0](https://github.com/mikro-orm/mikro-orm/commit/75653f0d857e74ab83f06290ffc8ed59f7e91f3c)), closes [#4160](https://github.com/mikro-orm/mikro-orm/issues/4160)
* **core:** hydrate collection items when merging data in `factory.create` ([493d653](https://github.com/mikro-orm/mikro-orm/commit/493d653d84442cd854f3c6d1e67ce92d688f5924)), closes [#4173](https://github.com/mikro-orm/mikro-orm/issues/4173)
* **core:** use JsonType automatically when `type: 'jsonb'` ([43cb6d7](https://github.com/mikro-orm/mikro-orm/commit/43cb6d70ed38694424fcc6a218a1a3063991de8a))
* **mysql:** fix mapping of PK in `upsertMany` ([0f4cf85](https://github.com/mikro-orm/mikro-orm/commit/0f4cf85f8655326727f6fd27c6dbb66c606e922a)), closes [#4153](https://github.com/mikro-orm/mikro-orm/issues/4153)


### Features

* **core:** normalize zero in bigint type to string ([78a8e48](https://github.com/mikro-orm/mikro-orm/commit/78a8e48bec188fbe17d8b9deb4b623a4d1810a3b)), closes [#4159](https://github.com/mikro-orm/mikro-orm/issues/4159)
* **migrator:** allow disabling logging via `migrations.silent` ([#4182](https://github.com/mikro-orm/mikro-orm/issues/4182)) ([4b778bf](https://github.com/mikro-orm/mikro-orm/commit/4b778bf2db55bdc678a13c7dd6c27c3d72fde97d)), closes [#4124](https://github.com/mikro-orm/mikro-orm/issues/4124)


### Performance Improvements

* **core:** populating many large 1:M collections ([875d966](https://github.com/mikro-orm/mikro-orm/commit/875d966db9b4d4ea313709e0f1382f025599edbf)), closes [#4171](https://github.com/mikro-orm/mikro-orm/issues/4171)


### Reverts

* Revert "chore(release): v5.6.16 [skip ci]" ([49faac9](https://github.com/mikro-orm/mikro-orm/commit/49faac95c86d4c65fb6f66f76efa98ba221dd67e))
* Revert "chore(release): update internal dependencies to use tilde [skip ci]" ([381cba1](https://github.com/mikro-orm/mikro-orm/commit/381cba1fbf1141e1f754d25e1fd5748906425caa))





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)


### Bug Fixes

* **core:** fix nested inlined embedded property hydration ([2bbcb47](https://github.com/mikro-orm/mikro-orm/commit/2bbcb477890fc87cb2a349922d83bfdb54f68b59)), closes [#4145](https://github.com/mikro-orm/mikro-orm/issues/4145)
* **core:** fix snapshot of relation properties loaded via joined strategy ([6015f3f](https://github.com/mikro-orm/mikro-orm/commit/6015f3fb2b09ca920d0fbe3329733d3d5f8d134e)), closes [#4129](https://github.com/mikro-orm/mikro-orm/issues/4129)
* **core:** respect explicit `unsigned` option ([#4126](https://github.com/mikro-orm/mikro-orm/issues/4126)) ([846a57d](https://github.com/mikro-orm/mikro-orm/commit/846a57dc3baffe8897065710a6368efd91985401))





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)


### Bug Fixes

* **core:** allow comparing `{}` with `Object.create(null)` ([955895e](https://github.com/mikro-orm/mikro-orm/commit/955895ec9b29caf4172852efd3da90cef8d7d0f5)), closes [#4109](https://github.com/mikro-orm/mikro-orm/issues/4109)
* **core:** assigning to reference properties inside embeddables ([ede04e6](https://github.com/mikro-orm/mikro-orm/commit/ede04e6d9c77f064268eb94937a64bfd4666e42c)), closes [#4106](https://github.com/mikro-orm/mikro-orm/issues/4106)
* **core:** discover pivot entities automatically when specified by reference ([3ea4776](https://github.com/mikro-orm/mikro-orm/commit/3ea47760faa1bb1092be374105fe85f0ffb2408d))
* **core:** ensure `populate: true` supports nested relations inside M:N ([b42f0f3](https://github.com/mikro-orm/mikro-orm/commit/b42f0f3a54cb3e3f7146584caf4d34f200ccc195))
* **core:** extra update on a reference with 1:1 self-reference ([f2fa2bd](https://github.com/mikro-orm/mikro-orm/commit/f2fa2bd5c30d70f511009a8cbc20966587be46c5)), closes [#4121](https://github.com/mikro-orm/mikro-orm/issues/4121)
* **core:** fix nested object merging in JSON properties ([694ef28](https://github.com/mikro-orm/mikro-orm/commit/694ef281abf970434f42c7b620bfb81b1c794815)), closes [#4101](https://github.com/mikro-orm/mikro-orm/issues/4101)
* **core:** improve handling of complex pivot table entities ([45449c4](https://github.com/mikro-orm/mikro-orm/commit/45449c4fd263198fb6220267ab1070a38ca3ef03)), closes [#4083](https://github.com/mikro-orm/mikro-orm/issues/4083)


### Features

* **core:** allow skipping `convertToDatabaseValue` during hydration ([d1ce240](https://github.com/mikro-orm/mikro-orm/commit/d1ce2408306a9bdd805077ef1a3f9c561eefe982)), closes [#4120](https://github.com/mikro-orm/mikro-orm/issues/4120)





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)


### Bug Fixes

* **core:** fix deep assigning of collection items with complex composite keys ([95631f4](https://github.com/mikro-orm/mikro-orm/commit/95631f4234cfc943c215c11097a21df325a1709d)), closes [#4074](https://github.com/mikro-orm/mikro-orm/issues/4074)
* **core:** fix diffing of JSON properties ([2e9a026](https://github.com/mikro-orm/mikro-orm/commit/2e9a02689adb7129f9671aa4038076d3504fa986)), closes [#4078](https://github.com/mikro-orm/mikro-orm/issues/4078)
* **core:** log abstract entity names during discovery ([e721ad7](https://github.com/mikro-orm/mikro-orm/commit/e721ad757ecf6df7da466c589bce772f4589fc72)), closes [#4080](https://github.com/mikro-orm/mikro-orm/issues/4080)





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)


### Bug Fixes

* **core:** enforce select-in strategy for self-referencing eager relations ([cc07c6b](https://github.com/mikro-orm/mikro-orm/commit/cc07c6b3393e220da8afb7bec615b2fd553921ed)), closes [#4061](https://github.com/mikro-orm/mikro-orm/issues/4061)
* **core:** ensure custom types are processed in `em.upsert/upsertMany/insertMany` ([53a08ac](https://github.com/mikro-orm/mikro-orm/commit/53a08acfa285edb0c9da7185a3de9c763361245d)), closes [#4070](https://github.com/mikro-orm/mikro-orm/issues/4070)
* **core:** move repository cache to the EM fork ([05fabb9](https://github.com/mikro-orm/mikro-orm/commit/05fabb9c3b06fa8a811a9ef475281c0df5836ee2)), closes [#3074](https://github.com/mikro-orm/mikro-orm/issues/3074)
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





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)


### Bug Fixes

* **core:** ensure propagation during hydration dont produce extra updates ([88595bd](https://github.com/mikro-orm/mikro-orm/commit/88595bdf450d2b93fd9a1c18449fc27ee7229738)), closes [#3941](https://github.com/mikro-orm/mikro-orm/issues/3941)
* **core:** propagate ManyToOne only to matching collections (STI) ([#3940](https://github.com/mikro-orm/mikro-orm/issues/3940)) ([8ff7ed1](https://github.com/mikro-orm/mikro-orm/commit/8ff7ed193738cf518b54995eeb1f6a5bd59f052f)), closes [#3939](https://github.com/mikro-orm/mikro-orm/issues/3939)
* **core:** respect `mapToPk` during hydration with custom type FK ([75d05ee](https://github.com/mikro-orm/mikro-orm/commit/75d05ee7ed57107072a44c29be24a64ff27e6db0)), closes [#3921](https://github.com/mikro-orm/mikro-orm/issues/3921)





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)


### Bug Fixes

* **core:** do not allow functions and symbols in `FilterQuery` ([85b1fc1](https://github.com/mikro-orm/mikro-orm/commit/85b1fc13399a04539f8dcfa31ef12aaef540aa95)), closes [#3928](https://github.com/mikro-orm/mikro-orm/issues/3928)
* **core:** make `FilterQuery` strict again! ([5427097](https://github.com/mikro-orm/mikro-orm/commit/5427097c9987e3d428c43df12373dcc4496b38f8))





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)


### Bug Fixes

* **core:** do not fail on serialization when POJO instead of embeddable instance found ([c8de84b](https://github.com/mikro-orm/mikro-orm/commit/c8de84babe28c13eaf3efb62e27a0fea3337f9ac))
* **core:** make serialization of embedded properties support `null` instead of value ([3006507](https://github.com/mikro-orm/mikro-orm/commit/3006507132b7ba465430af6e0f918179f08ab5c6)), closes [#3906](https://github.com/mikro-orm/mikro-orm/issues/3906)


### Features

* **cli:** add check for migrations command ([#3923](https://github.com/mikro-orm/mikro-orm/issues/3923)) ([a0ac946](https://github.com/mikro-orm/mikro-orm/commit/a0ac946be35e6dd5bebd263036ce10c068a81af6))
* **core:** add `em.insertMany()` ([5d1565d](https://github.com/mikro-orm/mikro-orm/commit/5d1565dca46f91058720b6ad8df1b373bdb8ff65))





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)


### Bug Fixes

* **mongo:** register serialized PK get/set pair only when explicitly requested ([7004100](https://github.com/mikro-orm/mikro-orm/commit/700410075e0ff83207c17fe6a0413cd534208472)), closes [#3900](https://github.com/mikro-orm/mikro-orm/issues/3900)





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)


### Bug Fixes

* **core:** delay snapshotting of entity state to fix differences with joined strategy ([cbf62fa](https://github.com/mikro-orm/mikro-orm/commit/cbf62faa61c376c9065ff30005ada442c90fb158)), closes [#3876](https://github.com/mikro-orm/mikro-orm/issues/3876)
* **core:** do not convert custom mapped type twice in `Reference.createFromPK` ([7dfff45](https://github.com/mikro-orm/mikro-orm/commit/7dfff45cb09cedee994070fe432f1b4821b73494)), closes [#3878](https://github.com/mikro-orm/mikro-orm/issues/3878)





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)


### Bug Fixes

* **core:** fix assignability of `Loaded` type to naked entity ([e574924](https://github.com/mikro-orm/mikro-orm/commit/e574924fa6a1559d1dd5a7331c29e5205b77921f)), closes [#3865](https://github.com/mikro-orm/mikro-orm/issues/3865)


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





# [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)


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
* **postgres:** use `postgres` as the management db name + allow override ([eab1668](https://github.com/mikro-orm/mikro-orm/commit/eab16681681b13b40f183dc8ec6b26e3171edc11)), closes [#3769](https://github.com/mikro-orm/mikro-orm/issues/3769)
* **query-builder:** respect case-insensitive regexp flag ([1a1d381](https://github.com/mikro-orm/mikro-orm/commit/1a1d381cfe30bd97a038109e7d2e5ea9ce660062)), closes [#3801](https://github.com/mikro-orm/mikro-orm/issues/3801)
* **ts:** allow string dates in `em.create()` ([d0607d5](https://github.com/mikro-orm/mikro-orm/commit/d0607d50899fc90c899f28941f5b41c0b3bc8ace))


### Features

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


### Performance Improvements

* **core:** redefine the internal `__helper` getter with a static value ([77d0549](https://github.com/mikro-orm/mikro-orm/commit/77d05495478705b8b5b15bbc6fbb9080361899ab))





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)


### Bug Fixes

* **core:** prefer custom pivot entity for inference of FK names ([08a7dc2](https://github.com/mikro-orm/mikro-orm/commit/08a7dc2ed8f64ede8217b6f46ff22c166c488d92)), closes [#3626](https://github.com/mikro-orm/mikro-orm/issues/3626)





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)


### Bug Fixes

* **core:** compare original entity data when checking for unique props ([53ff984](https://github.com/mikro-orm/mikro-orm/commit/53ff984723c905a0f7dc5d27b2941b663d9d41cc)), closes [#3644](https://github.com/mikro-orm/mikro-orm/issues/3644)
* **core:** fix `em.upsert()` when entity is already in context ([f590b79](https://github.com/mikro-orm/mikro-orm/commit/f590b796684cca88c055c8fd3234f3cb9ca85a10)), closes [#3667](https://github.com/mikro-orm/mikro-orm/issues/3667)
* **core:** fix comparing empty arrays ([be4cdf3](https://github.com/mikro-orm/mikro-orm/commit/be4cdf312f25a01df686f5137340726e92924a0e)), closes [#3694](https://github.com/mikro-orm/mikro-orm/issues/3694)
* **core:** fix orphan removal for collections of complex/nested composite keys ([925c1d2](https://github.com/mikro-orm/mikro-orm/commit/925c1d23ada128a8429223c14811d5357f43f2dc)), closes [#3666](https://github.com/mikro-orm/mikro-orm/issues/3666)
* **core:** fix querying for a complex composite key via inverse side ([b99e7bb](https://github.com/mikro-orm/mikro-orm/commit/b99e7bb4d6dd1c0657ea0ddf28fb0c3a1986e5b7)), closes [#3669](https://github.com/mikro-orm/mikro-orm/issues/3669)
* **core:** improve detection of entity file path via stack trace ([d329d32](https://github.com/mikro-orm/mikro-orm/commit/d329d322f4264f5e97ddc658fdc4ce240f8c7526)), closes [#3668](https://github.com/mikro-orm/mikro-orm/issues/3668)
* **core:** improve propagation of changes to 1:1 relations ([389b4a2](https://github.com/mikro-orm/mikro-orm/commit/389b4a2a750a45ecb9806640613de016132d2dfa)), closes [#3614](https://github.com/mikro-orm/mikro-orm/issues/3614)
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





# [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)


### Bug Fixes

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





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **cli:** only use dynamic imports for ESM projects ([b3e43d0](https://github.com/mikro-orm/mikro-orm/commit/b3e43d0fd98c090a47059597b719924260573e3b)), closes [#3442](https://github.com/mikro-orm/mikro-orm/issues/3442)
* **core:** add missing `MIKRO_ORM_SCHEMA` env var ([#3464](https://github.com/mikro-orm/mikro-orm/issues/3464)) ([47fccac](https://github.com/mikro-orm/mikro-orm/commit/47fccacfbeab319d60d0ef7b53b9d7694d1e7d0f))
* **core:** allow symbol as propertyKey in `@UseRequestContext` decorator ([#3444](https://github.com/mikro-orm/mikro-orm/issues/3444)) ([6a60295](https://github.com/mikro-orm/mikro-orm/commit/6a60295235dfcf417d1b3381c1570ae4d47c7d97))
* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)
* **core:** support partial loading of inlined embeddables ([9654e6e](https://github.com/mikro-orm/mikro-orm/commit/9654e6e9685afb686eacda9ea84916e9ca0962c5)), closes [#3365](https://github.com/mikro-orm/mikro-orm/issues/3365)
* **postgres:** fix inserting values with `?` into `FullTextType` properties ([5095ddb](https://github.com/mikro-orm/mikro-orm/commit/5095ddb2a95cf4183e08a6a9f509ca442783136e)), closes [#3457](https://github.com/mikro-orm/mikro-orm/issues/3457)
* **reflection:** fix inference of nullability ([5f57ee1](https://github.com/mikro-orm/mikro-orm/commit/5f57ee1c8b15940d208c0d3b84955561b38f9889)), closes [#3447](https://github.com/mikro-orm/mikro-orm/issues/3447)


### Features

* **core:** allow custom ORM prop name in `@UseRequestContext()` ([#3475](https://github.com/mikro-orm/mikro-orm/issues/3475)) ([d87219e](https://github.com/mikro-orm/mikro-orm/commit/d87219e04a359cafa2223e8e1f6bdb2ee2cfff72))





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

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





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Bug Fixes

* **core:** do not trigger auto flush from inside flush hooks ([e3f34aa](https://github.com/mikro-orm/mikro-orm/commit/e3f34aa52f7d76f12e51065f589f03454fba48f4)), closes [#3345](https://github.com/mikro-orm/mikro-orm/issues/3345)
* **schema:** ensure stable order queries ([e56a259](https://github.com/mikro-orm/mikro-orm/commit/e56a259e5d7e2c29858a2c1568d7b901a923867a)), closes [#3330](https://github.com/mikro-orm/mikro-orm/issues/3330)
* **schema:** respect explicit `columnType` when comparing columns ([f0a20fa](https://github.com/mikro-orm/mikro-orm/commit/f0a20fafa1425ca20f4f6fb2977eae7773d6ac6a)), closes [#3317](https://github.com/mikro-orm/mikro-orm/issues/3317)


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





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)


### Bug Fixes

* **core:** do not allow passing `null` to required properties in `em.create()` ([e7843fb](https://github.com/mikro-orm/mikro-orm/commit/e7843fbe2f02ee8922d99a2f0209e4e261898a66)), closes [#3289](https://github.com/mikro-orm/mikro-orm/issues/3289)
* **core:** do not run `onUpdate` before we know something changed ([6faa367](https://github.com/mikro-orm/mikro-orm/commit/6faa3673266abd2f6fec5620e4e3e9e32e223ffc)), closes [#3328](https://github.com/mikro-orm/mikro-orm/issues/3328)
* **core:** ensure m:n collection is not dirty after hydration ([66e0a21](https://github.com/mikro-orm/mikro-orm/commit/66e0a21bb12a716afd2b0ba700ff7df14a5f0dc0)), closes [#3323](https://github.com/mikro-orm/mikro-orm/issues/3323) [#3287](https://github.com/mikro-orm/mikro-orm/issues/3287)
* **core:** hidden properties are included in cache ([#3300](https://github.com/mikro-orm/mikro-orm/issues/3300)) ([f0bc261](https://github.com/mikro-orm/mikro-orm/commit/f0bc2610ee5b041fee9fc85e6cc5101169629298))
* **core:** respect schema when lazy loading reference via `init` ([c876c9f](https://github.com/mikro-orm/mikro-orm/commit/c876c9f6b2c970530a8890fa14397c423d602c81)), closes [#3318](https://github.com/mikro-orm/mikro-orm/issues/3318)





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)


### Bug Fixes

* **core:** ensure M:N collections are not dirty after populating of inverse side ([21ba9b2](https://github.com/mikro-orm/mikro-orm/commit/21ba9b212473a9347b2bd38a048710a9628c05ee)), closes [#3287](https://github.com/mikro-orm/mikro-orm/issues/3287)





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)


### Bug Fixes

* **core:** consider two `NaN` as equal when computing changesets ([#3250](https://github.com/mikro-orm/mikro-orm/issues/3250)) ([95116a0](https://github.com/mikro-orm/mikro-orm/commit/95116a05bb142ed90f5b572e109d6740900c5cf1))
* **core:** ensure correct context usage in all `EntityManager` public methods ([cc6d59b](https://github.com/mikro-orm/mikro-orm/commit/cc6d59b9a96fbfd4106e37c21814ded84b56588a)), closes [#3271](https://github.com/mikro-orm/mikro-orm/issues/3271)
* **core:** ensure FK as PK is not marked as initialized too early ([f12f92f](https://github.com/mikro-orm/mikro-orm/commit/f12f92f185eb78fc1471c5ec1411cd2bf5d11308)), closes [#3269](https://github.com/mikro-orm/mikro-orm/issues/3269)
* **core:** fix populating of 1:m collections between wildcard schema entities ([69c06aa](https://github.com/mikro-orm/mikro-orm/commit/69c06aa5b3ac553bb6c1438a7143d56d18fcf894)), closes [#3270](https://github.com/mikro-orm/mikro-orm/issues/3270)
* **core:** fix populating of relations in `afterFlush` hook ([26ab686](https://github.com/mikro-orm/mikro-orm/commit/26ab6861ba0c0b64563c69d91f85e17776a58e71)), closes [#3005](https://github.com/mikro-orm/mikro-orm/issues/3005)
* **core:** fix querying JSON properties with operators directly ([077ca62](https://github.com/mikro-orm/mikro-orm/commit/077ca623e6d8f0faff8e6af9ea468cf9b525d61a)), closes [#3246](https://github.com/mikro-orm/mikro-orm/issues/3246)
* **mongo:** persist explicit `null` value on object embeddable as `null` ([1c56e7a](https://github.com/mikro-orm/mikro-orm/commit/1c56e7ab1b2d5325588b444998ffa53adce6f699)), closes [#3258](https://github.com/mikro-orm/mikro-orm/issues/3258)
* **sql:** fix prefixing of JSON queries nested on relations ([847ff46](https://github.com/mikro-orm/mikro-orm/commit/847ff468f48dbb99e06ffe713e5d66a461e524b2)), closes [#3242](https://github.com/mikro-orm/mikro-orm/issues/3242)


### Features

* **core:** propagate add operation to m:n owner even if not initialized ([#3273](https://github.com/mikro-orm/mikro-orm/issues/3273)) ([dc9255c](https://github.com/mikro-orm/mikro-orm/commit/dc9255cb4c26291c7e33a7c38da0475fb20f3832))





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)


### Bug Fixes

* **core:** fix reloading version values with custom types on PKs ([ebd7888](https://github.com/mikro-orm/mikro-orm/commit/ebd78882cc910f3cd965ec2299a8b67958d36747)), closes [#3209](https://github.com/mikro-orm/mikro-orm/issues/3209)
* **core:** fix serialization of entities wrapped in POJOs ([af4fadf](https://github.com/mikro-orm/mikro-orm/commit/af4fadffe9fb78341e45c016836be0824aaaac8d)), closes [#3221](https://github.com/mikro-orm/mikro-orm/issues/3221)
* **core:** ignore `undefined` values during options merge ([9e0f559](https://github.com/mikro-orm/mikro-orm/commit/9e0f559c3c265540e89ca6eeafe5a3b836c01fba)), closes [#3234](https://github.com/mikro-orm/mikro-orm/issues/3234)
* **mysql:** handle mediumint PKs correctly ([0bbbe5c](https://github.com/mikro-orm/mikro-orm/commit/0bbbe5c7827875a88a199b94add9ae81776dce42)), closes [#3230](https://github.com/mikro-orm/mikro-orm/issues/3230)
* **types:** fix inference of optional PKs ([424e0bb](https://github.com/mikro-orm/mikro-orm/commit/424e0bb5c50248ac2d45da55dd1a451663944d31)), closes [#3230](https://github.com/mikro-orm/mikro-orm/issues/3230)


### Features

* **core:** allow to adjust default type mapping ([ca8ce57](https://github.com/mikro-orm/mikro-orm/commit/ca8ce5721f0d547ceec1cf645443b6ae00deaf09)), closes [#3066](https://github.com/mikro-orm/mikro-orm/issues/3066)


### Performance Improvements

* **core:** allow disabling change tracking on property level ([7d5e32d](https://github.com/mikro-orm/mikro-orm/commit/7d5e32d8eb7ec25ace2336e1bd4da5d97d015c08)), closes [#3019](https://github.com/mikro-orm/mikro-orm/issues/3019)
* **core:** make `Collection.add` on not managed entities much faster ([75adda9](https://github.com/mikro-orm/mikro-orm/commit/75adda9b9a714b7918ec76fb7d5cd50f084cd6ba)), closes [#3211](https://github.com/mikro-orm/mikro-orm/issues/3211)





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* **core:** allow changing PK via UoW ([32ab215](https://github.com/mikro-orm/mikro-orm/commit/32ab21583d2718ab874ff71b3f13c9e6a9e5faf0)), closes [#3184](https://github.com/mikro-orm/mikro-orm/issues/3184)
* **core:** ensure correct cached value in `loadCount` ([4471bb8](https://github.com/mikro-orm/mikro-orm/commit/4471bb8b59151e8e450ab8f557a5337862aa88fc))
* **query-builder:** fix processing of custom types in explicitly aliased queries ([db137a6](https://github.com/mikro-orm/mikro-orm/commit/db137a6cdbe182363d0e4a743b8b8f915e324b09)), closes [#3172](https://github.com/mikro-orm/mikro-orm/issues/3172)
* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))


### Features

* **core:** automatically discover target embeddables and relationships ([#3190](https://github.com/mikro-orm/mikro-orm/issues/3190)) ([8624dc5](https://github.com/mikro-orm/mikro-orm/commit/8624dc5228e63cdadf38a13ee29a554d844ef4ac))
* **entity-generator:** allow generating bidirectional relations ([8b93400](https://github.com/mikro-orm/mikro-orm/commit/8b93400f2bc3569375d7316cf5b995fc1c6821c6)), closes [#3181](https://github.com/mikro-orm/mikro-orm/issues/3181)
* **entity-generator:** allow generating identified references ([1fbf5ac](https://github.com/mikro-orm/mikro-orm/commit/1fbf5ac1ab2334c7e7ccbe190ded411a9490431c))
* **schema:** add logging to schema comparator ([f96eaaf](https://github.com/mikro-orm/mikro-orm/commit/f96eaaf52a02c14e5413cbd25267a272bfeee92f))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)


### Bug Fixes

* **cli:** disable TS mode when we fail to register ts-node ([457d9d3](https://github.com/mikro-orm/mikro-orm/commit/457d9d32d78ed34b254aae3b2b2f29b382e7175e)), closes [#3152](https://github.com/mikro-orm/mikro-orm/issues/3152)
* **core:** assign new embeddable entity only when it is null or undefined ([#3135](https://github.com/mikro-orm/mikro-orm/issues/3135)) ([4f870fb](https://github.com/mikro-orm/mikro-orm/commit/4f870fb4a650ad7a00524424494ea31cd484af60))





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)


### Bug Fixes

* **core:** allow asterisk in `FindOptions.fields` on TS level ([43e1d0b](https://github.com/mikro-orm/mikro-orm/commit/43e1d0b765e3c6346340e6c734af7826d3ab3486)), closes [#3127](https://github.com/mikro-orm/mikro-orm/issues/3127)
* **core:** improve type of `em.getContext()` ([158f077](https://github.com/mikro-orm/mikro-orm/commit/158f077d1d0fbe4fd0edcf736a2f6a49a336fb14)), closes [#3120](https://github.com/mikro-orm/mikro-orm/issues/3120)
* **core:** improve validation of wrong entity references ([#3085](https://github.com/mikro-orm/mikro-orm/issues/3085)) ([f5de135](https://github.com/mikro-orm/mikro-orm/commit/f5de135b5eff3d0ad1b26de7a2af5925c3ef7f37))
* **core:** wrap relations in `Reference` wrapper when assigning entity instance ([97f1f59](https://github.com/mikro-orm/mikro-orm/commit/97f1f59f29522074b5cd5f86579dc1dd6a1b4c9d)), closes [#3092](https://github.com/mikro-orm/mikro-orm/issues/3092)
* **mongo:** support queries with mongo specific operators on embeddables ([2fb9002](https://github.com/mikro-orm/mikro-orm/commit/2fb900294acef87bc939e0417ec3fd720f806ffd))
* **postgres:** do not try to create schema for migrations when it exists ([d6af811](https://github.com/mikro-orm/mikro-orm/commit/d6af81160b4099436237dc312f7dbb4bbffc4378)), closes [#3106](https://github.com/mikro-orm/mikro-orm/issues/3106)


### Features

* **core:** add `strict` option to `em.findOneOrFail()` ([#3088](https://github.com/mikro-orm/mikro-orm/issues/3088)) ([d38242a](https://github.com/mikro-orm/mikro-orm/commit/d38242aba2d669355522fff57e30c10f64427173))





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)


### Bug Fixes

* **core:** allow replacing target entity in relations with `assign` ([90ec83f](https://github.com/mikro-orm/mikro-orm/commit/90ec83fc01296dc6f3560df00e637b050852b7f2)), closes [#3026](https://github.com/mikro-orm/mikro-orm/issues/3026)
* **core:** do not inline query for JSON properties that match PK names ([e6005d8](https://github.com/mikro-orm/mikro-orm/commit/e6005d838f6faccb56f2082ecf93c23f74cbc08a)), closes [#3054](https://github.com/mikro-orm/mikro-orm/issues/3054)
* **core:** fix serialization when using partial loading for nested relations ([00be9f1](https://github.com/mikro-orm/mikro-orm/commit/00be9f1e0cefad70e70a66859c0466c3fd60fade)), closes [#3011](https://github.com/mikro-orm/mikro-orm/issues/3011)
* **core:** hydrate nullable embedded properties as `null` ([e8490f6](https://github.com/mikro-orm/mikro-orm/commit/e8490f68dae699de99b93616c9a10ba2bf0417f4)), closes [#3063](https://github.com/mikro-orm/mikro-orm/issues/3063)
* **core:** respect mapToPk when expanding properties ([#3031](https://github.com/mikro-orm/mikro-orm/issues/3031)) ([757801e](https://github.com/mikro-orm/mikro-orm/commit/757801e9260b4cc89577b89ddbeec7a428fdb9a0))
* **schema:** fix diffing of indexes with too long inferred name ([01ba9ed](https://github.com/mikro-orm/mikro-orm/commit/01ba9edef9b202f324f6e580b0f55161ca927801)), closes [#2932](https://github.com/mikro-orm/mikro-orm/issues/2932)


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
* **core:** fix eager loading of nested embeddable m:1 properties ([4867db9](https://github.com/mikro-orm/mikro-orm/commit/4867db9f60ff25b35503b229845fb06eb02621ee)), closes [#2975](https://github.com/mikro-orm/mikro-orm/issues/2975)
* **core:** fix eager loading when multiple relations target same entity ([21922ce](https://github.com/mikro-orm/mikro-orm/commit/21922ce175cbe0ceb73b9765087976dac159294b)), closes [#2990](https://github.com/mikro-orm/mikro-orm/issues/2990)
* **core:** fix mapping of inserted PKs with custom field names from batch insert ([080d8e0](https://github.com/mikro-orm/mikro-orm/commit/080d8e0249391e437abc371a375ce62e5de0ba93)), closes [#2977](https://github.com/mikro-orm/mikro-orm/issues/2977)
* **core:** never reassign the same entity via `em.assign()` ([cdfbabd](https://github.com/mikro-orm/mikro-orm/commit/cdfbabd5d30d40df061a75b79cc1fc52a6cf6b39)), closes [#2974](https://github.com/mikro-orm/mikro-orm/issues/2974)
* **core:** propagate entity removal in `em.transactional()` to upper context ([6e5166b](https://github.com/mikro-orm/mikro-orm/commit/6e5166b5eb8b89d6c0448c32b7deb46e310d0c58)), closes [#2973](https://github.com/mikro-orm/mikro-orm/issues/2973)
* **core:** respect `connectionType` in populate queries ([fe40a9f](https://github.com/mikro-orm/mikro-orm/commit/fe40a9f5663d5a886e975ca049f41a67da60f569)), closes [#2994](https://github.com/mikro-orm/mikro-orm/issues/2994)
* **core:** use correct path for relations inside embeddables with populate: true ([4735dba](https://github.com/mikro-orm/mikro-orm/commit/4735dba93f2b7f89a6232aa2b27297fa3aa9418a)), closes [#2948](https://github.com/mikro-orm/mikro-orm/issues/2948)
* **postgres:** do not ignore custom PK constraint names ([#2931](https://github.com/mikro-orm/mikro-orm/issues/2931)) ([24bf10e](https://github.com/mikro-orm/mikro-orm/commit/24bf10e668dd2d3b4b6cc4c52ed215fbffcc9d45))
* **schema:** do not create FK index for 1:1 properties (they are unique already) ([473795c](https://github.com/mikro-orm/mikro-orm/commit/473795c26f0b54b3997ce4c839a2834ff43290d8)), closes [#2942](https://github.com/mikro-orm/mikro-orm/issues/2942)


### Features

* **schema:** support mysql 8 ([#2961](https://github.com/mikro-orm/mikro-orm/issues/2961)) ([acc960e](https://github.com/mikro-orm/mikro-orm/commit/acc960ebc694c61a959f48e89a9fee5513f6bdfa))





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)


### Bug Fixes

* **core:** fix custom pivot table entities for unidirectional relations ([01bdbf6](https://github.com/mikro-orm/mikro-orm/commit/01bdbf65836b6db1c7353d4dd14032645df3a978))
* **postgres:** fix pagination with order by UUID PK ([042626c](https://github.com/mikro-orm/mikro-orm/commit/042626c6aa1c1538ce65fb12db435b088e11e518)), closes [#2910](https://github.com/mikro-orm/mikro-orm/issues/2910)
* **postgres:** respect known schema when loading wild card entity relations ([61d1e85](https://github.com/mikro-orm/mikro-orm/commit/61d1e853db610d46c23d56b0bc9fe03383da005d)), closes [#2909](https://github.com/mikro-orm/mikro-orm/issues/2909)


### Features

* **core:** validate `em.begin` was called when using `em.commit/rollback` ([67fa076](https://github.com/mikro-orm/mikro-orm/commit/67fa076df1753e9dc433dbc79657b4f240949d8d)), closes [#2918](https://github.com/mikro-orm/mikro-orm/issues/2918)





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)


### Bug Fixes

* **core:** do not alias JSON conditions on update/delete queries ([5c0674e](https://github.com/mikro-orm/mikro-orm/commit/5c0674e61d97f9b143b48ae5314e5e7d1eeb4529)), closes [#2839](https://github.com/mikro-orm/mikro-orm/issues/2839)
* **core:** ensure all entities from inner context are merged to the upper one ([7b3a6b4](https://github.com/mikro-orm/mikro-orm/commit/7b3a6b4fb2ea2850959160cb9462c1992f1bd7bd)), closes [#2882](https://github.com/mikro-orm/mikro-orm/issues/2882)
* **core:** fix object key utilities for null prototype objects ([#2847](https://github.com/mikro-orm/mikro-orm/issues/2847)) ([b2cf01e](https://github.com/mikro-orm/mikro-orm/commit/b2cf01ee8b3f00273a8a8af88f56e7af97f02cc8)), closes [#2846](https://github.com/mikro-orm/mikro-orm/issues/2846)
* **core:** fix strict type for `orderBy` when entity has `length` property ([ef45871](https://github.com/mikro-orm/mikro-orm/commit/ef4587143d614d71c16f7576c04ed6d74b77fa80)), closes [#2829](https://github.com/mikro-orm/mikro-orm/issues/2829)
* **core:** type global `entityRepository` option weakly ([3faf8bc](https://github.com/mikro-orm/mikro-orm/commit/3faf8bcea57a7e32886ce67cae94321e873b1f9a))
* **mysql:** mark FK columns as unsigned for mixed composite PKs ([67806cb](https://github.com/mikro-orm/mikro-orm/commit/67806cb8ff79ae312295e615533ebec399823579)), closes [#2844](https://github.com/mikro-orm/mikro-orm/issues/2844)
* **postgres:** respect schema name in migration storage ([fbf9bfa](https://github.com/mikro-orm/mikro-orm/commit/fbf9bfa3aad21a4175dea91cd1a6c9742541cbc6)), closes [#2828](https://github.com/mikro-orm/mikro-orm/issues/2828)


### Features

* **core:** allow better control over connection type when using read-replicas ([#2896](https://github.com/mikro-orm/mikro-orm/issues/2896)) ([e40ae2d](https://github.com/mikro-orm/mikro-orm/commit/e40ae2d65abe3d49435356cf79068de5c3d73bd1))
* **core:** allow forcing write connection via `forceWriteConnection` ([#2838](https://github.com/mikro-orm/mikro-orm/issues/2838)) ([36d1969](https://github.com/mikro-orm/mikro-orm/commit/36d19697a9dc504724ce2bf246f7f0906afb6517))
* **core:** allow specifying custom pivot table entity ([#2901](https://github.com/mikro-orm/mikro-orm/issues/2901)) ([8237d16](https://github.com/mikro-orm/mikro-orm/commit/8237d168479c5a61af28cf1a51fcd52f23079179))
* **core:** allow using hooks for interface entities ([#2895](https://github.com/mikro-orm/mikro-orm/issues/2895)) ([aee99b1](https://github.com/mikro-orm/mikro-orm/commit/aee99b1a7ecf392ed4233c2ac5bbc365dfd278c1))
* **core:** enable `QueryFlag.PAGINATE` automatically for `em.find()` ([ccb4223](https://github.com/mikro-orm/mikro-orm/commit/ccb4223c2a6ea39103fa9b82ccee8f0b3a9e4f1e)), closes [#2867](https://github.com/mikro-orm/mikro-orm/issues/2867)
* **core:** map check constraint failures to specific error type ([ebcbdff](https://github.com/mikro-orm/mikro-orm/commit/ebcbdfff43cdc4069fc1c70de516493782619123)), closes [#2836](https://github.com/mikro-orm/mikro-orm/issues/2836)





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)


### Bug Fixes

* **core:** respect `orphanRemoval` in 1:1 relations ([#2816](https://github.com/mikro-orm/mikro-orm/issues/2816)) ([55ff07b](https://github.com/mikro-orm/mikro-orm/commit/55ff07be3f781d2c6a788a463d26dec38570509c))
* **query-builder:** use paginate flag automatically based on to-many joins ([db9963f](https://github.com/mikro-orm/mikro-orm/commit/db9963fff8ceb980354b328f2d59353b9177aef3)), closes [#2823](https://github.com/mikro-orm/mikro-orm/issues/2823)





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
