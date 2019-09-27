---
---

# Installation & Usage

First install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```sh
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2  # for mysql/mariadb
$ yarn add mikro-orm mariadb # for mysql/mariadb
$ yarn add mikro-orm pg      # for postgresql
$ yarn add mikro-orm sqlite3 # for sqlite
```

or

```sh
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2  # for mysql/mariadb
$ npm i -s mikro-orm mariadb # for mysql/mariadb
$ npm i -s mikro-orm pg      # for postgresql
$ npm i -s mikro-orm sqlite3 # for sqlite
```

Next you will need to enable support for [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
in `tsconfig.json` via:

```json
"experimentalDecorators": true
```

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book, BookTag],
  dbName: 'my-db-name',
  clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
  baseDir: __dirname, // defaults to `process.cwd()`
});
console.log(orm.em); // access EntityManager via `em` property
```

You can also provide paths where you store your entities via `entitiesDirs` array. Internally
it uses [`globby`](https://github.com/sindresorhus/globby) so you can use 
[globbing patterns](https://github.com/sindresorhus/globby#globbing-patterns). 

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['./dist/app/**/entities'],
  // ...
});
```

You should provide list of directories, not paths to entities directly. If you want to do that
instead, you should use `entities` array and use `globby` manually:

```typescript
import globby from 'globby';

const orm = await MikroORM.init({
  entities: await globby('./dist/app/**/entities/*.js').map(require),
  // ...
});
```

## Entity Discovery in TypeScript

Internally, `MikroORM` uses [performs analysis](metadata-cache.md) of source files of entities 
to sniff types of all properties. This process can be slow if your project contains lots of 
files. To speed up the discovery process a bit, you can provide more accurate paths where your
entity source files are: 

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['./dist/entities'], // path to your JS entities (dist), relative to `baseDir`
  entitiesDirsTs: ['./src/entities'], // path to your TS entities (source), relative to `baseDir`
  // ...
});
```

## Setting up the Commandline Tool

MikroORM ships with a number of command line tools that are very helpful during development, 
like Schema Generator and Entity Generator. You can call this command from the NPM binary 
directory or use `npx`:

```sh
$ node node_modules/.bin/mikro-orm
$ npx mikro-orm

# or when installed globally
$ mikro-orm
```

For CLI to be able to access your database, you will need to create `mikro-orm.config.js` file that 
exports your ORM configuration. TypeScript is also supported, just enable `useTsNode` flag in your
`package.json` file. There you can also set up array of possible paths to `mikro-orm.config` file,
as well as use different file name:

**`./package.json`**

```json
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

**`./src/mikro-orm.config.ts`**

```typescript
// usually you will reexport existing configuration from somewhere else
import { CONFIG } from './config';
export = CONFIG.orm;
```

> You can also use different names for this file, simply rename it in the `configPaths` array
> your in `package.json`. You can also use `MIKRO_ORM_CLI` environment variable with the path
> to override `configPaths` value.

Now you should be able to start using the CLI. All available commands are listed in the CLI help:

```sh
Usage: mikro-orm <command> [options]

Commands:
  mikro-orm cache:clear        Clear metadata cache
  mikro-orm generate-entities  Generate entities based on current database schema
  mikro-orm schema:create      Create database schema based on current metadata
  mikro-orm schema:drop        Drop database schema based on current metadata
  mikro-orm schema:update      Update database schema based on current metadata

Options:
  -v, --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  mikro-orm schema:update --run  Runs schema synchronization
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

More info about `RequestContext` is described [here](identity-map.md#request-context).

Now you can start [defining your entities](defining-entities.md) (in one of the `entitiesDirs` folders).

[&larr; Back to table of contents](index.md#table-of-contents)
