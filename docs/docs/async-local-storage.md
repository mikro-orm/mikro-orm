---
title: Using AsyncLocalStorage
---

:::info
Since v5 `AsyncLocalStorage` is used inside `RequestContext` helper so this section
is no longer valid.
:::

By default, the `domain` api is used in the `RequestContext` helper. Since v4.0.3,
you can use the new `AsyncLocalStorage` too, if you are on up to date node version:

```typescript
const storage = new AsyncLocalStorage<EntityManager>();

const orm = await MikroORM.init({
  context: () => storage.getStore(),
  // ...
});

app.use((req, res, next) => {
  storage.run(orm.em.fork(true, true), next);
});
```
