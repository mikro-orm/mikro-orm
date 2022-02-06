# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/mikro-orm/mikro-orm/compare/v4.5.3...v5.0.0) (2022-02-06)


### Features

* **core:** add `persistOnCreate` option and enable it for seeder ([f0fec1b](https://github.com/mikro-orm/mikro-orm/commit/f0fec1b917a228869482bf781d256ab68c0b138c)), closes [#2629](https://github.com/mikro-orm/mikro-orm/issues/2629)
* **core:** make `em.create()` respect required properties ([2385f1d](https://github.com/mikro-orm/mikro-orm/commit/2385f1d18b1b5235750fc5f29b4d51fe04aca7b8))
* **seeder:** add seeder package ([#929](https://github.com/mikro-orm/mikro-orm/issues/929)) ([2b86e22](https://github.com/mikro-orm/mikro-orm/commit/2b86e22eb061060ee2c67a85741b99c1ddcac9c0)), closes [#251](https://github.com/mikro-orm/mikro-orm/issues/251)


### BREAKING CHANGES

* **core:** `em.create()` will now require you to pass all non-optional properties. Some properties
might be defined as required for TS but we have a default value for them (either runtime,
or database one) - for such we can use `OptionalProps` symbol to specify which properties
should be considered as optional.
