---
title: Quick Start
---

In this guide, you will learn how to quickly bootstrap a simple project using MikroORM. For a deeper dive, check out the [Getting Started guide](./guide) which follows.

## Installation

First install the module via package manager of your choice. Do not forget to install the database driver as well:

```bash npm2yarn
# for mongodb
npm install @mikro-orm/core @mikro-orm/mongodb

# for mysql (works with mariadb too)
npm install @mikro-orm/core @mikro-orm/mysql

# for mariadb (works with mysql too)
npm install @mikro-orm/core @mikro-orm/mariadb

# for postgresql (works with cockroachdb too)
npm install @mikro-orm/core @mikro-orm/postgresql

# for sqlite
npm install @mikro-orm/core @mikro-orm/sqlite

# for better-sqlite
npm install @mikro-orm/core @mikro-orm/better-sqlite

# for libsql
npm install @mikro-orm/core @mikro-orm/libsql

# for mssql
npm install @mikro-orm/core @mikro-orm/mssql
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) as well as `esModuleInterop` in `tsconfig.json` via:

> The decorators are opt-in, if you use a different way to define your entity metadata like `EntitySchema`, you don't need to enable them.

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

> To access driver specific methods like `em.createQueryBuilder()` you need to import the `MikroORM`/`EntityManager`/`EntityRepository` class from the driver package. Alternatively you can cast the `orm.em` to `EntityManager` exported from the driver package:
>
> ```ts
> import { EntityManager } from '@mikro-orm/postgresql';
> const em = orm.em as EntityManager;
> const qb = em.createQueryBuilder(...);
> ```

```ts
import { MikroORM } from '@mikro-orm/postgresql'; // or any other driver package

const orm = await MikroORM.init({
  entities: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  dbName: 'my-db-name',
});
console.log(orm.em); // access EntityManager via `em` property
```

You can read more about all the possible configuration options in [Advanced Configuration](./configuration.md) section.

## Folder-based discovery

You can also provide paths where you store your entities via `entities` array. The paths are resolved via [`globby`](https://github.com/sindresorhus/globby) internally, so you can use [globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns), including **negative globs**.

```ts
const orm = await MikroORM.init({
  entities: ['./dist/app/**/*.entity.js'],
  entitiesTs: ['./src/app/**/*.entity.ts'],
  // ...
});
```

If you are experiencing problems with folder based discovery, try using `mikro-orm debug` CLI command to check what paths are actually being used.

## Entity Discovery in TypeScript

The default metadata provider is `ReflectMetadataProvider`. If you want to use `ts-morph` based discovery (that reads actual TS types via the compiler API), you need to install `@mikro-orm/reflection` package.

```ts
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const orm = await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  // ...
});
```

Read more about the differences in [Metadata Providers section](./metadata-providers.md).

```ts
import { MikroORM } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({
  entities: ['./dist/entities/**/*.js'], // path to your JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/entities/**/*.ts'], // path to your TS entities (source), relative to `baseDir`
  // ...
});
```

> It is important that `entities` will point to the compiled JS files, and `entitiesTs` will point to the TS source files. You should not mix those.

> For `ts-morph` discovery to work in production, you need to deploy `.d.ts` declaration files. Be sure to enable `compilerOptions.declaration` in your `tsconfig.json`.

You can also use different the default [`ReflectMetadataProvider`](./metadata-providers.md#reflectmetadataprovider) or even write custom one. Using [`EntitySchema`](./entity-schema.md) is another way to define your entities and does not depend on the metadata providers at all.

```ts
import { MikroORM } from '@mikro-orm/postgresql';

const orm = await MikroORM.init({
  // default since v4, so not needed to specify explicitly
  metadataProvider: ReflectMetadataProvider,
  // ...
});
```

## Synchronous initialization

As opposed to the async `MikroORM.init` method, you can prefer to use synchronous variant `initSync`. This method has
some limitations:

- database connection will be established when you first interact with the database (or you can use `orm.connect()`
  explicitly)
- no loading of the `config` file, `options` parameter is mandatory
- no support for folder based discovery
- no check for mismatched package versions

## RequestContext helper

Now you will need to fork entity manager for each request so their [identity maps](https://mikro-orm.io/identity-map/)
will not collide. To do so, use the `RequestContext` helper:

```ts
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> You should register this middleware as the last one just before request handlers and before any of your custom
> middleware that is using the ORM. There might be issues when you register it before request processing middleware
> like `queryParser` or `bodyParser`, so definitely register the context after them.

More info about `RequestContext` is described [here](./identity-map.md#request-context).

## Entity definition

Now you can start defining your entities (in one of the `entities` folders). This is how a simple entity can look like:

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id: bigint;

  @Property()
  title: string;

  @ManyToOne(() => Author)
  author: Author;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}
```

Or if you want to use UUID primary key:

```ts title="./entities/Book.ts"
import { v4 } from 'uuid';

@Entity()
export class Book {

  @PrimaryKey({ type: 'uuid' })
  uuid = v4();

  // ...

}
```

More information can be found in [defining entities section](./defining-entities.md) in docs.

## EntityManager

When you have your entities defined, you can start using ORM either via `EntityManager`.

To save entity state to database, you need to persist it. Persist determines whether to use `insert` or `update` and
computes appropriate change-set. Entity references that are not persisted yet (does not have identifier) will be cascade
persisted automatically.

```ts
// use constructors in your entities for required parameters
const author = new Author('Jon Snow', 'snow@wall.st');
author.born = new Date();

const publisher = new Publisher('7K publisher');

const book1 = new Book('My Life on The Wall, part 1', author);
book1.publisher = publisher;
const book2 = new Book('My Life on The Wall, part 2', author);
book2.publisher = publisher;
const book3 = new Book('My Life on The Wall, part 3', author);
book3.publisher = publisher;

// just persist books, author and publisher will be automatically cascade persisted
await em.persist([book1, book2, book3]).flush();
```

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`:

```ts
const authors = em.find(Author, {});

for (const author of authors) {
  console.log(author); // instance of Author entity
  console.log(author.name); // Jon Snow

  for (const book of author.books) { // iterating books collection
    console.log(book); // instance of Book entity
    console.log(book.title); // My Life on The Wall, part 1/2/3
  }
}
```

Take a look at docs about [working with `EntityManager`](./entity-manager.md).

## Setting up the Commandline Tool

MikroORM ships with a number of command line tools that are very helpful during development, like `SchemaGenerator` and `EntityGenerator`. You can call this command from the NPM binary directory or use `npx`:

> To work with the CLI, first install `@mikro-orm/cli` package locally. The version needs to be aligned with the `@mikro-orm/core` package.

```sh
# install the CLI package first!
$ yarn add @mikro-orm/cli

# manually
$ node node_modules/.bin/mikro-orm

# via npx
$ npx mikro-orm

# or via yarn
$ yarn mikro-orm
```

For CLI to be able to access your database, you will need to create `mikro-orm.config.js` file that exports your ORM configuration.

> ORM configuration file can export the Promise, like: `export default Promise.resolve({...});`.

To enable TypeScript support, add `useTsNode` flag to the `mikro-orm` section in your `package.json` file. By default, when `useTsNode` is not enabled, CLI will ignore `.ts` files, so if you want to oup-out of this behaviour, enable the `alwaysAllowTs` option. This would be useful if you want to use MikroORM with [Bun](https://bun.sh), which has TypeScript support out of the box.

> The `useTsNode` is a flag only for the CLI, it has no effect on your application.

> Remember to install `ts-node` when enabling `useTsNode` flag.

You can also set up array of possible paths to `mikro-orm.config.*` file in the `package.json`, as well as use different file name. The `package.json` file can be located in the current working directory, or in one of its parent folders.

```json title="./package.json"
{
  "name": "your-app",
  "dependencies": { ... },
  "mikro-orm": {
    "useTsNode": true,
    "configPaths": [
      "./src/mikro-orm.config.ts",
      "./dist/mikro-orm.config.js"
    ]
  }
}
```

Another way to control these CLI-related settings is with the environment variables:

- `MIKRO_ORM_CLI_CONFIG`: the path to ORM config file
- `MIKRO_ORM_CLI_USE_TS_NODE`: register `ts-node` for TypeScript support
- `MIKRO_ORM_CLI_TS_CONFIG_PATH`: path to the tsconfig.json (for ts-node)
- `MIKRO_ORM_CLI_ALWAYS_ALLOW_TS`: enable `.ts` files to use without ts-node
- `MIKRO_ORM_CLI_VERBOSE`: enable verbose logging (e.g. print queries used in seeder or schema diffing)

Alternatively, you can also specify the config path via `--config` option:

```sh
$ npx mikro-orm debug --config ./my-config.ts
```

The `--config` flag will be respected also when you run your app (as long as it is part of `process.argv`), not just when you use the CLI. 

For the app support, this might introduce a conflict with other tools like `jest` that also support overriding the config path via `--config` argument, in those cases you can use the `MIKRO_ORM_CONFIG_ARG_NAME` environment variable to change the argument name to something else than `config`:

```sh
$ MIKRO_ORM_CONFIG_ARG_NAME=mikro-orm-config \
  npx mikro-orm debug --mikro-orm-config ./my-config.ts
```

MikroORM will always try to load the first available config file, based on the order in `configPaths`. When you have `useTsNode` disabled or `ts-node` is not already registered nor detected, TS config files will be ignored.

Preferred way of creating to the configuration object is with the `defineConfig` helper. It will provide intellisense even in JavaScript files, without the need for type hints via jsdoc:

```ts
import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  // this is inferred as you import `defineConfig` from sqlite package
  // driver: SqliteDriver,
});
```

Using `defineConfig` also automatically infers the driver option for you if you import the helper from the driver package. This means you don't have to provide the `driver` option explicitly.

Alternatively, you can use the `Options` type:

```ts title="./src/mikro-orm.config.ts"
import { Options } from '@mikro-orm/sqlite';

const config: Options = {
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  driver: SqliteDriver,
};

export default config;
```

Once you have the CLI config properly set up, you can omit the `MikroORM.init()` options parameter, and the CLI config will be automatically used. This process may fail if you use bundlers that use tree shaking. As the config file is not referenced anywhere statically, it would not be compiled - for that the best approach is to provide the config explicitly:

```ts
import config from './mikro-orm.config';
const orm = await MikroORM.init(config);
```

Now you should be able to start using the CLI. All available commands are listed in the CLI help:

```sh
$ npx mikro-orm

Usage: mikro-orm <command> [options]

Commands:
  mikro-orm cache:clear             Clear metadata cache
  mikro-orm cache:generate          Generate metadata cache
  mikro-orm generate-entities       Generate entities based on current database
                                    schema
  mikro-orm database:create         Create your database if it does not exist
  mikro-orm database:import <file>  Imports the SQL file to the database
  mikro-orm seeder:run              Seed the database using the seeder class
  mikro-orm seeder:create <seeder>  Create a new seeder class
  mikro-orm schema:create           Create database schema based on current
                                    metadata
  mikro-orm schema:drop             Drop database schema based on current
                                    metadata
  mikro-orm schema:update           Update database schema based on current
                                    metadata
  mikro-orm schema:fresh            Drop and recreate database schema based on
                                    current metadata
  mikro-orm migration:create        Create new migration with current schema
                                    diff
  mikro-orm migration:up            Migrate up to the latest version
  mikro-orm migration:down          Migrate one step down
  mikro-orm migration:list          List all executed migrations
  mikro-orm migration:check         Check if migrations are needed. Useful for
                                    bash scripts.
  mikro-orm migration:pending       List all pending migrations
  mikro-orm migration:fresh         Clear the database and rerun all migrations
  mikro-orm debug                   Debug CLI configuration

Options:
      --config   Set path to the ORM configuration file                 [string]
  -v, --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  mikro-orm schema:update --run  Runs schema synchronization
```

To verify your setup, you can use `mikro-orm debug` command.

> When you have CLI config properly set up, you can omit the `options` parameter when calling `MikroORM.init()`.
