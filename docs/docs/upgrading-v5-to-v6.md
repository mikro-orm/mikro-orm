---
title: Upgrading from v5 to v6
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid for you, like if you do not use custom `NamingStrategy` implementation, you do not care about the interface being changed.

## Node 16+ required

Support for older node versions was dropped. 

## TypeScript 4.9+ required

Support for older TypeScript versions was dropped. 

## Removal of static require calls

There were some places where we did a static `require()` call, e.g. when loading the driver implementation based on the `type` option. Those places were problematic for bundlers like webpack, as well as new school build systems like vite.

### The `type` option is removed in favour of driver exports

Instead of specifying the `type` we now have several options:

1. use `defineConfig()` helper imported from the driver package to create your ORM config:
   ```ts title='mikro-orm.config.ts'
   import { defineConfig } from '@mikro-orm/mysql';
   
   export default defineConfig({ ... });
   ```
2. use `MikroORM.init()` on class imported from the driver package:
   ```ts title='app.ts'
   import { MikroORM } from '@mikro-orm/mysql';

   const orm = await MikroORM.init({ ... });
   ```
3. specify the `driver` option:
   ```ts title='mikro-orm.config.ts'
   import { MySqlDriver } from '@mikro-orm/mysql'; 

   export default {
     driver: MySqlDriver,
     ...
   };
   ```

> The `MIKRO_ORM_TYPE` is still supported, but no longer does a static require of the driver class. Its usage is rather discouraged and it might be removed in future versions too.

### ORM extensions

Similarly, we had to get rid of the `require()` calls for extensions like `Migrator`, `EntityGenerator` and `Seeder`. Those need to be registered as extensions in your ORM config. `SchemaGenerator` extension is registered automatically.

> This is required only for the shortcuts available on `MikroORM` object, e.g. `orm.migrator.up()`, alternatively you can instantiate the `Migrator` yourself explicitly.

```ts title='mikro-orm.config.ts'
import { defineConfig } from '@mikro-orm/mysql';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';

export default defineConfig({
  dbName: 'test',
  extensions: [Migrator, EntityGenerator, SeedManager], // those would have a static `register` method
});
```

## `MikroORM.init()` no longer accepts a `Configuration` instance

The options always needs to be plain JS object now. This was always only an internal way, partially useful in tests, never meant to be a user API (while many people since the infamous Ben Awad video mistakenly complicated their typings with it).

## `MikroORM.init()` no longer accepts second `connect` parameter

Use the `connect` option instead.

## All drivers now re-export the `@mikro-orm/core` package

This means we no longer have to think about what package to use for imports, the driver package should be always preferred.

```diff
-import { Entity, PrimaryKey } from '@mikro-orm/core';
-import { MikroORM, EntityManager } from '@mikro-orm/mysql';
+import { Entity, PrimaryKey, MikroORM, EntityManager } from '@mikro-orm/mysql';
```

## Removed `MongoDriver` methods

- `createCollections` in favour of `orm.schema.createSchema()`
- `dropCollections` in favour of `orm.schema.dropSchema()`
- `refreshCollections` in favour of `orm.schema.refreshDatabase()`
- `ensureIndexes` in favour of `orm.schema.ensureIndexes()`

## Removed `JavaScriptMetadataProvider`

Use `EntitySchema` instead, for easy migration there is `EntitySchema.fromMetadata()` factory, but the interface is very similar on its own.

## Removed `PropertyOptions.customType` in favour of just `type`

```diff
-@Property({ customType: new ArrayType() })
+@Property({ type: new ArrayType() })
foo: string[];
```

## Removal of deprecated methods

- `em.nativeInsert()` -> `em.insert()`
- `em.persistLater()` -> `em.persist()`
- `em.removeLater()` -> `em.remove()`
- `IdentifiedReference` -> `Ref`
- `uow.getOriginalEntityData()` without parameters
- `orm.schema.generate()`

## `BaseEntity` no longer has generic type arguments

Instead, the `this` type is used.

```diff
-class User extends BaseEntity<User> { ... }
+class User extends BaseEntity { ... }
```

## `wrap` helper no longer accepts `undefined` on type level

The runtime implementation still checks for this case and returns the argument, but on type level this will fail to compile. It was never correct to pass in nullable values inside as it were not allowed in the return type.

Note that if you used it for converting entity instance to reference wrapper, the new `ref()` helper does a better job at that (and accepts nullable values).

## Primary key inference

Some methods allowed you to pass in the primary key property via second generic type argument, this is now removed in favour of the automatic inference. To set the PK type explicitly, use the `PrimaryKeyProp` symbol.

`PrimaryKeyType` symbol has been removed, use `PrimaryKeyProp` instead if needed. Moreover, the value for composite PKs now has to be a tuple instead of a union to ensure we preserve the order of keys:

```diff
@Entity()
export class Foo {

  @ManyToOne(() => Bar, { primary: true })
  bar!: Bar;

  @ManyToOne(() => Baz, { primary: true })
  baz!: Baz;

-  [PrimaryKeyType]?: [number, number];
-  [PrimaryKeyProp]?: 'bar' | 'baz';
+  [PrimaryKeyProp]?: ['bar', 'baz'];

}
```

## Removed `BaseEntity.toJSON` method

The signature became more complex on type level which made it harder to override, and as this was the only method meant for overriding, it should provide better experience when there won't be any.

The method was only forwarding the call to `BaseEntity.toObject`, so use that in the code instead.

> The method is still present on the prototype as with any other entity, regardless of whether they extend from the `BaseEntity`.

## Renames

- `PropertyOptions.onUpdateIntegrity` -> `PropertyOptions.updateRule`
- `PropertyOptions.onDelete` -> `PropertyOptions.deleteRule`
- `EntityProperty.reference` -> `EntityProperty.kind`
- `ReferenceType` -> `ReferenceKind`
- `PropertyOptions.wrappedReference` -> `PropertyOptions.ref`
- `AssignOptions.mergeObjects` -> `AssignOptions.mergeObjectProperties`
- `EntityOptions.customRepository` -> `EntityOptions.repository`
- `Options.cache` -> `Options.metadataCache`

## Removed dependency on `faker` in seeder package

Faker is rather fat library that can result in perf degradation just by importing it, and since we were not working with the library anyhow, there is no reason to keep it in the dependencies. Users who want to use faker can just install it and use it directly, having the faker import under their own control.

```diff
-import { Factory, Faker } from '@mikro-orm/seeder';
+import { Factory } from '@mikro-orm/seeder';
+import { faker } from '@faker-js/faker/locale/en';

export class ProjectFactory extends Factory<Project> {

  model = Project;

-  definition(faker: Faker): Partial<Project> {
+  definition(): Partial<Project> {
    return {
      name: faker.company.name(),
    };
  }

}
```

## Removed `RequestContext.createAsync`

Use `RequestContext.create` instead, it can be awaited now.

```diff
-const ret = await RequestContext.createAsync(em, async () => { ... });
+const ret = await RequestContext.create(em, async () => { ... });
```

## Renamed `@UseRequestContext()`

The decorator was renamed to `@CreateRequestContext()` to make it clear it always creates new context, and a new `@EnsureRequestContext()` decorator was added that will reuse existing contexts if available. 

