# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.1.5](https://github.com/mikro-orm/mikro-orm/compare/v7.1.4...v7.1.5) (2026-06-26)


### Bug Fixes

* **core:** apply populateOrderBy to select-in relations without leaking into M:N pivots ([#7915](https://github.com/mikro-orm/mikro-orm/issues/7915)) ([03bb827](https://github.com/mikro-orm/mikro-orm/commit/03bb8271624185da140a4b34acbe5d52885b400e)), closes [#7910](https://github.com/mikro-orm/mikro-orm/issues/7910)
* **core:** skip view entities in schema.clear() ([#7880](https://github.com/mikro-orm/mikro-orm/issues/7880)) ([3b762fe](https://github.com/mikro-orm/mikro-orm/commit/3b762fe0bb82d45f1838355e17c3d553ea7c19d4)), closes [#7874](https://github.com/mikro-orm/mikro-orm/issues/7874)
* **postgres:** handle stored routines with unnamed parameters ([#7917](https://github.com/mikro-orm/mikro-orm/issues/7917)) ([6302833](https://github.com/mikro-orm/mikro-orm/commit/6302833dab3489ceb3459d8e9af9561a5670885e)), closes [#7905](https://github.com/mikro-orm/mikro-orm/issues/7905)
* **sql:** derive bulk insert columns from all rows, not just the first ([#7884](https://github.com/mikro-orm/mikro-orm/issues/7884)) ([4abfb52](https://github.com/mikro-orm/mikro-orm/commit/4abfb52dce8559090c3bbb9b1a34e690874895c4)), closes [#7871](https://github.com/mikro-orm/mikro-orm/issues/7871)
* **sql:** keep nested collection populateOrderBy by a to-one relation field under joined strategy ([#7916](https://github.com/mikro-orm/mikro-orm/issues/7916)) ([e81d01b](https://github.com/mikro-orm/mikro-orm/commit/e81d01bf639a29d75e5dfc27ea6a663e86b39098)), closes [#7911](https://github.com/mikro-orm/mikro-orm/issues/7911)
* **sql:** resolve target entity schema in nested collection operators ([#7895](https://github.com/mikro-orm/mikro-orm/issues/7895)) ([5be97fb](https://github.com/mikro-orm/mikro-orm/commit/5be97fb7ca11910582369d533df838e5031d1ef0)), closes [#7894](https://github.com/mikro-orm/mikro-orm/issues/7894)
* **sql:** serialize array operators as a single literal in JOIN-ON conditions ([#7900](https://github.com/mikro-orm/mikro-orm/issues/7900)) ([c938c7a](https://github.com/mikro-orm/mikro-orm/commit/c938c7ad229a50330d60f3e06f79ba781808d519)), closes [#7899](https://github.com/mikro-orm/mikro-orm/issues/7899)
* **sql:** strip comments from view definitions in schema generator ([#7883](https://github.com/mikro-orm/mikro-orm/issues/7883)) ([d56826b](https://github.com/mikro-orm/mikro-orm/commit/d56826b2fdd754ff197d35f9f7b4ffee24e364c6)), closes [#7875](https://github.com/mikro-orm/mikro-orm/issues/7875)





## [7.1.4](https://github.com/mikro-orm/mikro-orm/compare/v7.1.3...v7.1.4) (2026-06-06)

### Bug Fixes

- **core:** populate polymorphic embedded arrays loaded via a relation ([#7846](https://github.com/mikro-orm/mikro-orm/issues/7846)) ([18f9b58](https://github.com/mikro-orm/mikro-orm/commit/18f9b58225e2e6c26adec0f81dbb59c5500f1ff7)), closes [#7845](https://github.com/mikro-orm/mikro-orm/issues/7845)
- **postgres:** don't mis-detect JSON operator checks as enums ([#7829](https://github.com/mikro-orm/mikro-orm/issues/7829)) ([dee3d3a](https://github.com/mikro-orm/mikro-orm/commit/dee3d3ab5478276fc99ce782d403edb2d205472e)), closes [#7822](https://github.com/mikro-orm/mikro-orm/issues/7822)
- **postgres:** introspect native enums with no members ([#7830](https://github.com/mikro-orm/mikro-orm/issues/7830)) ([aab9970](https://github.com/mikro-orm/mikro-orm/commit/aab9970ab1aa076a10e70edcd4f63e170767e883)), closes [#7825](https://github.com/mikro-orm/mikro-orm/issues/7825)
- **postgres:** unwrap single-paren CHECK shell for bare boolean CASE bodies ([#7827](https://github.com/mikro-orm/mikro-orm/issues/7827)) ([52ef9e9](https://github.com/mikro-orm/mikro-orm/commit/52ef9e925bbec59f84c821f2bf269e9e9beb97fb)), closes [#7824](https://github.com/mikro-orm/mikro-orm/issues/7824)
- **sql:** emit column name for kysely on-create/on-update hook injection ([#7837](https://github.com/mikro-orm/mikro-orm/issues/7837)) ([f4135f7](https://github.com/mikro-orm/mikro-orm/commit/f4135f72f8a948982f0245123f70d6b23ee24324)), closes [#7836](https://github.com/mikro-orm/mikro-orm/issues/7836)

## [7.1.3](https://github.com/mikro-orm/mikro-orm/compare/v7.1.2...v7.1.3) (2026-05-31)

### Features

- **postgres:** support adding and changing partitioning on existing tables ([#7816](https://github.com/mikro-orm/mikro-orm/issues/7816)) ([db738bd](https://github.com/mikro-orm/mikro-orm/commit/db738bde917d3dffb1f3c900c59e126dc0d6c80b))
- **schema:** add `ignoreRoutines` option to leave routines unmanaged ([#7810](https://github.com/mikro-orm/mikro-orm/issues/7810)) ([84e2ed3](https://github.com/mikro-orm/mikro-orm/commit/84e2ed3f305ad110c041e695609417177ff3802a))
- **schema:** add `ignoreTriggers` option and skip trigger drops in safe mode ([#7809](https://github.com/mikro-orm/mikro-orm/issues/7809)) ([cc35d88](https://github.com/mikro-orm/mikro-orm/commit/cc35d8889e867ea55d815d1fc50265ff8c8fe6a0))

## [7.1.2](https://github.com/mikro-orm/mikro-orm/compare/v7.1.1...v7.1.2) (2026-05-29)

### Bug Fixes

- **sql:** expose raw aliases in QueryBuilder execute() result type ([#7785](https://github.com/mikro-orm/mikro-orm/issues/7785)) ([2944703](https://github.com/mikro-orm/mikro-orm/commit/29447039532eea662e32c222a382308a744d6b6e))
- **sql:** handle scalar PK in joined mapping of composite-FK relations ([#7802](https://github.com/mikro-orm/mikro-orm/issues/7802)) ([88fae8e](https://github.com/mikro-orm/mikro-orm/commit/88fae8ea975e154bf62e17694a5dd53d8685f60d)), closes [#7801](https://github.com/mikro-orm/mikro-orm/issues/7801)
- **sql:** stabilize MySQL snapshot serialization for decimal/text/extra/comment ([#7797](https://github.com/mikro-orm/mikro-orm/issues/7797)) ([184cfde](https://github.com/mikro-orm/mikro-orm/commit/184cfde5c581e31379b69a391c3af80baeb2428e)), closes [#7235](https://github.com/mikro-orm/mikro-orm/issues/7235) [#7608](https://github.com/mikro-orm/mikro-orm/issues/7608) [#7796](https://github.com/mikro-orm/mikro-orm/issues/7796)
- **sql:** stop spurious Postgres schema diff on geometry typmod and truncated check names ([#7803](https://github.com/mikro-orm/mikro-orm/issues/7803)) ([a972992](https://github.com/mikro-orm/mikro-orm/commit/a972992cc93df264488adaf19efa60a380a3a9a3)), closes [#7798](https://github.com/mikro-orm/mikro-orm/issues/7798) [#7798](https://github.com/mikro-orm/mikro-orm/issues/7798)
- **sql:** stop sqlite snapshot flip on table/column comments ([#7799](https://github.com/mikro-orm/mikro-orm/issues/7799)) ([bac9210](https://github.com/mikro-orm/mikro-orm/commit/bac9210e3afc42ad29c53ce9d44b45da0c2dd5ca)), closes [#7798](https://github.com/mikro-orm/mikro-orm/issues/7798)

### Features

- **postgres:** support `EXCLUDE` constraints via `@Check` ([#7789](https://github.com/mikro-orm/mikro-orm/issues/7789)) ([bcfb0cd](https://github.com/mikro-orm/mikro-orm/commit/bcfb0cd455cb78f72b9f3b9103fa9d7959c6753d)), closes [#7787](https://github.com/mikro-orm/mikro-orm/issues/7787)

## [7.1.1](https://github.com/mikro-orm/mikro-orm/compare/v7.1.0...v7.1.1) (2026-05-22)

### Bug Fixes

- **migrations:** preserve partial unique index `where` predicate in snapshot ([#7778](https://github.com/mikro-orm/mikro-orm/issues/7778)) ([5616c3d](https://github.com/mikro-orm/mikro-orm/commit/5616c3dace1006f90887b1fb3f19232c7599faab)), closes [#7773](https://github.com/mikro-orm/mikro-orm/issues/7773)
- **postgres:** recast column default when changing array element type ([#7769](https://github.com/mikro-orm/mikro-orm/issues/7769)) ([e122c20](https://github.com/mikro-orm/mikro-orm/commit/e122c2005a211e0a0b2bc5a44464cf4bb1ee233a))
- **schema:** detect removed default on boolean columns ([#7777](https://github.com/mikro-orm/mikro-orm/issues/7777)) ([c0faca0](https://github.com/mikro-orm/mikro-orm/commit/c0faca002b65c4e4f1a7b29a0acdfd8c8bbdbc86)), closes [#7774](https://github.com/mikro-orm/mikro-orm/issues/7774)

# [7.1.0](https://github.com/mikro-orm/mikro-orm/compare/v7.0.17...v7.1.0) (2026-05-20)

### Bug Fixes

- **sql:** infer scalar array properties as columns in Kysely types ([#7753](https://github.com/mikro-orm/mikro-orm/issues/7753)) ([111d69d](https://github.com/mikro-orm/mikro-orm/commit/111d69d962edebbbf014f4209952f4a3128c23c2)), closes [#7751](https://github.com/mikro-orm/mikro-orm/issues/7751)
- **sql:** wrap raw subqueries with parens inside INSERT VALUES ([#7754](https://github.com/mikro-orm/mikro-orm/issues/7754)) ([d379880](https://github.com/mikro-orm/mikro-orm/commit/d3798800bc62eeb51a28267fb3fee60c5b6249bd)), closes [#7749](https://github.com/mikro-orm/mikro-orm/issues/7749)

### Features

- **cli:** emit typed `EntityManager` alias from `discovery:export` ([#7756](https://github.com/mikro-orm/mikro-orm/issues/7756)) ([fd06439](https://github.com/mikro-orm/mikro-orm/commit/fd064396bd6e6b941204a0a62133cbe6b9f9bbfe))
- **core:** add `em.clone()` and `qb.insertFrom()` for server-side row cloning ([#7365](https://github.com/mikro-orm/mikro-orm/issues/7365)) ([13ca566](https://github.com/mikro-orm/mikro-orm/commit/13ca5667ed66867326735461b2ce2c14d400e3bb)), closes [#5820](https://github.com/mikro-orm/mikro-orm/issues/5820)
- **core:** add `em.countBy()` for grouped counting ([#7372](https://github.com/mikro-orm/mikro-orm/issues/7372)) ([c4d2e99](https://github.com/mikro-orm/mikro-orm/commit/c4d2e990fb7e559c19fad772a23bc8808611335b))
- **core:** add `where` option for partial indexes and unique constraints ([#7593](https://github.com/mikro-orm/mikro-orm/issues/7593)) ([78d00e3](https://github.com/mikro-orm/mikro-orm/commit/78d00e3530d68001b875d3bf1be62a0d70bc822d))
- **core:** add a `chunkSize` option to streams ([#7520](https://github.com/mikro-orm/mikro-orm/issues/7520)) ([13c61fa](https://github.com/mikro-orm/mikro-orm/commit/13c61fad8e0db72ba48bcb936ab886058c2f8d37))
- **core:** add column-level `collation` support for SQL drivers ([#7615](https://github.com/mikro-orm/mikro-orm/issues/7615)) ([12e3a73](https://github.com/mikro-orm/mikro-orm/commit/12e3a7321085ca974244d1c847f6f71e075c8ad8)), closes [#4286](https://github.com/mikro-orm/mikro-orm/issues/4286)
- **core:** add type-safe `using` option for index hints ([#7375](https://github.com/mikro-orm/mikro-orm/issues/7375)) ([3337b58](https://github.com/mikro-orm/mikro-orm/commit/3337b5812ee49841edb69b5c331ec06345fb440d)), closes [#7175](https://github.com/mikro-orm/mikro-orm/issues/7175)
- **core:** expose query cancellation via `AbortSignal` ([#7629](https://github.com/mikro-orm/mikro-orm/issues/7629)) ([1a8379c](https://github.com/mikro-orm/mikro-orm/commit/1a8379c0c3e533bb1594ccb63dbf3fee665f92b5))
- **core:** per-parent limiting for populated collections ([#7370](https://github.com/mikro-orm/mikro-orm/issues/7370)) ([6ff01e4](https://github.com/mikro-orm/mikro-orm/commit/6ff01e488741aca1b181c4704d42b3960d59b263)), closes [#1059](https://github.com/mikro-orm/mikro-orm/issues/1059)
- **core:** support stored procedures and functions ([#7693](https://github.com/mikro-orm/mikro-orm/issues/7693)) ([9bbbb8b](https://github.com/mikro-orm/mikro-orm/commit/9bbbb8b3f9e0bbcd9e1da9150fb9565f012ea210)), closes [#5253](https://github.com/mikro-orm/mikro-orm/issues/5253)
- **core:** union-target polymorphic M:N relations ([#7569](https://github.com/mikro-orm/mikro-orm/issues/7569)) ([dfbe1c2](https://github.com/mikro-orm/mikro-orm/commit/dfbe1c263f730c3d267178a285c4177de44dfb09)), closes [#7564](https://github.com/mikro-orm/mikro-orm/issues/7564) [#7564](https://github.com/mikro-orm/mikro-orm/issues/7564)
- **migrations:** support runtime schema context ([#7597](https://github.com/mikro-orm/mikro-orm/issues/7597)) ([9b00229](https://github.com/mikro-orm/mikro-orm/commit/9b00229a36ccc9dcc857434ec8a39ceafd274ab8)), closes [#3319](https://github.com/mikro-orm/mikro-orm/issues/3319) [#4928](https://github.com/mikro-orm/mikro-orm/issues/4928)
- **pglite:** add PGlite driver ([#7622](https://github.com/mikro-orm/mikro-orm/issues/7622)) ([01f18c5](https://github.com/mikro-orm/mikro-orm/commit/01f18c59f2a3022f01d0d190c003982f275c1192))
- **postgresql:** add support for table partitioning ([#7497](https://github.com/mikro-orm/mikro-orm/issues/7497)) ([63d0977](https://github.com/mikro-orm/mikro-orm/commit/63d0977edd86726b51e75ac74899457d1aa7bd92)), closes [#6944](https://github.com/mikro-orm/mikro-orm/issues/6944) [#6944](https://github.com/mikro-orm/mikro-orm/issues/6944)
- **schema:** add database trigger support ([#7379](https://github.com/mikro-orm/mikro-orm/issues/7379)) ([da4010d](https://github.com/mikro-orm/mikro-orm/commit/da4010d290f3aa3cc2bf0aa2fba31a694d53f38c)), closes [#5053](https://github.com/mikro-orm/mikro-orm/issues/5053)
- **sql:** bind `getKysely()` to the current transaction context ([#7701](https://github.com/mikro-orm/mikro-orm/issues/7701)) ([344be12](https://github.com/mikro-orm/mikro-orm/commit/344be129472ee5f108dbed38db58463af30ff2bf)), closes [#7679](https://github.com/mikro-orm/mikro-orm/issues/7679)

## [7.0.17](https://github.com/mikro-orm/mikro-orm/compare/v7.0.16...v7.0.17) (2026-05-17)

### Bug Fixes

- **core:** merge index `columns` overrides with the full property list ([#7733](https://github.com/mikro-orm/mikro-orm/issues/7733)) ([7aad84b](https://github.com/mikro-orm/mikro-orm/commit/7aad84b99c6c018424eadb9ba0923b5f49e6f4bc))
- **core:** resolve TPT parent alias for custom-typed inherited columns ([#7731](https://github.com/mikro-orm/mikro-orm/issues/7731)) ([202ab1c](https://github.com/mikro-orm/mikro-orm/commit/202ab1cbf0c1f4f1cea0b75425e931c4a3c532dc))
- **core:** scope STI subclass discriminator when extends is a schema ([#7727](https://github.com/mikro-orm/mikro-orm/issues/7727)) ([df74b4b](https://github.com/mikro-orm/mikro-orm/commit/df74b4bd6116d9e31812a264fd3903e47f6d8ec4)), closes [#7726](https://github.com/mikro-orm/mikro-orm/issues/7726)

## [7.0.16](https://github.com/mikro-orm/mikro-orm/compare/v7.0.15...v7.0.16) (2026-05-14)

### Bug Fixes

- **core:** resolve polymorphic TPT-child filter columns to parent table ([#7719](https://github.com/mikro-orm/mikro-orm/issues/7719)) ([2e5a91a](https://github.com/mikro-orm/mikro-orm/commit/2e5a91a5f2f3cb695779e26f31c91b68599d0c96)), closes [#7717](https://github.com/mikro-orm/mikro-orm/issues/7717)
- **schema:** centralize identifier-length truncation across platforms ([#7706](https://github.com/mikro-orm/mikro-orm/issues/7706)) ([1987833](https://github.com/mikro-orm/mikro-orm/commit/1987833d79285c9d9b5623e0c0a388b790bd39ff))

## [7.0.15](https://github.com/mikro-orm/mikro-orm/compare/v7.0.14...v7.0.15) (2026-05-09)

### Bug Fixes

- **sql:** apply customType SQL wrappers in getKysely ([#7682](https://github.com/mikro-orm/mikro-orm/issues/7682)) ([89f9222](https://github.com/mikro-orm/mikro-orm/commit/89f9222d00aa9b5690d78cccf735d354e70e63ed)), closes [#7679](https://github.com/mikro-orm/mikro-orm/issues/7679)
- **sql:** nest auto-joins inside a join cond's target to avoid forward references ([#7683](https://github.com/mikro-orm/mikro-orm/issues/7683)) ([2ad53b3](https://github.com/mikro-orm/mikro-orm/commit/2ad53b3b59b5ba048cde7a72c929afc50f917519)), closes [#7681](https://github.com/mikro-orm/mikro-orm/issues/7681)

## [7.0.14](https://github.com/mikro-orm/mikro-orm/compare/v7.0.13...v7.0.14) (2026-05-04)

### Bug Fixes

- **core:** escape embedded quote characters in quoteIdentifier ([#7653](https://github.com/mikro-orm/mikro-orm/issues/7653)) ([3fadd28](https://github.com/mikro-orm/mikro-orm/commit/3fadd2873e5c0a8bd3a6fd750a48192e03e56405))
- **core:** escape JSON path keys in getSearchJsonPropertyKey ([#7656](https://github.com/mikro-orm/mikro-orm/issues/7656)) ([556d339](https://github.com/mikro-orm/mikro-orm/commit/556d3396b977705cec05d051ceef8c570c6e7d71))
- **sql:** avoid duplicate result cache write on `em.find()` ([#7645](https://github.com/mikro-orm/mikro-orm/issues/7645)) ([fa12c86](https://github.com/mikro-orm/mikro-orm/commit/fa12c8698d831a96c6580728f2441a2d9675ca4d)), closes [#6923](https://github.com/mikro-orm/mikro-orm/issues/6923) [#7644](https://github.com/mikro-orm/mikro-orm/issues/7644)

### Features

- **sql:** add `MikroORM` and `defineConfig` variants in `@mikro-orm/sql` ([#7647](https://github.com/mikro-orm/mikro-orm/issues/7647)) ([ce31ff4](https://github.com/mikro-orm/mikro-orm/commit/ce31ff449901fe84274ee8e1eaa32c71ad99c93d))

## [7.0.13](https://github.com/mikro-orm/mikro-orm/compare/v7.0.12...v7.0.13) (2026-04-27)

### Bug Fixes

- **postgres:** treat `timetz` / `time with time zone` as aliases in schema diff ([#7618](https://github.com/mikro-orm/mikro-orm/issues/7618)) ([57080c5](https://github.com/mikro-orm/mikro-orm/commit/57080c514fc62eea84ee50ad7f7850ea32becca9)), closes [#7616](https://github.com/mikro-orm/mikro-orm/issues/7616)
- **sql:** stabilize migration snapshot serialization ([#7608](https://github.com/mikro-orm/mikro-orm/issues/7608)) ([caec061](https://github.com/mikro-orm/mikro-orm/commit/caec0616cebf111dd32e89d5a0c798ec840d3c36)), closes [#7607](https://github.com/mikro-orm/mikro-orm/issues/7607) [pre-#7607](https://github.com/pre-/issues/7607) [#7610](https://github.com/mikro-orm/mikro-orm/issues/7610) [#7607](https://github.com/mikro-orm/mikro-orm/issues/7607) [#7610](https://github.com/mikro-orm/mikro-orm/issues/7610)

## [7.0.12](https://github.com/mikro-orm/mikro-orm/compare/v7.0.11...v7.0.12) (2026-04-23)

### Bug Fixes

- **core:** expand polymorphic entity refs in where filters ([#7579](https://github.com/mikro-orm/mikro-orm/issues/7579)) ([32a0f08](https://github.com/mikro-orm/mikro-orm/commit/32a0f08dc8d9c93e1e544a391292462b347fa6c3)), closes [#7578](https://github.com/mikro-orm/mikro-orm/issues/7578)
- **postgres:** schema-qualify generated `drop index` statements ([#7603](https://github.com/mikro-orm/mikro-orm/issues/7603)) ([c32bbd6](https://github.com/mikro-orm/mikro-orm/commit/c32bbd625f83cdea244a7ab1497a7f4527a04bb0))
- **sql:** forward ignoreBranch options for M2M pivot alias resolution ([#7591](https://github.com/mikro-orm/mikro-orm/issues/7591)) ([0cb4895](https://github.com/mikro-orm/mikro-orm/commit/0cb48955952aa481fe2fb78b31d348be595de149)), closes [#7590](https://github.com/mikro-orm/mikro-orm/issues/7590)

## [7.0.11](https://github.com/mikro-orm/mikro-orm/compare/v7.0.10...v7.0.11) (2026-04-16)

### Bug Fixes

- **core:** support TPT inheritance targets in polymorphic relations ([#7564](https://github.com/mikro-orm/mikro-orm/issues/7564)) ([0e818fa](https://github.com/mikro-orm/mikro-orm/commit/0e818fabfafdc453c4e6c3c9e6a1d5e8ac38f332)), closes [#7563](https://github.com/mikro-orm/mikro-orm/issues/7563)
- **postgres:** normalize `!=` to `<>` in check constraint diffing ([#7541](https://github.com/mikro-orm/mikro-orm/issues/7541)) ([b8ad2b0](https://github.com/mikro-orm/mikro-orm/commit/b8ad2b0ba87a6771ff27f9aa824c7bf131551154)), closes [#7540](https://github.com/mikro-orm/mikro-orm/issues/7540)
- **schema:** detect native enum value changes on array columns ([#7561](https://github.com/mikro-orm/mikro-orm/issues/7561)) ([ec20701](https://github.com/mikro-orm/mikro-orm/commit/ec2070144acbece47b397c175f2e5674df3611e8)), closes [#7560](https://github.com/mikro-orm/mikro-orm/issues/7560)

## [7.0.10](https://github.com/mikro-orm/mikro-orm/compare/v7.0.9...v7.0.10) (2026-04-10)

### Bug Fixes

- **core:** brand raw query fragments via prototype property ([#7519](https://github.com/mikro-orm/mikro-orm/issues/7519)) ([f596bdd](https://github.com/mikro-orm/mikro-orm/commit/f596bdd77f6de6edd2c27c5a293af8c6cf0f2b9f)), closes [#7518](https://github.com/mikro-orm/mikro-orm/issues/7518)
- **sql:** allow joining relations on entity-typed CTE in `from()` ([#7523](https://github.com/mikro-orm/mikro-orm/issues/7523)) ([514fb4e](https://github.com/mikro-orm/mikro-orm/commit/514fb4ed52dde2db3815c64f4dcdd0229f762fce)), closes [mikro-orm/mikro-orm#7485](https://github.com/mikro-orm/mikro-orm/issues/7485)
- **sql:** skip redundant mapResult in QB when row is already mapped ([#7533](https://github.com/mikro-orm/mikro-orm/issues/7533)) ([1e654a9](https://github.com/mikro-orm/mikro-orm/commit/1e654a9ec5642ed172bb7bb6142bd0c8963d7b1d)), closes [#7527](https://github.com/mikro-orm/mikro-orm/issues/7527)

## [7.0.9](https://github.com/mikro-orm/mikro-orm/compare/v7.0.8...v7.0.9) (2026-04-06)

### Bug Fixes

- **sql:** fix null composite FK producing `undefined` column values in `nativeInsertMany` ([#7476](https://github.com/mikro-orm/mikro-orm/issues/7476)) ([7043886](https://github.com/mikro-orm/mikro-orm/commit/7043886ff95287eb8359a3f0a1ce24b1a4353417)), closes [#7475](https://github.com/mikro-orm/mikro-orm/issues/7475)
- **sql:** fix populate of 1:1 on TPT leaf entity with joined strategy ([#7474](https://github.com/mikro-orm/mikro-orm/issues/7474)) ([053881c](https://github.com/mikro-orm/mikro-orm/commit/053881cf6a3fdaffd8ac7af7cc8ab58115e6604e)), closes [#7469](https://github.com/mikro-orm/mikro-orm/issues/7469)
- **sql:** skip relation props without fieldNames in TPT column mapping ([#7472](https://github.com/mikro-orm/mikro-orm/issues/7472)) ([b63d6ba](https://github.com/mikro-orm/mikro-orm/commit/b63d6ba72841a31390569a4eb193b8558c85e071)), closes [#7471](https://github.com/mikro-orm/mikro-orm/issues/7471)

## [7.0.8](https://github.com/mikro-orm/mikro-orm/compare/v7.0.7...v7.0.8) (2026-04-01)

### Bug Fixes

- **sql:** use pivot entity schema for wildcard check in M:N joins ([#7466](https://github.com/mikro-orm/mikro-orm/issues/7466)) ([cd0d47d](https://github.com/mikro-orm/mikro-orm/commit/cd0d47d012947e1872877ec97544c104110f3ca6))

## [7.0.7](https://github.com/mikro-orm/mikro-orm/compare/v7.0.6...v7.0.7) (2026-03-31)

### Bug Fixes

- **mssql:** use equality conditions for composite PK batch updates ([#7442](https://github.com/mikro-orm/mikro-orm/issues/7442)) ([ba4063b](https://github.com/mikro-orm/mikro-orm/commit/ba4063bffdfc7ea3e5495b2235f7778d6b1abf06))
- **sql:** fix count queries with composite PKs and toMany joins ([#7415](https://github.com/mikro-orm/mikro-orm/issues/7415)) ([bb0d66c](https://github.com/mikro-orm/mikro-orm/commit/bb0d66cf41bbff7ed9cefe37b4e3d3f4f945a5a5)), closes [#7414](https://github.com/mikro-orm/mikro-orm/issues/7414)
- **sql:** fix nativeEnumName schema handling with config-level schema ([#7435](https://github.com/mikro-orm/mikro-orm/issues/7435)) ([2ddd288](https://github.com/mikro-orm/mikro-orm/commit/2ddd28839662412fce2ab4a4c0cb054ade0fdba3)), closes [#7432](https://github.com/mikro-orm/mikro-orm/issues/7432)
- **sql:** generate indexes for materialized view entities ([#7419](https://github.com/mikro-orm/mikro-orm/issues/7419)) ([bf86941](https://github.com/mikro-orm/mikro-orm/commit/bf86941e27b75e23cf69bd5d51df88fd2e585ccc)), closes [#7417](https://github.com/mikro-orm/mikro-orm/issues/7417)
- **sql:** infer Kysely table names for classes extending `defineEntity().class` ([#7425](https://github.com/mikro-orm/mikro-orm/issues/7425)) ([469a667](https://github.com/mikro-orm/mikro-orm/commit/469a66720157ea3dd1564d0502f3e9dae097b0c4)), closes [#7423](https://github.com/mikro-orm/mikro-orm/issues/7423)
- **sql:** pass transaction context through schema introspection to avoid deadlock ([#7426](https://github.com/mikro-orm/mikro-orm/issues/7426)) ([2a1bc05](https://github.com/mikro-orm/mikro-orm/commit/2a1bc05452cd34361bcef8d8f0a1cc110bd6cf72)), closes [#7424](https://github.com/mikro-orm/mikro-orm/issues/7424)
- **sql:** resolve alias placeholder in raw fragments used as operator values ([#7427](https://github.com/mikro-orm/mikro-orm/issues/7427)) ([d23d30b](https://github.com/mikro-orm/mikro-orm/commit/d23d30b172cf3a5574e40744f3d1499dc5e0427b)), closes [#7422](https://github.com/mikro-orm/mikro-orm/issues/7422)

## [7.0.6](https://github.com/mikro-orm/mikro-orm/compare/v7.0.5...v7.0.6) (2026-03-26)

### Bug Fixes

- **schema:** escape single quotes in enum CHECK constraints ([#7396](https://github.com/mikro-orm/mikro-orm/issues/7396)) ([3656519](https://github.com/mikro-orm/mikro-orm/commit/365651984c904b7b037574facfd4c6d32a522b7f)), closes [#7395](https://github.com/mikro-orm/mikro-orm/issues/7395)

## [7.0.5](https://github.com/mikro-orm/mikro-orm/compare/v7.0.4...v7.0.5) (2026-03-23)

### Bug Fixes

- **sql:** infer FK columns for decorator entities in `getKysely` types ([#7368](https://github.com/mikro-orm/mikro-orm/issues/7368)) ([81068f3](https://github.com/mikro-orm/mikro-orm/commit/81068f34993398dc4c2be6531ec4f9e1d07b121d)), closes [#7367](https://github.com/mikro-orm/mikro-orm/issues/7367)
- **sql:** use column name mapping for decorator entities in `getKysely` types ([#7369](https://github.com/mikro-orm/mikro-orm/issues/7369)) ([d3baa56](https://github.com/mikro-orm/mikro-orm/commit/d3baa56309153c1038329b7be2d34a22abf0c31c)), closes [#7367](https://github.com/mikro-orm/mikro-orm/issues/7367)

## [7.0.4](https://github.com/mikro-orm/mikro-orm/compare/v7.0.3...v7.0.4) (2026-03-20)

### Bug Fixes

- **sql:** accept custom types in QueryBuilder operators for joined entities ([#7342](https://github.com/mikro-orm/mikro-orm/issues/7342)) ([0aaafbf](https://github.com/mikro-orm/mikro-orm/commit/0aaafbfad14678e5bb48bbd2f1a1b13497d8d013)), closes [#7341](https://github.com/mikro-orm/mikro-orm/issues/7341)
- **sql:** prune redundant joins in pagination outer query ([#7339](https://github.com/mikro-orm/mikro-orm/issues/7339)) ([48acce9](https://github.com/mikro-orm/mikro-orm/commit/48acce98eabfd8a3ca348f740e25e8d573ee2225)), closes [#6681](https://github.com/mikro-orm/mikro-orm/issues/6681)

### Features

- **postgresql:** generate check constraints for enum array columns ([#7356](https://github.com/mikro-orm/mikro-orm/issues/7356)) ([ec10597](https://github.com/mikro-orm/mikro-orm/commit/ec10597b74ea4626fffd614b50d9c6b7f4a3f184)), closes [#7352](https://github.com/mikro-orm/mikro-orm/issues/7352)

## [7.0.3](https://github.com/mikro-orm/mikro-orm/compare/v7.0.2...v7.0.3) (2026-03-18)

### Bug Fixes

- **core:** provide intellisense for `fields` hint in find options ([#7325](https://github.com/mikro-orm/mikro-orm/issues/7325)) ([4383d9b](https://github.com/mikro-orm/mikro-orm/commit/4383d9bc718483acc373637c81978dc99d689756))
- **postgres:** handle native enum arrays in non-default schemas ([#7330](https://github.com/mikro-orm/mikro-orm/issues/7330)) ([71a1014](https://github.com/mikro-orm/mikro-orm/commit/71a1014e1513f8befac65d870cf833ea93f59388)), closes [#7318](https://github.com/mikro-orm/mikro-orm/issues/7318)
- **schema:** handle SELECT \* expansion in view schema diffing ([#7313](https://github.com/mikro-orm/mikro-orm/issues/7313)) ([3a05128](https://github.com/mikro-orm/mikro-orm/commit/3a05128f8fed862e77f514f84f961ebfa85b7ce4)), closes [#7308](https://github.com/mikro-orm/mikro-orm/issues/7308)
- **sql:** convert undefined FK values to null in batch updates ([#7334](https://github.com/mikro-orm/mikro-orm/issues/7334)) ([b2240eb](https://github.com/mikro-orm/mikro-orm/commit/b2240eb93551aeb05c2da6c225abb90d53a8771a))
- **sql:** fix polymorphic relations with default filters on target entities ([#7332](https://github.com/mikro-orm/mikro-orm/issues/7332)) ([40777d2](https://github.com/mikro-orm/mikro-orm/commit/40777d251dc6b7996838daf81959778c5aa26551)), closes [#7317](https://github.com/mikro-orm/mikro-orm/issues/7317)
- **sql:** fix populating TPT relations with embeddables or custom types in child entities ([#7331](https://github.com/mikro-orm/mikro-orm/issues/7331)) ([5fc6311](https://github.com/mikro-orm/mikro-orm/commit/5fc63111ceca2822111ab1ff54606b11944a12b3)), closes [#7329](https://github.com/mikro-orm/mikro-orm/issues/7329)

## [7.0.2](https://github.com/mikro-orm/mikro-orm/compare/v7.0.1...v7.0.2) (2026-03-14)

### Bug Fixes

- **schema:** handle multiline view expressions in SQLite schema diffing ([#7294](https://github.com/mikro-orm/mikro-orm/issues/7294)) ([2a2ed10](https://github.com/mikro-orm/mikro-orm/commit/2a2ed10ecf180ec8ce97531433b5fa2524b9e1c8)), closes [#7292](https://github.com/mikro-orm/mikro-orm/issues/7292)

## [7.0.1](https://github.com/mikro-orm/mikro-orm/compare/v7.0.0...v7.0.1) (2026-03-11)

### Bug Fixes

- update peer dependency constraints to v7 and pin on release ([fbeace5](https://github.com/mikro-orm/mikro-orm/commit/fbeace54db9e8b0565fbd841a72cd5f5dee69bb7))

## [7.0.0](https://github.com/mikro-orm/mikro-orm/compare/v6.6.9...v7.0.0) (2026-03-11)

### Bug Fixes

- **query-builder:** apply `WHERE` conditions to `ORDER BY` joins in paginated queries ([128e58b](https://github.com/mikro-orm/mikro-orm/commit/128e58b50cbdde26350265604ce4337823292e3b)), closes [#6160](https://github.com/mikro-orm/mikro-orm/issues/6160)
- **schema:** disable FK checks by default only for `orm.schema.clear()` in MySQL ([c0d942d](https://github.com/mikro-orm/mikro-orm/commit/c0d942d9ee9e98a957956b3f4491af91049563a9))
- **schema:** do not ignore changes to entity level comments ([4087704](https://github.com/mikro-orm/mikro-orm/commit/4087704ef71063b6068632814fc5033a3fbf6353)), closes [#7187](https://github.com/mikro-orm/mikro-orm/issues/7187)
- **schema:** do not infer nullability of to-one relations based on `cascade` option ([56be7f3](https://github.com/mikro-orm/mikro-orm/commit/56be7f37c7d01c625423f32d1f176f7051b51df9)), closes [#6972](https://github.com/mikro-orm/mikro-orm/issues/6972)
- **sql:** always alias virtual properties in where query ([37f35af](https://github.com/mikro-orm/mikro-orm/commit/37f35af77aa1e8e3d5386401ddec0c3dabd2168b)), closes [#7196](https://github.com/mikro-orm/mikro-orm/issues/7196)
- **sql:** cross-schema JOINs no longer inherit main entity's schema ([#7250](https://github.com/mikro-orm/mikro-orm/issues/7250)) ([07852fc](https://github.com/mikro-orm/mikro-orm/commit/07852fc690d4293ad5dce112c6fa65a041be7fd9))
- **sql:** fix populating M:N relations with `pivotEntity` that uses `mapToPk: true` ([cdd8f85](https://github.com/mikro-orm/mikro-orm/commit/cdd8f85d29749d8b6a173054563883cc54e0a3c4)), closes [#7107](https://github.com/mikro-orm/mikro-orm/issues/7107)
- **sql:** handle $not operator inside relation filters ([#7226](https://github.com/mikro-orm/mikro-orm/issues/7226)) ([b002e16](https://github.com/mikro-orm/mikro-orm/commit/b002e1620c2ae064d336866bdfd8d7bc1c9ad579))
- **sql:** ignore missing tables during schema clear ([8f90f07](https://github.com/mikro-orm/mikro-orm/commit/8f90f078a249da68ef59edab931337960adc902b))
- **sql:** qualify cross-schema FK references with `dbName` on MySQL/MariaDB ([#7251](https://github.com/mikro-orm/mikro-orm/issues/7251)) ([489d2b9](https://github.com/mikro-orm/mikro-orm/commit/489d2b9de737a476c3115753537e903b8852f344))
- **sql:** skip pagination subquery and force balanced strategy for virtual entities ([e2c1287](https://github.com/mikro-orm/mikro-orm/commit/e2c12876640b458269c8d75cc2d2c8fb6748cf84)), closes [#7195](https://github.com/mikro-orm/mikro-orm/issues/7195)

### Features

- **kysely:** add `MikroKyselyPlugin` to support various ORM features with kysely ([#6998](https://github.com/mikro-orm/mikro-orm/issues/6998)) ([d01d93b](https://github.com/mikro-orm/mikro-orm/commit/d01d93b4a433e2e6662618efc575dea02b72fc5e))
- **query-builder:** add support for common table expressions (CTE) ([#7231](https://github.com/mikro-orm/mikro-orm/issues/7231)) ([ebd0d43](https://github.com/mikro-orm/mikro-orm/commit/ebd0d43bc8e6708ac262c5b840852de957f5b573))
- **schema:** add native support for advanced index features ([#7160](https://github.com/mikro-orm/mikro-orm/issues/7160)) ([a2330d2](https://github.com/mikro-orm/mikro-orm/commit/a2330d20c18a6f1416bc4b90fd26acf3b5896fea))
- **schema:** allow changing defaults for `update/deleteRule` and remove inference from `cascade` option ([#7115](https://github.com/mikro-orm/mikro-orm/issues/7115)) ([dd6a226](https://github.com/mikro-orm/mikro-orm/commit/dd6a22613c5a163f7a9f3a83dd6e9654534b59a2))
- **schema:** allow skipping views ([#7150](https://github.com/mikro-orm/mikro-orm/issues/7150)) ([be74bf9](https://github.com/mikro-orm/mikro-orm/commit/be74bf974c9defb0322a6ca7310555db0e600aac))
- **sql:** add `$elemMatch` operator for JSON array properties ([#7265](https://github.com/mikro-orm/mikro-orm/issues/7265)) ([e40a275](https://github.com/mikro-orm/mikro-orm/commit/e40a2753b619d53f77a8cbaaca2855d23f24ba8d))
- **sql:** improve `QueryBuilder` type safety with context-aware types ([#7138](https://github.com/mikro-orm/mikro-orm/issues/7138)) ([631e351](https://github.com/mikro-orm/mikro-orm/commit/631e351e7b557ff0f0f1111f68137caf34c2b36e))
- **sql:** infer Database for kysely ([#6939](https://github.com/mikro-orm/mikro-orm/issues/6939)) ([8f8ada5](https://github.com/mikro-orm/mikro-orm/commit/8f8ada5b0b1e91b055da3e9a9fc5476323919fe8))
- **sql:** replace knex with kysely ([#6400](https://github.com/mikro-orm/mikro-orm/issues/6400)) ([2a0384e](https://github.com/mikro-orm/mikro-orm/commit/2a0384ec8883ea1a292698dbd08a5266384096c1))
- **sql:** replace knex with native implementation of query and schema building ([#6358](https://github.com/mikro-orm/mikro-orm/issues/6358)) ([c8471ca](https://github.com/mikro-orm/mikro-orm/commit/c8471caa3c5964a81be9ea753971fe50e01bdce0))
- **sql:** strictly type `SelectQueryBuilder.execute()` return type ([#7200](https://github.com/mikro-orm/mikro-orm/issues/7200)) ([1e15042](https://github.com/mikro-orm/mikro-orm/commit/1e150422fbcd6718b00ac524c76a39c5825be96e))
- **sql:** support aliasing formula and regular properties in `QueryBuilder` select ([#7190](https://github.com/mikro-orm/mikro-orm/issues/7190)) ([6d8da38](https://github.com/mikro-orm/mikro-orm/commit/6d8da3887dde91ca2f15cf1fc7395cfc2848319e))
- **sql:** support UNION-based where clauses as index-friendly alternative to `$or` ([#7214](https://github.com/mikro-orm/mikro-orm/issues/7214)) ([1e8a674](https://github.com/mikro-orm/mikro-orm/commit/1e8a6745cf8bc4e2a6ccd2b33fd705365166ba5c))
- **sql:** transparent querying of embedded array properties ([#7264](https://github.com/mikro-orm/mikro-orm/issues/7264)) ([c9f13bb](https://github.com/mikro-orm/mikro-orm/commit/c9f13bb76b606158f7623edb46f7495b91196b54))
