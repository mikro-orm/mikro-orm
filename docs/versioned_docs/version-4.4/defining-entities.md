---
title: Defining Entities
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Entities are simple javascript objects (so called POJO). No real restrictions are made,
no need to extend any base class, [using entity constructors](entity-constructors.md)
is working as well - they are never executed for managed entities (loaded from database).
Every entity is required to have a primary key.

There are two ways how you can define your entities:

- Decorated classes - the attributes of the entity as well as each property are provided
  via decorators. We use `@Entity()` decorator on the class. Entity properties are decorated
  either with `@Property` decorator, or with one of reference decorators:
  `@ManyToOne`, `@OneToMany`, `@OneToOne` and `@ManyToMany`.
  Check out the full [decorator reference](decorators.md).
- `EntitySchema` helper - With `EntitySchema` helper we define the schema programmatically.
  We can use regular classes as well as interfaces. This approach also allows to re-use
  partial entity definitions (e.g. traits/mixins). Read more about this
  in [Defining Entities via EntitySchema section](entity-schema.md).

Moreover, how the metadata extraction from decorators happens is controlled
via `MetadataProvider`. Two main metadata providers are:

- `ReflectMetadataProvider` - uses `reflect-metadata` to read the property types. Faster
  but simpler and more verbose.
- `TsMorphMetadataProvider` - uses `ts-morph` to read the type information from the
  TypeScript compiled API. Heavier (requires full TS as a dependency), but allows DRY
  entity definition. With `ts-morph` we are able to extract the type as it is defined in
  the code, including interface names, as well as optionality of properties.

Read more about them in the [Metadata Providers section](metadata-providers.md).

> Current set of decorators in MikroORM is designed to work with the `tsc`.
> Using `babel` is also possible, but requires some additional setup. Read more about it
> [here](usage-with-babel.md). For notes about `webpack`, read the [deployment section](deployment.md).
>
> `ts-morph` is compatible only with the `tsc` approach.

> From v3 you can also use default exports when defining your entity.

Example definition of a `Book` entity follows. We can switch the tabs to see the difference
for various ways:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book extends BaseEntity {

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => Publisher, { wrappedReference: true, nullable: true })
  publisher?: IdentifiedReference<Publisher>;

  @ManyToMany({ entity: 'BookTag', fixedOrder: true })
  tags = new Collection<BookTag>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
@Entity()
export class Book extends BaseEntity {

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

  @ManyToOne()
  publisher?: IdentifiedReference<Publisher>;

  @ManyToMany({ fixedOrder: true })
  tags = new Collection<BookTag>(this);

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export interface IBook extends BaseEntity {
  title: string;
  author: Author;
  publisher?: IdentifiedReference<Publisher>;
  tags: Collection<BookTag>;
}

export const Book = new EntitySchema<IBook, BaseEntity>({
  name: 'Book',
  extends: 'BaseEntity',
  properties: {
    title: { type: 'string' },
    author: { reference: 'm:1', entity: 'Author' },
    publisher: { reference: 'm:1', entity: 'Publisher', wrappedReference: true, nullable: true },
    tags: { reference: 'm:n', entity: 'BookTag', fixedOrder: true },
  },
});
```

  </TabItem>
</Tabs>

Here is another example of `Author` entity, that was referenced from the `Book` one, this
time defined for mongo:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
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

  @Property({ nullable: true })
  age?: number;

  @Property()
  termsAccepted: boolean = false;

  @Property({ nullable: true })
  identities?: string[];

  @Property({ nullable: true })
  born?: Date;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @ManyToMany(() => Author)
  friends = new Collection<Author>(this);

  @ManyToOne(() => Book, { nullable: true })
  favouriteBook?: Book;

  @Property({ version: true })
  version!: number;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@Entity()
export class Author {

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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Author.ts"
export class Author {

  _id!: ObjectId;
  id!: string;
  createdAt = new Date();
  updatedAt = new Date();
  name!: string;
  email!: string;
  age?: number;
  termsAccepted = false;
  identities?: string[];
  born?: Date;
  books = new Collection<Book>(this);
  friends = new Collection<Author>(this);
  favouriteBook?: Book;
  version!: number;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

export const AuthorSchema = new EntitySchema<Author>({
  class: Author,
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: String, serializedPrimaryKey: true },
    createdAt: { type: Date },
    updatedAt: { type: Date, onUpdate: () => new Date() }),
    name: { type: String },
    email: { type: String },
    age: { type: Number, nullable: true },
    termsAccepted: { type: Boolean }
    identities: { type: 'string[]', nullable: true }
    born: { type: Date, nullable: true }
    books: { reference: '1:m', entity: () => Book, mappedBy: book => book.author }
    friends: { reference: 'm:n', entity: () => Author }
    favouriteBook: { reference: 'm:1', entity: () => Book, nullable: true };
    version: { type: Number, version: true };
  },
});
```

  </TabItem>
</Tabs>

More information about modelling relationships can be found on [modelling relationships page](relationships.md).

For an example of Vanilla JavaScript usage, take a look [here](usage-with-js.md).

## Optional Properties

With the default `reflect-metadata` provider, we need to mark each optional property as `nullable: true`.
When using `ts-morph`, if you define the property as optional (marked with `?`), this will be automatically considered
as nullable property (mainly for SQL schema generator).

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@ManyToOne(() => Book, { nullable: true })
favouriteBook?: Book;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@ManyToOne()
favouriteBook?: Book;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Author.ts"
properties: {
  favouriteBook: { reference: 'm:1', entity: () => Book, nullable: true },
},
```

  </TabItem>
</Tabs>

## Default values

We can set default value of a property in 2 ways:

1. Use runtime default value of the property. This approach should be preferred as long
   as we are not using any native database function like `now()`. With this approach our
   entities will have the default value set even before it is actually persisted into the
   database (e.g. when we instantiate new entity via `new Author()` or `em.create(Author, { ... })`.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@Property()
foo: number = 1;

@Property()
bar: string = 'abc';

@Property()
baz: Date = new Date();
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@Property()
foo = 1;

@Property()
bar = 'abc';

@Property()
baz = new Date();
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Author.ts"
properties: {
  foo: { type: Number, onCreate: () => 1 },
  bar: { type: String, onCreate: () => 'abc' },
  baz: { type: Date, onCreate: () => new Date() },
},
```

  </TabItem>
</Tabs>

2. Use `default` parameter of `@Property` decorator. This way the actual default value
   will be provided by the database, and automatically mapped to the entity property after
   it is being persisted (after flush). To use SQL functions like `now()`, use `defaultRaw`.

> Since v4 you should use `defaultRaw` for SQL functions, as `default` with string values
> will be automatically quoted.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@Property({ default: 1 })
foo!: number;

@Property({ default: 'abc' })
bar!: string;

@Property({ defaultRaw: 'now' })
baz!: Date;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@Property({ default: 1 })
foo!: number;

@Property({ default: 'abc' })
bar!: string;

@Property({ defaultRaw: 'now' })
baz!: Date;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Author.ts"
properties: {
  foo: { type: Number, default: 1 },
  bar: { type: String, default: 'abc' },
  baz: { type: Date, defaultRaw: 'now' },
},
```

  </TabItem>
</Tabs>

## Enums

To define enum property, use `@Enum()` decorator. Enums can be either numeric or string valued.

For schema generator to work properly in case of string enums, we need to define the enum
is same file as where it is used, so its values can be automatically discovered. If we want
to define the enum in another file, we should reexport it also in place where we use it.

Another possibility is to provide the reference to the enum implementation in the decorator
via `@Enum(() => UserRole)`.

> You can also set enum items manually via `items: string[]` attribute.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
import { OutsideEnum } from './OutsideEnum.ts';

@Entity()
export class User {

  @Enum(() => UserRole)
  role!: UserRole; // string enum

  @Enum()
  status!: UserStatus; // numeric/const enum

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

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
import { OutsideEnum } from './OutsideEnum.ts';

@Entity()
export class User {

  @Enum()
  role!: UserRole; // string enum

  @Enum()
  status!: UserStatus; // numeric enum

  @Enum(() => OutsideEnum)
  outside!: OutsideEnum; // string enum defined outside of this file

  @Enum({ items: () => OutsideNullableEnum })
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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Author.ts"
properties: {
  // string enum
  role: { enum: true, items: () => UserRole },
  // numeric enum
  status: { enum: true, items: () => UserStatus },
  // string enum defined outside of this file
  outside: { enum: true, items: () => OutsideEnum },
  // string enum defined outside of this file, may be null
  outsideNullable: { enum: true, items: () => OutsideNullableEnum, nullable: true },
},
```

  </TabItem>
</Tabs>

## Enum arrays

We can also use array of values for enum, in that case, `EnumArrayType` type
will be used automatically, that will validate items on flush.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
enum Role {
  User = 'user',
  Admin = 'admin',
}

@Enum({ items: () => Role, array: true, default: [Role.User] })
roles: Role[] = [Role.User];
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
enum Role {
  User = 'user',
  Admin = 'admin',
}

@Enum({ items: () => Role, array: true, default: [Role.User] })
roles: Role[] = [Role.User];
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
enum Role {
  User = 'user',
  Admin = 'admin',
}

properties: {
  roles: { enum: true, array: true, default: [Role.User], items: () => Role },
},
```

  </TabItem>
</Tabs>

## Mapping directly to primary keys

Sometimes we might want to work only with the primary key of a relation.
To do that, we can use `mapToPk` option on M:1 and 1:1 relations:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@ManyToOne(() => User, { mapToPk: true })
user: number;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@ManyToOne(() => User, { mapToPk: true })
user: number;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
properties: {
  user: { entity: () => User, mapToPk: true },
},
```

  </TabItem>
</Tabs>

For composite keys, this will give us ordered tuple representing the raw PKs,
which is the internal format of composite PK:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@ManyToOne(() => User, { mapToPk: true })
user: [string, string]; // [first_name, last_name]
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@ManyToOne(() => User, { mapToPk: true })
user: [string, string]; // [first_name, last_name]
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
properties: {
  user: { entity: () => User, mapToPk: true },
},
```

  </TabItem>
</Tabs>
```

## Formulas

`@Formula()` decorator can be used to map some SQL snippet to your entity.
The SQL fragment can be as complex as you want and even include subselects.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Box.ts"
@Formula('obj_length * obj_height * obj_width')
objectVolume?: number;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Box.ts"
@Formula('obj_length * obj_height * obj_width')
objectVolume?: number;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Box.ts"
properties: {
  objectVolume: { formula: 'obj_length * obj_height * obj_width' },
},
```

  </TabItem>
</Tabs>
```

Formulas will be added to the select clause automatically. In case you are facing
problems with `NonUniqueFieldNameException`, you can define the formula as a
callback that will receive the entity alias in the parameter:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Box.ts"
@Formula(alias => `${alias}.obj_length * ${alias}.obj_height * ${alias}.obj_width`)
objectVolume?: number;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Box.ts"
@Formula(alias => `${alias}.obj_length * ${alias}.obj_height * ${alias}.obj_width`)
objectVolume?: number;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Box.ts"
properties: {
  objectVolume: { formula: alias => `${alias}.obj_length * ${alias}.obj_height * ${alias}.obj_width` },
},
```

  </TabItem>
</Tabs>

## Indexes

You can define indexes via `@Index()` decorator, for unique indexes, use `@Unique()` decorator.
You can use it either on entity class, or on entity property:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
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

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Author.ts"
export const AuthorSchema = new EntitySchema<Author, BaseEntity>({
  class: Author,
  indexes: [
    { properties: ['name', 'age'] }, // compound index, with generated name
    { name: 'custom_idx_name', properties: ['name'] }, // simple index, with custom name
  ],
  uniques: [
    { properties: ['name', 'email'] },
  ],
  properties: {
    email: { type: 'string', unique: true }, // generated name
    age: { type: 'number', nullable: true, index: true }, // generated name
    born: { type: Date, nullable: true, index: 'born_index' },
  },
});
```

  </TabItem>
</Tabs>

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

## Lazy scalar properties

You can mark any property as `lazy: true` to omit it from the select clause.
This can be handy for properties that are too large and you want to have them
available only some times, like a full text of an article.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Property({ columnType: 'text', lazy: true })
text: string;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
@Property({ columnType: 'text', lazy: true })
text: string;
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
properties: {
  text: { columnType: 'text', lazy: true },
}
```

  </TabItem>
</Tabs>

You can use `populate` parameter to load them.

```ts
const b1 = await em.find(Book, 1); // this will omit the `text` property
const b2 = await em.find(Book, 1, { populate: ['text'] }); // this will load the `text` property
```

> If the entity is already loaded and you need to populate a lazy scalar property,
> you might need to pass `refresh: true` in the `FindOptions`.

## Virtual Properties

You can define your properties as virtual, either as a method, or via JavaScript `get/set`.

Following example defines User entity with `firstName` and `lastName` database fields, that
are both hidden from the serialized response, replaced with virtual properties `fullName`
(defined as a classic method) and `fullName2` (defined as a JavaScript getter).

> For JavaScript getter you need to provide `{ persist: false }` option otherwise the value
> would be stored in the database.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
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
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
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
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/User.ts"
export class User {
  firstName!: string;
  lastName!: string;

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get fullName2() {
    return `${this.firstName} ${this.lastName}`;
  }
}

properties: {
  firstName: { type: String, hidden: true },
  lastName: { type: String, hidden: true },
  fullName: { type: 'method', persist: false, getter: true, getterName: 'getFullName' },
  fullName2: { type: 'method', persist: false, getter: true },
}
```

  </TabItem>
</Tabs>

```ts
const repo = em.getRepository(User);
const author = repo.create({ firstName: 'Jon', lastName: 'Snow' });

console.log(author.getFullName()); // 'Jon Snow'
console.log(author.fullName2); // 'Jon Snow'
console.log(wrap(author).toJSON()); // { fullName: 'Jon Snow', fullName2: 'Jon Snow' }
```

## Entity file names

Starting with MikroORM 4.2, there is no limitation for entity file names. It is now
also possible to define multiple entities in a single file using folder based discovery.

## Using BaseEntity

You can define your own base entity with properties that you require on all entities, like
primary key and created/updated time. Single table inheritance is also supported.

Read more about this topic in [Inheritance Mapping](inheritance-mapping.md) section.

> If you are initializing the ORM via `entities` option, you need to specify all your
> base entities as well.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/BaseEntity.ts"
import { v4 } from 'uuid';

export abstract class BaseEntity {

  @PrimaryKey()
  uuid: string = v4();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/BaseEntity.ts"
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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/BaseEntity.ts"
export interface BaseEntity {
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
}

export const schema = new EntitySchema<BaseEntity>({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: { type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true },
  },
});
```

  </TabItem>
</Tabs>

There is a special case, when we need to annotate the base entity - if we are using
folder based discovery, and the base entity is not using any decorators (e.g. it does
not define any decorated property). In that case, we need to mark it as abstract:

```ts
@Entity({ abstract: true })
export abstract class BaseEntity {
  // ...
}
```

## Examples of entity definition with various primary keys

### Using id as primary key (SQL drivers)

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id!: number; // string is also supported

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => Publisher, { wrappedReference: true, nullable: true })
  publisher?: IdentifiedReference<Publisher>;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id!: number; // string is also supported

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

  @ManyToOne()
  publisher?: IdentifiedReference<Publisher>;

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export interface Book {
  id: number;
  title: string;
  author: Author;
}

export const BookSchema = new EntitySchema<Book>({
  name: 'Book',
  properties: {
    id: { type: Number, primary: true },
    title: { type: String },
    author: { reference: 'm:1', entity: 'Author' },
    publisher: { reference: 'm:1', entity: 'Publisher', wrappedReference: true, nullable: true },
  },
});
```

  </TabItem>
</Tabs>

### Using UUID as primary key (SQL drivers)

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { v4 } from 'uuid';

@Entity()
export class Book {

  @PrimaryKey()
  uuid: string = v4();

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export interface IBook {
  uuid: string;
  title: string;
  author: Author;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    uuid: { type: 'uuid', onCreate: () => v4(), primary: true },
    title: { type: 'string' },
    author: { entity: () => Author, reference: 'm:1' },
  },
});
```

  </TabItem>
</Tabs>

### Using PostgreSQL [uuid-osp](https://www.postgresql.org/docs/current/uuid-ossp.html) module function as primary key

Requires enabling the module via: `create extension "uuid-ossp";`

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuid_generate_v4()' })
  uuid: string;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export class Book {
  uuid: string;
  title!: string;
  author!: Author;
}

export const BookSchema = new EntitySchema<Book>({
  class: Book,
  properties: {
    uuid: { type: 'uuid', defaultRaw: 'uuid_generate_v4()', primary: true },
    title: { type: 'string' },
    author: { entity: () => Author, reference: 'm:1' },
  },
});
```

  </TabItem>
</Tabs>

### Using BigInt as primary key (MySQL and PostgreSQL)

You can use `BigIntType` to support `bigint`s. By default, it will represent the value as
a `string`.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/BaseEntity.ts"
@Entity()
export class Book {

  @PrimaryKey({ type: BigIntType })
  id: string;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/BaseEntity.ts"
@Entity()
export class Book {

  @PrimaryKey({ type: BigIntType })
  id: string;

}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/BaseEntity.ts"
properties: {
  id: { type: BigIntType },
},
```

  </TabItem>
</Tabs>

If you want to use native `bigint`s, read the following guide: [Using native BigInt PKs](using-bigint-pks.md).

### Example of Mongo entity

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'EntitySchema', value: 'entity-schema'},
]
}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string; // string variant of PK, will be handled automatically

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
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

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export interface IBook {
  _id: ObjectId;
  id: string;
  title: string;
  author: Author;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: String, serializedPrimaryKey: true },
    title: { type: String },
  },
});
```

  </TabItem>
</Tabs>

### Using MikroORM's BaseEntity (previously WrappedEntity)

From v4 `BaseEntity` class is provided with `init`, `isInitialized`, `assign`
and other methods that are otherwise available via the `wrap()` helper.

> Usage of the `BaseEntity` is optional.

```ts
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
