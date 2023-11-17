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
- `skipTables` to ignore some database tables (accepts array of table names)
- `skipColumns` to ignore some database tables columns (accepts an object, keys are table names with schema prefix if available, values are arrays of column names)
- `scalarTypeInDecorator` to include the `type` option in scalar property decorators. This information is discovered at runtime, but the process of discovery can be skipped by including this option in the decorator. If using `EntitySchema`, this type information is always included.
- `scalarPropertiesForRelations` to control how scalar column properties are generated for foreign key relations. Possible values: 
  - `'never'` - (default) Do not generate any scalar properties for columns covered by foreign key relations. This effectively forces the application to always provide the entire relation, or (if all columns in the relation are nullable) omit the entire relation.
  - `'always'` - Generate all scalar properties for all columns covered by foreign key relations. This enables the application to deal with code that disables foreign key checks.
  - `'smart'` - Only generate scalar properties for foreign key relations, where doing so is necessary to enable the management of rows where a composite foreign key is not enforced due to some columns being set to NULL. This enables the application to deal with all rows that could possibly be part of a table, even when foreign key checks are always enabled.

```ts
const dump = await orm.entityGenerator.generate({
  save: true,
  entitySchema: true,
  bidirectionalRelations: true,
  identifiedReferences: true,
  esmImport: true,
  baseDir: process.cwd() + '/my-entities',
  skipTables: ['book', 'author'],
  skipColumns: {
    'public.user': ['email', 'middle_name'],
  },
});

```

## Current limitations

- in mysql, tinyint columns will be defined as boolean properties
