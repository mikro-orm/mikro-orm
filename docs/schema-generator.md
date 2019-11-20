---
---

# Schema Generator

To generate schema from your entity metadata, you can use `SchemaGenerator` helper. 

You can use it via CLI: 

```sh
npx mikro-orm schema:create --dump   # Dumps create schema SQL
npx mikro-orm schema:update --dump   # Dumps update schema SQL
npx mikro-orm schema:drop --dump     # Dumps drop schema SQL
```

> You can also use `--run` flag to fire all queries, but be careful as it might break your
> database. Be sure to always check the generated SQL first before executing. Do not use
> `--run` flag in production! 

`schema:create` will automatically create the database if it does not exist. 

`schema:drop` will by default drop all database tables. You can use `--drop-db` flag to drop
the whole database instead. 

Or you can create simple script where you initialize MikroORM like this:

**`./create-schema.ts`**

```typescript
import { MikroORM } from 'mikro-orm';

(async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book, ...],
    dbName: 'your-db-name',
    // ...
  });
  const generator = orm.getSchemaGenerator();

  const dropDump = await generator.getDropSchemaSQL();
  console.log(dropDump);

  const createDump = await generator.getCreateSchemaSQL();
  console.log(createDump);

  const updateDump = await generator.getUpdateSchemaSQL();
  console.log(updateDump);

  // there is also `generate()` method that returns drop + create queries
  const dropAndCreateDump = await generator.generate();
  console.log(dropAndCreateDump);

  // or you can run those queries directly, but be sure to check them first!
  await generator.dropSchema();
  await generator.createSchema();
  await generator.updateSchema();

  await orm.close(true);
})();
```

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```sh
$ ts-node create-schema
```

[&larr; Back to table of contents](index.md#table-of-contents)
