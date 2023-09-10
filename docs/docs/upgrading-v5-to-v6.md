---
title: Upgrading from v5 to v6
---

> Following sections describe (hopefully) all breaking changes, most of them might be not valid for you, like if you do not use custom `NamingStrategy` implementation, you do not care about the interface being changed.

## Node 18.12+ required

Support for older node versions was dropped. 

## ⚠️ TypeScript 5.0+ required

Support for older TypeScript versions was dropped. 

## Strict partial loading

The `Loaded` type is now improved to support the partial loading hints (`fields` option). When used, the returned type will only allow accessing selected properties. Primary keys are automatically selected.

```ts
// book is typed to `Selected<Book, 'author', 'title' | 'author.email'>`
const book = await em.findOneOrFail(Book, 1, { 
  fields: ['title', 'author.email'], 
  populate: ['author'],
});

const id = book.id; // ok, PK is selected automatically
const title = book.title; // ok, title is selected
const publisher = book.publisher; // fail, not selected
const author = book.author.id; // ok, PK is selected automatically
const email = book.author.email; // ok, selected
const name = book.author.name; // fail, not selected
```

## Removed methods from `EntityRepository`

Following methods are no longer available on the `EntityRepository` instance. 

- `persist`
- `persistAndFlush`
- `remove`
- `removeAndFlush`
- `flush`

They were confusing as they gave a false sense of working with a scoped context (e.g. only with a `User` type), while in fact, they were only shortcuts for the same methods of underlying `EntityManager`. You should work with the `EntityManager` directly instead of using a repository when it comes to entity persistence, repositories should be treated as an extension point for custom logic (e.g. wrapping query builder usage).

```diff
-userRepository.persist(user);
-await userRepository.flush();
+em.persist(user);
+await em.flush();
```

> Alternatively, you can use the `repository.getEntityManager()` method to access those methods directly on the `EntityManager`.

If you want to keep those methods on repository level, you can define custom base repository and use it globally:

```ts
import { EntityManager, EntityRepository, AnyEntity } from '@mikro-orm/mysql';

export class ExtendedEntityRepository<T extends object> extends EntityRepository<T> {

  persist(entity: AnyEntity | AnyEntity[]): EntityManager {
    return this.em.persist(entity);
  }

  async persistAndFlush(entity: AnyEntity | AnyEntity[]): Promise<void> {
    await this.em.persistAndFlush(entity);
  }

  remove(entity: AnyEntity): EntityManager {
    return this.em.remove(entity);
  }

  async removeAndFlush(entity: AnyEntity): Promise<void> {
    await this.em.removeAndFlush(entity);
  }

  async flush(): Promise<void> {
    return this.em.flush();
  }

}
```

And specify it in the ORM config:

```ts
MikroORM.init({
   entityRepository: () => ExtendedEntityRepository,
})
```

You might as well want to use the `EntityRepositoryType` symbol, possibly in a custom base entity.

## Removed `@Subscriber()` decorator

> Decorators generally work only if you import the file in your code, and as subscribers are often not imported anywhere in your app, the decorator often didn't work. In that case, people often left it there, but also added the subscriber to the ORM config, causing a duplication, as suddenly the decorator is executed and starts to work.

Use `subscribers` array in the ORM config, it now also accepts class reference, not just instances.

```ts
MikroORM.init({
   subscribers: [MySubscriber], // or `new MySubscriber()`
})
```

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

## Removed `em.raw()` and `qb.raw()`

Both removed in favour of new static `raw()` helper, which can be also used to do atomic updates via `flush`:

```ts
const ref = em.getReference(User, 1);
ref.age = raw(`age * 2`);
await em.flush();
console.log(ref.age); // real value is available after flush
```

Alternatively, you can use the new `sql` tagged template function:

```ts
ref.age = sql`age * 2`;
```

This works on query keys as well as parameters, and is required for any SQL fragments.

Read more about this in [Using raw SQL query fragments](./raw-queries.md) section.

## Removed `qb.ref()`

Removed in favour of `sql.ref()`.

## Changed default PostgreSQL `Date` mapping precision

Previously, all drivers defaulted the `Date` type mapping to a timestamp with 0 precision (so seconds). This is [discouraged in PostgreSQL](https://wiki.postgresql.org/wiki/Don't_Do_This#Don.27t_use_timestamp.280.29_or_timestamptz.280.29), and is no longer valid - the default mapping without the `length` property being explicitly set is now `timestamptz`, which stores microsecond precision, so equivalent to `timestampz(6)`.

To revert back to the v5 behavior, you can either set the `columnType: 'timestampz(0)'`, or use `length: 0`:

```ts
@Property({ length: 0 })
```

## Metadata CacheAdapter requires sync API

To allow working with cache inside `MikroORM.initSync`, the metadata cache now enforces sync API. You should usually depend on the file-based cache for the metadata, which now uses sync methods to work with the file system.

## Implicit serialization changes

Implicit serialization, so calling `toObject()` or `toJSON()` on the entity, as opposed to explicitly using the `serialize()` helper, now works entirely based on `populate` hints. This means that, unless you explicitly marked some entity as populated via `wrap(entity).populated()`, it will be part of the serialized form only if it was part of the `populate` hint:

```ts
// let's say both Author and Book entity has a m:1 relation to Publisher entity
// we only populate the publisher relation of the Book entity
const user = await em.findOneOrFail(Author, 1, {
  populate: ['books.publisher'],
});

const dto = wrap(user).toObject();
console.log(dto.publisher); // only the FK, e.g. `123`
console.log(dto.books[0].publisher); // populated, e.g. `{ id: 123, name: '...' }`
```

Moreover, the implicit serialization now respects the partial loading hints too. Previously, all loaded properties were serialized, partial loading worked only on the database query level. Since v6, we also prune the data on runtime. This means that unless the property is part of the partial loading hint (`fields` option), it won't be part of the DTO - only exception is the primary key, you can optionally hide it via `hidden: true` in the property options. Main difference here will be the foreign keys, those are often automatically selected as they are needed to build the entity graph, but will no longer be part of the DTO.

```ts
const user = await em.findOneOrFail(Author, 1, {
  fields: ['books.publisher.name'],
});

const dto = wrap(user).toObject();
// only the publisher's name will be available, previously there would be also `book.author`
// `{ id: 1, books: [{ id: 2, publisher: { id: 3, name: '...' } }] }`
```

**This also works for embeddables, including nesting and object mode.**

## Changes in `Date` property mapping 

Previously, mapping of datetime columns to JS `Date` objects was dependent on the driver, while SQLite didn't have this out of box support and required manual conversion on various places. All drivers now have disabled `Date` conversion and this is now handled explicitly, in the same way for all of them.

Moreover, the `date` type was previously seen as a `datetime`, while now only `Date` (with uppercase `D`) will be considered as `datetime`, while `date` is just a `date`.
