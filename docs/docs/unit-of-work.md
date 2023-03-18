---
title: Unit of Work and Transactions
sidebar_label: Unit of Work
---

MikroORM uses the Identity Map pattern to track objects. Whenever you fetch an object from the database, MikroORM will keep a reference to this object inside its `UnitOfWork`.

This allows MikroORM room for optimizations. If you call the EntityManager and ask for an entity with a specific ID twice, it will return the same instance:

```ts
const authorRepository = em.getRepository(Author);
const jon1 = await authorRepository.findOne(1);
const jon2 = await authorRepository.findOne(1);

// identity map in action
console.log(jon1 === jon2); // true
```

Only one SELECT query will be fired against the database here. In the second `findOne()` call MikroORM will check the identity map first and will skip the database round trip as it will find the entity already loaded.

The identity map being indexed by primary keys only allows shortcuts when you ask for objects by primary key. When you query by other properties, you will still get the same reference, but two separate database calls will be made:

```ts
const authorRepository = em.getRepository(Author);
const jon1 = await authorRepository.findOne({ name: 'Jon Snow' });
const jon2 = await authorRepository.findOne({ name: 'Jon Snow' });

// identity map in action
console.log(jon1 === jon2); // true
```

MikroORM only knows objects by id, so a query for different criteria has to go to the database, even if it was executed just before. But instead of creating a second `Author` object MikroORM first gets the primary key from the row and checks if it already has an object inside the `UnitOfWork` with that primary key.

## Persisting Managed Entities

The identity map has a second use-case. When you call `em.flush()`, MikroORM will ask the identity map for all objects that are currently managed. This means you don't have to call `em.persist()` over and over again to pass known objects to the `EntityManager`. This is a NO-OP for known entities, but leads to much code written that is confusing to other developers.

The following code WILL update your database with the changes made to the `Author` object, even if you did not call `em.persist()`:

```ts
const authorRepository = em.getRepository(Author);
const jon = await authorRepository.findOne(1);
jon.email = 'foo@bar.com';
await authorRepository.flush(); // calling em.flush() has same effect
```

## How MikroORM Detects Changes

MikroORM is a data-mapper that tries to achieve persistence-ignorance (PI). This means you map JS objects into a relational database that do not necessarily know about the database at all. A natural question would now be, "how does MikroORM even detect objects have changed?".

For this MikroORM keeps a second map inside the `UnitOfWork`. Whenever you fetch an object from the database MikroORM will keep a copy of all the properties and associations inside the `UnitOfWork`.

Now whenever you call `em.flush()` MikroORM will iterate over all entities you previously marked for persisting via `em.persist()`. For each object it will compare the original property and association values with the values that are currently set on the object. If changes are detected then the object is queued for a UPDATE operation. Only the fields that actually changed are updated.

## Implicit Transactions

First and most important implication of having Unit of Work is that it allows handling transactions automatically.

When you call `em.flush()`, all computed changes are queried inside a database transaction (if supported by given driver). This means that you can control the boundaries of transactions simply by calling `em.persist()` and once all your changes are ready, simply calling `flush()` will run them inside a transaction.

> You can also control the transaction boundaries manually via `em.transactional(cb)`.

```ts
const user = await em.findOne(User, 1);
user.email = 'foo@bar.com';
const car = new Car();
user.cars.add(car);

// thanks to bi-directional cascading we only need to persist user entity
// flushing will create a transaction, insert new car and update user with new email
await em.persistAndFlush(user);
```

You can find more information about transactions in [Transactions and concurrency](transactions.md) page.

## Flush Modes

The flushing strategy is given by the `flushMode` of the current running `EntityManager`.

- `FlushMode.COMMIT` - The `EntityManager` delays the flush until the current Transaction is committed.
- `FlushMode.AUTO` - This is the default mode, and it flushes the `EntityManager` only if necessary.
- `FlushMode.ALWAYS` - Flushes the `EntityManager` before every query.

`FlushMode.AUTO` will try to detect changes on the entity we are querying, and flush if there is an overlap:

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

Changes on managed entities are also detected, although this works only based on simple dirty checks, no query analyses in place.

```ts
const book = await em.findOne(Book, 1);
book.price = 1000;

// triggers auto-flush because of the changed `price`
const r1 = await em.find(Book, { price: { $gt: 500 } });

// triggers auto-flush too, the book entity is dirty
const r2 = await em.find(Book, { name: /foo.*/ });
```

We can set the flush mode on different places:

- in the ORM config via `Options.flushMode`
- for given `EntityManager` instance (and its forks) via `em.setFlushMode()`
- for given `EntityManager` fork via `em.fork({ flushMode })`
- for given QueryBuilder instance via `qb.setFlushMode()`
- for given transaction scope via `em.transactional(..., { flushMode })`

### Change tracking and performance considerations

When we use the default `FlushMode.AUTO`, we need to detect changes done on managed entities. To do this, every property is dynamically redefined as a `get/set` pair. While this should be all transparent to end users, it can lead to performance issues if we need to read some properties very often (e.g. millions of times).

> Scalar primary keys are never defined as `get/set` pairs.

To mitigate this, we can disable change tracking on a property level. Changing such properties will no longer trigger the auto flush mechanism, but they will be respected during explicit `flush()` call.

```ts
@Property({ trackChanges: false })
code!: string;
```

> This part of documentation is highly inspired by [doctrine internals docs](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/reference/unitofwork.html) as the behaviour here is pretty much the same.
