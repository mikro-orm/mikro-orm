---
layout: homepage
title: MikroORM v2.7
hide_title: true
---

[![NPM version](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm) [![Chat on slack](https://img.shields.io/badge/chat-on%20slack-blue.svg)](https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LTBmZDNlODBhYjcxNGZlMTkyYzJmODAwMDhjODc0ZTM2MzQ2Y2VkOGM0ODYzYTJjMDRiZDdjMmIxYjI2OTY0Y2U) [![Downloads](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm) [![Coverage Status](https://img.shields.io/coveralls/mikro-orm/mikro-orm.svg)](https://coveralls.io/r/mikro-orm/mikro-orm?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/27999651d3adc47cfa40/maintainability)](https://codeclimate.com/github/mikro-orm/mikro-orm/maintainability) [![Dependency Status](https://david-dm.org/mikro-orm/mikro-orm.svg)](https://david-dm.org/mikro-orm/mikro-orm) [![Build Status](https://github.com/mikro-orm/mikro-orm/workflows/tests/badge.svg?branch=master)](https://github.com/mikro-orm/mikro-orm/actions?workflow=tests)

MikroORM is TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns.

Currently it supports MongoDB, MySQL, PostgreSQL and SQLite databases, but more can be supported via custom drivers right now. It has first class TypeScript support, while staying back compatible with Vanilla JavaScript.

> Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Nextras Orm](https://nextras.org/orm/).

## Table of contents

- Overview
  - [Installation & Usage](installation.md)
  - [Defining entities](defining-entities.md)
  - [Persisting, cascading and fetching entities with `EntityManager`](entity-manager.md)
  - [Using `EntityRepository` instead of `EntityManager`](repositories.md)
- Fundamentals
  - [Identity Map and Request Context](identity-map.md)
  - [Entity references](entity-references.md)
  - [Using entity constructors](entity-constructors.md)
  - [Collections](collections.md)
  - [Unit of Work](unit-of-work.md)
  - [Transactions](transactions.md)
  - [Cascading persist and remove](cascading.md)
- Advanced features
  - [Smart nested populate](nested-populate.md)
  - [Smart query conditions](query-conditions.md)
  - [Using `QueryBuilder`](query-builder.md)
  - [Serializing](serializing.md)
  - [Updating entity values with `IEntity.assign()`](entity-helper.md)
  - [Property validation](property-validation.md)
  - [Lifecycle hooks](lifecycle-hooks.md)
  - [Naming strategy](naming-strategy.md)
  - [Metadata cache](metadata-cache.md)
  - [Debugging](debugging.md)
  - [Schema generator](schema-generator.md)
- Usage with different drivers
  - [Usage with Postgres, MySQL and SQLite](usage-with-sql.md)
  - [Usage with MongoDB](usage-with-mongo.md)
- Recipes
  - [Usage with NestJS](usage-with-nestjs.md)
  - [Usage with Vanilla JS](usage-with-js.md)
  - [Creating custom driver](custom-driver.md)
- Example integrations
  - [Express + MongoDB + TypeScript](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-ts)
  - [Nest + MySQL + TypeScript](https://github.com/mikro-orm/mikro-orm-examples/tree/master/nest)
  - [Express + MongoDB + JavaScript](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-js)
