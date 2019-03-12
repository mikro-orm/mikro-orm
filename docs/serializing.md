---
---

# Serializing

By default, all entities are monkey patched with `toObject()` and `toJSON` methods:

```typescript
export interface IEntity<K = number | string> {
  toObject(parent?: IEntity, isCollection?: boolean): Record<string, any>;
  toJSON(...args: any[]): Record<string, any>;
  // ...
}
```

When you serialize your entity via `JSON.strinfigy(entity)`, its `toJSON` method will be 
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

