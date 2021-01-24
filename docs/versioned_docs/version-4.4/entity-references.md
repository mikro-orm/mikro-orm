---
title: Entity References
sidebar_label: Entity References and Reference<T> Wrapper
---

Every single entity relation is mapped to an entity reference. Reference is an entity that has
only its identifier. This reference is stored in identity map so you will get the same object 
reference when fetching the same document from database.

You can call `await wrap(entity).init()` to initialize the entity. This will trigger database call 
and populate itself, keeping the same reference in identity map. 

```typescript
const author = orm.em.getReference('...id...');
console.log(author.id); // accessing the id will not trigger any db call
console.log(author.isInitialized()); // false
console.log(author.name); // undefined

await wrap(author).init(); // this will trigger db call
console.log(author.isInitialized()); // true
console.log(author.name); // defined
```

## Better Type-safety with `Reference<T>` Wrapper

When you define `@ManyToOne` and `@OneToOne` properties on your entity, TypeScript compiler
will think that desired entities are always loaded:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: Author;

  constructor(author: Author) {
    this.author = author;
  }

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author instanceof Author); // true
console.log(book.author.isInitialized()); // false
console.log(book.author.name); // undefined as `Author` is not loaded yet
```

You can overcome this issue by using the `Reference<T>` wrapper. It simply wraps the entity, 
defining `load(): Promise<T>` method that will first lazy load the association if not already
available. You can also use `unwrap(): T` method to access the underlying entity without loading
it.

You can also use `get<K extends keyof T>(prop: K): Promise<T[K]>` helper, that will call `load()` 
for you, making sure the entity is initialized first, then returning the value of given property 
directly. 

```typescript
import { Entity, IdentifiedReference, ManyToOne, PrimaryKey, Reference } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: IdentifiedReference<Author>;

  constructor(author: Author) {
    this.author = Reference.create(author);
  }

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author instanceof Reference); // true
console.log(book.author.isInitialized()); // false
console.log(book.author.name); // type error, there is no `name` property
console.log(book.author.unwrap().name); // undefined as author is not loaded
console.log((await book.author.load('name'))); // ok, loading the author first
console.log((await book.author.load()).name); // ok, author already loaded
console.log(book.author.unwrap().name); // ok, author already loaded
```

There are also `getEntity()` and `getProperty()` methods that are synchronous getters, 
that will first check if the wrapped entity is initialized, and if not, it will throw 
and error.

```typescript
const book = await orm.em.findOne(Book, 1);
console.log(book.author instanceof Reference); // true
console.log(book.author.isInitialized()); // false
console.log(book.author.getEntity()); // Error: Reference<Author> 123 not initialized
console.log(book.author.getProperty('name')); // Error: Reference<Author> 123 not initialized
console.log((await book.author.load('name'))); // ok, loading the author first
console.log(book.author.getProperty('name')); // ok, author already loaded
```

If you use different metadata provider than `TsMorphMetadataProvider` 
(e.g. `ReflectMetadataProvider`), you will also need to explicitly set `wrappedReference` 
parameter:

```typescript
@ManyToOne(() => Author, { wrappedReference: true })
author!: IdentifiedReference<Author>;
```

### Assigning to Reference Properties

When you define the property as `Reference` wrapper, you will need to assign the `Reference`
to it instead of the entity. You can create it via `Reference.create()` factory, or use `wrapped`
parameter of `em.getReference()`:

```typescript
const book = await orm.em.findOne(Book, 1);
const repo = orm.em.getRepository(Author);

book.author = repo.getReference(2, true);

// same as:
book.author = Reference.create(repo.getReference(2));
await orm.em.flush();
```

Another way is to use `toReference()` method available as part of 
[`WrappedEntity` interface](entity-helper.md#wrappedentity-and-wrap-helper):

```typescript
const author = new Author(...)
book.author = wrap(author).toReference();
```

If the reference already exist, you can also re-assign to it via `set()` method:

```typescript
book.author.set(new Author(...));
```

### What is IdentifiedReference?

`IdentifiedReference` is an intersection type that adds primary key property to the `Reference` 
interface. It allows to get the primary key from `Reference` instance directly.

By default it defines the PK property as `id`, you can override this via second generic type
argument.

```typescript
const book = await orm.em.findOne(Book, 1);
console.log(book.author.id); // ok, returns the PK
```

You can also have non-standard primary key like `uuid`:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: IdentifiedReference<Author, 'uuid'>;

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author.uuid); // ok, returns the PK
```

For MongoDB, defined the PK generic type argument as `'id' | '_id'` to access both `string` 
and `ObjectId` PK values:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @ManyToOne()
  author!: IdentifiedReference<Author, 'id' | '_id'>;

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author.id); // ok, returns string PK
console.log(book.author._id); // ok, returns ObjectId PK
```

> As opposed to `EntityHelper.init()` which always refreshes the entity, `Reference.load()` 
> method will query the database only if the entity is not already loaded in Identity Map. 
