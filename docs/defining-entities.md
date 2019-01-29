# Defining entities

Entities are simple javascript objects (so called POJO), decorated with `@Entity` decorator.
No real restrictions are made, you do not have to extend any base class, you are more than welcome
to [use entity constructors](entity-constructors.md), just do not forget to specify primary key with
`@PrimaryKey` decorator.

**`./entities/Book.ts`**

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title: string;

  @ManyToOne() // when you provide correct type hint, ORM will read it for you
  author: Author;

  @ManyToOne({ entity: () => Publisher }) // or you can specify the entity as class reference or string name
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag.name, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity { }
```

You will need to extend Book's interface with `IEntity` or your entity must extend BaseEntity
which does that for you. `IEntity` interface represents internal methods added to your entity's 
prototype via `@Entity` decorator.

As you can see, entity properties are decorated either with `@Property` decorator, or with one
of reference decorators: `@ManyToOne`, `@OneToMany` and `@ManyToMany`. 

Here is another example of `Author` entity, that was referenced from the `Book` one:

**`./entities/Author.ts`**

```typescript
@Entity()
export class Author {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  age: number;

  @Property()
  termsAccepted = false;

  @Property()
  identities: string[];

  @Property()
  born: Date;

  @OneToMany({ entity: () => Book, fk: 'author' })
  books = new Collection<Book>(this);

  @ManyToOne()
  favouriteBook: Book;

  version: number;
  versionAsString: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

export interface Author extends IEntity { }
```

More information about how collections work can be found on [collections page](collections.md).

## Using BaseEntity

MikroORM provides `BaseEntity` abstract class that you can extend your entities from. It comes
with 2 main benefits:

1. you do not have to initialize collections yourself
2. you do not have to re-export your entity as interface that extends `IEntity`

Here is third example of entity that extends the `BaseEntity` class:

**`./entities/BookTag.ts`**

```typescript
@Entity()
export class BookTag extends BaseEntity {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  @ManyToMany({ entity: () => Book.name, mappedBy: 'tags' })
  books: Collection<Book>;

  constructor(name: string) {
    super();
    this.name = name;
  }

}
```

You are free to mix those two approaches as they are equivalent. Although it is generally good 
idea to stick to one pattern and rather be consistent.

## Note about SQL drivers and @PrimaryKey

All entities described above were defined with `_id: ObjectID` primary key - those were Mongo
entities. 

For SQL drivers, you will want to define your primary key as `id: number` instead:

```typescript
@PrimaryKey()
id: number;
```

With your entities set up, you can start [using entity manager](entity-manager.md) and 
[repositories](repositories.md) as described in following sections. 

[&larr; Back to table of contents](index.md#table-of-contents)
