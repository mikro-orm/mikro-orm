---
slug: mikro-orm-5-released
title: 'MikroORM 5: Stricter, Safer, Smarter'
author: Martin Adámek
authorTitle: Author of MikroORM
authorURL: https://github.com/B4nan
authorImageURL: https://avatars1.githubusercontent.com/u/615580?s=460&v=4
authorTwitter: B4nan
tags: [typescript, javascript, node, sql]
---

The next major version of MikroORM has been just released. The title says: Stricter, Safer, Smarter – why?

![](https://cdn-images-1.medium.com/max/430/0*atMJ3hrlUosSpnQy.jpg)

- Greatly improved type safety (e.g. populate and partial loading hints)
- Auto-flush mode (so we never lose in-memory changes)
- Automatic refreshing of loaded entities (say goodby to refresh: true)
- Reworked schema diffing with automatic down migrations support
- and [many many more](https://github.com/mikro-orm/mikro-orm/blob/master/CHANGELOG.md#500-rc0-2022-01-23)...

> This time it took almost a year to get here – initial work on v5 started [back in March 2021](https://github.com/mikro-orm/mikro-orm/issues/1623).

### In case you don’t know…

If you never heard of [MikroORM](https://github.com/mikro-orm/mikro-orm), it’s a TypeScript data-mapper ORM with Unit of Work and Identity Map. It supports MongoDB, MySQL, PostgreSQL, and SQLite drivers currently. Key features of the ORM are:

- [Implicit transactions](https://github.com/mikro-orm/mikro-orm#implicit-transactions)
- [ChangeSet based persistence](https://github.com/mikro-orm/mikro-orm#changeset-based-persistence)
- [Identity map](https://mikro-orm.io/docs/identity-map/)

![](https://cdn-images-1.medium.com/max/1024/0*fKozvvTJns0y3w5U.png)

You can read the full [introductory article here](https://medium.com/dailyjs/introducing-mikro-orm-typescript-data-mapper-orm-with-identity-map-9ba58d049e02) (but note that many things have changed since that was written) or [browse through the docs](https://mikro-orm.io/).

### Quick summary of 4.x releases

Before we dive into all the things v5, let’s recap what happened in 4.x releases:

- [Result cache](https://mikro-orm.io/docs/caching/)
- [Automatic transaction context](https://github.com/mikro-orm/mikro-orm/pull/959)
- [Nested embeddables](https://mikro-orm.io/docs/embeddables/#nested-embeddables) and many other improvements in this domain
- [Using env vars for configuration](https://mikro-orm.io/docs/configuration/#using-environment-variables)

But enough of the history lesson, let’s talk about the future!

### Improved type safety

Let’s jump right into the most interesting feature – strict typing (almost) everywhere! `em.create()`, `toJSON()`, `toObject()`, populate, partial loading, and order by hints, all of that (and even more!) is now strictly typed.

Let’s check the following example:

```ts
const god = em.create(Author, {
  name: 'God', // validates required properties
  email: 'god@heaven.io',
  books: [{
    title: 'Bible, part 1',
    tags: [{ name: 'old' }, { name: 'bestseller' }],
  }],
}, { persist: true }); // we can enable this globally via `persistOnCreate: true`
await em.flush();

// simulate new request
em.clear();

// `authors` is of type `Loaded<Author, 'books.tags'>[]`
const authors = await em.find(Author, {}, {
  populate: ['books.tags'], // populate hint can be inferred from `fields` if not explicitly provided
  fields: ['books.tags.name'], // strict partial loading with dot notation support
  orderBy: { name: 'asc', books: { tags: { name: 'asc' } } }, // strict order by with object nesting
});

// `books` and `tags` will be typed as `LoadedCollection` so we can use safe `$` accessor
console.log(authors[0].books.$[0].tags.$[0].name);
const dto = wrap(authors[0]).toObject();
console.log(dto.books[0].tags[0].name); // DTOs are also strictly typed
```

First, we use `em.create()` to build the whole entity graph in a single step. It will validate the payload for both types and optionality. Some properties on the entity might have default values provided via hooks or database functions – while we might want to define them as required properties, they should act as optional in the context of `em.create()`. To deal with this problem, we can specify such properties that should be considered as optional via `OptionalProps` symbol:

```ts
@Entity()
export class Author {

  // only `name` will be considered as required for `em.create()`
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey()
  id!: number;

  @Property({ defaultRaw: 'current_timestamp()' })
  createdAt!: Date;

  @Property({ onUpdate: () => new Date(), length: 3, defaultRaw: 'current_timestamp(3)' })
  updatedAt!: Date;

  @Property()
  name!: string;

}
```

> Some property names are always considered as optional: `id`, `_id`, `uuid`.

Then we load all Author entities, populating their books and the book tags. All of the FindOptions here are strictly typed, moreover, we could even skip the populate hint as it can be inferred from fields option automatically.

![](https://cdn-images-1.medium.com/max/600/0*3g12H4O5KrzmQMrk.jpg)

We might still need some type casting for DTOs. The serialized form of an entity can be very unpredictable – there are many variables that define how an entity will be serialized, e.g. loaded relation vs reference, property serializers, lazy properties, custom entity serializer/`toJSON` method, eager loading, recursion checks, … Therefore, all relations on the EntityDTO type are considered as loaded, this is mainly done to allow better DX as if we had all relations typed as `Primary<T> | EntityDTO<T>` (e.g. `number | EntityDTO<Book>`), it would be impossible to benefit from intellisense/autosuggestions. Imagine this scenario:

```ts
const book = {} as Book;
const dto = wrap(book).toObject(); // EntityDTO<Book>

// this is now possible, but with the PK union type, we would need to type cast all the time
const name = dto.author.name;
```

### Validation improvements

Adding on top of the compile-time validation, we also get a runtime validation right before insert queries are fired, to ensure required properties have their values. This is important mainly in mongo, where we don’t have optionality checks on the schema level.

When we try to use the CLI without installing it locally, we also get a warning. And what if we forget to update some of the ORM packages and ended up with version mismatch and multiple installed core packages? We now validate that too!

### Reworked schema diffing

Schema diffing has been one of the weakest spots. Often, additional queries were produced or it was even impossible to get to a fully synchronized state.

Schema diffing has been completely reworked to address all currently known issues, and adding _a bit more_ on top of that:

- Diffing foreign key constraints
- Proper index diffing (before we compared just names)
- Custom index expressions
- Comment diffing
- Column length diffing (e.g. `numeric(10,2)` or `varchar(100)`)
- Changing primary key types
- Schema/namespace diffing (Postgres only)
- Automatic down migrations (no SQLite support yet)
- Check constraints support (Postgres only)

### Smarter migrations

In the production environment, we might want to use compiled migration files. Since v5, this should work almost out of the box, all we need to do is to configure the migrations path accordingly. Executed migrations now ignore the file extension, so we can use both node and ts-node on the same database. This is done in a backward-compatible manner.

```ts
import { MikroORM, Utils } from '@mikro-orm/core';

await MikroORM.init({
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  // or alternatively
  // migrations: {
  //   path: Utils.detectTsNode() ? 'src/migrations' : 'dist/migrations',
  // },
  // ...
});
```

Creating new migration will now automatically save the target schema snapshot into the migrations folder. This snapshot will be then used if we try creating a new migration, instead of using the current database schema. This means that if we try to create new migration before we run the pending ones, we still get the right schema diff (and no migration will be created if no additional changes were made).

> Snapshots should be versioned just like the regular migration files.

### Auto-flush mode

![](https://cdn-images-1.medium.com/max/1024/0*J74FKP7MaZoHO3Al.jpg)

Up until now, flushing was always an explicit action. With v5, we can configure the flushing strategy, similarly to how JPA/hibernate work. We have 3 flush modes:

- `FlushMode.COMMIT` - The `EntityManager` delays the flush until the current Transaction is committed.
- `FlushMode.AUTO` - This is the default mode, and it flushes the `EntityManager` only if necessary.
- `FlushMode.ALWAYS` - Flushes the `EntityManager` before every query.

FlushMode.AUTO will try to detect changes on the entity we are querying, and flush if there is an overlap:

```ts
// querying for author will trigger auto-flush if we have new author persisted
const a1 = new Author(...);
em.persist(a1);
const r1 = await em.find(Author, {});

// querying author won't trigger auto-flush if we have new book, but no changes on author
const b4 = new Book(...);
em.persist(b4);
const r2 = await em.find(Author, {});

// but querying for book will trigger auto-flush
const r3 = await em.find(Book, {});
```

More about flush modes [in the docs](https://mikro-orm.io/docs/unit-of-work/#flush-modes).

### Automatic refreshing of loaded entities

Previously, when an entity was loaded and we needed to reload it, providing explicit refresh: true in the options was required. Refreshing of entity also had one problematic side effect – the entity data (used for computing changesets) were always updated based on the newly loaded entity, hence forgetting the previous state (resulting in possibly lost updates done on the entity before refreshing).

Now we always merge the newly loaded data with the current state, and when we see an updated property, we keep the changed value instead. Moreover, for `em.findOne()` with a primary key condition, we try to detect whether it makes sense to reload an entity, by comparing the options and already loaded property names. In this step the `fields` and `populate` options are taken into account to support both partial loading and lazy properties.

```ts
// first partially load author with `id` and `email` only
const a1 = await em.findOneOrFail(Author, 123, { fields: ['id', 'email'] });
a1.email = 'lol'; // let's change the email

// reloading with same fields won't fire the query (as before)
const a2 = await em.findOneOrFail(Author, 123, { fields: ['email'] });
console.log(a1 === a2); // true, same entity instance, no query was fired

// reloading with additional fields will work without `refresh: true`
const a3 = await em.findOneOrFail(Author, 123, { fields: ['id', 'age'] });
console.log(a1 === a3); // true, same entity instance, but updated!
console.log(a1.age); // new values are loaded
a1.age = 1000; // let's override them

// reloading full entity will work without `refresh: true`
const a4 = await em.findOneOrFail(Author, 123, { populate: ['books'] });
console.log(a1 === a4); // true, same entity instance, but updated!
console.log(a1.termsAccepted); // new values are loaded

await em.flush(); // updates the author with new email and age
```

For complex conditions in `em.findOne()` and for any queries via `em.find()`, we always do the query anyway, but now instead of ignoring the data in case such entity was loaded, we merge them in the same manner.

```ts
// first partially load author entities
const r1 = await em.find(Author, {}, { fields: ['id'] });
r1[0].email = 'lol'; // let's change one of the emails
console.log(r1[0].name); // undefined, not loaded

// reload full entities - no `refresh: true` needed!
const r2 = await em.find(Author, {});
console.log(r2[0]); // fully loaded author entity, but `email` is changed to 'lol'
console.log(r1[0] === r2[0]); // true, same entity instance, just updated!

// flushing will now fire one update query to change the email of one author
await em.flush();
```

### Seeder package

MikroORM v5 now has a new package for seeding your database with initial or testing data. It allows creating entities via the same EntityManager API as usual, adding support for entity factories, and generating fake data via faker (the newly release community version).

See the [seeder docs](https://mikro-orm.io/docs/seeding) for more examples.

### Polymorphic embeddables

Polymorphic embeddables allow us to define multiple classes for a single embedded property and the right one will be used based on the discriminator column, similar to how single table inheritance works. While this currently works only for embeddables, support for polymorphic entities will be probably added in one of the 5.x releases.

```ts
@Entity()
class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;

}
```

Check out the [documentation](https://mikro-orm.io/docs/embeddables/#polymorphic-embeddables) for a complete example.

There are many other small improvements in embeddables, as well as many issues were addressed. Two examples:

- Support for many-to-one relations (storing only primary key and being able to populate the relation same as with regular entities)
- Support for `onCreate` and `onUpdate` property options

### Populating lazy scalar properties

Previously, the only way to populate a lazy scalar property was during the initial load of containing entity. If such entity was already loaded in the identity map (without this property), we needed to refresh its state – and potentially lose some state. MikroORM v5 allows to populate such properties via `em.populate()` too. Doing so will never override any in-memory changes we might have done on the entity.

### Creating references without EntityManager

When we wanted to create a reference, so an entity that is represented only by its primary key, we always had to have access to the current `EntityManager` instance, as such entity always needed to be managed.

Thanks to the new helper methods on the Reference class, we can now create entity references without access to `EntityManager`. This can be handy if you want to create a reference from an inside entity constructor:

```ts
@Entity()
export class Book {

  @ManyToOne(() => Author, { wrappedReference: true })
  author!: IdentifiedReference<Author>;

  constructor(authorId: number) {
    this.author = Reference.createFromPK(Author, authorId);
  }

}
```

> The `Reference` wrapper is an optional class to allow more type safety over relationships. Alternatively, we can use `Reference.createNakedFromPK()`.

This will create an unmanaged reference, that will be then merged to the `EntityManager` once owning entity gets flushed. Note that before we flush it, methods like `Reference.init()` or `Reference.load()` won’t be available as they require the EntityManager instance.

### Smarter `expr` helper

The `expr()` helper can be used to get around strict typing. It was an identity function, doing nothing more than returning its parameter – all it did was to tell TypeScript the value is actually of a different type (a generic string to be precise).

We can now use the helper in two more ways:

- With a callback signature to allow dynamic aliasing of the expression
- With an array argument to allow comparing tuples

```ts
import { expr } from '@mikro-orm/core';

const res1 = await em.find(Book, {
  // the type argument is optional, use it to get autocomplete on the entity properties
  [expr<Book>(['price', 'createdAt'])]: { $lte: [100, new Date()] },
});

// will issue query similar to this:
// select `b0`.* from `book` as `b0` where (`b0`.`price`, `b0`.`created_at`) <= (?, ?)

const res2 = await em.find(Book, {
  // the type argument is optional, use it to get autocomplete on the entity properties
  [expr(as => `lower(${as}.name)`)]: 'jon',
});

// will issue query similar to this:
// select `b0`.* from `book` as `b0` where lower(b0.name) = ?
```

### Awaitable QueryBuilder

QueryBuilder is now aware of its type, and the `getResult()` and `execute()` methods are typed based on it. We can also await the QueryBuilder instance directly, which will automatically execute the QB and return the appropriate response. The QB instance is now typed based on usage of `select`/`insert`/`update`/`delete`/`truncate` methods to one of:

- `SelectQueryBuilder` – awaiting yields array of entities
- `CountQueryBuilder` – awaiting yields number
- `InsertQueryBuilder` – awaiting yields `QueryResult`
- `UpdateQueryBuilder` – awaiting yields `QueryResult`
- `DeleteQueryBuilder` – awaiting yields `QueryResult`
- `TruncateQueryBuilder` – awaiting yields `QueryResult`

![](https://cdn-images-1.medium.com/max/798/0*jFsyXtSw1ZzZ9-cD.jpg)

```ts
const res1 = await em.createQueryBuilder(Publisher).insert({
  name: 'p1',
  type: PublisherType.GLOBAL,
});
// res1 is of type `QueryResult<Publisher>`
console.log(res1.insertId);

const res2 = await em.createQueryBuilder(Publisher)
  .select('*')
  .where({ name: 'p1' })
  .limit(5);
// res2 is Publisher[]
console.log(res2.map(p => p.name));

const res3 = await em.createQueryBuilder(Publisher).count().where({ name: 'p1' });
// res3 is number
console.log(res3 > 0);

const res4 = await em.createQueryBuilder(Publisher)
  .update({ type: PublisherType.LOCAL })
  .where({ name: 'p1' });
// res4 is QueryResult<Publisher>
console.log(res4.affectedRows > 0);

const res5 = await em.createQueryBuilder(Publisher).delete().where({ name: 'p1' });
// res4 is QueryResult<Publisher>
console.log(res4.affectedRows > 0);
expect(res5.affectedRows > 0).toBe(true); // test the type
```

### Wildcard schema entities

Up until now, we were able to define entities in a specific schema, or without a schema. Such entities then used the schema based on ORM config or `FindOptions`. This allowed us to read entities from a specific schema, but we were missing the power of Unit of Work here.

With v5, entity instances now hold schema name (as part of `WrappedEntity`). Managed entities will have the schema from FindOptions or metadata. Methods that create new entity instances like `em.create()` or `em.getReference()` now have an options parameter to allow setting the schema. We can also use `wrap(entity).getSchema()` and `wrap(entity).setSchema()`.

Entities can now specify wildcard schema via `@Entity({ schema: '*' })`. That way they will be ignored in SchemaGenerator unless the schema option is specified.

- If we specify schema, the entity only exists in that schema
- If we define `*` schema, the entity can exist in any schema, always controlled by the parameter
- If we skip schema option, the value will be taken from global ORM config

More about this topic can be found [here](https://mikro-orm.io/docs/next/multiple-schemas#wildcard-schema).

### Deep assigning of entities

Another weak spot was assigning new values to existing entities. While `wrap().assign()` was originally designed to update a single entity and its values, a lot of users wanted to assign an entity graph, updating relations in a single step too.

With v5, the way how `EntityAssigner` detects what entity should be updated has changed. Assigning a deep entity graph should be possible by default, without any additional options. It works based on matching entity primary keys, so if you want to issue an update for a relationship instead of creating new relation, make sure you first load it and pass down its primary key to the assign helper:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// update existing book's author's name
wrap(book).assign({
  author: {
    id: book.author.id,
    name: 'New name...',
  },
});
```

If we want to always update the entity, even without the entity PK being present in data, we can use `updateByPrimaryKey: false`:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// update existing book's author's name
wrap(book).assign({
  author: {
    name: 'New name...',
  },
}, { updateByPrimaryKey: false });
```

More examples on this topic can be found [in the docs](https://mikro-orm.io/docs/entity-helper/#updating-deep-entity-graph).

### Experimental support for ES modules

While MikroORM v5 is still compiled and published as CommonJS, we added several improvements that should allow using it with ESM projects too. Namely, we use the `gen-esm-wrapper` package to allow using named imports, and we use one nasty trick to keep dynamic imports instead of compiling them to require statements – for that we need to use `MIKRO_ORM_DYNAMIC_IMPORTS` env var. This should allow us to use folder-based discovery with ES modules, which was previously not possible.

### Other notable changes

- Partial loading support (`fields`) for joined loading strategy
- `AsyncLocalStorage` used by default in the `RequestContext` helper
- `onLoad` event (like `onInit`, but allows async and fires only for loaded entities, not references)
- Exporting async functions from CLI config
- Configurable aliasing strategy for SQL
- Allow providing [custom Logger instance](https://mikro-orm.io/docs/logging)
- [`persist` option in `em.create()` and `persistOnCreate` global configuration](https://mikro-orm.io/docs/configuration/#persist-created-entities-automatically)
- M:N support in entity generator
- Support for specifying transaction isolation level
- Controlling [where condition for populate hints](https://mikro-orm.io/docs/loading-strategies#population-where-condition)
- Revamped [API docs](https://mikro-orm.io/api)
- and _many many_ more, see the [full changelog here](https://github.com/mikro-orm/mikro-orm/blob/master/CHANGELOG.md#500-rc2-2022-02-03)

Also be sure to check the [upgrading guide](https://mikro-orm.io/docs/upgrading-v4-to-v5).

### What’s next?

Here is a list of things I would like to focus on going forward:

- allow specifying pivot entity for M:N relations (so we can have additional columns there, but still map it as M:N for reading purposes)
- support for database views (or maybe just entities representing SQL expressions)
- more drivers – namely better-sqlite3 and cockroach sounds like low hanging fruit, given knex now supports those natively

> _Like_ [_MikroORM_](https://mikro-orm.io/)_? ⭐️_ [_Star it_](https://github.com/mikro-orm/mikro-orm) _on GitHub and share this article with your friends. If you want to support the project financially, you can do so via_ [_GitHub Sponsors_](https://github.com/sponsors/B4nan)_._
