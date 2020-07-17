---
title: Debugging
---

For development purposes it might come handy to enable logging and debug mode:

```typescript
return MikroORM.init({
  debug: true,
});
```

By doing this `MikroORM` will start using `console.log()` function to dump all queries:

```
[query] select `e0`.* from `author` as `e0` where `e0`.`name` = ? limit ? [took 2 ms]
[query] begin [took 1 ms]
[query] insert into `author` (`name`, `email`, `created_at`, `updated_at`, `terms_accepted`) values (?, ?, ?, ?, ?) [took 2 ms]
[query] commit [took 2 ms]
```

It is also useful for debugging problems with entity discovery, as you will see information
about every processed entity:

```
[discovery] ORM entity discovery started
[discovery] - processing entity Author
[discovery] - using cached metadata for entity Author
[discovery] - processing entity Book
[discovery] - processing entity BookTag
[discovery] - entity discovery finished after 13 ms
```

## Custom Logger

You can also provide your own logger via `logger` option. 

```typescript
return MikroORM.init({
  debug: true,
  logger: msg => myCustomLogger.log(msg),
});
```

## Logger Namespaces

There are multiple Logger Namespaces that you can specifically request, while omitting the rest.
Just specify array of them via the `debug` option:

```typescript
return MikroORM.init({
  debug: ['query'], // now only queries will be logged
});
```

Currently there are 4 namespaces – `query`, `query-params` `discovery` and `info`.

If you provide `query-params` then you must also provide `query` in order for it to take effect.
