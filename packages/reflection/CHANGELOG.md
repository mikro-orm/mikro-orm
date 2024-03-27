# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.1.12](https://github.com/mikro-orm/mikro-orm/compare/v6.1.11...v6.1.12) (2024-03-24)


### Bug Fixes

* **reflection:** fallback to not proving path to tsconfig if not found ([a24d80d](https://github.com/mikro-orm/mikro-orm/commit/a24d80dc3353a6a84c9c6f1ac26b3c7e3e824901))





## [6.1.11](https://github.com/mikro-orm/mikro-orm/compare/v6.1.10...v6.1.11) (2024-03-18)


### Bug Fixes

* **reflection:** respect custom tsconfig options ([e8cfdc0](https://github.com/mikro-orm/mikro-orm/commit/e8cfdc04cb5beed30f3ce144d7d57ee6d95e0c60))





## [6.1.10](https://github.com/mikro-orm/mikro-orm/compare/v6.1.9...v6.1.10) (2024-03-14)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.9](https://github.com/mikro-orm/mikro-orm/compare/v6.1.8...v6.1.9) (2024-03-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.8](https://github.com/mikro-orm/mikro-orm/compare/v6.1.7...v6.1.8) (2024-03-06)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.7](https://github.com/mikro-orm/mikro-orm/compare/v6.1.6...v6.1.7) (2024-03-04)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.6](https://github.com/mikro-orm/mikro-orm/compare/v6.1.5...v6.1.6) (2024-02-28)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.5](https://github.com/mikro-orm/mikro-orm/compare/v6.1.4...v6.1.5) (2024-02-21)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.4](https://github.com/mikro-orm/mikro-orm/compare/v6.1.3...v6.1.4) (2024-02-16)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.3](https://github.com/mikro-orm/mikro-orm/compare/v6.1.2...v6.1.3) (2024-02-13)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.2](https://github.com/mikro-orm/mikro-orm/compare/v6.1.1...v6.1.2) (2024-02-11)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.1.1](https://github.com/mikro-orm/mikro-orm/compare/v6.1.0...v6.1.1) (2024-02-10)


### Bug Fixes

* **reflection:** only validate known types to allow using type aliases ([d6b93be](https://github.com/mikro-orm/mikro-orm/commit/d6b93bee537e3e1b05756fda39c9bc320c93d4c1)), closes [#5221](https://github.com/mikro-orm/mikro-orm/issues/5221)





# [6.1.0](https://github.com/mikro-orm/mikro-orm/compare/v6.0.7...v6.1.0) (2024-02-04)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.0.7](https://github.com/mikro-orm/mikro-orm/compare/v6.0.6...v6.0.7) (2024-01-30)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.0.6](https://github.com/mikro-orm/mikro-orm/compare/v6.0.5...v6.0.6) (2024-01-29)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.0.5](https://github.com/mikro-orm/mikro-orm/compare/v6.0.4...v6.0.5) (2024-01-18)


### Bug Fixes

* **reflection:** improve detection of `Ref` types with FK as PK ([c8858d2](https://github.com/mikro-orm/mikro-orm/commit/c8858d225f514957fc13591bb8806dbba2227e45)), closes [#5144](https://github.com/mikro-orm/mikro-orm/issues/5144)





## [6.0.4](https://github.com/mikro-orm/mikro-orm/compare/v6.0.3...v6.0.4) (2024-01-15)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.0.3](https://github.com/mikro-orm/mikro-orm/compare/v6.0.2...v6.0.3) (2024-01-13)

**Note:** Version bump only for package @mikro-orm/reflection





## [6.0.2](https://github.com/mikro-orm/mikro-orm/compare/v6.0.1...v6.0.2) (2024-01-09)


### Bug Fixes

* **reflection:** fix processing of `Opt` and `Hidden` types when used in intersection ([2bd612e](https://github.com/mikro-orm/mikro-orm/commit/2bd612ec70d73bf7f5e6e5d70e2c7259e8d9c90b))





## [6.0.1](https://github.com/mikro-orm/mikro-orm/compare/v6.0.0...v6.0.1) (2024-01-08)

**Note:** Version bump only for package @mikro-orm/reflection





# [6.0.0](https://github.com/mikro-orm/mikro-orm/compare/v5.9.7...v6.0.0) (2024-01-08)


### Bug Fixes

* **core:** refactor mapping of `Date` properties ([#4391](https://github.com/mikro-orm/mikro-orm/issues/4391)) ([3a80369](https://github.com/mikro-orm/mikro-orm/commit/3a8036928ce36d31a2005b7e5133cf825b84a1b5)), closes [#4362](https://github.com/mikro-orm/mikro-orm/issues/4362) [#4360](https://github.com/mikro-orm/mikro-orm/issues/4360) [#1476](https://github.com/mikro-orm/mikro-orm/issues/1476)


### Features

* **core:** add `MikroORM.initSync()` helper ([#4166](https://github.com/mikro-orm/mikro-orm/issues/4166)) ([8b1a1fa](https://github.com/mikro-orm/mikro-orm/commit/8b1a1fa324db9227f5caae35fb2d8ab6a2b76e8a)), closes [#4164](https://github.com/mikro-orm/mikro-orm/issues/4164)
* **core:** add `sql.now()`, `sql.lower()` and `sql.upper()` functions ([#5044](https://github.com/mikro-orm/mikro-orm/issues/5044)) ([016fe63](https://github.com/mikro-orm/mikro-orm/commit/016fe63e0e0db448a31da00c4690fc5c5ae59069))





## [5.9.2](https://github.com/mikro-orm/mikro-orm/compare/v5.9.1...v5.9.2) (2023-11-02)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.9.1](https://github.com/mikro-orm/mikro-orm/compare/v5.9.0...v5.9.1) (2023-10-31)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.9.0](https://github.com/mikro-orm/mikro-orm/compare/v5.8.10...v5.9.0) (2023-10-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.10](https://github.com/mikro-orm/mikro-orm/compare/v5.8.9...v5.8.10) (2023-10-18)


### Bug Fixes

* **reflection:** ensure complete stripping of relative paths with multiple leading slashes ([#4844](https://github.com/mikro-orm/mikro-orm/issues/4844)) ([8a635c7](https://github.com/mikro-orm/mikro-orm/commit/8a635c79d8939251545f02f3e569a0589c64f33a))





## [5.8.9](https://github.com/mikro-orm/mikro-orm/compare/v5.8.8...v5.8.9) (2023-10-15)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.8](https://github.com/mikro-orm/mikro-orm/compare/v5.8.7...v5.8.8) (2023-10-11)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.7](https://github.com/mikro-orm/mikro-orm/compare/v5.8.6...v5.8.7) (2023-10-05)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.6](https://github.com/mikro-orm/mikro-orm/compare/v5.8.5...v5.8.6) (2023-10-02)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.5](https://github.com/mikro-orm/mikro-orm/compare/v5.8.4...v5.8.5) (2023-09-30)


### Bug Fixes

* **core:** pin all internal dependencies ([f4868ed](https://github.com/mikro-orm/mikro-orm/commit/f4868edec97457e7c4548d887fb3ba23cf266c59)), closes [#4764](https://github.com/mikro-orm/mikro-orm/issues/4764)
* **reflection:** detect JSON properties defined with `Record` or `Dictionary` types ([62740d1](https://github.com/mikro-orm/mikro-orm/commit/62740d187e16c2d22140ec5649c19af6964951f8)), closes [#4755](https://github.com/mikro-orm/mikro-orm/issues/4755)





## [5.8.4](https://github.com/mikro-orm/mikro-orm/compare/v5.8.3...v5.8.4) (2023-09-27)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.3](https://github.com/mikro-orm/mikro-orm/compare/v5.8.2...v5.8.3) (2023-09-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.2](https://github.com/mikro-orm/mikro-orm/compare/v5.8.1...v5.8.2) (2023-09-20)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.8.1](https://github.com/mikro-orm/mikro-orm/compare/v5.8.0...v5.8.1) (2023-09-12)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.8.0](https://github.com/mikro-orm/mikro-orm/compare/v5.7.14...v5.8.0) (2023-09-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.14](https://github.com/mikro-orm/mikro-orm/compare/v5.7.13...v5.7.14) (2023-07-27)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.13](https://github.com/mikro-orm/mikro-orm/compare/v5.7.12...v5.7.13) (2023-07-16)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.12](https://github.com/mikro-orm/mikro-orm/compare/v5.7.11...v5.7.12) (2023-06-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.11](https://github.com/mikro-orm/mikro-orm/compare/v5.7.10...v5.7.11) (2023-06-01)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.10](https://github.com/mikro-orm/mikro-orm/compare/v5.7.9...v5.7.10) (2023-05-23)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.9](https://github.com/mikro-orm/mikro-orm/compare/v5.7.8...v5.7.9) (2023-05-22)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.8](https://github.com/mikro-orm/mikro-orm/compare/v5.7.7...v5.7.8) (2023-05-21)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.7](https://github.com/mikro-orm/mikro-orm/compare/v5.7.6...v5.7.7) (2023-05-14)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.6](https://github.com/mikro-orm/mikro-orm/compare/v5.7.5...v5.7.6) (2023-05-13)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.5](https://github.com/mikro-orm/mikro-orm/compare/v5.7.4...v5.7.5) (2023-05-09)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.4](https://github.com/mikro-orm/mikro-orm/compare/v5.7.3...v5.7.4) (2023-05-01)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.3](https://github.com/mikro-orm/mikro-orm/compare/v5.7.2...v5.7.3) (2023-04-28)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.2](https://github.com/mikro-orm/mikro-orm/compare/v5.7.1...v5.7.2) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.7.1](https://github.com/mikro-orm/mikro-orm/compare/v5.7.0...v5.7.1) (2023-04-25)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.7.0](https://github.com/mikro-orm/mikro-orm/compare/v5.6.16...v5.7.0) (2023-04-23)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.16](https://github.com/mikro-orm/mikro-orm/compare/v5.6.15...v5.6.16) (2023-04-04)


### Reverts

* Revert "chore(release): v5.6.16 [skip ci]" ([49faac9](https://github.com/mikro-orm/mikro-orm/commit/49faac95c86d4c65fb6f66f76efa98ba221dd67e))





## [5.6.15](https://github.com/mikro-orm/mikro-orm/compare/v5.6.14...v5.6.15) (2023-03-18)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.14](https://github.com/mikro-orm/mikro-orm/compare/v5.6.13...v5.6.14) (2023-03-12)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.13](https://github.com/mikro-orm/mikro-orm/compare/v5.6.12...v5.6.13) (2023-03-01)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.12](https://github.com/mikro-orm/mikro-orm/compare/v5.6.11...v5.6.12) (2023-02-26)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.11](https://github.com/mikro-orm/mikro-orm/compare/v5.6.10...v5.6.11) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.10](https://github.com/mikro-orm/mikro-orm/compare/v5.6.9...v5.6.10) (2023-02-17)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.9](https://github.com/mikro-orm/mikro-orm/compare/v5.6.8...v5.6.9) (2023-02-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.8](https://github.com/mikro-orm/mikro-orm/compare/v5.6.7...v5.6.8) (2023-01-25)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.7](https://github.com/mikro-orm/mikro-orm/compare/v5.6.6...v5.6.7) (2023-01-13)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.6](https://github.com/mikro-orm/mikro-orm/compare/v5.6.5...v5.6.6) (2023-01-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.5](https://github.com/mikro-orm/mikro-orm/compare/v5.6.4...v5.6.5) (2023-01-09)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.4](https://github.com/mikro-orm/mikro-orm/compare/v5.6.3...v5.6.4) (2023-01-04)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.3](https://github.com/mikro-orm/mikro-orm/compare/v5.6.2...v5.6.3) (2022-12-28)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.2](https://github.com/mikro-orm/mikro-orm/compare/v5.6.1...v5.6.2) (2022-12-25)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.6.1](https://github.com/mikro-orm/mikro-orm/compare/v5.6.0...v5.6.1) (2022-12-20)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.6.0](https://github.com/mikro-orm/mikro-orm/compare/v5.5.3...v5.6.0) (2022-12-09)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.5.3](https://github.com/mikro-orm/mikro-orm/compare/v5.5.2...v5.5.3) (2022-11-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.5.2](https://github.com/mikro-orm/mikro-orm/compare/v5.5.1...v5.5.2) (2022-11-07)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.5.1](https://github.com/mikro-orm/mikro-orm/compare/v5.5.0...v5.5.1) (2022-11-05)


### Bug Fixes

* **reflection:** fix reflection of embedded array types ([786ba42](https://github.com/mikro-orm/mikro-orm/commit/786ba4281b12ebe089394ec64b32653bfaae5013)), closes [#3690](https://github.com/mikro-orm/mikro-orm/issues/3690)
* **reflection:** improve detection of array properties ([8f8f820](https://github.com/mikro-orm/mikro-orm/commit/8f8f820ca6e60937e4da82825f9afba9087459ee)), closes [#3690](https://github.com/mikro-orm/mikro-orm/issues/3690)





# [5.5.0](https://github.com/mikro-orm/mikro-orm/compare/v5.4.2...v5.5.0) (2022-10-23)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.4.2](https://github.com/mikro-orm/mikro-orm/compare/v5.4.1...v5.4.2) (2022-09-12)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.4.1](https://github.com/mikro-orm/mikro-orm/compare/v5.4.0...v5.4.1) (2022-09-08)


### Bug Fixes

* **core:** change internal dependencies to use `~` instead of `^` ([fdbf67c](https://github.com/mikro-orm/mikro-orm/commit/fdbf67c53055a6a4b455208dec3b815736a55e3b)), closes [#3468](https://github.com/mikro-orm/mikro-orm/issues/3468)
* **reflection:** fix inference of nullability ([5f57ee1](https://github.com/mikro-orm/mikro-orm/commit/5f57ee1c8b15940d208c0d3b84955561b38f9889)), closes [#3447](https://github.com/mikro-orm/mikro-orm/issues/3447)





# [5.4.0](https://github.com/mikro-orm/mikro-orm/compare/v5.3.1...v5.4.0) (2022-09-01)


### Bug Fixes

* **reflection:** do not override user defined `nullable` attribute ([75a6487](https://github.com/mikro-orm/mikro-orm/commit/75a6487cc45eefd5ca7e4bd530b0522222e632ee))
* **reflection:** fix array property type inference ([4a69871](https://github.com/mikro-orm/mikro-orm/commit/4a6987127c3fd487d9b4c4b1db597fac17a41fd8))





## [5.3.1](https://github.com/mikro-orm/mikro-orm/compare/v5.3.0...v5.3.1) (2022-08-04)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.3.0](https://github.com/mikro-orm/mikro-orm/compare/v5.2.4...v5.3.0) (2022-08-01)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.2.4](https://github.com/mikro-orm/mikro-orm/compare/v5.2.3...v5.2.4) (2022-07-25)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.2.3](https://github.com/mikro-orm/mikro-orm/compare/v5.2.2...v5.2.3) (2022-07-08)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.2.2](https://github.com/mikro-orm/mikro-orm/compare/v5.2.1...v5.2.2) (2022-07-03)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.2.1](https://github.com/mikro-orm/mikro-orm/compare/v5.2.0...v5.2.1) (2022-06-21)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.2.0](https://github.com/mikro-orm/mikro-orm/compare/v5.1.5...v5.2.0) (2022-06-10)


### Bug Fixes

* **ts-morph:** use module: 'node16' for reflection ([024d9d9](https://github.com/mikro-orm/mikro-orm/commit/024d9d997728b91c7530280ccf4f49bf154a4330)), closes [#3168](https://github.com/mikro-orm/mikro-orm/issues/3168)
* typing detection with typescript 4.7 node16 ([#3163](https://github.com/mikro-orm/mikro-orm/issues/3163)) ([08322fa](https://github.com/mikro-orm/mikro-orm/commit/08322fa90112534629e4d2327991519e0b3e01c4))





## [5.1.5](https://github.com/mikro-orm/mikro-orm/compare/v5.1.4...v5.1.5) (2022-05-29)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.1.4](https://github.com/mikro-orm/mikro-orm/compare/v5.1.3...v5.1.4) (2022-05-19)


### Bug Fixes

* **ts-morph:** do not mark properties as enums automatically based on type ([c3923df](https://github.com/mikro-orm/mikro-orm/commit/c3923dffd98d651abef4008d1078b512540b80f0)), closes [#3099](https://github.com/mikro-orm/mikro-orm/issues/3099)





## [5.1.3](https://github.com/mikro-orm/mikro-orm/compare/v5.1.2...v5.1.3) (2022-04-27)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.1.2](https://github.com/mikro-orm/mikro-orm/compare/v5.1.1...v5.1.2) (2022-04-10)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.1.1](https://github.com/mikro-orm/mikro-orm/compare/v5.1.0...v5.1.1) (2022-03-20)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.1.0](https://github.com/mikro-orm/mikro-orm/compare/v5.0.5...v5.1.0) (2022-03-13)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.0.5](https://github.com/mikro-orm/mikro-orm/compare/v5.0.4...v5.0.5) (2022-02-27)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.0.4](https://github.com/mikro-orm/mikro-orm/compare/v5.0.3...v5.0.4) (2022-02-22)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.0.3](https://github.com/mikro-orm/mikro-orm/compare/v5.0.2...v5.0.3) (2022-02-20)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.0.2](https://github.com/mikro-orm/mikro-orm/compare/v5.0.1...v5.0.2) (2022-02-16)

**Note:** Version bump only for package @mikro-orm/reflection





## [5.0.1](https://github.com/mikro-orm/mikro-orm/compare/v5.0.0...v5.0.1) (2022-02-13)

**Note:** Version bump only for package @mikro-orm/reflection





# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Bug Fixes

* **core:** rehydrate custom types when using metadata cache ([3bcb9a5](https://github.com/mikro-orm/mikro-orm/commit/3bcb9a52d1bcfd2596826603f2e090b7c8baddf9)), closes [#2489](https://github.com/mikro-orm/mikro-orm/issues/2489)
* **reflection:** relative paths not stripped completely ([#2164](https://github.com/mikro-orm/mikro-orm/issues/2164)) ([ab3f1c6](https://github.com/mikro-orm/mikro-orm/commit/ab3f1c648d8d1210230f1c0068673bc6563114fe))
* **reflection:** support virtual method properties ([0c82179](https://github.com/mikro-orm/mikro-orm/commit/0c8217951ebc65e2b1e7ad4d331d04416699a30d))
* **ts-morph:** fix validation of embedded polymorphic arrays ([b6a068a](https://github.com/mikro-orm/mikro-orm/commit/b6a068ae16c5bb9355c7544b7480e89923fa6560))


### Features

* **core:** add support for ESM via `gen-esm-wrapper` ([aa71065](https://github.com/mikro-orm/mikro-orm/commit/aa71065d0727920db7da9bfdecdb33e6b8165cb5)), closes [#1010](https://github.com/mikro-orm/mikro-orm/issues/1010)
* **core:** validate version mismatch in ORM packages ([cf70219](https://github.com/mikro-orm/mikro-orm/commit/cf702195e2dd0dce4d66da26f1d349dddf05b007))





## [4.5.10](https://github.com/mikro-orm/mikro-orm/compare/v4.5.9...v4.5.10) (2021-12-26)


### Bug Fixes

* **core:** rehydrate custom types when using metadata cache ([3ea37a6](https://github.com/mikro-orm/mikro-orm/commit/3ea37a6c7cb2761630c8a89e558bba2abfb9e261)), closes [#2489](https://github.com/mikro-orm/mikro-orm/issues/2489)
* **reflection:** relative paths not stripped completely ([#2164](https://github.com/mikro-orm/mikro-orm/issues/2164)) ([cbe7503](https://github.com/mikro-orm/mikro-orm/commit/cbe7503dac2e0f2de67fb4278ebee503452f7e93))





## [4.5.9](https://github.com/mikro-orm/mikro-orm/compare/v4.5.8...v4.5.9) (2021-08-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.8](https://github.com/mikro-orm/mikro-orm/compare/v4.5.7...v4.5.8) (2021-08-24)


### Bug Fixes

* **reflection:** support virtual method properties ([3a8c344](https://github.com/mikro-orm/mikro-orm/commit/3a8c3445c6ab14ed61e25d204e13bb69a2431b1b))





## [4.5.7](https://github.com/mikro-orm/mikro-orm/compare/v4.5.6...v4.5.7) (2021-06-30)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.6](https://github.com/mikro-orm/mikro-orm/compare/v4.5.5...v4.5.6) (2021-06-06)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.5](https://github.com/mikro-orm/mikro-orm/compare/v4.5.4...v4.5.5) (2021-05-17)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.4](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v4.5.4) (2021-04-26)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.3](https://github.com/mikro-orm/mikro-orm/compare/v4.5.2...v4.5.3) (2021-04-09)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.2](https://github.com/mikro-orm/mikro-orm/compare/v4.5.1...v4.5.2) (2021-04-06)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.5.1](https://github.com/mikro-orm/mikro-orm/compare/v4.5.0...v4.5.1) (2021-03-27)

**Note:** Version bump only for package @mikro-orm/reflection





# [4.5.0](https://github.com/mikro-orm/mikro-orm/compare/v4.4.4...v4.5.0) (2021-03-21)


### Features

* **reflection:** support enum arrays and custom types ([dc65527](https://github.com/mikro-orm/mikro-orm/commit/dc65527913acd16ce4588c05deffaf3782782d83)), closes [#1497](https://github.com/mikro-orm/mikro-orm/issues/1497)





## [4.4.4](https://github.com/mikro-orm/mikro-orm/compare/v4.4.3...v4.4.4) (2021-02-21)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.4.3](https://github.com/mikro-orm/mikro-orm/compare/v4.4.2...v4.4.3) (2021-02-14)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.4.2](https://github.com/mikro-orm/mikro-orm/compare/v4.4.1...v4.4.2) (2021-02-04)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.4.1](https://github.com/mikro-orm/mikro-orm/compare/v4.4.0...v4.4.1) (2021-02-01)

**Note:** Version bump only for package @mikro-orm/reflection





# [4.4.0](https://github.com/mikro-orm/mikro-orm/compare/v4.3.4...v4.4.0) (2021-01-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.3.4](https://github.com/mikro-orm/mikro-orm/compare/v4.3.3...v4.3.4) (2020-12-11)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.3.3](https://github.com/mikro-orm/mikro-orm/compare/v4.3.2...v4.3.3) (2020-12-04)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.3.2](https://github.com/mikro-orm/mikro-orm/compare/v4.3.1...v4.3.2) (2020-11-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.3.1](https://github.com/mikro-orm/mikro-orm/compare/v4.3.0...v4.3.1) (2020-11-20)


### Bug Fixes

* **ts-morph:** fix discovery of `IdentifiedReference` with ts-morph ([d94bd91](https://github.com/mikro-orm/mikro-orm/commit/d94bd9106948d2ca583aaff9125486987ffc5243)), closes [#1088](https://github.com/mikro-orm/mikro-orm/issues/1088)





# [4.3.0](https://github.com/mikro-orm/mikro-orm/compare/v4.2.3...v4.3.0) (2020-11-13)


### Bug Fixes

* **core:** pin dependencies ([0f3a8e5](https://github.com/mikro-orm/mikro-orm/commit/0f3a8e51e4bcd5386c517b95a437721fbdda7e66)), closes [#961](https://github.com/mikro-orm/mikro-orm/issues/961)





## [4.2.3](https://github.com/mikro-orm/mikro-orm/compare/v4.2.2...v4.2.3) (2020-10-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.2.2](https://github.com/mikro-orm/mikro-orm/compare/v4.2.1...v4.2.2) (2020-10-22)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.2.1](https://github.com/mikro-orm/mikro-orm/compare/v4.2.0...v4.2.1) (2020-10-20)

**Note:** Version bump only for package @mikro-orm/reflection





# [4.2.0](https://github.com/mikro-orm/mikro-orm/compare/v4.1.1...v4.2.0) (2020-10-18)

**Note:** Version bump only for package @mikro-orm/reflection





# [4.1.0](https://github.com/mikro-orm/mikro-orm/compare/v4.0.7...v4.1.0) (2020-10-12)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.7](https://github.com/mikro-orm/mikro-orm/compare/v4.0.6...v4.0.7) (2020-09-24)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.6](https://github.com/mikro-orm/mikro-orm/compare/v4.0.5...v4.0.6) (2020-09-22)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.5](https://github.com/mikro-orm/mikro-orm/compare/v4.0.4...v4.0.5) (2020-09-21)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.4](https://github.com/mikro-orm/mikro-orm/compare/v4.0.3...v4.0.4) (2020-09-19)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.3](https://github.com/mikro-orm/mikro-orm/compare/v4.0.2...v4.0.3) (2020-09-15)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.2](https://github.com/mikro-orm/mikro-orm/compare/v4.0.1...v4.0.2) (2020-09-11)

**Note:** Version bump only for package @mikro-orm/reflection





## [4.0.1](https://github.com/mikro-orm/mikro-orm/compare/v4.0.0...v4.0.1) (2020-09-10)

**Note:** Version bump only for package @mikro-orm/reflection
