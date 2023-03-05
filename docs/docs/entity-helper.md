---
title: EntityHelper and Decorated Entities
sidebar_label: Updating Entity Values
---

## Updating Entity Values with `assign()`

When you want to update entity based on user input, you will usually have just plain string ids of entity relations as user input. Normally you would need to use `em.getReference()` to create references from each id first, and then use those references to update entity relations:

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

By default, `assign(data)` behaves similar to `Object.assign(entity, data)`, e.g. it does not merge things recursively. To enable deep merging of object properties (not referenced entities), use second parameter to enable `mergeObjects` flag:

```ts
import { wrap } from '@mikro-orm/core';

book.meta = { foo: 1, bar: 2 };

wrap(book).assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }

wrap(book).assign({ meta: { foo: 4 } });
console.log(book.meta); // { foo: 4 }
```

### Updating deep entity graph

Since v5, `assign` allows updating deep entity graph by default. To update existing entity, we need to provide its PK in the `data`, as well as to **load that entity first into current context**.

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

If we want to always update the entity, even without the entity PK being present in `data`, we can use `updateByPrimaryKey: false`:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// update existing book's author's name
wrap(book).assign({
  author: {
    name: 'New name...',
  },
}, { updateByPrimaryKey: false });
```

Otherwise the entity data without PK are considered as new entity, and will trigger insert query:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// creating new author for given book
wrap(book).assign({
  author: {
    name: 'New name...',
  },
});
```

Same applies to the case when we do not load the child entity first into the context, e.g. when we try to assign to a relation that was not populated. Even if we provide its PK, it will be considered as new object and trigger an insert query.

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

When updating collections, we can either pass complete array of all items, or just a single item - in such case, the new item will be appended to the existing items. Passing a completely new array of items will replace the existing items. Previously existing items will be disconnected/removed from the collection. Also check the [Collection page](collections.md#removing-items-from-collection) on the effects of removing entities from collections.

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

## `WrappedEntity` and `wrap()` helper

`IWrappedEntity` is an interface that defines public helper methods provided by the ORM:

```ts
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

There are two ways to access those methods. You can either extend `BaseEntity` (exported from `@mikro-orm/core`), that defines those methods, or use the `wrap()` helper to access `WrappedEntity` instance, where those methods exist.

Users can choose whether they are fine with polluting the entity interface with those additional methods, or they want to keep the interface clean and use the `wrap(entity)` helper method instead to access them.

> Since v4, `wrap(entity)` no longer returns the entity, now the `WrappedEntity` instance is being returned. It contains only public methods (`init`, `assign`, `isInitialized`, ...), if you want to access internal properties like `__meta` or `__em`, you need to explicitly ask for the helper via `wrap(entity, true)`.

```ts
import { BaseEntity } from '@mikro-orm/core';

@Entity()
export class Book extends BaseEntity<Book, 'id'> { ... }
```

Then you can work with those methods directly:

```ts
book.meta = { foo: 1, bar: 2 };
book.assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }
```

### Accessing internal prefixed properties

Previously it was possible to access internal properties like `__meta` or `__em` from the `wrap()` helper. Now to access them, you need to use second parameter of wrap:

```ts
@Entity()
export class Author { ... }

console.log(wrap(author, true).__meta);
```
