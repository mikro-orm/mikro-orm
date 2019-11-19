---
---

# Metadata Providers

As part of entity discovery process, MikroORM uses so called `MetadataProvider` to get necessary
type information about your entities' properties. There are 3 built in metadata providers you can 
use:

> You can also implement custom metadata provider by extending abstract `MetadataProvider` class.

## TsMorphMetadataProvider

By default, MikroORM uses [`ts-morph`](https://github.com/dsherret/ts-morph) to read 
TypeScript source files of all entities to be able to detect all types. Thanks to this, 
defining the type is enough for runtime validation.

This process can be a bit slow as well as memory consuming, mainly because `ts-morph` will
scan all your source files based on your `tsconfig.json`. You can speed up this process by 
whitelisting only the folders where your entities are via `entitiesDirsTs` option. 

> You can specify the path to `tsconfig.json` manually via `discovery: { tsConfigPath: '...' }`.

After the discovery process ends, all [metadata will be cached](metadata-cache.md). By default, 
`FileCacheAdapter` will be used to store the cache inside `./temp` folder in JSON files. 

> You can generate production cache via CLI command `mikro-orm cache:generate`.

> You can implement custom cache adapter by implementing `CacheAdapter` interface.

## ReflectMetadataProvider

`ReflectMetadataProvider` uses `reflect-metadata` module to read the type from decorator 
metadata exported by TypeScript compiler. 

You will need to install `reflect-metadata` module and import at the top of your app's 
bootstrap script (e.g. `main.ts` or `app.ts`). 

```typescript
import 'reflect-metadata';
```

Next step is to enable `emitDecoratorMetadata` flag in your `tsconfig.json`.

> As this approach does not have performance impact, metadata caching is not really necessary. 

```typescript
await MikroORM.init({
  metadataProvider: ReflectMetadataProvider,
  cache: { enabled: false },
  // ...
});
```

### Limitations and requirements

#### Explicit types

Type inference is not supported, you need to always explicitly specify the type:

```typescript
@Property()
createdAt: Date = new Date();
```

#### Collection properties and Identified references

You need to provide target entity type in `@OneToMany` and `@ManyToMany` decorators:

```typescript
@OneToMany(() => Book, b => b.author)
books = new Collection<Book>(this);

@ManyToOne(() => Publisher, { wrappedReference: true })
publisher!: IdentifiedReference<Publisher>;
```

#### Optional properties

Reading property nullability is not supported, you need to explicitly set `nullable` attribute:

```typescript
@Property({ nullable: true })
prop?: string;
```

#### Enums

By default, enum is considered as numeric type. For string enums, you need to explicitly 
provide one of:

- reference to the enum (which will force you to define the enum before defining the entity)
  ```typescript
  @Enum(() => UserRole)
  role: UserRole;
  ```
- name of the enum (if it is present in the same file)
  ```typescript
  @Enum({ type: 'UserRole' })
  role: UserRole;
  ```
- list of the enum items
  ```typescript
  @Enum({ items: ['a', 'b', 'c'] })
  role: UserRole;
  ```

#### Circular dependencies

Reading type of referenced entity in `@ManyToOne` and `@OneToOne` properties fails if there is 
circular dependency. You will need to explicitly define the type in the decorator (preferably 
via `entity: () => ...` callback).

```typescript
@ManyToOne({ entity: () => Author })
author: Author;
``` 

> There can be recursion issues when you define multiple entities (with circular dependencies 
> between each other) in single file. In that case, you might want to provide the type via decorator's
> `type` or `entity` attributes and set the TS property type to something else (like `any` or `object`).

#### Additional typings might be required

You might have to install additional typings, one example is use of `ObjectId` in MongoDB, 
which requires `@types/mongodb` to be installed. 

## JavaScriptMetadataProvider

This provider should be used only if you are not using TypeScript at all and therefore you do 
not use decorators to annotate your properties. It will require you to specify the whole schema 
manually. 

```typescript
await MikroORM.init({
  metadataProvider: JavaScriptMetadataProvider,
  cache: { enabled: false },
  // ...
});
```

You can read more about it in [Usage with JavaScript section](usage-with-js.md).
