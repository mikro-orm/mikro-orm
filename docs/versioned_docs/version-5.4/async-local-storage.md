---
title: Using AsyncLocalStorage
---

:::info Since v5 `AsyncLocalStorage` is used inside `RequestContext` helper so this section is no longer valid. :::

In v4 and older versions, the `domain` api was used in the `RequestContext` helper. Since v4.0.3, we can use the new `AsyncLocalStorage` too, if we are on up-to-date node version:

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
