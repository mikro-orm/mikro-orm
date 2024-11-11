---
title: Working with Entity Manager
sidebar_label: Entity Manager
---

## Persist and Flush

There are 2 methods we should first describe to understand how persisting works in MikroORM: `em.persist()` and `em.flush()`.

`em.persist(entity)` is used to mark new entities for future persisting. It will make the entity managed by given `EntityManager` and once `flush` will be called, it will be written to the database.

To understand `flush`, lets first define what managed entity is: An entity is managed if it’s fetched from the database (via `em.find()`, `em.findOne()` or via other managed entity) or registered as new through `em.persist()`.

`em.flush()` will go through all managed entities, compute appropriate change sets and perform according database queries. As an entity loaded from database becomes managed automatically, we do not have to call persist on those, and flush is enough to update them.

```ts
const book = await em.findOne(Book, 1);
book.title = 'How to persist things...';

// no need to persist `book` as its already managed by the EM
await em.flush();
```

## Persisting and Cascading

To save entity state to database, we need to persist it. Persist determines whether to use `insert` or `update` and computes appropriate change-set. Entity references that are not persisted yet (does not have identifier) will be cascade persisted automatically.

```ts
// use constructors in our entities for required parameters
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

// or one by one
em.persist(book1);
em.persist(book2);
em.persist(book3);
await em.flush(); // flush everything to database at once
```

## Entity references

MikroORM represents every entity as an object, even those that are not fully loaded. Those are called entity references - they are in fact regular entity class instances, but only with their primary key available. This makes it possible to create them without querying the database. References are stored in the identity map just like any other entity.

```ts
const userRef = em.getReference(User, 1);
console.log(userRef);
```

This will log something like `(User) { id: 1 }`, note the class name being wrapped in parens - this tells you the entity is not-initialized state and represents just the primary key.

Here is an example of common actions you can do with a reference instead of a fully loaded entity:

```ts
// setting relation properties
author.favouriteBook = em.getReference(Book, 1);

// removing entity by reference
em.remove(em.getReference(Book, 2));

// adding entity to collection by reference
author.books.add(em.getReference(Book, 3));
```

The concept can be combined with the so-called `Reference` wrapper for added type safety as described in the [Type-safe Relations section](type-safe-relations.md).

## Entity state and `WrappedEntity`

During entity discovery (which happens when you call `MikroORM.init()`), the ORM will patch the entity prototype and generate a lazy getter for the `WrappedEntity` - a class holding various metadata and state information about the entity. Each entity instance will have one, available under a hidden `__helper` property - to access its API in a type-safe way, use the `wrap()` helper:

```ts
import { wrap } from '@mikro-orm/core';

const userRef = em.getReference(User, 1);
console.log('userRef is initialized:', wrap(userRef).isInitialized()); // false

await wrap(userRef).init();
console.log('userRef is initialized:', wrap(userRef).isInitialized()); // true
```

> You can also extend the `BaseEntity` provided by MikroORM. It defines all the public methods available via `wrap()` helper, so you could do `userRef.isInitialized()` or `userRef.init()`.

The `WrappedEntity` instance also holds the state of the entity at the time it was loaded or flushed - this state is then used by the Unit of Work during flush to compute the differences. Another use case is serialization, we can use the `toObject()`, `toPOJO()` and `toJSON()` methods to convert the entity instance to a plain JavaScript object.

## Removing entities

To delete entities via `EntityManager`, we have two possibilities:

1. Mark entity instance via `em.remove()` - this means we first need to have the entity instance. But don't worry, you can get one even without loading it from the database - via `em.getReference()`.
2. Fire `DELETE` query via `em.nativeDelete()` - when all you want is a simple delete query, it can be simple as that.

Let's test the first approach with removing by entity instance:

```ts
// using reference is enough, no need for a fully initialized entity
const book1 = em.getReference(Book, 1);
await em.remove(book1).flush();
```

## Fetching Entities with EntityManager

To fetch entities from database we can use `em.find()` and `em.findOne()`:

```ts
const author = await em.findOne(Author, 123);
const books = await em.find(Book, {});

for (const author of authors) {
  console.log(author.name); // Jon Snow

  for (const book of author.books) {
    console.log(book.title); // initialized
    console.log(book.author.isInitialized()); // true
    console.log(book.author.id);
    console.log(book.author.name); // Jon Snow
    console.log(book.publisher); // just reference
    console.log(book.publisher.isInitialized()); // false
    console.log(book.publisher.id);
    console.log(book.publisher.name); // undefined
  }
}
```

Alternatively, there is also `em.findAll()`, which does not have the second `where` parameter and defaults to returning all entities. You can still use the `where` option of this method though:

```ts
const books = await em.findAll(Book, {
  where: { publisher: { $ne: null } }, // optional
});
```

To populate entity relations, we can use `populate` parameter.

```ts
const books = await em.findAll(Book, {
  where: { publisher: { $ne: null } },
  // highlight-next-line
  populate: ['author.friends'],
});
```

You can also use `em.populate()` helper to populate relations (or to ensure they are fully populated) on already loaded entities. This is also handy when loading entities via `QueryBuilder`:

```ts
const authors = await em.createQueryBuilder(Author).select('*').getResult();
await em.populate(authors, { populate: ['books.tags'] });

// now our Author entities will have `books` collections populated,
// as well as they will have their `tags` collections populated.
console.log(authors[0].books[0].tags[0]); // initialized BookTag
```

### Conditions Object (`FilterQuery<T>`)

Querying entities via conditions object (`where` in `em.find(Entity, where: FilterQuery<T>)`) supports many different ways:

```ts
// search by entity properties
const users = await em.find(User, { firstName: 'John' });

// for searching by reference we can use primary key directly
const id = 1;
const users = await em.find(User, { organization: id });

// or pass unpopulated reference (including `Reference` wrapper)
const ref = await em.getReference(Organization, id);
const users = await em.find(User, { organization: ref });

// fully populated entities as also supported
const ent = await em.findOne(Organization, id);
const users = await em.find(User, { organization: ent });

// complex queries with operators
const users = await em.find(User, { $and: [{ id: { $nin: [3, 4] } }, { id: { $gt: 2 } }] });

// we can also search for array of primary keys directly
const users = await em.find(User, [1, 2, 3, 4, 5]);

// and in findOne all of this works, plus we can search by single primary key
const user1 = await em.findOne(User, 1);
```

As we can see in the fifth example, one can also use operators like `$and`, `$or`, `$gte`, `$gt`, `$lte`, `$lt`, `$in`, `$nin`, `$eq`, `$ne`, `$like`, `$re` and `$fulltext`. More about that can be found in [Query Conditions](./query-conditions.md) section.

#### Using custom classes in `FilterQuery`

If we decide to abstract the filter options in our own object then we might run into the problem that the find option does not return the results we'd expect. This is due to the fact that the `FilterQuery` should be provided as a plain object (POJO), and not a class instance with prototype.

If we want to provide our own `FilterQuery` DTO, then our DTO class should extend the `PlainObject` class. This way MikroORM knows it should be treated as such.

```ts
import { PlainObject } from '@mikro-orm/core';

class Filter extends PlainObject {
  name: string;
}

const where = new Filter();
where.name = 'Jon';
const res = await em.find(Author, where);
```

#### Mitigating `Type instantiation is excessively deep and possibly infinite.ts(2589)` error

Sometimes we might be facing TypeScript errors caused by too complex query for it to properly infer all types. Usually it can be solved by providing the type argument explicitly.

You can also opt in to use repository instead, as there the type inference should not be problematic.

> As a last resort, we can always type cast the query to `any`.

```ts
const books = await em.find<Book>(Book, { ... our complex query ... });
// or
const books = await em.getRepository(Book).find({ ... our complex query ... });
// or
const books = await em.find<any>(Book, { ... our complex query ... }) as Book[];
```

Another problem we might be facing is `RangeError: Maximum call stack size exceeded` error thrown during TypeScript compilation (usually from file `node_modules/typescript/lib/typescript.js`). The solution to this is the same, just provide the type argument explicitly.

### Searching by referenced entity fields

You can also search by referenced entity properties. Simply pass nested where condition like this and all requested relationships will be automatically joined. Currently, it will only join them so we can search and sort by those. To populate entities, do not forget to pass the populate parameter as well.

```ts
// find author of a book that has tag specified by name
const author = await em.findOne(Author, { books: { tags: { name: 'Tag name' } } });
console.log(author.books.isInitialized()); // false, as it only works for query and sort

const author = await em.findOne(Author, { books: { tags: { name: 'Tag name' } } }, { populate: ['books.tags'] });
console.log(author.books.isInitialized()); // true, because it was populated
console.log(author.books[0].tags.isInitialized()); // true, because it was populated
console.log(author.books[0].tags[0].isInitialized()); // true, because it was populated
```

> This feature is fully available only for SQL drivers. In MongoDB always we need to query from the owning side - so in the example above, first load book tag by name, then associated book, then the author. Another option is to denormalize the schema.

### Partial loading

To fetch only some database columns, you can use the `fields` option:

```ts
const author = await em.findOne(Author, '...', {
  fields: ['name', 'born'],
});
console.log(author.id); // PK is always selected
console.log(author.name); // Jon Snow
console.log(author.email); // undefined
```

This works also for nested relations:

```ts
const author = await em.findOne(Author, '...', {
  fields: ['name', 'books.title', 'books.author', 'books.price'],
});
```

Primary keys are always selected even if you omit them. On the other hand, you are responsible for selecting the foreign keys—if you omit such property, the relation might not be loaded properly. In the following example the books would not be linked the author, because you did not specify the `books.author` field to be loaded.

```ts
// this will load both author and book entities, but they won't be connected due to the missing FK in select
const author = await em.findOne(Author, '...', {
  fields: ['name', 'books.title', 'books.price'],
});
```

> The Same problem can occur in mongo with M:N collections—those are stored as array property on the owning entity, so you need to make sure to mark such properties too.

```ts
const author = await em.findOne(Author, '...', {
  fields: ['name', 'books.title', 'books.author', 'books.price'],
});
```

Alternatively, you can use the `exclude` option, which will omit the provided properties and select everything else:

```ts
const author = await em.findOne(Author, '...', {
  exclude: ['email', 'books.price'],
  populate: ['books'], // unlike with `fields`, you need to explicitly populate the relation here
});
```

### Fetching Paginated Results

If we are going to paginate our results, we can use `em.findAndCount()` that will return total count of entities before applying limit and offset.

```ts
const [authors, count] = await em.findAndCount(Author, { ... }, { limit: 10, offset: 50 });
console.log(authors.length); // based on limit parameter, e.g. 10
console.log(count); // total count, e.g. 1327
```

### Cursor-based pagination

As an alternative to the offset based pagination with `limit` and `offset`, we can paginate based on a cursor. A cursor is an opaque string that defines specific place in ordered entity graph. You can use `em.findByCursor()` to access those options. Under the hood, it will call `em.find()` and `em.count()` just like the `em.findAndCount()` method, but will use the cursor options instead.

Supports `before`, `after`, `first` and `last` options while disallowing `limit` and `offset`. Explicit `orderBy` option is required.

Use `first` and `after` for forward pagination, or `last` and `before` for backward pagination.

- `first` and `last` are numbers and serve as an alternative to `offset`, those options are mutually exclusive, use only one at a time
- `before` and `after` specify the previous cursor value, it can be one of the:
    - `Cursor` instance
    - opaque string provided by `startCursor/endCursor` properties
    - POJO/entity instance

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

The `Cursor` object provides following interface:

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

### Handling Not Found Entities

When we call `em.findOne()` and no entity is found based on our criteria, `null` will be returned. If we rather have an `Error` instance thrown, we can use `em.findOneOrFail()`:

```ts
const author = await em.findOne(Author, { name: 'does-not-exist' });
console.log(author === null); // true

try {
  const author = await em.findOneOrFail(Author, { name: 'does-not-exist' });
  // author will be always found here
} catch (e) {
  console.error('Not found', e);
}
```

You can customize the error either globally via `findOneOrFailHandler` option, or locally via `failHandler` option in `findOneOrFail` call.

```ts
try {
  const author = await em.findOneOrFail(Author, { name: 'does-not-exist' }, {
    failHandler: (entityName: string, where: Record<string, any> | IPrimaryKey) => new Error(`Failed: ${entityName} in ${util.inspect(where)}`)
  });
} catch (e) {
  console.error(e); // our custom error
}
```

### Using custom SQL fragments

Any SQL fragment in your `WHERE` query or `ORDER BY` clause need to be wrapped with `raw()` or `sql`:

```ts
const users = await em.find(User, { [sql`lower(email)`]: 'foo@bar.baz' }, {
  orderBy: { [sql`(point(loc_latitude, loc_longitude) <@> point(0, 0))`]: 'ASC' },
});
```

This will produce following query:

```sql
select `e0`.*
from `user` as `e0`
where lower(email) = 'foo@bar.baz'
order by (point(loc_latitude, loc_longitude) <@> point(0, 0)) asc
```

Read more about this in [Using raw SQL query fragments](./raw-queries.md) section.

## Updating references (not loaded entities)

Since v5.5, we can update references via Unit of Work, just like if it was a loaded entity. This way it is possible to issue update queries without loading the entity.

```ts
const ref = em.getReference(Author, 123);
ref.name = 'new name';
ref.email = 'new email';
await em.flush();
```

This is a rough equivalent to calling `em.nativeUpdate()`, with one significant difference - we use the flush operation which handles event execution, so all life cycle hooks as well as flush events will be fired.

## Atomic updates via `raw()` helper

When you want to issue an atomic update query via flush, you can use the static `raw()` helper:

```ts
const ref = em.getReference(Author, 123);
ref.age = raw(`age * 2`);

await em.flush();
console.log(ref.age); // real value is available after flush
```

The `raw()` helper returns special raw query fragment object. It disallows serialization (via `toJSON`) as well as working with the value (via [`valueOf()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)). Only single use of this value is allowed, if you try to reassign it to another entity, an error will be thrown to protect you from mistakes like this:

```ts
order.number = raw(`(select max(num) + 1 from orders)`);
user.lastOrderNumber = order.number; // throws, it could resolve to a different value
JSON.stringify(order); // throws, raw value cannot be serialized
```

## Upsert

We can use `em.upsert()` create or update the entity, based on whether it is already present in the database. This method performs an `insert on conflict merge` query ensuring the database is in sync, returning a managed entity instance. The method accepts either `entityName` together with the entity `data`, or just entity instance.

```ts
// insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 33
const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
```

The entity data needs to contain either the primary key, or any other unique property. Let's consider the following example, where `Author.email` is a unique property:

```ts
// insert into "author" ("age", "email") values (33, 'foo@bar.com') on conflict ("email") do update set "age" = 33
// select "id" from "author" where "email" = 'foo@bar.com'
const author = await em.upsert(Author, { email: 'foo@bar.com', age: 33 });
```

Depending on the driver support, this will either use a returning query, or a separate select query, to fetch the primary key if it's missing from the `data`.

You can also use detached entity instance, after the `em.upsert()` call it will become managed.

```ts
const author = em.create(Author, { email: 'foo@bar.com', age: 33 });
await em.upsert(author);
```

Since v5.6 there is also `em.upsertMany()` with similar signature:

```ts
const [author1, author2, author3] = await em.upsertMany(Author, [
  { email: 'a1', age: 41 },
  { email: 'a2', age: 42 },
  { email: 'a3', age: 43 },
]);
```

By default, the EntityManager will prefer using the primary key, and fallback to the first unique property with a value. Sometimes this might not be the wanted behaviour, one example is when you generate the primary key via property initializer, e.g. with `uuid.v4()`. For those advanced cases, you can control how the underlying upserting logic works via the following options:

- `onConflictFields?: (keyof T)[]` to control the conflict clause
- `onConflictAction?: 'ignore' | 'merge'` used ignore and merge as that is how the QB methods are called
- `onConflictMergeFields?: (keyof T)[]` to control the merge clause
- `onConflictExcludeFields?: (keyof T)[]` to omit fields from the merge clause

```ts
const [author1, author2, author3] = await em.upsertMany(Author, [{ ... }, { ... }, { ... }], {
  onConflictFields: ['email'], // specify a manual set of fields pass to the on conflict clause
  onConflictAction: 'merge',
  onConflictExcludeFields: ['id'],
});
```

This will generate query similar to the following:

```sql
insert into "author"
  ("id", "current_age", "email", "foo")
  values
    (1, 41, 'a1', true),
    (2, 42, 'a2', true),
    (5, 43, 'a3', true)
  on conflict ("email")
  do update set
    "current_age" = excluded."current_age",
    "foo" = excluded."foo"
  returning "_id", "current_age", "foo", "bar"
```

## Refreshing entity state

We can use `em.refresh(entity)` to synchronize the entity state with database. This is a shortcut for calling `em.findOne()` with `refresh: true` and disabled auto-flush.

> This results in loss of any changes done to that entity.

```ts
const author = await em.findOneOrFail(Author, { name: 'Jon' });
console.log(author.name); // 'Jon'

// changes to entity will be lost!
author.name = '123';

// refresh the value, ignore any changes
await em.refresh(author);
console.log(author.name); // 'Jon'
```

## Batch inserts, updates and deletes

When you flush changes made to one entity type, only one query per given operation (create/update/delete) will be executed.

```ts
for (let i = 1; i <= 5; i++) {
  const u = new User(`Peter ${i}`, `peter+${i}@foo.bar`);
  em.persist(u);
}

await em.flush();

// insert into `user` (`name`, `email`) values
//   ('Peter 1', 'peter+1@foo.bar'),
//   ('Peter 2', 'peter+2@foo.bar'),
//   ('Peter 3', 'peter+3@foo.bar'),
//   ('Peter 4', 'peter+4@foo.bar'),
//   ('Peter 5', 'peter+5@foo.bar');
```

```ts
for (const user of users) {
  user.name += ' changed!';
}

await em.flush();

// update `user` set
//   `name` = case
//     when (`id` = 1) then 'Peter 1 changed!'
//     when (`id` = 2) then 'Peter 2 changed!'
//     when (`id` = 3) then 'Peter 3 changed!'
//     when (`id` = 4) then 'Peter 4 changed!'
//     when (`id` = 5) then 'Peter 5 changed!'
//     else `priority` end
//   where `id` in (1, 2, 3, 4, 5)
```

```ts
em.remove(users);
await em.flush();

// delete from `user` where `id` in (1, 2, 3, 4, 5)
```

## Disabling identity map and change set tracking

Sometimes we might want to disable identity map and change set tracking for some query. This is possible via `disableIdentityMap` option. Behind the scenes, it will create new context, load the entities inside that, and clear it afterwards, so the main identity map will stay clean.

> As opposed to _managed_ entities, such entities are called _detached_. To be able to work with them, we first need to merge them via `em.merge()`.

```ts
const users = await em.find(User, { email: 'foo@bar.baz' }, {
  disableIdentityMap: true,
  populate: ['cars.brand'],
});
users[0].name = 'changed';
await em.flush(); // calling flush have no effect, as the entity is not managed
```

> Keep in mind that this can also have [negative effect on the performance](https://stackoverflow.com/questions/9259480/entity-framework-mergeoption-notracking-bad-performance).

## Entity Repositories

Although we can use `EntityManager` directly, a more convenient way is to use [`EntityRepository` instead](https://mikro-orm.io/repositories/). You can register your repositories in dependency injection container like [InversifyJS](http://inversify.io/) so we do not need to get them from `EntityManager` each time.

For more examples, take a look at [`tests/EntityManager.mongo.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts) or [`tests/EntityManager.mysql.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mysql.test.ts).

## Custom Property Ordering

Entity properties provide some support for custom ordering via the `customOrder` attribute. This is useful for values that have a natural order that doesn't align with their underlying data representation. Consider the code below, the natural sorting order would be `high`, `low`, `medium`. However, we can provide the `customOrder` to indicate how the enum values should be sorted.

```ts
enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

@Entity()
class Task {
  @PrimaryKey()
  id!: number

  @Property()
  label!: string

  @Enum({
    items: () => Priority,
    customOrder: [Priority.Low, Priority.Medium, Priority.High]
  })
  priority!: Priority
}

// ...

em.create(Task, { label: 'A', priority: Priority.Low }),
em.create(Task, { label: 'B', priority: Priority.Medium }),
em.create(Task, { label: 'C', priority: Priority.High })
await em.flush();

const tasks = await em.find(Task, {}, { orderBy: { priority: QueryOrder.ASC } });
for (const t of tasks) {
  console.log(t.label);
}
// Logs A, B, C
```

## Extending `EntityManager`

To extend the EntityManager with your own custom methods, you can use the `entityManager` ORM option:

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
