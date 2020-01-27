---
title: Serializing
---

By default, all entities are monkey patched with `toObject()` and `toJSON` methods:

```typescript
export interface IEntity<K = number | string> {
  toObject(parent?: IEntity, isCollection?: boolean): Record<string, any>;
  toJSON(...args: any[]): Record<string, any>;
  // ...
}
```

When you serialize your entity via `JSON.stringify(entity)`, its `toJSON` method will be 
called automatically. You can provide custom implementation for `toJSON`, while using 
`toObject` for initial serialization:

```typescript
@Entity()
export class Book {

  // ...

  toJSON(strict = true, strip = ['id', 'email'], ...args: any[]): { [p: string]: any } {
    const o = this.toObject(...args); // do not forget to pass rest params here

    if (strict) {
      strip.forEach(k => delete o[k]);
    }

    return o;
  }

}
```

> Do not forget to pass rest params when calling `toObject(...args)`, otherwise the results
> might not be stable.

## Hidden properties

If you want to omit some properties from serialized result, you can mark them with `hidden`
flag on `@Property()` decorator:

```typescript
@Entity()
export class Book {

  @Property({ hidden: true })
  hiddenField = Date.now();

}

const book = new Book(...);
console.log(book.toObject().hiddenField); // undefined
console.log(book.toJSON().hiddenField); // undefined
```

## Shadow properties

The opposite situation where you want to define a property that lives only in memory (is 
not persisted into database) can be solved by defining your property as `persist: false`. 
Such property can be assigned via one of `IEntity.assign()`, `EntityManager.create()` and 
`EntityManager.merge()`. It will be also part of serialized result. 

This can be handle when dealing with additional values selected via `QueryBuilder` or 
MongoDB's aggregations.

```typescript
@Entity()
export class Book {

  @Property({ persist: false })
  count: number;

}

const book = new Book(...);
book.assign({ count: 123 });
console.log(book.toObject().count); // 123
console.log(book.toJSON().count); // 123
```
