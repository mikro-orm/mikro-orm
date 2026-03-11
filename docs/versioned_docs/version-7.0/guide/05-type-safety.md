---
title: 'Chapter 5: Type-safety'
---

Now that we have a blog API with entities, relationships, and a QueryBuilder-powered listing, let's explore how MikroORM's type system keeps everything safe at compile time.

## `Loaded` type and populate hints

If you check the return type of `em.find` and `em.findOne`, you might notice they don't return the entity directly - they return a `Loaded` type:

```ts
// res1 is of type `Loaded<Article, never>[]`
const res1 = await em.find(ArticleSchema, {});

// res2 is of type `Loaded<Article, 'author'>[]`
const res2 = await em.find(ArticleSchema, {}, { populate: ['author'] });
```

The `Loaded` type tracks which relations have been populated, and adds a special `$` symbol to them for type-safe synchronous access. This works great in combination with the `Reference` wrapper (covered next):

```ts
// article is of type `Loaded<Article, 'author'>`
const article = await em.findOneOrFail(ArticleSchema, 1, { populate: ['author'] });

// type-safe sync access to the loaded author:
console.log(article.author.$.fullName);
```

If you omit the `populate` hint, the type of `article` would be `Loaded<Article, never>` and the `article.author.$` symbol wouldn't be available - such call would end up with a compilation error.

```ts
// without populate, the type is `Loaded<Article, never>`
const article2 = await em.findOneOrFail(ArticleSchema, 2);

// TS2339: Property '$' does not exist on type '...'
console.log(article2.author.$.fullName);
```

Same works for the `Collection` wrapper on OneToMany/ManyToMany relations:

```ts
// user is of type `Loaded<User, 'articles'>`
const user = await em.findOneOrFail(User, 1, { populate: ['articles'] });

// type-safe sync access to loaded collection items:
for (const article of user.articles.$) {
  console.log(article.title);
}
```

> If you don't like symbols with magic names like `$`, you can use the `get()` method instead, which is an alias for it.

You can also use the `Loaded` type in your own functions to require that certain relations are populated:

```ts
function publishArticle(article: Loaded<Article, 'author'>) {
  // we can safely access the author without any async loading
  console.log(`Publishing "${article.title}" by ${article.author.$.fullName}`);
}
```

```ts
// works - author is populated
const a1 = await em.findOneOrFail(ArticleSchema, 1, { populate: ['author'] });
publishArticle(a1);

// compile error - author is not populated
const a2 = await em.findOneOrFail(ArticleSchema, 1);
publishArticle(a2);
```

> Keep in mind this is all just type-level information, you can easily trick it via type assertions.

## `Reference` wrapper

When you define `manyToOne` or `oneToOne` relations, TypeScript will think the related entities are always loaded:

```ts
const article = await em.findOne(ArticleSchema, 1);
console.log(article.author.fullName); // undefined, User is not loaded yet!
```

You can overcome this by using the `Reference` wrapper. It wraps the entity, defining a `load(): Promise<T>` method that will lazy load the association if not already available. With `defineEntity`, you enable it via `.ref()`:

```ts title='article.entity.ts'
import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseSchema } from '../common/base.entity.js';
import { UserSchema } from '../user/user.entity.js';

export const ArticleSchema = defineEntity({
  name: 'Article',
  extends: BaseSchema,
  properties: {
    // ...
    // Use .ref() to wrap the relation in a Reference
    author: () => p.manyToOne(UserSchema).ref(),
  },
});

export type IArticle = InferEntity<typeof ArticleSchema>;
```

Now the property type becomes `Ref<User>`, which prevents accidental access to unloaded properties:

```ts
const article1 = await em.findOne(ArticleSchema, 1);
article1.author;       // Ref<User> (instance of Reference class)
article1.author.fullName;  // type error! no `fullName` property on Ref<User>
article1.author.id;    // ok, PK is always available on Ref

const article2 = await em.findOne(ArticleSchema, 1, { populate: ['author'] });
article2.author;          // LoadedReference<User>
article2.author.$.fullName; // type-safe sync access after populate
```

### Using `Reference.load()`

After retrieving a reference, you can load the full entity via the async `load()` method:

```ts
const article = await em.findOne(ArticleSchema, 1);
const author = await article.author.load();
author.fullName; // ok, author is now loaded

await article.author.load(); // no additional query, already loaded
```

> As opposed to `wrap(e).init()` which always refreshes the entity, `Reference.load()` will query the database only if the entity is not already loaded in the Identity Map.

### `ScalarReference` wrapper

Similarly to the `Reference` wrapper, you can also wrap scalars with `Ref` into a `ScalarReference` object. This is handy for lazy scalar properties.

The `Ref` type automatically resolves to `ScalarReference` for non-object types, so the following is correct:

```ts
// In our Article entity, the `text` property is lazy.
// If we wrap it with .ref(), it becomes a ScalarReference:
text: p.text().lazy().ref(),
```

```ts
const article = await em.findOne(ArticleSchema, 1);
const text = await article.text.load(); // loads the lazy text property
```

:::info Using decorators

If you use decorators with `reflect-metadata`, you'll need to explicitly set the `ref` option:

```ts
@ManyToOne(() => User, { ref: true })
author!: Ref<User>;
```

With `defineEntity`, the `.ref()` method handles this automatically.

:::

## Strict partial loading with `fields`

The `Loaded` type also respects the partial loading hints (`fields` option). When used, the returned type will only allow accessing selected properties. Primary keys are always automatically selected and available.

```ts
// article is typed to `Selected<Article, 'author', 'title' | 'author.email'>`
const article = await em.findOneOrFail(ArticleSchema, 1, {
  fields: ['title', 'author.email'],
  populate: ['author'],
});

const id = article.id;           // ok, PK is selected automatically
const title = article.title;     // ok, title is selected
const slug = article.slug;       // fail, not selected
const authorId = article.author.id;    // ok, PK is selected automatically
const email = article.author.email;    // ok, selected
const name = article.author.fullName;  // fail, not selected
```

## QueryBuilder type safety

In Chapter 4, we used `QueryBuilder` to build the article listing query. MikroORM's `QueryBuilder` has a fully type-safe API that tracks aliases, joined entities, and selected fields at the type level.

### Context-aware joins

Each `join`/`leftJoin` call adds to a `Context` type parameter that tracks which aliases are available and what entity types they point to:

```ts
const qb = em.createQueryBuilder(ArticleSchema, 'a')
  .leftJoin('a.author', 'u');  // Context now knows alias 'u' maps to User
```

After the join, TypeScript knows that `'u'` is a valid alias pointing to the `User` entity, and will validate any further usage of it.

### Strict `select`

The `select` method validates that field paths use known aliases and valid property names:

```ts
const qb = em.createQueryBuilder(ArticleSchema, 'a')
  .leftJoin('a.author', 'u')
  .select(['a.title', 'u.fullName']);  // ok: 'a' is Article, 'u' is User

// compile error: 'x' is not a known alias
em.createQueryBuilder(ArticleSchema, 'a')
  .select(['a.title', 'x.invalid']);
```

You can also use `addSelect` to add more fields, including raw SQL fragments:

```ts
em.createQueryBuilder(ArticleSchema, 'a')
  .select(['a.slug', 'a.title'])
  .leftJoin('a.author', 'u')
  .addSelect(sql.ref('u.full_name').as('authorName'));
```

### Strict `where`

The `where` method validates aliased object conditions against the known aliases and their entity types:

```ts
const qb = em.createQueryBuilder(ArticleSchema, 'a')
  .leftJoin('a.author', 'u');

// ok: 'u' maps to User, which has a `fullName` property
qb.where({ 'u.fullName': 'Jon' });

// ok: 'a' maps to Article, which has a `title` property
qb.where({ 'a.title': 'Hello World' });

// compile error: 'x' is not a known alias
qb.where({ 'x.foo': 1 });
```

This also works with nested conditions:

```ts
qb.where({
  $or: [
    { 'a.title': { $like: '%orm%' } },
    { 'u.fullName': 'Jon' },
  ],
});
```

### Result types with `joinAndSelect`

When you use `joinAndSelect` or `leftJoinAndSelect`, the `Hint` type parameter is updated automatically, so `getResultList()` returns properly typed `Loaded` entities:

```ts
const articles = await em.createQueryBuilder(ArticleSchema, 'a')
  .leftJoinAndSelect('a.author', 'u')
  .getResultList();
// articles is `Loaded<Article, 'author'>[]`

// type-safe access to loaded author:
articles[0].author.$.fullName; // ok
```

This is equivalent to using `em.find` with `populate: ['author']`, but with the flexibility of the QueryBuilder API.

### Result types with `select`

When you use `select` to pick specific fields, the `Fields` type parameter tracks which fields were selected:

```ts
const articles = await em.createQueryBuilder(ArticleSchema, 'a')
  .select(['a.title', 'a.description'])
  .getResultList();
// articles is `Loaded<Article, never, 'title' | 'description'>[]`

articles[0].title;       // ok, selected
articles[0].description; // ok, selected
articles[0].slug;        // fail, not selected
articles[0].id;          // ok, PK is always available
```

### Awaiting the QueryBuilder

You can directly `await` a `QueryBuilder` instance. The return type depends on what kind of query you're building:

```ts
// SelectQueryBuilder → awaiting yields entity array
const articles = await em.qb(ArticleSchema)
  .select('*')
  .where({ title: { $like: '%orm%' } })
  .limit(5);
// articles is Article[]

// CountQueryBuilder → awaiting yields number
const count = await em.qb(ArticleSchema)
  .count()
  .where({ title: { $like: '%orm%' } });
// count is number

// InsertQueryBuilder → awaiting yields QueryResult
const res1 = await em.qb(ArticleSchema).insert({
  title: 'New Article',
  text: 'Content here',
  author: 1,
});
// res1 is QueryResult<Article>
console.log(res1.insertId);

// UpdateQueryBuilder → awaiting yields QueryResult
const res2 = await em.qb(ArticleSchema)
  .update({ title: 'Updated' })
  .where({ id: 1 });
// res2 is QueryResult<Article>
console.log(res2.affectedRows);

// DeleteQueryBuilder → awaiting yields QueryResult
const res3 = await em.qb(ArticleSchema)
  .delete()
  .where({ id: 1 });
// res3 is QueryResult<Article>
```

> `em.qb()` is a shortcut for `em.createQueryBuilder()`.

## Assigning to `Reference` properties

When you define a property as a `Reference` wrapper, you will need to assign a `Reference` instance to it instead of the entity. You can convert any entity to a `Reference` via `ref(entity)`, or use the `wrapped` option of `em.getReference()`:

> `ref(e)` is a shortcut for `wrap(e).toReference()`, which is the same as `Reference.create(e)`.

```ts
import { ref } from '@mikro-orm/core';

const article = await em.findOne(ArticleSchema, 1);
const repo = em.getRepository(User);

article.author = repo.getReference(2, { wrapped: true });

// same as:
article.author = ref(repo.getReference(2));
await em.flush();
```

You can also create entity references without access to `EntityManager` using the `rel()` helper:

```ts
import { rel } from '@mikro-orm/core';

const article = em.create(ArticleSchema, {
  title: 'New Article',
  text: 'Content here',
  author: rel(User, 1),
});
```
