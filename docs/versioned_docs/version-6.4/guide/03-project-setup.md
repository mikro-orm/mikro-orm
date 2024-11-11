---
title: 'Chapter 3: Project Setup'
---

So far we were just toying around with our entities, let's start building something real. We said we will use Fastify as a web server, and Vitest for testing it. Let's set that up, create our first endpoint and test it.

## Fastify

Let's create new file `app.ts` inside `src` directory, and export a `bootstrap` function from it, where we create the fastify app instance. Remember how we were forking the [`EntityManager`](/api/core/class/EntityManager) to get around the global context validation? For web servers, we can leverage middlewares, or in fastify hooks, to achieve unique request contexts automatically. MikroORM provides a handy helper called `RequestContext` which can be used to create the fork for each request. The [`EntityManager`](/api/core/class/EntityManager) is aware of this class and tries to get the right context from it automatically.

:::info How does `RequestContext` helper work?

Internally all [`EntityManager`](/api/core/class/EntityManager) methods that work with the Identity Map (e.g. [`em.find()`](/api/core/class/EntityManager#find) or [`em.getReference()`](/api/core/class/EntityManager#getReference)) first call `em.getContext()` to access the contextual fork. This method will first check if we are running inside `RequestContext` handler and prefer the [`EntityManager`](/api/core/class/EntityManager) fork from it.

```ts
// we call em.find() on the global EM instance
const res = await orm.em.find(Book, {});

// but under the hood this resolves to
const res = await orm.em.getContext().find(Book, {});

// which then resolves to
const res = await RequestContext.getEntityManager().find(Book, {});
```

The `RequestContext.getEntityManager()` method then checks `AsyncLocalStorage` static instance we use for creating new EM forks in the `RequestContext.create()` method.

The [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) class from Node.js core is the magician here. It allows us to track the context throughout the async calls. It allows us to decouple the [`EntityManager`](/api/core/class/EntityManager) fork creation (usually in a middleware as shown in the previous section) from its usage through the global [`EntityManager`](/api/core/class/EntityManager) instance.

:::

```ts title='app.ts'
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { fastify } from 'fastify';

export async function bootstrap(port = 3001) {
  const orm = await MikroORM.init();
  const app = fastify();

  // register request context hook
  app.addHook('onRequest', (request, reply, done) => {
    RequestContext.create(orm.em, done);
  });

  // shut down the connection when closing the app
  app.addHook('onClose', async () => {
    await orm.close();
  });

  // register routes here
  // ...

  const url = await app.listen({ port });

  return { app, url };
}
```

And use this function in the `server.ts` file - you can wipe all the code you had so far and replace it with the following:

```ts title='server.ts'
import { bootstrap }  from './app.js';

try {
  const { url } = await bootstrap();
  console.log(`server started at ${url}`);
} catch (e) {
  console.error(e);
}
```

Now hitting the `npm start` again, you should see something like this:

```
[info] MikroORM version: 5.4.3
[discovery] ORM entity discovery started, using TsMorphMetadataProvider
[discovery] - processing 4 files
[discovery] - processing entity Article (./blog-api/src/modules/article/article.entity.ts)
[discovery] - using cached metadata for entity Article
[discovery] - processing entity Tag (./blog-api/src/modules/article/tag.entity.ts)
[discovery] - using cached metadata for entity Tag
[discovery] - processing entity User (./blog-api/src/modules/user/user.entity.ts)
[discovery] - using cached metadata for entity User
[discovery] - processing entity BaseEntity (./blog-api/src/modules/common/base.entity.ts)
[discovery] - using cached metadata for entity BaseEntity
[discovery] - entity discovery finished, found 5 entities, took 78 ms
[info] MikroORM successfully connected to database sqlite.db
server started at http://127.0.0.1:3001
```

The server is running, good! To stop it, press `CTRL + C`.

### User profile endpoint

Let's add our first endpoint - `GET /article` which lists all existing articles. It is a public endpoint that can take `limit` and `offset` query parameters and return requested items together with the total count of all available articles.

We could use `em.count()` to get the number of entities, but since we want to return the count next to the paginated list of entities, we have a better way - `em.findAndCount()`. This method serves exactly this purpose, retuning the paginated list with the total count of items.

```ts title='app.ts'
app.get('/article', async request => {
  const { limit, offset } = request.query as { limit?: number; offset?: number };
  const [items, total] = await orm.em.findAndCount(Article, {}, {
    limit, offset,
  });

  return { items, total };
});
```

## Basic Dependency Injection container

Before we get to testing the first endpoint, let's refactor a bit to make the setup more future-proof. Add a new `src/db.ts` file, which will serve as a simple Dependency Injection (DI) container. It will export `initORM()` function that will first initialize the ORM and cache it into memory, so the following calls will return the same instance. Thanks to top-level await, we could just initialize the ORM and export it right ahead, but soon we will want to alter some options before we do so, for testing purposes, and having a function like this will help in achieving that.

> Note that we are importing all of `EntityManager`, `EntityRepository`, `MikroORM`, `Options` from the `@mikro-orm/sqlite` package - those exports are typed to the `SqliteDriver`.

```ts title='db.ts'
import { EntityManager, EntityRepository, MikroORM, Options } from '@mikro-orm/sqlite';

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  article: EntityRepository<Article>;
  user: EntityRepository<User>;
  tag: EntityRepository<Tag>;
}

let cache: Services;

export async function initORM(options?: Options): Promise<Services> {
  if (cache) {
    return cache;
  }

  const orm = await MikroORM.init(options);

  // save to cache before returning
  return cache = {
    orm,
    em: orm.em,
    article: orm.em.getRepository(Article),
    user: orm.em.getRepository(User),
    tag: orm.em.getRepository(Tag),
  };
}
```

And use it in the `app.ts` file instead of initializing the ORM directly:

```ts title='app.ts'
import { RequestContext } from '@mikro-orm/core';
import { fastify } from 'fastify';
import { initORM } from './db.js';

export async function bootstrap(port = 3001) {
  const db = await initORM();
  const app = fastify();

  // register request context hook
  app.addHook('onRequest', (request, reply, done) => {
    RequestContext.create(db.em, done);
  });

  // shut down the connection when closing the app
  app.addHook('onClose', async () => {
    await db.orm.close();
  });

  // register routes here
  app.get('/article', async request => {
    const { limit, offset } = request.query as { limit?: number; offset?: number };
    const [items, total] = await db.article.findAndCount({}, {
      limit, offset,
    });

    return { items, total };
  });

  const url = await app.listen({ port });

  return { app, url };
}
````

:::info Importing `EntityManager` and `EntityRepository` from driver package

While [`EntityManager`](/api/core/class/EntityManager) and [`EntityRepository`](/api/core/class/EntityRepository) classes are provided by the `@mikro-orm/core` package, those are only the base - driver agnostic - implementations. One example of what that means is the `QueryBuilder` - as an SQL concept, it has no place in the `@mikro-orm/core` package, instead, an extension of the [`EntityManager`](/api/core/class/EntityManager) called `SqlEntityManager` is provided by the SQL driver packages (it is defined in `@mikro-orm/knex` package and reexported in every SQL driver packages that depend on it). This `SqlEntityManager` class provides the additional SQL related methods, like `em.createQueryBuilder()`.

For convenience, the `SqlEntityManager` class is also reexported under [`EntityManager`](/api/core/class/EntityManager) alias. This means we can do `import { EntityManager } from '@mikro-orm/sqlite'` to access it.

Under the hood, MikroORM will always use this driver-specific [`EntityManager`](/api/core/class/EntityManager) implementation (you can verify that by `console.log(orm.em)`, it will be an instance of `SqlEntityManager`), but for TypeScript to understand it, you will need to use the driver package to import it. The same applies to the [`EntityRepository`](/api/core/class/EntityRepository) and `SqlEntityRepository` classes.

```ts
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite'; // or any other driver package
```

You can also use `MikroORM`, `defineConfig` and `Options` exported from the driver package, it works similarly, providing the driver type without the need to use generics.

:::

### What is `EntityRepository`

Entity repositories are thin layers on top of [`EntityManager`](/api/core/class/EntityManager). They act as an extension point, so you can add custom methods, or even alter the existing ones. The default [`EntityRepository`](/api/core/class/EntityRepository) implementation just forwards the calls to the underlying [`EntityManager`](/api/core/class/EntityManager) instance.

[`EntityRepository`](/api/core/class/EntityRepository) class carries the entity type, so we do not have to pass it to every `find` or `findOne` calls.

Note that there is no such thing as "flushing a repository" - it is just a shortcut to [`em.flush()`](/api/core/class/EntityManager#flush). In other words, we always flush the whole Unit of Work, not just a single entity that this repository represents.

## Testing the endpoint

The first endpoint is ready, let's test it. You already have `vitest` installed and available via `npm test`, now add a test case. Put it into the `test` folder and name the file with `.test.ts` extension so `vitest` knows it is a test file.

So how should you test the endpoint? Fastify offers an easy way to test endpoints via `app.inject()`, all you need to do is to create the fastify app instance inside the test case (you already have the `bootstrap` method for that). But that would be testing against your production database, you don't want that!

Let's create one more utility file before we get to the first test, and put it into the `test` folder too, but without the `.test.ts` suffix - let's call it `utils.ts`. We will define a function called `initTestApp` that initializes the ORM with overridden options for testing, create the schema and bootstrap our fastify app, all in one go. It will take the `port` number as a parameter, again to allow easy parallel runs when testing - every test case will have its own in-memory database and a fastify app running on its own port.

```ts title='utils.ts'
import { bootstrap } from '../src/app.js';
import { initORM } from '../src/db.js';
import config from '../src/mikro-orm.config.js';

export async function initTestApp(port: number) {
  // this will create all the ORM services and cache them
  const { orm } = await initORM({
    // first, include the main config
    ...config,
    // no need for debug information, it would only pollute the logs
    debug: false,
    // we will use in-memory database, this way we can easily parallelize our tests
    dbName: ':memory:',
    // this will ensure the ORM discovers TS entities, with ts-node, ts-jest and vitest
    // it will be inferred automatically, but we are using vitest here
    // preferTs: true,
  });

  // create the schema so we can use the database
  await orm.schema.createSchema();

  const { app } = await bootstrap(port);

  return app;
}
```

And now the test case, finally. Currently, there is no data as we are using an empty in-memory database, fresh for each test run, so the article listing endpoint will return just an empty array - we will handle that in a moment.

> Notice that we are using `beforeAll` hook to initialize the app and `afterAll` to tear it down - the `app.close()` will result in the `onClose` hook that calls `orm.close()`. Without that, the process would hang.

```ts title='article.test.ts'
import { afterAll, beforeAll, expect, test } from 'vitest';
import { FastifyInstance } from 'fastify';
import { initTestApp } from './utils.js';

let app: FastifyInstance;

beforeAll(async () => {
  // we use different ports to allow parallel testing
  app = await initTestApp(30001);
});

afterAll(async () => {
  // we close only the fastify app - it will close the database connection via onClose hook automatically
  await app.close();
});

test('list all articles', async () => {
  // mimic the http request via `app.inject()`
  const res = await app.inject({
    method: 'get',
    url: '/article',
  });

  // assert it was successful response
  expect(res.statusCode).toBe(200);

  // with expected shape
  expect(res.json()).toMatchObject({
    items: [],
    total: 0,
  });
});
```

Now run `npm test` - but wait, something is broken again:

```
FAIL  test/article.test.ts [ test/article.test.ts ]
TypeError: Unknown file extension ".ts" for /blog-api/src/modules/article/article.entity.ts
```

So the dynamic import of our entities fails to resolve TypeScript files. This is one of the gotchas of ECMAScript modules we mentioned earlier. And luckily, we have a workaround for it! Vitest automatically adds TypeScript support to `import` calls from the context of your test - the problem is that MikroORM does such calls from inside its CommonJS codebase, so vitest is not able to detect it. What we can do instead is to override the `dynamicImportProvider`, a config option used for the actual importing - by the way, you could register any kind of transpiler like this.

All we need to do is to use an `import` call defined inside the context of our ESM application (not necessarily inside the test), let's add it to our ORM config:

```ts title='mikro-orm.config.ts'
// for vitest to get around `TypeError: Unknown file extension ".ts"` (ERR_UNKNOWN_FILE_EXTENSION)
dynamicImportProvider: id => import(id),
```

Run `npm test` again, you should be good to go:

```
 ✓ test/article.test.ts (1)

Test Files  1 passed (1)
    Tests  1 passed (1)
  Start at  15:56:41
  Duration  876ms (transform 264ms, setup 0ms, collect 300ms, tests 147ms)


 PASS  Waiting for file changes...
     press h to show help, press q to quit
```

### Note about unit tests

It  might be tempting to skip the `MikroORM.init()` phase in some of your unit tests that do not require database connection, but the `init` method is **doing more** than just establishing that. The most important part of that method is metadata discovery, where the ORM checks all the entity definitions and sets up the default values for various metadata options (mainly for naming strategy and bidirectional relations).

The discovery phase is **required for [propagation](../propagation.md) to work**. But worry not, you can initialize the ORM without connecting to the database, just provide `connect: false` to the ORM config:

```ts
const orm = await MikroORM.init({
  // ...
  connect: false,
});
```

Since v6, you can also use the new `initSync()` method to instantiate the ORM synchronously. This will run the discovery only, and skip the database connection. When you first try to query the database (or work with it in any way that requires the connection), the ORM will connect to it lazily.

> The sync method never connects to the database, so `connect: false` is implicit.

```ts
const orm = MikroORM.initSync({
  // ...
});
```

## Seeding the database

There are many ways how to go about seeding your testing database. The obvious way is to do it directly in your test, for example in the `beforeAll` hook, right after you initialize the ORM.

One alternative to that is using the Seeder, an ORM package (available via `@mikro-orm/seeder`), which offers utilities to populate our database with (not necessarily) fake data.

> We will be using Seeder for populating the test database with fake data, but it is a valid approach to have a seeder that creates initial data for a production database too - we could create the default set of article tags this way, or the initial admin user. You can set up a hierarchy of seeders or call them one by one.

Let's install the seeder package and use the CLI to generate our test seeder:

```bash npm2yarn
npm install @mikro-orm/seeder
```

Next step will be to register the SeedManager extension in your ORM config, this will make it available via `orm.seeder` property:

```ts
import { defineConfig } from '@mikro-orm/sqlite';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  // ...
  extensions: [SeedManager],
});
```

> Other extensions you can use are `SchemaGenerator`, `Migrator` and `EntityGenerator`. The `SchemaGenerator` (as well as `MongoSchemaGenerator`) is registered automatically as it does not require any 3rd party dependencies to be installed.

Now let's try to create a new seeder named `test`:

```bash
npx mikro-orm-esm seeder:create test
```

This will create `src/seeders` directory and a `TestSeeder.ts` file inside it, with a skeleton of your new seeder:

```ts title='TestSeeder.ts'
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

export class TestSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {}

}
```

We can use the [`em.create()`](/api/core/class/EntityManager#create) function we described earlier. It effectively calls `em.persist(entity)` before it returns the created entity, so you don't even need to do anything with the entity itself, calling [`em.create()`](/api/core/class/EntityManager#create) on its own will be enough. Time to test it!

```ts title='TestSeeder.ts'
export class TestSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    em.create(User, {
      fullName: 'Foo Bar',
      email: 'foo@bar.com',
      password: 'password123',
      articles: [
        {
          title: 'title 1/3',
          description: 'desc 1/3',
          text: 'text text text 1/3',
          tags: [{ id: 1, name: 'foo1' }, { id: 2, name: 'foo2' }],
        },
        {
          title: 'title 2/3',
          description: 'desc 2/3',
          text: 'text text text 2/3',
          tags: [{ id: 2, name: 'foo2' }],
        },
        {
          title: 'title 3/3',
          description: 'desc 3/3',
          text: 'text text text 3/3',
          tags: [{ id: 2, name: 'foo2' }, { id: 3, name: 'foo3' }],
        },
      ],
    });
  }

}
```

Then you need to run the `TestSeeder`, let's do that in your `initTestApp` helper, right after we call `orm.schema.createSchema()`:

```ts title='utils.ts'
await orm.schema.createSchema();
await orm.seeder.seed(TestSeeder);
```

And adjust the test assertion, as we now get 3 articles in the feed:

```ts title='article.test.ts'
expect(res.json()).toMatchObject({
  items: [
    { author: 1, slug: 'title-13', title: 'title 1/3' },
    { author: 1, slug: 'title-23', title: 'title 2/3' },
    { author: 1, slug: 'title-33', title: 'title 3/3' },
  ],
  total: 3,
});
```

Now run `npm test` to verify things work as expected.

That should be enough for now, but don't you worry, we will get back to this topic later on.

## SchemaGenerator

Earlier in the guide, when we needed to create the database for testing, we used the `SchemaGenerator` to recreate our database. Let's talk a bit more about this class.

[`SchemaGenerator`](../schema-generator) is responsible for generating the SQL queries based on your entity metadata. In other words, it translates the entity definition into the Data Definition Language (DDL). Moreover, it can also understand your current database schema and compare it with the metadata, resulting in queries needed to put your schema in sync.

It can be used programmatically:

```ts
// to get the queries
const diff = await orm.schema.getUpdateSchemaSQL();
console.log(diff);

// or to run the queries
await orm.schema.updateSchema();
```

> With the `orm.schema.updateSchema()` you could easily set up the same behavior as TypeORM has via `synchronize: true`, just put that into your app right after the ORM gets initialized (or into some app bootstrap code). Keep in mind this approach can be destructive and is discouraged - you should always verify what queries the `SchemaGenerator` produced before you run them!

Or via CLI:

> To run the queries, replace `--dump` with `--run`.

```bash
npx mikro-orm-esm schema:create --dump  # Dumps create schema SQL
npx mikro-orm-esm schema:update --dump  # Dumps update schema SQL
npx mikro-orm-esm schema:drop --dump    # Dumps drop schema SQL
```

Your production database (the one in `sqlite.db` file in the root of your project) is probably out of sync, as we were mostly using the in-memory database inside the tests. Let's try to sync it via the CLI. First, run it with the `--dump` (or `-d`) flag to see what queries it generates, then run them via `--run` (or `-r`):

```bash
# first check what gets generated
npx mikro-orm-esm schema:update --dump

# and when its fine, sync the schema
npx mikro-orm-esm schema:update --run
```

> If this command does not work and produces some invalid queries, you can always recreate the schema from scratch, by first calling `schema:drop --run`.

Working with `SchemaGenerator` can be handy when prototyping the initial app, or especially when testing, where you might want to have many databases with the latest schema, regardless of how your production schema looks like. But beware, it can be very dangerous when used on a real production database. Luckily, we have a solution for that - the migrations.

## Migrations

> To use migrations you first need to install `@mikro-orm/migrations` package for SQL drivers (or `@mikro-orm/migrations-mongodb` for MongoDB), and register the `Migrator` extension in your ORM config.

MikroORM has integrated support for migrations via [umzug](https://github.com/sequelize/umzug). It allows you to generate migrations with current schema differences, as well as manage their execution. By default, each migration will be executed inside a transaction, and all of them will be wrapped in one master transaction, so if one of them fails, everything will be rolled back.

Let's install the migrations package and try to create your first migration:

```bash npm2yarn
npm install @mikro-orm/migrations
```

Then register the `Migrator` extension in your ORM config:

```ts
import { defineConfig } from '@mikro-orm/sqlite';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations';

export default defineConfig({
  // ...
  extensions: [SeedManager, Migrator],
});
```

And finally try to create your first migration:

```bash
npx mikro-orm-esm migration:create
```

If you followed the guide closely, you should see this message:

```
No changes required, schema is up-to-date
```

That is because you just synchronized the schema by called `npx mikro-orm-esm schema:update --run` a moment ago. You have two options here, drop the schema first, or a less destructive one - an initial migration.

### Initial migration

If you want to start using migrations, and you already have the schema generated, the `--initial` flag will help with keeping the existing schema, while generating the first migration based only on the entity metadata. It can be used only if the schema is empty or fully up-to-date. The generated migration will be automatically marked as executed if your schema already exists - if not, you will need to execute it manually as any other migration, via `npx mikro-orm-esm migration:up`.

> Initial migration can be created only if there are no migrations previously generated or executed. If you are starting fresh, and you have no schema yet, you don't need to use the `--inital` flag, a regular migration will do the job too.

```sh
npx mikro-orm migration:create --initial
```

This will create the initial migration in the `src/migrations` directory, containing queries from `schema:create` command. The migration will be automatically marked as executed because our schema was already in sync.

### Migration class

Let's take a look at the generated migration. You can see there is a class that extends the `Migration` abstract class from the `@mikro-orm/migrations` package:

```ts title='Migration20220913202829.ts'
import { Migration } from '@mikro-orm/migrations';

export class Migration20220913202829 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `tag` (`id` integer not null primary key autoincrement, `created_at` datetime not null, `updated_at` datetime not null, `name` text not null);');
    // ...
  }

}
```

To support undoing those changed, you can implement the `down` method, which throws an error by default.

:::info Down migrations and SQLite

MikroORM will generate the down migrations automatically (although not for the initial migration, for security concerns), with one exception - the SQLite driver, due to its limited capabilities. If you use any other driver, a down migration will be generated (unless it's an initial migration).

:::

> You can also execute queries inside the `up()`/`down()` method via `this.execute('...')`, which will run queries in the same transaction as the rest of the migration. The `this.addSql('...)` method also accepts instances of knex. Knex instance can be accessed via `this.getKnex()`;

Read more about migrations in the [documentation](../migrations).

### One more entity

The migrations are set up, let's test them by adding one more entity - the `Comment`, again belonging to the article module, so into `src/modules/article/comment.entity.ts`.

```ts title='comment.entity.ts'
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { Article } from './article.entity.js';
import { User } from '../user/user.entity.js';
import { BaseEntity } from '../common/base.entity.js';

@Entity()
export class Comment extends BaseEntity {

  @Property({ length: 1000 })
  text!: string;

  @ManyToOne()
  article!: Article;

  @ManyToOne()
  author!: User;

}
```

and a OneToMany inverse side in `Article` entity:

```ts
@OneToMany({ mappedBy: 'article', eager: true, orphanRemoval: true })
comments = new Collection<Comment>(this);
```

Don't forget to add the repository to our simple DI container too:

```ts file='db.ts'
export interface Services {
  orm: MikroORM;
  em: EntityManager;
  user: UserRepository;
  article: EntityRepository<Article>;
  // highlight-next-line
  comment: EntityRepository<Comment>;
  tag: EntityRepository<Tag>;
}

export async function initORM(options?: Options): Promise<Services> {
  // ...

  return cache = {
   orm,
   em: orm.em,
   user: orm.em.getRepository(User),
   article: orm.em.getRepository(Article),
   // highlight-next-line
   comment: orm.em.getRepository(Comment),
   tag: orm.em.getRepository(Tag),
  };
}
```

> We are using two new options here, `eager` and `orphanRemoval`:
>
> - `eager: true` will automatically populate this relation, just like if you would use `populate: ['comments']` explicitly.
> - `orphanRemoval: true` is a special type of cascading, any entity removed from such collection will be deleted from the database, as opposed to being just detached from the relationship (by setting the foreign key to `null`).

Now create the migration via CLI and run it. And just for the sake of testing, also try the other migration-related commands:

```bash
# create new migration based on the schema difference
npx mikro-orm-esm migration:create

# list pending migrations
npx mikro-orm-esm migration:pending

# run the pending migrations
npx mikro-orm-esm migration:up

# list executed migrations
npx mikro-orm-esm migration:list
```

You should see output similar to this:

```bash
npx mikro-orm-esm migration:create
Migration20220913205718.ts successfully created
```

```bash
npx mikro-orm-esm migration:pending

┌─────────────────────────┐
│ Name              │
├─────────────────────────┤
│ Migration20220913205718 │
└─────────────────────────┘
```

```bash
npx mikro-orm-esm migration:up

Processing 'Migration20220913205718'
Applied 'Migration20220913205718'
Successfully migrated up to the latest version
```

```bash
npx mikro-orm-esm migration:list

┌─────────────────────────┬──────────────────────────┐
│ Name              │ Executed at          │
├─────────────────────────┼──────────────────────────┤
│ Migration20220913202829 │ 2022-09-13T18:57:12.000Z │
│ Migration20220913205718 │ 2022-09-13T18:57:27.000Z │
└─────────────────────────┴──────────────────────────┘
```

:::info Migration snapshots

Creating new migration will automatically save the target schema snapshot into the migrations folder. This snapshot will be then used if you try to create a new migration, instead of using the current database schema. This means that if you try to create new migration before you run the pending ones, you still get the right schema diff.

> Snapshots should be versioned just like the regular migration files.

Snapshotting can be disabled via `migrations.snapshot: false` in the ORM config.

:::

### Running migrations automatically

Before we call it a day, let's automate running the migrations a bit - we can use the `Migrator` programmatically, in a similar way like the `SchemaGenerator`. We want to run them during our app bootstrap cycle, before it starts to accept connections, so a good place for that is our `bootstrap` function, right after we initialize the ORM.

```ts title='app.ts'
export async function bootstrap(port = 3001, migrate = true) {
  const db = await initORM();

  if (migrate) {
    // sync the schema
    await db.orm.migrator.up();
  }

  // ...
}
```

We need to do this conditionally, as we want to run the migrations only for the production database, not for our testing ones (as they use the `SchemaGenerator` directly, together with the `Seeder`). Don't forget to pass `false` when calling the `bootstrap()` function from our test case:

```ts title='utils.ts'
export async function initTestApp(port: number) {
  const { orm } = await initORM({ ... });

  await orm.schema.createSchema();
  await orm.seeder.seed(TestSeeder);

  const { app } = await bootstrap(port, false); // <-- here

  return app;
}
```

## ⛳ Checkpoint 3

We now have 4 entities, a working web app with a single get endpoint and a basic test case for it. We also set up migrations and seeding. This is our `app.ts` right now:

> Due to the nature of how the ESM support in ts-node works, it is not possible to use it inside StackBlitz project - we need to use `node --loader` instead. We also use in-memory database, SQLite feature available via special database name `:memory:`.

This is our [`app.ts` file](https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-3?file=src%2Fapp.ts) after this chapter:

<iframe width="100%" height="800" frameborder="0" src="https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-3?embed=1&ctl=1&view=editor&file=src%2Fapp.ts">
</iframe>
