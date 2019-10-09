---
---

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
  _id: ObjectId;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title: string;

  @ManyToOne() // when you provide correct type hint, ORM will read it for you
  author: Author;

  @ManyToOne(() => Publisher) // or you can specify the entity as class reference or string name
  publisher?: Publisher;

  @ManyToMany(() => BookTag, tag => tag.books, { owner: true })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity<string> { }
```

You will need to extend Book's interface with `IEntity`. The interface represents internal 
methods added to your entity's prototype via `@Entity` decorator.

> `IEntity` is generic interface, its type parameter depends on data type of normalized primary
> key produced by used driver. SQL drivers usually use `number` and Mongo driver uses `string`.
> This type default to union type `number | string`. Keep in mind that you have to worry about 
> this only when you define your primary key as `_id` instead of `id`.

As you can see, entity properties are decorated either with `@Property` decorator, or with one
of reference decorators: `@ManyToOne`, `@OneToMany`, `@OneToOne` and `@ManyToMany`. 

Here is another example of `Author` entity, that was referenced from the `Book` one:

**`./entities/Author.ts`**

```typescript
@Entity()
export class Author {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  age?: number;

  @Property()
  termsAccepted = false;

  @Property()
  identities?: string[];

  @Property()
  born?: Date;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @ManyToOne()
  favouriteBook: Book;

  @Property({ version: true })
  version: number;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

export interface Author extends IEntity { }
```

More information about modelling relationships can be found on [modelling relationships page](relationships.md).

If you want to define your entity in Vanilla JavaScript, take a look [here](usage-with-js.md).

### Optional Properties

When you define the property as optional (marked with `?`), this will be automatically considered
as nullable property (mainly for SQL schema generator). 

> This auto-detection works only when you omit the `type` attribute.

## Virtual Properties

You can define your properties as virtual, either as a method, or via JavaScript `get/set`.

Following example defines User entity with `firstName` and `lastName` database fields, that 
are both hidden from the serialized response, replaced with virtual properties `fullName` 
(defined as a classic method) and `fullName2` (defined as a JavaScript getter).

> For JavaScript getter you need to provide `{ persist: false }` option otherwise the value
> would be stored in the database. 

```typescript
@Entity()
export class User {

  @Property({ hidden: true })
  firstName: string;

  @Property({ hidden: true })
  lastName: string;

  @Property({ name: 'fullName' })
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  @Property({ persist: false })
  get fullName2() {
    return `${this.firstName} ${this.lastName}`;
  }

}

const repo = orm.em.getRepository(User);
const author = repo.create({ firstName: 'Jon', lastName: 'Snow' });

console.log(author.getFullName()); // 'Jon Snow'
console.log(author.fullName2); // 'Jon Snow'
console.log(author.toJSON()); // { fullName: 'Jon Snow', fullName2: 'Jon Snow' }
```

## Entity file names

You are free to choose one of those formats for entity filename (for a `BookTag` entity):

- `BookTag.ts`
- `BookTag.model.ts`
- `book-tag.ts`
- `book-tag.model.ts`
- `book-tag.entity.ts`

Entity name is inferred from the first part of file name before first dot occurs, so you can 
add any suffix behind the dot, not just `.model.ts` or `.entity.ts`. 

> You can change this behaviour by defining custom `NamingStrategy.getClassName()` method.

## Using BaseEntity

You can define your own base entity with properties that you require on all entities, like
primary key and created/updated time. 

> If you are initializing the ORM via `entities` option, you need to specify all your
> base entities as well.

**`./entities/BaseEntity.ts`**

```typescript
export abstract class BaseEntity {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

## Note about SQL drivers and @PrimaryKey

All entities described above were defined with `_id: ObjectId` primary key - those were Mongo
entities. 

For SQL drivers, you will want to define your primary key as `id: number` instead:

```typescript
@PrimaryKey()
id: number;
```

With your entities set up, you can start [using entity manager](entity-manager.md) and 
[repositories](repositories.md) as described in following sections. 

[&larr; Back to table of contents](index.md#table-of-contents)
