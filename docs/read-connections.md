---
---

# Read Replica Connections

Users can specify multiple read connections via `replicas` option. You can provide only fields 
that differ from master connection, rest will be taken from it.

```typescript
const orm = await MikroORM.init({
  entities: [Author, ...],
  dbName: `my_database`,
  type: 'mysql',
  user: 'master_user',
  host: 'master_host',
  replicas: [
    { name: 'read-1', host: 'read_host_1', user: 'read_user' },
    { name: 'read-2', host: 'read_host_2' }, // user omitted, will be taken from master connection
  ],
});
```

By default select queries will use random read connection if not inside transaction. You can 
specify connection type manually in `em.getConnection(type: 'read' | 'write')`.

```typescript
const connection = orm.em.getConnection<MySqlConnection>(); // write connection
const readConnection = orm.em.getConnection<MySqlConnection>('read'); // random read connection

const qb1 = orm.em.createQueryBuilder(Author);
const res1 = await qb1.select('*').execute(); // random read connection

const qb2 = orm.em.createQueryBuilder(Author, 'a', 'write');
const res2 = await qb2.select('*').execute(); // write connection

const qb3 = orm.em.createQueryBuilder(Author);
const res3 = await qb3.update(...).where(...).execute(); // write connection

// all queries inside a transaction will use write connection
await orm.em.transactional(async em => {
  const a = await em.findOne(Author, 1); // write connection
  a.name = 'test'; // will trigger update on write connection once flushed
});
```

[&larr; Back to table of contents](index.md#table-of-contents)
