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

    if ((await db.user.count({ email: body.email })) === 0) {
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
    const count = await this.count({ email });return count > 0;
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
-if ((await db.user.count({ email: body.email })) === 0) {
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

```ts file='modules/user/routes.ts'
const user = new User(body.fullName, body.email, body.password);
user.bio = body.bio ?? '';
// highlight-next-line
user.social = body.social as Social;
await db.em.persist(user).flush();
```

The code is getting a bit messy, let's use `em.create()` instead to make it clean again:

```diff file='modules/user/routes.ts'
-const user = new User(body.fullName, body.email, body.password);
-user.bio = body.bio ?? '';
-user.social = body.social as Social;
+const user = db.user.create(request.body as RequiredEntityData);
await db.em.persist(user).flush();
```

MikroORM will perform some basic validation automatically, but it is generally a good practice to validate the user input explicitly. Let's use [Zod](https://github.com/colinhacks/zod) for it, it will also help with making the TypeScript compiler happy without the type assertion.

```ts file='modules/user/routes.ts'
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

## Rest of the Article endpoints

Let's implement the rest of the article endpoints. We will need a public one for the article detail, one for posting comments, one for updating the article and one for deleting it. The last two will be only allowed for the user who created given article.

With the information you already have, implementing those endpoints should be pretty straightforward:

```ts file='modules/article/routes.ts'
// article detail
app.get('/:slug', async request => {
  const { slug } = request.params as { slug: string };
  return db.article.findOneOrFail({ slug }, {
    populate: ['author', 'comments.author', 'text'],
  });
});

// create article
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

// create article
app.post('/', async request => {
  const { title, description, text } = request.body as { title: string; description: string; text: string };
  const author = getUserFromToken(request);
  const article = db.article.create({
    title, 
    description,
    text,
    author,
  });

  await db.em.persist(article).flush();

  return article;
});

// update article
app.patch('/:id', async request => {
  const user = getUserFromToken(request);
  const params = request.params as { id: string };
  const article = await db.article.findOneOrFail(+params.id);
  verifyArticlePermissions(user, article);
  wrap(article).assign(request.body as Article);
  await db.em.flush();

  return article;
});

// delete article
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

And the new validation method:

```ts file='modules/common/utils.ts'
export function verifyArticlePermissions(user: User, article: Article): void {
  if (article.author.id !== user.id) {
    throw new Error('You are not the author of this article!');
  }
}
```

[//]: # (TODO: continue here with the rest of the endpoints for article module)

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
