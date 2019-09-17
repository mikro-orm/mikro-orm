---
---

# EntityHelper and Decorated Entities

## Updating Entity Values with IEntity.assign()

When you want to update entity based on user input, you will usually have just plain
string ids of entity relations as user input. Normally you would need to use 
`EntityManager.getReference()` to create references from each id first, and then
use those references to update entity relations:

```typescript
const jon = new Author('Jon Snow', 'snow@wall.st');
const book = new Book('Book', jon);
book.author = orm.em.getReference<Author>(Author, '...id...');
```

Same result can be easily achieved with `IEntity.assign()`:

```typescript
book.assign({ 
  title: 'Better Book 1', 
  author: '...id...',
});
console.log(book.title); // 'Better Book 1'
console.log(book.author); // instance of Author with id: '...id...'
console.log(book.author.id); // '...id...'
```

By default, `IEntity.assign(data)` behaves same way as `Object.assign(entity, data)`, 
e.g. it does not merge things recursively. To enable deep merging of object properties, 
use second parameter to enable `mergeObjects` flag:

```typescript
book.meta = { foo: 1, bar: 2 };

book.assign({ meta: { foo: 3 } }, { mergeObjects: true });
console.log(book.meta); // { foo: 3, bar: 2 }

book.assign({ meta: { foo: 4 } });
console.log(book.meta); // { foo: 4 }
```

[&larr; Back to table of contents](index.md#table-of-contents)
