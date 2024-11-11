---
title: 'Chapter 2: Relationships'
---

In this section, we will add more entities, create a common base entity to extend from, and define relationships between them.

## Created and updated timestamps

Before we add more entities, let's refactor our existing `User` entity a bit. We would like to store timestamps of when the entity was created and when it was updated for the last time. To do that, introduce two new properties:

```ts title='user.entity.ts'
@Property()
createdAt = new Date();

@Property({ onUpdate: () => new Date() })
updatedAt = new Date();
```

The `onUpdate` option here will be executed during the `flush` operation if the ORM detects the entity was updated. For create query, we depend on the property initializers - we already said that the ORM will never call your entity constructor when creating managed entities, so it is safe to use it like this.

## Custom base entity

Now let's say we want to have these timestamps on every entity in our app. We can refactor such common properties out to a custom base entity. Put the following into `src/modules/common/base.entity.ts`:

```ts title='base.entity.ts'
import { PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

You can see a base entity looks like any other entity, with one exception - it does not have the `@Entity()` decorator. There are some use cases where you will want to use the decorator even for the base entity, in that case, add `abstract: true` to the decorator options, e.g. `@Entity({ abstract: true })`.

Now extend this base entity from the `User` entity and remove the properties it defines:

> You can see the import with `.js` extension - this is mandatory for ESM projects. If your project is targeting CommonJS, drop it.

```ts title='user.entity.ts'
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity.js';

@Entity()
export class User extends BaseEntity {

  @Property()
  fullName!: string;

  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property({ type: 'text' })
  bio = '';

}
```

## More entities

Time to add the `Article` entity, it will have 4 string properties and one relationship - a ManyToOne relation pointing to the `User` entity. As you expected, it will go to the `src/modules/article/article.entity.ts` file.

```ts title='article.entity.ts'
import { Entity, ManyToOne, Property, t } from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity.js';
import { User } from '../user/user.entity.js';

@Entity()
export class Article extends BaseEntity {

  @Property({ unique: true })
  slug!: string;

  @Property({ index: true })
  title!: string;

  @Property({ length: 1000 })
  description!: string;

  @Property({ type: t.text, lazy: true })
  text!: string;

  @ManyToOne()
  author!: User;

}
```

Let's break this down, there are some new additions we haven't seen before.

- `slug` property is marked as `unique`, this will result in a unique constraint over the column
- `title` property is marked as `index`ed
- `description` property has a `length` option, the column will result in `varchar(1000)` with most SQL drivers
- `text` property uses the `t.text` mapped type, and is marked as `lazy`, meaning it won't be selected automatically
- `author` property is our first relationship

:::caution Default `reflect-metadata` provider

The examples here are all based on the `@mikro-orm/reflection` package that helps with advanced type reflection via `ts-morph`, based on TypeScript Compiler API. If you are using the default `reflect-metadata` provider, there are things you will need to add to the decorator options to make things work. Let's say the `author` property is optional, `ts-morph` would infer everything just fine, but with `reflect-metadata` you would have to do this:

```ts
// with @mikro-orm/reflection package (ts-morph)
@ManyToOne()
author?: User;

// with the default provider (reflect-metadata)
@ManyToOne({ entity: () => User, nullable: true })
author?: User;
```

Consult [the docs](../metadata-providers#limitations-and-requirements) for more examples.

:::

## Types of relations

There are 4 types of entity relationships in MikroORM:

- ManyToOne: Many instances of the current Entity refer to One instance of the referred Entity.
- OneToMany: One instance of the current Entity has Many instances (references) to the referred Entity.
- OneToOne: One instance of the current Entity refers to One instance of the referred Entity.
- ManyToMany: Many instances of the current Entity refers to Many instances of the referred Entity.

Relations can be unidirectional and bidirectional. Unidirectional relation is defined only on one side (the owning side). Bidirectional ones are defined on both sides, while one is owning side (where references are stored), marked by `inversedBy` attribute pointing to the inverse side. On the inversed side we define it with `mappedBy` attribute pointing back to the owner.

> When modeling bidirectional relationship, you can also omit the `inversedBy` attribute, defining `mappedBy` on the inverse side is enough as it will be auto-wired.

Check the [Modeling Entity Relationships](../relationships) section in the documentation for more details and examples for each of the types.

## Working with relations

Let's get back to the `server.ts` file and try a few things out with our new `Article` entity, namely with its `author` relation.

### Creating entity graph

So far we used the entity constructor manually to create an entity instance. Sometimes we might want to create the whole entity graph, including relations. You can use [`em.create()`](/api/core/class/EntityManager#create) for that, it is a synchronous method that creates the entity instance for you. It allows you to create a deep entity graph, mapping foreign keys of your relations to entity references of the correct type. This method will also call [`em.persist()`](/api/core/class/EntityManager#persist) on the created entity (unless disabled via `persistOnCreate` option).

> You can wipe most of the contents of `server.ts` file and keep only the initial part with ORM init, up to the point where the first `User` entity gets flushed, plus the `orm.close()` call at the end. We won't be using this code going forward, it is just a playground for you.

```ts title='server.ts'
// create new user entity instance via constructor
const user = new User();
user.email = 'foo@bar.com';
user.fullName = 'Foo Bar';
user.password = '123456';

// fork first to have a separate context
const em = orm.em.fork();

// first mark the entity with `persist()`, then `flush()`
await em.persist(user).flush();

// clear the context to simulate fresh request
em.clear();

// create the article instance
const article = em.create(Article, {
  title: 'Foo is Bar',
  text: 'Lorem impsum dolor sit amet',
  author: user.id,
});

// `em.create` calls `em.persist` automatically, so flush is enough
await em.flush();
console.log(article);
```

:::info `em.clear()`

If you carefully checked this snippet, you probably found that new mysterious [`em.clear()`](/api/core/class/EntityManager#clear) call. What does it do? It clears the context for the [`EntityManager`](/api/core/class/EntityManager), meaning it will detach all the entities it was managing. It will bring the [`EntityManager`](/api/core/class/EntityManager) to the same state as if you would create a fresh fork via [`em.fork()`](/api/core/class/EntityManager#fork). You won't usually need this in your app, but it is very handy for unit testing, to simulate new requests coming in. You may as well use forks explicitly if you want.

:::

But wait, the editor is complaining about something. You probably see this cryptic error:

```
Argument of type '{ slug: string; title: string; description: string; text: string; author: number; }' is not assignable to parameter of type 'RequiredEntityData<Article>'.
  Type '{ slug: string; title: string; description: string; text: string; author: number; }' is missing the following properties from type '{ slug: string; title: string; description: string; text: string; author: EntityData<User> | { id?: number | null | undefined; fullName?: string | null | undefined; email?: string | ... 1 more ... | undefined; password?: string | ... 1 more ... | undefined; bio?: string | ... 1 more ... | undefined; } | EntityDataPr...': createdAt, updatedAt ts(2345)
```

It's indeed a bit ugly, but if you look carefully, you will see the important details at the very beginning and at the very end. This error tells us the object we are passing into [`em.create()`](/api/core/class/EntityManager#create) is not complete - it is missing two properties, the `createdAt` and `updatedAt` timestamps. But we define the default value for them via property initializer, what's the problem here?

The thing is, there is no easy way to tell whether an object property has an initializer or not - for TypeScript our `createdAt` and `updatedAt` properties are both mandatory. To get around this while preserving the strict type checking, you can use the `OptionalProps` symbol. As both of the problematic properties live in the `BaseEntity`, put it there:

```ts title='base.entity.ts'
import { OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseEntity {

  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

With this change, you can see the TypeScript error is now gone. Running the `npm start`, you will see the `Article` entity will get persisted and logged to the console:

```
[query] begin
[query] insert into `article` (`author_id`, `created_at`, `description`, `slug`, `text`, `title`, `updated_at`) values (1, 1662908804371, 'Foo is bar', 'foo', 'Lorem impsum...', 'Foo', 1662908804371) [took 0 ms]
[query] commit
Article {
  id: 1,
  createdAt: 2022-09-11T15:06:44.371Z,
  updatedAt: 2022-09-11T15:06:44.371Z,
  slug: 'foo',
  title: 'Foo',
  description: 'Foo is bar',
  text: 'Lorem impsum...',
  author: (User) { id: 1 }
}
```

Remember the entity references and loaded state we discussed earlier? You can see that here in action, the `Article.author` is an entity reference with just the primary key. It is automatically logged as `(User)` so you can easily tell the loaded state of any entity, but it is in fact the very same `User` entity instance:

```ts
console.log('it really is a User', article.author instanceof User); // true
console.log('but not initialized', wrap(article.author).isInitialized()); // false
```

### Using entity constructor

Every `Article` can be identified by a unique slug - a URL fragment that can be used to look up the article. Currently, it is just a regular string property, but we can do better here. The value should be always bound to the article title. For simplicity, we will use the following function:

```ts
function convertToSlug(text: string) {
  return text.toLowerCase()
             .replace(/[^\w ]+/g, '')
             .replace(/ +/g, '-');
}
```

We want the URL to remain the same after the article gets created, so let's generate the slug inside `Article` constructor. Similarly, you can use the text property and store its first 1000 characters as the description:

```ts title='article.entity.ts'
import { Entity, ManyToOne, Property, t } from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity.js';
import { User } from '../user/user.entity.js';

function convertToSlug(text: string) {
  return text.toLowerCase()
             .replace(/[^\w ]+/g, '')
             .replace(/ +/g, '-');
}

@Entity()
export class Article extends BaseEntity {

  @Property({ unique: true })
  slug: string;

  @Property({ index: true })
  title: string;

  @Property({ length: 1000 })
  description: string;

  @Property({ type: t.text, lazy: true })
  text: string;

  @ManyToOne()
  author: User;

  constructor(title: string, text: string, author: User) {
    super();
    this.title = title;
    this.text = text;
    this.author = author;
    this.slug = convertToSlug(title);
    this.description = this.text.substring(0, 999) + '…';
  }

}
```

With this change, the `slug` and `description` properties are optional too - but [`em.create()`](/api/core/class/EntityManager#create) complains about them. You need to add them to the `OptionalProps` definition, as with the timestamps before. But these are the `Article` entity properties, so we should do it in the `Article` entity somehow. Maybe like this?

```ts title='article.entity.ts'
export class Article extends BaseEntity {
  [OptionalProps]?: 'slug' | 'description';
}
```

Unfortunately not, you will see TypeScript error like this one:

```
Property '[OptionalProps]' in type 'Article' is not assignable to the same property in base type 'BaseEntity'.
  Type '"slug" | "description" | undefined' is not assignable to type '"createdAt" | "updatedAt" | undefined'.
    Type '"slug"' is not assignable to type '"createdAt" | "updatedAt" | undefined'. ts(2416)
 ```

#### Generics to the rescue!

The solution here might not be clear, but it is very simple. Instead of redefining the `OptionalProps` property, we define a generic type argument on the `BaseEntity` class and pass `Article` specific properties down to the base entity.

```ts title='base.entity.ts'
export abstract class BaseEntity<Optional = never> {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | Optional;
  // all properties remain the same
}
```

We picked the default value of `never` for our type - this is because a union with `never` will always yield the same type, e.g. `string | never` is the same as just `string`.

```ts title='article.entity.ts'
export class Article extends BaseEntity<'slug' | 'description'> {
  // all properties remain the same
}
```

Now the [`em.create()`](/api/core/class/EntityManager#create) call work even without the `slug` and `description:

```ts
const article = em.create(Article, {
  title: 'Foo is Bar',
  text: 'Lorem impsum dolor sit amet',
  author: user.id,
});
console.log(article);
```

Running `npm start` we can see the `slug` and `description` populated with generated values:

```
Article {
  id: 1,
  createdAt: 2022-09-11T16:08:16.489Z,
  updatedAt: 2022-09-11T16:08:16.489Z,
  slug: 'foo-is-bar',
  title: 'Foo is Bar',
  description: 'Lorem impsum dolor sit amet…',
  text: 'Lorem impsum dolor sit amet',
  author: (User) { id: '1' }
}
```

#### Alternative approach with `Opt` type

Another way to make TypeScript aware of what properties are optional is the `Opt` type, you can intersect it with the actual property type. This way the above problem with extending classes is no longer present, as we operate on property level:

```ts title='article.entity.ts'
export class Article extends BaseEntity {

  @Property({ unique: true })
  slug: string & Opt;

  @Property({ length: 1000 })
  description: Opt<string>; // can be used via generics too

  // ...

}
```

## Populating relationships

What if we want to fetch the `Article` together with the `author` relation? We can use `populate` hints for that:

```ts title='server.ts'
// clear the context to simulate fresh request
em.clear();

// find article by id and populate its author
const articleWithAuthor = await em.findOne(Article, article.id, { populate: ['author'] });
console.log(articleWithAuthor);
```

Run the `npm start` as usual:

```
[query] select `a0`.`id`, `a0`.`created_at`, `a0`.`updated_at`, `a0`.`slug`, `a0`.`title`, `a0`.`description`, `a0`.`author_id` from `article` as `a0` where `a0`.`id` = 1 limit 1 [took 1 ms]
[query] select `u0`.* from `user` as `u0` where `u0`.`id` in (1) order by `u0`.`id` asc [took 0 ms]
Article {
  id: 1,
  createdAt: 2022-09-11T16:57:57.941Z,
  updatedAt: 2022-09-11T16:57:57.941Z,
  slug: 'foo-is-bar',
  title: 'Foo is Bar',
  description: 'Lorem impsum dolor sit amet…',
  text: undefined,
  author: User {
    id: 1,
    fullName: 'Foo Bar',
    email: 'foo@bar.com',
    password: '123456',
    bio: ''
  }
}
```

### Lazy scalar properties

You can see the `text` property being `undefined` - this is because we marked it as `lazy`, therefore the value is not automatically selected. If we add the `text` to populate hint, we will get the value:

```ts title='server.ts'
const articleWithAuthor = await em.findOne(Article, article.id, {
  populate: ['author', 'text'],
});
```

Or if the entity is already loaded, you can use `em.populate()`:

```ts title='server.ts'
const articleWithAuthor = await em.findOne(Article, article.id, {
  populate: ['author'],
});
await em.populate(articleWithAuthor!, ['text']);
```

### Loading strategies

You can see two queries being fired, one for loading the `Article` entity, another loading the `author` relation (so a `User` entity). Why not a single joined query? This is mostly a historic reason, but MikroORM was originally born as a MongoDB-only ORM, and as such, using separate queries for each database table was the best approach to bring such functionality.

This default behavior is called `LoadStrategy.SELECT_IN`. If you want to have a single query that will be joining the two tables instead of this, use `LoadStrategy.JOINED`:

```ts title='server.ts'
const articleWithAuthor = await em.findOne(Article, article.id, {
  populate: ['author', 'text'],
  strategy: LoadStrategy.JOINED,
});
```

Which yields:

```
[query] select `a0`.`id`, `a0`.`created_at`, `a0`.`updated_at`, `a0`.`slug`, `a0`.`title`, `a0`.`description`, `a0`.`text`, `a0`.`author_id`, `a1`.`id` as `a1__id`, `a1`.`full_name` as `a1__full_name`, `a1`.`email` as `a1__email`, `a1`.`password` as `a1__password`, `a1`.`bio` as `a1__bio` from `article` as `a0` left join `user` as `a1` on `a0`.`author_id` = `a1`.`id` where `a0`.`id` = 1 [took 1 ms]
Article {
  id: 1,
  createdAt: 2022-09-11T17:09:10.984Z,
  updatedAt: 2022-09-11T17:09:10.984Z,
  slug: 'foo-is-bar',
  title: 'Foo is Bar',
  description: 'Lorem impsum dolor sit amet…',
  text: 'Lorem impsum dolor sit amet',
  author: User {
    id: 1,
    fullName: 'Foo Bar',
    email: 'foo@bar.com',
    password: '123456',
    bio: ''
  }
}
```

> Both approaches have their pros and cons, use the one that suite best the use case at hand. If you want, you can change the loading strategy globally via `loadStrategy` option in the ORM config.

### Serialization

What about the password? Seeing the logger `Article` entity with populated `author`, there is something we need to fix. We can see the user's password, in plain text! We will need to hash it and ensure it never leaks to the API response by adding `hidden` serialization flag. Moreover, we can mark it as `lazy`, just like we did with the `Article.text`, as we rarely want to select it.

For now, let's use `sha256` algorithm which we can create synchronously, and hash the value inside the constructor:

```ts title='user.entity.ts'
import crypto from 'crypto';

@Entity()
export class User extends BaseEntity<'bio'> {

  @Property()
  fullName: string;

  @Property()
  email: string;

  @Property({ hidden: true, lazy: true })
  password: string;

  @Property({ type: 'text' })
  bio = '';

  constructor(fullName: string, email: string, password: string) {
    super();
    this.fullName = fullName;
    this.email = email;
    this.password = User.hashPassword(password);
  }

  static hashPassword(password: string) {
    return crypto.createHmac('sha256', password).digest('hex');
  }

}
```

Now change the part where we create our `User` entity, as the constructor is now required:

```ts
const user = new User('Foo Bar', 'foo@bar.com', '123456');
console.log(user);
```

After running `npm start`, you can see that the password is hashed, and later when you load the `Article.author`, the password is no longer selected:

```
User {
  id: undefined,
  createdAt: 2022-09-11T17:22:31.619Z,
  updatedAt: 2022-09-11T17:22:31.619Z,
  fullName: 'Foo Bar',
  email: 'foo@bar.com',
  password: 'b946ccc987465afcda7e45b1715219711a13518d1f1663b8c53b848cb0143441',
  bio: ''
}
```

That should be good enough for the time being. Don't worry, we will improve on this, later on, using `argon2` via lifecycle hooks, but first things first!

## Collections: OneToMany and ManyToMany

You got the `User` entity opened, let's add one more property to it. You have the `Article.author` property that defines the owning side of this relationship between `Article` and `User` entities. Now define the inverse side—for ManyToOne relation it is the OneToMany kind—represented by a `Collection` of `Article` entities:

```ts
@Entity()
export class User extends BaseEntity<'bio'> {

  // ...

  @OneToMany({ mappedBy: 'author' })
  articles = new Collection<Article>(this);

}
```

MikroORM represents the relation via the `Collection` class. Before we dive into what it means, let's add one more entity to the `Article` module to test the ManyToMany relation too. It will be a `Tag` entity, so we can categorize the article based on some dynamically defined tags.

> The `Tag` entity semantically belongs to the `Article` module, so let's put it there, to the `src/modules/article/tag.entity.ts` file.

```ts title='tag.entity.ts'
import { Collection, Entity, ManyToMany, Property } from '@mikro-orm/core';
import { Article } from './article.entity.js';
import { BaseEntity } from '../common/base.entity.js';

@Entity()
export class Tag extends BaseEntity {

  @Property({ length: 20 })
  name!: string;

  @ManyToMany({ mappedBy: 'tags' })
  articles = new Collection<Article>(this);

}
```

And we need to define the owning side too, which is `Article.tags`:

```ts title='article.entity.ts'
@ManyToMany()
tags = new Collection<Tag>(this);
```

It is enough to point to the owning side via `mappedBy` option from the inverse side (or vice versa). If you want to define the relation from owning side, use `inversedBy` option. A ManyToMany relation that does not define any of those two is always considered the owning side.

```ts title='article.entity.ts'
@ManyToMany({ inversedBy: 'articles' })
tags = new Collection<Tag>(this);
```

### Working with collections

The `Collection` class implements the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol), so you can use `for of` loop to iterate through it.

Another way to access collection items is to use bracket syntax like when we access array items. Keep in mind that this approach will not check if the collection is initialized, while using the `getItems()` method will throw an error in this case.

> Note that array access in `Collection` is available only for reading already loaded items, we cannot add new items to `Collection` this way.

To get all entities stored in a `Collection`, we can use `getItems()` method. It will throw in case the `Collection` is not initialized. If we want to disable this validation, we can use `getItems(false)`. This will give us the entity instances managed by the identity map.

Alternatively, you can use `toArray()` which will serialize the `Collection` to an array of DTOs. Modifying those will have no effect on the actual entity instances.

:::tip `em.findOneOrFail()`

So far we used `em.findOne()` which can return `null` if the entity is not found in the database. This results in extensive usage of the non-null assertion operator in TypeScript, which can get messy. A better solution is to use `em.findOneOrFail()`, which always returns the entity or throws an error, namely an instance of `NotFoundError` provided by the ORM.

:::

```ts
// clear the context to simulate fresh request
em.clear();

// populating User.articles collection
const user = await em.findOneOrFail(User, 1, { populate: ['articles'] });
console.log(user);

// or you could lazy load the collection later via `init()` method
if (!user.articles.isInitialized()) {
  await user.articles.init();
}

// to ensure collection is loaded (but do nothing if it already is), use `loadItems()` method
await user.articles.loadItems();

for (const article of user.articles) {
   console.log(article.title);
   console.log(article.author.fullName); // the `article.author` is linked automatically thanks to the Identity Map
}
```

> `Collection.init()` will always query the database, while `Collection.loadItems()` does only if the collection is not yet initialized, so calling `Collection.loadItems()` is safe without previous `isInitialized()` check.

Running this, we get the following:

```
User {
  id: 1,
  createdAt: 2022-09-11T18:18:14.376Z,
  updatedAt: 2022-09-11T18:18:14.376Z,
  fullName: 'Foo Bar',
  email: 'foo@bar.com',
  password: undefined,
  bio: '',
  articles: Collection<Article> {
    '0': Article {
      id: 1,
      createdAt: 2022-09-11T18:18:14.384Z,
      updatedAt: 2022-09-11T18:18:14.384Z,
      slug: 'foo-is-bar',
      title: 'Foo is Bar',
      description: 'Lorem impsum dolor sit amet…',
      text: undefined,
      author: [User],
      tags: [Collection<Tag>]
    },
    initialized: true,
    dirty: false
  }
}
```

Now try to add some tags to the first article:

```ts title='server.ts'
// create some tags and assign them to the first article
const [article] = user.articles;
const newTag = em.create(Tag, { name: 'new' });
const oldTag = em.create(Tag, { name: 'old' });
article.tags.add(newTag, oldTag);
await em.flush();
console.log(article.tags);
```

And just for the sake of it, try to remove one of the tags:

```ts title='server.ts'
// to remove items from collection, we first need to initialize it, we can use `init()`, `loadItems()` or `em.populate()`
await em.populate(article, ['tags']);

// remove 'old' tag by reference
article.tags.remove(oldTag);

// or via callback
article.tags.remove(t => t.id === oldTag.id);

await em.flush();
```

Refer to the [Collections section](../collections) in the docs for more information and examples.

# Events and life cycle hooks

Time to improve our password hashing. Let's use the `argon2` package, which provides `hash` and `verify` functions. They are both async, so we cannot use them inside the entity constructor like before. Instead, we need to use the lifecycle hooks, namely `@BeforeCreate()` and `@BeforeUpdate()`.

> Don't forget to install the `argon2` package via `npm install argon2`.

The plan is following:

- the password will remain in plaintext when assigned via the constructor
- `hashPassword` function will become an event handler, we decorate it with `@BeforeCreate()` and `@BeforeUpdate()`
- as such, it will get the `EventArgs` parameter during the flush, we use that to detect if the password property changed
- the `args.changeSet` holds the `ChangeSet` object defining the metadata about the entity and its state
- `ChangeSet.payload` holds the actual computed difference
- we add a new `verifyPassword()` method to the `User` entity to later

```ts
import { hash, verify } from 'argon2';

export class User extends BaseEntity<'bio'> {

  // ...

  constructor(fullName: string, email: string, password: string) {
    super();
    this.fullName = fullName;
    this.email = email;
    this.password = password; // keep plain text, will be hashed via hooks
  }

  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword(args: EventArgs<User>) {
    // hash only if the password was changed
    const password = args.changeSet?.payload.password;

    if (password) {
      this.password = await hash(password);
    }
  }

  async verifyPassword(password: string) {
    return verify(this.password, password);
  }

}
```

## ⛳ Checkpoint 2

We added 2 new entities: `Article` and `Tag` and a common `BaseEntity`. You can find working StackBlitz for the current state here:

> Due to the nature of how the ESM support in ts-node works, it is not possible to use it inside StackBlitz project - we need to use `node --loader` instead. We also use in-memory database, SQLite feature available via special database name `:memory:`.

This is our [`server.ts` file](https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-2?file=src%2Fserver.ts) after this chapter:

<iframe width="100%" height="800" frameborder="0" src="https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-2?embed=1&ctl=1&view=editor&file=src%2Fserver.ts">
</iframe>
