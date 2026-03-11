---
title: Metadata Providers
---

As part of entity discovery process, MikroORM uses so called `MetadataProvider` to get necessary type information about your entities' properties.

> You can also implement custom metadata provider by extending abstract `MetadataProvider` class.

:::tip

For a comprehensive guide on using decorators with metadata providers, including the differences between legacy and ES spec decorators, see the [Using Decorators guide](./using-decorators.md).

:::

There are 3 built-in metadata providers you can use:

## TsMorphMetadataProvider

With `TsMorphMetadataProvider` MikroORM will use [`ts-morph`](https://github.com/dsherret/ts-morph) to read TypeScript source files of all entities to be able to detect all types. Thanks to this, defining the type is enough for runtime validation.

> Using `TsMorphMetadataProvider` has implications for deployment - see the [Deployment guide](./deployment.md) for details on deploying applications that use this provider.

To use it, first install the `@mikro-orm/reflection` package.

```ts
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

await MikroORM.init({
  metadataProvider: TsMorphMetadataProvider,
  // ...
});
```

If you use folder-based discovery, you should specify paths to the compiled entities via `entities` as well as paths to the TS source files of those entities via `entitiesTs`. When you run the ORM via `tsx` or similar, the latter will be used automatically, or if you explicitly pass `preferTs: true` in the config. Note that `preferTs: true` should not be part of production config.

> When running via `node`, `.d.ts` files are used to obtain the type, so you need to ship them in the production build. TS source files are not needed. Be sure to enable `compilerOptions.declaration` in your `tsconfig.json`.

After the discovery process ends, all [metadata will be cached](./metadata-cache.md). By default, `FileCacheAdapter` will be used to store the cache inside `./temp` folder in JSON files.

> You can generate production cache via CLI command `mikro-orm cache:generate`.

> You can implement custom cache adapter by implementing `CacheAdapter` interface.

## ReflectMetadataProvider

`ReflectMetadataProvider` uses `reflect-metadata` module to read the type from decorator metadata exported by TypeScript compiler.

:::note

In MikroORM v7, `ReflectMetadataProvider` is available in the `@mikro-orm/decorators/legacy` package along with the legacy decorator definitions. It only works with legacy decorators and the `emitDecoratorMetadata` TypeScript option - ES spec decorators do not support metadata reflection.

:::

You will need to install `reflect-metadata` module and import at the top of your app's bootstrap script (e.g. `main.ts` or `app.ts`).

```ts
import 'reflect-metadata';
```

Next step is to enable `emitDecoratorMetadata` and `experimentalDecorators` flags in your `tsconfig.json`.

> As this approach does not have performance impact, metadata caching is not really necessary.

```ts
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

await MikroORM.init({
  metadataProvider: ReflectMetadataProvider,
  // ...
});
```

### Limitations and requirements

While `TsMorphMetadataProvider` do not suffer from any of the following problems, it brings a performance penalty (that can be limited only to cases where you change your entity definition via metadata caching) and is in general not compatible with other compilers like webpack or babel. It also requires you to deploy `.d.ts` files alongside your compiled `.js` entities (more about this in the [deployment section](./deployment.md)).

#### Explicit types

> Since v6, the type is inferred automatically based on the runtime default value, as long as it is possible to instantiate the entity without passing any constructor arguments. As long as you keep your constructors aware of that, this limitation does not apply.

Type inference is not supported, you need to always explicitly specify the type:

```ts
@Property()
createdAt: Date = new Date();
```

#### Collection properties and Identified references

You need to provide target entity type in `@OneToMany` and `@ManyToMany` decorators:

```ts
@OneToMany(() => Book, b => b.author)
books = new Collection<Book>(this);

@ManyToOne(() => Publisher, { ref: true })
publisher!: Ref<Publisher>;
```

#### Optional properties

Reading property nullability is not supported, you need to explicitly set `nullable` attribute:

```ts
@Property({ nullable: true })
prop?: string;
```

#### Enums

By default, enum is considered as numeric type. For string enums, you need to explicitly provide one of:

- reference to the enum (which will force you to define the enum before defining the entity)
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

Reading type of the referenced entity in `@ManyToOne` and `@OneToOne` properties may fail if there is circular dependency. You will need to explicitly define the type in the decorator (preferably via `entity: () => Author` callback).

```ts
@ManyToOne({ entity: () => Author })
author: Author;
```

When defining multiple entities in a single file, circular dependencies between those entities can also cause issues on type level, namely when using `reflect-metadata` provider. To get around those, you can use the `Rel` wrapper, which effectively disables `reflect-metadata`.

```ts
@ManyToOne({ entity: () => Author })
author: Rel<Author>;
```

This is also handy in ESM projects, where this problem can arise even when each entity resides in its own file.

#### Additional typings might be required

You might have to install additional typings, one example is use of `ObjectId` in MongoDB, which requires `@types/mongodb` to be installed.

## Using defineEntity

Alternatively, you can use [`defineEntity`](./define-entity.md) instead, which is suitable for JavaScript only projects.

> If you want to have absolute control, you can also use `EntitySchema.fromMetadata()` factory method.

Read more about it in [Usage with JavaScript section](./usage-with-js.md).
