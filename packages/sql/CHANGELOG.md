# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [7.0.0](https://github.com/mikro-orm/mikro-orm/compare/v7.0.0-rc.3...v7.0.0) (2026-03-11)


### Bug Fixes

* **sql:** cross-schema JOINs no longer inherit main entity's schema ([#7250](https://github.com/mikro-orm/mikro-orm/issues/7250)) ([07852fc](https://github.com/mikro-orm/mikro-orm/commit/07852fc690d4293ad5dce112c6fa65a041be7fd9)), closes [#7248](https://github.com/mikro-orm/mikro-orm/issues/7248)
* **sql:** ignore missing tables during schema clear ([8f90f07](https://github.com/mikro-orm/mikro-orm/commit/8f90f078a249da68ef59edab931337960adc902b))
* **sql:** qualify cross-schema FK references with `dbName` on MySQL/MariaDB ([#7251](https://github.com/mikro-orm/mikro-orm/issues/7251)) ([489d2b9](https://github.com/mikro-orm/mikro-orm/commit/489d2b9de737a476c3115753537e903b8852f344))


### Features

* add JSR publishing support ([#7253](https://github.com/mikro-orm/mikro-orm/issues/7253)) ([c93c92a](https://github.com/mikro-orm/mikro-orm/commit/c93c92aae07d40b14a348e957cbc58926d30a714))
* **oracle:** add Oracle DB driver ([#6704](https://github.com/mikro-orm/mikro-orm/issues/6704)) ([ef140af](https://github.com/mikro-orm/mikro-orm/commit/ef140afca122e801243a1b890278dffa3a49d483))
* **sql:** add `$elemMatch` operator for JSON array properties ([#7265](https://github.com/mikro-orm/mikro-orm/issues/7265)) ([e40a275](https://github.com/mikro-orm/mikro-orm/commit/e40a2753b619d53f77a8cbaaca2855d23f24ba8d))
* **sql:** transparent querying of embedded array properties ([#7264](https://github.com/mikro-orm/mikro-orm/issues/7264)) ([c9f13bb](https://github.com/mikro-orm/mikro-orm/commit/c9f13bb76b606158f7623edb46f7495b91196b54)), closes [#1887](https://github.com/mikro-orm/mikro-orm/issues/1887)
