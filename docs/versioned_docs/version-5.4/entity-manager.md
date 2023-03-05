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
await em.persistAndFlush([book1, book2, book3]);

// or one by one
em.persist(book1);
em.persist(book2);
em.persist(book3);
await em.flush(); // flush everything to database at once
```

## Fetching Entities with EntityManager

To fetch entities from database we can use `find()` and `findOne()` of `EntityManager`:

Example:

```ts
const author = await em.findOne(Author, '...id...');
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

To populate entity relations, we can use `populate` parameter.

```ts
const books = await em.find(Book, { foo: 1 }, { populate: ['author.friends'] });
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

As we can see in the fifth example, one can also use operators like `$and`, `$or`, `$gte`, `$gt`, `$lte`, `$lt`, `$in`, `$nin`, `$eq`, `$ne`, `$like`, `$re` and `$fulltext`. More about that can be found in [Query Conditions](query-conditions.md) section.

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

You can also search by referenced entity properties. Simply pass nested where condition like this and all requested relationships will be automatically joined. Currently it will only join them so we can search and sort by those. To populate entities, do not forget to pass the populate parameter as well.

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

### Fetching Partial Entities

> This feature is supported only for `SELECT_IN` loading strategy.

When fetching single entity, we can choose to select only parts of an entity via `options.fields`:

```ts
const author = await em.findOne(Author, '...', { fields: ['name', 'born'] });
console.log(author.id); // PK is always selected
console.log(author.name); // Jon Snow
console.log(author.email); // undefined
```

From v4.4 it is also possible to specify fields for nested relations:

```ts
const author = await em.findOne(Author, '...', { fields: ['name', 'books.title', 'books.author', 'books.price'] });
```

Or with an alternative object syntax:

```ts
const author = await em.findOne(Author, '...', { fields: ['name', { books: ['title', 'author', 'price'] }] });
```

It is also possible to use multiple levels:

```ts
const author = await em.findOne(Author, '...', { fields: ['name', { books: ['title', 'price', 'author', { author: ['email'] }] }] });
```

Primary keys are always selected even if we omit them. On the other hand, we are responsible for selecting the FKs - if we omit such property, the relation might not be loaded properly. In the following example the books would not be linked the author, because we did not specify the `books.author` field to be loaded.

```ts
// this will load both author and book entities, but they won't be connected due to the missing FK in select
const author = await em.findOne(Author, '...', { fields: ['name', { books: ['title', 'price'] });
```

> Same problem can occur in mongo with M:N collections - those are stored as array property on the owning entity, so we need to make sure to mark such properties too.

### Fetching Paginated Results

If we are going to paginate our results, we can use `em.findAndCount()` that will return total count of entities before applying limit and offset.

```ts
const [authors, count] = await em.findAndCount(Author, { ... }, { limit: 10, offset: 50 });
console.log(authors.length); // based on limit parameter, e.g. 10
console.log(count); // total count, e.g. 1327
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

It is possible to use any SQL fragment in our `WHERE` query or `ORDER BY` clause:

> The `expr()` helper is an identity function - all it does is to return its parameter. We can use it to bypass the strict type checks in `FilterQuery`.

```ts
const users = await em.find(User, { [expr('lower(email)')]: 'foo@bar.baz' }, {
  orderBy: { [`(point(loc_latitude, loc_longitude) <@> point(0, 0))`]: 'ASC' },
});
```

This will produce following query:

```sql
select `e0`.*
from `user` as `e0`
where lower(email) = 'foo@bar.baz'
order by (point(loc_latitude, loc_longitude) <@> point(0, 0)) asc
```

## Disabling identity map and change set tracking

Sometimes we might want to disable identity map and change set tracking for some query. This is possible via `disableIdentityMap` option. Behind the scenes, it will create new context, load the entities inside that, and clear it afterwards, so the main identity map will stay clean.

> As opposed to _managed_ entities, such entities are called _detached_. To be able to work with them, we first need to merge them via `em.registerManaged()`.

```ts
const users = await em.find(User, { email: 'foo@bar.baz' }, {
  disableIdentityMap: true,
  populate: ['cars.brand'],
});
users[0].name = 'changed';
await em.flush(); // calling flush have no effect, as the entity is not managed
```

> Keep in mind that this can also have [negative effect on the performance](https://stackoverflow.com/questions/9259480/entity-framework-mergeoption-notracking-bad-performance).

## Type of Fetched Entities

Both `em.find` and `em.findOne()` methods have generic return types. All of following examples are equal and will let typescript correctly infer the entity type:

```ts
const author1 = await em.findOne<Author>(Author.name, '...id...');
const author2 = await em.findOne<Author>('Author', '...id...');
const author3 = await em.findOne(Author, '...id...');
```

As the last one is the least verbose, it should be preferred.

## Entity Repositories

Although we can use `EntityManager` directly, much more convenient way is to use [`EntityRepository` instead](https://mikro-orm.io/repositories/). You can register our repositories in dependency injection container like [InversifyJS](http://inversify.io/) so we do not need to get them from `EntityManager` each time.

For more examples, take a look at [`tests/EntityManager.mongo.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts) or [`tests/EntityManager.mysql.test.ts`](https://github.com/mikro-orm/mikro-orm/blob/master/tests/EntityManager.mysql.test.ts).

## Custom Property Ordering

Entity properties provide some support for custom ordering via the `customOrder` attribute. This is useful for values that have a natural order that doesn't align with their underlying data representation. Consider the code below, the natural sorting order would be `high`, `low`, `medium`. However we can provide the `customOrder` to indicate how the enum values should be sorted.

```ts
enum Priority { Low = 'low', Medium = 'medium', High = 'high' }
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

await em.persistAndFlush([
  em.create(Task, { label: 'A', priority: Priority.Low }),
  em.create(Task, { label: 'B', priority: Priority.Medium }),
  em.create(Task, { label: 'C', priority: Priority.High })
]);

const tasks = await em.find(Task, {}, { orderBy: { priority: QueryOrder.ASC } });
for (const t of tasks) {
  console.log(t.label);
}
// Logs A, B, C
```
