---
title: EntityHelper and Decorated Entities
sidebar_label: Updating Entity Values
---

## Updating Entity Values with `assign()`

When you want to update entity based on user input, you will usually have just plain string IDs of entity relations as user input. Normally you would need to use `em.getReference()` to create references from each id first, and then use those references to update entity relations:

```ts
const jon = new Author('Jon Snow', 'snow@wall.st');
const book = new Book('Book', jon);
book.author = em.getReference(Author, '...id...');
```

Same result can be easily achieved with `assign()`:

```ts
import { wrap } from '@mikro-orm/core';

wrap(book).assign({
  title: 'Better Book 1',
  author: '...id...',
});
console.log(book.title); // 'Better Book 1'
console.log(book.author); // instance of Author with id: '...id...'
console.log(book.author.id); // '...id...'
```

To use `assign()` on not managed entities, you need to provide `EntityManager` instance explicitly:

```ts
import { wrap } from '@mikro-orm/core';

const book = new Book();
wrap(book).assign({
  title: 'Better Book 1',
  author: '...id...',
}, { em });
```

By default, `entity.assign(data)` behaves similar to `Object.assign(entity, data)`, e.g. it does not merge things recursively. To enable deep merging of object properties (not referenced entities), use second parameter to enable `mergeObjectProperties` flag:

```ts
import { wrap } from '@mikro-orm/core';

book.meta = { foo: 1, bar: 2 };

wrap(book).assign({ meta: { foo: 3 } }, { mergeObjectProperties: true });
console.log(book.meta); // { foo: 3, bar: 2 }

wrap(book).assign({ meta: { foo: 4 } });
console.log(book.meta); // { foo: 4 }
```

One exception to this rule is assigning to embedded properties. Those are by default merged with the data recursively. You can opt out of that via `mergeEmbeddedProperties` flag (which defaults to `true`).

### Updating deep entity graph

Since v5, `assign` allows updating deep entity graph by default. To update existing entity, you need to provide its primary key in the `data`, as well as **load that entity first into current context**.

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// update existing book's author's name
wrap(book).assign({
  author: {
    id: book.author.id,
    name: 'New name...',
  },
});
```

If you want to always update the entity, even without the entity PK being present in `data`, you can use `updateByPrimaryKey: false`:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// update existing book's author's name
wrap(book).assign({
  author: {
    name: 'New name...',
  },
}, { updateByPrimaryKey: false });
```

Otherwise, the entity data without PK are considered as new entity, and will trigger an `INSERT` query:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// creating new author for given book
wrap(book).assign({
  author: {
    name: 'New name...',
  },
});
```

Same applies to the case when you do not load the child entity first into the context, e.g. when you try to assign to a relation that was not populated. Even if you provide its primary key, it will be considered as a new object and trigger an `INSERT` query.

```ts
const book = await em.findOneOrFail(Book, 1); // author is not populated

// creating new author for given book
wrap(book).assign({
  author: {
    id: book.author.id,
    name: 'New name...',
  },
});
```

When updating collections, you can either pass a complete array of all items, or just a single item - in such a case, the new item will be appended to the existing items. Passing a completely new array of items will replace the existing items. Previously existing items will be disconnected/removed from the collection. Also check the [Collection page](./collections.md#removing-items-from-collection) on the effects of removing entities from collections.

```ts
// resets the addresses collection to a single item
wrap(user).assign({ addresses: [new Address(...)] });

// adds new address to the collection
wrap(user).assign({ addresses: new Address(...) });
```

### Using class-based data

When assigning to relation properties, it is important to use only plain JavaScript objects (POJO). You can extend the `PlainObject` class provided by the `@mikro-orm/core` package to let the ORM know some class should be considered as POJO.

This is handy if you want to use packages like `class-transformer` for validation of the DTO.

```ts
import { PlainObject } from '@mikro-orm/core';

class UpdateAuthorDTO extends PlainObject {

  @IsString()
  @IsNotEmpty()
  name!: string;

  @ValidateNested()
  @Type(() => UpdateBookDto)
  books!: UpdateBookDto[];

}

// dto is an instance of UpdateAuthorDto
em.assign(user, dto);
```

### `assign` options

You can configure how the `assign` helper works via the following options (passed in the second argument):

#### `updateNestedEntities`

Allows disabling processing of nested relations. When disabled, an object payload in place of a relation always results in an `INSERT` query. To assign a value of the relation, use the foreign key instead of an object. Defaults to `true`.

#### `updateByPrimaryKey`

When assigning to a relation property with object payload and `updateNestedEntities` enabled (default), you can control how a payload without a primary key is handled. By default, it is considered as a new object, resulting in an `INSERT` query. Use `updateByPrimaryKey: false` to allow assigning the data on an existing relation instead. Defaults to `true`.

#### `ignoreUndefined`

With `ignoreUndefined` enabled, `undefined` properties passed in the payload are skipped. Defaults to `false`.

#### `onlyProperties`

When you have some properties in the payload that are not represented by an entity property mapping, you can skip such unknown properties via `onlyProperties: true`. Defaults to `false`.

#### `onlyOwnProperties`

With `onlyOwnProperties` enabled, inverse sides of to-many relations are skipped, and payloads of other relations are converted to foreign keys. Defaults to `false`.

#### `convertCustomTypes`

`assign` excepts runtime values for properties using custom types. To be able to assign raw database values, you can enable the `convertCustomTypes` option. Defaults to `false`.

#### `mergeObjectProperties`

When assigning to a JSON property, the value is replaced. Use `mergeObjectProperties: true` to enable deep merging of the payload with the existing value. Defaults to `false`.

#### `mergeEmbeddedProperties`

When assigning to an embedded property, the values are deeply merged with the existing data. Use `mergeEmbeddedProperties: false` to replace them instead. Defaults to `true`.

#### `merge`

When assigning to a relation property, if the value is a POJO and `updateByPrimaryKey` is enabled, we check if the target exists in the identity map based on its primary key and call `assign` on it recursively. If there is no primary key provided, or the entity is not present in the context, such an entity is considered as new (resulting in `INSERT` query), created via `em.create()`. You can use `merge: true` to use `em.merge()` instead, which means there won't be any query used for persisting the relation. Defaults to `false`.

#### `schema`

When assigning to a to-many relation properties (`Collection`) with `updateNestedEntities` and `updateByPrimaryKey` enabled (default), you can use this option to override the relation schema. This is used only when trying to find the entity reference in the current context. If it is not found, we create the relation entity using the target entity schema. The value is automatically inferred from the target entity.

#### `em`

When using the static `assign()` helper, you can pass the EntityManager instance explicitly via the `em` option. This is only needed when you try to assign a relation property. The value is automatically inferred from the target entity when it is managed, or when you use `em.assign()` instead.

### Global configuration

Since v6.2, all of the `assign` options can be configured globally too:

```ts
await MikroORM.init({
  // default values:
  assign: {
    updateNestedEntities: true,
    updateByPrimaryKey: true,
    mergeObjectProperties: false,
    mergeEmbeddedProperties: true,
  },
});
```

## `WrappedEntity` and `wrap()` helper

`IWrappedEntity` is an interface that defines public helper methods provided by the ORM:

```ts
interface IWrappedEntity<Entity> {
  isInitialized(): boolean;
  isTouched(): boolean;
  isManaged(): boolean;
  populated(populated?: boolean): void;
  populate<Hint extends string = never>(
    populate: AutoPath<Entity, Hint>[] | boolean,
    options?: EntityLoaderOptions<Entity, Hint>,
  ): Promise<Loaded<Entity, Hint>>;
  init<Hint extends string = never>(
    populated?: boolean,
    populate?: Populate<Entity, Hint>,
    lockMode?: LockMode,
    connectionType?: ConnectionType,
  ): Promise<Loaded<Entity, Hint>>;
  toReference(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  toObject(): EntityDTO<Entity>;
  toObject(ignoreFields: never[]): EntityDTO<Entity>;
  toObject<Ignored extends EntityKey<Entity>>(ignoreFields: Ignored[]): Omit<EntityDTO<Entity>, Ignored>;
  toJSON(...args: any[]): EntityDTO<Entity>;
  toPOJO(): EntityDTO<Entity>;
  serialize<
    Hint extends string = never,
    Exclude extends string = never,
  >(options?: SerializeOptions<Entity, Hint, Exclude>): EntityDTO<Loaded<Entity, Hint>>;
  assign<
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Data extends EntityData<Naked> | Partial<EntityDTO<Naked>> = EntityData<Naked> | Partial<EntityDTO<Naked>>,
  >(data: Data & IsSubset<EntityData<Naked>, Data>, options?: AssignOptions): MergeSelected<Entity, Naked, keyof Data & string>;
  getSchema(): string | undefined;
  setSchema(schema?: string): void;
}
```

There are two ways to access those methods. You can either extend `BaseEntity` (exported from `@mikro-orm/core`), that defines those methods, or use the `wrap()` helper to access `WrappedEntity` instance, where those methods exist.

Users can choose whether they are fine with polluting the entity interface with those additional methods, or they want to keep the interface clean and use the `wrap(entity)` helper method instead to access them.

> Since v4, `wrap(entity)` no longer returns the entity, now the `WrappedEntity` instance is being returned. It contains only public methods (`init`, `assign`, `isInitialized`, ...), if you want to access internal properties like `__meta` or `__em`, you need to explicitly ask for the helper via `wrap(entity, true)`.

```ts
import { BaseEntity } from '@mikro-orm/core';

@Entity()
export class Book extends BaseEntity { ... }
```

Then you can work with those methods directly:

```ts
book.meta = { foo: 1, bar: 2 };
book.assign({ meta: { foo: 3 } }, { mergeObjectProperties: true });
console.log(book.meta); // { foo: 3, bar: 2 }
```

### Accessing internal prefixed properties

Previously it was possible to access internal properties like `__meta` or `__em` from the `wrap()` helper. Now to access them, you need to use second parameter of wrap:

```ts
@Entity()
export class Author { ... }

console.log(wrap(author, true).__meta);
```
