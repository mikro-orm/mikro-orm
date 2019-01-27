# mikro-orm

Simple typescript ORM for node.js based on data-mapper, unit-of-work and identity-map patterns. Supports MongoDB,
MySQL and SQLite databases. 

Heavily inspired by [doctrine](https://www.doctrine-project.org/).

[![](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/B4nan/mikro-orm.svg)](https://david-dm.org/B4nan/mikro-orm)
[![Build Status](https://travis-ci.com/B4nan/mikro-orm.svg?branch=master)](https://travis-ci.com/B4nan/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/B4nan/mikro-orm.svg)](https://coveralls.io/r/B4nan/mikro-orm?branch=master)

## Table of contents

- Overview
  - [Installation & Usage](installation.md)
  - [Defining entities](defining-entities.md)
  - [Persisting, cascading and fetching entities with `EntityManager`](entity-manager.md)
  - [Using `EntityRepository` instead of `EntityManager`](repositories.md)
- Fundamentals
  - [Identity Map](identity-map.md)
  - [Entity references](entity-references.md)
  - [Using entity constructors](using-entity-constructors.md)
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
