# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/better-sqlite





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)


### Bug Fixes

* **sqlite:** throw `ForeignKeyConstraintViolationException` where appropriate ([#3343](https://github.com/mikro-orm/mikro-orm/issues/3343)) ([508e262](https://github.com/mikro-orm/mikro-orm/commit/508e262abcb5302cb6831d3fab6920798a4f5477))





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)

**Note:** Version bump only for package @mikro-orm/better-sqlite





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* **core:** allow changing PK via UoW ([32ab215](https://github.com/mikro-orm/mikro-orm/commit/32ab21583d2718ab874ff71b3f13c9e6a9e5faf0)), closes [#3184](https://github.com/mikro-orm/mikro-orm/issues/3184)
* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)


### Bug Fixes

* **postgres:** do not ignore custom PK constraint names ([#2931](https://github.com/mikro-orm/mikro-orm/issues/2931)) ([24bf10e](https://github.com/mikro-orm/mikro-orm/commit/24bf10e668dd2d3b4b6cc4c52ed215fbffcc9d45))


### Features

* **schema:** support mysql 8 ([#2961](https://github.com/mikro-orm/mikro-orm/issues/2961)) ([acc960e](https://github.com/mikro-orm/mikro-orm/commit/acc960ebc694c61a959f48e89a9fee5513f6bdfa))





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)

**Note:** Version bump only for package @mikro-orm/better-sqlite





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)


### Bug Fixes

* **core:** do not alias JSON conditions on update/delete queries ([5c0674e](https://github.com/mikro-orm/mikro-orm/commit/5c0674e61d97f9b143b48ae5314e5e7d1eeb4529)), closes [#2839](https://github.com/mikro-orm/mikro-orm/issues/2839)


### Features

* **core:** map check constraint failures to specific error type ([ebcbdff](https://github.com/mikro-orm/mikro-orm/commit/ebcbdfff43cdc4069fc1c70de516493782619123)), closes [#2836](https://github.com/mikro-orm/mikro-orm/issues/2836)





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/better-sqlite





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)


### Bug Fixes

* **sqlite:** respect `autoincrement: false` in schema diffing ([b39b6ad](https://github.com/mikro-orm/mikro-orm/commit/b39b6ada0e276a21c3089558a996092174b546fc)), closes [#2800](https://github.com/mikro-orm/mikro-orm/issues/2800)


### Features

* add better-sqlite driver ([#2792](https://github.com/mikro-orm/mikro-orm/issues/2792)) ([1b39d66](https://github.com/mikro-orm/mikro-orm/commit/1b39d6687fc2db64e85a45f6a964cf1776a374aa))
