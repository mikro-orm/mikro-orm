---
title: Quick Start
---

In this guide, you will learn how to quickly bootstrap a simple project using MikroORM. For a deeper dive, check out
the [Getting Started guide](./guide) which follows.

## Installation

First install the module via package manager of your choice. Do not forget to install the database driver as well:

```bash npm2yarn
# for mongodb
npm install @mikro-orm/core @mikro-orm/mongodb;

# for mysql (works with mariadb too)
npm install @mikro-orm/core @mikro-orm/mysql;  

# for mariadb (works with mysql too)
npm install @mikro-orm/core @mikro-orm/mariadb;

# for postgresql (works with cockroachdb too)
npm install @mikro-orm/core @mikro-orm/postgresql;  

# for sqlite
npm install @mikro-orm/core @mikro-orm/sqlite; 

# for better-sqlite
npm install @mikro-orm/core @mikro-orm/better-sqlite; 
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) as
well as `esModuleInterop` in `tsconfig.json` via:

> The decorators are opt-in, if you use a different way to define your entity metadata like `EntitySchema`, you don't
> need to enable them.

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

> To access driver specific methods like `em.createQueryBuilder()` you need to import
> the `MikroORM`/`EntityManager`/`EntityRepository` class from the driver package. Alternatively you can cast the `orm.em`
> to `EntityManager` exported from the driver package:
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

You can also provide paths where we store our entities via `entities` array. Internally it
uses [`globby`](https://github.com/sindresorhus/globby) so we can
use [globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns), including negative globs.

```ts
const orm = await MikroORM.init({
  entities: ['./dist/app/**/*.entity.js'],
  entitiesTs: ['./src/app/**/*.entity.ts'],
  // ...
});
```

If you are experiencing problems with folder based discovery, try using `mikro-orm debug` CLI command to check what
paths are actually being used.

## Entity Discovery in TypeScript

In v4 the default metadata provider is `ReflectMetadataProvider`. If you want to use `ts-morph` based discovery (that reads actual TS types via the compiler API), you need to install `@mikro-orm/reflection`.

```ts
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const orm = await MikroORM.init<PostgreSqlDriver>({
  metadataProvider: TsMorphMetadataProvider,
  // ...
});
```

Read more about the differences in [Metadata Providers section](metadata-providers.md).

```ts
const orm = await MikroORM.init<PostgreSqlDriver>({
  entities: ['./dist/entities/**/*.js'], // path to your JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/entities/**/*.ts'], // path to your TS entities (source), relative to `baseDir`
  // ...
});
```

> It is important that `entities` will point to the compiled JS files, and `entitiesTs` will point to the TS source files. We should not mix those.

> For `ts-morph` discovery to work in production, you need to deploy `.d.ts` declaration files. Be sure to enable `compilerOptions.declaration` in your `tsconfig.json`.

We can also use different [metadata provider](metadata-providers.md) or even write custom one:

- `ReflectMetadataProvider` that uses `reflect-metadata` instead of `ts-morph`
- `JavaScriptMetadataProvider` that allows you to manually provide the entity schema (mainly for Vanilla JS)

> Using [`EntitySchema`](entity-schema.md) is another way to define your entities, which is better suited than using `JavaScriptMetadataProvider`.

```ts
const orm = await MikroORM.init<PostgreSqlDriver>({
  // default in v4, so not needed to specify explicitly
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

More information can be found in [defining entities section](https://mikro-orm.io/defining-entities/) in docs.

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
await em.persistAndFlush([book1, book2, book3]);
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

MikroORM ships with a number of command line tools that are very helpful during development, like `SchemaGenerator` and `EntityGenerator`. We can call this command from the NPM binary directory or use `npx`:

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

For CLI to be able to access our database, we will need to create `mikro-orm.config.js` file that exports our ORM configuration.

> ORM configuration file can export the Promise, like: `export default Promise.resolve({...});`.

TypeScript is also supported, just enable `useTsNode` flag in our `package.json` file. By default, when `useTsNode` is not enabled, CLI will ignore `.ts` files, so if you want to out-out of this behaviour, enable the `alwaysAllowTs` option. This would be useful if you want to use MikroORM with [Bun](https://bun.sh), which has TypeScript support out of the box. There we can also set up array of possible paths to `mikro-orm.config` file, as well as use different file name. The `package.json` file can be located in the current working directory, or in one of its parent folders.

You can use these environment variables to override the CLI settings:

- `MIKRO_ORM_CLI`: the path to ORM config file
- `MIKRO_ORM_CLI_USE_TS_NODE`: register ts-node
- `MIKRO_ORM_CLI_TS_CONFIG_PATH`: path to the tsconfig.json (for ts-node)
- `MIKRO_ORM_CLI_ALWAYS_ALLOW_TS`: enable `.ts` files to use without ts-node

Alternatively, you can also specify the config path via `--config` option:

```sh
$ npx mikro-orm debug --config ./my-config.ts
```

This option will be respected also when you run your app, not just when you use the CLI.

> Do not forget to install `ts-node` when enabling `useTsNode` flag.

> The `useTsNode` is used only when executing the CLI, it is not respected when running our app.

MikroORM will always try to load the first available config file, based on the order in `configPaths`. This means that if we specify the first item as the TS config, but we do not have `ts-node` enabled and installed, it will fail to load it.

```json title="./package.json"
{
  "name": "our-app",
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

```ts title="./src/mikro-orm.config.ts"
export default {
  entities: [Author, Book, BookTag], // no need for `entitiesTs` this way
  dbName: 'my-db-name',
  type: 'mongo', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
};
```

To have the config type-safe, we can define the options variable first, with the `Options` type:

```ts
import { Options } from '@mikro-orm/core';

const config: Options = {
  // ...
};

export default config;
```

Alternatively, we can use the `defineConfig` helper that should provide intellisense even in JavaScript files, without the need for type hints via jsdoc:

```ts
import { defineConfig } from '@mikro-orm/core';

export default defineConfig({
  // ...
});
```

When we have `useTsNode` disabled and `ts-node` is not already registered and detected, TS config files will be ignored.

Once we have the CLI config properly set up, we can omit the `MikroORM.init()` options parameter, and the CLI config will be automatically used. This process may fail if we use bundlers that use tree shaking. As the config file is not referenced anywhere statically, it would not be compiled - for that the best approach is to provide the config explicitly:

```ts
import config from './mikro-orm.config';
const orm = await MikroORM.init(config);
```

> We can also use different names for this file, simply rename it in the `configPaths` array our in `package.json`. We can also use `MIKRO_ORM_CLI` environment variable with the path to override `configPaths` value.

Now we should be able to start using the CLI. All available commands are listed in the CLI help:

```sh
Usage: mikro-orm <command> [options]

Commands:
  mikro-orm cache:clear             Clear metadata cache
  mikro-orm cache:generate          Generate metadata cache for production
  mikro-orm generate-entities       Generate entities based on current database
                                    schema
  mikro-orm database:import <file>  Imports the SQL file to the database
  mikro-orm schema:create           Create database schema based on current
                                    metadata
  mikro-orm schema:drop             Drop database schema based on current
                                    metadata
  mikro-orm schema:update           Update database schema based on current
                                    metadata
  mikro-orm migration:create        Create new migration with current schema
                                    diff
  mikro-orm migration:up            Migrate up to the latest version
  mikro-orm migration:down          Migrate one step down
  mikro-orm migration:list          List all executed migrations
  mikro-orm migration:pending       List all pending migrations
  mikro-orm debug                   Debug CLI configuration

Options:
  -v, --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  mikro-orm schema:update --run  Runs schema synchronization
```

To verify our setup, we can use `mikro-orm debug` command.

> When we have CLI config properly set up, we can omit the `options` parameter when calling `MikroORM.init()`.
