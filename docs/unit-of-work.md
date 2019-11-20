---
---

# Unit of Work and Transactions

MikroORM uses the Identity Map pattern to track objects. Whenever you fetch an object from 
the database, MikroORM will keep a reference to this object inside its `UnitOfWork`. 

This allows MikroORM room for optimizations. If you call the EntityManager and ask for an 
entity with a specific ID twice, it will return the same instance:

```typescript
const authorRepository = orm.em.getRepository(Author);
const jon1 = await authorRepository.findOne(1);
const jon2 = await authorRepository.findOne(1);

// identity map in action
console.log(jon1 === jon2); // true
```

Only one SELECT query will be fired against the database here. In the second `findOne()` 
call MikroORM will check the identity map first and will skip the database round trip as
it will find the entity already loaded.

The identity map being indexed by primary keys only allows shortcuts when you ask for objects 
by primary key. When you query by other properties, you will still get the same reference, 
but two separate database calls will be made:

```typescript
const authorRepository = orm.em.getRepository(Author);
const jon1 = await authorRepository.findOne({ name: 'Jon Snow' });
const jon2 = await authorRepository.findOne({ name: 'Jon Snow' });

// identity map in action
console.log(jon1 === jon2); // true
```

MikroORM only knows objects by id, so a query for different criteria has to go to the database, 
even if it was executed just before. But instead of creating a second `Author` object MikroORM 
first gets the primary key from the row and checks if it already has an object inside the 
`UnitOfWork` with that primary key. 

## Persisting Managed Entities

The identity map has a second use-case. When you call `em.flush()`, MikroORM will 
ask the identity map for all objects that are currently managed. This means you don't have to 
call `em.persistLater()` over and over again to pass known objects to the 
`EntityManager`. This is a NO-OP for known entities, but leads to much code written that is 
confusing to other developers.

The following code WILL update your database with the changes made to the `Author` object, 
even if you did not call `em.persistLater()`:

```typescript
const authorRepository = orm.em.getRepository(Author);
const jon = await authorRepository.findOne(1);
jon.email = 'foo@bar.com';
await authorRepository.flush(); // calling orm.em.flush() has same effect
```

## How MikroORM Detects Changes

MikroORM is a data-mapper that tries to achieve persistence-ignorance (PI). This means you 
map JS objects into a relational database that do not necessarily know about the database at 
all. A natural question would now be, "how does MikroORM even detect objects have changed?".

For this MikroORM keeps a second map inside the `UnitOfWork`. Whenever you fetch an object 
from the database MikroORM will keep a copy of all the properties and associations inside 
the `UnitOfWork`. 

Now whenever you call `em.flush()` MikroORM will iterate over all entities you 
previously marked for persisting via `em.persistLater()`. For each object it will
compare the original property and association values with the values that are currently set 
on the object. If changes are detected then the object is queued for a UPDATE operation. 
Only the fields that actually changed are updated.

## Implicit Transactions

First and most important implication of having Unit of Work is that it allows handling
transactions automatically. 

When you call `em.flush()`, all computed changes are queried inside a database
transaction (if supported by given driver). This means that you can control the boundaries 
of transactions simply by calling `em.persistLater()` and once all your changes 
are ready, simply calling `flush()` will run them inside a transaction. 

> You can also control the transaction boundaries manually via `em.transactional(cb)`.

```typescript
const user = await em.findOne(User, 1);
user.email = 'foo@bar.com';
const car = new Car();
user.cars.add(car);

// thanks to bi-directional cascading we only need to persist user entity
// flushing will create a transaction, insert new car and update user with new email
await em.persistAndFlush(user);
```

You can find more information about transactions in [Transactions and concurrency](transactions.md) 
page.

### Beware: Auto-flushing and Transactions

> Since MikroORM v3, default value for `autoFlush` is `false`. That means you need to call 
> `em.flush()` yourself to persist changes into database. You can still change this via ORM's
> options to ease the transition but generally it is not recommended. 

Originally there was only `em.persist(entity, flush = true)` method, that was
automatically flushing changes to database, if not given second `false` parameter. This 
behaviour can be now changed via `autoFlush` option when initializing the ORM:

```typescript
const orm = await MikroORM.init({
  autoFlush: false, // defaults to false in v3, was true in v2
  // ...
});
orm.em.persist(new Entity()); // no auto-flushing now
await orm.em.flush();
await orm.em.persist(new Entity(), true); // you can still use second parameter to auto-flush
```

When using driver that supports transactions (all SQL drivers), you should either keep auto-flushing 
disabled, or use `persistLater()` method instead, as otherwise each `persist()` call will immediately 
create new transaction to run the query.

> This part of documentation is highly inspired by [doctrine internals docs](https://www.doctrine-project.org/projects/doctrine-orm/en/2.6/reference/unitofwork.html)
> as the behaviour here is pretty much the same.
