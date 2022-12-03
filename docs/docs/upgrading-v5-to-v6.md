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

## Removed `MongoDriver` methods

- `createCollections` in favour of `orm.schema.createSchema()`
- `dropCollections` in favour of `orm.schema.dropSchema()`
- `refreshCollections` in favour of `orm.schema.refreshDatabase()`
- `ensureIndexes` in favour of `orm.schema.ensureIndexes()`
