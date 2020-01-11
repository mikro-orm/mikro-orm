---
title: EntityHelper and Decorated Entities
sidebar_label: Updating Entity Values
---

## Updating Entity Values with `entity.assign()`

When you want to update entity based on user input, you will usually have just plain
string ids of entity relations as user input. Normally you would need to use 
`em.getReference()` to create references from each id first, and then
use those references to update entity relations:

```typescript
const jon = new Author('Jon Snow', 'snow@wall.st');
const book = new Book('Book', jon);
book.author = orm.em.getReference<Author>(Author, '...id...');
```

Same result can be easily achieved with `entity.assign()`:

```typescript
import { wrap } from 'mikro-orm';

wrap(book).assign({ 
  title: 'Better Book 1', 
  author: '...id...',
});
console.log(book.title); // 'Better Book 1'
console.log(book.author); // instance of Author with id: '...id...'
console.log(book.author.id); // '...id...'
```

To use `entity.assign()` on not managed entities, you need to provide `EntityManager` 
instance explicitly: 

```typescript
import { wrap } from 'mikro-orm';

const book = new Book();
wrap(book).assign({ 
  title: 'Better Book 1', 
  author: '...id...',
}, { em: orm.em });
```

By default, `entity.assign(data)` behaves same way as `Object.assign(entity, data)`, 
e.g. it does not merge things recursively. To enable deep merging of object properties, 
use second parameter to enable `mergeObjects` flag:

```typescript
import { wrap } from 'mikro-orm';

book.meta = { foo: 1, bar: 2 };

wrap(book).assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }

wrap(book).assign({ meta: { foo: 4 } });
console.log(book.meta); // { foo: 4 }
```

## `WrappedEntity` and `wrap()` helper

`IWrappedEntity` is interface that defines helper methods as well as some internal 
properties provided by the ORM:

```typescript
interface IWrappedEntity<T, PK extends keyof T> {
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?: boolean, lockMode?: LockMode): Promise<this>;
  toReference(): IdentifiedReference<T, PK>;
  toObject(ignoreFields?: string[]): Dictionary;
  toJSON(...args: any[]): Dictionary;
  assign(data: any, options?: AssignOptions | boolean): this;
  __uuid: string;
  __meta: EntityMetadata;
  __em: EntityManager;
  __initialized?: boolean;
  __populated: boolean;
  __lazyInitialized: boolean;
  __primaryKey: T[PK] & Primary<T>;
  __serializedPrimaryKey: string & keyof T;
}
```

Users can choose whether they are fine with polluting the entity interface with 
those additional methods and properties, or they want to keep the interface clean 
and use the `wrap(entity)` helper method instead to access them. 

To keep all methods available on the entity, you can use interface merging with 
`WrappedEntity<T, PK>` that both extends `AnyEntity<T, PK>` and defines all those methods.

```typescript
@Entity()
export class Book { ... }
export interface Book extends WrappedEntity<Book, 'id'> { }
```

Then you can work with those methods directly:

```typescript
book.meta = { foo: 1, bar: 2 };
book.assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }
```
