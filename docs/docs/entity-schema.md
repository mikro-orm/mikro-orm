---
title: Defining Entities via EntitySchema
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

With `EntitySchema` helper we define the schema programmatically.

```ts title="./entities/Book.ts"
export interface Book extends CustomBaseEntity {
  title: string;
  author: Author;
  publisher: Publisher;
  tags: Collection<BookTag>;
}

// The second type argument is optional, and should be used only with custom
// base entities, not with the `BaseEntity` class exported from `@mikro-orm/core`.
export const schema = new EntitySchema<Book, CustomBaseEntity>({
  // name should be used only with interfaces
  name: 'Book',
  // if we use actual class, we need this instead:
  // class: Book,
  extends: CustomBaseEntitySchema, // only if we extend custom base entity
  properties: {
    title: { type: 'string' },
    author: { kind: 'm:1', entity: 'Author', inversedBy: 'books' },
    publisher: { kind: 'm:1', entity: 'Publisher', inversedBy: 'books' },
    tags: { kind: 'm:n', entity: 'BookTag', inversedBy: 'books', fixedOrder: true },
  },
});
```

When creating new entity instances, you will need to use `em.create()` method that will create instance of internally created class.

```ts
// instance of internal Author class
const author = em.create<Author>('Author', { name: 'name', email: 'email' });
await em.flush();
```

> Using this approach, metadata caching is automatically disabled as it is not needed.

## Using custom entity classes

You can optionally use custom class for entity instances.

```ts title="./entities/Author.ts"
export class Author extends CustomBaseEntity {
  name: string;
  email: string;
  age?: number;
  termsAccepted?: boolean;
  identities?: string[];
  born?: string;
  books = new Collection<Book>(this);
  favouriteBook?: Book;
  version?: number;

  constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
  }
}

export const schema = new EntitySchema<Author, CustomBaseEntity>({
  class: Author,
  extends: CustomBaseEntitySchema,
  properties: {
    name: { type: 'string' },
    email: { type: 'string', unique: true },
    age: { type: 'number', nullable: true },
    termsAccepted: { type: 'boolean', default: 0, onCreate: () => false },
    identities: { type: 'string[]', nullable: true },
    born: { type: DateType, nullable: true, length: 3 },
    books: { kind: '1:m', entity: () => 'Book', mappedBy: book => book.author },
    favouriteBook: { kind: 'm:1', type: 'Book' },
    version: { type: 'number', persist: false },
  },
});
```

Then you can use the entity class as usual:

```ts
const author = new Author('name', 'email');
await em.persist(author).flush();
```

## Using custom base entity

Do not forget that base entities needs to be discovered just like normal entities.

```ts title="./entities/BaseEntity.ts"
export interface CustomBaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export const schema = new EntitySchema<CustomBaseEntity>({
  name: 'CustomBaseEntity',
  abstract: true,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: { type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true },
  },
});
```

## Configuration Reference

The parameter of `EntitySchema` requires to provide either `name` or `class` parameters. When using `class`, `extends` will be automatically inferred. You can optionally pass these additional parameters:

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
```

Every property then needs to contain a type specification - one of `type` or `entity` options. Here are some examples of various property types:

```ts
export enum MyEnum {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const schema = new EntitySchema<FooBar>({
  name: 'FooBar',
  tableName: 'tbl_foo_bar',
  indexes: [{ name: 'idx1', properties: 'name' }],
  uniques: [{ name: 'unq1', properties: ['name', 'email'] }],
  repository: () => FooBarRepository,
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    baz: { kind: '1:1', entity: 'FooBaz', orphanRemoval: true, nullable: true },
    fooBar: { kind: '1:1', entity: 'FooBar', nullable: true },
    publisher: { kind: 'm:1', entity: 'Publisher', inversedBy: 'books' },
    books: { kind: '1:m', entity: () => 'Book', mappedBy: book => book.author },
    tags: { kind: 'm:n', entity: 'BookTag', inversedBy: 'books', fixedOrder: true },
    version: { type: 'Date', version: true, length: 0 },
    type: { enum: true, items: () => MyEnum, default: MyEnum.LOCAL },
  },
});
```

> As a value for `type` you can also use one of `String`/`Number`/`Boolean`/`Date`.

## `defineEntity`

`defineEntity` is built on top of `EntitySchema`, leveraging TypeScript's type inference capabilities to generate entity types. This reduces the amount of code while providing robust type safety and null safety.

```ts
import { type InferEntity, type InferEntityFromProperties, defineEntity, defineEntityProperties } from '@mikro-orm/core';

// We use `p` as a shortcut for `defineEntity.properties`
const p = defineEntity.properties;

// It is more recommended to use composition over inheritance when using `defineEntity`
export const baseProperties = defineEntityProperties({
  id: p.integer({ primary: true }),
  createdAt: p.datetime({ onCreate: () => new Date() }),
  updatedAt: p.datetime({ onCreate: () => new Date(), onUpdate: () => new Date() }),
});

// We can use `InferEntityFromProperties` to infer the type of an entity from its properties
export interface IBase extends InferEntityFromProperties<typeof baseProperties> {}

export const Book = defineEntity({
  name: 'Book',
  properties: {
    ...baseProperties,
    title: p.string(),
    author: p.manyToOne(() => Author, { inversedBy: 'books' }),
    publisher: p.oneToOne(() => Publisher, { inversedBy: 'books' }),
    tags: p.manyToMany(() => BookTag, { inversedBy: 'books', fixedOrder: true }),
  },
});

// We can use `InferEntity` to infer the type of an entity
export interface IBook extends InferEntity<typeof Book> {}
```

`defineEntity.properties` provides all [MikroORM built-in types](./custom-types#types-provided-by-mikroorm). To use [custom types](./custom-types), we can also use `p.property()`.

```ts
const properties = defineEntityProperties(p => ({
  string: p.string(),
  float: p.float(),
  boolean: p.boolean(),
  json: p.json<{ foo: string; bar: number }>({ nullable: true }),
  stringArray: p.property(ArrayType<string>, { nullable: true }),
  numericArray: p.property(new ArrayType(i => +i), { nullable: true }),
  point: p.property(PointType, { nullable: true }),
}));
```

### Solving circular references

Due to a limitation in TypeScript, when our Entity contains circular references, the entity types cannot be automatically inferred. In these cases, we need to manually declare the properties of the circular reference relationships.

```ts
const userProperties = defineEntityProperties({
  ...baseProperties,
  name: p.string(),
  email: p.string({ unique: true }),
});

export interface IUser extends InferEntityFromProperties<typeof userProperties> {
  friend: IUser | null | undefined;
}

export const User: EntitySchema<IUser> = defineEntity({
  name: 'User',
  properties: {
    ...userProperties,
    friend: p.manyToOne(() => User, { nullable: true }),
  },
});
```

## MongoDB example

<Tabs
groupId="entity-def"
defaultValue="define-entity"
values={[
{label: 'defineEntity', value: 'define-entity'},
{label: 'EntitySchema', value: 'entity-schema'},
]}>
  <TabItem value="define-entity">

```ts
const p = defineEntity.properties;

export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    _id: p.property('ObjectId', { primary: true }),
    id: p.string({ serializedPrimaryKey: true }),
    name: p.string(),
    books: p.manyToOne(() => Book, { mappedBy: book => book.tags }),
  },
});

export interface IBookTag extends InferEntity<typeof BookTag> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export class BookTag {
  _id!: ObjectId;
  id!: string;
  name: string;
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }
}

export const schema = new EntitySchema<BookTag>({
  class: BookTag,
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: 'string', serializedPrimaryKey: true },
    name: { type: 'string' },
    books: { kind: 'm:n', entity: () => Book, mappedBy: book => book.tags },
  },
});
```

  </TabItem>
</Tabs>

## Hooks example

Entity hooks can be defined either as a property name, or as a function. When defined as a function, the `this` argument will be the entity instance. Arrow functions can be used if desired, and the entity will be available at args.entity. See [Events and Lifecycle Hooks](./events.md) section for more details on `EventArgs`.

<Tabs
groupId="entity-def"
defaultValue="define-entity"
values={[
{label: 'defineEntity', value: 'define-entity'},
{label: 'EntitySchema', value: 'entity-schema'},
]}>
  <TabItem value="define-entity">

```ts
import { type EventSubscriber, type InferEntity, type EventArgs, defineEntity } from '@mikro-orm/core';

// Defined outside of entity class - this bound to entity instance
const beforeCreate: EventSubscriber['beforeCreate'] = function (this: IBookTag) {
  this.version = 1;
};

// Defined outside, this available via args.
const beforeUpdate: EventSubscriber['beforeUpdate'] = (args: EventArgs<IBookTag>) => {
  args.entity.version++;
};

const p = defineEntity.properties;
export const BookTag = defineEntity({
  name: 'BookTag',
  hooks: {
    beforeCreate: [beforeCreate], // normal function
    beforeUpdate: [beforeUpdate], // arrow function
  },
  properties: {
    _id: p.property('ObjectId', { primary: true }),
    id: p.string({ serializedPrimaryKey: true }),
    version: p.integer(),
    name: p.string(),
    books: p.manyToOne(() => Book, { mappedBy: book => book.tags }),
  },
});

export interface IBookTag extends InferEntity<typeof BookTag> {}

```
  </TabItem>
  <TabItem value="entity-schema">

```ts
export class BookTag {
  _id!: ObjectId;
  id!: string;
  name: string;
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

  // Defined on an entity class.
  beforeCreate() {
    this.version = 1;
  }

  beforeUpdate() {
    this.version++;
  }
}

// Defined outside of entity class - this bound to entity instance
function beforeUpdate() {
  this.version++;
}

// Defined outside, this available via args.
const beforeUpdate2 = (args: EventArgs) => args.entity.version++;

export const schema = new EntitySchema({
  class: BookTag,
  hooks: {
    beforeCreate: ['beforeCreate'], // Instance method
    beforeUpdate: ['beforeUpdate', beforeUpdate, beforeUpdate2] // Instance method, normal function, arrow function
  },
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: 'string', serializedPrimaryKey: true },
    name: { type: 'string' },
    books: { kind: 'm:n', entity: () => Book, mappedBy: book => book.tags },
  },
});
```
  </TabItem>
</Tabs>