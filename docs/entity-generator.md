---
---

# Entity Generator

To generate entities from existing database schema, you can use `EntityGenerator` helper. 

You can use it via CLI: 

```shell script
npx mikro-orm generate-entities --dump  # Dumps all generated entities
npx mikro-orm generate-entities --save --path=./my-entities  # Saves entities into given directory
```

Or you can create simple script where you initialize MikroORM like this:

**`./generate-entities.ts`**

```typescript
import { MikroORM } from 'mikro-orm';

(async () => {
  const orm = await MikroORM.init({
    dbName: 'your-db-name',
    // ...
  });
  const generator = orm.getEntityGenerator();
  const dump = await generator.generate({ 
    save: true,
    baseDir: process.cwd() + '/my-entities',
  });
  console.log(dump);
  await orm.close(true);
})();
```

Then run this script via `ts-node` (or compile it to plain JS and use `node`):

```bash
$ ts-node generate-entities
```

[&larr; Back to table of contents](index.md#table-of-contents)
