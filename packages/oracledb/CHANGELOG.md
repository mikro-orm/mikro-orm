# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.1.3](https://github.com/mikro-orm/mikro-orm/compare/v7.1.2...v7.1.3) (2026-05-31)

**Note:** Version bump only for package @mikro-orm/oracledb





## [7.1.2](https://github.com/mikro-orm/mikro-orm/compare/v7.1.1...v7.1.2) (2026-05-29)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.1.1](https://github.com/mikro-orm/mikro-orm/compare/v7.1.0...v7.1.1) (2026-05-22)

**Note:** Version bump only for package @mikro-orm/oracledb

# [7.1.0](https://github.com/mikro-orm/mikro-orm/compare/v7.0.17...v7.1.0) (2026-05-20)

### Features

- **cli:** add `discovery:export` command ([#7335](https://github.com/mikro-orm/mikro-orm/issues/7335)) ([e38f5c4](https://github.com/mikro-orm/mikro-orm/commit/e38f5c4a10c8bef488a5236e8061c50605f97ad3)), closes [#7323](https://github.com/mikro-orm/mikro-orm/issues/7323) [#7323](https://github.com/mikro-orm/mikro-orm/issues/7323)
- **cli:** emit typed `EntityManager` alias from `discovery:export` ([#7756](https://github.com/mikro-orm/mikro-orm/issues/7756)) ([fd06439](https://github.com/mikro-orm/mikro-orm/commit/fd064396bd6e6b941204a0a62133cbe6b9f9bbfe))
- **core:** add `where` option for partial indexes and unique constraints ([#7593](https://github.com/mikro-orm/mikro-orm/issues/7593)) ([78d00e3](https://github.com/mikro-orm/mikro-orm/commit/78d00e3530d68001b875d3bf1be62a0d70bc822d))
- **core:** add column-level `collation` support for SQL drivers ([#7615](https://github.com/mikro-orm/mikro-orm/issues/7615)) ([12e3a73](https://github.com/mikro-orm/mikro-orm/commit/12e3a7321085ca974244d1c847f6f71e075c8ad8)), closes [#4286](https://github.com/mikro-orm/mikro-orm/issues/4286)
- **core:** support stored procedures and functions ([#7693](https://github.com/mikro-orm/mikro-orm/issues/7693)) ([9bbbb8b](https://github.com/mikro-orm/mikro-orm/commit/9bbbb8b3f9e0bbcd9e1da9150fb9565f012ea210)), closes [#5253](https://github.com/mikro-orm/mikro-orm/issues/5253)
- **migrations:** support runtime schema context ([#7597](https://github.com/mikro-orm/mikro-orm/issues/7597)) ([9b00229](https://github.com/mikro-orm/mikro-orm/commit/9b00229a36ccc9dcc857434ec8a39ceafd274ab8)), closes [#3319](https://github.com/mikro-orm/mikro-orm/issues/3319) [#4928](https://github.com/mikro-orm/mikro-orm/issues/4928)

## [7.0.17](https://github.com/mikro-orm/mikro-orm/compare/v7.0.16...v7.0.17) (2026-05-17)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.16](https://github.com/mikro-orm/mikro-orm/compare/v7.0.15...v7.0.16) (2026-05-14)

### Bug Fixes

- **schema:** centralize identifier-length truncation across platforms ([#7706](https://github.com/mikro-orm/mikro-orm/issues/7706)) ([1987833](https://github.com/mikro-orm/mikro-orm/commit/1987833d79285c9d9b5623e0c0a388b790bd39ff))

## [7.0.15](https://github.com/mikro-orm/mikro-orm/compare/v7.0.14...v7.0.15) (2026-05-09)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.14](https://github.com/mikro-orm/mikro-orm/compare/v7.0.13...v7.0.14) (2026-05-04)

### Bug Fixes

- **core:** escape JSON path keys in getSearchJsonPropertyKey ([#7656](https://github.com/mikro-orm/mikro-orm/issues/7656)) ([556d339](https://github.com/mikro-orm/mikro-orm/commit/556d3396b977705cec05d051ceef8c570c6e7d71))

### Features

- **sql:** add `MikroORM` and `defineConfig` variants in `@mikro-orm/sql` ([#7647](https://github.com/mikro-orm/mikro-orm/issues/7647)) ([ce31ff4](https://github.com/mikro-orm/mikro-orm/commit/ce31ff449901fe84274ee8e1eaa32c71ad99c93d))

## [7.0.13](https://github.com/mikro-orm/mikro-orm/compare/v7.0.12...v7.0.13) (2026-04-27)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.12](https://github.com/mikro-orm/mikro-orm/compare/v7.0.11...v7.0.12) (2026-04-23)

### Bug Fixes

- **mysql:** resolve password callback per-connection for short-lived tokens ([#7577](https://github.com/mikro-orm/mikro-orm/issues/7577)) ([9b9fe2d](https://github.com/mikro-orm/mikro-orm/commit/9b9fe2d2781a0177129e995a4ab433b9b00a5dd1)), closes [#7576](https://github.com/mikro-orm/mikro-orm/issues/7576)

## [7.0.11](https://github.com/mikro-orm/mikro-orm/compare/v7.0.10...v7.0.11) (2026-04-16)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.10](https://github.com/mikro-orm/mikro-orm/compare/v7.0.9...v7.0.10) (2026-04-10)

### Bug Fixes

- **core:** brand raw query fragments via prototype property ([#7519](https://github.com/mikro-orm/mikro-orm/issues/7519)) ([f596bdd](https://github.com/mikro-orm/mikro-orm/commit/f596bdd77f6de6edd2c27c5a293af8c6cf0f2b9f)), closes [#7518](https://github.com/mikro-orm/mikro-orm/issues/7518)

## [7.0.9](https://github.com/mikro-orm/mikro-orm/compare/v7.0.8...v7.0.9) (2026-04-06)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.8](https://github.com/mikro-orm/mikro-orm/compare/v7.0.7...v7.0.8) (2026-04-01)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.7](https://github.com/mikro-orm/mikro-orm/compare/v7.0.6...v7.0.7) (2026-03-31)

### Bug Fixes

- **sql:** pass transaction context through schema introspection to avoid deadlock ([#7426](https://github.com/mikro-orm/mikro-orm/issues/7426)) ([2a1bc05](https://github.com/mikro-orm/mikro-orm/commit/2a1bc05452cd34361bcef8d8f0a1cc110bd6cf72)), closes [#7424](https://github.com/mikro-orm/mikro-orm/issues/7424)

## [7.0.6](https://github.com/mikro-orm/mikro-orm/compare/v7.0.5...v7.0.6) (2026-03-26)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.5](https://github.com/mikro-orm/mikro-orm/compare/v7.0.4...v7.0.5) (2026-03-23)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.4](https://github.com/mikro-orm/mikro-orm/compare/v7.0.3...v7.0.4) (2026-03-20)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.3](https://github.com/mikro-orm/mikro-orm/compare/v7.0.2...v7.0.3) (2026-03-18)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.2](https://github.com/mikro-orm/mikro-orm/compare/v7.0.1...v7.0.2) (2026-03-14)

**Note:** Version bump only for package @mikro-orm/oracledb

## [7.0.1](https://github.com/mikro-orm/mikro-orm/compare/v7.0.0...v7.0.1) (2026-03-11)

### Bug Fixes

- update peer dependency constraints to v7 and pin on release ([fbeace5](https://github.com/mikro-orm/mikro-orm/commit/fbeace54db9e8b0565fbd841a72cd5f5dee69bb7))

## [7.0.0](https://github.com/mikro-orm/mikro-orm/compare/v6.6.9...v7.0.0) (2026-03-11)

### Features

- **oracle:** add Oracle DB driver ([#6704](https://github.com/mikro-orm/mikro-orm/issues/6704)) ([ef140af](https://github.com/mikro-orm/mikro-orm/commit/ef140afca122e801243a1b890278dffa3a49d483))
