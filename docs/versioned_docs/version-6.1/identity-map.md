---
title: Identity Map and Request Context
sidebar_label: Identity Map
---

`MikroORM` uses identity map in background, so we will always get the same instance of one entity.

## What is an "Identity Map"

You can think of an "identity map" as a sort of "in memory cache", in the sense that it starts off empty, gets filled and updated as you perform calls with the entity manager, and items in it get pulled out of it ("cache hit" of sorts) when an operation matches an ID the identity map is aware of. However, it is also different from an actual (result) cache, and should not be used as one (See [here](./caching.md) for an actual result cache). Caches are generally meant to improve performance across requests. An identity map is instead meant to improve performance within a single request, by making it possible to compare entity objects trivially, which in turn enables the ORM to batch operations to the database. It also helps to reduce your application's memory footprint per request, by ensuring that even if you make multiple queries that match the same rows, those rows will only exist once in memory.

For example:

```ts
const authorRepository = em.getRepository(Author);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, { populate: ['books'] });
const authors = await authorRepository.findAll({ populate: ['books'] });

// identity map in action
console.log(jon === authors[0]); // true
```

If we want to clear this identity map cache, we can do so via `em.clear()` method:

```ts
orm.em.clear();
```

We should always keep unique identity map per each request. This basically means that we need to clone entity manager and use the clone in request context. There are two ways to achieve this:

## Forking Entity Manager

With `fork()` method we can simply get clean entity manager with its own context and identity map:

```ts
const em = orm.em.fork();
```

## Global Identity Map

Since v5, it is no longer possible to use the global identity map. This was a common issue that led to weird bugs, as using the global EM without request context is almost always wrong, we always need to have a dedicated context for each request, so they do not interfere.

We can still disable this check via `allowGlobalContext` configuration, or a connected environment variable `MIKRO_ORM_ALLOW_GLOBAL_CONTEXT` - this can be handy especially in unit tests.

## `RequestContext` helper {#request-context}

If we use dependency injection container like `inversify` or the one in `nestjs` framework, it can be hard to achieve this, because we usually want to access our repositories via DI container, but it will always provide us with the same instance, rather than new one for each request.

To solve this, we can use `RequestContext` helper, that will use `node`'s [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) in the background to isolate the request context. MikroORM will always use request specific (forked) entity manager if available, so all we need to do is to create new request context preferably as a middleware:

```ts
// `orm.em` is the global EntityManager instance

app.use((req, res, next) => {
  // calls `orm.em.fork()` and attaches it to the async context
  RequestContext.create(orm.em, next);
});

app.get('/', async (req, res) => {
  // uses fork from the async context automatically
  const authors = await orm.em.find(Book, {});
  res.json(authors);
});
```

We should register this middleware as the last one just before request handlers and before any of our custom middleware that is using the ORM. There might be issues when we register it before request processing middleware like `queryParser` or `bodyParser`, so definitely register the context after them.

Later on we can then access the request scoped `EntityManager` via `RequestContext.getEntityManager()`. This method is used under the hood automatically, so we should not need it.

> `RequestContext.getEntityManager()` will return `undefined` if the context was not started yet.

### How does `RequestContext` helper work?

Internally all `EntityManager` methods that work with the Identity Map (e.g. `em.find()` or `em.getReference()`) first call `em.getContext()` to access the contextual fork. This method will first check if we are running inside `RequestContext` handler and prefer the `EntityManager` fork from it.

```ts
// we call em.find() on the global EM instance
const res = await orm.em.find(Book, {});

// but under the hood this resolves to
const res = await orm.em.getContext().find(Book, {});

// which then resolves to
const res = await RequestContext.getEntityManager().find(Book, {});
```

The `RequestContext.getEntityManager()` method then checks `AsyncLocalStorage` static instance we use for creating new EM forks in the `RequestContext.create()` method.

The [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) class from Node.js core is the magician here. It allows us to track the context throughout the async calls. It allows us to decouple the `EntityManager` fork creation (usually in a middleware as shown in previous section) from its usage through the global `EntityManager` instance.

### Using custom `AsyncLocalStorage` instance

The `RequestContext` helper holds its own `AsyncLocalStorage` instance, which the ORM checks automatically when resolving `em.getContext()`. If you want to bring your own, you can do so by using the `context` option:

```ts
const storage = new AsyncLocalStorage<EntityManager>();

const orm = await MikroORM.init({
  context: () => storage.getStore(),
  // ...
});

app.use((req, res, next) => {
  storage.run(orm.em.fork({ useContext: true }), next);
});
```

## `@CreateRequestContext()` decorator

> Before v6, `@CreateRequestContext()` was called `@UseRequestContext()`.

Middlewares are executed only for regular HTTP request handlers, what if you need a request scoped method outside that? One example of that is queue handlers or scheduled tasks (e.g. CRON jobs).

In those cases, you can use the `@CreateRequestContext()` decorator. It requires you to first inject the `MikroORM` instance (or an `EntityManager` or some `EntityRepository`) to current context, it will be then used to create a new context for us. Under the hood, the decorator will register the new request context for our method and execute it inside the method (via `RequestContext.create()`).

> `@CreateRequestContext()` should be used only on the top level methods. It should not be nested - a method decorated with it should not call another method that is also decorated with it.

```ts
export class MyService {

  // or `private readonly em: EntityManager`
  constructor(private readonly orm: MikroORM) { }

  @CreateRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

Alternatively you can provide a callback that will return one of `MikroORM`, `EntityManager` or `EntityRepository` instance.

```ts
import { DI } from '..';

export class MyService {

  @CreateRequestContext(() => DI.em)
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

The callback will receive current `this` in the first parameter. You can use it to link the `EntityManager` or `EntityRepository` too:

```ts
export class MyService {

  constructor(private readonly userRepository: EntityRepository<User>) { }

  @CreateRequestContext<MyService>(t => t.userRepository)
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

## `@EnsureRequestContext()` decorator

Sometimes you may prefer to just ensure the method is executed inside a request context, and reuse the existing context if available. You can use the `@EnsureRequestContext()` decorator here, it behaves exactly like the `@CreateRequestContext`, but only creates new context if necessary, reusing the existing one if possible.

## Why is Request Context needed?

Imagine we will use a single Identity Map throughout our application. It will be shared across all request handlers, that can possibly run in parallel.

### Problem 1 - growing memory footprint

As there would be only one shared Identity Map, we can't just clear it after our request ends. There can be another request working with it so clearing the Identity Map from one request could break other requests running in parallel. This will result in growing memory footprint, as every entity that became managed at some point in time would be kept in the Identity Map.

### Problem 2 - unstable response of API endpoints

Every entity has `toJSON()` method, that automatically converts it to serialized form If we have only one shared Identity Map, following situation may occur:

Let's say there are 2 endpoints

1. `GET /book/:id` that returns just the book, without populating anything
2. `GET /book-with-author/:id` that returns the book and its author populated

Now when someone requests same book via both of those endpoints, we could end up with both returning the same output:

1. `GET /book/1` returns `Book` without populating its property `author` property
2. `GET /book-with-author/1` returns `Book`, this time with `author` populated
3. `GET /book/1` returns `Book`, but this time also with `author` populated

This happens because the information about entity association being populated is stored in the Identity Map.
