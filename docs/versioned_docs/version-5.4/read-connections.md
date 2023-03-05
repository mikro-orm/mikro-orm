---
title: Read Replica Connections
---

Users can specify multiple read connections via `replicas` option. You can provide only fields that differ from master connection, rest will be taken from it.

When resolving read connections, the default strategy is to assign random read replicas for all read operations (SELECT, COUNT) that are not running inside a transaction.

You can specify an explicit connection type for find and count operations by using the `connectionType` property on the corresponding Options argument (i.e. `FindOptions`, `CountOptions`).

The connection resolution strategy can be also inverted by setting the `preferReadReplicas` configuration property to `false` so that the default connection will always be a write connection, unless explicitly requested to be read (can be useful in applications where read-replicas are available but should only be used for specific use-cases).

```ts
const orm = await MikroORM.init({
  entities: [Author, ...],
  dbName: `my_database`,
  type: 'mysql',
  user: 'master_user',
  host: 'master_host',
  preferReadReplicas: true, // optional property, defaults to true
  replicas: [
    { name: 'read-1', host: 'read_host_1', user: 'read_user' },
    { name: 'read-2', host: 'read_host_2' }, // user omitted, will be taken from master connection
  ],
});
```

By default, select queries will use random read connection if not inside transaction. You can specify the connection type explicitly in `em.getConnection(type: 'read' | 'write')`.

```ts
const connection = em.getConnection(); // write connection
const readConnection = em.getConnection('read'); // random read connection

const qb1 = em.createQueryBuilder(Author);
const res1 = await qb1.select('*').execute(); // random read connection

const qb2 = em.createQueryBuilder(Author, 'a', 'write');
const res2 = await qb2.select('*').execute(); // write connection

const qb3 = em.createQueryBuilder(Author);
const res3 = await qb3.update(...).where(...).execute(); // write connection

const res4 = await em.findOne(Author, 1, { connectionType: 'write' }); // explicit write connection

// all queries inside a transaction will use write connection
await em.transactional(async em => {
    const a = await em.findOne(Author, 1); // write connection
    const b = await em.findOne(Author, 1, { connectionType: 'read' }); // still a write connection - we are in a transaction
    a.name = 'test'; // will trigger update on write connection once flushed
});

// given a configuration where preferReadReplicas: false
const res5 = await em.findOne(Author, 1); // write connection - even for a read operation
const res6 = await em.findOne(Author, 1, { connectionType: 'read' }); // unless explicitly asking for a read replica
```
