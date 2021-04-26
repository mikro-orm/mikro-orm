---
slug: mikro-orm-4-released
title: 'MikroORM 4: Filling the Gaps'
author: Martin Adámek
authorTitle: Author of MikroORM
authorURL: https://github.com/B4nan
authorImageURL: https://avatars1.githubusercontent.com/u/615580?s=460&v=4
authorTwitter: B4nan
tags: [typescript, javascript, node, sql]
---

After 4 months of active development, I am thrilled to announce the release of [MikroORM 4](http://github.com/mikro-orm/mikro-orm). When I started to work on v4, the goal was to make it relatively small release, mainly to drop support for TypeScript 3.6 and Node.js 8, and to split the project into multiple packages, so we can have more fine grained control over the dependencies (mainly because of ts-morph having TS as a runtime dependency).

> But what a major release would that be, without having a bunch of new features as well, right?

<!--truncate-->

![Photo by Ryoji Iwata on Unsplash](https://cdn-images-1.medium.com/max/1024/0*JU7VN0bgkL57RnZJ)

### In case you don’t know…

If you never heard of [MikroORM](https://github.com/mikro-orm/mikro-orm), it’s a TypeScript data-mapper ORM with Unit of Work and Identity Map. It supports MongoDB, MySQL, PostgreSQL and SQLite drivers currently. Key features of the ORM are:

- [Implicit transactions](https://github.com/mikro-orm/mikro-orm#implicit-transactions)
- [ChangeSet based persistence](https://github.com/mikro-orm/mikro-orm#changeset-based-persistence)
- [Identity map](https://mikro-orm.io/docs/identity-map/)

![](https://cdn-images-1.medium.com/max/1024/0*VEfH0Y8e_cMVXad1.png)

You can read the full [introductory article here](https://medium.com/dailyjs/introducing-mikro-orm-typescript-data-mapper-orm-with-identity-map-9ba58d049e02) or [browse through the docs](https://mikro-orm.io/).

### Quick summary of 3.x releases

Before I dive into all the things v4, let’s recap the major features that landed in 3.x releases:

- [Defining entities via](https://mikro-orm.io/docs/entity-schema)[EntitySchema](https://mikro-orm.io/docs/entity-schema)
- [Propagation of changes to m:1/1:1 to inverse sides](https://mikro-orm.io/docs/propagation)
- [Transactions in MongoDB](https://mikro-orm.io/docs/usage-with-mongo#transactions)
- [Composite primary keys](https://mikro-orm.io/docs/composite-keys)

### Monorepo

The first major change I want to talk about is the split into multiple packages. As mentioned above, the biggest motivation for this change was to get rid of TS as a runtime dependency, when it is not needed. Another nice example is knex, which is used as a base layer for SQL driver, but has no meaning for mongodb users. Lastly, it turned out Highlight.js, that was used for query highlighting, is also quite fat and slow, so I ended up writing custom highlighters that are built for CLI and are (almost) dependency free.

In v4, there are 12 packages and 2 highlighters, you install only what you use, and you have control over what is needed in production and what is just a dev dependency. This is especially useful for serverless users, where cold start speeds matter.

It felt natural to offer some shortcuts on the EntityManager and EntityRepository level, so we now have flavours of those classes in place, that offer things like em.execute(sql) or em.aggregate(). To access those driver specific methods, be sure to use the classes from driver packages:

```ts
import { EntityManager } from '@mikro-orm/mysql'; // or any other SQL driver package

const em: EntityManager;
const qb = await em.createQueryBuilder(…); // or `em.execute()`, `em.getKnex()`, ...
```

> Database connectors like pg or sqlite3 are now dependencies of the driver packages (e. g. @mikro-orm/sqlite).

### Filters

Probably the most interesting feature of v4 are [filters](https://mikro-orm.io/docs/filters/), also known as association scopes. They allow you to define data visibility rules, both global and bound to entity. One common application of filters are soft deletes, or automatic tenant conditions.

```ts
@Entity()
@Filter({ name: 'expensive', cond: { price: { $gt: 1000 } } })
@Filter({ name: 'long', cond: { 'length(text)': { $gt: 10000 } } })
@Filter({ name: 'hasAuthor', cond: { author: { $ne: null } }, default: true })
@Filter({ name: 'writtenBy', cond: args => ({ author: { name: args.name } }) })
export class Book {
  ...
}

const books1 = await orm.em.find(Book, {}, {
  filters: ['long', 'expensive'],
});
const books2 = await orm.em.find(Book, {}, {
  filters: { hasAuthor: false, long: true, writtenBy: { name: 'God' } },
});
```

Filters are applied to those methods of EntityManager: find(), findOne(), findAndCount(), findOneOrFail(), count(), nativeUpdate() and nativeDelete(). Filters can be parametric, the parameter can be also in form of callback (possibly async). You can also make the filter enabled by default.

> Filter can be defined at the entity level, dynamically via EM (global filters) or in the ORM configuration.

#### Global Filters

We can also register filters dynamically via EntityManager API. We call such filters global. They are enabled by default (unless disabled via last parameter in addFilter() method), and applied to all entities. You can limit the global filter to only specified entities.

> _Filters as well as filter params set on the EM will be copied to all its forks._

```ts
// bound to entity, enabled by default
em.addFilter('writtenBy', args => ({ author: args.id }), Book);

// global, enabled by default, for all entities
em.addFilter('tenant', args => { ... });

// global, enabled by default, for only specified entities
em.addFilter('tenant', args => { ... }, [Author, Book]);
...

// set params (probably in some middleware)
em.setFilterParams('tenant', { tenantId: 123 });
em.setFilterParams('writtenBy', { id: 321 });
```

### EventSubscribers and flush events

As opposed to regular lifecycle hooks, we can now use [EventSubscriber](https://mikro-orm.io/docs/lifecycle-hooks/#eventsubscriber) to hook to multiple entities or if you do not want to pollute the entity prototype. All methods are optional, if you omit the getSubscribedEntities() method, it means you are subscribing to all entities.

```ts
import { EntityName, EventArgs, EventSubscriber, Subscriber } from '@mikro-orm/core';

@Subscriber()
export class AuthorSubscriber implements EventSubscriber<Author> {

  getSubscribedEntities(): EntityName<Author>[] {
    return [Author];
  }

  async afterCreate(args: EventArgs<Author>): Promise<void> {
    // ...
  }

  async afterUpdate(args: EventArgs<Author>): Promise<void> {
    // ... 
  }

}
```

#### Flush events

There is a [special kind of events](https://mikro-orm.io/docs/lifecycle-hooks/#flush-events) executed during the commit phase (flush operation). They are executed before, during and after the flush, and they are not bound to any entity in particular.

- beforeFlush is executed before change sets are computed, this is the only event where it is safe to persist new entities.
- onFlush is executed after the change sets are computed.
- afterFlush is executed as the last step just before the flush call resolves. it will be executed even if there are no changes to be flushed.

Flush event args will not contain any entity instance, as they are entity agnostic. They do contain additional reference to the UnitOfWork instance.

Following example demonstrates the hidden power of flush events — they allow to hook into the change set tracking, adjusting what will be persisted and how. Here we try to find a CREATE change set for entity FooBar, and if there is any, we automatically create a new FooBaz entity, connecting it to the FooBar one. This kind of operations was previously impossible, as in regular lifecycle hooks we can only adjust the entity that triggers the event.

```ts
@Subscriber()
export class FooBarSubscriber implements EventSubscriber {

  async onFlush(args: FlushEventArgs): Promise<void> {
    const changeSets = args.uow.getChangeSets();
    const cs = changeSets.find(cs => cs.type === ChangeSetType.CREATE && cs.entity instanceof FooBar);

    if (cs) {
      const baz = new FooBaz();
      baz.name = 'dynamic';
      cs.entity.baz = baz;
      args.uow.computeChangeSet(baz);
      args.uow.recomputeSingleChangeSet(cs.entity);
    }
  }

}

const bar = new FooBar();
bar.name = 'bar';
await em.persistAndFlush(bar);
```

### Joined loading strategy

Loading of complex relations now support so called [JOINED strategy](https://mikro-orm.io/docs/loading-strategies/). Its name is quite self-explanatory — instead of the default (SELECT\_IN) strategy, it uses single SQL query and maps the result to multiple entities.

```ts
// with the default SELECT_IN strategy, following will issue 2 queries
const author = await orm.em.findOne(Author, 1, { populate: ['books'] });

// select * from author where id = 1;
// select * from book where author_id in (1);

// we can now use JOINED strategy to use a single query
const author = await orm.em.findOne(Author, 1, { populate: ['books'], strategy: LoadStrategy.JOINED });

// select a.*, b.* from author a left join book b on b.author_id = a.id where a.id = 1;
```

### Single Table Inheritance

[STI is an inheritance mapping strategy](https://mikro-orm.io/docs/inheritance-mapping/#single-table-inheritance) where all classes of a hierarchy are mapped to a single database table. In order to distinguish which row represents which type in the hierarchy a so-called discriminator column is used.

> If no discriminator map is provided, it will be generated automatically.

Following example defines 3 entities — they will all be stored in a single database table called person, with a special column named type, that will be used behind the scenes to know what class should be used to represent given row/entity.

```ts
@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: { person: 'Person', employee: 'Employee', owner: 'Owner' },
})
export class Person {
  // …
}

@Entity()
export class Employee extends Person {
  // …
}

@Entity()
export class Owner extends Person {
  // …
}
```

### Embeddables

[Embeddables](https://mikro-orm.io/docs/embeddables/) are classes which are not entities themselves, but are embedded in entities and can also be queried. You’ll mostly want to use them to reduce duplication or separating concerns. Value objects such as date range or address are the primary use case for this feature.

> Embeddables can only contain properties with basic @Property() mapping.

Following example will result in a single database table, where the address fields will be inlined (with prefix) to the user table.

```ts
@Entity()
export class User {

  @Embedded()
  address!: Address;

}

@Embeddable()
export class Address {
  
  @Property()
  street!: string;

  @Property()
  postalCode!: string;

  @Property()
  city!: string;

  @Property()
  country!: string;

}
```

### Lazy scalar properties

In MikroORM 4, we can mark any property as [lazy: true](https://mikro-orm.io/docs/defining-entities#lazy-scalar-properties) to omit it from the select clause. This can be handy for properties that are too large and you want to have them available only some times, like a full text of an article.

When we need such value, we can use populate parameter to load it as if it was a reference.

> If the entity is already loaded and you need to populate a lazy scalar property, you might need to pass refresh: true in the FindOptions.

```ts
@Entity()
export class Book {

  @Property({ columnType: 'text', lazy: true })
  text: string;

}

const b1 = await em.find(Book, 1); // this will omit the `text` property
const b2 = await em.find(Book, 1, { populate: ['text'] }); // this will load the `text` property
```

### Computed Properties

Another small enhancement in entity definition is the [@Formula() decorator](https://mikro-orm.io/docs/defining-entities/#formulas). It can be used to map some SQL snippet to your entity. The SQL fragment can be as complex as you want and even include subselects.

```ts
@Entity()
export class Box {

  @Formula('obj_length * obj_height * obj_width')
  objectVolume?: number;

}
```

> Formulas will be added to the select clause automatically. In case you are facing problems with NonUniqueFieldNameException, you can define the formula as a callback that will receive the entity alias in the parameter.

### Type-safe references

Next feature I would like to mention is rather hidden, and is a bit experimental. In MikroORM 4, all EntityManager and EntityRepository methods for querying entities (e.g. find()) will now return special Loaded type, where we automatically infer what relations are populated. It dynamically adds special get() method to both Reference and Collection instances, that you can use to ensure the relation is loaded on the type level.

```ts
@Entity()
export class Book {

  @PrimaryKey()
  id: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author: IdentifiedReference<Author, 'id'>;

  @ManyToOne(() => Publisher, { wrappedReference: true })
  publisher: IdentifiedReference<Publisher, 'id'>;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);
    
}
```

```ts
// will return `Loaded<Book, 'publisher' | 'tags' >`
const book = await orm.em.findOne(Book, 1, { populate: ['publisher', 'tags'] });

// the `Book.publisher.get()` will be available as we explicitly populated that relation
console.log(book.publisher.get().name);
console.log(book.publisher.$.name); // we can also use the `$` alias

// on the other hand, `Book.author` was not populated, so trying to access `get()` will fail to compile
console.log(book.author.get().name); // fails with `TS2339: Property 'get' does not exist on type 'IdentifiedReference'`

// we can also use it on collections
console.log(book.tags.get().map(t => t.name)); // `get()` will return array of items
```

### QueryBuilder improvements

There have been quite a lot of small adjustments in QueryBuilder, to name a few things:

- support for subqueries and qb.ref()
- using sql snippets with qb.raw()
- pagination support via subselects (QueryFlag.PAGINATE)
- update & delete queries with auto-joining

Here are few examples of those features in action:

```ts
const qb = em.createQueryBuilder(Book);
qb.update({ price: qb.raw('price + 1') }).where({ uuid: '123' });

// update `book` set `price` = price + 1 where `uuid_pk` = ?'
```

```ts
// following example assumes that there is a virtual (persist: false) property
// on `Author` entity named `booksTotal`

const qb1 = em.createQueryBuilder(Book, 'b');
qb1.count('b.uuid', true).where({ author: qb1.ref('a.id') });
const qb2 = em.createQueryBuilder(Author, 'a');
qb2.select(['*', qb1.as('Author.booksTotal')]).orderBy({ booksTotal: 'desc' });

// select `a`.*, (select count(distinct `b`.`uuid_pk`) as `count` from `book` as `b` where `b`.`author_id` = `a`.`id`) as `books_total` 
// from `author` as `a` 
// order by `books_total` desc
```

```ts
// following example assumes that there is a virtual (persist: false) property
// on `Author` entity named `booksTotal`

const knex = em.getKnex();
const qb1 = em.createQueryBuilder(Book, 'b').count('b.uuid', true).where({ author: knex.ref('a.id') }).getKnexQuery();
const qb2 = em.createQueryBuilder(Author, 'a');
qb2.select('*').withSubQuery(qb1, 'a.booksTotal').where({ 'a.booksTotal': { $in: [1, 2, 3] } });

// select `a`.* 
// from `author` as `a`
// where (select count(distinct `b`.`uuid_pk`) as `count` from `book` as `b` where `b`.`author_id` = `a`.`id`) in (?, ?, ?)
```

```ts
const qb = em.createQueryBuilder(Publisher);
qb.update({ name: 'test 123' }).where({ $or: [{ books: { author: 123 } }, { books: { title: 'book' } }] });

// update `publisher` set `name` = ? 
// where `id` in (select `e0`.`id` from (
//   select distinct `e0`.`id` from `publisher` as `e0` left join `book` as `e1` on `e0`.`id` = `e1`.`publisher_id` where (`e1`.`author_id` = ? or `e1`.`title` = ?)
// ) as `e0`)
```

### And many many more…

- em.begin/commit/rollback() methods are back
- using file globs for discovery (\*\*/\*.entity.ts)
- custom driver exceptions (UniqueConstraintViolationException, …)
- adding items to not-initialized collections
- bulk deletes and other performance improvements
- inference of custom repository type (EntityRepositoryType)
- [property serializers](https://mikro-orm.io/docs/serializing#property-serializers)

See the [changelog](https://github.com/mikro-orm/mikro-orm/blob/master/CHANGELOG.md) for full list of new features and fixes.

#### More example integrations

- Koa: [https://github.com/mikro-orm/koa-ts-example-app](https://github.com/mikro-orm/koa-ts-example-app)
- GraphQL: [https://github.com/driescroons/mikro-orm-graphql-example](https://github.com/driescroons/mikro-orm-graphql-example)
- Serverless: [https://github.com/thomaschaaf/serverless-mikro-orm-example-app](https://github.com/thomaschaaf/serverless-mikro-orm-example-app)

### Upgrading

For smooth upgrading, read the full [upgrading guide](https://mikro-orm.io/docs/upgrading-v3-to-v4). Here are few notable breaking changes:

- Default metadata provider is ReflectMetadataProvider, to use ts-morph, you need to install it from @mikro-orm/reflection and explicitly provide it in the ORM configuration. If you want to use ReflectMetadataProvider, be sure to see the [list of its limitations](https://mikro-orm.io/docs/metadata-providers/#limitations-and-requirements).
- TsMorphMetadataProvider now uses \*.d.ts files in production mode, so be sure to enable them in your tsconfig.json.
- @mikro-orm/core package is not dependent on knex, and therefore cannot provide methods like createQueryBuilder() — instead, those methods exist on SqlEntityManager. You can import it from the driver package, e.g. import { EntityManager } from '@mikro-orm/mysql;.
- To use CLI, you need to install @mikro-orm/cli package.
- When using folder based discovery, the options entitiesDirs and entitiesDirsTs are now removed in favour of entities and entitiesTs. You can now mix entity references with folders and file globs, negative globs are also supported.
- For Nest.js users, there is a new [@mikro-orm/nestjs](https://github.com/mikro-orm/nestjs) package, which is a fork of the [nestjs-mikro-orm](https://github.com/dario1985/nestjs-mikro-orm) module with changes needed for   
MikroORM 4.

### What’s next?

Here are some features I’d like to work on in the near future:

- Improved schema diffing
- ts-morph reflection via custom TS compiler plugin
- Query caching
- MS SQL Server support

### WDYT?

So thit is MikroORM 4, what do you think about it? What features or changes would you like to see next? Or what part of the documentation should be improved and how?

> _Like_ [_MikroORM_](https://mikro-orm.io/)_? ⭐️_ [_Star it_](https://github.com/mikro-orm/mikro-orm) _on GitHub and share this article with your friends. If you want to support the project financially, you can do so via_ [_GitHub Sponsors_](https://github.com/sponsors/B4nan)_._
