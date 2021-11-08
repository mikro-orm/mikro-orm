---
title: Identity Map and Request Context
---

`MikroORM` uses identity map in background so you will always get the same instance of 
one entity.

```typescript
const authorRepository = orm.em.getRepository(Author);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true
```

If you want to clear this identity map cache, you can do so via `em.clear()` method:

```typescript
orm.em.clear();
```

You should always keep unique identity map per each request. This basically means that you need 
to clone entity manager and use the clone in request context. There are two ways to achieve this:

## Forking Entity Manager

With `fork()` method you can simply get clean entity manager with its own context and identity map:

```typescript
const em = orm.em.fork();
```

## Global Identity Map

In v5, it is no longer possible to use the global identity map. This was a
common issue that led to weird bugs, as using the global EM without request
context is almost always wrong, we always need to have a dedicated context for 
each request, so they do not interfere.

We still can disable this check via `allowGlobalContext` configuration, or 
a connected environment variable `MIKRO_ORM_ALLOW_GLOBAL_CONTEXT` - this can 
be handy especially in unit tests.

## <a name="request-context"></a> RequestContext helper for DI containers

If you use dependency injection container like `inversify` or the one in `nestjs` framework, it 
can be hard to achieve this, because you usually want to access your repositories via DI container,
but it will always provide you with the same instance, rather than new one for each request. 

To solve this, you can use `RequestContext` helper, that will use `node`'s 
[`AsyncLocalStorage`](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage) 
in the background to isolate the request context. MikroORM will always use request specific (forked) 
entity manager if available, so all you need to do is to create new request context preferably 
as a middleware:

```typescript
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
``` 

You should register this middleware as the last one just before request handlers and before
any of your custom middleware that is using the ORM. There might be issues when you register 
it before request processing middleware like `queryParser` or `bodyParser`, so definitely 
register the context after them. 

Later on you can then access the request scoped `EntityManager` via `RequestContext.getEntityManager()`.
This method is used under the hood automatically, so you should not need it. 

> `RequestContext.getEntityManager()` will return `undefined` if the context was
> not started yet.

## Why is Request Context needed?

Imagine you will use single Identity Map throughout your application. It will be shared across 
all request handlers, that can possibly run in parallel. 

### Problem 1 - growing memory footprint

As there would be only one shared Identity Map, you can't just clear it after your request ends.
There can be another request working with it so clearing the Identity Map from one request could 
break other requests running in parallel. This will result in growing memory footprint, as every 
entity that became managed at some point in time would be kept in the Identity Map. 

### Problem 2 - unstable response of API endpoints

Every entity has `toJSON()` method, that automatically converts it to serialized form. If you 
have only one shared Identity Map, following situation may occur:

Let's say there are 2 endpoints

1. `GET /book/:id` that returns just the book, without populating anything
2. `GET /book-with-author/:id` that returns the book and its author populated

Now when someone requests same book via both of those endpoints, you could end up with both 
returning the same output:
 
1. `GET /book/1` returns `Book` without populating its property `author` property
2. `GET /book-with-author/1` returns `Book`, this time with `author` populated
3. `GET /book/1` returns `Book`, but this time also with `author` populated

This happens because the information about entity association being populated is stored in
the Identity Map. 
