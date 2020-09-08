---
title: Propagation
---

By default MikroORM will propagate all changes made to one side of bi-directional relations
to the other side, keeping them in sync. This works for all relations, including M:1 and 1:1.
As part of the discovery process, all M:1 and 1:1 properties are re-defined as getter/setter.

```typescript
const author = new Author(...);
const book = new Book(...);
book.author = author;
console.log(author.books.contains(book)); // true
```

> You can disable this behaviour via `propagateToOneOwner` option.

## Propagation of Collection's add() and remove() operations

When you use one of `Collection.add()` method, the item is added to given collection, 
and this action is also propagated to its counterpart. 

```typescript
// one to many
const author = new Author(...);
const book = new Book(...);

author.books.add(book);
console.log(book.author); // author will be set thanks to the propagation
```

For M:N this works in both ways, either from owning side, or from inverse side. 

```typescript
// many to many works both from owning side and from inverse side
const book = new Book(...);
const tag = new BookTag(...);

book.tags.add(tag);
console.log(tag.books.contains(book)); // true

tag.books.add(book);
console.log(book.tags.contains(tag)); // true
``` 

> Collections on both sides have to be initialized, otherwise propagation won't work.

> Although this propagation works also for M:N inverse side, you should always use owning
> side to manipulate the collection.

Same applies for `Collection.remove()`.
