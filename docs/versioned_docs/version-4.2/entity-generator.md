---
title: Entity Generator
---

To generate entities from existing database schema, you can use `EntityGenerator` helper. 

You can use it via CLI: 

```sh
npx mikro-orm generate-entities --dump  # Dumps all generated entities
npx mikro-orm generate-entities --save --path=./my-entities  # Saves entities into given directory
```

Or you can create simple script where you initialize MikroORM like this:

```typescript title="./generate-entities.ts"
import { MikroORM } from '@mikro-orm/core';

(async () => {
  const orm = await MikroORM.init({
    discovery: {
      // we need to disable validation for no entities 
      warnWhenNoEntities: false,
    },
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

```sh
$ ts-node generate-entities
```

## Current limitations

- many to many relations are not supported, pivot table will be represented as separate entity
- in mysql, tinyint columns will be defined as boolean properties
