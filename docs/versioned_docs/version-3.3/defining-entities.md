---
title: Defining Entities
---

There are two ways how you can define your entities:

- Decorated classes
- `EntitySchema` helper

# EntitySchema helper

With `EntitySchema` helper you define the schema programmatically. 

```typescript title="./entities/Book.ts"
export interface Book extends BaseEntity {
  title: string;
  author: Author;
  publisher: Publisher;
  tags: Collection<BookTag>;
}

export const schema = new EntitySchema<Book, BaseEntity>({
  name: 'Book',
  extends: 'BaseEntity',
  properties: {
    title: { type: 'string' },
    author: { reference: 'm:1', entity: 'Author', inversedBy: 'books' },
    publisher: { reference: 'm:1', entity: 'Publisher', inversedBy: 'books' },
    tags: { reference: 'm:n', entity: 'BookTag', inversedBy: 'books', fixedOrder: true },
  },
});
```

When creating new entity instances, you will need to use `em.create()` method that will
create instance of internally created class. 

```typescript
const repo = em.getRepository<Author>('Author');
const author = repo.create('Author', { name: 'name', email: 'email' }); // instance of internal Author class
await repo.persistAndFlush(author);
```

You can optionally use custom class for entity instances. Read more about this approach 
in [Defining Entities via EntitySchema section](entity-schema.md).

# Classes and Decorators

Entities are simple javascript objects (so called POJO), decorated with `@Entity` decorator.
No real restrictions are made, you do not have to extend any base class, you are more than welcome
to [use entity constructors](entity-constructors.md), just do not forget to specify primary key with
`@PrimaryKey` decorator.

```typescript title="./entities/Book.ts"
@Entity()
export class Book implements IdEntity<Book> {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title!: string;

  @ManyToOne() // when you provide correct type hint, ORM will read it for you
  author!: Author;

  @ManyToOne(() => Publisher) // or you can specify the entity as class reference or string name
  publisher?: Publisher;

  @ManyToMany() // owning side can be simple as this!
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}
```

You will need to mark the entity by implementing one of `*Entity` interfaces:

- `IdEntity<T>` for numeric/string PK on `id` property (`id: number`)
- `UuidEntity<T>` for string PK on `uuid` property (`uuid: string`)
- `MongoEntity<T>` for mongo, where `id: string` and `_id: ObjectId` are required
- `AnyEntity<T, PK>` for other possible properties (fill the PK property name to `PK` 
parameter, e.g.: `AnyEntity<Book, 'myPrimaryProperty'>'`)

As you can see, entity properties are decorated either with `@Property` decorator, or with one
of reference decorators: `@ManyToOne`, `@OneToMany`, `@OneToOne` and `@ManyToMany`. 

> From v3 you can also use default exports when defining your entity.

Here is another example of `Author` entity, that was referenced from the `Book` one, this 
time defined for mongo:

```typescript title="./entities/Author.ts"
@Entity()
export class Author implements MongoEntity<Author> {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  name!: string;

  @Property()
  email!: string;

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

  @ManyToMany()
  friends = new Collection<Author>(this);

  @ManyToOne()
  favouriteBook?: Book;

  @Property({ version: true })
  version!: number;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}
```

More information about modelling relationships can be found on [modelling relationships page](relationships.md).

If you want to define your entity in Vanilla JavaScript, take a look [here](usage-with-js.md).

### Optional Properties

When you define the property as optional (marked with `?`), this will be automatically considered
as nullable property (mainly for SQL schema generator). 

> This auto-detection works only when you omit the `type`/`entity` attribute.

```typescript
@ManyToOne()
favouriteBook?: Book; // correct: no `type` or `entity` provided, **will** be marked as `nullable`

@ManyToOne(() => Book, { nullable: true })
favouriteBook?: Book; // correct, `entity` provided and explicitly marked as `nullable`

@ManyToOne(() => Book)
favouriteBook?: Book; // wrong, not marked as `nullable`
```

### Default values

You can set default value of a property in 2 ways:

1. Use runtime default value of the property. This approach should be preferred as long 
as you are not using any native database function like `now()`. With this approach your
entities will have the default value set even before it is actually persisted into the 
database (e.g. when you instantiate new entity via `new Author()` or `em.create(Author, { ... })`.

  ```typescript
  @Property()
  foo!: number = 1;

  @Property()
  bar!: string = 'abc';

  @Property()
  baz!: Date = new Date();
  ``` 

2. Use `default` parameter of `@Property` decorator. This way the actual default value 
will be provided by the database, and automatically mapped to the entity property after
it is being persisted (after flush). Also note that with this approach, you need to wrap
string default values in quotes as without quoting the value is considered a function.

  ```typescript
  @Property({ default: 1 })
  foo!: number;

  @Property({ default: "'abc'" })
  bar!: string;

  @Property({ default: 'now' })
  baz!: Date;
  ``` 

### Enums

To define enum property, use `@Enum()` decorator. Enums can be either numeric or string valued. 

For schema generator to work properly in case of string enums, you need to define the enum 
is same file as where it is used, so its values can be automatically discovered. If you want 
to define the enum in another file, you should reexport it also in place where you use it. 

> You can also set enum items manually via `items: string[]` attribute.  

```typescript
@Entity()
export class User implements IdEntity<User> {

  @Enum()
  role!: UserRole; // string enum

  @Enum()
  status!: UserStatus; // numeric enum

}

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

export const enum UserStatus {
  DISABLED,
  ACTIVE,
}
``` 

## Indexes

You can define indexes via `@Index()` decorator, for unique indexes, use `@Unique()` decorator. 
You can use it either on entity class, or on entity property:

```typescript
@Entity()
@Index({ properties: ['name', 'age'] }) // compound index, with generated name
@Index({ name: 'custom_idx_name', properties: ['name'] }) // simple index, with custom name
@Unique({ properties: ['name', 'email'] })
export class Author implements IdEntity<Author> {

  @Property()
  @Unique()
  email!: string;

  @Property()
  @Index() // generated name
  age?: number;

  @Index({ name: 'born_index' })
  @Property()
  born?: Date;

}
```

## Custom Types

You can define custom types by extending `Type` abstract class. It has 4 optional methods:

- `convertToDatabaseValue(value: any, platform: Platform): any`

  Converts a value from its JS representation to its database representation of this type.

- `convertToJSValue(value: any, platform: Platform): any`

  Converts a value from its database representation to its JS representation of this type.

- `toJSON(value: any, platform: Platform): any`

  Converts a value from its JS representation to its serialized JSON form of this type.
  By default converts to the database value.
  
- `getColumnType(prop: EntityProperty, platform: Platform): string`

  Gets the SQL declaration snippet for a field of this type.

More information can be found in [Custom Types](custom-types.md) section.

## Virtual Properties

You can define your properties as virtual, either as a method, or via JavaScript `get/set`.

Following example defines User entity with `firstName` and `lastName` database fields, that 
are both hidden from the serialized response, replaced with virtual properties `fullName` 
(defined as a classic method) and `fullName2` (defined as a JavaScript getter).

> For JavaScript getter you need to provide `{ persist: false }` option otherwise the value
> would be stored in the database. 

```typescript
@Entity()
export class User implements IdEntity<User> {

  @Property({ hidden: true })
  firstName!: string;

  @Property({ hidden: true })
  lastName!: string;

  @Property({ name: 'fullName' })
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  @Property({ persist: false })
  get fullName2() {
    return `${this.firstName} ${this.lastName}`;
  }

}

const repo = em.getRepository(User);
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

```typescript title="./entities/BaseEntity.ts"
import { v4 } from 'uuid';

export abstract class BaseEntity implements UuidEntity<BaseEntity> {

  @PrimaryKey()
  uuid = v4();

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

## Examples of entity definition with various primary keys

### Using id as primary key (SQL drivers)

```typescript
@Entity()
export class Book implements IdEntity<Book> {

  @PrimaryKey()
  id!: number; // string is also supported

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

### Using UUID as primary key (SQL drivers)

```typescript
import { v4 } from 'uuid';

@Entity()
export class Book implements UuidEntity<Book> {

  @PrimaryKey()
  uuid = v4();

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

### Example of Mongo entity

```typescript
@Entity()
export class Book implements MongoEntity<Book> {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey() 
  id!: string; // string variant of PK, will be handled automatically

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

### Using WrappedEntity interface

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}

export interface Book extends WrappedEntity<Book, 'id'> { };
```

With your entities set up, you can start [using entity manager](entity-manager.md) and 
[repositories](repositories.md) as described in following sections. 
