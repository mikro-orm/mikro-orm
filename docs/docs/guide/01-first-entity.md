---
title: 'Chapter 1: First Entity'
---

## Setting up

Before you start, ensure you meet the following pre-requisites first:

1. Have Node.js version 22.11 or higher installed, but preferably version 24.
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
            fastify
```

And some development dependencies:

```bash npm2yarn
npm install --save-dev @mikro-orm/cli \
                       typescript \
                       tsx \
                       @types/node \
                       vitest
```

## ECMAScript Modules

You probably heard about ECMAScript Modules (ESM), but this might easily be the first time you try them.

> You do not have to use ESM to use MikroORM. MikroORM can work in ESM projects, as well as CommonJS (CJS) projects.

In a nutshell, for ESM project we need to:

- add `"type": "module"` to package.json
- use `import/export` statements instead of `require` calls
- use `.js` extension in those `import`s, even in TypeScript files

> You can read more about the ESM support in Node.js [here](https://nodejs.org/api/esm.html).

## Configuring TypeScript

We will use the following TypeScript config, so create the `tsconfig.json` file and copy it there. If you know what you are doing, you can adjust the configuration to fit your needs.

For ESM support to work, we need to set `module` and `moduleResolution` to `NodeNext` and target `ES2024`. We also enable `strict` mode. Lastly, we tell TypeScript to compile into `dist` folder via `outDir` and make it `include` all `*.ts` files inside `src` folder.

```json title='tsconfig.json'
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2024",
    "strict": true,
    "outDir": "dist"
  },
  "include": [
    "./src/**/*.ts"
  ]
}
```

## Setting up CLI

Next, we will set up the CLI config for MikroORM. This config will be then automatically imported into your app too. We will use the `defineConfig` helper that provides intellisense even in JavaScript files.

> For tests, you can import the config and override some options before evaluating it.

```ts title='src/mikro-orm.config.ts'
import { defineConfig } from '@mikro-orm/sqlite';
import { User } from './modules/user/user.entity.js';

export default defineConfig({
  // for simplicity, we use the SQLite database, as it's available pretty much everywhere
  dbName: 'sqlite.db',
  // explicitly list your entities - we'll create the User entity next
  entities: [User],
  // enable debug mode to log SQL queries and discovery information
  debug: true,
});
```

We import entities directly and pass them to the `entities` array. You can use either the entity class (`User`) or the schema (`UserSchema`) - both work the same way. This is more explicit than folder-based discovery and gives you better control over what entities are registered.

> The `defineConfig` helper infers the driver type automatically, so no need to specify it explicitly.

Save this file into `src/mikro-orm.config.ts`, so it will get compiled together with the rest of your app.

> Alternatively, you can use `mikro-orm.config.js` file in the root of your project, such a file will get loaded automatically. Consult [the documentation](../quick-start#setting-up-the-commandline-tool) for more info.

```json title='package.json'
{
  "type": "module",
  "dependencies": { ... },
  "devDependencies": { ... }
}
```

Lastly, add some NPM scripts to ease the development. We will build the app via `tsc`, test it via `vitest` and run it locally via `tsx`.

```json title='package.json'
{
  "type": "module",
  "dependencies": { ... },
  "devDependencies": { ... },
  "scripts": {
    "build": "tsc",
    "start": "tsx src/server.ts",
    "test": "vitest"
  }
}
```

> We refer to a file `src/server.ts` in the `start` script, we will create that later, no need to worry about it right now.

Note that the config references the `User` entity which we haven't created yet. The CLI will fail until we create it, so let's do that next.

## First Entity

:::info

Check out the [Defining Entities](../defining-entities.md) section which provides many examples of various property types as well as different ways to define your entities.

:::

Time to create your first entity - the `User`! Create a `user.entity.ts` file in `src/modules/user` with the following contents:

```ts title='user.entity.ts'
import { defineEntity, Opt, p } from '@mikro-orm/core';

export class User {
  id!: number;
  fullName!: string;
  email!: string;
  password!: string;
  bio!: string & Opt;
}

export const UserSchema = defineEntity({
  class: User,
  properties: {
    id: p.integer().primary(),
    fullName: p.string(),
    email: p.string(),
    password: p.string(),
    bio: p.text().default(''),
  },
});
```

So what do we have here? We define a `User` class with typed properties, then use the `defineEntity` helper to create an entity schema for it. When using `defineEntity` with a class, we pass `class: User` instead of `name: 'User'`. The entity name will be inferred from the class name.

The `p` export provides type-safe property builders like `p.string()`, `p.integer()`, `p.text()`, etc. These builders use a fluent API where you can chain options like `.primary()`, `.default()`, and more.

The `Opt` type is used to mark properties that have default values as optional in TypeScript - this tells the ORM that `bio` doesn't need to be provided in `em.create()` calls since it has a default value.

### Inferring the entity type

Alternatively, you can also use `defineEntity` without a class, and pass the entity name as the first argument:

```ts title='user.entity.ts'
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: {
    // ...
  },
});

// Export the inferred type for use elsewhere
export type IUser = InferEntity<typeof User>;
```

### Defining the primary key

Every entity needs to have a primary key. You define it using the `.primary()` builder method. For a single numeric primary key, auto-increment is assumed automatically:

```ts
id: p.integer().primary(),
```

In case you want to use `bigint` column type, use the `p.bigint()` builder. BigInts are mapped to `string` by default, as JavaScript `number` cannot safely represent large integers:

```ts
id: p.bigint().primary(),
```

Another common use case is UUID. You can use `onCreate` to generate a value when the entity is first persisted:

```ts
import { v4 } from 'uuid';

// ...
uuid: p.uuid().primary().onCreate(() => v4()),
```

### Scalar properties

To map regular database columns, we use the property builders from `defineEntity.properties`. Each builder corresponds to a data type:

- `p.string()` - maps to `varchar`
- `p.text()` - maps to `text` (for longer strings)
- `p.integer()` - maps to `integer`
- `p.boolean()` - maps to `boolean`
- `p.datetime()` - maps to `datetime`/`timestamp`
- `p.json<T>()` - maps to `json`/`jsonb` with typed content

For our `User.bio` we want to use `text` instead of `varchar`, and provide a default value:

```ts
bio: p.text().default(''),
```

The `.default()` method sets both the runtime default and the database column default. Properties with defaults are automatically marked as optional in TypeScript (the `Opt` type is inferred).

You can chain additional options:

```ts
// with explicit column type
bio: p.text().columnType('character varying(1000)'),

// with length constraint
description: p.string().length(1000),
```

When using `.columnType()`, be careful about options like `length` or `precision/scale` - `columnType` is always used as-is. This means you need to pass the final value there, including the length, e.g. `.columnType('decimal(10,2)')`.

Now that we have both the config and the entity, test the CLI via `npx mikro-orm debug`:

```
Current MikroORM CLI configuration
 - dependencies:
   - mikro-orm 7.0.0
   - node 24.11.1
   - typescript 5.9.3
 - package.json found
 - TypeScript support enabled (tsx)
 - configuration found
 - database connection successful
 - will use `entities` array (contains 1 references)
```

## Initializing the ORM

The last missing step is to initialize the [`MikroORM`](/api/core/class/MikroORM) to get access to the [`EntityManager`](/api/core/class/EntityManager) and other handy tools (like the [`SchemaGenerator`](/api/knex/class/SqlSchemaGenerator)).

```ts title='server.ts'
import { MikroORM } from '@mikro-orm/sqlite';
import config from './mikro-orm.config.js';

const orm = await MikroORM.init(config);
```

:::info Synchronous initialization

As opposed to the async [`MikroORM.init`](/api/core/class/MikroORM#init) method, you can prefer to use synchronous variant with the constructor: [`new MikroORM()`](/api/core/class/MikroORM#constructor).

```ts
const orm = new MikroORM(config);
```

This method has some limitations:

- folder-based discovery not supported
- ORM extensions are not auto-loaded
- when metadata cache is enabled, `FileCacheAdapter` needs to be explicitly set in the config

:::

## Working with Entity Manager

So now you have the access to [`EntityManager`](/api/core/class/EntityManager), let's talk about how it works and how you can use it.

### Persist and Flush

There are 2 methods we should first describe to understand how persisting works in MikroORM: [`em.persist()`](/api/core/class/EntityManager#persist) and [`em.flush()`](/api/core/class/EntityManager#flush).

[`em.persist(entity)`](/api/core/class/EntityManager#persist) is used to mark new entities for future persisting. It will make the entity managed by the [`EntityManager`](/api/core/class/EntityManager) and once `flush` will be called, it will be written to the database.

We use [`em.create()`](/api/core/class/EntityManager#create) to create entity instances. Since the `User` entity is defined with a class, you could also use `new User()` followed by `em.persist()`. Note that `em.create()` will call the entity constructor internally, so those are effectively the same things.

```ts
// create a new user entity instance
const user = em.create(User, {
  email: 'foo@bar.com',
  fullName: 'Foo Bar',
  password: '123456',
});

// em.create() automatically calls persist(), so we just need to flush
await em.flush();

// alternatively, you can persist manually:
const user2 = em.create(User, { ... }, { persist: false });
em.persist(user2);
await em.flush();
```

To understand `flush`, let's first define what managed entity is: An entity is managed if it's fetched from the database (via [`em.find()`](/api/core/class/EntityManager#find)) or registered as new through [`em.persist()`](/api/core/class/EntityManager#persist) and flushed later (only after the `flush` it becomes managed).

[`em.flush()`](/api/core/class/EntityManager#flush) will go through all managed entities, compute appropriate change sets and perform according database queries. As an entity loaded from the database becomes managed
automatically, you do not have to call persist on those, and flush is enough to update them.

```ts
const user = await em.findOne(User, 1);
user.bio = '...';

// no need to persist `user` as it's already managed by the EM
await em.flush();
```

Let's try to create our first record in the database, add this to the `server.ts` file:

```ts title='server.ts'
import { MikroORM } from '@mikro-orm/sqlite';
import config from './mikro-orm.config.js';
import { User } from './modules/user/user.entity.js';

const orm = await MikroORM.init(config);

// create new user entity instance via em.create()
const user = orm.em.create(User, {
  email: 'foo@bar.com',
  fullName: 'Foo Bar',
  password: '123456',
});

// em.create() auto-persists, so just flush
await orm.em.flush();

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

// create and persist the user in the forked context
const user = em.create(User, {
  email: 'foo@bar.com',
  fullName: 'Foo Bar',
  password: '123456',
});
await em.flush();
```

Running `npm start` again, you get past the global context validation error, but only to find another one:

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

You can see there is a select query to load the user. This is because you used a new fork, that is clean by default—it has an empty Identity Map, and therefore it needs to load the entity from the database. In the previous example, you already had it present by the time you were calling `em.findOne()`. You queried the entity by its primary key, and such a query will always first check the identity map and prefer the results from it instead of querying the database.

### Refreshing loaded entities

The behavior described above is often what you want and serves as a first-level cache, but what if you always want to reload that entity, regardless of the existing state? There are several options:

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

Running the `npm start` script again, you get the following:

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

The `WrappedEntity` instance also holds the state of the entity at the time it was loaded or flushed - this state is then used by the Unit of Work during flush to compute the differences. Another use case is serialization, we can use the `toObject()`, `toPOJO()` and `toJSON()` methods to convert the entity instance to a plain JavaScript object.

## Alternative Approaches

In this guide, we use `defineEntity` with a class, which provides a simple, decorator-free way to define entities. The `defineEntity` helper can also be used without a class - it will infer the entity type automatically using `InferEntity<typeof Schema>`. However, MikroORM supports multiple ways to define entities:

### Using Decorators

You can define entities using class decorators like `@Entity()`, `@Property()`, `@ManyToOne()`, etc. MikroORM v7 supports both legacy (experimental) decorators and the new ES spec decorators:

```ts
// Legacy decorators (requires experimentalDecorators)
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

// ES spec decorators (no config needed)
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  fullName!: string;

  @Property()
  email!: string;
}
```

When using decorators, you'll need to choose a metadata provider to handle type inference. See the [Using Decorators](../using-decorators.md) guide for a comprehensive overview of:

- Legacy vs ES spec decorators and their differences
- `TsMorphMetadataProvider` for DRY entity definitions
- `ReflectMetadataProvider` for lightweight setup

### Folder-based Discovery

Instead of explicitly listing entities, you can use glob patterns to discover entities automatically:

```ts
export default defineConfig({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
});
```

This is particularly useful for large projects with many entities. See [Folder-based Discovery](../folder-based-discovery.md) for details.

:::tip ESM and TypeScript file resolution

When using folder-based discovery in an ESM project with test runners like Vitest, you may encounter an error like `TypeError: Unknown file extension ".ts"` (ERR_UNKNOWN_FILE_EXTENSION). This happens because the dynamic import of your entities fails to resolve TypeScript files - MikroORM performs these imports internally, and tools like Vitest cannot automatically transform them.

To work around this, you can override the `dynamicImportProvider` option in your ORM config. This allows you to use an `import` call defined inside the context of your ESM application:

```ts title='mikro-orm.config.ts'
export default defineConfig({
  // ...
  // for vitest to get around `TypeError: Unknown file extension ".ts"` (ERR_UNKNOWN_FILE_EXTENSION)
  dynamicImportProvider: id => import(id),
});
```

This tells MikroORM to use your application's import context instead of its own, allowing proper TypeScript file resolution.

:::

Check the [Defining Entities](../defining-entities.md) documentation for more examples of all entity definition approaches.

## ⛳ Checkpoint 1

Currently, our app consists of a single `User` entity and a `server.ts` file where we tested how to work with it using [`EntityManager`](/api/core/class/EntityManager). You can find working StackBlitz for the current state here:

> We use in-memory database, SQLite feature available via special database name `:memory:`.

This is our [`server.ts` file](https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-1?file=src%2Fserver.ts) so far:

<iframe width="100%" height="800" frameborder="0" src="https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-1?embed=1&ctl=1&view=editor&file=src%2Fserver.ts">
</iframe>
