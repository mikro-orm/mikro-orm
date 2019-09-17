---
---

# Property Validation

`MirkoORM` will validate your properties before actual persisting happens. It will try to fix wrong 
data types for you automatically. If automatic conversion fails, it will throw an error. You can 
enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered 
when persisting the entity. 

```typescript
// number instead of string will throw
const author = new Author('test', 'test');
author.assign({ name: 111, email: 222 });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.name of type 'string' to '111' of type 'number'"

// string date with unknown format will throw
author.assign(author, { name: '333', email: '444', born: 'asd' });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.born of type 'date' to 'asd' of type 'string'"

// string date with correct format will be auto-corrected
author.assign({ name: '333', email: '444', born: '2018-01-01' });
await orm.em.persistAndFlush(author);
console.log(author.born).toBe(true); // instance of Date

// Date object will be ok
author.assign({ born: new Date() });
await orm.em.persistAndFlush(author);
console.log(author.born).toBe(true); // instance of Date

// null will be ok
author.assign({ born: null });
await orm.em.persistAndFlush(author);
console.log(author.born); // null

// string number with correct format will be auto-corrected
author.assign({ age: '21' });
await orm.em.persistAndFlush(author);
console.log(author.age); // number 21

// string instead of number with will throw
author.assign({ age: 'asd' });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.age of type 'number' to 'asd' of type 'string'"
author.assign({ age: new Date() });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.age of type 'number' to '2019-01-17T21:14:23.875Z' of type 'date'"
author.assign({ age: false });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.age of type 'number' to 'false' of type 'boolean'"
```

[&larr; Back to table of contents](index.md#table-of-contents)
