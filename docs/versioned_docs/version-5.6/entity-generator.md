---
title: Entity Generator
---

To generate entities from existing database schema, you can use `EntityGenerator` helper.

You can use it via CLI:

> To work with the CLI, first install `@mikro-orm/cli` package locally. The version needs to be aligned with the `@mikro-orm/core` package.

```sh
npx mikro-orm generate-entities --dump  # Dumps all generated entities
npx mikro-orm generate-entities --save --path=./my-entities  # Saves entities into given directory
```

Or you can create simple script where you initialize MikroORM like this:

```ts title="./generate-entities.ts"
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

## Advanced configuration

By default, the `EntityGenerator` generates only owning sides of relations (e.g. M:1) and uses decorators for the entity definition. We can adjust its behaviour via `entityGenerator` section in the ORM config. Available options:

- `bidirectionalRelations` to generate also the inverse sides for them
- `identifiedReferences` to generate M:1 and 1:1 relations as wrapped references
- `entitySchema` to generate the entities using `EntitySchema` instead of decorators
- `esmImport` to use esm style import for imported entities e.x. when `esmImport=true`, generated entities include `import Author from './Author.js'`

## Current limitations

- in mysql, tinyint columns will be defined as boolean properties
