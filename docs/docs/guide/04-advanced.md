---
title: 'Chapter 4: Advanced'
---

In this chapter, you will first implement all the methods of `/user` endpoint, including a basic JWT authentication provided via `@fastify/jwt` package, and proceed with the rest of the `/article` endpoints. This chapter touches on some of the more advanced concepts like custom repositories, virtual entities, `QueryBuilder`, flush events, and more.

## Improving route registration

Before jumping in and implementing the rest of the `User` and `Article` endpoint handlers, let's improve how the routes are registered. Create a `routes.ts` file in `src/modules/article`, and export a factory function from it:

```ts title='modules/article/routes.ts'
import { FastifyInstance } from 'fastify';
import { initORM } from '../../db.js';

export async function registerArticleRoutes(app: FastifyInstance) {
  const db = initORM();

  app.get('/', async request => {
    const { limit, offset } = request.query as { limit?: number; offset?: number };
    const [items, total] = await db.article.findAndCount({}, {
      limit, offset,
    });

    return { items, total };
  });
}
```

And create a placeholder for the `User` module too, in the `src/modules/user` folder:

```ts title='modules/user/routes.ts'
import { FastifyInstance } from 'fastify';
import { initORM } from '../../db.js';

export async function registerUserRoutes(app: FastifyInstance) {
  // no routes yet
}
```

Now use them in your `bootstrap` function via `app.register()` method:

```diff
// register routes here
-app.get('/article', async request => {
-  ...
-});
+app.register(registerArticleRoutes, { prefix: 'article' });
+app.register(registerUserRoutes, { prefix: 'user' });
```

## Sign-up route

Time to add the first `User` endpoint, for registering new users. It will be a `POST` endpoint, which will accept an object payload with `email`, `fullName` and `password` properties:

```ts title='modules/user/routes.ts'
export async function registerUserRoutes(app: FastifyInstance) {
  const db = initORM();

  // register new user
  app.post('/sign-up', async request => {
    const body = request.body as EntityData<User>;

    if (!body.email || !body.fullName || !body.password) {
      throw new Error('One of required fields is missing: email, fullName, password');
    }

    if ((await db.user.count({ email: body.email })) > 0) {
      throw new Error('This email is already registered, maybe you want to sign in?');
    }

    const user = db.user.create({
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      bio: body.bio ?? '',
    });
    await db.em.flush();

    // after flush, we have the `user.id` set
    console.log(`User ${user.id} created`);

    return user;
  });
}
```

## Custom repositories

The check for existing users looks a bit too complex, let's create a custom repository method instead to make things more readable and maintainable.

```ts title='modules/user/user.repository.ts'
import { EntityRepository } from '@mikro-orm/sqlite';
import { User } from './user.entity.js';

export class UserRepository extends EntityRepository<User> {

  async exists(email: string) {
    const count = await this.count({ email });
    return count > 0;
  }

}
```

And use this repository in the `defineEntity` options. The `repository` option links the entity to your custom repository class:

```ts title='user.entity.ts'
import { defineEntity, type InferEntity, p } from '@mikro-orm/core';
import { BaseEntity } from '../common/base.entity.js';
import { UserRepository } from './user.repository.js';

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  repository: () => UserRepository,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy(),
    bio: p.text().default(''),
    articles: () => p.oneToMany(ArticleSchema).mappedBy('author'),
  },
  // hooks remain the same
});

// setClass from Chapter 2 remains the same
```

And don't forget to adjust the `Services` type:

```diff
export interface Services {
  orm: MikroORM;
  em: EntityManager;
- user: EntityRepository<User>;
+ user: UserRepository;
  article: EntityRepository<Article>;
  tag: EntityRepository<Tag>;
}
```

Now you can use it in the `sign-up` endpoint:

```diff
-if ((await db.user.count({ email: body.email })) > 0) {
+if (await db.user.exists(body.email)) {
  throw new Error('This email is already registered, maybe you want to sign in?');
}
```

## Authentication

Time to add the second `User` route, this time for logging in. Modify `routes.ts` again. Let's again use a custom repository method for the `login`, which will be implemented in a second:

```ts title='modules/user/routes.ts'
export async function registerUserRoutes(app: FastifyInstance) {
  const db = initORM();

  // register new user
  app.post('/sign-up', async request => {
    // ...
  });

  // login existing user
  app.post('/sign-in', async request => {
    const { email, password } = request.body as { email: string; password: string };
    const user = await db.user.login(email, password);

    return user;
  });
}
```

And now the `login` method, which will try to load the `User` entity based on the password, and compare it via the `user.verifyPassword()` method. If no such combination of the `email` and `password` is found, an error is thrown.

```ts title='modules/user/user.repository.ts'
export class UserRepository extends EntityRepository<User> {

  // ...

  async login(email: string, password: string) {
    // use a more generic error so you don't leak that such email is registered
    const err = new Error('Invalid combination of email and password');
    const user = await this.findOneOrFail({ email }, {
      populate: ['password'], // password is a lazy property, we need to populate it
      failHandler: () => err,
    });

    if (await user.verifyPassword(password)) {
      return user;
    }

    throw err;
  }

}
```

### Testing the `User` endpoints

You now have two new endpoints, so test that they work as expected. Add a new test case for the `User` endpoints:

```ts title='tests/user.test.ts'
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { initTestApp } from './utils.js';

let app: FastifyInstance;

beforeAll(async () => {
  // using different ports to allow parallel testing
  app = await initTestApp(30002);
});

afterAll(async () => {
  // closing only the fastify app - it will close the database connection via onClose hook automatically
  await app.close();
});

test('login', async () => {
  const res1 = await app.inject({
    method: 'post',
    url: '/user/sign-in',
    payload: {
      email: 'foo@bar.com',
      password: 'password123',
    },
  });

  expect(res1.statusCode).toBe(200);
  expect(res1.json()).toMatchObject({
    fullName: 'Foo Bar',
  });

  const res2 = await app.inject({
    method: 'post',
    url: '/user/sign-in',
    payload: {
      email: 'foo@bar.com',
      password: 'password456',
    },
  });

  expect(res2.statusCode).toBe(401);
  expect(res2.json()).toMatchObject({ error: 'Invalid combination of email and password' });
});
```

When you run it with `npm test`, you should see a failed assertion:

```text
 FAIL  test/user.test.ts > login
AssertionError: expected 500 to be 401 // Object.is equality

- Expected
+ Received

- 401
+ 500
```

That's because this isn't handled anywhere, the code just throws an error - let's deal with that now by integrating authentication into the application.

### JSON Web Tokens

The plan is to add an authentication layer to the API. You will need to generate an authentication token that will hold the identity - let's use so-called JSON Web Token (JWT), an industry standard. You can leverage the `@fastify/jwt` plugin for encoding/decoding them with ease.

```bash npm2yarn
npm install @fastify/jwt
```

Now register this plugin in your `bootstrap()` function:

```ts title='app.ts'
import fastifyJWT from '@fastify/jwt';

// ...

// register JWT plugin
app.register(fastifyJWT, {
  secret: process.env.JWT_SECRET ?? '12345678', // fallback for testing
});
```

With the JWT plugin, the `request` object has a `user` property you can use to store data about the currently logged `User`, as well as two handy methods on the `app` object:

- `app.jwt.sign()` to create the token from a payload
- `request.jwtVerify()` to verify and decode the token back to the payload

The token payload stores the `user.id`. Add a new property to the `UserSchema` for it:

```ts title='modules/user/user.entity.ts'
token: p.string().persist(false).nullable(),
```

The `.persist(false)` option means the property is virtual, it does not represent a database column (but can be mapped and serialized).

Before continuing, add one more utility - a custom `AuthError` class, which can be used to detect authentication issues (e.g. wrong password).

```ts title='modules/common/utils.ts'
export class AuthError extends Error {}
```

And use it in the `UserRepository`:

```ts title='modules/user/user.repository.ts'
// highlight-next-line
import { AuthError } from '../common/utils.js';

export class UserRepository extends EntityRepository<User> {

  // ...

  async login(email: string, password: string) {
    // use a more generic error so you don't leak that such email is registered
    // highlight-next-line
    const err = new AuthError('Invalid combination of email and password');
    const user = await this.findOneOrFail({ email }, {
      populate: ['password'], // password is a lazy property, we need to populate it
      failHandler: () => err,
    });

    if (await user.verifyPassword(password)) {
      return user;
    }

    throw err;
  }

}
```

Now generate the token in the `sign-up` and `sign-in` handlers:

```ts title='modules/user/routes.ts'
// register new user
app.post('/sign-up', async request => {
  // ...

  const user = db.user.create({
    fullName: body.fullName,
    email: body.email,
    password: body.password,
    bio: body.bio ?? '',
  });
  await db.em.flush();

  // highlight-next-line
  user.token = app.jwt.sign({ id: user.id })

  return user;
});

// login existing user
app.post('/sign-in', async request => {
  const { email, password } = request.body as { email: string; password: string };
  const user = await db.user.login(email, password);
  // highlight-next-line
  user.token = app.jwt.sign({ id: user.id })

  return user;
});
```

And finally, we can add the middleware to authenticate users based on the token to the `bootstrap()` function:

```ts title='app.ts'
// register auth hook after the ORM one to use the context
app.addHook('onRequest', async request => {
  try {
    const ret = await request.jwtVerify<{ id: number }>();
    request.user = await db.user.findOneOrFail(ret.id);
  } catch (e) {
    app.log.error(e);
    // ignore token errors, we validate the request.user exists only where needed
  }
});

// register global error handler to process 404 errors from `findOneOrFail` calls
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AuthError) {
    return reply.status(401).send({ error: error.message });
  }

  // we also handle not found errors automatically
  // `NotFoundError` is an error thrown by the ORM via `em.findOneOrFail()` method
  if (error instanceof NotFoundError) {
    return reply.status(404).send({ error: error.message });
  }

  app.log.error(error);
  reply.status(500).send({ error: error.message });
});
```

And that's it, the tests should be passing now again, with a basic authentication mechanism in place! When the server detects a user token in the request headers, it will automatically load the corresponding user and store it into the `request.user` property.

Let's implement the last two endpoints for getting the current user profile and modifying it. First, create one new utility method: `getUserFromToken`.

```ts title='modules/common/utils.ts'
import { FastifyRequest } from 'fastify';
import { User } from '../user/user.entity.js';

export function getUserFromToken(req: FastifyRequest): User {
  if (!req.user) {
    throw new Error('Please provide your token via Authorization header');
  }

  return req.user as User;
}
```

And now implement the handlers:

```ts title='modules/user/routes.ts'
app.get('/profile', async request => {
  const user = getUserFromToken(request);
  return user;
});

app.patch('/profile', async request => {
  const user = getUserFromToken(request);
  wrap(user).assign(request.body as EntityData<User>);
  await db.em.flush();
  return user;
});
```

:::info Exercise

Try implementing the tests for those endpoints now!

:::

## Embeddables

Before moving back to the article endpoint, let's improve the user entity a bit. Say you want to have optional social handles for twitter, facebook or linkedin on the `User` entity. You can use [Embeddables](../embeddables.md) for this, a feature which allows mapping multiple columns to an object.

With `defineEntity`, you can define an embeddable schema and embed it in your entity:

```ts title='user.entity.ts'
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

// Define the embeddable schema
export const SocialSchema = defineEntity({
  name: 'Social',
  embeddable: true,
  properties: {
    twitter: p.string().nullable(),
    facebook: p.string().nullable(),
    linkedin: p.string().nullable(),
  },
});

export type Social = InferEntity<typeof SocialSchema>;

export const UserSchema = defineEntity({
  name: 'User',
  extends: BaseSchema,
  repository: () => UserRepository,
  properties: {
    fullName: p.string(),
    email: p.string(),
    password: p.string().hidden().lazy(),
    bio: p.text().default(''),
    articles: () => p.oneToMany(ArticleSchema).mappedBy('author'),
    // highlight-start
    social: () => p.embedded(SocialSchema).nullable(),
    // highlight-end
  },
  // hooks and setClass remain the same
});
```

Try using to CLI to check how this affects the database schema:

```bash
$ npx mikro-orm schema:update --dump

alter table `user` add column `social_twitter` text null;
alter table `user` add column `social_facebook` text null;
alter table `user` add column `social_linkedin` text null;
```

But maybe it would be a better idea to store the social handles into a JSON column - you can easily achieve that with embeddables too:

```ts
social: () => p.embedded(SocialSchema).object().nullable(),
```

And test it again:

```bash
$ npx mikro-orm schema:update --dump

alter table `user` add column `social` json null;
```

Yeah, that looks good, let's create a migration for it:

```bash
$ npx mikro-orm migration:create

Migration20231105213316.ts successfully created

$ npx mikro-orm migration:up

Processing 'Migration20231105213316'
Applied 'Migration20231105213316'
Successfully migrated up to the latest version
```

## Validation via Zod

One more thing in the user module: process this new `User.social` property in the `sign-up` endpoint. Since [`em.create()`](/api/core/class/EntityManager#create) is already being used, you can simply pass the social property:

```ts title='modules/user/routes.ts'
const user = db.em.create(User, {   // `User` is the class from setClass
  fullName: body.fullName,
  email: body.email,
  password: body.password,
  bio: body.bio ?? '',
  // highlight-next-line
  social: body.social as Social,
});
await db.em.flush();
```

Let's add some validation via Zod (you could pass `body` directly to `em.create()`):

```diff file='modules/user/routes.ts'
-const user = db.em.create(User, {
-  ...
-});
+const user = db.user.create(request.body as RequiredEntityData<User>);
await db.em.flush();
```

MikroORM will perform some basic validation automatically, but it is generally a good practice to validate the user input explicitly. Let's use [Zod](https://github.com/colinhacks/zod) for it, it will also help with making the TypeScript compiler happy without the type assertion.

First, install the `zod` package.

```bash npm2yarn
npm install zod
```

Then you can create the schema objects:

```ts title='modules/user/routes.ts'
const socialSchema = z.object({
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  linkedin: z.string().optional(),
});

const userSchema = z.object({
  email: z.string(),
  fullName: z.string(),
  password: z.string(),
  bio: z.string().optional(),
  social: socialSchema.optional(),
});

app.post('/sign-up', async request => {
  const dto = userSchema.parse(request.body);

  if (await db.user.exists(dto.email)) {
    throw new Error('This email is already registered, maybe you want to sign in?');
  }

  // thanks to zod, our `dto` is fully typed and passes the `em.create()` checks
  const user = db.user.create(dto);
  await db.em.flush(); // no need for explicit `em.persist()` when we use `em.create()`

  // after flush, we have the `user.id` set
  user.token = app.jwt.sign({ id: user.id });

  return user;
});
```

:::info

This example only shows a very basic validation with Zod, which mirrors what MikroORM already handles - it will validate required properties and their types automatically. Check the [Property Validation](../property-validation.md) section for more details.

:::

## Rest of the Article endpoints

Let's implement the rest of the article endpoints. You need a public one for the article detail, one for posting comments, one for updating the article and one for deleting it. The last two will only be allowed for the user who created the given article.

With the information you already have, implementing those endpoints should be pretty straightforward. The detail endpoint is really simple, all it does is using the `findOneOrFail()` method to get the `Article` based on its `slug`.

:::warning

You should validate the request parameters before working with them! It's left out on purpose as it is outside of scope of this guide.

:::

```ts title='modules/article/routes.ts'
app.get('/:slug', async request => {
  const { slug } = request.params as { slug: string };
  return db.article.findOneOrFail({ slug }, {
    populate: ['author', 'comments.author', 'text'],
  });
});
```

### Creating entities

Then define the endpoint for creating comments - here the `getUserFromToken` helper is used to access the current user based on the token, try to find the article (again based on the `slug` property) and create the comment entity. Since [`em.create()`](/api/core/class/EntityManager#create) is used here, you don't have to [`em.persist()`](/api/core/class/EntityManager#persist) the new entity, as it happens automatically this way.

```ts title='modules/article/routes.ts'
app.post('/:slug/comment', async request => {
  const { slug, text } = request.params as { slug: string; text: string };
  const author = getUserFromToken(request);
  const article = await db.article.findOneOrFail({ slug });
  const comment = db.comment.create({ author, article, text });

  // We can add the comment to `article.comments` collection,
  // but in fact it is a no-op, as it will be automatically
  // propagated by setting Comment.author property.
  article.comments.add(comment);

  // mention we don't need to persist anything explicitly
  await db.em.flush();

  return comment;
});
```

Creating a new article is very similar.

```ts title='modules/article/routes.ts'
app.post('/', async request => {
  const { title, description, text } = request.body as { title: string; description: string; text: string };
  const author = getUserFromToken(request);
  const article = db.article.create({
    title,
    description,
    text,
    author,
  });

  await db.em.flush();

  return article;
});
```

### Updating entities

For updating, use `wrap(article).assign()`, a helper method which will map the data to entity graph correctly. It will transform foreign keys into entity references automatically.

> Alternatively, you can use `em.assign()`, which will also work for not managed entities.

```ts title='modules/article/routes.ts'
app.patch('/:id', async request => {
  const user = getUserFromToken(request);
  const params = request.params as { id: string };
  const article = await db.article.findOneOrFail(+params.id);
  verifyArticlePermissions(user, article);
  wrap(article).assign(request.body as EntityData<Article>);
  await db.em.flush();

  return article;
});
```

Also validate that only the author of the article can change it:

```ts title='modules/common/utils.ts'
export function verifyArticlePermissions(user: User, article: Article): void {
  if (article.author.id !== user.id) {
    throw new Error('You are not the author of this article!');
  }
}
```

### Upserting entities

Alternatively, you could use `em.upsert()` instead to create or update the entity in one step. It will use `INSERT ON CONFLICT` query under the hood:

```diff
-const article = await db.article.findOneOrFail(+params.id);
-wrap(article).assign(request.body as EntityData<Article>);
-await db.em.flush();
+const article = await db.article.upsert(request.body as Article);
```

To upsert many entities in a batch, you can use `em.upsertMany()`, which will handle everything within a single query.

Read more about upserting in [Entity Manager](../entity-manager.md#upsert) section.

### Removing entities

There are several approaches to removing an entity. In this case, the entity is first loaded, if it does not exist, `notFound: true` is returned in the response, if it does, it's removed via `em.remove()`, which marks the entity for removal on the following `flush()` call.

```ts title='modules/article/routes.ts'
app.delete('/:id', async request => {
  const user = getUserFromToken(request);
  const params = request.params as { id: string };
  const article = await db.article.findOne(+params.id);

  if (!article) {
    return { notFound: true };
  }

  verifyArticlePermissions(user, article);
  // mention `nativeDelete` alternative if we don't care about validations much
  await db.em.remove(article).flush();

  return { success: true };
});
```

You could also use `em.nativeDelete()` or `QueryBuilder` to execute a `DELETE` query.

```ts
await db.article.nativeDelete(+params.id);
```

### Batch inserts, updates and deletes

While there is no such use case in this guide, a huge benefit of using the [`EntityManager`](/api/core/class/EntityManager) with Unit of Work approach is automatic batching - all the `INSERT`, `UPDATE` and `DELETE` queries will be batched automatically into a single query per entity.

#### Insert

```ts
for (let i = 1; i <= 5; i++) {
  em.create(User, {
    fullName: `Peter ${i}`,
    email: `peter+${i}@foo.bar`,
    password: '...',
  });
}

await em.flush();
```

```sql
insert into `user` (`name`, `email`) values
  ('Peter 1', 'peter+1@foo.bar'),
  ('Peter 2', 'peter+2@foo.bar'),
  ('Peter 3', 'peter+3@foo.bar'),
  ('Peter 4', 'peter+4@foo.bar'),
  ('Peter 5', 'peter+5@foo.bar');
```

#### Update

```ts
const users = await em.find(User, {});

for (const user of users) {
  user.name += ' changed!';
}

await em.flush();
```

```sql
update `user` set
  `name` = case
    when (`id` = 1) then 'Peter 1 changed!'
    when (`id` = 2) then 'Peter 2 changed!'
    when (`id` = 3) then 'Peter 3 changed!'
    when (`id` = 4) then 'Peter 4 changed!'
    when (`id` = 5) then 'Peter 5 changed!'
    else `priority` end
  where `id` in (1, 2, 3, 4, 5);
```

#### Delete

```ts
const users = await em.find(User, {});

em.remove(users);

await em.flush();
```

```sql
delete from `user` where `id` in (1, 2, 3, 4, 5);
```

## Disabling change tracking

Sometimes you might want to disable identity map and change set tracking for some query. This is possible via `disableIdentityMap` option. Behind the scenes, it will create new context, load the entities inside that, and clear it afterward, so the main identity map will stay clean, but the entities returned from a single find call will be still interconnected.

> As opposed to _managed_ entities, such entities are called _detached_. To be able to work with them, you first need to merge them via `em.merge()`.

```ts
const user = await db.user.findOneOrFail({ email: 'foo@bar.baz' }, {
  disableIdentityMap: true,
});
user.name = 'changed';
await db.em.flush(); // calling flush have no effect, as the entity is not managed
```

## Virtual entities

Let's now improve the first article endpoint - `em.findAndCount()` was used to get paginated results easily, but what if you want to customize the response? One way is with [Virtual entities](../virtual-entities.md). They don't represent any database table, instead, they dynamically resolve to an SQL query, allowing you to map any kind of results onto an entity.

:::info

Virtual entities are meant for read purposes, they don't have a primary key and therefore cannot be tracked for changes. If you want an actual database view instead, see the [View entities](#view-entities) section later in this chapter.

:::

To define a virtual entity with `defineEntity`, provide an `expression` option. It can be a string (SQL query) or a callback returning an SQL query or a `QueryBuilder` instance. Only scalar properties are supported.

```ts title='modules/article/article-listing.entity.ts'
import { defineEntity, InferEntity, EntityManager, p } from '@mikro-orm/core';
import { ArticleSchema } from './article.entity.js';

export const ArticleListingSchema = defineEntity({
  name: 'ArticleListing',
  expression: (em: EntityManager) => {
    return em.getRepository(ArticleSchema).listArticlesQuery();
  },
  properties: {
    slug: p.string(),
    title: p.string(),
    description: p.string(),
    tags: p.array(),
    author: p.integer(),
    authorName: p.string(),
    totalComments: p.integer(),
  },
});

export type ArticleListing = InferEntity<typeof ArticleListingSchema>;
```

Now create a custom repository for the `Article` entity too, and put two methods inside:

```ts title='modules/article/article.repository.ts'
import { FindOptions, sql, EntityRepository } from '@mikro-orm/sqlite';
import { type Article, ArticleSchema } from './article.entity.js';
import { type ArticleListing, ArticleListingSchema } from './article-listing.entity.js';

// extending the EntityRepository exported from driver package, so we can access things like the QB factory
export class ArticleRepository extends EntityRepository<Article> {

  listArticlesQuery() {
    // just a placeholder for now
    return this.createQueryBuilder('a');
  }

  async listArticles(options: FindOptions<ArticleListing>) {
    const [items, total] = await this.em.findAndCount(ArticleListingSchema, {}, options);
    return { items, total };
  }

}
```

And use this new `listArticles()` method in the endpoint:

```ts title='modules/article/routes.ts'
// list articles
app.get('/', async request => {
  const { limit, offset } = request.query as { limit?: number; offset?: number };

  // highlight-next-line
  const { items, total } = await db.article.listArticles({
    limit, offset,
  });

  return { items, total };
});
```

## Using QueryBuilder

The `listArticlesQuery()` repository method will be a bit more complex. We want to load the articles together with the number of corresponding comments. To do that, we can use the `QueryBuilder` with a sub-query which will load the comments count for each selected article. Similarly, we want to load all the tags added to the article. To get the author's name, we can use a simple `JOIN`.

> You can find more details in the [Using Query Builder](../query-builder.md) section.

Let's first do the easy things - we want to select `slug`, `title`, `description` and `author` columns:

```ts title='modules/article/article.repository.ts'
return this.createQueryBuilder('a')
  .select(['slug', 'title', 'description', 'author']);
```

Now let's join the `User` entity and select the author's name. To have a custom alias on the column, we will use `sql.ref()` helper:

```ts title='modules/article/article.repository.ts'
return this.createQueryBuilder('a')
  .select(['slug', 'title', 'description', 'author'])
  .addSelect(sql.ref('u.full_name').as('authorName'))
  .join('author', 'u')
```

And now the sub-queries - we will need two of them, both will use the same `sql.ref()` helper (this time without aliasing) and the `QueryBuilder.as()` method to alias the whole sub-query.

```ts title='modules/article/article.repository.ts'
import { FindOptions, sql, EntityRepository } from '@mikro-orm/sqlite';
import { type Article, ArticleSchema } from './article.entity.js';
import { type ArticleListing, ArticleListingSchema } from './article-listing.entity.js';
import { CommentSchema } from './comment.entity.js';

export class ArticleRepository extends EntityRepository<Article> {

  // ...

  listArticlesQuery() {
    // sub-query for total number of comments
    const totalComments = this.em.createQueryBuilder(CommentSchema)
      .count()
      .where({ article: sql.ref('a.id') })
      // by calling `qb.as()` we convert the QB instance to Knex instance
      .as('totalComments');

    // sub-query for all used tags
    const usedTags = this.em.createQueryBuilder(ArticleSchema, 'aa')
      // we need to mark raw query fragment with `sql` helper
      // otherwise it would be escaped
      .select(sql`group_concat(distinct t.name)`)
      .join('aa.tags', 't')
      .where({ 'aa.id': sql.ref('a.id') })
      .groupBy('aa.author')
      .as('tags');

    // build final query
    return this.createQueryBuilder('a')
      .select(['slug', 'title', 'description', 'author'])
      .addSelect(sql.ref('u.full_name').as('authorName'))
      .join('author', 'u')
      .addSelect([totalComments, usedTags]);
  }

}
```

Note how we used the `sql` helper function as a tagged template when adding the `group_concat` expression to the select clause. Read more about the support for [raw queries here](../raw-queries.md).

### Executing the Query

In our example, we just return the `QueryBuilder` instance and let the ORM execute it through our virtual entity, you may ask: how can you execute the query manually? There are two ways, the first is the `qb.execute()` method, which gives you raw results (plain objects). By default, it will return an array of items, mapping column names to property names automatically. You can use the first parameter to control the mode and form of result:

```ts
const res1 = await qb.execute('all'); // returns array of objects, default behavior
const res2 = await qb.execute('get'); // returns single object
const res3 = await qb.execute('run'); // returns object like `{ affectedRows: number, insertId: number, row: any }`
```

The second argument can be used to disable the mapping of database columns to property names. In the following example, the `Article` entity has a `createdAt` property defined with implicit underscored field name `created_at`:

```ts
const res1 = await em.createQueryBuilder(ArticleSchema).select('*').execute('get', true);
console.log(res1); // `createdAt` will be defined, while `created_at` will be missing

const res2 = await em.createQueryBuilder(ArticleSchema).select('*').execute('get', false);
console.log(res2); // `created_at` will be defined, while `createdAt` will be missing
```

To get the entity instances from the `QueryBuilder` result, you can use the `getResult()` and `getSingleResult()` methods:

```ts
const article = await em.createQueryBuilder(ArticleSchema)
  .select('*')
  .where({ id: 1 })
  .getSingleResult();
console.log(article); // Article { id: 1, ... }

const articles = await em.createQueryBuilder(ArticleSchema)
  .select('*')
  .getResult();
console.log(articles[0] instanceof Article); // true
```

> You can also use `qb.getResultList()` which is alias for `qb.getResult()`.

## Updating the tests

We just changed the shape of our API response, which is something we test already, so let's fix our broken tests. First, create some testing comments in our `TestSeeder`:

```diff title='seeders/TestSeeder.ts'
export class TestSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
-   em.create(UserSchema, {
+   const author = em.create(UserSchema, {
      fullName: "Foo Bar",
      email: "foo@bar.com",
      // ...
    });

+   em.assign(author.articles[0], {
+     comments: [
+       { author, text: `random comment ${Math.random()}` },
+       { author, text: `random comment ${Math.random()}` },
+     ],
+   });
+
+   em.assign(author.articles[1], {
+     comments: [{ author, text: `random comment ${Math.random()}` }],
+   });
+
+   em.assign(author.articles[2], {
+     comments: [
+       { author, text: `random comment ${Math.random()}` },
+       { author, text: `random comment ${Math.random()}` },
+       { author, text: `random comment ${Math.random()}` },
+     ],
+   });
  }
}
```

```diff title='test/article.test.ts'
expect(res.json()).toMatchObject({
  items: [
-   { author: 1, slug: "title-13", title: "title 1/3" },
-   { author: 1, slug: "title-23", title: "title 2/3" },
-   { author: 1, slug: "title-33", title: "title 3/3" },
+   {
+     slug: expect.any(String),
+     title: 'title 1/3',
+     description: 'desc 1/3',
+     tags: ['foo1', 'foo2'],
+     authorName: 'Foo Bar',
+     totalComments: 2,
+   },
+   {
+     slug: expect.any(String),
+     title: 'title 2/3',
+     description: 'desc 2/3',
+     tags: ['foo2'],
+     authorName: 'Foo Bar',
+     totalComments: 1,
+   },
+   {
+     slug: expect.any(String),
+     title: 'title 3/3',
+     description: 'desc 3/3',
+     tags: ['foo2', 'foo3'],
+     authorName: 'Foo Bar',
+     totalComments: 3,
+   },
  ],
  total: 3,
});
```

## Result cache

MikroORM has a simple [result caching](../caching.md) mechanism, all you need to do is add `cache` option to your [`em.find()`](/api/core/class/EntityManager#find) options. The value can be one of:

- `true` for default expiration (configurable globally, defaults to 1 second).
- A number for explicit expiration (in milliseconds).
- A tuple with first element being the `cacheKey` (`string`) and the second element the expiration (`number`). You can use the cacheKey to clear the cache via `em.clearCache()`.

Let's enable the caching for our article listing endpoint, with a 5-second expiration:

```ts title='modules/article/routes.ts'
// list articles
app.get('/', async request => {
  const { limit, offset } = request.query as { limit?: number; offset?: number };

  const { items, total } = await db.article.listArticles({
    limit, offset,
    // highlight-next-line
    cache: 5_000, // 5 seconds
  });

  return { items, total };
});
```

Now when you enable [debug mode](../logging.md) and try to access the endpoint several times within 5 seconds, you should see just the first request producing queries.

## View entities

The virtual entity we created earlier evaluates its SQL expression as a subquery every time you query it. If you'd prefer to have an actual database view instead, you can convert it to a [view entity](../view-entities.md) by adding the `view: true` option. The `expression` then becomes the view definition — the database will create the view once, and queries will read from it directly.

Let's create a view version of our article listing:

```ts title='modules/article/article-listing-view.entity.ts'
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const ArticleListingViewSchema = defineEntity({
  name: 'ArticleListingView',
  // highlight-next-line
  view: true,
  expression: `
    select a.slug, a.title, a.description, a.author_id as author,
           u.full_name as author_name,
           (select count(*) from comment c where c.article_id = a.id) as total_comments,
           (select group_concat(distinct t.name) from article_tags at2
              join tag t on t.id = at2.tag_id
              where at2.article_id = a.id) as tags
    from article a
    join user u on u.id = a.author_id
  `,
  properties: {
    slug: p.string().primary(),
    title: p.string(),
    description: p.string(),
    tags: p.array(),
    author: p.integer(),
    authorName: p.string(),
    totalComments: p.integer(),
  },
});

export type ArticleListingView = InferEntity<typeof ArticleListingViewSchema>;
```

Unlike a virtual entity, a view entity has a primary key (`slug` in this case) and maps to a real database object. The key differences:

- **Virtual entity**: expression is inlined as a subquery at query time, no primary key, no change tracking.
- **View entity**: a `CREATE VIEW` statement is generated, the entity has a primary key and lives in the Identity Map. Still read-only by default.

Since view entities create actual database objects, you need to generate and run a migration:

```bash
npx mikro-orm migration:create
npx mikro-orm migration:up
```

If you use `orm.schema.create()` or `orm.schema.update()` (e.g. in tests), views are created automatically — no extra step needed.

:::info

View entities are read-only — the ORM will not generate `INSERT`, `UPDATE`, or `DELETE` statements for them. The `expression` is a plain SQL string used as the view definition.

:::

## Soft delete via `onFlush` event

Let's add soft delete support for comments. Instead of physically deleting a comment from the database, we'll set a `deletedAt` timestamp and use a [filter](../filters.md) to automatically exclude soft-deleted records from queries.

First, add a `deletedAt` property and a filter to the `Comment` entity:

```ts title='comment.entity.ts'
export const CommentSchema = defineEntity({
  name: 'Comment',
  extends: BaseSchema,
  properties: {
    text: p.string(),
    article: () => p.manyToOne(ArticleSchema).ref(),
    author: () => p.manyToOne(UserSchema).ref(),
    // highlight-next-line
    deletedAt: p.datetime().nullable(),
  },
  // highlight-start
  filters: {
    softDelete: { cond: { deletedAt: null }, default: true },
  },
  // highlight-end
});
```

The `filters` option with `default: true` means all queries for `Comment` will automatically add `WHERE deleted_at IS NULL` - soft-deleted comments are invisible by default.

Now implement an event subscriber that intercepts delete operations and converts them to soft deletes. The `onFlush` event fires after change sets are computed but before the actual database queries run - this is the perfect place to transform a `DELETE` into an `UPDATE`:

```ts title='modules/common/soft-delete.subscriber.ts'
import type { EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import { ChangeSetType } from '@mikro-orm/core';

export class SoftDeleteSubscriber implements EventSubscriber {

  async onFlush(args: FlushEventArgs): Promise<void> {
    const changeSets = args.uow.getChangeSets();

    for (const cs of changeSets) {
      if (cs.type !== ChangeSetType.DELETE) {
        continue;
      }

      // only soft-delete entities that have a `deletedAt` property
      if (!cs.meta.properties.deletedAt) {
        continue;
      }

      // convert the DELETE to an UPDATE that sets `deletedAt`
      cs.entity.deletedAt = new Date();
      args.uow.computeChangeSet(cs.entity, ChangeSetType.UPDATE);
    }
  }

}
```

Register the subscriber in your ORM config:

```ts title='mikro-orm.config.ts'
import { SoftDeleteSubscriber } from './modules/common/soft-delete.subscriber.js';

export default defineConfig({
  // ...
  subscribers: [new SoftDeleteSubscriber()],
});
```

Now when you call `em.remove(comment)` and `em.flush()`, the comment won't be physically deleted - instead, its `deletedAt` column will be set. And thanks to the filter, queries for comments will automatically exclude soft-deleted ones.

If you need to query soft-deleted records (e.g., for an admin panel or undo feature), you can disable the filter:

```ts
// include soft-deleted comments
const allComments = await em.find(CommentSchema, {}, {
  filters: { softDelete: false },
});
```

> The subscriber already checks for the `deletedAt` property generically - you can add the same `filters` option and `deletedAt` property to any entity that should support soft delete. See the [Events](../events.md) and [Filters](../filters.md) documentation for more details.

## Standalone scripts and CRON jobs

Throughout this guide, we've been working within a web server context where `RequestContext` creates a fresh `EntityManager` fork for each request. But what about standalone scripts, data migrations, or CRON jobs that run outside of a web server?

### Standalone scripts

For one-off scripts, you have two options. The simplest is to fork the `EntityManager` explicitly, just like we did in Chapter 1:

```ts title='scripts/cleanup.ts'
import { initORM } from '../src/db.js';

const db = await initORM();
const em = db.em.fork();

// work with the forked EntityManager
const oldArticles = await em.find(ArticleSchema, {
  createdAt: { $lt: new Date('2020-01-01') },
});
em.remove(oldArticles);
await em.flush();

await db.orm.close();
```

Alternatively, if you want to use the global `EntityManager` directly (acceptable for scripts where there's no concurrent access), you can enable it in the config:

```ts
const db = await initORM({ allowGlobalContext: true });

// now you can use db.em directly
const users = await db.em.find(User, {});
```

:::warning

Do not use `allowGlobalContext` as a workaround for missing request context in production. It silences the validation error but does not fix the underlying problem — you will still face growing memory footprint and unstable API responses caused by a shared Identity Map. Use it only for simple scripts and tests where there is no concurrent access. For everything else, set up a proper request context via `RequestContext` helper, `@CreateRequestContext()` decorator, or `em.fork()`. See [Identity Map — Why is Request Context needed?](../identity-map.md#why-is-request-context-needed) for details.

:::

### CRON jobs

For recurring tasks that run alongside a web server, use `RequestContext.create()` to ensure each job execution gets its own isolated context:

```ts title='src/cron.ts'
import { RequestContext } from '@mikro-orm/core';
import { initORM } from './db.js';

export async function setupCronJobs() {
  const db = await initORM();

  // run every hour
  setInterval(async () => {
    await RequestContext.create(db.em, async () => {
      // this runs in its own context, safe from other concurrent operations
      const expiredArticles = await db.article.find({
        createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });
      // ... process expired articles
      await db.em.flush();
    });
  }, 60 * 60 * 1000);
}
```

The key rule is: never share an `EntityManager` across concurrent operations. Either fork it, or use `RequestContext` to isolate each operation.

## Deployment

Our app is ready, let's prepare the production build. Since we use `defineEntity` with explicit entity references (not folder-based discovery), we have two deployment options.

### Basic TypeScript compilation

The simplest approach is to compile TypeScript and run the output:

```json title='package.json'
"scripts": {
  "build": "tsc",
  "start": "tsx src/server.ts",
  "start:prod": "node dist/server.js",
  "test": "vitest"
},
```

```bash
npm run build
npm run start:prod
```

### Bundling with Vite

Since `defineEntity` doesn't require runtime file system access for entity discovery, our app is fully compatible with bundlers. This allows creating a single-file bundle with all dependencies included - perfect for containerized deployments or serverless environments.

First, install Vite:

```bash npm2yarn
npm install vite --save-dev
```

Create a Vite configuration for SSR (server-side) bundling:

```ts title='vite.config.ts'
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'src/server.ts',
    outDir: 'dist',
    sourcemap: true,
    target: 'node22',
  },
  ssr: {
    // bundle MikroORM packages into the output
    noExternal: ['@mikro-orm/sqlite', '@mikro-orm/sql', '@mikro-orm/core'],
  },
});
```

Add the bundle script to your package.json:

```json title='package.json'
"scripts": {
  "build": "tsc",
  // highlight-next-line
  "bundle": "vite build",
  "start": "tsx src/server.ts",
  "start:prod": "node dist/server.js",
  "test": "vitest"
},
```

Now you can create a bundled production build:

```bash
npm run bundle
npm run start:prod
```

## ⛳ Checkpoint 4

Our app is shaping quite well, we now have all the endpoints implemented and covered with basic tests.

https://codesandbox.io/p/sandbox/mikroorm-getting-started-guide-checkpoint-4-dhg2vj?file=src/app.ts

```ts title='app.ts'
import { NotFoundError, RequestContext } from "@mikro-orm/core";
import { fastify } from "fastify";
import fastifyJWT from "@fastify/jwt";
import { initORM } from "./db.js";
import { registerArticleRoutes } from "./modules/article/routes.js";
import { registerUserRoutes } from "./modules/user/routes.js";
import { AuthError } from "./modules/common/utils.js";

export async function bootstrap(port = 3001, migrate = true) {
  const db = initORM();

  if (migrate) {
    // sync the schema
    await db.orm.migrator.up();
  }

  const app = fastify();

  // register JWT plugin
  app.register(fastifyJWT, {
    secret: process.env.JWT_SECRET ?? "12345678", // fallback for testing
  });

  // register request context hook
  app.addHook("onRequest", (request, reply, done) => {
    RequestContext.create(db.em, done);
  });

  // register auth hook after the ORM one to use the context
  app.addHook("onRequest", async (request) => {
    try {
      const ret = await request.jwtVerify<{ id: number }>();
      request.user = await db.user.findOneOrFail(ret.id);
    } catch (e) {
      app.log.error(e);
      // ignore token errors, we validate the request.user exists only where needed
    }
  });

  // register global error handler to process 404 errors from `findOneOrFail` calls
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      return reply.status(401).send({ error: error.message });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: error.message });
    }

    app.log.error(error);
    reply.status(500).send({ error: error.message });
  });

  // shut down the connection when closing the app
  app.addHook("onClose", async () => {
    await db.orm.close();
  });

  // register routes here
  app.register(registerArticleRoutes, { prefix: "article" });
  app.register(registerUserRoutes, { prefix: "user" });

  const url = await app.listen({ port });

  return { app, url, db };
}
```
