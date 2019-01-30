Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Nextras Orm](https://nextras.org/orm/).

[![NPM version](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Chat on slack](https://img.shields.io/badge/chat-on%20slack-blue.svg)](https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LTBmZDNlODBhYjcxNGZlMTkyYzJmODAwMDhjODc0ZTM2MzQ2Y2VkOGM0ODYzYTJjMDRiZDdjMmIxYjI2OTY0Y2U)
[![Downloads](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/B4nan/mikro-orm.svg)](https://david-dm.org/B4nan/mikro-orm)
[![Build Status](https://travis-ci.com/B4nan/mikro-orm.svg?branch=master)](https://travis-ci.com/B4nan/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/B4nan/mikro-orm.svg)](https://coveralls.io/r/B4nan/mikro-orm?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4fc24bb70323474180b67bc14838c416)](https://app.codacy.com/app/B4nan/mikro-orm?utm_source=github.com&utm_medium=referral&utm_content=B4nan/mikro-orm&utm_campaign=Badge_Grade_Settings)

## Table of contents

- Overview
  - [Installation & Usage](installation.md)
  - [Defining entities](defining-entities.md)
  - [Persisting, cascading and fetching entities with `EntityManager`](entity-manager.md)
  - [Using `EntityRepository` instead of `EntityManager`](repositories.md)
- Fundamentals
  - [Identity Map](identity-map.md)
  - [Entity references](entity-references.md)
  - [Using entity constructors](entity-constructors.md)
  - [Collections](collections.md)
- Advanced features
  - [Smart nested populate](nested-populate.md)
  - [Updating entity values with `IEntity.assign()`](entity-helper.md)
  - [Property validation](property-validation.md)
  - [Lifecycle hooks](lifecycle-hooks.md)
  - [Naming strategy](naming-strategy.md)
- Usage with different drivers
  - [Usage with MySQL and SQLite](usage-with-sql.md)
  - [Usage with MongoDB](usage-with-mongo.md)
- Recipes
  - [Usage with NestJS](usage-with-nestjs.md)
