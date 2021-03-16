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
import { wrap } from '@mikro-orm/core';

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
import { wrap } from '@mikro-orm/core';

const book = new Book();
wrap(book).assign({ 
  title: 'Better Book 1', 
  author: '...id...',
}, { em: orm.em });
```

By default, `entity.assign(data)` behaves same way as `Object.assign(entity, data)`, 
e.g. it does not merge things recursively. To enable deep merging of object properties (not referenced entities), 
use second parameter to enable `mergeObjects` flag:

```typescript
import { wrap } from '@mikro-orm/core';

book.meta = { foo: 1, bar: 2 };

wrap(book).assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }

wrap(book).assign({ meta: { foo: 4 } });
console.log(book.meta); // { foo: 4 }
```

To get the same behavior as `mergeObjects` flag for m:1 and 1:1 references, enable the `updateNestedEntities` flag.

```typescript
import { wrap } from '@mikro-orm/core';

const authorEntity = new Author('Jon2 Snow', 'snow3@wall.st');
book.author = authorEntity;

wrap(book).assign({ author: { name: 'Jon Snow2' } }, { updateNestedEntities: true });
console.log(book.author); // { ... name: 'Jon Snow2' ... }
console.log(book.author === authorEntity) // true

//this will have no influence as author is an entity
wrap(book).assign({ author: { name: 'Jon Snow2' } }, { mergeObjects: true });
console.log(book.author); // { ... name: 'Jon Snow2' ... }
console.log(book.author === authorEntity) // false
```

## `WrappedEntity` and `wrap()` helper

`IWrappedEntity` is an interface that defines public helper methods provided 
by the ORM:

```typescript
interface IWrappedEntity<T, PK extends keyof T> {
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init(populated?: boolean, lockMode?: LockMode): Promise<T>;
  toReference(): IdentifiedReference<T, PK>;
  toObject(ignoreFields?: string[]): Dictionary;
  toJSON(...args: any[]): Dictionary;
  assign(data: any, options?: AssignOptions | boolean): T;
}
```

There are two ways to access those methods. You can either extend `BaseEntity` 
(exported from `@mikro-orm/core`), that defines those methods, or use the 
`wrap()` helper to access `WrappedEntity` instance, where those methods
exist.

Users can choose whether they are fine with polluting the entity interface with 
those additional methods, or they want to keep the interface clean 
and use the `wrap(entity)` helper method instead to access them. 

> Since v4 `wrap(entity)` no longer returns the entity, now the `WrappedEntity` instance is 
> being returned. It contains only public methods (`init`, `assign`, `isInitialized`, ...),
> if you want to access internal properties like `__meta` or `__em`, you need to explicitly
> ask for the helper via `wrap(entity, true)`.

```typescript
import { BaseEntity } from '@mikro-orm/core';

@Entity()
export class Book extends BaseEntity<Book, 'id'> { ... }
```

Then you can work with those methods directly:

```typescript
book.meta = { foo: 1, bar: 2 };
book.assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }
```

### Accessing internal prefixed properties

Previously it was possible to access internal properties like `__meta` or `__em` 
from the `wrap()` helper. Now to access them, you need to use second parameter of
wrap:

```typescript
@Entity()
export class Author { ... }

console.log(wrap(author, true).__meta);
```
