---
slug: mikro-orm-6-released
title: 'MikroORM 6: Polished'
author: Martin Adámek
authorTitle: Author of MikroORM
authorURL: https://github.com/B4nan
authorImageURL: https://avatars1.githubusercontent.com/u/615580?s=460&v=4
authorTwitter: B4nan
tags: [typescript, javascript, node, sql]
---

After more than a year in the development, I am thrilled to announce the next major version of MikroORM has just become stable. It brings many improvements throughout the whole system, and doubles down on type-safety and strictness.

![](/img/blog/improving.jpg)

<!--truncate-->

### Quick summary of 5.x releases

Before we dive into all the things v6, let’s mention some of the important additions from 5.x feature releases:

- `em.upsert()` and `em.upsertMany()`
- custom pivot table entity
- automatic relation discovery
- fulltext search support
- explicit serialization
- `rel()` and `ref()` helpers
- new `Collection` helpers (`map/filter/reduce/exists/find/indexBy/...`)

But enough of the history lesson, let’s talk about the future!

## Type safety

![](/img/blog/typesafe.jpg)

One of the biggest improvements in v6 is by far the overhauled typing. While v5 brought a base for this with strict `populate` hint and the `Loaded` type, v6 doubles down on it. Many of the internal types have been refactored to improve both strictness and autocomplete capabilities. So what actually changed?

### Strict partial loading

The most visible part is the partial loading, also known as the `fields` option. Let's take a look at this example:

```ts
// article is typed to `Loaded<Article, never, 'title' | 'author.email'>`
const article = await em.findOneOrFail(Article, 1, { 
  fields: ['title', 'author.email'],
});

const id = article.id; // ok, PK is selected automatically
const title = article.title; // ok, title is selected
const publisher = article.publisher; // fail, not selected
const author = article.author.id; // ok, PK is selected automatically
const email = article.author.email; // ok, selected
const name = article.author.name; // fail, not selected
```

The `Loaded` type now understands partial loading too, and this example will fail to compile because of accessing the author's name which is not loaded. Note that we also skipped the `populate` hint from this example, as it is inferred from our partial loading hint.

What if you wanted to exclude just a few columns instead of white-listing what you want to load? We got you covered, v6 adds a new `exclude` option which does exactly that - and it is strictly typed as well!

```ts
// article is typed to `Loaded<User, never, never, 'email'>`
const user = await em.findOneOrFail(User, 1, { 
  exclude: ['email'],
});

const id = user.id; // ok, PK is selected automatically
const name = user.name; // ok, selected
const email = user.email; // fail, excluded
```

Check out the [live demo](https://stackblitz.com/edit/mikro-orm-v6-strict-partial-loading?file=basic.test.ts) on StackBlitz.

### `Opt` type

While v5 introduced the strict typing for `em.create()`, it was a bit cumbersome, as we now have to distinguish properties with a runtime default (so technically optional properties, but on type level they are seen as required). A new symbol called `OptionalProps` was introduced to mark such defaults, so they are not required in the `em.create` type. The symbol approach was mainly problematic when you wanted to define some properties like this in a custom base entity.

In v6, you can leverage the new `Opt` type, which is used on property level (as opposed to the entity level `OptionalProps` symbol). This effectively removes the problems with extensions and added generics. You can use the type in two ways:

- with generics: `middleName: Opt<string> = '';`
- with intersections: `middleName: string & Opt = '';`

Both will work the same, and can be combined with the `OptionalProps` symbol approach.

```ts
import { Opt, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  // highlight-next-line
  middleName: string & Opt = '';

  @Property()
  lastName!: string;

}
```

### `Hidden` type

Similarly to the `Opt` type used for marking optional properties, we have the `Hidden` type (and `HiddenProps` symbol) for marking properties that should be hidden when serializing.

```ts
@Entity()
class Book {

  @Property({ hidden: true })
  hiddenField: Hidden<Date> = Date.now();

  @Property({ hidden: true, nullable: true })
  otherHiddenField?: string & Hidden;

}
```

Those properties won't be accessible on the DTO:

```ts
const book = await em.findOneOrFail(Book, 1);
const bookDTO = wrap(book).toObject();

bookDTO.hiddenField; // fails
```

### Populating all relations

Previously, you were allowed to populate all relations via `populate: true`, but it wasn't type-safe - the resulting `Loaded` type was not respecting this option. In v6, you can use `populate: ['*']` which will work with the `Loaded` type correctly.

```ts
const user = await em.findOneOrFail(User, 1, { populate: ['*'] });
```

The `populate` hint now also accepts `false` as a way to disable eager loading of relations (those marked with `eager: true`).

### Populate based on filter

When you filter by a nested relation value, the target table is automatically joined, but nothing is selected, the join is only used for the where condition. In v6, you can use `populate: ['$infer']` to automatically populate such relations:

```ts
// this will populate all the books and their authors, all via a single query
const tags = await em.find(BookTag, {
  books: { author: { name: '...' } },
}, { 
  populate: ['$infer'],
});
```

### Primary key type inference

If you use composite keys or non-standard primary key names, you probably know about `PrimaryKeyType` and `PrimaryKeyProp` symbols. While they worked fine, there was no need to have two of them—and people were often confused how they work, as one required a union type of primary property names, while the other was a tuple type. This is now consolidated into a single `PrimaryKeyProp` symbol, which accepts a tuple with property names

```diff
@Entity()
class Foo {

  @ManyToOne(() => Bar, { primary: true })
  bar!: Bar;

  @ManyToOne(() => Baz, { primary: true })
  baz!: Baz;

-  [PrimaryKeyType]?: [number, number];
-  [PrimaryKeyProp]?: 'bar' | 'baz';
+  [PrimaryKeyProp]?: ['bar', 'baz'];

}
```

Some methods and interfaces like `Ref` allowed you to pass in the primary key property via second generic type argument, this is now also removed in favor of the automatic inference.

### Simplified `BaseEntity`

The optional ORM `BaseEntity` used to have two generic parameters, one for the entity type and the other for the primary key type. They are both removed in v6. The former has been replaced with `this` type, the latter with the `PrimaryKeyProp` symbol.

```diff
-class User extends BaseEntity<User> { ... }
+class User extends BaseEntity { ... }
```

## Implicit serialization

![](/img/blog/godeeper.jpg)

Next, let's talk about the changes in serialization. There are two ways to serialize your entities—implicit via `wrap(entity).toObject()`, which is called automatically when you do `JSON.stringify(entity)`, and explicit via `serialize()` helper.

Implicit serialization now works entirely based on `populate` and `fields` hints. This means that, unless you explicitly marked some entity as populated via `wrap(entity).populated()`, it will be part of the serialized form only if it was part of the `populate` hint:

```ts
// let's say both Author and Book entity has a M:1 relation to Publisher entity
// we only populate the publisher relation of the Book entity
const user = await em.findOneOrFail(Author, 1, {
  populate: ['books.publisher'],
});

const dto = wrap(user).toObject();
console.log(dto.publisher); // only the FK, e.g. `123`
console.log(dto.books[0].publisher); // populated, e.g. `{ id: 123, name: '...' }`
```

Moreover, the implicit serialization now respects the partial loading hints too. Previously, all loaded properties were serialized, and partial loading worked only on the database query level. Since v6, we also prune the data on runtime. This means that unless the property is part of the partial loading hint (`fields` option), it won't be part of the DTO - only exception is the primary key, you can optionally hide it via `hidden: true` in the property options. The main difference here will be the foreign keys, those are often automatically selected as they are needed to build the entity graph, but will no longer be part of the DTO.

```ts
const user = await em.findOneOrFail(Author, 1, {
  fields: ['books.publisher.name'],
});

const dto = wrap(user).toObject();
// only the publisher's name will be available, previously there would be also `book.author`
// `{ id: 1, books: [{ id: 2, publisher: { id: 3, name: '...' } }] }`
```

This also works for embeddables, including nesting and object mode. And speaking of embeddables—they now also support the `fieldName` option, again, including the nesting and object mode, effectively allowing partial loading on the object embeddables (so JSON properties) too.

### `forceObject`

When you serialize an entity with unpopulated relation, it will result in a foreign key value, e.g. `book.author` will be number if you don't populate the `author` relation. In v6, you can use the `forceObject` serialization option to get an object there instead, e.g. `book.author` will be `{ id: 1 }` instead of just `1`.

To have the DTO properly typed, you can use the `Config` symbol, preferably in your own base entity, as this flag will affect all your entities globally:

```ts
import { Config, DefineConfig, PrimaryKey } from '@mikro-orm/core';

class BaseEntity {

  // highlight-next-line
  [Config]?: DefineConfig<{ forceObject: true }>;

  @PrimaryKey()
  id!: number;

}
```

The `DefineConfig` type will offer intellisense to the type config options. Right now, it only accepts a single property, but there might be more options like this going forward.

## Joined strategy

![](/img/blog/join.jpg)

The joined loading strategy was around for a while, but it had several implementation problems resulting in different behavior when compared to the default select-in strategy. But that actually changes now, the joined strategy is back on track and should be completely aligned with the select-in behavior.

So what actually changed? The most important part is the support for `populateWhere: 'all'`, which is the default behavior, and means "populate the full relations regardless of the where condition". This was previously not working with the joined strategy, as it was reusing the same join clauses as the where clause. In v6, the joined strategy will use a separate join branch for the populated relations.

Since the strategies now behave the same, this finally unlocked the switch of the defaults for all the SQL drivers—the joined strategy is the new default. The joined strategy should usually be faster unless you join a lot of to-many relations (which would result in huge cartesian products).

## Filters on relations

Filters are now also applied to the relations, as part of `JOIN ON` condition. If a filter exists on a M:1 or 1:1 relation target, such an entity will be automatically joined, and when the foreign key is defined as `NOT NULL`, it will result in an `INNER JOIN` rather than `LEFT JOIN`. This is especially important for implementing soft deletes via filters, as the foreign key might point to a soft-deleted entity. When this happens, the automatic `INNER JOIN` will result in such a record not being returned at all.

## Cursor-based pagination

As an alternative to the offset-based pagination with `limit` and `offset`, you can now [paginate based on a cursor](https://mikro-orm.io/docs/entity-manager#cursor-based-pagination). A cursor is an opaque string that defines a specific place in ordered entity graph. You can use `em.findByCursor()` to access those options. Under the hood, it will call `em.find()` and `em.count()` just like the `em.findAndCount()` method, but will use the cursor options instead.

```ts
const currentCursor = await em.findByCursor(User, {}, {
  first: 10,
  after: previousCursor, // cursor instance
  orderBy: { id: 'desc' },
});

// to fetch next page
const nextCursor = await em.findByCursor(User, {}, {
  first: 10,
  after: currentCursor.endCursor, // opaque string
  orderBy: { id: 'desc' },
});

// to fetch next page
const nextCursor2 = await em.findByCursor(User, {}, {
  first: 10,
  after: { id: lastSeenId }, // entity-like POJO
  orderBy: { id: 'desc' },
});
```

The `Cursor` object provides the following interface:

```ts
Cursor<User> {
  items: [
    User { ... },
    User { ... },
    User { ... },
    ...
  ],
  totalCount: 50,
  length: 10,
  startCursor: 'WzRd',
  endCursor: 'WzZd',
  hasPrevPage: true,
  hasNextPage: true,
}
```

## Raw SQL fragments

![](/img/blog/let-the-raw.jpg)

The raw SQL fragments used to be detected automatically, which wasn't very precise. In v6, a new `raw` static helper is introduced to deal with this:

```ts
const users = await em.find(User, {
  [raw('lower(email)')]: 'foo@bar.baz',
});
```

This helper now replaces the removed `expr()` function, which was only an escape hatch for strictly typed `FilterQuery`, but wasn't required on runtime. It offers similar API, e.g. you can pass in a callback and get the current alias (based on the scope of execution) for given column:

```ts
const users = await em.find(User, {
  books: {
    [raw(alias => `lower(${alias}.title)`)]: 'some title'
  },
});
```

> Unlike in v5, this is now required way to mark your raw SQL fragments. Without it, you'd end up with the fragment being quoted as a regular string value.

The raw query can be also parametric, you can use `?` for values and `??` for keys:

```ts
const users = await em.find(User, {
  // this will result in properly quoted sql, e.g. `lower("email")`
  [raw('lower(??)', ['email'])]: 'foo@bar.baz',
});
```

And while the `raw` helper is the most universal one you can use, there is also a new `sql` tagged template function, which resolves to it too, if you prefer that kind of interface:

```ts
const users = await em.find(User, { [sql`lower(email)`]: 'foo@bar.baz' });
```

The fragments can be also used in your entity definition, to set raw database defaults. This is basically a shortcut for `prop.defaultRaw` option:

```ts
@Property({ default: sql`now()` })
createdAt = new Date();
```

And there is more to this, the `sql` function also offers several helper functions you can use, namely:

- `sql.ref()`
- `sql.now()`
- `sql.lower()`
- `sql.upper()`

Read more about this in [Using raw SQL query fragments](https://mikro-orm.io/docs/raw-queries) section.

## Subquery operators `$some`, `$none` and `$every`

In addition to the regular operators that translate to a real SQL operator expression (e.g. `>=`), you can also use the following collection operators:

| operator | description                                                     |
|----------|-----------------------------------------------------------------|
| `$some`  | Finds collections that have some record matching the condition. |
| `$none`  | Finds collections that have no records matching the condition.  |
| `$every`  | Finds collections where every record is matching the condition. |

This will be resolved as a subquery condition:

```ts
// finds all authors that have some book called `Foo`
const res1 = await em.find(Author, {
  books: { $some: { title: 'Foo' } },
});

// finds all authors that have no books called `Foo`
const res2 = await em.find(Author, {
  books: { $none: { title: 'Foo' } },
});

// finds all authors that have every book called `Foo`
const res3 = await em.find(Author, {
  books: { $every: { title: 'Foo' } },
});
```

The condition object can be also empty:

```ts
// finds all authors that have at least one book
const res1 = await em.find(Author, {
  books: { $some: {} },
});

// finds all authors that have no books
const res2 = await em.find(Author, {
  books: { $none: {} },
});
```

## Subquery joining

Subqueries are now better supported all over the place. Namely, you can join a subquery, as well as use a subquery in `qb.from()` method. One use case where this is handy is when you want to limit a joined relation, e.g. you have a 1:M collection, and you are interested only in the first item. In the following example, we join on the `Author.books` collection, overriding the implicit join branch with a custom subquery that has a `limit 1` on it.

```ts
// subquery can be a knex query builder as well
const subquery = await em.createQueryBuilder(Book, 'b')
  .where({ ... })
  .orderBy({ title: 'asc' }).limit(1);

const authors = await em.createQueryBuilder(Author, 'a')
  .select('*')
  // pass in both the property path and the subquery into the first argument as a tuple
  .leftJoinAndSelect(['a.books', subquery], 'b')
  // you can join more relations on top of the subquery join
  .leftJoinAndSelect('b.tags', 't')
  .getResultList();
```

## Dataloader support for references and collections

![](/img/blog/dataloader.jpg)

MikroORM now provide out-of-box support for loading `Reference` and `Collection` properties via dataloader. This feature needs to be enabled either globally (via ORM config) or locally (via `FindOptions`):

```ts
await MikroORM.init({
  dataloader: true,
});
```

Then you can use `Promise.all` on such objects, and it will automatically resolve to a batched select query:

```ts
const authors = await orm.em.find(Author, [1, 2, 3]);
await Promise.all(authors.map(author => author.books.load()));

// or when the dataloader support is not enabled globally:
await Promise.all(authors.map(author => author.books.load({ dataloader: true })));
```

This is especially useful with GraphQL since it automatically solves its notorious N+1 problem, without you even noticing it: you won't even need `Promise.all` since all the requests will occur within a single tick of the event loop and will be coalesced by the dataloader library.

More about this in the new [dataloader section](https://mikro-orm.io/docs/dataloaders). You can also check out [this example repository](https://github.com/darkbasic/mikro-orm-accounts-example) which leverages the dataloader (as well as Accounts.js library).

Shout out to **[Niccolò Belli](https://github.com/darkbasic)**, who contributed this feature and is working on a [more advanced version](https://github.com/darkbasic/mikro-orm-dataloaders) which supports dataloader also for `em.find()`.

## Logging improvements

Logging support has been greatly improved. You can now set up a custom logger context:

```ts
const res = await em.findAll(Author, { loggerContext: { meaningOfLife: 42 } });

// ...

class CustomLogger extends DefaultLogger {
  log(namespace: LoggerNamespace, message: string, context?: LogContext) {
    console.log(context?.meaningOfLife);
    // 42
  }
}
```

This context can be specific to the `EntityManager` fork, and will get the `EntityManager` ID automatically, so you can now track which request context/fork fired what queries.

```ts
const fork = em.fork({ loggerContext: { meaningOfLife: 42 } });
console.log(fork.id); // 3
// the logger context here will be { id: 3, meaningOfLife: 42 } 
const res = await fork.findAll(Author); 
```

The logger also supports query labels (simple way to alter what gets printed), index hints and query comments, and more.

```ts
const author = await em.findOne(Author, { id: 1 }, { logging: { label: 'Author Retrieval - /authors/me' } });
// [query] (Author Retrieval - /authors/me) select "a0".* from "author" as "a0" where "a0"."id" = 1 limit 1 [took 2 ms]
```

> The label can be also set via `loggerContext`.

Logging can be now selectively enabled/disabled via `FindOptions`. this works in both ways, if you globally disable logging, you can selectively enable it via `FindOptions`, as well as the other way around.

```ts
// MikroORM.init({ debug: true });
const author = await em.findOne(Author, { id: 1 }, { logging: { enabled: false } });
// Overrides config and displays no logger output

// ...

// MikroORM.init({ debug: false });
const author = await em.findOne(Author, { id: 1 }, { logging: { enabled: true } });
// Overrides config and displays logger output

// ...

// MikroORM.init({ debug: ['query-labels'] });
const author = await em.findOne(Author, { id: 1 }, { logging: { debugMode: ['query'] } });
// Overrides config and displays logger output for query
```

Read more about the logger improvements in the [logging section](https://mikro-orm.io/docs/logging).

## Improved change-tracking of M:N relations

M:N relations were always a bit problematic, the way they were implemented was only checking the owning side for changes. Thanks to the propagation of changes, it allowed working with the inverse side too, as long as the items you added/removed from the collection were loaded. 

```ts
const tag = await em.findOne(BookTag, 1);
// tag.books in an inverse side, this used to fail, but now it works!
tag.books.add(em.getReference(Book, 123));
await em.flush();
```

This restriction is no longer valid, and changes made to inverse sides of M:N collections are also tracked. Moreover, all queries that are altering pivot tables are now properly batched.

## Extending `EntityManager`

![](/img/blog/extension.jpg)

It is now possible to extend the `EntityManager` with your own custom methods. The type is inferred automatically from the config if possible.

```ts
import { MikroORM, EntityManager } from '@mikro-orm/sqlite';

class MyEntityManager extends EntityManager {

  myCustomMethod(base: number): number {
    return base * Math.random();
  }

}

const orm = await MikroORM.init({
  entities: [...],
  dbName: ':memory:',
  // highlight-next-line
  entityManager: MyEntityManager,
});
console.log(orm.em instanceof MyEntityManager); // true
const res = orm.em.myCustomMethod(123);
```

## `GeneratedCacheAdapter` for production usage

One of the ways you can define your entity metadata is leveraging the TypeScript compiler API via `ts-morph`, which allows extracting the type information that would be otherwise lost on compilation (and is not available via `reflect-metadata`). While this approach works nice locally, it had several hard problems around it, the most obvious one is the dependency on TypeScript, which you don't want to have in your production builds.

In v6, MikroORM lets you generate a production cache bundle into a single JSON file via CLI:

```bash
npx mikro-orm cache:generate --combined
```

This will create `./temp/metadata.json` file which can be used together with `GeneratedCacheAdapter` in your production configuration:

```ts
import { GeneratedCacheAdapter, MikroORM } from '@mikro-orm/core';

await MikroORM.init({
  metadataCache: {
    enabled: true,
    adapter: GeneratedCacheAdapter,
    options: { data: require('./temp/metadata.json') },
  },
  // ...
});
```

This way you can keep the `@mikro-orm/reflection` package as a development dependency only, use the CLI to create the cache bundle, and depend only on that in your production build.

> The cache bundle can be statically imported, which is handy in case you are using some bundler.

## Entity Generator improvements

[EntityGenerator](https://mikro-orm.io/docs/entity-generator) now automatically detects more M:N relations—including those with an autoincrement primary key (so fixed order), or even unrelated additional columns. Over time, we might get closer to a proper schema-first approach.

Shout out to **[Vasil Rangelov](https://github.com/boenrobot)**, who contributed this feature and is working on more improvements in the EntityGenerator, e.g. ability to override the generated entities' metadata.

## Inference of default values

When defining properties with a runtime default value, the `reflect-metadata` provider fails to infer the type property. This is no longer a problem in v6, as the discovery mechanism now automatically tries to [infer the type from the runtime defaults](https://mikro-orm.io/docs/defining-entities).

```diff
@Property()
-created: Data = new Date();
+created = new Date();
```

> Note that this works only if your entity can be constructed without any constructor parameters. It is fine to have them, but the constructor cannot fail if they are not provided for this auto-detection to work.

## Other notable changes

- Virtual entities now allow M:1 and 1:1 relations.
- New [`MikroORM.initSync()` method](https://mikro-orm.io/docs/quick-start#synchronous-initialization) allows initializing the ORM synchronously.
- Propagation and change-tracking works with `useDefineForClassFields` enabled.
- [Removed static `require` calls](https://github.com/mikro-orm/mikro-orm/pull/3814) that were problematic when bundling.
- [Removed `persist/remove/flush` from repository interface.](https://mikro-orm.io/docs/repositories#removed-methods-from-entityrepository-interface)
- [The `type` option is removed in favor of driver exports and `defineConfig`.](https://mikro-orm.io/docs/upgrading-v5-to-v6#the-type-option-is-removed-in-favour-of-driver-exports)
- [ORM extensions](https://mikro-orm.io/docs/configuration#extensions)—a way to tell the ORM about optional dependencies like Seeder or Migrator without the need to declare peer dependencies.
- All drivers now re-export the `@mikro-orm/core` package, so you no longer have to think about which package to import from - just use the driver package.
- [Native BigInt support](https://mikro-orm.io/docs/using-bigint-pks), allowing to set the mapping to either `bigint`, `number` or `string`.
- [Embedded properties respect `NamingStrategy`, including object embeddables.](https://mikro-orm.io/docs/upgrading-v5-to-v6#embedded-properties-respect-namingstrategy)
- Entities are added to the identity map on `em.persist()` if they have a primary key.
- Native support for [generated columns](https://mikro-orm.io/docs/defining-entities#sql-generated-columns).
- Support for lateral sub-query joins.
- Support for [native enums in postgres](https://mikro-orm.io/docs/defining-entities#postgresql-native-enums).
- Support [`Ref` wrapper on scalar properties](https://mikro-orm.io/docs/guide/05-type-safety#scalarreference-wrapper).
- [Discovery hooks `onMetadata` and `afterDiscovered`](https://mikro-orm.io/docs/configuration#onmetadata-hook) allowing to modify the metadata in any way you want.

And _many many_ more, see the [full changelog here](https://github.com/mikro-orm/mikro-orm/blob/master/CHANGELOG.md#600-2024-01-08). Also be sure to check the [upgrading guide](https://mikro-orm.io/docs/upgrading-v5-to-v6).

## One more thing…

![](/img/blog/one-more-thing-jobs.webp)

Over time, while some people liked the current documentation, there were also people disliking it. It wasn't really beginner-friendly, as it only described the distinct features, but was lacking some tutorials describing how to set things up as a whole.

A lot of the documentation for v6 has been updated and polished, and a completely new **[Getting Started Guide](https://mikro-orm.io/docs/guide)** was added, accompanied by an [example repository](https://github.com/mikro-orm/guide). It describes how to build and test an API from scratch with MikroORM, Fastify, ESM, Vitest, JWT, and some other tools. Unlike the rest of the docs, you can read it from top to bottom as a tutorial. I will continue extending the guide over time, especially the final section about type safety.

> _Like_ [_MikroORM_](https://mikro-orm.io/)_? ⭐️_ [_Star it_](https://github.com/mikro-orm/mikro-orm) _on GitHub and share this article with your friends. If you want to support the project financially, you can do so via_ [_GitHub Sponsors_](https://github.com/sponsors/B4nan)_._
