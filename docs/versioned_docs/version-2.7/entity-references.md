---
title: Entity References
---

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

[&larr; Back to table of contents](index.md#table-of-contents)
