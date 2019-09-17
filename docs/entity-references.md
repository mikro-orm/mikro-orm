---
---

# Entity References

Every single entity relation is mapped to an entity reference. Reference is an entity that has
only its identifier. This reference is stored in identity map so you will get the same object 
reference when fetching the same document from database.

You can call `await entity.init()` to initialize the entity. This will trigger database call 
and populate itself, keeping the same reference in identity map. 

```typescript
const author = orm.em.getReference('...id...');
console.log(author.id); // accessing the id will not trigger any db call
console.log(author.isInitialized()); // false
console.log(author.name); // undefined

await author.init(); // this will trigger db call
console.log(author.isInitialized()); // true
console.log(author.name); // defined
```

## Better Type-safety with `Reference<T>` Wrapper

To improve Type-safety, you can also use [`Reference<T>` Wrapper](reference-wrapper.md). 
It simply wraps the entity, defining `load(): Promise<T>` method that will first lazy 
load the association if not already available. You can also use `unwrap(): T` method to 
access the underlying entity without loading it. 

```typescript
export class Book {

  @ManyToOne()
  author: IdentifiedReference<Author>;

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author instanceof Reference); // true
console.log(book.author.isInitialized()); // false
console.log(book.author.name); // type error, there is no `name` property
console.log(book.author.unwrap().name); // undefined as author is not loaded
console.log((await book.author.load()).name); // ok, loading the author first
```

[&larr; Back to table of contents](index.md#table-of-contents)
