---
title: Serializing
---

By default, all entities are monkey patched with `toObject()` and `toJSON` methods:

```typescript
export interface AnyEntity<K = number | string> {
  toObject(parent?: AnyEntity, isCollection?: boolean): Record<string, any>;
  toJSON(...args: any[]): Record<string, any>;
  // ...
}
```

When you serialize your entity via `JSON.stringify(entity)`, its `toJSON` method will be called automatically. You can provide custom implementation for `toJSON`, while using `toObject` for initial serialization:

```typescript
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

```typescript
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

This can be handle when dealing with additional values selected via `QueryBuilder` or MongoDB's aggregations.

```typescript
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

```typescript
@Entity()
export class Book {

  @ManyToOne({ serializer: value => value.name, serializedName: 'authorName' })
  author: Author;

}

const author = new Author('God')
const book = new Book(author);
console.log(wrap(book).toJSON().authorName); // 'God'
```
