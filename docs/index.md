---
layout: homepage
---

[![NPM version](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Chat on slack](https://img.shields.io/badge/chat-on%20slack-blue.svg)](https://join.slack.com/t/mikroorm/shared_invite/enQtNTM1ODYzMzM4MDk3LTBmZDNlODBhYjcxNGZlMTkyYzJmODAwMDhjODc0ZTM2MzQ2Y2VkOGM0ODYzYTJjMDRiZDdjMmIxYjI2OTY0Y2U)
[![Downloads](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/mikro-orm/mikro-orm.svg)](https://david-dm.org/mikro-orm/mikro-orm)
[![Build Status](https://travis-ci.com/mikro-orm/mikro-orm.svg?branch=master)](https://travis-ci.com/mikro-orm/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/mikro-orm/mikro-orm.svg)](https://coveralls.io/r/mikro-orm/mikro-orm?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/27999651d3adc47cfa40/maintainability)](https://codeclimate.com/github/mikro-orm/mikro-orm/maintainability)

MikroORM is TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns.

Currently it supports MongoDB, MySQL, MariaDB, PostgreSQL and SQLite databases, but more can be 
supported via custom drivers right now. It has first class TypeScript support, while staying back 
compatible with Vanilla JavaScript.

> Heavily inspired by [Doctrine](https://www.doctrine-project.org/) and [Nextras Orm](https://nextras.org/orm/).

## Table of contents

- Overview
  - [Installation & Usage](installation.md)
  - [Defining Entities](defining-entities.md)
  - [Persisting, Cascading and Fetching Entities with `EntityManager`](entity-manager.md)
  - [Using `EntityRepository` instead of `EntityManager`](repositories.md)
- Fundamentals
  - [Identity Map and Request Context](identity-map.md)
  - [Entity References](entity-references.md)
  - [Using Entity Constructors](entity-constructors.md)
  - [Collections](collections.md)
  - [Unit of Work](unit-of-work.md)
  - [Transactions](transactions.md)
  - [Cascading persist and remove](cascading.md)
- Advanced Features
  - [Smart Nested Populate](nested-populate.md)
  - [Smart Query Conditions](query-conditions.md)
  - [Using `QueryBuilder`](query-builder.md)
  - [Serializing](serializing.md)
  - [Updating Entity Values with `IEntity.assign()`](entity-helper.md)
  - [Better Type-safety with `Reference<T>` Wrapper](reference-wrapper.md)
  - [Property Validation](property-validation.md)
  - [Lifecycle Hooks](lifecycle-hooks.md)
  - [Naming Strategy](naming-strategy.md)
  - [Metadata Cache](metadata-cache.md)
  - [Debugging](debugging.md)
  - [Schema Generator](schema-generator.md)
  - [Entity Generator](entity-generator.md)
  - [Read Replica Connections](read-connections.md)
- Usage with Different Drivers
  - [Usage with SQL Drivers](usage-with-sql.md)
  - [Usage with MongoDB](usage-with-mongo.md)
- Recipes
  - [Usage with NestJS](usage-with-nestjs.md)
  - [Usage with Vanilla JS](usage-with-js.md)
  - [Creating Custom Driver](custom-driver.md)
  - [Using Multiple Schemas](multiple-schemas.md)
- Example Integrations
  - [Express + MongoDB + TypeScript](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-ts)
  - [Nest + MySQL + TypeScript](https://github.com/mikro-orm/mikro-orm-examples/tree/master/nest)
  - [Express + MongoDB + JavaScript](https://github.com/mikro-orm/mikro-orm-examples/tree/master/express-js)

## Articles

- Introducing MikroORM, TypeScript data-mapper ORM with Identity Map
  - on [medium.com](https://medium.com/dailyjs/introducing-mikro-orm-typescript-data-mapper-orm-with-identity-map-9ba58d049e02)
  - on [dev.to](https://dev.to/b4nan/introducing-mikroorm-typescript-data-mapper-orm-with-identity-map-pc8)
- Handling transactions and concurrency in MikroORM
  - on [medium.com](https://medium.com/dailyjs/handling-transactions-and-concurrency-in-mikro-orm-ba80d0a65805)
  - on [dev.to](https://dev.to/b4nan/handling-transactions-and-concurrency-in-mikroorm-2cfj)
