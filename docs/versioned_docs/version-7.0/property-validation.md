---
title: Property Validation
---

## Required properties

Entity properties are by default considered as required, and as such, they will be validated on both type level and runtime level. To make a property nullable, you need to mark this both at type level and at metadata level (unless you are using `ts-morph` for metadata reflection):

```ts
@Property({ nullable: true })
name?: string;
```

In case you want to use explicit `null`, you should also provide property initializer:

```ts
@Property({ type: 'string', nullable: true })
name: string | null = null;
```

### Properties with default value

The runtime validation will work fine if your required properties have default value. But when it comes to type validation, you will need additional hint for TypeScript, so it understands your property (for TS defined as required) is in fact optional too (because you have a default value for it). You have two options:

Define property as optional even when it has a default value (not perfect as it will allow unsetting such property, which might not be what you want):

```ts
@Property({ default: 1 })
level?: number = 1;
```

Or use `OptionalProps` symbol, specially designed to help with this use case. It should be defined as optional property on the entity and its type needs to be a union of all the properties you want to mark as optional.

```ts
import { OptionalProps, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class User {

  // highlight-start
  // getters will have the same problem
  [OptionalProps]?: 'foo' | 'bar' | 'fooBar';
  // highlight-end

  @PrimaryKey()
  id!: number;

  @Property({ default: 1 })
  foo: number = 1;

  @Property({ default: 2 })
  bar: number = 2;

  @Property({ persist: false })
  get fooBar() {
    return foo + bar;
  }

}
```

When you want to define some optional properties in your own base entity class, use generics, so you can add more properties from the extending classes:

```ts
@Entity()
// highlight-next-line
class MyBaseEntity<Entity extends object, Optional extends keyof Entity = never> {

  // highlight-next-line
  [OptionalProps]?: 'foo' | 'bar' | Optional;

  @PrimaryKey()
  id!: number;

  @Property({ default: 1 })
  foo: number = 1;

  @Property({ default: 2 })
  bar: number = 2;

}

@Entity()
// highlight-next-line
class User extends MyBaseEntity<User, 'baz'> {

  @Property({ default: 3 })
  baz: number = 3;

}
```

An alternative approach is using the `Opt` type, which can be used in two ways:

- with generics: `middleName: Opt<string> = '';`
- with intersections: `middleName: string & Opt = '';`

Both will work the same, and can be combined with the `OptionalProps` symbol approach.

```ts
import { Opt, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  // highlight-next-line
  middleName: string & Opt = '';

  @Property()
  lastName!: string;

  @Property({ persist: false })
  // highlight-next-line
  get fullName(): Opt<string> {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }

}
```

### Runtime validation

The runtime validation happens on flush operation, right before the insert queries are fired.

If for some reason you don't want the ORM to throw on missing properties that are marked as required, you can disable the validation via `validateRequired: false`. This validation is enabled by default.

### Note about optional properties and metadata reflection

When you define your entities, you need to be careful about optional properties. With `reflect-metadata` provider (the default one), the property type can be inferred only if you mark properties as optional via `?` suffix - if you use a type union like `string | null`, `reflect-metadata` won't help you with such type, and you will be forced to define it explicitly. This issue is not present with `ts-morph` provider.
