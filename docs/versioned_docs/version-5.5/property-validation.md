---
title: Property Validation
---

## Required properties

Entity properties are by default considered as required, and as such, they will be validated on both type level and runtime level. To make a property nullable, we need to mark this both at type level and at metadata level (unless we are using `ts-morph` for metadata reflection):

```ts
@Property({ nullable: true })
name?: string;
```

In case we want to use explicit `null`, we should also provide property initializer:

```ts
@Property({ type: 'string', nullable: true })
name: string | null = null;
```

### Properties with default value

The runtime validation will work fine if your required properties have default value. But when it comes to type validation, we will need additional hint for TypeScript, so it understands our property (for TS defined as required) is in fact optional too (because we have a default value for it). We have two options:

Define property as optional even when it has a default value (not perfect as it will allow unsetting such property, which might not be what you want):

```ts
@Property({ default: 1 })
level?: number = 1;
```

Or use `OptionalProps` symbol, specially designed to help with this use case. It should be defined as optional property on the entity and its type needs to be a union of all the properties you want to mark as optional.

```ts
import { OptionalProps } from '@mikro-orm/core';

@Entity()
class User {

  [OptionalProps]?: 'foo' | 'bar';

  @PrimaryKey()
  id!: number;

  @Property({ default: 1 })
  foo: number = 1;

  @Property({ default: 2 })
  bar: number = 2;

}
```

### Runtime validation

The runtime validation happens on flush operation, right before we fire the insert queries.

If for some reason we don't want the ORM to throw on missing properties that are marked as required, we can disable the validation via `validateRequired: false`. This validation is enabled by default since v5.

### Note about optional properties and metadata reflection

When we define our entities, we need to be careful about optional properties. With `reflect-metadata` provider (the default one), the property type can be inferred only if we mark properties as optional via `?` suffix - if we would use a type union like `string | null`, `reflect-metadata` won't help us with such type, and we will be forced to define it explicitly. This issue is not present with `ts-morph` provider.

## Strict property type validation

> Since v4.0.3 the validation needs to be explicitly enabled via `validate: true`. It has performance implications and usually should not be needed, as long as you don't modify your entities via `Object.assign()`.

`MikroORM` will validate your properties before actual persisting happens. It will try to fix wrong data types for you automatically. If automatic conversion fails, it will throw an error. You can enable strict mode to disable this feature and let ORM throw errors instead. Validation is triggered when persisting the entity.

```ts
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
