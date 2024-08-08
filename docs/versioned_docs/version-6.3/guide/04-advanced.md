---
title: 'Chapter 4: Advanced'
---

In this chapter, we will first implement all the methods of `/user` endpoint, including a basic JWT authentication provided via `@fastify/jwt` package, and proceed with the rest of the `/article` endpoints. We will touch on some of the more advanced concepts like custom repositories, virtual entities, `QueryBuilder`, flush events, and more.

## Improving route registration

Before we jump in and implement the rest of the `User` and `Article` endpoint handlers, let's improve on how we register the routes. Let's create a `routes.ts` file in `src/modules/article`, and export a factory function from it:

```ts title='modules/article/routes.ts'
import { FastifyInstance } from 'fastify';
import { initORM } from '../../db.js';

export async function registerArticleRoutes(app: FastifyInstance) {
  const db = await initORM();

  app.get('/', async request => {
    const { limit, offset } = request.query as { limit?: number; offset?: number };
    const [items, total] = await db.article.findAndCount({}, {
      limit, offset,
    });

    return { items, total };
  });
}
```

And let's create a placeholder for the `User` module too, so in `src/modules/user` folder:

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

Time to add our first `User` endpoint, for registering new users. It will be a `POST` endpoint, which will accept an object payload with `email`, `fullName` and `password` properties:

```ts title='modules/user/routes.ts'
export async function registerUserRoutes(app: FastifyInstance) {
  const db = await initORM();

  // register new user
  app.post('/sign-up', async request => {
    const body = request.body as EntityData<User>;

    if (!body.email || !body.fullName || !body.password) {
      throw new Error('One of required fields is missing: email, fullName, password');
    }

    if ((await db.user.count({ email: body.email })) > 0) {
      throw new Error('This email is already registered, maybe you want to sign in?');
    }

    const user = new User(body.fullName, body.email, body.password);
    user.bio = body.bio ?? '';
    await db.em.persist(user).flush();

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

And use this repository in the `@Entity()` decorator options. To have everything correctly typed, specify also the `EntityRepositoryType` symbol property - this way the `em.getRepository()` method will detect our custom repository on type level automatically:

```ts title='user.entity.ts'
import { UserRepository } from './user.repository.js';

@Entity({ repository: () => UserRepository })
export class User extends BaseEntity<'bio'> {

  // for automatic inference via `em.getRepository(User)`
  [EntityRepositoryType]?: UserRepository;

  // rest of the entity definition

}
```

And don't forget to adjust our `Services` type:

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

Time to add the second `User` route, this time for logging in. Let's modify our `routes.ts` again. Let's again use a custom repository method for the `login`, we will implement that in a second:

```ts title='modules/user/routes.ts'
export async function registerUserRoutes(app: FastifyInstance) {
  const db = await initORM();

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

And now the `login` method, it will try to load the `User` entity based on the password, and compare it via our `User.verifyPassword()` instance method. If we don't find such combination of the `email` and `password`, we throw an error.

```ts title='modules/user/user.repository.ts'
export class UserRepository extends EntityRepository<User> {

  // ...

  async login(email: string, password: string) {
    // we use a more generic error so we don't leak such email is registered
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

We now have two new endpoints, we should test they work as expected. Add a new test case for the `User` endpoints:

```ts title='tests/user.test.ts'
import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { initTestApp } from './utils.js';

let app: FastifyInstance;

beforeAll(async () => {
  // we use different ports to allow parallel testing
  app = await initTestApp(30002);
});

afterAll(async () => {
  // we close only the fastify app - it will close the database connection via onClose hook automatically
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

That's because we don't handle this anywhere, we just throw an error - let's deal with that now, by integrating the authentication into our application.

### JSON Web Tokens

So the plan is to add an authentication layer to our API. We will need generate an authentication token that will hold the identity - let's use so-called JSON Web Token (JWT), an industry standard. We can leverage the `@fastify/jwt` plugin for encoding/decoding them with ease.

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

With the JWT plugin, our `request` object will have a `user` property we can use to store data about the currently logged `User`, as well as two handy methods on the `app` object:

- `app.jwt.sign()` to create the token from a payload
- `request.jwtVerify()` to verify and decode the token back to the payload

We will use the token payload to store the `user.id`. Let's add a new property to our `User` entity for it:

```ts title='modules/user/user.entity.ts'
@Property({ persist: false })
token?: string;
```

We used `persist: false` here, that means the property is virtual, it does not represent a database column (but can be mapped and serialized).

Before we continue, let's add one more utility - a custom `AuthError` class, which we can use to detect authentication issues (e.g. wrong password).

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
    // we use a more generic error so we don't leak such email is registered
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

  const user = new User(body.fullName, body.email, body.password);
  user.bio = body.bio ?? '';
  await db.em.persist(user).flush();

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

And that's it, our tests should be passing now again, with a basic authentication mechanism in place! When the server detects a user token in the request headers, it will automatically load the corresponding user and store it into the `request.user` property.

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
  wrap(user).assign(request.body as User);
  await db.em.flush();
  return user;
});
```

:::info Exercise

Try implementing the tests for those endpoints now!

:::

## Embeddables

Before we move on back to the article endpoint, let's improve our user entity a bit. Say we want to have optional social handles for twitter, facebook or linkedin on the `User` entity. We can use [Embeddables](../embeddables.md) for this, a feature which allows mapping multiple columns to an object.

```ts title='user.entity.ts'
@Embeddable()
export class Social {

  @Property()
  twitter?: string;

  @Property()
  facebook?: string;

  @Property()
  linkedin?: string;

}


@Entity({ repository: () => UserRepository })
export class User extends BaseEntity<'bio'> {

  // ...

  // highlight-start
  @Embedded(() => Social)
  social?: Social;
  // highlight-end

}
```

Try using to CLI to check how this affects the database schema:

```bash
$ npx mikro-orm-esm schema:update --dump

alter table `user` add column `social_twitter` text null;
alter table `user` add column `social_facebook` text null;
alter table `user` add column `social_linkedin` text null;
```

But maybe it would be a better idea to store the social handles into a JSON column - we can easily achieve that with embeddables too:

```ts
@Embedded(() => Social, { object: true })
social?: Social;
```

And test it again:

```bash
$ npx mikro-orm-esm schema:update --dump

alter table `user` add column `social` json null;
```

Yeah, that looks good, let's create a migration for it:

```bash
$ npx mikro-orm-esm migration:create

Migration20231105213316.ts successfully created

$ npx mikro-orm-esm migration:up

Processing 'Migration20231105213316'
Applied 'Migration20231105213316'
Successfully migrated up to the latest version
```

## Validation via Zod

One more thing in the user module, we need to process this new `User.social` property in our `sign-up` endpoint.

```ts title='modules/user/routes.ts'
const user = new User(body.fullName, body.email, body.password);
user.bio = body.bio ?? '';
// highlight-next-line
user.social = body.social as Social;
await db.em.persist(user).flush();
```

The code is getting a bit messy, let's use [`em.create()`](/api/core/class/EntityManager#create) instead to make it clean again:

```diff file='modules/user/routes.ts'
-const user = new User(body.fullName, body.email, body.password);
-user.bio = body.bio ?? '';
-user.social = body.social as Social;
+const user = db.user.create(request.body as RequiredEntityData<User>);
await db.em.persist(user).flush();
```

MikroORM will perform some basic validation automatically, but it is generally a good practice to validate the user input explicitly. Let's use [Zod](https://github.com/colinhacks/zod) for it, it will also help with making the TypeScript compiler happy without the type assertion.

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

Let's implement the rest of the article endpoints. We will need a public one for the article detail, one for posting comments, one for updating the article and one for deleting it. The last two will be only allowed for the user who created given article.

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

Then we define the endpoint for creating comments - here we use the `getUserFromToken` helper to access the current user based on the token, try to find the article (again based on the `slug` property) and create the comment entity. Since we use [`em.create()`](/api/core/class/EntityManager#create) here, we don't have to [`em.persist()`](/api/core/class/EntityManager#persist) the new entity, as it happens automatically this way.

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

For updating we use `wrap(article).assign()`, a helper method which will map the data to entity graph correctly. It will transform foreign keys into entity references automatically.

> Alternatively, you can use `em.assign()`, which will also work for not managed entities.

```ts title='modules/article/routes.ts'
app.patch('/:id', async request => {
  const user = getUserFromToken(request);
  const params = request.params as { id: string };
  const article = await db.article.findOneOrFail(+params.id);
  verifyArticlePermissions(user, article);
  wrap(article).assign(request.body as Article);
  await db.em.flush();

  return article;
});
```

We also validate that only the author of the article can change it:

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
-wrap(article).assign(request.body as Article);
-await db.em.flush();
+const article = await db.article.upsert(request.body as Article);
```

To upsert many entities in a batch, you can use `em.upsertMany()`, which will handle everything within a single query.

Read more about upserting in [Entity Manager](../entity-manager.md#upsert) section.

### Removing entities

There are several approaches to removing an entity. In this case, we first load the entity, if it does not exist, we return `notFound: true` in the response, if it does, we remove it via `em.remove()`, which marks the entity for removal on the following `flush()` call.

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

While we do not have such a use case in this guide, a huge benefit of using the [`EntityManager`](/api/core/class/EntityManager) with Unit of Work approach is automatic batching - all the `INSERT`, `UPDATE` and `DELETE` queries will be batched automatically into a single query per entity.

#### Insert

```ts
for (let i = 1; i <= 5; i++) {
  const u = new User(`Peter ${i}`, `peter+${i}@foo.bar`);
  em.persist(u);
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

Let's now improve our first article endpoint - we used `em.findAndCount()` to get paginated results easily, but what if we want to customize the response? One way to do that are [Virtual entities](../virtual-entities.md). They don't represent any database table, instead, they dynamically resolve to an SQL query, allowing you to map any kind of results onto an entity.

:::info

Virtual entities are meant for read purposes, they don't have a primary key and therefore cannot be tracked for changes. In a way they are similar to native database views - and you can use them to proxy your native database views to ORM entities too.

:::

To define a virtual entity, provide an `expression` in the `@Entity()` decorator options. In can be a string (SQL query) or a callback returning an SQL query or a `QueryBuilder` instance. Only scalar properties (`@Property()`) are supported.

```ts title='modules/article/article-listing.entity.ts'
import { Entity, EntityManager, Property } from '@mikro-orm/sqlite';
import { Article } from './article.entity.js';

@Entity({
  expression: (em: EntityManager) => {
    return em.getRepository(Article).listArticlesQuery();
  },
})
export class ArticleListing {

  @Property()
  slug!: string;

  @Property()
  title!: string;

  @Property()
  description!: string;

  @Property()
  tags!: string[];

  @Property()
  author!: number;

  @Property()
  authorName!: string;

  @Property()
  totalComments!: number;

}
```

Now create a custom repository for the `Article` entity too, and put two methods inside:

```ts title='modules/article/article.repository.ts'
import { FindOptions, sql, EntityRepository } from '@mikro-orm/sqlite';
import { Article } from './article.entity.js';
import { ArticleListing } from './article-listing.entity.js';

// extending the EntityRepository exported from driver package, so we can access things like the QB factory
export class ArticleRepository extends EntityRepository<Article> {

  listArticlesQuery() {
    // just a placeholder for now
    return this.createQueryBuilder('a');
  }

  async listArticles(options: FindOptions<ArticleListing>) {
    const [items, total] = await this.em.findAndCount(ArticleListing, {}, options);
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
import { Article } from './article.entity.js';
import { ArticleListing } from './article-listing.entity.js';
import { Comment } from './comment.entity.js';

export class ArticleRepository extends EntityRepository<Article> {

  // ...

  listArticlesQuery() {
    // sub-query for total number of comments
    const totalComments = this.em.createQueryBuilder(Comment)
      .count()
      .where({ article: sql.ref('a.id') })
      // by calling `qb.as()` we convert the QB instance to Knex instance
      .as('totalComments');

    // sub-query for all used tags
    const usedTags = this.em.createQueryBuilder(Article, 'aa')
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
const res1 = await em.createQueryBuilder(Article).select('*').execute('get', true);
console.log(res1); // `createdAt` will be defined, while `created_at` will be missing

const res2 = await em.createQueryBuilder(Article).select('*').execute('get', false);
console.log(res2); // `created_at` will be defined, while `createdAt` will be missing
```

To get the entity instances from the `QueryBuilder` result, you can use the `getResult()` and `getSingleResult()` methods:

```ts
const article = await em.createQueryBuilder(Article)
  .select('*')
  .where({ id: 1 })
  .getSingleResult();
console.log(article instanceof Article); // true

const articles = await em.createQueryBuilder(Article)
  .select('*')
  .getResult();
console.log(articles[0] instanceof Article); // true
```

> You can also use `qb.getResultList()` which is alias for `qb.getResult()`.

### Awaiting the QueryBuilder

You can also await the `QueryBuilder` instance, which will automatically execute the `QueryBuilder` and return an appropriate response automatically. The `QueryBuilder` instance is typed based on the usage of `select/insert/update/delete/truncate` methods to one of:

- `SelectQueryBuilder`
    - awaiting yields array of entities (as `qb.getResultList()`)
- `CountQueryBuilder`
    - awaiting yields number (as `qb.getCount()`)
- `InsertQueryBuilder` (extends `RunQueryBuilder`)
    - awaiting yields `QueryResult`
- `UpdateQueryBuilder` (extends `RunQueryBuilder`)
    - awaiting yields `QueryResult`
- `DeleteQueryBuilder` (extends `RunQueryBuilder`)
    - awaiting yields `QueryResult`
- `TruncateQueryBuilder` (extends `RunQueryBuilder`)
    - awaiting yields `QueryResult`

> `em.qb()` is a shortcut for `em.createQueryBuilder()`.

```ts
const res1 = await em.qb(User).insert({
  fullName: 'Jon',
  email: 'foo@bar.com',
});
// res1 is of type `QueryResult<User>`
console.log(res1.insertId);

const res2 = await em.qb(User)
  .select('*')
  .where({ fullName: 'Jon' })
  .limit(5);
// res2 is User[]
console.log(res2.map(p => p.name));

const res3 = await em.qb(User).count().where({ fullName: 'Jon' });
// res3 is number
console.log(res3 > 0); // true

const res4 = await em.qb(User)
  .update({ email: 'foo@bar.com' })
  .where({ fullName: 'Jon' });
// res4 is QueryResult<User>
console.log(res4.affectedRows > 0); // true

const res5 = await em.qb(User).delete().where({ fullName: 'Jon' });
// res5 is QueryResult<User>
console.log(res5.affectedRows > 0); // true
expect(res5.affectedRows > 0).toBe(true); // test the type
```

## Updating the tests

We just changed the shape of our API response, which is something we test already, so let's fix our broken tests. First, create some testing comments in our `TestSeeder`:

```diff title='seeders/TestSeeder.ts'
export class TestSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
-   em.create(User, {
+   const author = em.create(User, {
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

## Deployment

Our app is nearly ready, now let's prepare the production build. Since we are using the `ts-morph` metadata provider, our start-up time would be slow without a prebuilt cache. We can do that via the CLI:

```bash
npx mikro-orm-esm cache:generate
```

But our production dependencies still contain the `@mikro-orm/reflection` package now, and that depends on TypeScript itself, making the bundle unnecessarily larger. To resolve this, we can generate a metadata cache bundle and use that via `GeneratedCacheAdapter`. This way you can keep the `@mikro-orm/reflection` package as a development dependency only, use the CLI to create the cache bundle, and depend only on that in your production build.

```bash
npx mikro-orm-esm cache:generate --combined
```

This will create `./temp/metadata.json` file which can be used together with `GeneratedCacheAdapter` in your production configuration. Let's adjust our ORM config to dynamically use it when `NODE_ENV` is set to `production`:

```diff title='src/mikro-orm.config.ts'
import { defineConfig, GeneratedCacheAdapter, Options } from '@mikro-orm/sqlite';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { SeedManager } from '@mikro-orm/seeder';
import { Migrator } from '@mikro-orm/migrations';
+import { existsSync, readFileSync } from 'node:fs';
+
+const options = {} as Options;
+
+if (process.env.NODE_ENV === 'production' && existsSync('../temp/metadata.json')) {
+  options.metadataCache = {
+    enabled: true,
+    adapter: GeneratedCacheAdapter,
+    // temp/metadata.json can be generated via `npx mikro-orm-esm cache:generate --combine`
+    options: {
+      data: JSON.parse(readFileSync('./temp/metadata.json', { encoding: 'utf8' })),
+    },
+  };
+} else {
+  options.metadataProvider = (await import('@mikro-orm/reflection')).TsMorphMetadataProvider;
+}

export default defineConfig({
   // for simplicity, we use the SQLite database, as it's available pretty much everywhere
   dbName: 'sqlite.db',
   // folder based discovery setup, using common filename suffix
   entities: ['dist/**/*.entity.js'],
   entitiesTs: ['src/**/*.entity.ts'],
   // enable debug mode to log SQL queries and discovery information
   debug: true,
   // for vitest to get around `TypeError: Unknown file extension ".ts"` (ERR_UNKNOWN_FILE_EXTENSION)
   dynamicImportProvider: id => import(id),
   // for highlighting the SQL queries
   highlighter: new SqlHighlighter(),
   extensions: [SeedManager, Migrator],
-  metadataProvider: TsMorphMetadataProvider,
+  ...options,
});
```

Finally, let's adjust the NPM `build` script to generate the cache bundle, and add a production start script:

```json title='package.json'
"scripts": {
  // highlight-next-line
  "build": "tsc && npx mikro-orm-esm cache:generate --combined",
  "start": "node --no-warnings=ExperimentalWarning --loader ts-node/esm src/server.ts",
  // highlight-next-line
  "start:prod": "NODE_ENV=production node dist/server.js",
  "test": "vitest"
},
```

Now you can build and run the production version of your app:

```bash
npm run build
npm run start:prod
```

You can see in the logs that the `build` script uses `ts-morph` metadata provider, while the `start` script is using the default `reflect-metadata` one.

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
  const db = await initORM();

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
