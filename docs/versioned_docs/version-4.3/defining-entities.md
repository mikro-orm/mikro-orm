---
title: Defining Entities
---

There are two ways how you can define your entities:

- Decorated classes
- `EntitySchema` helper

## EntitySchema helper

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

## Classes and Decorators

Entities are simple javascript objects (so called POJO), decorated with `@Entity` decorator.
No real restrictions are made, you do not have to extend any base class, you are more than welcome
to [use entity constructors](entity-constructors.md), just do not forget to specify primary key with
`@PrimaryKey` decorator.

```typescript title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

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

As you can see, entity properties are decorated either with `@Property` decorator, or with one
of reference decorators: `@ManyToOne`, `@OneToMany`, `@OneToOne` and `@ManyToMany`. 

> From v3 you can also use default exports when defining your entity.

Here is another example of `Author` entity, that was referenced from the `Book` one, this 
time defined for mongo:

```typescript title="./entities/Author.ts"
@Entity()
export class Author {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  age?: number;

  @Property()
  termsAccepted: boolean = false;

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
it is being persisted (after flush). To use SQL functions like `now()`, use `defaultRaw`.

  > Since v4 you should use `defaultRaw` for SQL functions, as `default` with string values
  > will be automatically quoted. 

  ```typescript
  @Property({ default: 1 })
  foo!: number;

  @Property({ default: 'abc' })
  bar!: string;

  @Property({ defaultRaw: 'now' })
  baz!: Date;
  ``` 

### Enums

To define enum property, use `@Enum()` decorator. Enums can be either numeric or string valued. 

For schema generator to work properly in case of string enums, you need to define the enum 
is same file as where it is used, so its values can be automatically discovered. If you want 
to define the enum in another file, you should reexport it also in place where you use it. 

Another possibility is to provide the reference to the enum implementation in the decorator
via `@Enum(() => UserRole)`. 

> You can also set enum items manually via `items: string[]` attribute.  

```typescript
import { OutsideEnum } from './OutsideEnum.ts';

@Entity()
export class User {

  @Enum()
  role!: UserRole; // string enum

  @Enum()
  status!: UserStatus; // numeric enum

  @Enum(() => OutsideEnum)
  outside!: OutsideEnum; // string enum defined outside of this file

  @Enum({ items: () => OutsideNullableEnum, nullable: true })
  outsideNullable?: OutsideNullableEnum; // string enum defined outside of this file, may be null
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

// or we could reexport OutsideEnum
// export { OutsideEnum } from './OutsideEnum.ts';
``` 

### Enum arrays

We can also use array of values for enum, in that case, `EnumArrayType` type
will be used automatically, that will validate items on flush. 

```ts
enum Role {
  User = 'user',
  Admin = 'admin',
}

@Enum({ items: () => Role, array: true, default: [Role.User] })
roles: Role[] = [Role.User];
```

### Mapping directly to primary keys

Sometimes we might want to work only with the primary key of a relation. 
To do that, we can use `mapToPk` option on M:1 and 1:1 relations:

```ts
@ManyToOne(() => User, { mapToPk: true })
user: number;
```

For composite keys, this will give us ordered tuple representing the raw PKs,
which is the internal format of composite PK:

```ts
@ManyToOne(() => User, { mapToPk: true })
user: [string, string]; // [first_name, last_name]
```

### Formulas

`@Formula()` decorator can be used to map some SQL snippet to your entity. 
The SQL fragment can be as complex as you want and even include subselects.

```typescript
@Formula('obj_length * obj_height * obj_width')
objectVolume?: number;
```

Formulas will be added to the select clause automatically. In case you are facing 
problems with `NonUniqueFieldNameException`, you can define the formula as a 
callback that will receive the entity alias in the parameter:

```typescript
@Formula(alias => `${alias}.obj_length * ${alias}.obj_height * ${alias}.obj_width`)
objectVolume?: number;
```

### Indexes

You can define indexes via `@Index()` decorator, for unique indexes, use `@Unique()` decorator. 
You can use it either on entity class, or on entity property:

```typescript
@Entity()
@Index({ properties: ['name', 'age'] }) // compound index, with generated name
@Index({ name: 'custom_idx_name', properties: ['name'] }) // simple index, with custom name
@Unique({ properties: ['name', 'email'] })
export class Author {

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

### Custom Types

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

### Lazy scalar properties

You can mark any property as `lazy: true` to omit it from the select clause. 
This can be handy for properties that are too large and you want to have them 
available only some times, like a full text of an article.

```typescript
@Entity()
export class Book {

  @Property({ columnType: 'text', lazy: true })
  text: string;

}
``` 

You can use `populate` parameter to load them.

```typescript
const b1 = await em.find(Book, 1); // this will omit the `text` property
const b2 = await em.find(Book, 1, { populate: ['text'] }); // this will load the `text` property
```

> If the entity is already loaded and you need to populate a lazy scalar property, 
> you might need to pass `refresh: true` in the `FindOptions`.

### Virtual Properties

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

### Entity file names

Starting with MikroORM 4.2, there is no limitation for entity file names. It is now
also possible to define multiple entities in a single file using folder based discovery. 

### Using BaseEntity

You can define your own base entity with properties that you require on all entities, like
primary key and created/updated time. Single table inheritance is also supported.

Read more about this topic in [Inheritance Mapping](inheritance-mapping.md) section.

> If you are initializing the ORM via `entities` option, you need to specify all your
> base entities as well.

```typescript title="./entities/BaseEntity.ts"
import { v4 } from 'uuid';

export abstract class BaseEntity {

  @PrimaryKey()
  uuid = v4();

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

There is a special case, when we need to annotate the base entity - if we are using
folder based discovery, and the base entity is not using any decorators (e.g. it does
not define any decorated property). In that case, we need to mark it as abstract:

```ts
@Entity({ abstract: true })
export abstract class BaseEntity {
  // ...
}
```

### Examples of entity definition with various primary keys

#### Using id as primary key (SQL drivers)

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id!: number; // string is also supported

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

#### Using UUID as primary key (SQL drivers)

```typescript
import { v4 } from 'uuid';

@Entity()
export class Book {

  @PrimaryKey()
  uuid = v4();

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

#### Using PostgreSQL [uuid-osp](https://www.postgresql.org/docs/current/uuid-ossp.html) module function as primary key

Requires enabling the module via: `create extension "uuid-ossp";`

```typescript
@Entity()
export class Book {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  uuid: string;

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

#### Using BigInt as primary key (MySQL and PostgreSQL)

You can use `BigIntType` to support `bigint`s. By default it will represent the value as
a `string`.  

```typescript
@Entity()
export class Book {

  @PrimaryKey({ type: BigIntType })
  id: string;

}
```

If you want to use native `bigint`s, read the following guide: [Using native BigInt PKs](using-bigint-pks.md).


#### Example of Mongo entity

```typescript
@Entity()
export class Book {

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

#### Using BaseEntity (previously WrappedEntity)

From v4 `BaseEntity` class is provided with `init`, `isInitialized`, `assign`
and other methods that are otherwise available via the `wrap()` helper.

> Usage of `BaseEntity` is optional.

```typescript
import { BaseEntity } from '@mikro-orm/core';

@Entity()
export class Book extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}

const book = new Book();
console.log(book.isInitialized()); // true
```

With your entities set up, you can start [using entity manager](entity-manager.md) and 
[repositories](repositories.md) as described in following sections. 
