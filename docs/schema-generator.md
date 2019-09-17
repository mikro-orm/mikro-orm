---
---

# Schema Generator

To generate schema from your entity metadata, you can use `SchemaGenerator` helper. 

You can use it via CLI: 

```shell script
npx mikro-orm schema:create --dump   # Dumps create schema SQL
npx mikro-orm schema:update --dump   # Dumps update schema SQL
npx mikro-orm schema:drop --dump     # Dumps drop schema SQL
```

> You can also use `--run` flag to fire all queries, but be careful as it might break your
> database. Be sure to always check the generated SQL first before executing. Do not use
> `--run` flag in production! 

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

  const dropDump = await generator.dropSchema();
  console.log(dropDump);

  const createDump = await generator.createSchema();
  console.log(createDump);

  const updateDump = await generator.updateSchema();
  console.log(updateDump);

  await orm.close(true);
})();
```

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```bash
$ ts-node create-schema
```

[&larr; Back to table of contents](index.md#table-of-contents)
