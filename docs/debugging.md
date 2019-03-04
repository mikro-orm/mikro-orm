# Debugging

For development purposes it might come handy to enable logging and debug mode:

```typescript
return MikroORM.init({
  logger: console.log.bind(console),
  debug: true,
});
```

By doing this `MikroORM` will start using provided logger function to dump all queries:

```
[query-logger] SELECT `e0`.* FROM `author` AS `e0` WHERE `e0`.`name` = ? LIMIT ? [took 2 ms]
[query-logger] START TRANSACTION [took 1 ms]
[query-logger] INSERT INTO `author` (`name`, `email`, `created_at`, `updated_at`, `terms_accepted`) VALUES (?, ?, ?, ?, ?) [took 2 ms]
[query-logger] COMMIT [took 2 ms]
```

It is also useful for debugging problems with entity discovery, as you will see information
about every processed entity:

```
ORM entity discovery started
- processing entity Author
- using cached metadata for entity Author
- processing entity Book
- processing entity BookTag
- entity discovery finished after 13 ms
```
