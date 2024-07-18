---
title: 'Chapter 1: First Entity'
---

## Setting up

Before we start, ensure you meet the following pre-requisites first:

1. Have Node.js version 18.12 or higher installed, but preferably version 20.
    - Visit [Node.js website](https://nodejs.org/en/download) to download or use [fnm](https://github.com/Schniz/fnm).
2. Have NPM installed, or use any other package manager of your choice.
    - NPM comes bundled with Node.js, so you should already have it. If not, reinstall Node.js. To use other package managers, consider using [corepack](https://nodejs.org/api/corepack.html).

If not certain, confirm the prerequisites by running:

```bash
node -v
npm -v
```

## Creating a new project

Let's start with the basic folder structure. As we said we will have 3 modules, each having its own directory:

```bash
# create the project folder and `cd` into it
mkdir blog-api && cd blog-api
# create module folders, inside `src` folder
mkdir -p src/modules/{user,article,common}
```

Now add the dependencies:

```bash npm2yarn
npm install @mikro-orm/core \
            @mikro-orm/sqlite \
            @mikro-orm/reflection \
            fastify
```

And some development dependencies:

```bash npm2yarn
npm install --save-dev @mikro-orm/cli \
                       typescript \
                       ts-node \
                       @types/node \
                       vitest
```

## ECMAScript Modules

You probably heard about ECMAScript Modules (ESM), but this might easily be the first time you try them. Now keep in mind - the whole ecosystem is far away from ready, and this guide is using the ESM mainly to show how it is possible. Many dependencies are not ESM ready, and often there are weird workarounds needed. MikroORM is no exception to this - there are quirks as well, namely in dynamic imports of TypeScript files under test setup.

In a nutshell, for ESM project we need to:

- add `"type": "module"` to package.json
- use `import/export` statements instead of `require` calls
- use `.js` extension in those `import`s, even in TypeScript files
- configure TypeScript and `ts-node` property, as described in the following section

> You can read more about the ESM support in Node.js [here](https://nodejs.org/api/esm.html).

In addition to this, there is one gotcha with defining entities using decorators. The default way MikroORM uses to obtain a property type is via `reflect-metadata`. While this itself introduces [some challenges and limitations](../metadata-providers#limitations-and-requirements), we can't use it in an ESM project. This is because, with ES modules, the dependencies are resolved asynchronously, in parallel, which is incompatible with how the `reflect-metadata` module currently works. For this reason, we need to use other ways to define the entity metadata - in this guide, we will use the `@mikro-orm/reflection` package, which uses `ts-morph` under the hood to gain information from TypeScript Compiler API. This works fine with ESM projects, and also opens up new ways of compiling the TypeScript files, like `esbuild` (which does not support decorator metadata).

> Another way to define your entities is via [`EntitySchema`](../entity-schema), this approach works also for vanilla JavaScript projects, as well as allows to define entities via interfaces instead of classes. Check the [Defining Entities section](../defining-entities), all examples there have code tabs with definitions via `EntitySchema` too.

The reflection with `ts-morph` is performance heavy, so the [metadata are cached](../metadata-cache.md) into `temp` folder and invalidated automatically when you change your entity definition (or update the ORM version). You should add this folder to `.gitignore` file. Note that when you build your production bundle, you can leverage the CLI to generate production cache on build time to get faster start-up times. See the [deployment section](../deployment.md) for more about this.

## Configuring TypeScript

We will use the following TypeScript config, so create the `tsconfig.json` file and copy it there. If you know what you are doing, you can adjust the configuration to fit your needs.

For ESM support to work, we need to set `module` and `moduleResolution` to `NodeNext` and target `ES2022`. We also enable `strict` mode and `experimentalDecorators`, as well as the `declaration` option to generate the `.d.ts` files, needed by the `@mikro-orm/reflection` package. Lastly, we tell TypeScript to compile into `dist` folder via `outDir` and make it `include` all `*.ts` files inside `src` folder.

```json title='tsconfig.json'
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "strict": true,
    "outDir": "dist",
    "declaration": true,
    "experimentalDecorators": true
  },
  "include": [
    "./src/**/*.ts"
  ]
}
```

### Using `ts-node` to run TypeScript files directly

During the development, you will often want to run the app to test your changes. For that, it is handy to use `ts-node` to run the TypeScript files directly, instead of compiling the first to JavaScript. By default, `ts-node` will operate in CommonJS mode, so we need to configure it via `tsconfig.json` to enable ESM support. To speed things up, we can use the `transpileOnly` option, which disables type checking - we will get the type checks when compiling the app for production use, so it does not matter that much during development (especially when you have an IDE that shows you the errors anyway).

```json title='tsconfig.json'
{
  "compilerOptions": { ... },
  "include": [ ... ],
  "ts-node": {
    "esm": true,
    "transpileOnly": true
  }
}
```

## Setting up CLI

Next, we will set up the CLI config MikroORM. This config will be then automatically imported into your app too. Define the config variable with explicit `Options` type, that way you get the best level of type safety - autocomplete as well as warning about not existing options (as opposed to using `{ ... } as Options`, that won't warn you for such).

> For tests, you can import the config and override some options before evaluating it.

```ts title='src/mikro-orm.config.ts'
import { Options, SqliteDriver } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const config: Options = {
  // for simplicity, we use the SQLite database, as it's available pretty much everywhere
  driver: SqliteDriver,
  dbName: 'sqlite.db',
  // folder-based discovery setup, using common filename suffix
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  // we will use the ts-morph reflection, an alternative to the default reflect-metadata provider
  // check the documentation for their differences: https://mikro-orm.io/docs/metadata-providers
  metadataProvider: TsMorphMetadataProvider,
  // enable debug mode to log SQL queries and discovery information
  debug: true,
};

export default config;
```

> Note that we are importing `Options` from the `@mikro-orm/sqlite` package - this is an alias to `Options<SqliteDriver>`.

Alternatively, we can use the `defineConfig` helper that should provide intellisense even in JavaScript files, without the need for type hints:

```ts
import { defineConfig } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

// no need to specify the `driver` now, it will be inferred automatically
export default defineConfig({
   dbName: 'sqlite.db',
   // folder-based discovery setup, using common filename suffix
   entities: ['dist/**/*.entity.js'],
   entitiesTs: ['src/**/*.entity.ts'],
   // we will use the ts-morph reflection, an alternative to the default reflect-metadata provider
   // check the documentation for their differences: https://mikro-orm.io/docs/metadata-providers
   metadataProvider: TsMorphMetadataProvider,
   // enable debug mode to log SQL queries and discovery information
   debug: true,
});
```

Save this file into `src/mikro-orm.config.ts`, so it will get compiled together with the rest of your app. Next, you need to tell the ORM to enable TypeScript support for CLI, via `mikro-orm` section in the `package.json` file.

> Alternatively, you can use `mikro-orm.config.js` file in the root of your project, such a file will get loaded automatically. Consult [the documentation](../quick-start#setting-up-the-commandline-tool) for more info.

```json title='package.json'
{
  "type": "module",
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

Lastly, add some NPM scripts to ease the development. We will build the app via `tsc`, test it via `vitest` and run it locally via `ts-node`. There is one gotcha with ESM and dynamic imports. While it works fine for regular JavaScript files, once we mix runtime support for TypeScript via `ts-node` or `vitest/esbuild`, you start hitting the wall with errors like `Unknown file extension ".ts"`. To get around that, we can use the `ts-node/esm` loader via `NODE_OPTIONS` environment variable - but that can get ugly, and we can do better - at least for the CLI, we have the `mikro-orm-esm` script, which automatically registers the `ts-node/esm` loader as well as disables the experimental warning.

> So remember - always use `mikro-orm-esm` in the ESM projects with TypeScript. Note that it requires the `ts-node` dependency to be installed, if you don't use TypeScript, the regular `mikro-orm` script will work fine for you.

This issue with dynamic imports can surface for both the CLI usage and `vitest`. While the `--loader` solution works for the CLI, we can use something more vite-native for `vitest`, let's talk about that part later when you start writing the first test.

> The `ts-node` binary works only on older Node.js versions, for v20 or above, we need to use `node --loader ts-node/esm` instead.

```json title='package.json'
{
  "type": "module",
  "dependencies": { ... },
  "devDependencies": { ... },
  "mikro-orm": { ... },
  "scripts": {
    "build": "tsc",
    "start": "node --no-warnings=ExperimentalWarning --loader ts-node/esm src/server.ts",
    "test": "vitest"
  }
}
```

> We refer to a file `src/server.ts` in the `start` script, we will create that later, no need to worry about it right now.

Now test the CLI via `npx mikro-orm-esm debug`, you should see something like the following:

```
Current MikroORM CLI configuration
 - dependencies:
   - mikro-orm 6.0.0
   - node 20.9.0
   - knex 3.0.1
   - sqlite3 5.1.6
   - typescript 5.3.3
 - package.json found
 - ts-node enabled
 - searched config paths:
   - /blog-api/src/mikro-orm.config.ts (found)
   - /blog-api/dist/mikro-orm.config.js (found)
   - /blog-api/mikro-orm.config.ts (not found)
   - /blog-api/mikro-orm.config.js (not found)
 - configuration found
 - database connection successful
 - will use `entities` array (contains 0 references and 1 paths)
   - /blog-api/dist/**/*.entity.js (not found)
 - could use `entitiesTs` array (contains 0 references and 1 paths)
   - /blog-api/src/**/*.entity.ts (not found)
```

This looks good, we get a nice summary of what is being installed, we can see the config being loaded correctly, and as expected, no entities were discovered - because you need to create them first!

> If you used `npx mikro-orm debug` instead of `npx mikro-orm-esm debug`, the configuration would fail to be loaded and an error similar to this one would be present:
> ```
> Unknown file extension ".ts" for ./blog-api/src/mikro-orm.config.ts
> ```

Then test the TypeScript build, as we now have the first file we can compile. Use `npm run build` and check if the `dist` folder gets generated with the JavaScript version of our config file.

Before we get to creating the very first entity, let's do a quick sanity check - this is our initial directory structure so far:

```
.
├── dist
│   └── mikro-orm.config.js
├── node_modules
├── package-lock.json
├── package.json
├── src
│   ├── mikro-orm.config.ts
│   └── modules
│       ├── article
│       ├── common
│       └── user
└── tsconfig.json
```

## First Entity

This was quite a lot of setup, but don't worry, most of the heavy lifting is behind you. Time to create your first entity - the `User`! Create a `user.entity.ts` file in `src/modules/user` with the following contents:

:::info

Check out the [Defining Entities](../defining-entities.md) section which provides many examples of various property types as well as different ways to define your entities.

:::

```ts title='user.entity.ts'
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {

   @PrimaryKey()
   id!: number;

   @Property()
   fullName!: string;

   @Property()
   email!: string;

   @Property()
   password!: string;

   @Property({ type: 'text' })
   bio = '';

}
```

So what do we have here? An entity is a JavaScript class, decorated with an `@Entity()` decorator, that defines properties with other decorators (like `@Property()`). An entity represents a database table, and the properties represent its columns.

> We use the `*.entity.ts` suffix for easy folder-based discovery across module boundaries. Alternatively, you could explicitly provide the entity class references in the ORM config, e.g. `entities: [User]`. With the explicit setup, things are more streamlined and less error-prone, there is no dynamic importing, and no file system is involved. But folder-based discovery can be handy, especially when our app grows to many entities.

### Defining the primary key

Every entity needs to have a primary key, we will use a simple auto-increment numeric one. MikroORM defaults to that when it sees a single primary key property with a `number` type, so doing the following is enough:

```ts
@PrimaryKey()
id!: number;
```

In case you want to use `bigint` column type, just pass `type: 'bigint'` in the decorator options. `BigInt`s are mapped to `string`, as they would not fit into JavaScript `number` safely.

```ts
@PrimaryKey({ type: 'bigint' })
id!: string;
```

Another common use case is UUID. We can leverage the fact, that MikroORM never calls your entity constructor when creating managed entity instances (those loaded from your database). This means property initializers (or in general constructors) are executed only for entities that will produce an `INSERT` query.

```ts
@PrimaryKey({ type: 'uuid' })
uuid = uuid.v4();
```

### Scalar properties

To map regular database columns we can use the `@Property()` decorator. It works the same as the `@PrimaryKey()` decorator describer above. You could say it extends it - all the properties you can pass to the `@Property()` decorator are also available in `@PrimaryKey()` too.

> We are using the ts-morph metadata provider, which helps with advanced type inference. Check out [the documentation](../metadata-providers#limitations-and-requirements) for the differences if you'd like to use the default metadata provider which is based on `reflect-metadata`.

The ORM will automatically map `string` properties to `varchar`, for the `User.bio` we want to use `text` instead, so we change it via the `type` decorator option:

```ts
@Property({ type: 'text' })
bio = '';
```

The `type` option here allows several input forms. We are using the `text` type name here, which is mapped to the `TextType` - a mapped type representation used internally by the ORM. If you provide a string value there, and it won't match any known type alias, it will be considered as the column type. We can also provide a type class implementation instead of a `string` type name:

```ts
import { TextType } from '@mikro-orm/core';

@Property({ type: TextType })
bio = '';
```

There is also a `types` map (exported also as just `t` for brevity):

```ts
import { t } from '@mikro-orm/core'; // `t` or `types`

@Property({ type: t.text })
bio = '';
```

We can always provide the explicit column type (and this can be even combined with the `type` option, to override how the mapped type is implemented):

```ts
import { t } from '@mikro-orm/core'; // `t` or `types`

@Property({ columnType: 'character varying(1000)' })
bio = '';
```

When using the `columnType`, be careful about options like `length` or `precision/scale` - `columnType` is always used as-is, without any modification. This means you need to pass the final value there, including the length, e.g. `columnType: 'decimal(10,2)'`.

## Initializing the ORM

The last missing step is to initialize the [`MikroORM`](/api/core/class/MikroORM) to get access to the [`EntityManager`](/api/core/class/EntityManager) and other handy tools (like the [`SchemaGenerator`](/api/knex/class/SqlSchemaGenerator)).

```ts title='server.ts'
import { MikroORM } from '@mikro-orm/sqlite'; // or any other driver package

// initialize the ORM, loading the config file dynamically
const orm = await MikroORM.init();
console.log(orm.em); // access EntityManager via `em` property
console.log(orm.schema); // access SchemaGeneartor via `schema` property
```

We used the [`init()`](/api/core/class/MikroORM#init) method without any parameters, which results in the ORM loading the CLI config automatically. In a more explicit way, it's the same as the following code:

```ts title='server.ts'
import { MikroORM } from '@mikro-orm/sqlite';
import config from './mikro-orm.config.js';

const orm = await MikroORM.init(config);
```

:::info Synchronous initialization

As opposed to the async [`MikroORM.init`](/api/core/class/MikroORM#init) method, you can prefer to use synchronous variant [`initSync()`](/api/core/class/MikroORM#initSync). This method has
some limitations:

- database connection will be established when you first interact with the database (or you can use [`orm.connect()`](/api/core/class/MikroORM#connect)
  explicitly)
- no loading of the `config` file, `options` parameter is mandatory
- no support for folder-based discovery
- no check for mismatched package versions

:::

## Working with Entity Manager

So now you have the access to [`EntityManager`](/api/core/class/EntityManager), let's talk about how it works and how you can use it.

### Persist and Flush

There are 2 methods we should first describe to understand how persisting works in MikroORM: [`em.persist()`](/api/core/class/EntityManager#persist) and [`em.flush()`](/api/core/class/EntityManager#flush).

[`em.persist(entity)`](/api/core/class/EntityManager#persist) is used to mark new entities for future persisting. It will make the entity managed by the [`EntityManager`](/api/core/class/EntityManager) and once `flush` will be called, it will be written to the database.

```ts
const user = new User();
user.email = 'foo@bar.com';

// first mark the entity with `persist()`, then `flush()`
em.persist(user);
await em.flush();

// we could as well use fluent API here and do this:
await em.persist(user).flush();
```

To understand `flush`, let's first define what managed entity is: An entity is managed if it's fetched from the database (via [`em.find()`](/api/core/class/EntityManager#find)) or registered as new through [`em.persist()`](/api/core/class/EntityManager#persist) and flushed later (only after the `flush` it becomes managed).

[`em.flush()`](/api/core/class/EntityManager#flush) will go through all managed entities, compute appropriate change sets and perform according database queries. As an entity loaded from the database becomes managed
automatically, we do not have to call persist on those, and flush is enough to update them.

```ts
const user = await em.findOne(User, 1);
user.bio = '...';

// no need to persist `user` as it's already managed by the EM
await em.flush();
```

Let's try to create our first record in the database, add this to the `server.ts` file instead of the `console.log`:

```ts title='server.ts'
// create new user entity instance
const user = new User();
user.email = 'foo@bar.com';
user.fullName = 'Foo Bar';
user.password = '123456';

// first mark the entity with `persist()`, then `flush()`
await orm.em.persist(user).flush();

// after the entity is flushed, it becomes managed, and has the PK available
console.log('user id is:', user.id);
```

Now run the script again via `npm start`, and you will see an error:

```
ValidationError: Using global EntityManager instance methods for context specific actions is disallowed.
If you need to work with the global instance's identity map, use `allowGlobalContext` configuration option
or `fork()` instead.
```

Remember we said the `orm.em` is a global [`EntityManager`](/api/core/class/EntityManager) instance? Looks like it is not a good idea to use it, in fact, it is disallowed by default. Before we get to the bottom of this message, let's quickly define two more terms we haven't touched yet - the Identity Map and Unit of Work.

- Unit of Work maintains a list of objects (entities) affected by a business transaction and coordinates the writing out of changes.
- Identity Map ensures that each object (entity) gets loaded only once by keeping every loaded object in a map. Looks up objects using the map when referring to them.

MikroORM is a data-mapper that tries to achieve persistence-ignorance. This means you map JavaScript objects into a relational database that doesn't necessarily know about the database at all. How does it work?

### Unit of Work and Identity Map

MikroORM uses the Identity Map pattern to track objects. Whenever you fetch an object from the database, MikroORM will keep a reference to this object inside its `UnitOfWork`. This allows MikroORM room for optimizations. If you call the EntityManager and ask for an entity with a specific ID twice, it will return the same instance:

```ts
const jon1 = await em.findOne(Author, 1);
const jon2 = await em.findOne(Author, 1);

// identity map in action
console.log(jon1 === jon2); // true
```

The Identity Map only knows objects by id, so a query for different criteria has to go to the database, even if it was executed just before. But instead of creating a second `Author` object MikroORM first gets the primary key from the row and checks if it already has an object inside the `UnitOfWork` with that primary key.

### Change Tracking

The identity map has a second, more important use-case. Whenever you call [`em.flush()`](/api/core/class/EntityManager#flush), the ORM will iterate over the Identity Map, and for each entity it compares the original state with the values that are currently set on the entity. If changes are detected, the object is queued for an SQL `UPDATE` operation. Only the fields that changed are part of the update query.

The following code will update your database with the changes made to the `Author` object, even if you did not call [`em.persist()`](/api/core/class/EntityManager#persist):

```ts
const jon = await em.findOne(Author, 1);

jon.email = 'foo@bar.com';

await em.flush();
```

### Implicit Transactions

The most important implication of having Unit of Work is that it allows handling transactions automatically.

When you call [`em.flush()`](/api/core/class/EntityManager#flush), all computed changes are queried inside a database transaction. This means that you can control the boundaries of transactions by calling [`em.persist()`](/api/core/class/EntityManager#persist) and once all your changes are ready, calling `flush()` will run them inside a transaction.

> You can also control the transaction boundaries manually via `em.transactional(cb)`.

```ts
const user = await em.findOne(User, 1);

user.email = 'foo@bar.com';
const car = new Car();
user.cars.add(car);

await em.flush();
```

You can find more information about transactions in [Transactions and concurrency](../transactions.md) page.

### Why is Request Context needed?

Now back to the validation error about global context. With the freshly gained knowledge, we know [`EntityManager`](/api/core/class/EntityManager) maintains a reference to all the managed entities in the Identity Map. Imagine we would use a single Identity Map throughout our application (so a single global context, global [`EntityManager`](/api/core/class/EntityManager)). It will be shared across all request handlers, that can run in parallel.

1. growing memory footprint

   As there would be only one shared Identity Map, we can't just clear it after our request ends. There can be another request working with it so clearing the Identity Map from one request could break other requests running in parallel. This will result in a growing memory footprint, as every entity that became managed at some point in time would be kept in the Identity Map.

2. unstable response of API endpoints

   Every entity has `toJSON()` method, that automatically converts it to serialized form If we have only one shared Identity Map, the following situation may occur:

   Let's say there are 2 endpoints

    1. `GET /article/:id` that returns just the article, without populating anything
    2. `GET /article-with-author/:id` that returns the article and its author populated

   Now when someone requests the same article via both of those endpoints, we could end up with both returning the same output:

    1. `GET /article/1` returns `Article` without populating its property `author` property
    2. `GET /article-with-author/1` returns `Article`, this time with `author` populated
    3. `GET /article/1` returns `Article`, but this time also with `author` populated

   This happens because the information about entity association being populated is stored in the Identity Map.

### Fork to the win!

So we understand the problem better now, what's the solution? The error suggests it - forking. With the `fork()` method we get a clean [`EntityManager`](/api/core/class/EntityManager) instance, that has a fresh Unit of Work with its own context and Identity Map.

```ts title='server.ts'
// fork first to have a separate context
const em = orm.em.fork();

// first mark the entity with `persist()`, then `flush()`
await em.persist(user).flush();
```

Running `npm start` again, we get past the global context validation error, but only to find another one:

```
TableNotFoundException: insert into `user` (`bio`, `email`, `full_name`, `password`) values ('', 'foo@bar.com', 'Foo Bar', '123456') - no such table: user
```

We forgot to create the database schema. Fortunately, we have all the tools we need at hand. You can use the [`SchemaGenerator`](/api/knex/class/SqlSchemaGenerator) provided by MikroORM to create the schema, as well as to keep it in sync when you change your entities. For the initial testing, let's use the `refreshDatabase()` method, which is handy for testing - it will first drop the schema if it already exists and create it from scratch based on entity definition (metadata).

```ts title='server.ts'
// recreate the database schema
await orm.schema.refreshDatabase();
```

Finally, `npm start` should succeed, and if you enabled the debug mode in your config, you will see the SQL queries in the logs, as well as the `user.id` value at the very end.

```sql
[query] create table `user` (`id` integer not null primary key autoincrement, `full_name` text not null, `email` text not null, `password` text not null, `bio` text not null); [took 1 ms]
[query] pragma foreign_keys = on; [took 0 ms]
[query] begin
[query] insert into `user` (`bio`, `email`, `full_name`, `password`) values ('', 'foo@bar.com', 'Foo Bar', '123456') [took 0 ms]
[query] commit
user id is: 1
```

You can see the insert query being wrapped inside a transaction. That is another effect of the Unit of Work. The [`em.flush()`](/api/core/class/EntityManager#flush) call will perform all the queries inside a transaction. If something fails, the whole transaction will be rolled back.

### Fetching Entities

We have our first entity stored in the database. To read it from there we can use `find()` and `findOne()` methods.

```ts title='server.ts'
// find user by PK, same as `em.findOne(User, { id: 1 })`
const userById = await em.findOne(User, 1);
// find user by email
const userByEmail = await em.findOne(User, { email: 'foo@bar.com' });
// find all users
const allUsers = await em.find(User, {});
```

We mentioned the Identity Map several times already - time to test how it works. We said the entity is managed, and the Unit of Work will track its changes, and compute them when we call `flush()`. We also said a new entity that is marked with `persist()` will become managed after flushing.

Put the following code into your `server.ts` file, right before the `orm.close()` call:

```ts title='server.ts'
// user entity is now managed, if we try to find it again, we get the same reference
const myUser = await em.findOne(User, user.id);
console.log('users are the same?', user === myUser)

// modifying the user and flushing yields update queries
user.bio = '...';
await em.flush();
```

Run the `npm start` again and verify the logs:

```
users are the same? true
[query] begin
[query] update `user` set `bio` = '...' where `id` = 1 [took 0 ms]
[query] commit
```

Next, let's try to do the same, but with an [`EntityManager`](/api/core/class/EntityManager) fork:

```ts title='server.ts'
// now try to create a new fork, does not matter if from `orm.em` or our existing `em` fork, as by default we get a clean one
const em2 = em.fork();
console.log('verify the EM ids are different:', em.id, em2.id);
const myUser2 = await em2.findOneOrFail(User, user.id);
console.log('users are no longer the same, as they came from different EM:', user === myUser2);
```

Which logs the following:

```
verify the EM ids are different: 3 4
[query] select `u0`.* from `user` as `u0` where `u0`.`id` = 1 limit 1 [took 0 ms]
users are no longer the same, as they came from different EM: false
```

:::info

We just used `em.findOneOrFail()` instead of `em.findOne()`, as you may have guessed, its purpose is to always return a value, or throw otherwise.

:::

You can see there is a select query to load the user. This is because we used a new fork, that is clean by default—it has an empty Identity Map, and therefore it needs to load the entity from the database. In the previous example, we already had it present by the time we were calling `em.findOne()`. You queried the entity by its primary key, and such a query will always first check the identity map and prefer the results from it instead of querying the database.

### Refreshing loaded entities

The behavior described above is often what we want and serves as a first-level cache, but what if you always want to reload that entity, regardless of the existing state? There are several options:

> [`FindOptions`](/api/core/interface/FindOptions) is the last parameter of `em.find/findOne` methods.

1. fork first, to have a clear context
2. use `disableIdentityMap: true` in the `FindOptions`
3. use `em.refresh(entity)`

The first two have pretty much the same effect, using `disableIdentityMap` just does the forking for us behind the scenes. Let's talk about the last one - refreshing. With `em.refresh()`, the [`EntityManager`](/api/core/class/EntityManager) will ignore the contents of the Identity Map and always fetch the entity from the database.

```ts title='server.ts'
// change the user
myUser2.bio = 'changed';

// reload user with `em.refresh()`
await em2.refresh(myUser2);
console.log('changes are lost', myUser2);

// let's try again
myUser2!.bio = 'some change, will be saved';
await em2.flush();
```

Running the `npm start` script again, we get the following:

```
[query] select `u0`.* from `user` as `u0` where `u0`.`id` = 1 limit 1 [took 1 ms, 1 result]
changes are lost User {
  fullName: 'Foo Bar',
  email: 'foo@bar.com',
  password: '123456',
  bio: '...',
  id: 1
}
[query] begin
[query] update `user` set `bio` = 'some change, will be saved' where `id` = 1 [took 0 ms, 1 row affected]
[query] commit
```

### Removing entities

We touched on creating, reading and updating entities, the last piece of the puzzle to the CRUD riddle is the delete operation. To delete entities via [`EntityManager`](/api/core/class/EntityManager), we have two possibilities:

1. Mark entity instance via `em.remove()` - this means we first need to have the entity instance. But don't worry, you can get one even without loading it from the database - via [`em.getReference()`](/api/core/class/EntityManager#getReference).
2. Fire `DELETE` query via `em.nativeDelete()` - when all you want is a simple delete query, it can be simple as that.

Let's test the first approach with removing by entity instance:

```ts title='server.ts'
// finally, remove the entity
await em2.remove(myUser3!).flush();
```

### Entity references

So what does the [`em.getReference()`](/api/core/class/EntityManager#getReference) method mentioned above do and what is an _entity reference_ in the first place?

MikroORM represents every entity as an object, even those that are not fully loaded. Those are called entity references - they are in fact regular entity class instances, but only with their primary key available. This makes it possible to create them without querying the database. References are stored in the identity map just like any other entity.

An alternative to the previous code snippet could be as well this:

```ts
const userRef = em.getReference(User, 1);
await em.remove(userRef).flush();
```

This concept is especially important for relationships and can be combined with the so-called `Reference` wrapper for added type safety, but we will get to that later.

### Entity state and `WrappedEntity`

We just said that entity reference is a regular entity, but only with a primary key. How does it work? During entity discovery (which happens when you call `MikroORM.init()`), the ORM will patch the entity prototype and generate a lazy getter for the `WrappedEntity` - a class holding various metadata and state information about the entity. Each entity instance will have one, available under a hidden `__helper` property - to access its API in a type-safe way, use the `wrap()` helper:

```ts
import { wrap } from '@mikro-orm/core';

const userRef = em.getReference(User, 1);
console.log('userRef is initialized:', wrap(userRef).isInitialized());

await wrap(userRef).init();
console.log('userRef is initialized:', wrap(userRef).isInitialized());
```

> You can also extend the `BaseEntity` provided by MikroORM. It defines all the public methods available via `wrap()` helper, so you could do `userRef.isInitialized()` or `userRef.init()`.

The `WrappedEntity` instance also holds the state of the entity at the time it was loaded or flushed - this state is then used by the Unit of Work during flush to compute the differences. Another use case is serialization, we can use the `toObject()`, `toPOJO()` and `toJSON()` methods to convert the entity instance to a plain JavaScript object.

## ⛳ Checkpoint 1

Currently, our app consists of a single `User` entity and a `server.ts` file where we tested how to work with it using [`EntityManager`](/api/core/class/EntityManager). You can find working StackBlitz for the current state here:

> Due to the nature of how the ESM support in ts-node works, it is not possible to use it inside StackBlitz project - we need to use `node --loader` instead. We also use in-memory database, SQLite feature available via special database name `:memory:`.

This is our [`server.ts` file](https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-1?file=src%2Fserver.ts) so far:

<iframe width="100%" height="800" frameborder="0" src="https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-1?embed=1&ctl=1&view=editor&file=src%2Fserver.ts">
</iframe>
