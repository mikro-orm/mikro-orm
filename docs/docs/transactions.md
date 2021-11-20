---
title: Transactions and Concurrency
---

> Starting v3.4, transactions are also supported in [MongoDB driver](usage-with-mongo.md).

## Transaction Demarcation

Transaction demarcation is the task of defining your transaction boundaries. Proper 
transaction demarcation is very important because if not done properly it can negatively 
affect the performance of your application. Many databases and database abstraction 
layers by default operate in auto-commit mode, which means that every single SQL statement 
is wrapped in a small transaction. Without any explicit transaction demarcation from your 
side, this quickly results in poor performance because transactions are not cheap. 

For the most part, MikroORM already takes care of proper transaction demarcation for you: 
All the write operations (INSERT/UPDATE/DELETE) are queued until `em.flush()` 
is invoked which wraps all of these changes in a single transaction.

However, MikroORM also allows (and encourages) you to take over and control transaction 
demarcation yourself.

These are two ways to deal with transactions when using the MikroORM and are now described 
in more detail.

### Approach 1: Implicitly

The first approach is to use the implicit transaction handling provided by the MikroORM 
`EntityManager`. Given the following code snippet, without any explicit transaction 
demarcation:

```typescript
const user = new User(...);
user.name = 'George';
await orm.em.persistAndFlush(user);
```

Since we do not do any custom transaction demarcation in the above code, `em.flush()` 
will begin and commit/rollback a transaction. This behavior is made possible by the 
aggregation of the DML operations by the MikroORM and is sufficient if all the data 
manipulation that is part of a unit of work happens through the domain model and thus 
the ORM.

### Approach 2: Explicitly

The explicit alternative is to use the transactions API directly to control the boundaries. 
The code then looks like this:

```typescript
await orm.em.transactional(em => {
  //... do some work
  const user = new User(...);
  user.name = 'George';
  em.persist(user);
});
```

Or you can use `begin/commit/rollback` methods explicitly. Following example is
equivalent to the previous one:

```typescript
const em = orm.em.fork(false);
await em.begin();

try {
  //... do some work
  const user = new User(...);
  user.name = 'George';
  em.persist(user);
  await em.commit(); // will flush before making the actual commit query
} catch (e) {
  await em.rollback();
  throw e;
}
```

Explicit transaction demarcation is required when you want to include custom DBAL operations 
in a unit of work or when you want to make use of some methods of the EntityManager API 
that require an active transaction. Such methods will throw a `ValidationError` to inform 
you of that requirement.

`em.transactional(cb)` will flush the inner `EntityManager` prior to transaction commit.

### Exception Handling

When using implicit transaction demarcation and an exception occurs during 
`em.flush()`, the transaction is automatically rolled back.

When using explicit transaction demarcation and an exception occurs, the transaction should 
be rolled back immediately as demonstrated in the example above. This can be handled elegantly 
by the control abstractions shown earlier. Note that when catching Exception you should 
generally re-throw the exception. If you intend to recover from some exceptions, catch them 
explicitly in earlier catch blocks (but do not forget to rollback the transaction). All 
other best practices of exception handling apply similarly (i.e. either log or re-throw, 
not both, etc.).

As a result of this procedure, all previously managed or removed instances of the `EntityManager` 
become detached. The state of the detached objects will be the state at the point at which the 
transaction was rolled back. The state of the objects is in no way rolled back and thus the 
objects are now out of sync with the database. The application can continue to use the detached 
objects, knowing that their state is potentially no longer accurate.

If you intend to start another unit of work after an exception has occurred you should do 
that with a new `EntityManager`. Simply use `em.fork()` to obtain fresh copy 
with cleared identity map. 

## Locking Support

### Why we need concurrency control?

If transactions are executed serially (one at a time), no transaction concurrency exists. 
However, if concurrent transactions with interleaving operations are allowed, you may easily 
run into one of those problems:

1. The lost update problem
2. The dirty read problem
3. The incorrect summary problem

To mitigate those problems, MikroORM offers support for Pessimistic and Optimistic locking 
strategies natively. This allows you to take very fine-grained control over what kind of 
locking is required for your entities in your application.

### Optimistic Locking

Database transactions are fine for concurrency control during a single request. However, a 
database transaction should not span across requests, the so-called "user think time". Therefore 
a long-running "business transaction" that spans multiple requests needs to involve several 
database transactions. Thus, database transactions alone can no longer control concurrency 
during such a long-running business transaction. Concurrency control becomes the partial 
responsibility of the application itself.

MikroORM has integrated support for automatic optimistic locking via a version field. In 
this approach any entity that should be protected against concurrent modifications during 
long-running business transactions gets a version field that is either a simple number 
(mapping type: integer) or a timestamp (mapping type: datetime). When changes to such an 
entity are persisted at the end of a long-running conversation the version of the entity 
is compared to the version in the database and if they don't match, a `OptimisticLockError` 
is thrown, indicating that the entity has been modified by someone else already.

You designate a version field in an entity as follows. In this example we'll use an integer.

```typescript
export class User {
  // ...
  @Property({ version: true })
  version!: number;
  // ...
}
```

Alternatively a datetime type can be used (which maps to a SQL timestamp or datetime):

```typescript
export class User {
  // ...
  @Property({ version: true })
  version!: Date;
  // ...
}
```

Version numbers (not timestamps) should however be preferred as they can not potentially 
conflict in a highly concurrent environment, unlike timestamps where this is a possibility, 
depending on the resolution of the timestamp on the particular database platform.

When a version conflict is encountered during `em.flush()`, a `OptimisticLockError` 
is thrown and the active transaction rolled back (or marked for rollback). This exception 
can be caught and handled. Potential responses to a `OptimisticLockError` are to present the 
conflict to the user or to refresh or reload objects in a new transaction and then retrying 
the transaction.

The time between showing an update form and actually modifying the entity can in the worst 
scenario be as long as your application's session timeout. If changes happen to the entity 
in that time frame you want to know directly when retrieving the entity that you will hit 
an optimistic locking exception:

You can always verify the version of an entity during a request either when calling 
`em.findOne()`:

```typescript
const theEntityId = 1;
const expectedVersion = 184;

try {
  const entity = await orm.em.findOne(User, theEntityId, { lockMode: LockMode.OPTIMISTIC, lockVersion: expectedVersion });

  // do the work

  await orm.em.flush();
} catch (e) {
  console.log('Sorry, but someone else has already changed this entity. Please apply the changes again!');
}
```

Or you can use `em.lock()` to find out:

```typescript
const theEntityId = 1;
const expectedVersion = 184;
const entity = await orm.em.findOne(User, theEntityId);

try {
    // assert version
    await orm.em.lock(entity, LockMode.OPTIMISTIC, expectedVersion);
} catch (e) {
    console.log('Sorry, but someone else has already changed this entity. Please apply the changes again!');
}
```

### Concurrency Checks

As opposed to version fields that are handled automatically, we can use 
concurrency checks. They allow us to mark specific properties to be included
in the concurrency check, just like the version field was. But this time, we
will be responsible for updating the fields explicitly.

When we try to update such entity without changing one of the concurrency fields,
`OptimisticLockError` will be thrown. Same mechanism is then used to check whether
the update succeeded, and throw the same type of error when not.

```ts
@Entity()
export class ConcurrencyCheckUser {

  // all primary keys are by default part of the concurrency check
  @PrimaryKey({ length: 100 })
  firstName: string;

  // all primary keys are by default part of the concurrency check
  @PrimaryKey({ length: 100 })
  lastName: string;

  @Property({ concurrencyCheck: true })
  age: number;

  @Property({ nullable: true })
  other?: string;

}
```

#### Important Implementation Notes

You can easily get the optimistic locking workflow wrong if you compare the wrong versions. 
Say you have Alice and Bob editing a hypothetical blog post:

- Alice reads the headline of the blog post being "Foo", at optimistic lock version 1 (GET Request)
- Bob reads the headline of the blog post being "Foo", at optimistic lock version 1 (GET Request)
- Bob updates the headline to "Bar", upgrading the optimistic lock version to 2 (POST Request of a Form)
- Alice updates the headline to "Baz", ... (POST Request of a Form)

Now at the last stage of this scenario the blog post has to be read again from the database 
before Alice's headline can be applied. At this point you will want to check if the blog 
post is still at version 1 (which it is not in this scenario).

Using optimistic locking correctly, you **have** to add the version as an additional hidden 
field (or into the session for more safety). Otherwise you cannot verify the version is still 
the one being originally read from the database when Alice performed her GET request for the 
blog post. If this happens you might see lost updates you wanted to prevent with Optimistic 
Locking.

See the example code (frontend):

```typescript
const res = await fetch('api.example.com/book/123');
const book = res.json();
console.log(book.version); // prints the current version

// user does some changes and calls the PUT handler
const changes = { title: 'new title' };
await fetch('api.example.com/book/123', {
  method: 'PUT',
  body: {
    ...changes,
    version: book.version,
  },
});
```

And the corresponding API endpoints:

```typescript
// GET /book/:id
async findOne(req, res) {
  const book = await this.em.findOne(Book, +req.query.id);
  res.json(book);
}

// PUT /book/:id
async update(req, res) {
  const book = await this.em.findOne(Book, +req.query.id, { lockMode: LockMode.OPTIMISTIC, lockVersion: req.body.version });
  wrap(book).assign(req.body);
  await this.em.flush();

  res.json(book);
}
```

Your frontend app loads an entity from API, the response includes the version property. 
User makes some changes and fires PUT request back to the API, with version field included 
in the payload. The PUT handler of the API then reads the version and passes it to the 
`em.findOne()` call.

### Pessimistic Locking

MikroORM supports Pessimistic Locking at the database level. No attempt is being made to implement 
pessimistic locking inside MikroORM, rather vendor-specific and ANSI-SQL commands are used to 
acquire row-level locks. Every Entity can be part of a pessimistic lock, there is no special 
metadata required to use this feature.

However, for Pessimistic Locking to work you have to disable the Auto-Commit Mode of your Database 
and start a transaction around your pessimistic lock use-case using the "Approach 2: Explicit 
Transaction Demarcation" described above. MikroORM will throw an Exception if you attempt to 
acquire a pessimistic lock and no transaction is running.

MikroORM currently supports 6 pessimistic lock modes:

| Mode | Postgres | MySQL |
|------|----------|-------|
| `LockMode.PESSIMISTIC_READ` | `for share` | `lock in share mode` |
| `LockMode.PESSIMISTIC_WRITE` | `for update` | `for update` |
| `LockMode.PESSIMISTIC_PARTIAL_WRITE` | `for update skip locked` | `for update skip locked` |
| `LockMode.PESSIMISTIC_WRITE_OR_FAIL` | `for update nowait` | `for update nowait` |
| `LockMode.PESSIMISTIC_PARTIAL_READ` | `for share skip locked` | `lock in share mode skip locked` |
| `LockMode.PESSIMISTIC_READ_OR_FAIL` | `for share nowait` | `lock in share mode nowait` |

You can use pessimistic locks in three different scenarios:

1. Using `em.findOne(className, id, { lockMode: LockMode.PESSIMISTIC_WRITE })` or `em.findOne(className, id, { lockMode: LockMode.PESSIMISTIC_READ })`
2. Using `em.lock(entity, LockMode.PESSIMISTIC_WRITE)` or `em.lock(entity, LockMode.PESSIMISTIC_READ)`
3. Using `QueryBuilder.setLockMode(LockMode.PESSIMISTIC_WRITE)` or `QueryBuilder.setLockMode(LockMode.PESSIMISTIC_READ)`

Optionally we can also pass list of table aliases we want to lock via `lockTableAliases` option:

> The root entity is always aliased as `e0` when using `em.find()` or `em.findOne()`.

```typescript
const res = await em.find(User, { name: 'Jon' }, {
  populate: ['identities'],
  strategy: LoadStrategy.JOINED,
  lockMode: LockMode.PESSIMISTIC_READ,
  lockTableAliases: ['e0'],
});

// select ... 
//   from "user" as "e0"
//   left join "identity" as "i1" on "e0"."id" = "i1"."user_id" 
//   where "e0"."name" = 'Jon' 
//   for update of "e0" skip locked
```

### Isolation levels

We can set the transaction isolation levels:

```ts
await orm.em.transactional(async em => {
  // ...
}, { isolationLevel: IsolationLevel.READ_UNCOMMITTED });
```

Available isolation levels:

- `IsolationLevel.READ_UNCOMMITTED`
- `IsolationLevel.READ_COMMITTED`
- `IsolationLevel.SNAPSHOT`
- `IsolationLevel.REPEATABLE_READ`
- `IsolationLevel.SERIALIZABLE`

> This part of documentation is highly inspired by [doctrine internals docs](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/reference/transactions-and-concurrency.html)
> as the behaviour here is pretty much the same.
