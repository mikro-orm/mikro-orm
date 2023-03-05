---
title: Metadata Providers
---

As part of entity discovery process, MikroORM uses so called `MetadataProvider` to get necessary type information about our entities' properties.

> We can also implement custom metadata provider by extending abstract `MetadataProvider` class.

There are 3 built-in metadata providers we can use:

## TsMorphMetadataProvider

With `TsMorphMetadataProvider` MikroORM will use [`ts-morph`](https://github.com/dsherret/ts-morph) to read TypeScript source files of all entities to be able to detect all types. Thanks to this, defining the type is enough for runtime validation.

To use it, first install the `@mikro-orm/reflection` package.

```ts
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  // ...
});
```

If we use folder-based discovery, we should specify paths to the compiled entities via `entities` as well as paths to the TS source files of those entities via `entitiesTs`. When we run the ORM via `ts-node`, the latter will be used automatically, or if we explicitly pass `tsNode: true` in the config. Note that `tsNode: true` should not be part of production config.

> When running via `node`, `.d.ts` files are used to obtain the type, so we need to ship them in the production build. TS source files are no longer needed (since v4). Be sure to enable `compilerOptions.declaration` in our `tsconfig.json`.

After the discovery process ends, all [metadata will be cached](metadata-cache.md). By default, `FileCacheAdapter` will be used to store the cache inside `./temp` folder in JSON files.

> We can generate production cache via CLI command `mikro-orm cache:generate`.

> We can implement custom cache adapter by implementing `CacheAdapter` interface.

## ReflectMetadataProvider

`ReflectMetadataProvider` uses `reflect-metadata` module to read the type from decorator metadata exported by TypeScript compiler.

We will need to install `reflect-metadata` module and import at the top of our app's bootstrap script (e.g. `main.ts` or `app.ts`).

```ts
import 'reflect-metadata';
```

Next step is to enable `emitDecoratorMetadata` flag in our `tsconfig.json`.

> As this approach does not have performance impact, metadata caching is not really necessary.

```ts
await MikroORM.init({
  metadataProvider: ReflectMetadataProvider,
  // ...
});
```

### Limitations and requirements

While `TsMorphMetadataProvider` do not suffer from any of the following problems, it brings a performance penalty (that can be limited only to cases where you change your entity definition via metadata caching) and is in general not compatible with other compilers like webpack or babel. It also requires you to deploy `.d.ts` files alongside your compiled `.js` entities (more about this in the [deployment section](deployment.md).

#### Explicit types

Type inference is not supported, we need to always explicitly specify the type:

```ts
@Property()
createdAt: Date = new Date();
```

#### Collection properties and Identified references

We need to provide target entity type in `@OneToMany` and `@ManyToMany` decorators:

```ts
@OneToMany(() => Book, b => b.author)
books = new Collection<Book>(this);

@ManyToOne(() => Publisher, { wrappedReference: true })
publisher!: IdentifiedReference<Publisher>;
```

#### Optional properties

Reading property nullability is not supported, we need to explicitly set `nullable` attribute:

```ts
@Property({ nullable: true })
prop?: string;
```

#### Enums

By default, enum is considered as numeric type. For string enums, we need to explicitly provide one of:

- reference to the enum (which will force us to define the enum before defining the entity)
  ```ts
  @Enum(() => UserRole)
  role: UserRole;
  ```
- name of the enum (if it is present in the same file)
  ```ts
  @Enum({ type: 'UserRole' })
  role: UserRole;
  ```
- list of the enum items
  ```ts
  @Enum({ items: ['a', 'b', 'c'] })
  role: UserRole;
  ```

#### Circular dependencies

Reading type of referenced entity in `@ManyToOne` and `@OneToOne` properties fails if there is circular dependency. We will need to explicitly define the type in the decorator (preferably via `entity: () => ...` callback).

```ts
@ManyToOne({ entity: () => Author })
author: Author;
```

> There can be recursion issues when we define multiple entities (with circular dependencies between each other) in single file. In that case, we might want to provide the type via decorator's `type` or `entity` attributes and set the TS property type to something else (like `any` or `object`).

#### Additional typings might be required

We might have to install additional typings, one example is use of `ObjectId` in MongoDB, which requires `@types/mongodb` to be installed.

## JavaScriptMetadataProvider

> `JavaScriptMetadataProvider` is deprecated, [use `EntitySchema` instead](entity-schema.md).

This provider should be used only if we are not using TypeScript at all and therefore we do not use decorators to annotate our properties. It will require us to specify the whole schema manually.

```ts
await MikroORM.init({
  metadataProvider: JavaScriptMetadataProvider,
  // ...
});
```

We can read more about it in [Usage with JavaScript section](usage-with-js.md).
