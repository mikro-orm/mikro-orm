---
title: Identity Map and Request Context
sidebar_label: Identity Map
---

`MikroORM` uses identity map in background, so we will always get the same instance of one entity.

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

## <a name="request-context"></a> `RequestContext` helper

If we use dependency injection container like `inversify` or the one in `nestjs` framework, it can be hard to achieve this, because we usually want to access our repositories via DI container, but it will always provide we with the same instance, rather than new one for each request.

To solve this, we can use `RequestContext` helper, that will use `node`'s [`AsyncLocalStorage`](https://nodejs.org/api/async_context.html#class-asynclocalstorage) in the background to isolate the request context. MikroORM will always use request specific (forked) entity manager if available, so all we need to do is to create new request context preferably as a middleware:

```ts
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
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

## `@UseRequestContext()` decorator

Middlewares are executed only for regular HTTP request handlers, what if we need a request scoped method outside that? One example of that is queue handlers or scheduled tasks (e.g. CRON jobs).

We can use the `@UseRequestContext()` decorator. It requires us to first inject the `MikroORM` instance to current context, it will be then used to create the context for us. Under the hood, the decorator will register new request context for our method and execute it inside the context.

This decorator will wrap the underlying method in `RequestContext.createAsync()` call. Every call to such method will create new context (new `EntityManager` fork) which will be used inside.

> `@UseRequestContext()` should be used only on the top level methods. It should not be nested - a method decorated with it should not call another method that is also decorated with it.

```ts
@Injectable()
export class MyService {

  constructor(private readonly orm: MikroORM) { }

  @UseRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

Alternatively we can provide a callback that will return the `MikroORM` instance.

```ts
import { DI } from '..';

export class MyService {

  @UseRequestContext(() => DI.orm)
  async doSomething() {
    // this will be executed in a separate context
  }

}
```

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
