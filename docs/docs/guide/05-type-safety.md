---
title: 'Chapter 5: Type-safety'
---

Entity relations are mapped to entity references - instances of the entity that have at least the primary key available. This reference is stored in the Identity Map, so you will get the same object reference when fetching the same document from the database.

```ts
@ManyToOne(() => User)
author!: User; // the value is always instance of the `User` entity
```

You can check whether an entity is initialized via `wrap(entity).isInitialized()`, and use `await wrap(entity).init()` to initialize it lazily. This will trigger a database call and populate the entity, keeping the same reference in the Identity Map.

```ts
const user = em.getReference(User, 123);
console.log(user.id); // prints `123`, accessing the id will not trigger any db call
console.log(wrap(user).isInitialized()); // false, it's just a reference
console.log(user.name); // undefined

await wrap(user).init(); // this will trigger db call
console.log(wrap(user).isInitialized()); // true
console.log(user.name); // defined
```

The `isInitialized()` method can be used for runtime checks, but that could end up being quite tedious - we can do better! Instead of manual checks for entity state, we can use the `Reference` wrapper.

## `Reference` wrapper

When you define `@ManyToOne` and `@OneToOne` properties on your entity, the TypeScript compiler will think that the desired entities are always loaded:

```ts
@Entity()
export class Article {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: User;

  constructor(author: User) {
    this.author = author;
  }

}

const article = await em.findOne(Article, 1);
console.log(article.author instanceof User); // true
console.log(wrap(article.author).isInitialized()); // false
console.log(article.author.name); // undefined as `User` is not loaded yet
```

You can overcome this issue by using the `Reference` wrapper. It simply wraps the entity, defining `load(): Promise<T>` method that will first lazy load the association if not already available. You can also use `unwrap(): T` method to access the underlying entity without loading it.

You can also use `load<K extends keyof T>(prop: K): Promise<T[K]>`, which works like `load()` but returns the specified property.

```ts title="./entities/Article.ts"
import { Entity, Ref, ManyToOne, PrimaryKey, Reference } from '@mikro-orm/core';

@Entity()
export class Article {

  @PrimaryKey()
  id!: number;

  // This guide is using `ts-morph` metadata provider, so this is enough.
  @ManyToOne()
  author: Ref<User>;

  constructor(author: User) {
    this.author = ref(author);
  }

}
```

```ts
const article1 = await em.findOne(Article, 1);
article.author instanceof Reference; // true
article1.author; // Ref<User> (instance of `Reference` class)
article1.author.name; // type error, there is no `name` property
article1.author.unwrap().name; // unsafe sync access, undefined as author is not loaded
article1.author.isInitialized(); // false

const article2 = await em.findOne(Article, 1, { populate: ['author'] });
article2.author; // LoadedReference<User> (instance of `Reference` class)
article2.author.$.name; // type-safe sync access
```

There are also `getEntity()` and `getProperty()` methods that are synchronous getters, that will first check if the wrapped entity is initialized, and if not, it will throw and error.

```ts
const article = await em.findOne(Article, 1);
console.log(article.author instanceof Reference); // true
console.log(wrap(article.author).isInitialized()); // false
console.log(article.author.getEntity()); // Error: Reference<User> 123 not initialized
console.log(article.author.getProperty('name')); // Error: Reference<User> 123 not initialized
console.log(await article.author.load('name')); // ok, loading the author first
console.log(article.author.getProperty('name')); // ok, author already loaded
```

If you use a different metadata provider than `TsMorphMetadataProvider` (e.g. `ReflectMetadataProvider`), you will also need to explicitly set the `ref` parameter:

```ts
@ManyToOne(() => User, { ref: true })
author!: Ref<User>;
```

### Using `Reference.load()`

After retrieving a reference, you can load the full entity by utilizing the asynchronous `Reference.load()` method.

```ts
const article1 = await em.findOne(Article, 1);
(await article1.author.load()).name; // async safe access

const article2 = await em.findOne(Article, 2);
const author = await article2.author.load();
author.name;
await article2.author.load(); // no additional query, already loaded
```

> As opposed to `wrap(e).init()` which always refreshes the entity, the `Reference.load()` method will query the database only if the entity is not already loaded in the Identity Map.

### `ScalarReference` wrapper

Similarly to the `Reference` wrapper, we can also wrap scalars with `Ref` into a `ScalarReference` object. This is handy for lazy scalar properties.

```ts
@Property({ lazy: true, ref: true })
passwordHash!: Ref<string>;
```

The `Ref` type automatically resolves to `ScalarReference` for non-object types. You can use it explicitly if you want to wrap an object scalar property (e.g. JSON value).

```ts
const user = await em.findOne(User, 1);
const passwordHash = await user.passwordHash.load();
```

## `Loaded` type

If you check the return type of `em.find` and `em.findOne` methods, you might be a bit confused - instead of the entity, they return `Loaded` type:

```ts
// res1 is of type `Loaded<User, never>[]`
const res1 = await em.find(User, {});

// res2 is of type `Loaded<User, 'identity' | 'friends'>[]`
const res2 = await em.find(User, {}, { populate: ['identity', 'friends'] });
```

The `User` entity is defined as follows:

```ts
import { Entity, PrimaryKey, ManyToOne, OneToOne, Collection, Ref, ref } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Identity)
  identity: Ref<Identity>;

  @ManyToMany(() => User)
  friends = new Collection<User>(this);

  constructor(identity: Identity) {
    this.identity = ref(identity);
  }

}
```

The `Loaded` type will represent what relations of the entity are populated, and will add a special `$` symbol to them, allowing for type-safe synchronous access to the loaded properties. This works great in combination with the `Reference` wrapper:

> If you don't like symbols with magic names like `$`, you can as well use the `get()` method, which is an alias for it.

```ts
// res is of type `Loaded<User, 'identity'>`
const user = await em.findOneOrFail(User, 1, { populate: ['identity'] });

// instead of the async `await user.identity.load()` call that would ensure the relation is loaded
// you can use the dynamically added `$` symbol for synchronous and type-safe access to it:
console.log(user.identity.$.email);
```

> If you'd omit the `populate` hint, the type of `user` would be `Loaded<User, never>` and the `user.identity.$` symbol wouldn't be available - such call would end up with a compilation error.

```ts
// if we try without the populate hint, the type is `Loaded<User, never>`
const user2 = await em.findOneOrFail(User, 2);

// TS2339: Property '$' does not exist on type '{ id: number; } & Reference'.
console.log(user.identity.$.email);
```

Same works for the `Collection` wrapper, that offers runtime methods `isInitialized`, `loadItems` and `init`, as well as the type-safe `$` symbol.

```ts
// res is of type `Loaded<User, 'friends'>`
const user = await em.findOneOrFail(User, 1, { populate: ['friends'] });

// instead of the async `await user.friends.loadItems()` call that would ensure the collection items are loaded
// you can use the dynamically added `$` symbol for synchronous and type-safe access to it:
for (const friend of user.friends.$) {
  console.log(friend.email);
}
```

You can also use the `Loaded` type in your own methods, to require on type level that some relations will be populated:

```ts
function checkIdentity(user: Loaded<User, 'identity'>) {
  if (!user.identity.$.email.includes('@')) {
    throw new Error(`That's a weird e-mail!`);
  }
}
```

```ts
// works
const u1 = await em.findOneOrFail(User, 2, { populate: ['identity'] });
checkIdentity(u1);

// fails
const u2 = await em.findOneOrFail(User, 2);
checkIdentity(u2);
```

> Keep in mind this is all just a type-level information, you can easily trick it via type assertions.

## Assigning to `Reference` properties

When you define the property as `Reference` wrapper, you will need to assign the `Reference` instance to it instead of the entity. You can convert any entity to a `Reference` wrapper via `ref(entity)`, or use the `wrapped` option of `em.getReference()`:

> `ref(e)` is a shortcut for `wrap(e).toReference()`, which is the same as `Reference.create(e)`.

```ts
import { ref } from '@mikro-orm/core';

const article = await em.findOne(Article, 1);
const repo = em.getRepository(User);

article.author = repo.getReference(2, { wrapped: true });

// same as:
article.author = ref(repo.getReference(2));
await em.flush();
```

Since v5 we can also create entity references without access to `EntityManager`. This can be handy if you want to create a reference from inside the entity constructor:

```ts
import { Entity, ManyToOne, Rel, rel } from '@mikro-orm/core';

@Entity()
export class Article {

  @ManyToOne(() => User, { ref: true })
  author!: Ref<User>;

  constructor(authorId: number) {
    this.author = rel(User, authorId);
  }

}
```

Another way is to use `toReference()` method available as part of the [`WrappedEntity` interface](../entity-helper.md#wrappedentity-and-wrap-helper):

```ts
const author = new User(...)
article.author = wrap(author).toReference();
```

If the reference already exist, you need to re-assign it with a new `Reference` instance - they hold identity just like entities, so you need to replace them:

```ts
article.author = ref(new User(...));
```

## What is `Ref` type?

`Ref` is an intersection type that adds primary key property to the `Reference` interface. It allows to get the primary key from `Reference` instance directly.

By default, we try to detect the PK by checking if a property with a known name exists. We check for those in order: `_id`, `uuid`, `id` - with a way to manually set the property name via the `PrimaryKeyProp` symbol (`[PrimaryKeyProp]?: 'foo';`).

We can also override this via a second generic type argument.

```ts
const article = await em.findOne(Article, 1);
console.log(article.author.id); // ok, returns the PK
```

## Strict partial loading

The `Loaded` type also respects the partial loading hints (`fields` option). When used, the returned type will only allow accessing selected properties. Primary keys are automatically selected and available on the type level.

```ts
// article is typed to `Selected<Article, 'author', 'title' | 'author.email'>`
const article = await em.findOneOrFail(Article, 1, {
  fields: ['title', 'author.email'],
  populate: ['author'],
});

const id = article.id; // ok, PK is selected automatically
const title = article.title; // ok, title is selected
const publisher = article.publisher; // fail, not selected
const author = article.author.id; // ok, PK is selected automatically
const email = article.author.email; // ok, selected
const name = article.author.name; // fail, not selected
```

See [live demo](https://stackblitz.com/edit/mikro-orm-v6-strict-partial-loading?file=basic.test.ts):

<iframe width="100%" height="800" frameborder="0" src="https://stackblitz.com/edit/mikro-orm-v6-strict-partial-loading?embed=1&ctl=1&view=editor&file=basic.test.ts">
</iframe>
