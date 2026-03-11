# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.0.1](https://github.com/mikro-orm/mikro-orm/compare/v7.0.0...v7.0.1) (2026-03-11)


### Bug Fixes

* update peer dependency constraints to v7 and pin on release ([fbeace5](https://github.com/mikro-orm/mikro-orm/commit/fbeace54db9e8b0565fbd841a72cd5f5dee69bb7))





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
