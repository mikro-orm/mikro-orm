---
title: Getting Started Guide
slug: /guide
---

## Introduction

MikroORM is a TypeScript ORM for Node.js based on Data Mapper, Unit of Work, and Identity Map patterns. In this guide, you will learn what those words mean, how to set up a simple API project, how to test it, and many more.

This Getting Started Guide was written as a step-by-step tutorial, accompanied by working StackBlitz examples and a [GitHub repository with the final project](https://github.com/mikro-orm/guide). It will show you how to create a production-ready application from scratch, all the way down to a docker image you can deploy wherever you want.

To take a peek at the final project we will be building, try cloning the [`mikro-orm/guide` GitHub project](https://github.com/mikro-orm/guide).

```bash
git clone https://github.com/mikro-orm/guide.git
```

:::info

This guide focuses on "code first" approach to developing the application, but MikroORM can also be used with a "schema first" approach. Check out [the "schema first" guide](../schema-first-guide.md) for more details on that.

:::

## The Stack

The goal of this guide is to show off the most important features of MikroORM as well as some of the more niche ones. It will walk you through creating a simple API for a blog, with the following technologies:

- [MikroORM](https://mikro-orm.io) with SQLite driver
- [Fastify](https://www.fastify.io) as the web framework
- [Vitest](https://vitest.dev) for testing
- ECMAScript modules
- JWT authentication
- reflection via [ts-morph](https://ts-morph.com)

## MikroORM monorepo

The ORM consists of several packages, the important ones we will be using:

- `@mikro-orm/core`: the main package with the ORM code
- `@mikro-orm/cli`: the CLI package, needs to be installed locally
- `@mikro-orm/sqlite`: the sqlite driver package (you can use a different driver too)
- `@mikro-orm/reflection`: to enable DRY entities with ts-morph reflection
- `@mikro-orm/migrations`: package for managing schema migrations
- `@mikro-orm/seeder`: package for seeding the database with testing data

The `core` and driver packages are required, the rest of this list is optional and can be a dev dependency if you wish. We will use the `sqlite` driver, mainly for simplicity, as it does not require any additional setup and offers a handy in-memory database, which we will use in the tests.

> There are more packages, some also live outside the `mikro-orm/mikro-orm` monorepo, such as the `@mikro-orm/nestjs` or `@mikro-orm/sql-highlighter` - unlike the ones from the monorepo, those usually have different versioning line.

:::info

Full list of currently available drivers:

- `@mikro-orm/mysql`
- `@mikro-orm/mariadb`
- `@mikro-orm/postgresql`
- `@mikro-orm/sqlite`
- `@mikro-orm/libsql`
- `@mikro-orm/mssql`
- `@mikro-orm/mongodb`

:::

## What are we building?

We already mentioned what technologies will be used, and now more about the project. It will be a simple API for a blog, with authentication, publishing, and commenting. For that, we will use four regular entities: `User`, `Article`, `Comment`, and `Tag`. Later on, we will add one more entity, `ArticleListing`, a virtual entity represented by an SQL expression rather than a database table.

And the API routes description:

| Method   | URL                      | Description                       |
|----------|--------------------------|-----------------------------------|
| `POST`   | `/user/sign-up`          | Register new user                 |
| `POST`   | `/user/sign-in`          | Login existing user               |
| `GET`    | `/user/profile`          | Get your full profile info        |
| `PATCH`  | `/user/profile`          | Modify your profile               |
| `POST`   | `/article`               | Create new article                |
| `GET`    | `/article`               | List existing articles            |
| `GET`    | `/article/:slug`         | Get article detail                |
| `PATCH`  | `/article/:slug`         | Modify existing article           |
| `DELETE` | `/article/:slug`         | Delete existing article           |
| `POST`   | `/article/:slug/comment` | Post comment for existing article |

The code will be structured into self-contained modules: `user`, `article`, and `common` (for shared helpers).

The app will be using Node.js 20, TypeScript 5.2, and we will build it using a modern stack with ECMAScript modules enabled.

## What will we cover

Here is (an incomplete) list of features you will try going through this guide.

- creating an app from scratch with TypeScript setup
- folder-based discovery, ts-morph reflection, ES modules
- request context management via middleware/fastify hook
- entity relations, advanced entity definition (e.g. lazy scalar properties)
- advanced type safety (e.g. `OptionalProps`, `Reference` wrapper and `Loaded` type)
- events, including advanced use cases like soft-delete via `onFlush` event
- basic testing via vitest
- custom repositories
- virtual entities
- serialization
- embeddables
