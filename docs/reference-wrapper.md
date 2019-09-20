---
---

# Better Type-safety with `Reference<T>` Wrapper

When you define `@ManyToOne` and `@ManyToMany` properties on your entity, TypeScript compiler
will think that desired entities are always loaded:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id: number;

  @ManyToOne()
  author: Author;

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

```typescript
import { Entity, IdentifiedReference, ManyToOne, PrimaryKey, Reference } from 'mikro-orm';

@Entity()
export class Book {

  @PrimaryKey()
  id: number;

  @ManyToOne()
  author: IdentifiedReference<Author>;

  constructor(author: Author) {
    this.author = Reference.create(author);
  }

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author instanceof Reference); // true
console.log(book.author.isInitialized()); // false
console.log(book.author.name); // type error, there is no `name` property
console.log(book.author.unwrap().name); // undefined as author is not loaded
console.log((await book.author.load()).name); // ok, loading the author first
```

## Assigning to Reference Properties

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

## What is IdentifiedReference?

`IdentifiedReference` is an intersection type that adds primary key property to the `Reference` 
interface. It allows to get the primary key from `Reference` instance directly.

By default it defines the PK property as `id`, you can override this via second generic type
argument.

```typescript
const book = await orm.em.findOne(Book, 1);
console.log(book.author.id); ok, returns the PK
```

You can also have non-standard primary key like `uuid`:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id: number;

  @ManyToOne()
  author: IdentifiedReference<Author, 'uuid'>;

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author.uuid); ok, returns the PK
```

For MongoDB, defined the PK generic type argument as `'id' | '_id'` to access both `string` 
and `ObjectId` PK values:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectId;

  @ManyToOne()
  author: IdentifiedReference<Author, 'id' | '_id'>;

}

const book = await orm.em.findOne(Book, 1);
console.log(book.author.id); ok, returns string PK
console.log(book.author._id); ok, returns ObjectId PK
```

> As opposed to `IEntity.init()` which always refreshes the entity, `Reference.load()` 
> method will query the database only if the entity is not already loaded in Identity Map. 
