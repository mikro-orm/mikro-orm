---
title: Type-Safe Relations
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Entity relations are mapped to entity references - instances of the entity that have at least the primary key available. This reference is stored in the identity map, so you will get the same object reference when fetching the same document from the database.

```ts
@ManyToOne(() => Author)
author!: Author;
```

The problem with this approach is that TypeScript has no way of knowing whether the relation is loaded or not. The `author` property is always typed as `Author`, even when it's just an uninitialized reference.

```ts
const book = await em.findOne(Book, 1);
console.log(book.author instanceof Author); // true
console.log(wrap(book.author).isInitialized()); // false
console.log(book.author.name); // undefined - Author is not loaded!
```

MikroORM provides several tools to make working with relations type-safe:

- **`Reference` wrapper** - wraps relations to distinguish between loaded and unloaded state
- **`Loaded` type** - tracks which relations are populated at the type level
- **`$` accessor** - provides type-safe synchronous access to loaded relations

## `Reference` Wrapper

The `Reference` wrapper wraps an entity reference and provides methods to safely access it:

- `load(): Promise<T>` - loads the entity if not already loaded
- `unwrap(): T` - returns the underlying entity (unsafe, may be uninitialized)
- `isInitialized(): boolean` - checks if the entity is loaded
- `getEntity(): T` - returns the entity, throws if not initialized
- `$` or `get()` - synchronous access (only available when loaded)

### Defining References

Use the `Ref<T>` type and `ref: true` option to define a reference property:

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
    author: p.manyToOne(() => Author).ref(),
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
    author: () => p.manyToOne(Author).ref(),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { Entity, Ref, ManyToOne, PrimaryKey, ref } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  constructor(author: Author) {
    this.author = ref(author);
  }

}
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Book.ts"
import { Entity, Ref, ManyToOne, PrimaryKey, ref } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author: Ref<Author>;

  constructor(author: Author) {
    this.author = ref(author);
  }

}
```

</TabItem>
</Tabs>

### Using References

```ts
const book = await em.findOne(Book, 1);

// The reference is not loaded yet
book.author;                    // Ref<Author>
book.author.isInitialized();    // false
book.author.id;                 // OK - PK is always available
book.author.name;               // TS error - no 'name' on Ref<Author>

// Load the reference
const author = await book.author.load();
author.name;                    // OK - now it's loaded

// Or load and access a specific property
const name = await book.author.load('name');
```

When the relation is populated, you get a `LoadedReference` which allows synchronous access via `$`:

```ts
const book = await em.findOne(Book, 1, { populate: ['author'] });

book.author;                    // LoadedReference<Author>
book.author.$.name;             // OK - type-safe synchronous access
book.author.get().name;         // same as above, alternative syntax
```

### Reference Methods

| Method | Description |
|--------|-------------|
| `load()` | Loads the entity, returns `Promise<T>` |
| `load(prop)` | Loads the entity and returns the specified property |
| `unwrap()` | Returns the underlying entity (unsafe) |
| `isInitialized()` | Returns `true` if the entity is loaded |
| `getEntity()` | Returns the entity, throws if not initialized |
| `getProperty(prop)` | Returns a property, throws if not initialized |
| `$` / `get()` | Synchronous access (only on `LoadedReference`) |

```ts
const book = await em.findOne(Book, 1);

// These throw if not initialized
book.author.getEntity();           // Error: Reference<Author> not initialized
book.author.getProperty('name');   // Error: Reference<Author> not initialized

// Load first, then access synchronously
await book.author.load();
book.author.getEntity().name;      // OK
book.author.getProperty('name');   // OK
```

> Unlike `wrap(entity).init()` which always refreshes from the database, `Reference.load()` only queries if the entity is not already in the Identity Map.

## `LazyRef<T>` — type-only reference

When you want **compile-time populate-state safety** without the `.$` / `.get()` indirection that `Reference` requires, use `LazyRef<T>`. It is a **type-only** marker — at runtime the property holds the entity instance directly (same as a plain relation without `ref: true`), but TypeScript restricts access to the primary key until `Loaded<>` narrows it.

```ts
@ManyToOne(() => Author)
author!: LazyRef<Author>;
```

Or with `defineEntity`:

```ts
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    author: () => p.manyToOne(AuthorSchema).lazyRef(),
  },
});
```

### Semantics

| | `LazyRef<T>` | `Ref<T>` |
|---|---|---|
| Runtime value | entity instance (stub or hydrated) | `Reference` wrapper |
| `instanceof T` (runtime) | `true` | `false` |
| Access unloaded PK | `ref.id` ✅ | `ref.id` ✅ |
| Access unloaded non-PK | compile error ✅ | compile error ✅ |
| Access loaded prop | `loaded.author.name` (no `.$`) | `loaded.author.$.name` |
| `load()` / `loadOrFail()` method | ❌ — use `Loadable` mixin on the target | ✅ built-in |

> **Note on `instanceof`**: the table's `instanceof T` row is about the runtime JS check — `book.author instanceof Author` returns `true` at runtime. TypeScript's control-flow narrowing through `instanceof`, however, does **not** strip `LazyRef<T>`'s brand, so `if (book.author instanceof Author) { /* book.author.name is still a compile error here */ }` still won't give you full entity access. Use `unref()` or `Loaded<>` narrowing for compile-time access.

### Usage

```ts
const book = await em.findOneOrFail(Book, 1);
book.author.id;     // ok — PK is always accessible
book.author.name;   // compile error — not loaded

const loaded = await em.findOneOrFail(Book, 1, { populate: ['author'] });
loaded.author.name; // ok — Loaded<Book, 'author'> narrows LazyRef<Author> to Author
```

> **Scope**: `LazyRef<T>` is for to-one relations only (`@ManyToOne`, `@OneToOne`). Collections already have their own indirection via `Collection<T>`.
>
> **Caveat**: the safety is purely compile-time. JS code, `as any` casts, or code paths that bypass `Loaded<>` can freely read any property at runtime — and on an *unpopulated* relation (a stub with only the PK set) those reads will return `undefined`. If the relation has already been populated, the underlying entity is fully hydrated and reads behave normally; the caveat applies only to the stub case. Same footgun as plain non-`Ref` relations.
>
> **Type performance**: `LazyRef<T>` adds one conditional branch in the `Loaded<>` / `AutoPath` narrowing paths. The cost is comparable to `Ref<T>` (in fact slightly cheaper for loaded narrowing, since no `LoadedReference` intersection is produced). See `tests/bench/types/lazy-ref.ts` for measurements.

### `unref()` — escape hatch when you can't thread `Loaded<>` through

When you know a relation is populated but the surrounding code is typed as bare `Book` rather than `Loaded<Book, 'author'>`, use `unref()` to narrow a `LazyRef<T>` (or `Ref<T>`) back to `T`.

```ts
import { unref } from '@mikro-orm/core';

function logAuthor(book: Book) {
  // `book.author` is `LazyRef<Author>` — `.name` would be a compile error
  console.log(unref(book.author).name);
}
```

`unref()` is the inverse of `ref()` and works on any of:

- `Ref<T>` / `Reference<T>` (entity) — calls `.unwrap()`, returns `T`
- `LazyRef<T>` — identity cast at runtime (the underlying value is already `T`), returns `T`
- plain `T` — passthrough, returns `T`
- `ScalarReference<V>` / `ScalarRef<V>` — calls `.unwrap()`, returns `V | undefined` (the scalar may be unbound)
- `null` / `undefined` — passthrough

Like a plain `as` cast, `unref()` is a compile-time narrowing only for entity relations — if the entity is a stub that was never populated, non-PK properties are still `undefined` at runtime. Use it when you're confident the relation is loaded; prefer threading `Loaded<>` through signatures when you can.

## `Loadable` mixin — `load()` / `loadOrFail()` on entities

If you are using plain relations or `LazyRef<T>` and want the `load()` / `loadOrFail()` ergonomics that `Reference` provides on the wrapper, opt into the `Loadable` mixin on your entity class. It adds the two methods to the entity prototype so you can call them directly on the relation target.

```ts
import { BaseEntity, Loadable, LoadableBaseEntity } from '@mikro-orm/core';

// convenience: BaseEntity pre-composed with the mixin
class User extends LoadableBaseEntity {
  // ...
}

// standalone — no inherited base
class Product extends Loadable() {
  // ...
}

// or compose with your own base class
class Article extends Loadable(MyBase) {
  // ...
}

const user = orm.em.getReference(User, 1);
const loaded = await user.load();          // Promise<User | null>
const loadedOrThrows = await user.loadOrFail(); // Promise<User>
```

Opt-in by design: `BaseEntity` itself does **not** gain these methods, so entities with existing `load` / `loadOrFail` properties are unaffected.

## `Loaded` Type

The `Loaded<Entity, Hints>` type tracks which relations are populated at compile time. All `em.find*` methods return this type:

```ts
// Type: Loaded<User, never>[]
const users = await em.find(User, {});

// Type: Loaded<User, 'identity' | 'friends'>[]
const usersWithRelations = await em.find(User, {}, {
  populate: ['identity', 'friends'],
});
```

Given the following `User` entity:

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

```ts title="./entities/User.ts"
import { defineEntity, p } from '@mikro-orm/core';

const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    identity: p.manyToOne(() => Identity).ref(),
    friends: p.manyToMany(() => User),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

<TabItem value="define-entity">

```ts title="./entities/User.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    identity: () => p.manyToOne(Identity).ref(),
    friends: () => p.manyToMany(User),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
import { Entity, PrimaryKey, ManyToOne, ManyToMany, Collection, Ref, ref } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Identity, { ref: true })
  identity: Ref<Identity>;

  @ManyToMany(() => User)
  friends = new Collection<User>(this);

  constructor(identity: Identity) {
    this.identity = ref(identity);
  }

}
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/User.ts"
import { Entity, PrimaryKey, ManyToOne, ManyToMany, Collection, Ref, ref } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  identity: Ref<Identity>;

  @ManyToMany(() => User)
  friends = new Collection<User>(this);

  constructor(identity: Identity) {
    this.identity = ref(identity);
  }

}
```

</TabItem>
</Tabs>

### Type-Safe Access with `$`

When a relation is in the `Loaded` hints, you can access it synchronously via the `$` symbol:

```ts
// Type: Loaded<User, 'identity'>
const user = await em.findOneOrFail(User, 1, { populate: ['identity'] });

// Type-safe synchronous access
console.log(user.identity.$.email);
```

Without the populate hint, accessing `$` is a compile error:

```ts
// Type: Loaded<User, never>
const user = await em.findOneOrFail(User, 1);

// TS Error: Property '$' does not exist on type 'Ref<Identity>'
console.log(user.identity.$.email);
```

> If you don't like symbols with magic names like `$`, you can use the `get()` method, which is an alias for it.

### Using `Loaded` in Function Signatures

You can require populated relations in your function parameters:

```ts
function sendWelcomeEmail(user: Loaded<User, 'identity'>) {
  // Type-safe - identity is guaranteed to be loaded
  const email = user.identity.$.email;
  mailer.send(email, 'Welcome!');
}

// Works - identity is populated
const user1 = await em.findOneOrFail(User, 1, { populate: ['identity'] });
sendWelcomeEmail(user1);

// Compile error - identity not populated
const user2 = await em.findOneOrFail(User, 1);
sendWelcomeEmail(user2);
```

### Collections

The `$` accessor also works with `Collection`:

```ts
// Type: Loaded<User, 'friends'>
const user = await em.findOneOrFail(User, 1, { populate: ['friends'] });

// Type-safe iteration over loaded collection
for (const friend of user.friends.$) {
  console.log(friend.email);
}
```

> Note: `Loaded` is purely a compile-time construct. You can bypass it with type assertions, but this defeats the purpose of type safety.

## Assigning References

When assigning to a `Ref<T>` property, you need to wrap the entity:

```ts
import { ref } from '@mikro-orm/core';

const book = await em.findOne(Book, 1);

// Using ref() helper
book.author = ref(someAuthor);

// Using getReference with wrapped option
book.author = em.getReference(Author, 2, { wrapped: true });

// Using toReference()
book.author = wrap(someAuthor).toReference();
```

> `ref(e)` is a shortcut for `wrap(e).toReference()`, which is the same as `Reference.create(e)`.

### Creating References Without EntityManager

You can create references inside entity constructors using `rel()`:

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
import { defineEntity, p, rel } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: p.manyToOne(() => Author).ref(),
  },
});

// Usage: create book with author reference
const book = em.create(Book, { author: rel(Author, authorId) });

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

<TabItem value="define-entity">

```ts title="./entities/Book.ts"
import { defineEntity, p, rel } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).ref(),
  },
});

// Usage: create book with author reference
const book = em.create(Book, { author: rel(Author, authorId) });
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { Entity, ManyToOne, PrimaryKey, Ref, rel } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

  constructor(authorId: number) {
    this.author = rel(Author, authorId);
  }

}
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Book.ts"
import { Entity, ManyToOne, PrimaryKey, Ref, rel } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: Ref<Author>;

  constructor(authorId: number) {
    this.author = rel(Author, authorId);
  }

}
```

</TabItem>
</Tabs>

Another way is to use `toReference()` method available as part of the [`wrap()` helper](./wrap-helper.md):

```ts
const author = new Author(...);
book.author = wrap(author).toReference();
```

## Primary Key Access

The `Ref<T>` type includes the entity's primary key, allowing direct access without loading:

```ts
const book = await em.findOne(Book, 1);
console.log(book.author.id); // OK - PK is always available
```

MikroORM detects the PK property by checking for `_id`, `uuid`, or `id` in that order. For custom PK names, use the `PrimaryKeyProp` symbol:

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

```ts title="./entities/Author.ts"
import { defineEntity, p } from '@mikro-orm/core';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    myPrimaryKey: p.integer().primary(),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);

// PrimaryKeyProp is inferred automatically with defineEntity
```

  </TabItem>

<TabItem value="define-entity">

```ts title="./entities/Author.ts"
import { defineEntity, p, PrimaryKeyProp } from '@mikro-orm/core';

export const Author = defineEntity({
  name: 'Author',
  properties: {
    myPrimaryKey: p.integer().primary(),
  },
});

// PrimaryKeyProp is inferred automatically with defineEntity
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
import { Entity, PrimaryKey, PrimaryKeyProp } from '@mikro-orm/core';

@Entity()
export class Author {

  @PrimaryKey()
  myPrimaryKey!: number;

  [PrimaryKeyProp]?: 'myPrimaryKey';

}
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Author.ts"
import { Entity, PrimaryKey, PrimaryKeyProp } from '@mikro-orm/core';

@Entity()
export class Author {

  @PrimaryKey()
  myPrimaryKey!: number;

  [PrimaryKeyProp]?: 'myPrimaryKey';

}
```

</TabItem>
</Tabs>

```ts
// Now works with custom PK name
const book = await em.findOne(Book, 1);
console.log(book.author.myPrimaryKey);
```

For MongoDB, both `id` (string) and `_id` (ObjectId) are available:

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
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    author: p.manyToOne(() => Author).ref(),
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
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    author: () => p.manyToOne(Author).ref(),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { Entity, PrimaryKey, SerializedPrimaryKey, ManyToOne, Ref } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

}
```

</TabItem>
<TabItem value="ts-morph">

```ts title="./entities/Book.ts"
import { Entity, PrimaryKey, SerializedPrimaryKey, ManyToOne, Ref } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @ManyToOne()
  author!: Ref<Author>;

}
```

</TabItem>
</Tabs>

```ts
const book = await em.findOne(Book, 1);
console.log(book.author.id);  // string
console.log(book.author._id); // ObjectId
```

## `ScalarReference` Wrapper

For lazy-loaded scalar properties (not relations), use `ScalarRef<T>`:

```ts
@Property({ lazy: true, ref: true })
passwordHash!: Ref<string>;

@Property({ type: 'json', lazy: true, ref: true })
metadata!: ScalarRef<Record<string, unknown>>;
```

```ts
const user = await em.findOne(User, 1);

// Load the lazy scalar
const hash = await user.passwordHash.load();

// Or populate it
const userWithHash = await em.findOne(User, 1, {
  populate: ['passwordHash'],
});
console.log(userWithHash.passwordHash.$);
```

> For primitive types like `string` or `number`, `Ref<T>` automatically resolves to `ScalarReference`. For object types, use `ScalarRef<T>` explicitly.

### Nullable Scalars

When a scalar reference is nullable, the wrapper is always truthy. Check the value after loading:

```ts
@Property({ type: 'json', nullable: true, lazy: true, ref: true })
config!: ScalarRef<Config | null>;
```

```ts
const entity = await em.findOne(Entity, 1, { populate: ['config'] });

// The wrapper exists, but the value might be null
if (entity.config.$) {
  // Safe to use
  console.log(entity.config.$.setting);
}
```
