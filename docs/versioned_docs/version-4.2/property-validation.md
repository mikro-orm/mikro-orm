---
title: Property Validation
---

> Since v4.0.3 the validation needs to be explicitly enabled via `validate: true`.
> It has performance implications and usually should not be needed, as long as
> you don't modify your entities via `Object.assign()`.

`MirkoORM` will validate your properties before actual persisting happens. It will try to fix wrong 
data types for you automatically. If automatic conversion fails, it will throw an error. You can 
enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered 
when persisting the entity. 

```typescript
// number instead of string will throw
const author = new Author('test', 'test');
wrap(author).assign({ name: 111, email: 222 });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.name of type 'string' to '111' of type 'number'"

// string date with unknown format will throw
wrap(author).assign(author, { name: '333', email: '444', born: 'asd' });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.born of type 'date' to 'asd' of type 'string'"

// string date with correct format will be auto-corrected
wrap(author).assign({ name: '333', email: '444', born: '2018-01-01' });
await orm.em.persistAndFlush(author);
console.log(author.born).toBe(true); // instance of Date

// Date object will be ok
wrap(author).assign({ born: new Date() });
await orm.em.persistAndFlush(author);
console.log(author.born).toBe(true); // instance of Date

// null will be ok
wrap(author).assign({ born: null });
await orm.em.persistAndFlush(author);
console.log(author.born); // null

// string number with correct format will be auto-corrected
wrap(author).assign({ age: '21' });
await orm.em.persistAndFlush(author);
console.log(author.age); // number 21

// string instead of number with will throw
wrap(author).assign({ age: 'asd' });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.age of type 'number' to 'asd' of type 'string'"
wrap(author).assign({ age: new Date() });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.age of type 'number' to '2019-01-17T21:14:23.875Z' of type 'date'"
wrap(author).assign({ age: false });
await orm.em.persistAndFlush(author); // throws "Validation error: trying to set Author.age of type 'number' to 'false' of type 'boolean'"
```
