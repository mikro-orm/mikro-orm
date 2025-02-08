---
title: Quick Start
---

In this guide, you will learn how to quickly bootstrap a simple project using MikroORM. For a deeper dive, check out the [Getting Started guide](./guide) which follows.

> If you prefer to take a peek at an existing project, there are [several example repositories](./examples) available.

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

# for libsql/turso
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

For CLI to be able to access your database, you will need to create a configuration file that exports your ORM configuration(s).

By default, the following paths, relative to the current working directory, are searched in this order:

1. `./src/mikro-orm.config.ts`
2. `./mikro-orm.config.ts`
3. `./dist/mikro-orm.config.js`
4. `./build/mikro-orm.config.js`
5. `./src/mikro-orm.config.js`
6. `./mikro-orm.config.js`

You can set up array of possible paths to ORM config files in `package.json`. The `package.json` file can be located in the current working directory, or in one of its parent folders.

```json title="./package.json"
{
  "name": "your-app",
  "dependencies": { ... },
  "mikro-orm": {
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

MikroORM will always try to load the first available config file, based on the order in `configPaths`. When you have `useTsNode` explicitly disabled or `ts-node` is not already registered nor detected, TS config files will be ignored.

You can also specify the config path via `--config` option:

```sh
$ npx mikro-orm debug --config ./my-config.ts
```

Since v6.3, the CLI will always try to use TS config file, even without explicitly enabling it via `useTsNode` flag in your `package.json` file. You can still use it to disable the TS support explicitly. Keep in mind that having `ts-node` installed is still required for the TS support to work. The `useTsNode` has effect only on the CLI.

Your configuration file may export multiple configuration objects in an array. The different configurations must have a `contextName` in them. If no `contextName` is specified, it is treated as the name "default". You can use the `MIKRO_ORM_CONTEXT_NAME` environment variable or the `--contextName` command line option to pick a configuration with a particular `contextName` to use for the CLI. See [below](#configuration-file-structure) for details on the config object.

All available commands are listed in the CLI help:

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
      --config       Set path to the ORM configuration file              [array]
      --contextName  Set name of config to load out of the ORM configuration
                     file. Used when config file exports an array or a function
                                                   [string] [default: "default"]
  -v, --version      Show version number                               [boolean]
  -h, --help         Show help                                         [boolean]

Examples:
  mikro-orm schema:update --run  Runs schema synchronization
```

To verify your setup, you can use `mikro-orm debug` command.

## Running MikroORM.init() without arguments

When a CLI config is properly set up, you can omit the `options` parameter when calling `MikroORM.init()` in your app. The configuration is loaded similarly to how it is loaded when using the MikroORM CLI.

The `--config` flag from the command line will be respected also when you run your app (as long as it is part of `process.argv`), not just when you use the CLI.

```sh
$ node ./dist/index.js --config ./my-orm-config.js
```

This might introduce a conflict with other tools like `jest` that also support overriding the config path via `--config` argument. In those cases you can use the `MIKRO_ORM_CONFIG_ARG_NAME` environment variable to change the argument name to something other than `config`:

```sh
$ MIKRO_ORM_CONFIG_ARG_NAME=mikro-orm-config \
  node ./dist/index.js --mikro-orm-config ./my-orm-config.js
```

> `jest` does not allow unrecognised parameters, to run tests with a custom configuration you can use this together with `MIKRO_ORM_CLI_CONFIG` environment variable to point to a test config.

:::warning

Currently, `process.argv` is automatically analyzed for backwards compatibility. This is deprecated and will be removed in v7. Using `--config` with the MikroORM CLI will still be available. If you want your application to analyze `process.argv`, you can manually do so, and then load the ORM config and explicitly specify it to `MikroORM.init()`.

:::

By default, TS config files are not considered when running your app, unless you run it via `ts-node`. You can use the `alwaysAllowTs` option in your `package.json` file, which will enable checking the TS files even if `ts-node` is not used, as well as in the MikroORM CLI. This can be handy if you run your app via [Bun](https://bun.sh).

Note that automatically loading the config file out of the config paths may fail if you use bundlers that use tree shaking. As the config file is not referenced anywhere statically, it would not be compiled - for that the best approach is to provide the config explicitly:

```ts
import config from './mikro-orm.config';
const orm = await MikroORM.init(config);
```

## Configuration file structure

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

You can also export array of different configs for different purposes. For example, you may export one config object for CLI, and another for your app. Each config in the array needs to have a distinct `contextName` value (omitting it is same as setting it to "default"), like so:

```ts
import { defineConfig } from '@mikro-orm/postgresql';

export default [
  defineConfig({
    contextName: 'default',
    entities: [Author, Book, BookTag],
    dbName: 'my-db-name',
    user: 'app',
    // other credentials and settings
  }),
  defineConfig({
    contextName: 'super',
    entities: [Author, Book, BookTag],
    dbName: 'my-db-name',
    user: 'admin',
    // other credentials and settings
  }),
];
```

Which in turn enables you to run `MikroORM.init()` in your app without arguments (and connect with the user "app"), while in CLI (where you may need higher privileges), you can use
```sh
$ npx mikro-orm --contextName=super
```

You can also export a function, which will be called with a `contextName`, and can give a configuration object for that name, or otherwise return nothing if you wish to error on that name instead. This can be particularly useful in multi-tenant setups.

For example, if you have

```ts
import { defineConfig } from '@mikro-orm/postgresql';

export default (contextName: string) => defineConfig({
  entities: [Author, Book, BookTag],
  dbName: `tenant_${contextName}`,
  user: 'app',
  // other credentials and settings
});
```

then you will need to start your app with the `MIKRO_ORM_CONTEXT_NAME` environment variable set to `example1` to load the database `tenant_example1`, and similarly, when running CLI, you can use

```sh
$ npx mikro-orm --contextName=example1
```

to operate on that particular tenant's database instance. Not specifying either option will point you to the "tenant_default" database.

You can also combine arrays and factory functions. Array members will be preferred, and any functions in the array will be executed from top to bottom. The first function to return an object will be what ends up being used.

For example, you can have in your config file

```ts
import { defineConfig } from '@mikro-orm/postgresql';

export default [
  defineConfig({
    contextName: 'default',
    entities: [Author, Book, BookTag],
    dbName: 'demo',
    user: 'app',
    // other credentials and settings
  }),
  defineConfig({
    contextName: 'super',
    entities: [Author, Book, BookTag],
    dbName: 'demo',
    user: 'admin',
    // other credentials and settings
  }),
  (contextName: string) => {
    if (!contextName.startsWith('use:')) {
        return;
    }
    return defineConfig({
      contextName,
      entities: [Author, Book, BookTag],
      dbName: `tenant_${contextName.split(':', 2)[1]}`,
      user: 'app',
      // other credentials and settings
    });
  },
  (contextName: string) => {
    if (!contextName.startsWith('edit:')) {
      return;
    }
    return defineConfig({
      contextName,
      entities: [Author, Book, BookTag],
      dbName: `tenant_${contextName.split(':', 2)[1]}`,
      user: 'admin',
      // other credentials and settings
    });
  }
];
```

which will let you run the "demo" database with "app" user whenever you do not specify `MIKRO_ORM_CONTEXT_NAME` or the `--contextName` option in CLI. Specifying "super" for the name will run the "demo" database with the "admin" user, specifying "use:example1" will load the "tenant_example1" database with the "app" user, and specifying "edit:example1" will load the "tenant_example1" database with the "admin" user.
