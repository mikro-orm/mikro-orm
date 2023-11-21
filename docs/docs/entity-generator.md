---
title: Entity Generator
---

To generate entities from existing database schema, you can use `EntityGenerator` helper.

Install it with

```sh
yarn add @mikro-orm/entity-generator
```

or

```sh
npm i -s @mikro-orm/entity-generator
```

> The version needs to be aligned with the `@mikro-orm/core` package and the database driver package.

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

The behaviour of the entity generator can be adjusted via `entityGenerator` section in the ORM config. Available options:

| Option                         | Type                             | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|--------------------------------|----------------------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bidirectionalRelations`       | `boolean`                        | `false`   | By default, the `EntityGenerator` generates only owning sides of relations (e.g. M:1). If set to true, generates also the inverse sides for them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `identifiedReferences`         | `boolean`                        | `false`   | If set to `true`, generate M:1 and 1:1 relations as wrapped references.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `entitySchema`                 | `boolean`                        | `false`   | By default, generate entities using decorators. If `true`, generate the entities using `EntitySchema` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `esmImport`                    | `boolean`                        | `false`   | By default, import statements for entities without extensions are used. If set to `true`, uses ESM style import for imported entities, i.e. adds a ".js" suffix as extension.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `scalarTypeInDecorator`        | `boolean`                        | `false`   | If `true`, include the `type` option in scalar property decorators. This information is discovered at runtime, but the process of discovery can be skipped by including this option in the decorator. If using `EntitySchema`, this type information is always included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `scalarPropertiesForRelations` | `'never' \| 'always' \| 'smart'` | `'never'` | <ul><li> `'never'` - Do not generate any scalar properties for columns covered by foreign key relations. This effectively forces the application to always provide the entire relation, or (if all columns in the relation are nullable) omit the entire relation.</li><li> `'always'` - Generate all scalar properties for all columns covered by foreign key relations. This enables the application to deal with code that disables foreign key checks.</li><li> `'smart'` - Only generate scalar properties for foreign key relations, where doing so is necessary to enable the management of rows where a composite foreign key is not enforced due to some columns being set to NULL. This enables the application to deal with all rows that could possibly be part of a table, even when foreign key checks are always enabled.</li></ul> |

The call to `generate()` accepts the following options:

| Option        | Type                               | Default                                              | Description                                                                                                                                                                                                                                                                             |
|---------------|------------------------------------|------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `schema`      | `string`                           | `this.config.get('dbName`)`                          | The target schema to generate entities for. Defaults to what the main config would use.                                                                                                                                                                                                 |
| `skipTables`  | `string[]`                         | `[]`                                                 | Ignore some database tables. Accepts array of table names. If there is a foreign key reference to a skipped table, the generated code will be as if that foreign key did not exist.                                                                                                     |
| `skipColumns` | `{[tableNames: string]: string[]}` | `{}`                                                 | Ignore some database tables columns. Accepts an object, where keys are table names with schema prefix if available, values are arrays of column names. If a skipped column is the target of a foreign key reference, the generated code will look as if that foreign key did not exist. |                 
| `save`        | `boolean`                          | `false`                                              | Whether to save the generated entities as files.                                                                                                                                                                                                                                        |
| `baseDir`     | `string`                           | `this.config.get('baseDir') + '/generated-entities'` | Folder to save the generated entities in, if saving is enabled. Defaults to a folder called `generated-entities` inside the `baseDir` of the main config.                                                                                                                               |

Example configuration and run:

```ts
orm.config.set('entityGenerator', {
    entitySchema: true,
    bidirectionalRelations: true,
    identifiedReferences: true,
    esmImport: true,
});
const dump = await orm.entityGenerator.generate({
  save: true,
  baseDir: process.cwd() + '/my-entities',
  skipTables: ['book', 'author'],
  skipColumns: {
    'public.user': ['email', 'middle_name'],
  },
});

```

## Current limitations

- In MySQL, `TINYINT(1)` columns will be defined as boolean properties. There is no true `BOOLEAN` type in MySQL (the keyword is just an alias for `TINYINT(1)`).
- MongoDB is not supported.
