---
title: The wrap() Helper
sidebar_label: The wrap() Helper
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

The `wrap()` helper provides access to useful methods for working with entities. It returns a `WrappedEntity` instance that exposes methods for checking entity state, loading relations, serializing, and updating values.

```ts
import { wrap } from '@mikro-orm/core';

const book = await em.findOne(Book, 1);

// Check if the entity is initialized
wrap(book).isInitialized();

// Load a relation
await wrap(book.author).init();

// Update entity values
wrap(book).assign({ title: 'New Title' });

// Serialize to plain object
const dto = wrap(book).toObject();
```

## `wrap()` vs `BaseEntity`

There are two ways to access these helper methods:

**1. Using `wrap()` helper** - keeps your entity class clean:

<Tabs
groupId="entity-def"
defaultValue="define-entity-class"
values={[
{label: 'defineEntity + class', value: 'define-entity-class'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="define-entity-class">

```ts title="./entities/Book.ts"
import { defineEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

<TabItem value="define-entity">

```ts title="./entities/Book.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});
```

```ts
// Access helpers via wrap()
wrap(book).assign({ title: 'New Title' });
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}
```

```ts
// Access helpers via wrap()
wrap(book).assign({ title: 'New Title' });
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Book.ts"
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}
```

```ts
// Access helpers via wrap()
wrap(book).assign({ title: 'New Title' });
```

</TabItem>
</Tabs>

**2. Extending `BaseEntity`** - methods available directly on the entity:

<Tabs
groupId="entity-def"
defaultValue="define-entity-class"
values={[
{label: 'defineEntity + class', value: 'define-entity-class'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
]
}
>
  <TabItem value="define-entity-class">

```ts title="./entities/Book.ts"
import { defineEntity, p, BaseEntity } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  extends: BaseEntity,
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

<TabItem value="define-entity">

```ts title="./entities/Book.ts"
import { defineEntity, p, BaseEntity } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  extends: BaseEntity,
  properties: {
    id: p.integer().primary(),
    title: p.string(),
  },
});
```

```ts
// Access helpers directly
book.assign({ title: 'New Title' });
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Book extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}
```

```ts
// Access helpers directly
book.assign({ title: 'New Title' });
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Book.ts"
import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Book extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}
```

```ts
// Access helpers directly
book.assign({ title: 'New Title' });
```

</TabItem>
</Tabs>

Choose based on whether you want to keep your entity interface clean (`wrap()`) or prefer the convenience of direct method access (`BaseEntity`).

## Available Methods

### State Methods

| Method | Description |
|--------|-------------|
| `isInitialized()` | Returns `true` if the entity is fully loaded (not just a reference) |
| `isManaged()` | Returns `true` if the entity is tracked by an EntityManager |
| `populated(flag?)` | Marks the entity as populated (or not) |

```ts
const author = em.getReference(Author, 1);
wrap(author).isInitialized(); // false - just a reference

await wrap(author).init();
wrap(author).isInitialized(); // true - now loaded
```

### Loading Methods

| Method | Description |
|--------|-------------|
| `init(populated?, populate?, lockMode?)` | Loads the entity from the database |
| `populate(populate, options?)` | Loads specified relations |

```ts
// Load an uninitialized reference
const author = em.getReference(Author, 1);
await wrap(author).init();

// Load specific relations
const book = await em.findOne(Book, 1);
await wrap(book).populate(['author', 'tags']);
```

### Serialization Methods

| Method | Description |
|--------|-------------|
| `toObject(ignoreFields?)` | Converts entity to a plain object |
| `toJSON()` | Same as `toObject()`, used by `JSON.stringify()` |
| `toPOJO()` | Same as `toObject()` |
| `serialize(options?)` | Converts to plain object with more control |
| `setSerializationContext(options?)` | Sets the serialization context for subsequent serialization |

See [Serializing](./serializing.md) for detailed serialization options.

```ts
const book = await em.findOne(Book, 1, { populate: ['author'] });

// Basic serialization
const dto = wrap(book).toObject();

// With options
const dto2 = wrap(book).serialize({
  populate: ['author'],
  exclude: ['createdAt'],
});
```

### Reference Methods

| Method | Description |
|--------|-------------|
| `toReference()` | Wraps the entity in a `Reference` wrapper |

```ts
const author = await em.findOne(Author, 1);
book.author = wrap(author).toReference();
```

### Schema Methods

| Method | Description |
|--------|-------------|
| `getSchema()` | Returns the entity's schema name |
| `setSchema(schema?)` | Sets the entity's schema name |

### Accessing Internal Properties

To access internal properties like `__meta` or `__em`, pass `true` as the second argument:

```ts
// Public API only
wrap(author);

// Include internal properties
wrap(author, true).__meta;
wrap(author, true).__em;
```

## Updating Entities with `assign()`

The `assign()` method is one of the most commonly used helpers. It updates entity values from plain objects, automatically handling relations by converting IDs to references.

### Basic Usage

Without `assign()`, updating relations requires manual reference creation:

```ts
const book = await em.findOne(Book, 1);
book.title = 'New Title';
book.author = em.getReference(Author, authorId);
```

With `assign()`, you can pass plain data including relation IDs:

```ts
wrap(book).assign({
  title: 'New Title',
  author: authorId, // automatically converted to reference
});
```

This is particularly useful when handling user input or API payloads:

```ts
// Express route handler
app.patch('/books/:id', async (req, res) => {
  const book = await em.findOneOrFail(Book, req.params.id);
  wrap(book).assign(req.body);
  await em.flush();
  res.json(book);
});
```

### Assigning to Unmanaged Entities

For entities not yet managed by an EntityManager, pass `em` in the options:

```ts
const book = new Book();
wrap(book).assign({
  title: 'New Book',
  author: authorId,
}, { em });
```

### Merging Object Properties

By default, `assign()` replaces object properties (like `Object.assign()`). Enable deep merging with `mergeObjectProperties`:

```ts
book.meta = { foo: 1, bar: 2 };

// Without merging - replaces the object
wrap(book).assign({ meta: { foo: 3 } });
console.log(book.meta); // { foo: 3 }

// With merging - deep merges
wrap(book).assign({ meta: { foo: 3 } }, { mergeObjectProperties: true });
console.log(book.meta); // { foo: 3, bar: 2 }
```

Embedded properties are merged by default. Disable with `mergeEmbeddedProperties: false`.

### Updating Nested Relations

To update a nested entity, include its primary key in the data **and** ensure it's loaded in the current context:

```ts
const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });

// Update the existing author
wrap(book).assign({
  author: {
    id: book.author.id,
    name: 'Updated Name',
  },
});
```

Without the primary key, the nested object is treated as a new entity (triggers `INSERT`):

```ts
// Creates a NEW author
wrap(book).assign({
  author: {
    name: 'New Author',
  },
});
```

Use `updateByPrimaryKey: false` to update existing relations without providing the PK:

```ts
wrap(book).assign({
  author: {
    name: 'Updated Name',
  },
}, { updateByPrimaryKey: false });
```

### Updating Collections

Pass an array to replace collection items, or a single item to append:

```ts
// Replace all addresses
wrap(user).assign({ addresses: [new Address(...), new Address(...)] });

// Append to existing addresses
wrap(user).assign({ addresses: new Address(...) });
```

### Using Class-Based DTOs

When using validation libraries like `class-validator`, extend `PlainObject` to let MikroORM treat your DTO as a plain object:

```ts
import { PlainObject } from '@mikro-orm/core';

class UpdateBookDTO extends PlainObject {

  @IsString()
  title!: string;

  @IsNumber()
  authorId!: number;

}

// dto is an instance of UpdateBookDTO
wrap(book).assign(dto);
```

### `assign()` Options

| Option | Default | Description |
|--------|---------|-------------|
| `updateNestedEntities` | `true` | Process nested relation objects |
| `updateByPrimaryKey` | `true` | Require PK to update existing relations |
| `mergeObjectProperties` | `false` | Deep merge JSON/object properties |
| `mergeEmbeddedProperties` | `true` | Deep merge embedded properties |
| `onlyProperties` | `false` | Ignore unknown properties in payload |
| `onlyOwnProperties` | `false` | Skip inverse relations, convert others to FKs |
| `convertCustomTypes` | `false` | Allow raw database values for custom types |
| `ignoreUndefined` | `false` | Skip `undefined` properties |
| `merge` | `false` | Use `em.merge()` instead of `em.create()` for new relations |
| `schema` | (inferred) | Schema for looking up relation entities |
| `em` | (inferred) | EntityManager instance (required for unmanaged entities) |

### Global Configuration

Configure default `assign()` behavior in your ORM config:

```ts
await MikroORM.init({
  assign: {
    updateNestedEntities: true,
    updateByPrimaryKey: true,
    mergeObjectProperties: false,
    mergeEmbeddedProperties: true,
  },
});
```
