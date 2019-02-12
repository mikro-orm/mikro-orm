# Identity Map

`MikroORM` uses identity map in background so you will always get the same instance of 
one entity.

```typescript
const authorRepository = orm.em.getRepository<Author>(Author);
const jon = await authorRepository.findOne({ name: 'Jon Snow' }, ['books']);
const authors = await authorRepository.findAll(['books']);

// identity map in action
console.log(jon === authors[0]); // true
```

If you want to clear this identity map cache, you can do so via `EntityManager.clear()` method:

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

## <a name="request-context"></a> RequestContext helper for DI containers

If you use dependency injection container like `inversify` or the one in `nestjs` framework, it 
can be hard to achieve this, because you usually want to access your repositories via DI container,
but it will always provide you with the same instance, rather than new one for each request. 

To solve this, you can use `RequestContext` helper, that will use `node`'s async hooks in the background
to isolate the request context. MikroORM will always use request specific (forked) entity manager 
if available, so all you need to do is to create new request context preferably in middle:

```typescript
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});
``` 

You should register this middleware as the last one just before request handlers and before
any of your custom middleware that is using the ORM. There might be issues when you register 
it before request processing middleware like `queryParser` or `bodyParser`, so definitely 
register the context after them. 

[&larr; Back to table of contents](index.md#table-of-contents)
