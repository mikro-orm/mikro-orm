---
title: Serializing
---

By default, the ORM will define a `toJSON` method on all of your entity prototypes during discovery. This means that when you try to serialize your entity via `JSON.stringify()`, the ORM serialization will kick in automatically. The default implementation uses `EntityTransformer.toObject()` method, which converts an entity instance into a POJO. During this process, ORM specific constructs like the `Reference` or `Collection` wrappers are converted to their underlying values.

## Hidden Properties

If you want to omit some properties from serialized result, you can mark them with `hidden` flag on `@Property()` decorator. To have this information available on the type level, you also need to use the `HiddenProps` symbol:

```ts
@Entity()
class Book {

  // we use the `HiddenProps` symbol to define hidden properties on type level
  [HiddenProps]?: 'hiddenField' | 'otherHiddenField';

  @Property({ hidden: true })
  hiddenField = Date.now();

  @Property({ hidden: true, nullable: true })
  otherHiddenField?: string;

}

const book = new Book(...);
console.log(wrap(book).toObject().hiddenField); // undefined

// @ts-expect-error accessing `hiddenField` will fail to compile thanks to the `HiddenProps` symbol
console.log(wrap(book).toJSON().hiddenField); // undefined
```

Alternatively, you can use the `Hidden` type for **primitive property types** (`string`, `number`, `boolean`, `bigint`, `symbol`). It works the same as the `Opt` type (an alternative for `OptionalProps` symbol), and can be used in two ways:

- with generics: `hiddenField?: Hidden<string>;`
- with intersections: `hiddenField?: string & Hidden;`

Both will work the same, and can be combined with the `HiddenProps` symbol approach.

```ts
@Entity()
class Book {

  @Property({ hidden: true })
  hiddenField: Hidden<number> = Date.now();

  @Property({ hidden: true, nullable: true })
  otherHiddenField?: string & Hidden;

}
```

> **Note:** The `Hidden` type brand only works for primitive types. For object-type properties like `Date`, `Record<string, unknown>`, or JSON properties, you must use the `HiddenProps` symbol approach instead:
>
> ```ts
> @Entity()
> class User {
>
>   [HiddenProps]?: 'secretData' | 'hiddenDate';
>
>   @Property({ type: JsonType, hidden: true })
>   secretData!: Record<string, unknown>;
>
>   @Property({ hidden: true })
>   hiddenDate!: Date;
>
> }
> ```

## Shadow Properties

The opposite situation where you want to define a property that lives only in memory (is not persisted into database) can be solved by defining your property as `persist: false`. Such property can be assigned via one of `Entity.assign()`, `em.create()` and `em.merge()`. It will be also part of serialized result.

This can be handled when dealing with additional values selected via `QueryBuilder` or MongoDB's aggregations.

```ts
@Entity()
class Book {

  @Property({ persist: false })
  count?: number;

}

const book = new Book(...);
wrap(book).assign({ count: 123 });
console.log(wrap(book).toObject().count); // 123
console.log(wrap(book).toJSON().count); // 123
```

## Property Serializers

As an alternative to custom `toJSON()` method, we can also use property serializers. They allow to specify a callback that will be used when serializing a property:

```ts
@Entity()
class Book {

  @ManyToOne({ serializer: value => value.name, serializedName: 'authorName' })
  author: Author;

}

const author = new Author('God')
const book = new Book(author);
console.log(wrap(book).toJSON().authorName); // 'God'
```

## Implicit serialization

Implicit serialization means calling `toObject()` or `toJSON()` on the entity, as opposed to explicitly using the `serialize()` helper. Since v6, it works entirely based on `populate` hints. This means that, unless you explicitly marked some entity as populated via `wrap(entity).populated()`, it will be part of the serialized form only if it was part of the `populate` hint:

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

Moreover, the implicit serialization now respects the partial loading hints too. Previously, all loaded properties were serialized, partial loading worked only on the database query level. Since v6, we also prune the data on runtime. This means that unless the property is part of the partial loading hint (`fields` option), it won't be part of the DTO. Main difference here is the primary and foreign keys, that are often automatically selected as they are needed to build the entity graph, but will no longer be part of the DTO.

```ts
const user = await em.findOneOrFail(Author, 1, {
  fields: ['books.publisher.name'],
});

const dto = wrap(user).toObject();
// only the publisher's name will be available + primary keys
// `{ id: 1, books: [{ id: 2, publisher: { id: 3, name: '...' } }] }`
```

**This also works for embeddables, including nesting and object mode.**

Primary keys are automatically included. If you want to hide them, you have two options:

- use `hidden: true` in the property options
- use `serialization: { includePrimaryKeys: false }` in the ORM config

### Foreign keys and `forceObject`

Unpopulated relations are serialized as foreign key values, e.g. `{ author: 1 }`, if you want to enforce objects, e.g. `{ author: { id: 1 } }`, use `serialization: { forceObject: true }` in your ORM config.

For strict typings to respect the global config option, you need to define it on your entity class via `Config` symbol:

```ts
import { Config, Entity, ManyToOne, PrimaryKey, Ref, wrap } from '@mikro-orm/core';

@Entity()
class Book {

  [Config]?: DefineConfig<{ forceObject: true }>;

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, { ref: true })
  author!: Ref<User>;

}

const book = await em.findOneOrFail(Book, 1);
const dto = wrap(book).toObject();
const identityId = dto.author.id; // without the Config symbol, `dto.identity` would resolve to number
```

## Explicit serialization

The serialization process is normally driven by the `populate` hints. If you want to take control over this, you can use the `serialize()` helper:

```ts
import { serialize } from '@mikro-orm/core';

const dtos = serialize([user1, user2]);
// [
//   { name: '...', books: [1, 2, 3], identity: 123 },
//   { name: '...', ... },
// ]

const [dto] = serialize(user1); // always returns an array
// { name: '...', books: [1, 2, 3], identity: 123 }

// for a single entity instance we can as well use `wrap(e).serialize()`
const dto2 = wrap(user1).serialize();
// { name: '...', books: [1, 2, 3], identity: 123 }
```

By default, every relation is considered as not populated - this will result in the foreign key values to be present. Loaded collections will be represented as arrays of the foreign keys. To control the shape of the serialized response we can use the second `options` parameter:

```ts
interface SerializeOptions<T extends object, P extends string = never, E extends string = never> {
  /** Specify which relation should be serialized as populated and which as a FK. */
  populate?: AutoPath<T, P>[] | boolean;

  /** Specify which properties should be omitted. */
  exclude?: AutoPath<T, E>[];

  /** Enforce unpopulated references to be returned as objects, e.g. `{ author: { id: 1 } }` instead of `{ author: 1 }`. */
  forceObject?: boolean;

  /** Ignore custom property serializers. */
  ignoreSerializers?: boolean;

  /** Include properties marked as `hidden`. */
  includeHidden?: boolean;

  /** Skip properties with `null` value. */
  skipNull?: boolean;

  /** Only include properties for a specific group. If a property does not specify any group, it will be included, otherwise only properties with a matching group are included. */
  groups?: string[];

  /** Convert custom types to their database representation. By default, the `Type.toJSON` method is invoked instead. */
  convertCustomTypes?: boolean;
}
```

Here is a more complex example:

```ts
import { wrap } from '@mikro-orm/core';

const dto = wrap(author).serialize({
  populate: ['books.author', 'books.publisher', 'favouriteBook'], // populate some relations
  exclude: ['books.author.email'], // skip property of some relation
  forceObject: true, // not populated or not initialized relations will result in object, e.g. `{ author: { id: 1 } }`
  skipNull: true, // properties with `null` value won't be part of the result
});
```

If you try to populate a relation that is not initialized, it will have same effect as the `forceObject` option - the value will be represented as object with just the primary key available.

### Serialization groups

Every property can specify its serialization groups, which are then used with explicit serialization.

> Properties without the `groups` option are always included.

Let's consider the following entity:

```ts
@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property({ groups: ['public', 'private'] })
  name!: string;

  @Property({ groups: ['private'] })
  email!: string;

}
```

Now when you call `serialize()`:
- without the `groups` option, you get all the properties
- with `groups: ['public']` you get `id`, `username` and `name` properties
- with `groups: ['private']` you get `id`, `username`, `name` and `email` properties
- with `groups: []` you get only the `id` and `username` properties (those without groups)

```ts
const dto1 = serialize(user);
// User { id: 1, username: 'foo', name: 'Jon', email: 'jon@example.com' }

const dto2 = serialize(user, { groups: ['public'] });
// User { id: 1, username: 'foo', name: 'Jon' }
```

## Caching and `toPOJO`

While `toObject` and `serialize` are often enough for serializing your entities, there is one use case where they often fall short, which is caching. When caching an entity, you usually want to ignore things like custom serializers or hidden properties. Once you try to load this entity from cache, it needs to have all the properties just like if you load it again.

Imagine the following scenario: you have a `User` entity that has a `password` property, which is `hidden: true`. Calling `toObject()` or `serialize()` would omit this hidden `password` property, while `toPOJO()` would keep it. If you want to cache such an entity, you want to have all the properties, not just those that are visible.

> The `toPOJO` method will also ignore serialization hints (`populate` and `fields`) and will expand all relations unless they form a cycle.

## Custom `toJSON` method

You can provide custom implementation for `toJSON`, while using `toObject` for initial serialization:

```ts
@Entity()
class Book {

  // ...

  toJSON(strict = true, strip = ['id', 'email'], ...args: any[]): { [p: string]: any } {
    const o = wrap(this, true).toObject(...args); // do not forget to pass rest params here

    if (strict) {
      strip.forEach(k => delete o[k]);
    }

    return o;
  }

}
```

> Do not forget to pass rest params when calling `toObject(...args)`, otherwise the results might not be stable.
