---
title: Entity Generator
---

To generate entities from existing database schema, you can use the `EntityGenerator` helper. It lives in its own package called `@mikro-orm/entity-generator`:

```bash npm2yarn
npm install @mikro-orm/entity-generator
```

> The version needs to be aligned with the `@mikro-orm/core` package and the database driver package.

To use it, you need to register the `EntityGenerator` extension in your ORM config:

```ts
import { defineConfig } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

export default defineConfig({
  dbName: 'test',
  extensions: [EntityGenerator],
});
```

Then you can use it either via CLI:

> To work with the CLI, first install `@mikro-orm/cli` package locally. The version needs to be aligned with the `@mikro-orm/core` package.

```sh
npx mikro-orm generate-entities --dump  # Dumps all generated entities
npx mikro-orm generate-entities --save --path=./my-entities  # Saves entities into given directory
```

Or you can create simple script where you initialize MikroORM like this:

```ts title="./generate-entities.ts"
import { MikroORM } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';

(async () => {
  const orm = await MikroORM.init({
    discovery: {
      // we need to disable validation for no entities
      warnWhenNoEntities: false,
      extensions: [EntityGenerator],
    },
    dbName: 'your-db-name',
    // ...
  });
  const dump = await orm.entityGenerator.generate({
    save: true,
    path: process.cwd() + '/my-entities',
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

The behaviour of the entity generator can be adjusted either via `entityGenerator` section in the ORM config, or with the `GenerateOptions` object (parameter of the `generate` method), which takes precedence over the global configuration.

Available options:

| Option                                                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|----------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `schema: string`                                               | The target schema to generate entities for. Defaults to what the main config would use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `skipTables: string[]`                                         | Ignore some database tables. Accepts array of table names. If there is a foreign key reference to a skipped table, the generated code will be as if that foreign key did not exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `skipColumns`                                                  | Ignore some database tables columns. Accepts an object, where keys are table names with schema prefix if available, values are arrays of column names. If a skipped column is the target of a foreign key reference, the generated code will look as if that foreign key did not exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `save: boolean`                                                | Whether to save the generated entities as files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `path: string`                                                 | Folder to save the generated entities in, if saving is enabled. Defaults to a folder called `generated-entities` inside the `baseDir` of the main config.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `fileName: (className: string) => string`                      | Callback to override the entity file name. Defaults to the entity name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `bidirectionalRelations: boolean`                              | By default, the `EntityGenerator` generates only owning sides of relations (e.g. M:1). If set to true, generates also the inverse sides for them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `identifiedReferences: boolean`                                | If set to `true`, generate M:1 and 1:1 relations as wrapped references.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `entitySchema: boolean`                                        | By default, generate entities using decorators. If `true`, generate the entities using `EntitySchema` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `esmImport: boolean`                                           | By default, import statements for entities without extensions are used. If set to `true`, uses ESM style import for imported entities, i.e. adds a `.js` suffix as extension.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scalarTypeInDecorator: boolean`                               | If `true`, include the `type` option in scalar property decorators. This information is discovered at runtime, but the process of discovery can be skipped by including this option in the decorator. If using `EntitySchema`, this type information is always included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `scalarPropertiesForRelations: 'never' \| 'always' \| 'smart'` | <ul><li> `'never'` (default) - Do not generate any scalar properties for columns covered by foreign key relations. This effectively forces the application to always provide the entire relation, or (if all columns in the relation are nullable) omit the entire relation.</li><li> `'always'` - Generate all scalar properties for all columns covered by foreign key relations. This enables the application to deal with code that disables foreign key checks.</li><li> `'smart'` - Only generate scalar properties for foreign key relations, where doing so is necessary to enable the management of rows where a composite foreign key is not enforced due to some columns being set to NULL. This enables the application to deal with all rows that could possibly be part of a table, even when foreign key checks are always enabled.</li></ul> |
| `onlyPurePivotTables: boolean`                                 | By default, M:N relations are allowed to use pivot tables containing additional columns. If set to `true`, M:N relations will not be generated for such pivot tables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `readOnlyPivotTables: boolean`                                 | By default, M:N relations are only generated if the collection would be writable, i.e. any additional columns need to be optional and have non-unique default values. If set to `true`, also generate M:N relations even if the collection would be read only (meaning the only way to write to it is by using the pivot entity directly). Such collections will include the `persist: false` option. This setting is effectively meaningless if `onlyPurePivotTables` is set to `true`.                                                                                                                                                                                                                                                                                                                                                                     |
| `customBaseEntityName: string`                                 | By default, entity classes do not extend a base class. If this option is set, a class with this name will be created, if it doesn't exist already, and any entity that does not inherit from another will be made to use this one. The class itself will also be set to contain a `[Config]` symbol with the currently running configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `useCoreBaseEntity: boolean`                                   | By default, entity classes do not extend a base class. If this option is set to `true`, entity classes that do not extend another will be set to use the `BaseEntity` class in `@mikro-orm/core`. When combined with the `customBaseEntityName` option, effectively, only the generated base class will use the core's `BaseEntity` class.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `onInitialMetadata: MetadataProcessor`                         | A function can be provided to do processing of the initially collected metadata collection. Triggered after checking for tables and columns affected by skipping, but before base class generation, ManyToMany relation detection, and bi-directional relation detections. This hook is the appropriate place to add virtual and embeddable entities, and any owning sides of OneToOne or ManyToOne references. The generator can then figure out the inverse side and/or if any ManyToMany relations are affected. The function may return a promise, in which case, the promise will be awaited before moving on.                                                                                                                                                                                                                                          |
| `onProcessedMetadata: MetadataProcessor`                       | A function can be provided to do processing of the final metadata collection. Triggered after base class generation, ManyToMany relation detection, and bi-directional relation detection, just before outputting the metadata into files. This is the appropriate place for changes that need to be universally applied, including to ManyToMany and inverse side relation properties. The function may return a promise, in which case, the promise will be awaited before moving on.                                                                                                                                                                                                                                                                                                                                                                      |

Example configuration:

```ts
const dump = await orm.entityGenerator.generate({
  entitySchema: true,
  bidirectionalRelations: true,
  identifiedReferences: true,
  esmImport: true,
  save: true,
  path: process.cwd() + '/my-entities',
  skipTables: ['book', 'author'],
  skipColumns: {
    'public.user': ['email', 'middle_name'],
  },
});

```

## Processing of generated metadata

There are several features that are impossible to infer from the database schema alone.

The configuration settings `onInitialMetadata` and `onProcessedMetadata` can be used to add that information to the generated metadata, before the metadata is ultimately saved as a file. Note that this is different from the `onMetadata` hook in the configuration. The `onMetadata` hook does not affect the entity files, but those in the generator options do.

Some of the things that are suitable for these hooks include

- Adding the `hidden` flag on certain columns and relations.
- Adding the `lazy` flag on certain columns.
- Adding the `eager` flag on certain relations.
- Adding the `orphanRemoval` flag on certain inverse relations.
- Adding the `cascade` option on certain relations.
- Tweaking the `type` of JSON columns to a specific (inline defined) shape.
- Adding Single Table Inheritance definitions.
- Adding `@Embedded` entities and references to them.
- Adding `virtual` entities.

Here's an example that will make any column named "password" (regardless of what table is defined in) be lazy and hidden in its `onInitialMetadata` and in `onProcessedMetadata` will make all ManyToMany relations be hidden.

```ts
import { ReferenceKind } from '@mikro-orm/core';

await orm.entityGenerator.generate({
  onInitialMetadata: (metadata, platform) => {
    metadata.forEach(meta => {
      meta.props.forEach(prop => {
        if (prop.name === 'password') {
          prop.hidden = true;
          prop.lazy = true;
        }
      });
    });
  },
  onProcessedMetadata: (metadata, platform) => {
    metadata.forEach(meta => {
      meta.props.forEach(prop => {
        if (prop.kind === ReferenceKind.MANY_TO_MANY) {
          prop.hidden = true;
        }
      });
    });
  },
});
```

Adding embedded and virtual entities via the hooks can be somewhat tricky. The metadata objects are internal, and thus fewer checks are in place on them.

Here's an example that defines a simple embeddable with just two properties and adds a reference to it that is otherwise known to be a JSON column.

```ts
import { ReferenceKind } from '@mikro-orm/core';

await orm.entityGenerator.generate({
  onInitialMetadata: (metadata, platform) => {
    const embeddableEntityMeta = new EntityMetadata({
      className: 'IdentitiesContainer',
      collection: platform.getConfig().getNamingStrategy().classToTableName('IdentitiesContainer'),
      embeddable: true,
    });
    embeddableEntityMeta.addProperty({
      name: 'github',
      type: 'string',
      nullable: true,
      fieldNames: ['github'],
      columnTypes: ['varchar(255)'],
    });
    embeddableEntityMeta.addProperty({
      name: 'local',
      type: 'number',
      nullable: true,
      fieldNames: ['local'],
      columnTypes: ['int'],
    });
    metadata.push(embeddableEntityMeta);

    const identitiesPropOnAuthor = metadata.find(meta => meta.className === 'Author')!.properties.identities;
    identitiesPropOnAuthor.kind = ReferenceKind.EMBEDDED;
    identitiesPropOnAuthor.object = true;
    identitiesPropOnAuthor.type = 'IdentitiesContainer';
  },
});
```

An alternative approach is to define the embedded entities manually. The generator's metadata hooks only need to add the references to these embedded entities.

## Current limitations

- In MySQL, `TINYINT(1)` columns will be defined as boolean properties. There is no true `BOOLEAN` type in MySQL (the keyword is just an alias for `TINYINT(1)`).
- MongoDB is not supported.
