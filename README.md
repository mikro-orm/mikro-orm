# MikroORM

Simple typescript ORM for node.js based on data-mapper, unit-of-work and identity-map patterns. Supports MongoDB,
MySQL and SQLite databases. 

Heavily inspired by [doctrine](https://www.doctrine-project.org/).

[![](https://img.shields.io/npm/v/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![](https://img.shields.io/npm/dm/mikro-orm.svg)](https://www.npmjs.com/package/mikro-orm)
[![Dependency Status](https://david-dm.org/B4nan/mikro-orm.svg)](https://david-dm.org/B4nan/mikro-orm)
[![Build Status](https://travis-ci.com/B4nan/mikro-orm.svg?branch=master)](https://travis-ci.com/B4nan/mikro-orm)
[![Coverage Status](https://img.shields.io/coveralls/B4nan/mikro-orm.svg)](https://coveralls.io/r/B4nan/mikro-orm?branch=master)

## Installation & Usage

Fist install the module via `yarn` or `npm` and do not forget to install the database driver as well:

```
$ yarn add mikro-orm mongodb # for mongo
$ yarn add mikro-orm mysql2 # for mysql
$ yarn add mikro-orm sqlite # for sqlite
```

or

```
$ npm i -s mikro-orm mongodb # for mongo
$ npm i -s mikro-orm mysql2 # for mysql
$ npm i -s mikro-orm sqlite # for sqlite
```

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
  baseDir: __dirname, // defaults to `process.cwd()`
});
console.log(orm.em); // EntityManager
```

Then you will need to fork entity manager for each request so their identity maps will not 
collide. To do so, use the `RequestContext` helper:

```typescript
const app = express();

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
```

More info about `RequestContext` is described [here](#request-context).

Now you can start defining your entities (in one of the `entitiesDirs` folders):

### Defining entity

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title: string;

  @ManyToOne() // when you provide correct type hint, ORM will read it for you
  author: Author;

  @ManyToOne({ entity: () => Publisher }) // or you can specify the entity as class reference or string name
  publisher: Publisher;

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity { }
```

You will need to extend Book's interface with `IEntity` or your entity must extend BaseEntity
which does that for you. `IEntity` interface represents internal methods added to your entity's 
prototype via `@Entity` decorator.

With your entities set up, you can start using entity manager and repositories as described 
in following section. For more examples, take a look at 
[`tests/EntityManager.mongo.test.ts`](https://github.com/B4nan/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts).

## Persisting and cascading

To save entity state to database, you need to persist it. Persist takes care or deciding 
whether to use `insert` or `update` and computes appropriate change-set. Entity references
that are not persisted yet (does not have identifier) will be cascade persisted automatically. 

```typescript
// use constructors in your entities for required parameters
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
await orm.em.persist([book1, book2, book3]);

// or one by one
await orm.em.persist(book1, false);
await orm.em.persist(book2, false);
await orm.em.persist(book3); // flush everything to database at once

```

## Fetching entities with `EntityManager`

To fetch entities from database you can use `find()` and `findOne()` of `EntityManager`: 

API:

```typescript
EntityManager.getRepository<T extends IEntity>(entityName: string): EntityRepository<T>;
EntityManager.find<T extends IEntity>(entityName: string, where?: FilterQuery<T>, populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<T[]>;
EntityManager.findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate?: string[]): Promise<T>;
EntityManager.merge<T extends IEntity>(entityName: string, data: any): T;
EntityManager.getReference<T extends IEntity>(entityName: string, id: string): T;
EntityManager.remove(entityName: string, where: IEntity | any): Promise<number>;
EntityManager.removeEntity(entity: IEntity): Promise<number>;
EntityManager.count(entityName: string, where: any): Promise<number>;
EntityManager.persist(entity: IEntity | IEntity[], flush?: boolean): Promise<void>;
EntityManager.flush(): Promise<void>;
EntityManager.clear(): void;
EntityManager.canPopulate(entityName: string, property: string): boolean;
```

Example:

```typescript
const author = orm.em.findOne(Author.name, '...id...');
const books = orm.em.find(Book.name, {});

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

## Using `EntityRepository` instead of `EntityManager`

More convenient way of fetching entities from database is by using `EntityRepository`, that
carries the entity name so you do not have to pass it to every `find` and `findOne` calls:

API:

```typescript
EntityRepository.persist(entity: IEntity, flush?: boolean): Promise<void>;
EntityRepository.findOne(where: FilterQuery<IEntity> | string, populate?: string[]): Promise<IEntity>;
EntityRepository.find(where: FilterQuery<IEntity>, populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<IEntity[]>;
EntityRepository.findAll(populate?: string[], orderBy?: { [k: string]: 1 | -1; }, limit?: number, offset?: number): Promise<IEntity[]>;
EntityRepository.remove(where: IEntity | any): Promise<number>;
EntityRepository.flush(): Promise<void>;
EntityRepository.canPopulate(property: string): boolean;
EntityRepository.count(where?: any): Promise<number>;
```

Example:

```typescript
const booksRepository = orm.em.getRepository<Book>(Book.name);

// with sorting, limit and offset parameters, populating author references
const books = await booksRepository.find({ author: '...' }, ['author'], { title: -1 }, 2, 1);
console.log(books); // Book[]
```

### Custom repository

To use custom repository, just extend `EntityRepository<T>` class:

```typescript
export class CustomAuthorRepository extends EntityRepository<Author> {

  // your custom methods...
  public findAndUpdate(...) {
    // ...
  }

}
```

And register your repository as `@Entity` decorator:

```typescript
@Entity({ customRepository: () => CustomAuthorRepository })
export class Publisher {
  // ...
}
```

Note that we need to pass that repository reference inside a callback so we will not run
into circular dependency issues when using entity references inside that repository.

Now you can access your custom repository via `EntityManager.getRepository()` method.

## Core features

### Identity Map

`MikroORM` uses identity map in background so you will always get the same instance of 
one entity.

```typescript
const authorRepository = orm.em.getRepository<Author>(Author.name);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true
```

If you want to clear this identity map cache, you can do so via `EntityManager.clear()` method:

```typescript
orm.em.clear();
```

You should always keep unique identity map per each request. This basically means that you need 
to clone entity manager and use the clone in request context. There are two ways to achieve this:

#### Forking Entity Manager

With `fork()` method you can simply get clean entity manager with its own context and identity map:

```typescript
const em = orm.em.fork();
```

#### <a name="request-context"></a> `RequestContext` helper for DI containers

If you use dependency injection container like `inversify` or the one in `nestjs` framework, it 
can be hard to achieve this, because you usually want to access your repositories via DI container,
but it will always provide you with the same instance, rather than new one for each request. 

To solve this, you can use `RequestContext` helper, that will use `node`'s async hooks in the background
to isolate the request context. MikroORM will always use request specific (forked) entity manager 
if available, so all you need to do is to create new request context preferably in middle:

```typescript
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
``` 

### Entity references

Every single entity relation is mapped to an entity reference. Reference is an entity that has
only its identifier. This reference is stored in identity map so you will get the same object 
reference when fetching the same document from database.

You can call `await entity.init()` to initialize the entity. This will trigger database call 
and populate itself, keeping the same reference in identity map. 

```typescript
const author = orm.em.getReference('...id...');
console.log(author.id); // accessing the id will not trigger any db call
console.log(author.isInitialized()); // false
console.log(author.name); // undefined

await author.init(); // this will trigger db call
console.log(author.isInitialized()); // true
console.log(author.name); // defined
```

### Using entity constructors

Internally, `MikroORM` never calls entity constructor, so you are free to use it as you wish.
The constructor will be called only when you instantiate the class yourself via `new` operator,
so it is a handy place to require your data when creating new entity.

For example following `Book` entity definition will always require to set `title` and `author`, 
but `publisher` will be optional:

```typescript
@Entity({ collection: 'books-table' })
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne()
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity { }
```

### Lifecycle hooks

You can use lifecycle hooks to run some code when entity gets persisted. You can mark any of
entity methods with them, you can also mark multiple methods with same hook.

- `@BeforeCreate()` and `@BeforeUpdate()` is fired right before we persist the entity in database

- `@AfterCreate()` and `@AfterUpdate()` is fired right after the entity is updated in database and 
merged to identity map. Since this event entity will have reference to `EntityManager` and will be 
enabled to call `entity.init()` method (including all entity references and collections).

- `@BeforeDelete()` is fired right before we delete the record from database. It is fired only when
removing entity or entity reference, not when deleting records by query. 

- `@AfterDelete()` is fired right after the record gets deleted from database and it is unset from 
the identity map.

### `ObjectID` and `string` duality (MongoDriver)

Every entity has both `ObjectID` and `string` id available, also all methods of `EntityManager` 
and `EntityRepository` supports querying by both of them. 

```typescript
const author = orm.em.getReference('...id...');
console.log(author.id);  // returns '...id...'
console.log(author._id); // returns ObjectID('...id...')

// all of those will return the same results
const article = '...article id...'; // string id
const book = '...book id...'; // string id
const repo = orm.em.getRepository<Author>(Author.name);
const foo1 = await repo.find({ id: { $in: [article] }, favouriteBook: book });
const bar1 = await repo.find({ id: { $in: [new ObjectID(article)] }, favouriteBook: new ObjectID(book) });
const foo2 = await repo.find({ _id: { $in: [article] }, favouriteBook: book });
const bar2 = await repo.find({ _id: { $in: [new ObjectID(article)] }, favouriteBook: new ObjectID(book) });
```

### Collections

`OneToMany` and `ManyToMany` collections are stored in a `Collection` wrapper. It implements
iterator so you can use `for of` loop to iterate through it. 

Another way to access collection items is to use bracket syntax like when you access array items.
Keep in mind that this approach will not check if the collection is initialed, while using `get`
method will throw error in this case.

Note that array access in `Collection` is available only for reading already loaded items, you 
cannot add new items to `Collection` this way. 

```typescript
const author = orm.em.findOne(Author.name, '...', ['books']); // populating books collection

// or we could lazy load books collection later via `init()` method
await author.books.init();

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

// collection needs to be initialized before you can work with it
author.books.add(book);
console.log(author.books.contains(book)); // true
author.books.remove(book);
console.log(author.books.contains(book)); // false
author.books.add(book);
console.log(author.books.count()); // 1
author.books.removeAll();
console.log(author.books.contains(book)); // false
console.log(author.books.count()); // 0
console.log(author.books.getItems()); // Book[]
console.log(author.books.getIdentifiers()); // array of string | number
console.log(author.books.getIdentifiers('_id')); // array of ObjectID

// array access works as well
console.log(author.books[1]); // Book
console.log(author.books[12345]); // undefined, even if the collection is not initialized
```

### `OneToMany` collections

`OneToMany` collections are inverse side of `ManyToOne` references, to which they need to point via `fk` attribute:
 
```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @ManyToOne()
  author: Author;

}

@Entity()
export class BookTag {

  @PrimaryKey()
  _id: ObjectID;

  @OneToMany({ entity: () => Book, fk: 'author' })
  books = new Collection<Book>(this);

}
```

### `ManyToMany` collections

As opposed to SQL databases, with MongoDB we do not need to have join tables for `ManyToMany` relations. 
All references are stored as an array of `ObjectID`s on owning entity. 

#### Unidirectional

Unidirectional `ManyToMany` relations are defined only on one side, and marked explicitly as `owner`:

```typescript
@ManyToMany({ entity: () => Book, owner: true })
books = new Collection<Book>(this);
```

#### Bidirectional

Bidirectional `ManyToMany` relations are defined on both sides, while one is owning side (where references are store), 
marked by `inversedBy` attribute pointing to the inverse side:

```typescript
@ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
tags = new Collection<BookTag>(this);
```

And on the inversed side we define it with `mappedBy` attribute poining back to the owner:

```typescript
@ManyToMany({ entity: () => Book, mappedBy: 'tags' })
books = new Collection<Book>(this);
```

### Updating entity values with `IEntity.assign()`

When you want to update entity based on user input, you will usually have just plain
string ids of entity relations as user input. Normally you would need to use 
`EntityManager.getReference()` to create references from each id first, and then
use those references to update entity relations:

```typescript
const jon = new Author('Jon Snow', 'snow@wall.st');
const book = new Book('Book', jon);
book.author = orm.em.getReference<Author>(Author.name, '...id...');
```

Same result can be easily achieved with `IEntity.assign()`:

```typescript
book.assign({ 
  title: 'Better Book 1', 
  author: '...id...',
});
console.log(book.title); // 'Better Book 1'
console.log(book.author); // instance of Author with id: '...id...'
console.log(book.author.id); // '...id...'
```

## Smart nested populate

`MikroORM` is capable of loading large nested structures while maintaining good 
performance, querying each database table only once. Imagine you have this nested 
structure:

- `Book` has one `Publisher` (M:1), one `Author` (M:1) and many `BookTag`s (M:N)
- `Publisher` has many `Test`s (M:N)

When you use nested populate while querying all `BookTag`s, this is what happens in
the background:

```typescript
const tags = await orm.em.findAll(BookTag.name, ['books.publisher.tests', 'books.author']);
console.log(tags[0].books[0].publisher.tests[0].name); // prints name of nested test
console.log(tags[0].books[0].author.name); // prints name of nested author
```

1. Load all `BookTag`s
2. Load all `Book`s associated with previously loaded `BookTag`s
3. Load all `Publisher`s associated with previously loaded `Book`s
4. Load all `Test`s associated with previously loaded `Publisher`s
5. Load all `Author`s associated with previously loaded `Book`s

For SQL drivers with pivot tables this means:

```sql
SELECT `e0`.* FROM `book_tag` AS `e0`;

SELECT `e0`.*, `e1`.`book_id`, `e1`.`book_tag_id`
  FROM `book` AS `e0` LEFT JOIN `book_to_book_tag` AS `e1` ON `e0`.`id` = `e1`.`book_id`
  WHERE `e1`.`book_tag_id` IN (?, ?, ?, ?, ?)
  ORDER BY `e1`.`id` ASC;

SELECT `e0`.* FROM `publisher` AS `e0` WHERE `e0`.`id` IN (?, ?, ?);

SELECT `e0`.*, `e1`.`test_id`, `e1`.`publisher_id`
  FROM `test` AS `e0` LEFT JOIN `publisher_to_test` AS `e1` ON `e0`.`id` = `e1`.`test_id`
  WHERE `e1`.`publisher_id` IN (?, ?, ?)
  ORDER BY `e1`.`id` ASC;

SELECT `e0`.* FROM `author` AS `e0` WHERE `e0`.`id` IN (?);
```

For mongo driver its even simpler as no pivot tables are involved:

```typescript
db.getCollection("book-tag").find({}).toArray();
db.getCollection("book").find({"tags":{"$in":[...]}}).toArray();
db.getCollection("publisher").find({"_id":{"$in":[...]}}).toArray();
db.getCollection("test").find({"_id":{"$in":[...]}}).toArray();
db.getCollection("author").find({"_id":{"$in":[...]}}).toArray();

```

## Usage with MySQL and SQLite

To use `mikro-orm` with MySQL database, do not forget to install `mysql2` dependency and provide
`MySqlDriver` class when initializing ORM.

Similarly for SQLite install `sqlite` dependency and provide `SqliteDriver`.

Then call `MikroORM.init` as part of bootstrapping your app:

```typescript
const orm = await MikroORM.init({
  entitiesDirs: ['entities'], // relative to `baseDir`
  dbName: 'my-db-name',
  driver: MySqlDriver,
});
```

Currently you will need to maintain the database schema yourself. 

### `ManyToMany` collections with pivot tables

As opposed to `MongoDriver`, in MySQL we use pivot tables to handle `ManyToMany` relations:

```sql
CREATE TABLE `publisher_to_test` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `publisher_id` int(11) DEFAULT NULL,
  `test_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

You can adjust the name of pivot table via `pivotTable` option in `@ManyToMany` decorator
defined on owning side: 

```typescript
// for unidirectional
@ManyToMany({ entity: () => Test.name, owner: true, pivotTable: 'publisher2test' })
tests = new Collection<Test>(this);

// for bidirectional
@ManyToMany({ entity: () => BookTag, inversedBy: 'books', pivotTable: 'book2tag' })
tags = new Collection<BookTag>(this);
```

### Using `QueryBuilder` to execute native SQL queries

When you need to execute some SQL query without all the ORM stuff involved, you can either
compose the query yourself, or use the `QueryBuilder` helper to construct the query for you:

```typescript
const qb = orm.em.createQueryBuilder(Author.name);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });

console.log(qb.getQuery());
// 'UPDATE `publisher2` SET `name` = ?, `type` = ? WHERE `id` = ? AND `type` = ?'

console.log(qb.getParams());
// ['test 123', PublisherType.GLOBAL, 123, PublisherType.LOCAL]

// run the query
const driver = orm.em.getDriver<MySqlDriver>();
const res1 = await driver.execute(qb);

// or run query without using QueryBuilder
const res2 = await driver.execute('SELECT ? + ?', [1, 2]);
```

`QueryBuilder` provides fluent interface with these methods:

```typescript
QueryBuilder.select(fields: string | string[]): QueryBuilder;
QueryBuilder.insert(data: any): QueryBuilder;
QueryBuilder.update(data: any): QueryBuilder;
QueryBuilder.delete(cond: any): QueryBuilder;
QueryBuilder.count(fields: string | string[]): QueryBuilder;
QueryBuilder.where(cond: any): QueryBuilder;
QueryBuilder.populate(populate: string[]): QueryBuilder;
QueryBuilder.limit(limit: number, offset?: number): QueryBuilder;
QueryBuilder.offset(offset: number): QueryBuilder;
QueryBuilder.getQuery(): string;
QueryBuilder.getParams(): any;
```

For more examples of how to work with `QueryBuilder`, take a look at `QueryBuilder` tests in 
[`tests/QueryBuilder.test.ts`](https://github.com/B4nan/mikro-orm/blob/master/tests/QueryBuilder.test.ts).

### Transactions

MySQL driver provides basic support for transactions via `begin/commit/rollback` methods on both 
`MySqlDriver` and their shortcuts on `EntityManager` as well. 

You can also use `EntityManager.transactional(cb)` helper to run callback in transaction. It will
provide forked `EntityManager` as a parameter with clear clear isolated identity map - please use that
to make changes. 

```typescript
// if an error occurs inside the callback, all db queries from inside the callback will be rolled back
await orm.em.transactional(async (em: EntityManager) => {
  const god = new Author('God', 'hello@heaven.god');
  await em.persist(god);
});
```

```typescript
EntityManager.begin(): Promise<void>;
EntityManager.commit(): Promise<void>;
EntityManager.rollback(): Promise<void>;
EntityManager.transactional(cb: (em: EntityManager) => Promise<any>): Promise<any>;
```

Keep in mind transactions are supported only in MySQL driver currently. 

### Naming strategy in MySQL

`MySqlDriver` defaults to `UnderscoreNamingStrategy`, which means your all your database tables and
columns will be lower-cased and words divided by underscored:

```sql
CREATE TABLE `author` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `terms_accepted` tinyint(1) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `born` datetime DEFAULT NULL,
  `favourite_book_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

You can also provide your own naming strategy, just implement `NamingStrategy` interface and provide 
your implementation when bootstrapping ORM:

```typescript
class YourCustomNamingStrategy implements NamingStrategy {
  ...
}

const orm = await MikroORM.init({
  ...
  namingStrategy: YourCustomNamingStrategy,
  ...
});
```

## Native collection methods

Sometimes you need to perform some bulk operation, or you just want to populate your
database with initial fixtures. Using ORM for such operations can bring unnecessary
boilerplate code. In this case, you can use one of `nativeInsert/nativeUpdate/nativeDelete`
methods:

```typescript
EntityManager.nativeInsert<T extends IEntity>(entityName: string, data: any): Promise<IPrimaryKey>;
EntityManager.nativeUpdate<T extends IEntity>(entityName: string, where: FilterQuery<T>, data: any): Promise<number>;
EntityManager.nativeDelete<T extends IEntity>(entityName: string, where: FilterQuery<T> | any): Promise<number>;
```

Those methods execute native driver methods like Mongo's `insertOne/updateMany/deleteMany` collection methods respectively. 
This is common interface for all drivers, so for MySQL driver, it will fire native SQL queries. 
Keep in mind that they do not hydrate results to entities, and they do not trigger lifecycle hooks. 

They are also available as `EntityRepository` shortcuts:

```typescript
EntityRepository.nativeInsert(data: any): Promise<IPrimaryKey>;
EntityRepository.nativeUpdate(where: FilterQuery<T>, data: any): Promise<number>;
EntityRepository.nativeDelete(where: FilterQuery<T> | any): Promise<number>;
```

There is also shortcut for calling `aggregate` method (available in `MongoDriver` only):

```typescript
EntityManager.aggregate(entityName: string, pipeline: any[]): Promise<any[]>;
EntityRepository.aggregate(pipeline: any[]): Promise<any[]>;
```

## Property validation

`MirkoORM` will validate your properties before actual persisting happens. It will try to fix wrong 
data types for you automatically. If automatic conversion fails, it will throw an error. You can 
enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered 
when persisting the entity. 

```typescript
// number instead of string will throw
const author = new Author('test', 'test');
author.assign({ name: 111, email: 222 });
await orm.em.persist(author); // throws "Validation error: trying to set Author.name of type 'string' to '111' of type 'number'"

// string date with unknown format will throw
author.assign(author, { name: '333', email: '444', born: 'asd' });
await orm.em.persist(author); // throws "Validation error: trying to set Author.born of type 'date' to 'asd' of type 'string'"

// string date with correct format will be auto-corrected
author.assign({ name: '333', email: '444', born: '2018-01-01' });
await orm.em.persist(author);
console.log(author.born).toBe(true); // instance of Date

// Date object will be ok
author.assign({ born: new Date() });
await orm.em.persist(author);
console.log(author.born).toBe(true); // instance of Date

// null will be ok
author.assign({ born: null });
await orm.em.persist(author);
console.log(author.born); // null

// string number with correct format will be auto-corrected
author.assign({ age: '21' });
await orm.em.persist(author);
console.log(author.age); // number 21

// string instead of number with will throw
author.assign({ age: 'asd' });
await orm.em.persist(author); // throws "Validation error: trying to set Author.age of type 'number' to 'asd' of type 'string'"
author.assign({ age: new Date() });
await orm.em.persist(author); // throws "Validation error: trying to set Author.age of type 'number' to '2019-01-17T21:14:23.875Z' of type 'date'"
author.assign({ age: false });
await orm.em.persist(author); // throws "Validation error: trying to set Author.age of type 'number' to 'false' of type 'boolean'"
```

## TODO

- cascade persist in collections
- cascade remove references on other entities when deleting entity (e.g. from M:N collection)
