---
id: mikro-orm-3-released
title: 'MikroORM 3: Knex.js, CLI, Schema Updates, Entity Generator and more…'
author: Martin Adámek
authorTitle: Author of MikroORM
authorURL: https://github.com/B4nan
authorImageURL: https://avatars1.githubusercontent.com/u/615580?s=460&v=4
authorTwitter: B4nan
tags: [typescript, javascript, node, sql]
---

New major version of the TypeScript ORM has been released, read about its new features and breaking changes.

<!--truncate-->

### In case you don’t know…

If you never heard of [MikroORM](https://github.com/mikro-orm/mikro-orm), it’s a TypeScript data-mapper ORM with Unit of Work and Identity Map. It supports MongoDB, MySQL, PostgreSQL and SQLite drivers currently. Key features of the ORM are:

- [Implicit transactions](https://github.com/mikro-orm/mikro-orm#implicit-transactions)
- [ChangeSet based persistence](https://github.com/mikro-orm/mikro-orm#changeset-based-persistence)
- [Identity map](https://mikro-orm.io/docs/identity-map/)

![](https://cdn-images-1.medium.com/max/1024/0*0eZmw4DceSltEEQh.png)

You can read the full [introductory article here](https://medium.com/dailyjs/introducing-mikro-orm-typescript-data-mapper-orm-with-identity-map-9ba58d049e02) or [browse through the docs](https://mikro-orm.io).

### Integrated Knex.js

You probably know Knex.js already, but if you don’t, it is a “batteries included” SQL query builder for **Postgres** , **MSSQL** , **MySQL** , **MariaDB** , **SQLite3** , **Oracle** , and **Amazon Redshift** designed to be flexible, portable, and fun to use.

![](https://cdn-images-1.medium.com/max/649/0*FHWIwC9WTwl2hkQ7.png)

Knex.js is now used as both a query builder and a query runner for all SQL drivers. This allows to simplify SQL driver implementations as well as brings some new possibilities.

#### Using Knex.js

You can access configured knex instance via qb.getKnexQuery() method. Then you can execute it via the Connection.execute() and map the results via EntityManager.map().

```typescript
const qb = orm.em.createQueryBuilder(Author);
qb.update({ name: 'test 123', type: PublisherType.GLOBAL }).where({ id: 123, type: PublisherType.LOCAL });
const knex = qb.getKnexQuery(); // instance of Knex' QueryBuilder
// do what ever you need with `knex`
const res = await orm.em.getConnection().execute(knex);
const entities = res.map(a => orm.em.map(Author, a));
console.log(entities); // Author[]
```

You can also get clear and configured knex instance from the connection via getKnex() method. As this method is not available on the base Connection class, you will need to either manually type cast the connection to AbstractSqlConnection (or the actual implementation you are using, e.g. MySqlConnection), or provide correct driver type hint to your EntityManager instance, which will be then automatically inferred in em.getConnection() method.

> Driver and connection implementations are not directly exported from mikro-orm module. You can import them from mikro-orm/dist (e.g. import { PostgreSqlDriver } from 'mikro-orm/dist/drivers/PostgreSqlDriver').

```typescript
const conn = orm.em.getConnection() as AbstractSqlConnection;
// you can make sure the `em` is correctly typed to `EntityManager<AbstractSqlDriver>`
// or one of its implementations:
// const em: EntityManager<AbstractSqlDriver> = orm.em;
const knex = conn.getKnex();
// do what ever you need with `knex`
const res = await knex;
```

#### Connection Pooling

With Knex.js used as a query runner, support for connection pooling is finally available. [Tarn.js](https://github.com/vincit/tarn.js) is used for this internally, using connection pool with min: 2, max: 10 for the MySQL and PG libraries, and a single connection for sqlite3 by default. Use pool option to change this when initializing the ORM.

```typescript
const orm = await MikroORM.init({
  entities: [Author, Book],
  dbName: 'my-db-name',
  pool: { min: 10, max: 20 }, // see https://github.com/vincit/tarn.js#usage for other pool options
});
```

#### More SQL Drivers?

One of the strongest reasons to integrate Knex.js was that it allows to simplify and unify SQL drivers and opens doors for implementing new SQL drivers. Knex.js currently supports (apart from those currently supported by MikroORM): MSSQL, Oracle and Amazon Redshift.

Thanks to AbstractSqlDriver and AbstractSqlConnection classes it should be fairly simple to implement them. I am open for PRs for those drivers, as I would like to focus on developing new ORM features mainly, instead of learning new SQL dialects I have never used. I will be happy to assist to anybody interested — feel free to reach me out either via Slack, email or GitHub issues.

### Simplified Entity Definition

Now it is no longer needed to merge entities with IEntity interface, that was polluting entity's interface with internal methods. New interfaces IdentifiedEntity\<T\>, UuidEntity\<T\> and MongoEntity\<T\> are introduced, that should be implemented by entities. They are not adding any new properties or methods, keeping the entity's interface clean.

IEntity interface has been renamed to AnyEntity\<T, PK\> and it no longer has public methods like toJSON(), toObject() or init(). One can use wrap() method provided by ORM that will enhance property type when needed with those methods (e.g. await wrap(book.author).init()). To keep all methods available on the entity, you can still use interface merging with WrappedEntity\<T, PK\> that both extends AnyEntity\<T, PK\> and defines all those methods.

You will need to mark the entity by implementing one of \*Entity interfaces:

- IdEntity\<T\> for numeric/string PK on id property (id: number)
- UuidEntity\<T\> for string PK on uuid property (uuid: string)
- MongoEntity\<T\> for mongo, where id: string and \_id: ObjectId are required
- AnyEntity\<T, PK\> for other possible properties (fill the PK property name to PK parameter, e.g.: AnyEntity\<Book, 'myPrimaryProperty'\>')

```typescript
@Entity()
export class User implements IdEntity<User> {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne()
  address?: Address;

  @ManyToMany()
  cars = new Collection<Car>(this);

  constructor(name: string) {
    this.name = name;
  }

}
```

To keep all public methods that were part of IEntity interface in v2, you can use [WrappedEntity\<T, PK\> via interface merging](https://mikro-orm.io/docs/defining-entities#using-wrappedentity-interface).

### Nested Queries

SQL driver now support nested where and orderBy conditions. This means that you can query by properties of a relationship and the relation will be automatically joined for you. They are available both in EntityManager and QueryBuilder APIs.

```typescript
const book = await orm.em.findOne(Book, {
  author: {
    name: 'Jon Snow',
    address: {
      street: 'Downing Street',
    },
  },
}, ['author.address']);

console.log(book.author.name); // 'Jon Snow'
console.log(book.author.address.street); // 'Downing Street'
```

### Strict Typing of Queries

Previously the where parameter of EntityManager’s find methods (find(), findOne(), count()) was weakly typed. It allowed users to pass pretty much anything there.

Now the query is strictly typed, only entity properties and operators can be used and the type of property value is also checked.

```typescript
// correct query
em.find(Author, {
  favouriteBook: {
    author: { name: '...' },
  },
  age: { $gte: 40 }, // operators are also supported
});

// 2 errors will be reported here
em.find(Author, {
  favouriteBook: {
    author: { born: 'test' }, // string instead of Date
  },
  age: { $lte: 'nan' }, // string instead of number
});
```

### Improved Schema Generator

SchemaGenerator now supports creating, updating and dropping the schema. You can either get the SQL queries as array of strings or directly run them on the database.

> Always check the generated SQL first before running it.

There is also new columnType property attribute you can use to specify the database specific column type explicitly.

### Migrations

![](https://cdn-images-1.medium.com/max/628/0*b3RWZY_ROCrJs3RE.jpeg)

Better way to handle schema updates than using the SchemaGenerator directly is to use Migrations. MikroORM 3 has [integrated support for migrations](https://mikro-orm.io/docs/migrations) via [umzug](https://github.com/sequelize/umzug). It allows you to generate migrations with current schema differences.

By default, each migration will be all executed inside a transaction, and all of them will be wrapped in one master transaction, so if one of them fails, everything will be rolled back.

### Generating Entities from Current Database

As a counterpart to the SchemaGenerator that propagates changes in your entities to the database schema, there is now [EntityGenerator](https://mikro-orm.io/docs/entity-generator) to help you with reverse engineering current database schema and creating entities based on it.

It supports basic entity definition including ManyToOne and OneToOne relationships. Currently ManyToMany will be generated as additional entity with two ManyToOne relations and you will need to refactor this yourself.

While it can help a lot, there is quite a lot of room for improvement. In future I would like to implement proper support for ManyToMany relations as well for enums and indexes. Another possible extension would be to allow editing existing entities (syncing them with current schema).

### CLI

While you can use SchemaGenerator and EntityGenerator manually, much easier way is to use [new CLI tool](https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool). Simply create configuration file in root directory or add its path to package.json. TypeScript files are also supported via ts-node:

```json
{
  "name": "your-app",
  "dependencies": { ... },
  "mikro-orm": {
    "useTsNode": true,
    "configPaths": [
      "./src/mikro-orm.config.ts",
      "./dist/mikro-orm.config.js"
    ]
  }
}
```

Now you can use the CLI with help of [npx](https://github.com/npm/npx):

```sh
$ npx mikro-orm
Usage: mikro-orm <command> [options]

Commands:
  mikro-orm cache:clear             Clear metadata cache
  mikro-orm cache:generate          Generate metadata cache for production
  mikro-orm generate-entities       Generate entities based on current database
                                    schema
  mikro-orm database:import <file>  Imports the SQL file to the database
  mikro-orm schema:create           Create database schema based on current
                                    metadata
  mikro-orm schema:drop             Drop database schema based on current
                                    metadata
  mikro-orm schema:update           Update database schema based on current
                                    metadata
  mikro-orm migration:create        Create new migration with current schema
                                    diff
  mikro-orm migration:up            Migrate up to the latest version
  mikro-orm migration:down          Migrate one step down
  mikro-orm migration:list          List all executed migrations
  mikro-orm migration:pending       List all pending migrations
  mikro-orm debug                   Debug CLI configuration

Options:
  -v, --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  mikro-orm schema:update --run  Runs schema synchronization
```

To verify your setup, you can use the mikro-orm debug command. Once you have it configured properly, you can also re-use it when initializing the ORM:

```
// when no options parameter is provided, CLI config will be used
const orm = await MikroORM.init();
```

### Custom Mapping Types

![](https://cdn-images-1.medium.com/max/500/0*zAn0BtH_iz7b8Ywj.jpg)

With [Custom Types](https://mikro-orm.io/docs/custom-types/) we can now enhance how the database value will be represented in the ORM. You can define custom types by extending Type abstract class, it has 4 optional methods:

- convertToDatabaseValue(value: any, platform: Platform): any

Converts a value from its JS representation to its database representation of this type. By default returns unchanged value.

- convertToJSValue(value: any, platform: Platform): any

Converts a value from its database representation to its JS representation of this type. By default returns unchanged value.

- toJSON(value: any, platform: Platform): any

Converts a value from its JS representation to its serialized JSON form of this type. By default converts to the database value.

- getColumnType(prop: EntityProperty, platform: Platform): string

Gets the SQL declaration snippet for a field of this type. By default returns columnType of given property.

Here is a simplified version of DateType that is already present in the ORM:

```typescript
import { Type, Platform, EntityProperty, ValidationError } from 'mikro-orm';

export class DateType extends Type {

  convertToDatabaseValue(value: any, platform: Platform): any {
    return value.toISOString().substr(0, 10);
  }

  convertToJSValue(value: any, platform: Platform): any {
    return new Date(value);
  }

  getColumnType(): string {
    return 'date';
  }

}
```

```typescript
@Entity()
export class FooBar implements IdEntity<FooBar> {
  
  @PrimaryKey()
  id!: number;
  
  @Property({ type: DateType })
  born?: Date;

}
```

### And Many More…

There are many more new features, see the [changelog](https://github.com/mikro-orm/mikro-orm/blob/master/CHANGELOG.md) to read the full list. Here are few of them worth mentioning:

- [Improved support for References](https://mikro-orm.io/docs/entity-references/)
- [Navite Enum support](https://mikro-orm.io/docs/defining-entities/#enums)
- [em.findAndCount()](https://mikro-orm.io/docs/entity-manager#fetching-paginated-results) and [em.findOneOrFail()](https://mikro-orm.io/docs/entity-manager#handling-not-found-entities) methods
- [ReflectMetadataProvider](https://mikro-orm.io/docs/metadata-providers/#reflectmetadataprovider) as a fast alternative to ts-morph reflection
- Improved logging with query highlighting
- [Support for bundling via Webpack](https://mikro-orm.io/docs/deployment/#deploy-a-bundle-of-entities-and-dependencies-with-webpack)
- Eager loading
- [Read Connections](https://mikro-orm.io/docs/read-connections)
- More strict entity definition validation

### Notable Breaking Changes

Here is a short list of breaking changes. You can see the full list in the docs: [https://mikro-orm.io/docs/upgrading-v2-to-v3/](https://mikro-orm.io/docs/upgrading-v2-to-v3/).

#### Auto-flushing Disabled by Default

> _If you had_ _autoFlush: false in your ORM configuration before, you can now remove this line, no changes are needed in your app._

Default value for autoFlush is now false. That means you need to call em.flush() yourself to persist changes into database. You can still change this via ORM's options to ease the transition but generally it is not recommended as it can cause unwanted small transactions being created around each persist.

```typescript
orm.em.persist(new Entity()); // no auto-flushing by default
await orm.em.flush();
await orm.em.persist(new Entity(), true); // you can still use second parameter to auto-flush
```

#### Transactions API

Transactions now require using em.transactional() method, previous methods beginTransaction/commit/rollback are now removed.

```typescript
await orm.em.transactional(async _em => {
  //... do some work
  const user = new User(...);
  user.name = 'George';
  _em.persistLater(user);
});
```

### Making it a bit more Professional…

Not a big deal, but probably worth mentioning — MikroORM’s repository has been transferred to new [MikroORM GitHub Organization](https://github.com/mikro-orm) and the website is now moved to [mikro-orm.io](https://mikro-orm.io). Old links should be properly redirected, if you find some 404, please let me know thru GitHub issues!

Website has also been redesigned — now it is built with Docusaurus (v2) and provides fulltext search by Algolia. The docs are now also [versioned](https://mikro-orm.io/versions).

[Check it out!](https://mikro-orm.io)

![](https://cdn-images-1.medium.com/max/1024/1*2pdwLgyPZNltJQ_2j8poSQ.png)

### What’s next?

Here are some features I am planning to work in the near future:

- Composite primary keys
- Transactions in MongoDB
- Complex hydration of joined result sets
- Slow query log
- M:N support in entity generator

There are also some interesting suggestion in the Github issues, like [Dataloader integration](https://github.com/mikro-orm/mikro-orm/issues/266).

#### WDYT?

So that is MikroORM 3, what do you think about it? What features or changes would you like to see next? Or what part of the documentation should be improved and how?

> _Like_ [_MikroORM_](https://mikro-orm.io)_? ⭐️_ [_Star it_](https://github.com/mikro-orm/mikro-orm) _on GitHub and share this article with your friends._

* * *
