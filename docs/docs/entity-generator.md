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
    },
    extensions: [EntityGenerator],
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
| `takeTables: (string \| RegExp)[]`                             | Consider some database tables. Accepts array of table names and `RegExp`s. If there is a foreign key reference to a non-taken table, the generated code will be as if that foreign key did not exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `skipTables: (string \| RegExp)[]`                             | Ignore some database tables. Accepts array of table names and `RegExp`s. If there is a foreign key reference to a skipped table, the generated code will be as if that foreign key did not exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `skipColumns`                                                  | Ignore some database tables columns. Accepts an object, where keys are table names with schema prefix if available, values are arrays of column names and `RegExp`s. If a skipped column is the target of a foreign key reference, the generated code will look as if that foreign key did not exist.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `save: boolean`                                                | Whether to save the generated entities as files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `path: string`                                                 | Folder to save the generated entities in, if saving is enabled. Defaults to a folder called `generated-entities` inside the `baseDir` of the main config.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `fileName: (className: string) => string`                      | Callback to override the entity file name. Defaults to the entity name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `bidirectionalRelations: boolean`                              | By default, the `EntityGenerator` generates only owning sides of relations (e.g. M:1). If set to true, generates also the inverse sides for them                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `identifiedReferences: boolean`                                | If set to `true`, generate M:1 and 1:1 relations as wrapped references. Also wraps any `lazy` properties.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `entitySchema: boolean`                                        | By default, generate entities using decorators. If `true`, generate the entities using `EntitySchema` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `esmImport: boolean`                                           | By default, import statements for entities without extensions are used. If set to `true`, uses ESM style import for imported entities, i.e. adds a `.js` suffix as extension.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `scalarTypeInDecorator: boolean`                               | If `true`, include the `type` option in scalar property decorators. This information is discovered at runtime, but the process of discovery can be skipped by including this option in the decorator. If using `EntitySchema`, this type information is always included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `scalarPropertiesForRelations: 'never' \| 'always' \| 'smart'` | <ul><li> `'never'` (default) - Do not generate any scalar properties for columns covered by foreign key relations. This effectively forces the application to always provide the entire relation, or (if all columns in the relation are nullable) omit the entire relation.</li><li> `'always'` - Generate all scalar properties for all columns covered by foreign key relations. This enables the application to deal with code that disables foreign key checks.</li><li> `'smart'` - Only generate scalar properties for foreign key relations, where doing so is necessary to enable the management of rows where a composite foreign key is not enforced due to some columns being set to NULL. This enables the application to deal with all rows that could possibly be part of a table, even when foreign key checks are always enabled.</li></ul> |
| `onlyPurePivotTables: boolean`                                 | By default, M:N relations are allowed to use pivot tables containing additional columns. If set to `true`, M:N relations will not be generated for such pivot tables.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `readOnlyPivotTables: boolean`                                 | By default, M:N relations are only generated if the collection would be writable, i.e. any additional columns need to be optional and have non-unique default values. If set to `true`, also generate M:N relations even if the collection would be read only (meaning the only way to write to it is by using the pivot entity directly). Such collections will include the `persist: false` option. This setting is effectively meaningless if `onlyPurePivotTables` is set to `true`.                                                                                                                                                                                                                                                                                                                                                                     |
| `customBaseEntityName: string`                                 | By default, entity classes do not extend a base class. If this option is set, a class with this name will be created, if it doesn't exist already, and any entity that does not inherit from another will be made to use this one. The class itself will also be set to contain a `[Config]` symbol with the currently running configuration.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `useCoreBaseEntity: boolean`                                   | By default, entity classes do not extend a base class. If this option is set to `true`, entity classes that do not extend another will be set to use the `BaseEntity` class in `@mikro-orm/core`. When combined with the `customBaseEntityName` option, effectively, only the generated base class will use the core's `BaseEntity` class.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `coreImportsPrefix: string`                                    | By default, imports from MikroORM's core are imported without aliases. This may cause problems with the generated code if you have tables or custom types that share the same names (e.g. a table called "entity"). If this option is specified, all core imports will be imported with an alias that starts with this prefix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
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
- Adding the `mapToPk` flag on certain relations.
- Adding the `orphanRemoval` flag on certain inverse relations.
- Adding the `cascade` option on certain relations.
- Tweaking the `type` and/or `runtimeType` of scalar fields to custom ones that perform extra (application level) validation.
- Adding Single Table Inheritance definitions.
- Adding `@Embedded` entities and references to them.
- Adding `virtual` entities.
- Adding properties with `formula`.

### Example: Adding flags

Here's an example that will make any column named "password" (regardless of what table is defined in) be lazy and hidden in its `onInitialMetadata` and in `onProcessedMetadata` will make all ManyToMany relations be hidden.

```ts
import { ReferenceKind, MikroORM } from '@mikro-orm/core';

const orm = await MikroORM.init({
  // ORM config
});

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

### Example: Adding @Embedded entities

Adding embedded (as well as virtual entities) via the hooks can be somewhat tricky. The metadata objects are internal, and thus fewer checks are in place on them, meaning any errors are likely to be cryptic.

Here's an example that defines a simple embeddable with just two properties and adds a reference to it that is otherwise known to be a JSON column.

```ts
import { ReferenceKind, MikroORM, EntityMetadata } from '@mikro-orm/core';

const orm = await MikroORM.init({
  // ORM config
});

await orm.entityGenerator.generate({
  onInitialMetadata: (metadata, platform) => {
    // Create the Embeddable meta data in the script, rather than in a file.
    const embeddableEntityMeta = new EntityMetadata({
      className: 'IdentitiesContainer',
      collection: platform.getConfig().getNamingStrategy().classToTableName('IdentitiesContainer'),
      embeddable: true,
    });
    embeddableEntityMeta.addProperty({
      name: 'github',
      type: 'string',
      runtimeType: 'string',
      nullable: true,
      fieldNames: ['github'],
      columnTypes: ['varchar(255)'],
    });
    embeddableEntityMeta.addProperty({
      name: 'local',
      type: 'integer',
      runtimeType: 'number',
      nullable: true,
      fieldNames: ['local'],
      columnTypes: ['int'],
    });
    metadata.push(embeddableEntityMeta);

    // Add a reference to the embeddable.
    // This works even if the script does not define the embeddable's meta data.
    // This example assumes there exists an "author" table with a JSON column called "identity".
    const identitiesPropOnAuthor = metadata.find(meta => meta.className === 'Author')!.properties.identity;
    identitiesPropOnAuthor.kind = ReferenceKind.EMBEDDED;
    identitiesPropOnAuthor.array = true;
    identitiesPropOnAuthor.object = true;
    identitiesPropOnAuthor.prefix = false;
    identitiesPropOnAuthor.type = 'IdentitiesContainer';
  },
});
```

An alternative approach that is perhaps less error-prone (at entity generation time; you would still get runtime validation errors if your definition is erroneous) is to define the embedded entities manually in a file that you then copy to the output folder. The generator's metadata hooks only need to add the references to these embedded entities. Such entities will be imported like any other regular entity.

Either way, you would end up with a file similar to

```ts title="./my-entities/IdentitiesContainer.ts"
import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class IdentitiesContainer {

  @Property()
  github!: string;

  @Property()
  local!: number;

}
```

and then in the reference, you will end up with something similar to

```ts title="./my-entities/Author.ts"
import { Embedded, Entity } from '@mikro-orm/core';
import { IdentitiesContainer } from './IdentitiesContainer';

@Entity()
export class Author {
    
  // ...

  @Embedded({ entity: () => IdentitiesContainer, array: true, object: true, prefix: false, nullable: true })
  identity?: IdentitiesContainer[];
  
  // ...

}
```

### Example: Defining custom types for scalar properties

The entity generator will try to look for type names (the value of the "type" property in the previous example) by string first, via the platform's `getMappedType()` method. If the type is found, the output is that string. If the result of this call is MikroORM's `UnknownType`, the identifier is assumed to be the name of a class extending MikroORM's `Type` class, and gets imported. See [Custom Types](./custom-types.md) for more details on defining such a class. Note that only a reference to the identifier is used (no "new" added), meaning you are always using a "stateless" type implementation.

So, you may register your custom types at the config (see ["Adjusting default type mapping" in "Configuration"](./configuration.md#adjusting-default-type-mapping)), in which case, you should define the same type override in both your entity generation script and your runtime configuration. Or you may not do that, and instead use the class names as type identifiers, in which case, you need to ensure the types are importable by the entity files. To achieve this, you may override the `fileName`, to conditionally adjust the path to where the type is, relative to your output folder. Or alternatively, you may place the type classes inside your output folder.

You may also change the `runtimeType` option of properties. If necessary, this type will be wrapped up in `IType` (see ["Mapping to objects and type-safety" in "Custom types"](./custom-types.md#mapping-to-objects-and-type-safety)) where the runtime type is taken from the property's `runtimeType` option, and the raw type is taken from the `runtimeType` of the first `customTypes`, or if that's not defined, the `type`'s `runtimeType`, or, in the case of unregistered types, from the `runtimeType` of the type inferred from the first value in `columnTypes`. Тhe serialized type will be taken from the `runtimeType` property of the `customType` option, or fallback to whatever was inferred for the raw type, and if necessary, that type will be included in the `IType` wrapper as well. If all of these types are the same, the `IType` wrapper will not be added around `runtimeType`.

If you modify the `runtimeType` of a primary key column, and also reference that same relation with `mapToPk` at the reference, then at the reference, you may need to add the `customTypes` array with overrides for each primary key column, in their declaration order. That way, the types between the referenced column and the reference will match.

The following example shows some of the more typical uses.

```ts
import { ReferenceKind, MikroORM, EntityMetadata, Type, JsonType } from '@mikro-orm/core';

class MetaAsJsonType extends JsonType {
  get runtimeType(): string {
    return 'MetaType';
  }
}

const orm = await MikroORM.init({
  discovery: {
      getMappedType: (type: string, platform: Platform) => {
          switch (type) {
              case 'metaAsJson':
                  return Type.getType(MetaAsJsonType);
              default:
                  return platform.getDefaultMappedType(type);
          }
      },
  },
  // ORM config
});

await orm.entityGenerator.generate({
    fileName: (name) => {
        switch (name) {
            case 'EmailType':
                return `../types/${name}`;
            case 'Email':
            case 'MetaType':
                return `../runtimeTypes/${name}`;
            case 'BookVersion':
            case 'AuthorVersion':
                return `../brandedTypes/${name}`;
            default:
                return name;
        }
    },
    onInitialMetadata: (metadata, platform) => {
        // Assume there exists a table "author" with VARCHAR(255) column named "email".
        // We want to hydrate the value into an object that can perform further actions on the email.
        const emailPropOnAuthor = metadata.find(meta => meta.className === 'Author')!.properties.email;
        // The "EmailType" is not registered in the config, so it will be imported.
        emailPropOnAuthor.type = 'EmailType';
        // The "Email" doesn't match what is inferred from DB, so it will be wrapped as IType<Email, string>.
        emailPropOnAuthor.runtimeType = 'Email';
        
        // Assume there exists a table "book" with JSON column named "meta".
        // Assume there is a check constraint that ensures it will be an object with a certain shape.
        // We want to enforce it being that same shape on TypeScript level.
        const metaPropOnBook = metadata.find(meta => meta.className === 'Book')!.properties.meta;
        // The "metaAsJson" type is registered as a name in the config, mapped to MetaAsJsonType.
        // Therefore, it will be outputted as the string "metaAsJson" (no import).
        metaPropOnBook.type = 'metaAsJson';
        // The runtimeType matches what we have defined in MetaAsJsonType's runtimeType.
        // The generator is able to look it up due to the registration. Because it matches, there will be no IType.
        // This means we force this shape during create, selects, and serialization.
        // The "MetaType" class itself will be imported.
        metaPropOnBook.runtimeType = 'MetaType';
        
        // Assume there's a "book" table with an "INT" column named "version".
        // Assume there's also an "author" table with an "INT" column named "version".
        // On application level, we want to make sure we don't accidentally mix these versions.
        // We shouldn't compare an author version with a book version, or assign a book version to an author version.
        // The actual underlying type and the things we can do with it should remain the same.
        // We don't want to register or import a new type due to the simplicity of the value.
        // We also don't need an IType wrapper, since we're not transforming the data from its raw form
        // during creation or serialization. We're just concerned with updates and comparrisons.
        // Opaque/branded types are the best means to address this.
        // Because we don't want to override the "type", we need to override "customTypes" instead.
        const versionPropOnBook = metadata.find(meta => meta.className === 'Book')!.properties.version;
        versionPropOnBook.runtimeType = 'BookVersion';
        versionPropOnBook.customTypes = [
          new class extends IntegerType {
            get runtimeType(): string {
              return 'BookVersion';
            }
          }
        ];
        const versionPropOnAuthor = metadata.find(meta => meta.className === 'Author')!.properties.version;
        versionPropOnAuthor.runtimeType = 'AuthorVersion';
        versionPropOnAuthor.customTypes = [
          new class extends IntegerType {
            get runtimeType(): string {
              return 'AuthorVersion';
            }
          }
        ];
    }
});
```

## Current limitations

- In MySQL, `TINYINT(1)` columns will be defined as boolean properties. There is no true `BOOLEAN` type in MySQL (the keyword is just an alias for `TINYINT(1)`).
- MongoDB is not supported.
