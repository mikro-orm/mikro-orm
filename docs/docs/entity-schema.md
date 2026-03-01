---
title: Defining Entities via EntitySchema
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The `defineEntity` helper is the recommended way to define entities programmatically without decorators. It is built on top of `EntitySchema`, leveraging TypeScript's type inference to generate entity types automatically.

## `defineEntity`

Use `defineEntity` to declare your entities. It returns an `EntitySchema` instance with full type information.

```ts
import { defineEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
    tags: () => p.manyToMany(BookTag).inversedBy('books').fixedOrder(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

The `p` shortcut is also available as `defineEntity.properties`.

### The `defineEntity + class` pattern (recommended)

When you extend the auto-generated class and register it via `setClass()`, you get several benefits:

- **Clean hover types**: Hovering over a `Book` variable shows `Book` — not a complex intersection type with generics and symbols
- **Better performance**: A real named class is more efficient than the dynamically generated anonymous class used by the pure approach
- **Custom methods**: Add domain logic directly on entity instances without any workarounds
- **No property duplication**: Properties are defined once in the schema and automatically inherited by the class

```ts
const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    firstName: p.string(),
    lastName: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

class Author extends AuthorSchema.class {
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

AuthorSchema.setClass(Author);

// Usage:
const author = em.create(Author, { firstName: 'John', lastName: 'Doe' });
console.log(author.fullName()); // "John Doe"
```

> **Important:** `setClass()` must be called before the ORM discovery process runs (i.e., before `MikroORM.init()`). Make sure to call it at module load time, right after defining the extended class.

### Pure `defineEntity` (without a class)

You can also use `defineEntity` without extending a class. This is more compact for simple entities but produces complex computed types on hover.

```ts
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).inversedBy('books'),
    tags: () => p.manyToMany(BookTag).inversedBy('books').fixedOrder(),
  },
});

// Use InferEntity to extract the entity type
export type IBook = InferEntity<typeof Book>;
```

When creating new entity instances without a class, use `em.create()` which will create an instance of the internally generated class:

```ts
const book = em.create(Book, { title: 'My Book', author });
await em.flush();
```

### Reusing base properties via composition

With `defineEntity`, use composition (shared property objects) instead of class inheritance for base properties:

```ts
const p = defineEntity.properties;

const baseProperties = {
  id: p.integer().primary(),
  createdAt: p.datetime().onCreate(() => new Date()),
  updatedAt: p.datetime()
    .onCreate(() => new Date())
    .onUpdate(() => new Date()),
};

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    ...baseProperties,
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

### Property types

`defineEntity.properties` (aliased as `p`) provides all [MikroORM built-in types](./custom-types#types-provided-by-mikroorm). To use [custom types](./custom-types), use `p.type()`:

```ts
const properties = {
  string: p.string(),
  float: p.float(),
  boolean: p.boolean(),
  json: p.json<{ foo: string; bar: number }>().nullable(),
  stringArray: p.type(ArrayType<string>).nullable(),
  numericArray: p.type(new ArrayType(i => +i)).nullable(),
  point: p.type(PointType).nullable(),
};
```

## MongoDB example

<Tabs
  groupId="entity-schema-def"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
  ]}
>
  <TabItem value="define-entity-class">

```ts
const BookTagSchema = defineEntity({
  name: 'BookTag',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

export class BookTag extends BookTagSchema.class {}
BookTagSchema.setClass(BookTag);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

export type IBookTag = InferEntity<typeof BookTag>;
```

  </TabItem>
</Tabs>

## Hooks example

Entity hooks can be defined either as a property name, or as a function. When defined as a function, the `this` argument will be the entity instance. Arrow functions can be used if desired, and the entity will be available at args.entity. See [Events and Lifecycle Hooks](./events.md) section for more details on `EventArgs`.

<Tabs
  groupId="entity-schema-hooks"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
  ]}
>
  <TabItem value="define-entity-class">

```ts
// Defined outside, this available via args.
const beforeUpdate = (args: EventArgs) => args.entity.version++;

const BookTagSchema = defineEntity({
  name: 'BookTag',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
  hooks: {
    beforeUpdate: [beforeUpdate],
  },
});

export class BookTag extends BookTagSchema.class {}
BookTagSchema.setClass(BookTag);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
// Defined outside, this available via args.
const beforeUpdate = (args: EventArgs) => args.entity.version++;

export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    name: p.string(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
  hooks: {
    beforeUpdate: [beforeUpdate],
  },
});

export type IBookTag = InferEntity<typeof BookTag>;
```

  </TabItem>
</Tabs>

## `EntitySchema` (low-level API)

`defineEntity` returns an `EntitySchema` instance — the same class you can instantiate directly. Using `EntitySchema` directly is generally not necessary, as `defineEntity` provides a more ergonomic API with full type inference. However, it's available for advanced use cases or vanilla JavaScript projects.

```ts title="./entities/Book.ts"
export interface IBook {
  title: string;
  author: Author;
  publisher: Publisher;
  tags: Collection<BookTag>;
}

export const BookSchema = new EntitySchema<IBook>({
  name: 'Book',
  extends: CustomBaseEntitySchema,
  properties: {
    title: { type: 'string' },
    author: { kind: 'm:1', entity: () => Author, inversedBy: 'books' },
    publisher: { kind: 'm:1', entity: () => Publisher, inversedBy: 'books' },
    tags: { kind: 'm:n', entity: () => BookTag, inversedBy: 'books', fixedOrder: true },
  },
});
```

### Using a class with `EntitySchema`

You can pass a `class` option instead of `name`:

```ts title="./entities/Author.ts"
export class Author extends CustomBaseEntity {
  name: string;
  email: string;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }
}

export const AuthorSchema = new EntitySchema({
  class: Author,
  extends: CustomBaseEntitySchema,
  properties: {
    name: { type: 'string' },
    email: { type: 'string', unique: true },
  },
});
```

### Configuration Reference

The parameter of `EntitySchema` requires either `name` or `class`. When using `class`, `extends` will be automatically inferred. Additional parameters:

```ts
name: string;
class: Constructor<T>;
extends: string;
tableName: string; // alias for `collection: string`
properties: { [K in keyof T & string]: EntityProperty<T[K]> };
indexes: { properties: string | string[]; name?: string; type?: string }[];
uniques: { properties: string | string[]; name?: string }[];
repository: () => Constructor<EntityRepository<T>>;
hooks: Partial<Record<keyof typeof EventType, ((string & keyof T) | NonNullable<EventSubscriber[keyof EventSubscriber]>)[]>>;
abstract: boolean;
orderBy: QueryOrderMap<T> | QueryOrderMap<T>[]; // default ordering for the entity
```

> As a value for `type` you can also use one of `String`/`Number`/`Boolean`/`Date`.
