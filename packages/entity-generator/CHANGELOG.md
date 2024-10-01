# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.3.12](https://github.com/mikro-orm/mikro-orm/compare/v6.3.11...v6.3.12) (2024-10-01)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.11](https://github.com/mikro-orm/mikro-orm/compare/v6.3.10...v6.3.11) (2024-09-26)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.10](https://github.com/mikro-orm/mikro-orm/compare/v6.3.9...v6.3.10) (2024-09-15)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.9](https://github.com/mikro-orm/mikro-orm/compare/v6.3.8...v6.3.9) (2024-09-09)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.8](https://github.com/mikro-orm/mikro-orm/compare/v6.3.7...v6.3.8) (2024-09-04)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.7](https://github.com/mikro-orm/mikro-orm/compare/v6.3.6...v6.3.7) (2024-08-28)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.6](https://github.com/mikro-orm/mikro-orm/compare/v6.3.5...v6.3.6) (2024-08-14)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.5](https://github.com/mikro-orm/mikro-orm/compare/v6.3.4...v6.3.5) (2024-08-11)


### Bug Fixes

* **entity-generator:** ensure `columnType` is emitted correctly and when necessary ([#5930](https://github.com/mikro-orm/mikro-orm/issues/5930)) ([72333ad](https://github.com/mikro-orm/mikro-orm/commit/72333ad506129834185f39d44457fdfb947df35c)), closes [#5928](https://github.com/mikro-orm/mikro-orm/issues/5928)
* **entity-generator:** unknown type defaults always use default/defaultRaw, never runtime ([#5927](https://github.com/mikro-orm/mikro-orm/issues/5927)) ([dcc8227](https://github.com/mikro-orm/mikro-orm/commit/dcc8227e2623d47ea4562c9c575e5ab9c3d2417f))





## [6.3.4](https://github.com/mikro-orm/mikro-orm/compare/v6.3.3...v6.3.4) (2024-08-06)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.3](https://github.com/mikro-orm/mikro-orm/compare/v6.3.2...v6.3.3) (2024-08-03)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.2](https://github.com/mikro-orm/mikro-orm/compare/v6.3.1...v6.3.2) (2024-08-01)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.3.1](https://github.com/mikro-orm/mikro-orm/compare/v6.3.0...v6.3.1) (2024-07-25)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [6.3.0](https://github.com/mikro-orm/mikro-orm/compare/v6.2.9...v6.3.0) (2024-07-18)


### Bug Fixes

* **entity-generator:** correctly serialize string prefixes in embedded references ([#5826](https://github.com/mikro-orm/mikro-orm/issues/5826)) ([7882bca](https://github.com/mikro-orm/mikro-orm/commit/7882bca1f029f331ea4af4e52e7f76c02ede0c84))
* **entity-generator:** fix handling of primary keys that are foreign keys or enums ([#5673](https://github.com/mikro-orm/mikro-orm/issues/5673)) ([b10413f](https://github.com/mikro-orm/mikro-orm/commit/b10413f3b1b5548118b02aa90e39bb69d8473d4f))
* **entity-generator:** fixed default values for enums ([#5765](https://github.com/mikro-orm/mikro-orm/issues/5765)) ([58d914d](https://github.com/mikro-orm/mikro-orm/commit/58d914db32c8a06727fd9087bbcc4fda1117d086))
* **entity-generator:** generate all bidirectional relations in case of conflicts ([#5779](https://github.com/mikro-orm/mikro-orm/issues/5779)) ([af845f1](https://github.com/mikro-orm/mikro-orm/commit/af845f1aee8b8925498b2bb53fbf74e522efc2cc)), closes [#5738](https://github.com/mikro-orm/mikro-orm/issues/5738)
* **entity-generator:** include all entity options in EntitySchema definitions ([#5674](https://github.com/mikro-orm/mikro-orm/issues/5674)) ([94ef44e](https://github.com/mikro-orm/mikro-orm/commit/94ef44e28aa3420e0ba2f83d9f6830dcb3e56302))
* **entity-generator:** output all DB related info even for virtual properties ([#5817](https://github.com/mikro-orm/mikro-orm/issues/5817)) ([845b75c](https://github.com/mikro-orm/mikro-orm/commit/845b75ce3b23fc9957edd4db0a19774ca648fdf5))
* **entity-generator:** support complex enum names and values ([#5670](https://github.com/mikro-orm/mikro-orm/issues/5670)) ([7dcb7be](https://github.com/mikro-orm/mikro-orm/commit/7dcb7beff1a74606831f073549b530ba0e1bb7a1))
* **entity-generator:** when using esmImport, FKs are now wrapped with Rel ([#5771](https://github.com/mikro-orm/mikro-orm/issues/5771)) ([c28ab16](https://github.com/mikro-orm/mikro-orm/commit/c28ab16810bb62aa6dd20dd8442eef902cd68a4d))


### Features

* **core:** addz `Platform.getDefaultVarcharLength` and optional `Type.getDefaultLength` ([#5749](https://github.com/mikro-orm/mikro-orm/issues/5749)) ([29dcdeb](https://github.com/mikro-orm/mikro-orm/commit/29dcdeb5e4c3f84e43c154fe3eb81a113c6d1470))
* **entity-generator:** add a coreImportsPrefix option ([#5669](https://github.com/mikro-orm/mikro-orm/issues/5669)) ([b9ab69a](https://github.com/mikro-orm/mikro-orm/commit/b9ab69a5e86ce118cb209d2fdc5a76f2c4b80620))
* **entity-generator:** added option to output pure pivot tables ([#5809](https://github.com/mikro-orm/mikro-orm/issues/5809)) ([832a626](https://github.com/mikro-orm/mikro-orm/commit/832a62612d6cf3cc8a44f0c0c7ad6b1cec1bf402))
* **entity-generator:** added the ability to add extra names to be imported ([#5797](https://github.com/mikro-orm/mikro-orm/issues/5797)) ([82696b3](https://github.com/mikro-orm/mikro-orm/commit/82696b30c2a14cd68879c421ab4a8b182c3093ab))
* **entity-generator:** allow custom types for scalar relations ([#5435](https://github.com/mikro-orm/mikro-orm/issues/5435)) ([a8a9126](https://github.com/mikro-orm/mikro-orm/commit/a8a9126ebdfb57cce14d1931b5cce5dfb1ade27f))
* **entity-generator:** enable the generator to dictate import specs via `extraImport` ([#5772](https://github.com/mikro-orm/mikro-orm/issues/5772)) ([effd9fb](https://github.com/mikro-orm/mikro-orm/commit/effd9fbc9426bc49a2acb3bed1b982eed4f38b3e))
* **entity-generator:** repository class reference can be added from hooks ([#5785](https://github.com/mikro-orm/mikro-orm/issues/5785)) ([44a49a9](https://github.com/mikro-orm/mikro-orm/commit/44a49a9aad455db59e08e48ef2ce58f112671f97))
* **entity-generator:** support adding groups through metadata hooks ([#5793](https://github.com/mikro-orm/mikro-orm/issues/5793)) ([a756271](https://github.com/mikro-orm/mikro-orm/commit/a756271a94af3806a38111d301fd907f870dd057))





## [6.2.9](https://github.com/mikro-orm/mikro-orm/compare/v6.2.8...v6.2.9) (2024-05-31)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.8](https://github.com/mikro-orm/mikro-orm/compare/v6.2.7...v6.2.8) (2024-05-21)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.7](https://github.com/mikro-orm/mikro-orm/compare/v6.2.6...v6.2.7) (2024-05-18)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.6](https://github.com/mikro-orm/mikro-orm/compare/v6.2.5...v6.2.6) (2024-05-14)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.5](https://github.com/mikro-orm/mikro-orm/compare/v6.2.4...v6.2.5) (2024-05-05)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.4](https://github.com/mikro-orm/mikro-orm/compare/v6.2.3...v6.2.4) (2024-05-02)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.3](https://github.com/mikro-orm/mikro-orm/compare/v6.2.2...v6.2.3) (2024-04-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.2.2](https://github.com/mikro-orm/mikro-orm/compare/v6.2.1...v6.2.2) (2024-04-20)


### Features

* **entity-generator:** extend filtering options for EntityGenerator ([#5473](https://github.com/mikro-orm/mikro-orm/issues/5473)) ([0894ac9](https://github.com/mikro-orm/mikro-orm/commit/0894ac963bc3886e7a52596b4627c08627877afd)), closes [#5469](https://github.com/mikro-orm/mikro-orm/issues/5469)





## [6.2.1](https://github.com/mikro-orm/mikro-orm/compare/v6.2.0...v6.2.1) (2024-04-12)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [6.2.0](https://github.com/mikro-orm/mikro-orm/compare/v6.1.12...v6.2.0) (2024-04-09)


### Bug Fixes

* **entity-generator:** allow arbitrary class and prop names as identifiers ([#5359](https://github.com/mikro-orm/mikro-orm/issues/5359)) ([b0c0236](https://github.com/mikro-orm/mikro-orm/commit/b0c0236ac8a2154e7181ac737baccbe95782f337))





## [6.1.12](https://github.com/mikro-orm/mikro-orm/compare/v6.1.11...v6.1.12) (2024-03-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.1.11](https://github.com/mikro-orm/mikro-orm/compare/v6.1.10...v6.1.11) (2024-03-18)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.1.10](https://github.com/mikro-orm/mikro-orm/compare/v6.1.9...v6.1.10) (2024-03-14)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.1.9](https://github.com/mikro-orm/mikro-orm/compare/v6.1.8...v6.1.9) (2024-03-10)


### Bug Fixes

* **entity-generator:** emit missing imports in `EntitySchema` generated files ([#5311](https://github.com/mikro-orm/mikro-orm/issues/5311)) ([f680d66](https://github.com/mikro-orm/mikro-orm/commit/f680d66d8da08f0c6c898c3dd300bf1e920439b4))
* **entity-generator:** output type import statements for type only core imports ([#5317](https://github.com/mikro-orm/mikro-orm/issues/5317)) ([bd3f160](https://github.com/mikro-orm/mikro-orm/commit/bd3f160988ac48c9d1a0b591f5674f9b8f5e16e7))





## [6.1.8](https://github.com/mikro-orm/mikro-orm/compare/v6.1.7...v6.1.8) (2024-03-06)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.1.7](https://github.com/mikro-orm/mikro-orm/compare/v6.1.6...v6.1.7) (2024-03-04)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.1.6](https://github.com/mikro-orm/mikro-orm/compare/v6.1.5...v6.1.6) (2024-02-28)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.1.5](https://github.com/mikro-orm/mikro-orm/compare/v6.1.4...v6.1.5) (2024-02-21)


### Bug Fixes

* **entity-generator:** fixed generation of unsigned columns ([#5254](https://github.com/mikro-orm/mikro-orm/issues/5254)) ([d78da29](https://github.com/mikro-orm/mikro-orm/commit/d78da297c701a319ea704847e97c2186934831bc))
* **entity-generator:** optional and hidden properties get type option + string defaults ([#5264](https://github.com/mikro-orm/mikro-orm/issues/5264)) ([12d3b54](https://github.com/mikro-orm/mikro-orm/commit/12d3b54118035195f5ee0ee5665e37a7f2e37164)), closes [#5260](https://github.com/mikro-orm/mikro-orm/issues/5260)





## [6.1.4](https://github.com/mikro-orm/mikro-orm/compare/v6.1.3...v6.1.4) (2024-02-16)


### Bug Fixes

* **entity-generator:** use `Ref` wrapper on all lazy properties ([#5252](https://github.com/mikro-orm/mikro-orm/issues/5252)) ([50311cb](https://github.com/mikro-orm/mikro-orm/commit/50311cbdd66d289e7048c8d77b395a541a9f2605))


### Features

* **entity-generator:** added support for generated columns ([#5250](https://github.com/mikro-orm/mikro-orm/issues/5250)) ([d2186da](https://github.com/mikro-orm/mikro-orm/commit/d2186da4ed3265d8667069c3ac0514843987cb2b))





## [6.1.3](https://github.com/mikro-orm/mikro-orm/compare/v6.1.2...v6.1.3) (2024-02-13)


### Features

* **entity-generator:** support `mapToPk` option ([#5241](https://github.com/mikro-orm/mikro-orm/issues/5241)) ([3afaa29](https://github.com/mikro-orm/mikro-orm/commit/3afaa29704c5889e24806a6f2027a465c53e0f2e))





## [6.1.2](https://github.com/mikro-orm/mikro-orm/compare/v6.1.1...v6.1.2) (2024-02-11)


### Features

* **entity-generator:** add the ability to use custom and/or core base entity ([#5232](https://github.com/mikro-orm/mikro-orm/issues/5232)) ([066dac1](https://github.com/mikro-orm/mikro-orm/commit/066dac1828802dca82361146b6eae012386baeff))





## [6.1.1](https://github.com/mikro-orm/mikro-orm/compare/v6.1.0...v6.1.1) (2024-02-10)


### Features

* **entity-generator:** support functions in extension hooks ([#5218](https://github.com/mikro-orm/mikro-orm/issues/5218)) ([b28321c](https://github.com/mikro-orm/mikro-orm/commit/b28321c14a848dcc5528044d5a4c0fe2a5bab6ba))





# [6.1.0](https://github.com/mikro-orm/mikro-orm/compare/v6.0.7...v6.1.0) (2024-02-04)


### Features

* **entity-generator:** allow post processing the metadata ([#5113](https://github.com/mikro-orm/mikro-orm/issues/5113)) ([e82058f](https://github.com/mikro-orm/mikro-orm/commit/e82058f173f7f8404828b5974884b06d83f2b1eb)), closes [#5010](https://github.com/mikro-orm/mikro-orm/issues/5010)





## [6.0.7](https://github.com/mikro-orm/mikro-orm/compare/v6.0.6...v6.0.7) (2024-01-30)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.0.6](https://github.com/mikro-orm/mikro-orm/compare/v6.0.5...v6.0.6) (2024-01-29)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.0.5](https://github.com/mikro-orm/mikro-orm/compare/v6.0.4...v6.0.5) (2024-01-18)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.0.4](https://github.com/mikro-orm/mikro-orm/compare/v6.0.3...v6.0.4) (2024-01-15)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.0.3](https://github.com/mikro-orm/mikro-orm/compare/v6.0.2...v6.0.3) (2024-01-13)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [6.0.2](https://github.com/mikro-orm/mikro-orm/compare/v6.0.1...v6.0.2) (2024-01-09)


### Features

* **entity-generator:** allow customizing entity name based on schema name ([1e5afb8](https://github.com/mikro-orm/mikro-orm/commit/1e5afb8acbb7a8f06da1245d419074272d685f0f)), closes [#5084](https://github.com/mikro-orm/mikro-orm/issues/5084)





## [6.0.1](https://github.com/mikro-orm/mikro-orm/compare/v6.0.0...v6.0.1) (2024-01-08)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [6.0.0](https://github.com/mikro-orm/mikro-orm/compare/v5.9.7...v6.0.0) (2024-01-08)


### Bug Fixes

* **core:** ensure propagation and change-tracking works with `useDefineForClassFields` ([#4730](https://github.com/mikro-orm/mikro-orm/issues/4730)) ([83f24aa](https://github.com/mikro-orm/mikro-orm/commit/83f24aa3fc065fdfa50ae3df6af5ea14516018e1)), closes [#4216](https://github.com/mikro-orm/mikro-orm/issues/4216)
* **core:** refactor mapping of `Date` properties ([#4391](https://github.com/mikro-orm/mikro-orm/issues/4391)) ([3a80369](https://github.com/mikro-orm/mikro-orm/commit/3a8036928ce36d31a2005b7e5133cf825b84a1b5)), closes [#4362](https://github.com/mikro-orm/mikro-orm/issues/4362) [#4360](https://github.com/mikro-orm/mikro-orm/issues/4360) [#1476](https://github.com/mikro-orm/mikro-orm/issues/1476)
* **entity-generator:** use index expressions for complex indexes (e.g. conditional) ([64a39f8](https://github.com/mikro-orm/mikro-orm/commit/64a39f82c7d391d28e28c639512a810c516f08a9)), closes [#4911](https://github.com/mikro-orm/mikro-orm/issues/4911)


### Features

* **core:** remove static require calls ([#3814](https://github.com/mikro-orm/mikro-orm/issues/3814)) ([b58f476](https://github.com/mikro-orm/mikro-orm/commit/b58f4763995738cad11d08665b239443f9fb4499)), closes [#3743](https://github.com/mikro-orm/mikro-orm/issues/3743)
* **entity-generator:** added ability to output type option in decorator ([#4935](https://github.com/mikro-orm/mikro-orm/issues/4935)) ([2d1936a](https://github.com/mikro-orm/mikro-orm/commit/2d1936a80f948e0fd83b8fc89bb48feb132537d6))
* **entity-generator:** allow generating scalar properties for FKs ([#4892](https://github.com/mikro-orm/mikro-orm/issues/4892)) ([abad6ca](https://github.com/mikro-orm/mikro-orm/commit/abad6ca9dcafaaf9319261b4ac116ef5ad6485b3)), closes [#4898](https://github.com/mikro-orm/mikro-orm/issues/4898)
* **entity-generator:** allow local and global configuration of all options ([#4965](https://github.com/mikro-orm/mikro-orm/issues/4965)) ([2876b8a](https://github.com/mikro-orm/mikro-orm/commit/2876b8a74560e60605ff0de2feaba0d29c28d4aa))
* **entity-generator:** allow overriding generated entity file name ([4ebc8e3](https://github.com/mikro-orm/mikro-orm/commit/4ebc8e3665d7c75788b51a6da59575ccff19f612)), closes [#5026](https://github.com/mikro-orm/mikro-orm/issues/5026)
* **entity-generator:** detect more ManyToMany relations ([#4974](https://github.com/mikro-orm/mikro-orm/issues/4974)) ([d0e3ac9](https://github.com/mikro-orm/mikro-orm/commit/d0e3ac97d6443c050ce4c9a1a4fab6a20edaf9c0))
* **entity-generator:** generate `OptionalProps` and other symbols for `EntitySchema` ([00f0a34](https://github.com/mikro-orm/mikro-orm/commit/00f0a3465808670a79d47ea345dfd50706f843b7))





## [5.9.2](https://github.com/mikro-orm/mikro-orm/compare/v5.9.1...v5.9.2) (2023-11-02)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.9.1](https://github.com/mikro-orm/mikro-orm/compare/v5.9.0...v5.9.1) (2023-10-31)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.9.0](https://github.com/mikro-orm/mikro-orm/compare/v5.8.10...v5.9.0) (2023-10-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.10](https://github.com/mikro-orm/mikro-orm/compare/v5.8.9...v5.8.10) (2023-10-18)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.9](https://github.com/mikro-orm/mikro-orm/compare/v5.8.8...v5.8.9) (2023-10-15)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.8](https://github.com/mikro-orm/mikro-orm/compare/v5.8.7...v5.8.8) (2023-10-11)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.7](https://github.com/mikro-orm/mikro-orm/compare/v5.8.6...v5.8.7) (2023-10-05)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.6](https://github.com/mikro-orm/mikro-orm/compare/v5.8.5...v5.8.6) (2023-10-02)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.5](https://github.com/mikro-orm/mikro-orm/compare/v5.8.4...v5.8.5) (2023-09-30)


### Bug Fixes

* **core:** pin all internal dependencies ([f4868ed](https://github.com/mikro-orm/mikro-orm/commit/f4868edec97457e7c4548d887fb3ba23cf266c59)), closes [#4764](https://github.com/mikro-orm/mikro-orm/issues/4764)





## [5.8.4](https://github.com/mikro-orm/mikro-orm/compare/v5.8.3...v5.8.4) (2023-09-27)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.3](https://github.com/mikro-orm/mikro-orm/compare/v5.8.2...v5.8.3) (2023-09-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.8.2](https://github.com/mikro-orm/mikro-orm/compare/v5.8.1...v5.8.2) (2023-09-20)


### Features

* **entity-generator:** generate `PrimaryKeyProp` and `PrimaryKeyType` symbols ([605446a](https://github.com/mikro-orm/mikro-orm/commit/605446a5f9f19fc9c67e7dd758132e487c28a29a))





## [5.8.1](https://github.com/mikro-orm/mikro-orm/compare/v5.8.0...v5.8.1) (2023-09-12)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.8.0](https://github.com/mikro-orm/mikro-orm/compare/v5.7.14...v5.8.0) (2023-09-10)


### Bug Fixes

* **entity-generator:** respect `precision` and `scale` in numeric column type ([3a52c39](https://github.com/mikro-orm/mikro-orm/commit/3a52c399ce5188125704c29417f8587a02c05637))


### Features

* **entity-generator:** allow skipping some tables or columns ([e603108](https://github.com/mikro-orm/mikro-orm/commit/e603108445ed97b05cb48dd60830bb04cb095d57)), closes [#4584](https://github.com/mikro-orm/mikro-orm/issues/4584)





## [5.7.14](https://github.com/mikro-orm/mikro-orm/compare/v5.7.13...v5.7.14) (2023-07-27)


### Bug Fixes

* **entity-generator:** use ref instead of wrappedReference ([#4559](https://github.com/mikro-orm/mikro-orm/issues/4559)) ([be02aa4](https://github.com/mikro-orm/mikro-orm/commit/be02aa4eba3706023eb474e8cfa222f31a95a494))





## [5.7.13](https://github.com/mikro-orm/mikro-orm/compare/v5.7.12...v5.7.13) (2023-07-16)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.10](https://github.com/mikro-orm/mikro-orm/compare/v5.7.9...v5.7.10) (2023-05-23)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.9](https://github.com/mikro-orm/mikro-orm/compare/v5.7.8...v5.7.9) (2023-05-22)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.8](https://github.com/mikro-orm/mikro-orm/compare/v5.7.7...v5.7.8) (2023-05-21)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.6](https://github.com/mikro-orm/mikro-orm/compare/v5.7.5...v5.7.6) (2023-05-13)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.5](https://github.com/mikro-orm/mikro-orm/compare/v5.7.4...v5.7.5) (2023-05-09)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.4](https://github.com/mikro-orm/mikro-orm/compare/v5.7.3...v5.7.4) (2023-05-01)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.3](https://github.com/mikro-orm/mikro-orm/compare/v5.7.2...v5.7.3) (2023-04-28)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Reverts

* Revert "chore(release): v5.6.16 [skip ci]" ([49faac9](https://github.com/mikro-orm/mikro-orm/commit/49faac95c86d4c65fb6f66f76efa98ba221dd67e))
* Revert "chore(release): update internal dependencies to use tilde [skip ci]" ([381cba1](https://github.com/mikro-orm/mikro-orm/commit/381cba1fbf1141e1f754d25e1fd5748906425caa))





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.11](https://github.com/mikro-orm/mikro-orm/compare/v5.6.10...v5.6.11) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.10](https://github.com/mikro-orm/mikro-orm/compare/v5.6.9...v5.6.10) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.9](https://github.com/mikro-orm/mikro-orm/compare/v5.6.8...v5.6.9) (2023-02-10)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.8](https://github.com/mikro-orm/mikro-orm/compare/v5.6.7...v5.6.8) (2023-01-25)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)


### Bug Fixes

* **entity-generator:** use table name instead of class name in `EntitySchema` ([#3916](https://github.com/mikro-orm/mikro-orm/issues/3916)) ([84d9407](https://github.com/mikro-orm/mikro-orm/commit/84d9407b75137b1e69d66d257fb0a72ab2229558)), closes [#3915](https://github.com/mikro-orm/mikro-orm/issues/3915)





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.6.1](https://github.com/mikro-orm/mikro-orm/compare/v5.6.0...v5.6.1) (2022-12-20)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)


### Features

* **core:** introduce ORM extensions ([#3773](https://github.com/mikro-orm/mikro-orm/issues/3773)) ([0f36967](https://github.com/mikro-orm/mikro-orm/commit/0f36967d3c227465ea9c23aa8f290cd8fe383bad))





## [5.5.3](https://github.com/mikro-orm/mikro-orm/compare/v5.5.2...v5.5.3) (2022-11-10)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.4.2](https://github.com/mikro-orm/mikro-orm/compare/v5.4.1...v5.4.2) (2022-09-12)


### Features

* **entity-generator:** generate `OptionalProps` symbols ([#3482](https://github.com/mikro-orm/mikro-orm/issues/3482)) ([6ba3d40](https://github.com/mikro-orm/mikro-orm/commit/6ba3d4004deef00b754a4ca2011cf64e44a4a3a3))





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Features

* **entity-generator:** add import extension for referenced entities ([#3420](https://github.com/mikro-orm/mikro-orm/issues/3420)) ([f80809a](https://github.com/mikro-orm/mikro-orm/commit/f80809a7bade25f30c8ae1aff3aa85d04249d853))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Bug Fixes

* **entity-generator:** ensure stable order of generated entities ([06e0e05](https://github.com/mikro-orm/mikro-orm/commit/06e0e05bf91d111a231a5d135add496928468498))


### Features

* **core:** add support for virtual entities ([#3351](https://github.com/mikro-orm/mikro-orm/issues/3351)) ([dcd62ac](https://github.com/mikro-orm/mikro-orm/commit/dcd62ac1155e20e7e58d7de4c5fe1a22a422e201))
* **entity-generator:** allow defining entities with `EntitySchema` instead of decorators ([b423c10](https://github.com/mikro-orm/mikro-orm/commit/b423c104d942bfdb4a875a64c52f98ec85899c6c))





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))


### Features

* **entity-generator:** allow generating bidirectional relations ([8b93400](https://github.com/mikro-orm/mikro-orm/commit/8b93400f2bc3569375d7316cf5b995fc1c6821c6)), closes [#3181](https://github.com/mikro-orm/mikro-orm/issues/3181)
* **entity-generator:** allow generating identified references ([1fbf5ac](https://github.com/mikro-orm/mikro-orm/commit/1fbf5ac1ab2334c7e7ccbe190ded411a9490431c))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **entity-generator:** do not infer `cascade` value based on update/delete rules ([372f4a0](https://github.com/mikro-orm/mikro-orm/commit/372f4a05a50bd78e796ec8c49190085aa4e0aa89)), closes [#1857](https://github.com/mikro-orm/mikro-orm/issues/1857)
* **entity-generator:** fix boolean default values ([908a638](https://github.com/mikro-orm/mikro-orm/commit/908a6387958a7f0604754ad086cdc34a271c5d7f)), closes [#1917](https://github.com/mikro-orm/mikro-orm/issues/1917)


### Features

* **core:** add index/key name to naming strategy ([a842e3e](https://github.com/mikro-orm/mikro-orm/commit/a842e3eea80349777ccdf7b8840b3c1860e9607f))
* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))
* **entity-generator:** add enum generation support ([#2608](https://github.com/mikro-orm/mikro-orm/issues/2608)) ([1e0b411](https://github.com/mikro-orm/mikro-orm/commit/1e0b411dad3cb0ebb456b34e1bcac9a71f059c48))
* **entity-generator:** add support for generating M:N properties ([c0628c5](https://github.com/mikro-orm/mikro-orm/commit/c0628c5bea63b2b9f7b16a5da2c2e467784b9271))
* **entity-generator:** allow specifying schema ([beb2993](https://github.com/mikro-orm/mikro-orm/commit/beb299383c647f9f2d7431e177659d299fb0f041)), closes [#1301](https://github.com/mikro-orm/mikro-orm/issues/1301)
* **schema:** rework schema diffing ([#1641](https://github.com/mikro-orm/mikro-orm/issues/1641)) ([05f15a3](https://github.com/mikro-orm/mikro-orm/commit/05f15a37db178271a88dfa743be8ac01cd97db8e)), closes [#1486](https://github.com/mikro-orm/mikro-orm/issues/1486) [#1518](https://github.com/mikro-orm/mikro-orm/issues/1518) [#579](https://github.com/mikro-orm/mikro-orm/issues/579) [#1559](https://github.com/mikro-orm/mikro-orm/issues/1559) [#1602](https://github.com/mikro-orm/mikro-orm/issues/1602) [#1480](https://github.com/mikro-orm/mikro-orm/issues/1480) [#1687](https://github.com/mikro-orm/mikro-orm/issues/1687)





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)


### Bug Fixes

* **entity-generator:** fix boolean default values ([219fc0c](https://github.com/mikro-orm/mikro-orm/commit/219fc0c9376b32928bcc5a6d73053d2d2384eb44)), closes [#1917](https://github.com/mikro-orm/mikro-orm/issues/1917)





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)


### Bug Fixes

* **entity-generator:** do not infer `cascade` value based on update/delete rules ([dca4f21](https://github.com/mikro-orm/mikro-orm/commit/dca4f21ca210ec34f60017860ddd1bb95b4dc333)), closes [#1857](https://github.com/mikro-orm/mikro-orm/issues/1857)





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)


### Bug Fixes

* **entity-generator:** emit collection name in decorator ([#1338](https://github.com/mikro-orm/mikro-orm/issues/1338)) ([33574e8](https://github.com/mikro-orm/mikro-orm/commit/33574e8b46235637128f516ce83d290c57e2a7ba)), closes [#1328](https://github.com/mikro-orm/mikro-orm/issues/1328)





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)


### Features

* **core:** add basic (in-memory) result caching ([2f8253d](https://github.com/mikro-orm/mikro-orm/commit/2f8253d9db9ae0c469e2dcf976aa20546f3b9b8c))





## [4.1.1](https://github.com/mikro-orm/mikro-orm/compare/v4.1.0...v4.1.1) (2020-10-14)

**Note:** Version bump only for package @mikro-orm/entity-generator





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)


### Performance Improvements

* **core:** use faster way to check number of object keys ([82f3ee4](https://github.com/mikro-orm/mikro-orm/commit/82f3ee4d4169def8ce8fe31764171193e8b8b5dc)), closes [#732](https://github.com/mikro-orm/mikro-orm/issues/732)





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)

**Note:** Version bump only for package @mikro-orm/entity-generator





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)


### Features

* **entity-generator:** do not use ts-morph ([478a7bb](https://github.com/mikro-orm/mikro-orm/commit/478a7bb7f9ea80062caaef666b8308086842a44b))





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)

**Note:** Version bump only for package @mikro-orm/entity-generator
