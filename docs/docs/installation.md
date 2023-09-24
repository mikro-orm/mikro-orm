---
title: Installation & Usage
---

First install the module via `yarn` or `npm` and do not forget to install the driver package as well:

> Since v4, we should install the driver package, but not the db connector itself, e.g. install `@mikro-orm/sqlite`, but not `sqlite3` as that is already included in the driver package.

```sh
yarn add @mikro-orm/core @mikro-orm/mongodb     # for mongo
yarn add @mikro-orm/core @mikro-orm/mysql       # for mysql/mariadb
yarn add @mikro-orm/core @mikro-orm/mariadb     # for mysql/mariadb
yarn add @mikro-orm/core @mikro-orm/postgresql  # for postgresql
yarn add @mikro-orm/core @mikro-orm/sqlite      # for sqlite
```

or

```sh
npm i -s @mikro-orm/core @mikro-orm/mongodb     # for mongo
npm i -s @mikro-orm/core @mikro-orm/mysql       # for mysql/mariadb
npm i -s @mikro-orm/core @mikro-orm/mariadb     # for mysql/mariadb
npm i -s @mikro-orm/core @mikro-orm/postgresql  # for postgresql
npm i -s @mikro-orm/core @mikro-orm/sqlite      # for sqlite
```

Next we will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) as well as `esModuleInterop` in `tsconfig.json` via:

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true,
```

Then call `MikroORM.init` as part of bootstrapping our app:

> To access driver specific methods like `em.createQueryBuilder()` we need to specify the driver type when calling `MikroORM.init<D>()`. Alternatively we can cast the `orm.em` to `EntityManager` exported from the driver package:
>
> ```ts
> import { EntityManager } from '@mikro-orm/postgresql';
> const em = orm.em as EntityManager;
> const qb = em.createQueryBuilder(...);
> ```

```ts
import type { PostgreSqlDriver } from '@mikro-orm/postgresql'; // or any other driver package

const orm = await MikroORM.init<PostgreSqlDriver>({
  entities: ['./dist/entities'], // path to our JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/entities'], // path to our TS entities (src), relative to `baseDir`
  dbName: 'my-db-name',
  type: 'postgresql',
});
console.log(orm.em); // access EntityManager via `em` property
```

> Read more about all the possible configuration options in [Advanced Configuration](configuration.md) section.

We can also provide paths where we store our entities via `entities` array. Internally it uses [`globby`](https://github.com/sindresorhus/globby) so we can use [globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns), including negative globs.

```ts
const orm = await MikroORM.init<PostgreSqlDriver>({
  entities: ['./dist/app/**/entities'],
  entitiesTs: ['./src/app/**/entities'],
  // ...
});
```

If we are experiencing problems with folder based discovery, try using `mikro-orm debug` CLI command to check what paths are actually being used.

> Since v4, we can also use file globs, like `./dist/app/**/entities/*.entity.js`.

We can also set the configuration via [environment variables](configuration.md#using-environment-variables).

> We can pass additional options to the underlying driver (e.g. `mysql2`) via `driverOptions`. The object will be deeply merged, overriding all internally used options.

## Possible issues with circular dependencies

Our entities will most probably contain circular dependencies (e.g. if we use bi-directional relationship). While this is fine, there might be issues caused by wrong order of entities during discovery, especially when we are using the folder based way.

The errors caused by circular dependencies are usually similar to this one:

```
TypeError: Cannot read property 'name' of undefined
    at Function.className (/path/to/project/node_modules/mikro-orm/dist/utils/Utils.js:253:28)
    at TsMorphMetadataProvider.extractType (/path/to/project/node_modules/mikro-orm/dist/metadata/TsMorphMetadataProvider.js:37:34)
    at TsMorphMetadataProvider.initProperties (/path/to/project/node_modules/mikro-orm/dist/metadata/TsMorphMetadataProvider.js:25:31)
    at TsMorphMetadataProvider.loadEntityMetadata (/path/to/project/node_modules/mikro-orm/dist/metadata/TsMorphMetadataProvider.js:16:9)
    at MetadataDiscovery.discoverEntity (/path/to/project/node_modules/mikro-orm/dist/metadata/MetadataDiscovery.js:109:9)
    at MetadataDiscovery.discoverDirectory (/path/to/project/node_modules/mikro-orm/dist/metadata/MetadataDiscovery.js:80:13)
    at Function.runSerial (/path/to/project/node_modules/mikro-orm/dist/utils/Utils.js:303:22)
    at MetadataDiscovery.findEntities (/path/to/project/node_modules/mikro-orm/dist/metadata/MetadataDiscovery.js:56:13)
    at MetadataDiscovery.discover (/path/to/project/node_modules/mikro-orm/dist/metadata/MetadataDiscovery.js:30:9)
    at Function.init (/path/to/project/node_modules/mikro-orm/dist/MikroORM.js:45:24)
    at Function.handleSchemaCommand (/path/to/project/node_modules/mikro-orm/dist/cli/SchemaCommandFactory.js:51:21)
```

If we encounter this, we have basically two options:

- Use entity references in `entities` array to have control over the order of discovery. We might need to play with the actual order we provide here, or possibly with the order of import statements.
- Use strings instead of references (e.g. `@OneToMany('Book', 'author')`). The downside here is that we will lose the typechecking capabilities of the decorators.

## Entity Discovery in TypeScript

In v4 the default metadata provider is `ReflectMetadataProvider`. If we want to use `ts-morph` based discovery (that reads actual TS types via the compiler API), we need to install `@mikro-orm/reflection`.

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
  entities: ['./dist/entities/**/*.js'], // path to our JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/entities/**/*.ts'], // path to our TS entities (source), relative to `baseDir`
  // ...
});
```

> It is important that `entities` will point to the compiled JS files, and `entitiesTs` will point to the TS source files. We should not mix those.

> For `ts-morph` discovery to work in production, we need to deploy `.d.ts` declaration files. Be sure to enable `compilerOptions.declaration` in our `tsconfig.json`.

We can also use different [metadata provider](metadata-providers.md) or even write custom one:

- `ReflectMetadataProvider` that uses `reflect-metadata` instead of `ts-morph`
- `JavaScriptMetadataProvider` that allows us to manually provide the entity schema (mainly for Vanilla JS)

> Using [`EntitySchema`](entity-schema.md) is another way to define our entities, which is better suited than using `JavaScriptMetadataProvider`.

```ts
const orm = await MikroORM.init<PostgreSqlDriver>({
  // default in v4, so not needed to specify explicitly
  metadataProvider: ReflectMetadataProvider,
  // ...
});
```

## Request Context

Then we will need to fork Entity Manager for each request so their identity maps will not collide. To do so, we can use the `RequestContext` helper:

```ts
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> If the `next` handler needs to be awaited (like in Koa), use `RequestContext.createAsync()` instead.
>
> ```ts
> app.use((ctx, next) => RequestContext.createAsync(orm.em, next));
> ```

More info about `RequestContext` is described [here](identity-map.md#request-context).

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

> Note: When importing a dump file we need `multipleStatements: true` in our configuration. Please check the configuration documentation for more information.

Now we can start [defining our entities](defining-entities.md).
