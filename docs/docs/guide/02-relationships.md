---
title: 'Chapter 2: Relationships'
---

In this section, we will add more entities, define shared base properties, and create relationships between them.

## Created and updated timestamps

Before we add more entities, let's refactor our existing `User` entity a bit. We would like to store timestamps of when the entity was created and when it was updated for the last time. With `defineEntity`, we add these using property builders:

```ts title='user.entity.ts'
createdAt: p.datetime().onCreate(() => new Date()),
updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
```

The `.onUpdate()` callback is executed during the `flush` operation if the ORM detects the entity was updated. For create queries, `.onCreate()` is used to set the initial value.

## Base entity

Now let's say we want to have these timestamps (and the primary key) on every entity in our app. With `defineEntity`, we can create a base entity that other entities extend. Put the following into `src/modules/common/base.entity.ts`:

```ts title='base.entity.ts'
import { defineEntity, p } from '@mikro-orm/core';

export const BaseSchema = defineEntity({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: p.integer().primary(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
  },
});
```

This is an abstract entity (it won't have its own table). Other entities can extend it using the `extends` option:

> You can see the import with `.js` extension - this is mandatory for ESM projects. If your project is targeting CommonJS, drop it.

```ts title='user.entity.ts'
import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string(),
    bio: p.text().default(''),
  },
});

export type User = InferEntity<typeof UserSchema>;
```

## More entities

Time to add the `Article` entity. It will have 4 string properties and one relationship - a ManyToOne relation pointing to the `User` entity. As you expected, it will go to the `src/modules/article/article.entity.ts` file.

```ts title='article.entity.ts'
import { defineEntity, InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { UserSchema } from '../user/user.entity.js';

export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  properties: {
    slug: p.string().unique(),
    title: p.string().index(),
    description: p.string().length(1000),
    text: p.text().lazy(),
    author: () => p.manyToOne(UserSchema),
  },
});

export type Article = InferEntity<typeof ArticleSchema>;
```

Let's break this down, there are some new additions we haven't seen before:

- `slug` property is marked as `.unique()`, this will result in a unique constraint over the column
- `title` property is marked as `.index()`ed
- `description` property has `.length(1000)`, the column will result in `varchar(1000)` with most SQL drivers
- `text` property uses `.text()` for the text type, and is marked as `.lazy()`, meaning it won't be selected automatically
- `author` property is our first relationship, defined with `p.manyToOne(UserSchema)`

Notice we use arrow functions for relations like `author: () => p.manyToOne(UserSchema)`. The arrow function wrapper is needed to handle circular references between entities.

> You can update your `mikro-orm.config.ts` to include the new `Article` entity in the `entities` array, but it is not strictly necessary. As long as the entity is part of some other discovered entity relationship, it will be discovered automatically.

## Types of relations

There are 4 types of entity relationships in MikroORM:

- ManyToOne: Many instances of the current Entity refer to One instance of the referred Entity.
- OneToMany: One instance of the current Entity has Many instances (references) to the referred Entity.
- OneToOne: One instance of the current Entity refers to One instance of the referred Entity.
- ManyToMany: Many instances of the current Entity refers to Many instances of the referred Entity.

Relations can be unidirectional and bidirectional. Unidirectional relation is defined only on one side (the owning side). Bidirectional ones are defined on both sides, while one is owning side (where references are stored), marked by `inversedBy` attribute pointing to the inverse side. On the inversed side you define it with `mappedBy` attribute pointing back to the owner.

> When modeling bidirectional relationship, you can also omit the `inversedBy` attribute, defining `mappedBy` on the inverse side is enough as it will be auto-wired.

Check the [Modeling Entity Relationships](../relationships) section in the documentation for more details and examples for each of the types.

## Working with relations

Let's get back to the `server.ts` file and try a few things out with our new `Article` entity, namely with its `author` relation.

### Creating entity graph

We've been using [`em.create()`](/api/core/class/EntityManager#create) to create entity instances. This method allows you to create a deep entity graph, mapping foreign keys of your relations to entity references of the correct type. It will also call [`em.persist()`](/api/core/class/EntityManager#persist) on the created entity (unless disabled via `persistOnCreate` option).

> You can wipe most of the contents of `server.ts` file and keep only the initial part with ORM init, up to the point where the first `User` entity gets flushed, plus the `orm.close()` call at the end. We won't be using this code going forward, it is just a playground for you.

```ts title='server.ts'
// fork first to have a separate context
const em = orm.em.fork();

// create new user entity instance
const user = em.create(UserSchema, {
  email: 'foo@bar.com',
  fullName: 'Foo Bar',
  password: '123456',
});

// em.create auto-persists, so just flush
await em.flush();

// clear the context to simulate fresh request
em.clear();

// create the article instance
const article = em.create(ArticleSchema, {
  slug: 'foo',
  title: 'Foo',
  text: 'Lorem impsum dolor sit amet',
  description: 'Foo is bar',
  author: user.id,
});

// `em.create` calls `em.persist` automatically, so flush is enough
await em.flush();
console.log(article);
```

:::info `em.clear()`

If you carefully checked this snippet, you probably found that new mysterious [`em.clear()`](/api/core/class/EntityManager#clear) call. What does it do? It clears the context for the [`EntityManager`](/api/core/class/EntityManager), meaning it will detach all the entities it was managing. It will bring the [`EntityManager`](/api/core/class/EntityManager) to the same state as if you would create a fresh fork via [`em.fork()`](/api/core/class/EntityManager#fork). You won't usually need this in your app, but it is very handy for unit testing, to simulate new requests coming in. You may as well use forks explicitly if you want.

:::

### Type inference with `defineEntity`

One of the benefits of `defineEntity` is that optional properties are inferred automatically! When you use `.default()`, `.onCreate()`, or `.onUpdate()`, the property is automatically marked as optional in TypeScript.

In our `BaseEntity`, all three properties are optional:
- `id` is a single numeric primary key, so auto-increment is assumed
- `createdAt` uses `.onCreate()`
- `updatedAt` uses `.onCreate()` and `.onUpdate()`

So TypeScript already knows these are optional in `em.create()` calls - no additional configuration needed!

Running the `npm start`, you will see the `Article` entity will get persisted and logged to the console:

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

### Using `onCreate` for computed properties

Every `Article` can be identified by a unique slug - a URL fragment that can be used to look up the article. Currently, it is just a regular string property, but we can do better here. The value should be always bound to the article title. For simplicity, we will use the following function:

```ts
function convertToSlug(text: string) {
  return text.toLowerCase()
             .replace(/[^\w ]+/g, '')
             .replace(/ +/g, '-');
}
```

We want the URL to remain the same after the article gets created, so let's generate the slug using `.onCreate()`. Similarly, we can generate the description from the text:

```ts title='article.entity.ts'
import { defineEntity, InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { UserSchema } from '../user/user.entity.js';

function convertToSlug(text: string) {
  return text.toLowerCase()
             .replace(/[^\w ]+/g, '')
             .replace(/ +/g, '-');
}

export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  properties: {
    slug: p.string().unique().onCreate(article => convertToSlug(article.title)),
    title: p.string().index(),
    description: p.string().length(1000).onCreate(article => article.text.substring(0, 999) + '…'),
    text: p.text().lazy(),
    author: () => p.manyToOne(UserSchema),
  },
});

export type Article = InferEntity<typeof ArticleSchema>;
```

With `.onCreate()`, the `slug` and `description` properties are automatically optional in [`em.create()`](/api/core/class/EntityManager#create) - no additional type configuration needed!

```ts
const article = em.create(ArticleSchema, {
  title: 'Foo is Bar',
  text: 'Lorem impsum dolor sit amet',
  author: user.id,
});
console.log(article);
```

Running `npm start` you can see the `slug` and `description` populated with generated values:

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

## Populating relationships

What if we want to fetch the `Article` together with the `author` relation? We can use `populate` hints for that:

```ts title='server.ts'
// clear the context to simulate fresh request
em.clear();

// find article by id and populate its author
const articleWithAuthor = await em.findOne(ArticleSchema, article.id, { populate: ['author'] });
console.log(articleWithAuthor);
```

Run the `npm start` as usual:

```
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
const articleWithAuthor = await em.findOne(ArticleSchema, article.id, {
  populate: ['author', 'text'],
});
```

Or if the entity is already loaded, you can use `em.populate()`:

```ts title='server.ts'
const articleWithAuthor = await em.findOne(ArticleSchema, article.id, {
  populate: ['author'],
});
await em.populate(articleWithAuthor!, ['text']);
```

### Loading strategies

You can see that both the `Article` and its `author` relation are loaded in a single joined query. This is thanks to the default loading strategy in MikroORM v7 called `LoadStrategy.BALANCED`. This strategy uses SQL joins for to-one relations (like ManyToOne and OneToOne) and separate queries for to-many relations (like OneToMany and ManyToMany). This approach avoids performance issues caused by cartesian products when loading collections - if you join multiple to-many relations, the result set can explode in size as rows multiply.

Since `Article.author` is a ManyToOne (to-one) relation, the balanced strategy uses a join. You can explicitly request a different strategy if needed:

- `LoadStrategy.JOINED` - always use SQL joins for all relations
- `LoadStrategy.SELECT_IN` - always use separate queries for all relations

```ts title='server.ts'
const articleWithAuthor = await em.findOne(ArticleSchema, article.id, {
  populate: ['author', 'text'],
  strategy: LoadStrategy.SELECT_IN, // use separate queries instead
});
```

This would produce two separate queries instead of one joined query.

> The balanced strategy provides a good default for most use cases. If you want to change the loading strategy globally, use the `loadStrategy` option in the ORM config.

### Serialization

What about the password? Seeing the logger `Article` entity with populated `author`, there is something you need to fix. You can see the user's password, in plain text! You will need to hash it and ensure it never leaks to the API response by adding `.hidden()` serialization flag. Moreover, you can mark it as `.lazy()`, just like you did with the `Article.text`, as you rarely want to select it.

For now, let's use `sha256` algorithm which can be created synchronously, and hash the value using `.onCreate()`:

```ts title='user.entity.ts'
import crypto from 'node:crypto';
import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity.js';

function hashPassword(password: string) {
  return crypto.createHmac('sha256', password).digest('hex');
}

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseEntity,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy().onCreate(user => hashPassword(user.password)),
    bio: p.text().default(''),
  },
});

export type User = InferEntity<typeof UserSchema>;
```

After running `npm start`, you can see that the password is hashed, and later when you load the `Article.author`, the password is no longer selected:

```
User {
  id: 1,
  createdAt: 2022-09-11T17:22:31.619Z,
  updatedAt: 2022-09-11T17:22:31.619Z,
  fullName: 'Foo Bar',
  email: 'foo@bar.com',
  password: 'b946ccc987465afcda7e45b1715219711a13518d1f1663b8c53b848cb0143441',
  bio: ''
}
```

That should be good enough for the time being. Don't worry, you will improve on this later, using `argon2` via lifecycle hooks!

## Collections: OneToMany and ManyToMany

We have the `Article.author` property that defines the owning side of this relationship between `Article` and `User` entities. Now let's define the inverse side - for ManyToOne relation it is the OneToMany kind, represented by a `Collection` of `Article` entities. With `defineEntity`, you use `p.oneToMany()`:

```ts title='user.entity.ts'
export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy(),
    bio: p.text().default(''),
    articles: () => p.oneToMany(ArticleSchema).mappedBy('author'),
  },
});

export type User = InferEntity<typeof UserSchema>;
```

MikroORM represents the relation via the `Collection` class. Before diving into what it means, let's add one more entity to the `Article` module to test the ManyToMany relation too. It will be a `Tag` entity, so you can categorize the article based on some dynamically defined tags.

> The `Tag` entity semantically belongs to the `Article` module, so let's put it there, to the `src/modules/article/tag.entity.ts` file. Don't forget to add it to the `entities` array in your config!

```ts title='tag.entity.ts'
import { defineEntity, InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { ArticleSchema } from './article.entity.js';

export const TagSchema = defineEntity({
  name: 'Tag',
  extends: BaseSchema,
  properties: {
    name: p.string().length(20),
    articles: () => p.manyToMany(ArticleSchema).mappedBy('tags'),
  },
});

export type Tag = InferEntity<typeof TagSchema>;
```

And you need to define the owning side too, which is `Article.tags`:

```ts title='article.entity.ts'
export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  properties: {
    slug: p.string().unique().onCreate(article => convertToSlug(article.title)),
    title: p.string().index(),
    description: p.string().length(1000).onCreate(article => article.text.substring(0, 999) + '…'),
    text: p.text().lazy(),
    author: () => p.manyToOne(UserSchema),
    tags: () => p.manyToMany(TagSchema),
  },
});
```

It is enough to point to the owning side via `mappedBy` option from the inverse side (or vice versa). If you want to define the relation from owning side, use `inversedBy` option. A ManyToMany relation that does not define any of those two is always considered the owning side.

```ts
tags: () => p.manyToMany(TagSchema).inversedBy('articles'),
```

### Working with collections

The `Collection` class implements the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol), so you can use `for of` loop to iterate through it.

Another way to access collection items is to use bracket syntax like when you access array items. Keep in mind that this approach will not check if the collection is initialized, while using the `getItems()` method will throw an error in this case.

> Note that array access in `Collection` is available only for reading already loaded items, you cannot add new items to `Collection` this way.

To get all entities stored in a `Collection`, you can use `getItems()` method. It will throw in case the `Collection` is not initialized. If you want to disable this validation, you can use `getItems(false)`. This will give you the entity instances managed by the identity map.

Alternatively, you can use `toArray()` which will serialize the `Collection` to an array of DTOs. Modifying those will have no effect on the actual entity instances.

:::tip `em.findOneOrFail()`

So far you used `em.findOne()` which can return `null` if the entity is not found in the database. This results in extensive usage of the non-null assertion operator in TypeScript, which can get messy. A better solution is to use `em.findOneOrFail()`, which always returns the entity or throws an error, namely an instance of `NotFoundError` provided by the ORM.

:::

```ts
// clear the context to simulate fresh request
em.clear();

// populating User.articles collection
const user = await em.findOneOrFail(UserSchema, 1, { populate: ['articles'] });
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

Running this, you get the following:

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
const newTag = em.create(TagSchema, { name: 'new' });
const oldTag = em.create(TagSchema, { name: 'old' });
article.tags.add(newTag, oldTag);
await em.flush();
console.log(article.tags);
```

And just for the sake of it, try to remove one of the tags:

```ts title='server.ts'
// to remove items from collection, first initialize it using `init()`, `loadItems()` or `em.populate()`
await em.populate(article, ['tags']);

// remove 'old' tag by reference
article.tags.remove(oldTag);

// or via callback
article.tags.remove(t => t.id === oldTag.id);

await em.flush();
```

Refer to the [Collections section](../collections) in the docs for more information and examples.

## Cascading

When persisting or removing entities, MikroORM automatically cascades the operation to associated entities. By default, `Cascade.PERSIST` is enabled on all relations - this means that when you persist an entity, all its loaded associations are persisted too. This is why `em.create()` with nested data "just works".

You can control this behavior via the `.cascade()` builder method:

```ts
import { Cascade } from '@mikro-orm/core';

// default: cascade persist only
tags: () => p.manyToMany(TagSchema),

// cascade both persist and remove
tags: () => p.manyToMany(TagSchema).cascade(Cascade.PERSIST, Cascade.REMOVE),

// cascade everything (persist + remove)
tags: () => p.manyToMany(TagSchema).cascade(Cascade.ALL),

// disable cascade entirely
tags: () => p.manyToMany(TagSchema).cascade(),
```

`Cascade.REMOVE` means removing the parent entity will also remove the related entities. Be careful with this on ManyToOne relations, as the removed entity might still be referenced elsewhere.

### Orphan removal

In Chapter 3, when we add `Article.comments`, we use `orphanRemoval: true`. This is a more aggressive form of cascading: any entity removed from the collection will be deleted from the database entirely, rather than just having its foreign key set to `null`.

```ts
comments: () => p.oneToMany(CommentSchema).mappedBy('article').orphanRemoval(),
```

This is useful when child entities have no meaning without their parent - a comment removed from an article's collection should be deleted, not left orphaned in the database.

### Propagation

MikroORM also propagates relation assignments automatically. When you set `comment.article = article`, the `article.comments` collection is updated too (and vice versa). This works for all bidirectional relations and is what makes the Identity Map consistent.

> The discovery phase (which happens during `MikroORM.init()` or `new MikroORM()`) is required for propagation to work. See the [Propagation](../propagation.md) docs for more details.

Read more about [Cascading](../cascading.md) in the documentation.

# Events and life cycle hooks

Time to improve the password hashing. Let's use the `argon2` package, which provides `hash` and `verify` functions. They are both async, so you cannot use `.onCreate()` directly. Instead, you need to use the lifecycle hooks via the `hooks` option in `defineEntity`.

> Don't forget to install the `argon2` package via `npm install argon2`.

The plan is following:

- the password will remain in plaintext when assigned via `em.create()`
- `hashPassword` function will become an event handler via the `hooks` option
- you register it for both `beforeCreate` and `beforeUpdate` events
- the handler receives `EventArgs` which includes `changeSet` with the computed difference
- you check `changeSet.payload.password` to only hash when the password changed

```ts title='user.entity.ts'
import { defineEntity, type InferEntity, EventArgs, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { ArticleSchema } from '../article/article.entity.js';
import { hash, verify } from 'argon2';

async function hashPassword(args: EventArgs<User>) {
  // hash only if the password was changed
  const password = args.changeSet?.payload.password;

  if (typeof password === 'string') {
    args.entity.password = await hash(password);
  }
}

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy(),
    bio: p.text().default(''),
    articles: () => p.oneToMany(ArticleSchema).mappedBy('author'),
  },
  hooks: {
    beforeCreate: [hashPassword],
    beforeUpdate: [hashPassword],
  },
});

// Extend the schema's auto-generated class to add custom methods
export class User extends UserSchema.class {
  async verifyPassword(password: string) {
    return verify(this.password, password);
  }
}

UserSchema.setClass(User);
```

Notice how we use `setClass()` to extend the schema's auto-generated class. This avoids redeclaring all properties in the class - they are inferred from the schema automatically. The `User` class only adds the `verifyPassword` method. After calling `setClass()`, MikroORM will use the custom `User` class for all entity instances, so `em.create(User, {...})` and `em.find(User, {})` both work.

## ⛳ Checkpoint 2

We added 2 new entities: `Article` and `Tag` and a `BaseEntity` that they extend. You can find working StackBlitz for the current state here:

> This uses an in-memory database, a SQLite feature available via special database name `:memory:`.

This is the [`server.ts` file](https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-2?file=src%2Fserver.ts) after this chapter:

<iframe width="100%" height="800" frameborder="0" src="https://stackblitz.com/edit/mikro-orm-getting-started-guide-cp-2?embed=1&ctl=1&view=editor&file=src%2Fserver.ts">
</iframe>
