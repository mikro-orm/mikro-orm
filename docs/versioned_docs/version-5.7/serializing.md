---
title: Serializing
---

By default, all entities are monkey patched with `toObject()` and `toJSON` methods:

```ts
export interface AnyEntity<K = number | string> {
  toObject(parent?: AnyEntity, isCollection?: boolean): Record<string, any>;
  toJSON(...args: any[]): Record<string, any>;
  // ...
}
```

When you serialize your entity via `JSON.stringify(entity)`, its `toJSON` method will be called automatically. You can provide custom implementation for `toJSON`, while using `toObject` for initial serialization:

```ts
@Entity()
export class Book {

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

## Hidden Properties

If you want to omit some properties from serialized result, you can mark them with `hidden` flag on `@Property()` decorator:

```ts
@Entity()
export class Book {

  @Property({ hidden: true })
  hiddenField = Date.now();

}

const book = new Book(...);
console.log(wrap(book).toObject().hiddenField); // undefined
console.log(wrap(book).toJSON().hiddenField); // undefined
```

## Shadow Properties

The opposite situation where you want to define a property that lives only in memory (is not persisted into database) can be solved by defining your property as `persist: false`. Such property can be assigned via one of `Entity.assign()`, `em.create()` and `em.merge()`. It will be also part of serialized result.

This can be handled when dealing with additional values selected via `QueryBuilder` or MongoDB's aggregations.

```ts
@Entity()
export class Book {

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
export class Book {

  @ManyToOne({ serializer: value => value.name, serializedName: 'authorName' })
  author: Author;

}

const author = new Author('God')
const book = new Book(author);
console.log(wrap(book).toJSON().authorName); // 'God'
```

## Explicit serialization

The serialization process is normally driven by the `populate` hints. If you want to take control over this, you can use the `serialize()` helper:

```ts
import { serialize } from '@mikro-orm/core';

const dto = serialize(user); // serialize single entity
// { name: '...', books: [1, 2, 3], identity: 123 }

const dtos = serialize(users); // supports arrays as well
// [{ name: '...', books: [1, 2, 3], identity: 123 }, ...]
```

By default, every relation is considered as not populated - this will result in the foreign key values to be present. Loaded collections will be represented as arrays of the foreign keys. To control the shape of the serialized response we can use the second `options` parameter:

```ts
export interface SerializeOptions<T extends object, P extends string = never> {
  /** Specify which relation should be serialized as populated and which as a FK. */
  populate?: AutoPath<T, P>[] | boolean;

  /** Specify which properties should be omitted. */
  exclude?: AutoPath<T, P>[];

  /** Enforce unpopulated references to be returned as objects, e.g. `{ author: { id: 1 } }` instead of `{ author: 1 }`. */
  forceObject?: boolean;

  /** Ignore custom property serializers. */
  ignoreSerializers?: boolean;

  /** Skip properties with `null` value. */
  skipNull?: boolean;
}
```

Here is a more complex example:

```ts
import { serialize } from '@mikro-orm/core';

const dto = serialize(author, {
  populate: ['books.author', 'books.publisher', 'favouriteBook'], // populate some relations
  exclude: ['books.author.email'], // skip property of some relation
  forceObject: true, // not populated or not initialized relations will result in object, e.g. `{ author: { id: 1 } }`
  skipNull: true, // properties with `null` value won't be part of the result
});
```

If you try to populate a relation that is not initialized, it will have same effect as the `forceObject` option - the value will be represented as object with just the primary key available.
