---
---

# Schema generator

To generate schema from your entity metadata, you can use `SchemaGenerator`
helper. You will need to create simple script where you initialize MikroORM
like this:

**`./create-schema.ts`**

```typescript
import { MikroORM, SchemaGenerator } from 'mikro-orm';

(async () => {
  const orm = await MikroORM.init({
    entities: [Author, Book, ...],
    dbName: 'your-db-name',
    // ...
  });
  const generator = new SchemaGenerator(orm.em.getDriver(), orm.getMetadata());
  const dump = generator.generate();
  console.log(dump);
  await orm.close(true);
})();
```

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```bash
$ ts-node create-schema
```
