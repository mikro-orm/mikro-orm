---
title: Installation & Usage
---

First install the module via `yarn` or `npm` and do not forget to install the 
driver package as well:

> Since v4, you should install the driver package, but not the db connector itself,
> e.g. install `@mikro-orm/sqlite`, but not `sqlite3` as that is already included
> in the driver package.

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

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
as well as `esModuleInterop` in `tsconfig.json` via:

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true,
"esModuleInterop": true,
```

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  type: 'mongo', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
  clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
});
console.log(orm.em); // access EntityManager via `em` property
```

> Read more about all the possible configuration options in [Advanced Configuration](configuration.md) section.

We can also provide paths where you store your entities via `entities` array. Internally
it uses [`globby`](https://github.com/sindresorhus/globby) so we can use 
[globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns), 
including negative globs. 

```typescript
const orm = await MikroORM.init({
  entities: ['./dist/app/**/entities'],
  // ...
});
```

If you are experiencing problems with folder based discovery, try using `mikro-orm debug`
CLI command to check what paths are actually being used.

> Since v4, you can also use file globs, like `./dist/app/**/entities/*.entity.js`.

> You can pass additional options to the underlying driver (e.g. `mysql2`) via `driverOptions`. 
> The object will be deeply merged, overriding all internally used options.

## Possible issues with circular dependencies

Your entities will most probably contain circular dependencies (e.g. if you use bi-directional 
relationship). While this is fine, there might be issues caused by wrong order of entities 
during discovery, especially when you are using the folder based way.

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

If you encounter this, you have basically two options:

- Use entity references in `entities` array to have control over the order of discovery. 
  You might need to play with the actual order you provide here, or possibly with the 
  order of import statements.
- Use strings instead of references (e.g. `@OneToMany('Book', 'author')`). The downside 
  here is that you will lose the typechecking capabilities of the decorators. 

## Entity Discovery in TypeScript

In v4 the default metadata provider is `ReflectMetadataProvider`. If you want to use
`ts-morph` based discovery (that reads actual TS types via the compiler API), you 
need to install `@mikro-orm/reflection`.

```typescript
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const orm = await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  // ...
});
```

Read more about the differences in [Metadata Providers section](metadata-providers.md).

```typescript
const orm = await MikroORM.init({
  entities: ['./dist/entities/**/*.js'], // path to your JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/entities/**/*.ts'], // path to your TS entities (source), relative to `baseDir`
  // ...
});
```

> It is important that `entities` will point to the compiled JS files, and `entitiesTs`
> will point to the TS source files. You should not mix those. 

> For `ts-morph` discovery to work in production, we need to deploy `.d.ts` declaration
> files. Be sure to enable `compilerOptions.declaration` in your `tsconfig.json`.

You can also use different [metadata provider](metadata-providers.md) or even write custom one:

- `ReflectMetadataProvider` that uses `reflect-metadata` instead of `ts-morph`
- `JavaScriptMetadataProvider` that allows you to manually provide the entity schema (mainly for Vanilla JS)

> Using [`EntitySchema`](entity-schema.md) is another way to define your entities, which is better
> suited than using `JavaScriptMetadataProvider`.

```typescript
const orm = await MikroORM.init({
  // default in v4, so not needed to specify explicitly
  metadataProvider: ReflectMetadataProvider,
  // ...
});
```

## Request Context

Then you will need to fork Entity Manager for each request so their identity maps will not 
collide. To do so, use the `RequestContext` helper:

```typescript
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

> If the `next` handler needs to be awaited (like in Koa), 
> use `RequestContext.createAsync()` instead.
>
> ```typescript
> app.use((ctx, next) => RequestContext.createAsync(orm.em, next));
> ```

More info about `RequestContext` is described [here](identity-map.md#request-context).

## Setting up the Commandline Tool

MikroORM ships with a number of command line tools that are very helpful during development, 
like `SchemaGenerator` and `EntityGenerator`. You can call this command from the NPM binary 
directory or use `npx`:

> To work with the CLI, first install `@mikro-orm/cli` package locally.

```sh
# manually
$ node node_modules/.bin/mikro-orm

# via npx
$ npx mikro-orm

# or via yarn
$ yarn mikro-orm
```

For CLI to be able to access your database, you will need to create `mikro-orm.config.js` file that 
exports your ORM configuration. TypeScript is also supported, just enable `useTsNode` flag in your
`package.json` file. There you can also set up array of possible paths to `mikro-orm.config` file,
as well as use different file name:

> Do not forget to install `ts-node` when enabling `useTsNode` flag.

> The `useTsNode` is used only when executing the CLI, it is not respected when
> running your app.

MikroORM will always try to load the first available config file, based on the 
order in `configPaths`. This means that if you specify the first item as the TS 
config, but you do not have `ts-node` enabled and installed, it will fail to 
load it.

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

```typescript title="./src/mikro-orm.config.ts"
export default {
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  type: 'mongo', // one of `mongo` | `mysql` | `mariadb` | `postgresql` | `sqlite`
};
```

When we have `useTsNode` disabled and `ts-node` is not already registered and detected,
TS config files will be ignored.

Once you have the CLI config properly set up, you can omit the `MikroORM.init()` options
parameter, and the CLI config will be automatically used. This process may fail if you
use bundlers that use tree shaking. As the config file is not referenced anywhere
statically, it would not be compiled - for that the best approach is to provide the config
explicitly:

```ts
import config from './mikro-orm.config';
const orm = await MikroORM.init(config);
```

> You can also use different names for this file, simply rename it in the `configPaths` array
> your in `package.json`. You can also use `MIKRO_ORM_CLI` environment variable with the path
> to override `configPaths` value.

Now you should be able to start using the CLI. All available commands are listed in the CLI help:

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

To verify your setup, you can use `mikro-orm debug` command.

> When you have CLI config properly set up, you can omit the `options` parameter
> when calling `MikroORM.init()`.

> Note: When importing a dump file you need `multipleStatements: true` in your
> configuration. Please check the configuartion documentation for more information.

Now you can start [defining your entities](defining-entities.md).
