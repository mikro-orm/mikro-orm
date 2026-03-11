---
title: Defining Entities
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Entities are simple javascript objects (so called POJO) without restrictions and without the need to extend base classes. Using [entity constructors](./entity-constructors.md) works as well - they are never executed for managed entities (loaded from database). Every entity is required to have a primary key.

Entities can be defined in two ways:

- **`defineEntity` helper** - Define entities programmatically with full TypeScript type inference. You can use it with a class (recommended) or without one. Read more about this in the [`defineEntity` section](./define-entity.md).
- **Decorated classes** - the attributes of the entity, as well as each property are provided via decorators. You use `@Entity()` decorator on the class. Entity properties are decorated either with `@Property` decorator, or with one of reference decorators: `@ManyToOne`, `@OneToMany`, `@OneToOne` and `@ManyToMany`. Check out the full [decorator reference](./decorators.md).

Moreover, how the metadata extraction from decorators happens is controlled via `MetadataProvider`. Three main metadata providers are:

- `MetadataProvider` - default provider that only enforces the types are provided explicitly.
- `ReflectMetadataProvider` - uses `reflect-metadata` to read the property types. Faster but simpler and more verbose.
- `TsMorphMetadataProvider` - uses `ts-morph` to read the type information from the TypeScript compiled API. Heavier (requires full TS as a dependency), but allows DRY entity definition. With `ts-morph` you are able to extract the type as it is defined in the code, including interface names, as well as optionality of properties.

Read more about them in the [Metadata Providers section](./metadata-providers.md). For a comprehensive guide on using decorators (including the new ES spec decorators in v7), see the [Using Decorators guide](./using-decorators.md). For glob-based entity discovery, see [Folder-based Discovery](./folder-based-discovery.md).

> Current set of decorators in MikroORM is designed to work with the `tsc`. Using `babel` and `swc` is also possible, but requires some additional setup. Read more about it [here](./usage-with-transpilers.md). For notes about `webpack`, read the [deployment section](./deployment.md).
>
> `ts-morph` is compatible only with the `tsc` approach.

Example definition of a `Book` entity follows. You can switch the tabs to see the difference for various ways:

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
  extends: CustomBaseEntity,
  properties: {
    title: p.string(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher)
      .ref()
      .nullable(),
    tags: () => p.manyToMany(BookTag)
      .fixedOrder(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  extends: CustomBaseEntity,
  properties: {
    title: p.string(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher)
      .ref()
      .nullable(),
    tags: () => p.manyToMany(BookTag)
      .fixedOrder(),
  },
});

export type IBook = InferEntity<typeof Book>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book extends CustomBaseEntity {

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => Publisher, { ref: true, nullable: true })
  publisher?: Ref<Publisher>;

  @ManyToMany(() => BookTag, { fixedOrder: true })
  tags = new Collection<BookTag>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
@Entity()
export class Book extends CustomBaseEntity {

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

  @ManyToOne()
  publisher?: Ref<Publisher>;

  @ManyToMany({ fixedOrder: true })
  tags = new Collection<BookTag>(this);

}
```

  </TabItem>
</Tabs>

> Including `{ ref: true }` in your `Ref` property definitions will wrap the reference, providing access to helper methods like `.load` and `.unwrap`, which can be helpful for loading data and changing the type of your references where you plan to use them.

Here is another example of `Author` entity, that was referenced from the `Book` one, this time defined for mongo:

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
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
    name: p.string(),
    email: p.string(),
    age: p.integer().nullable(),
    termsAccepted: p.boolean(),
    identities: p.array().nullable(),
    born: p.date().nullable(),
    books: () => p.oneToMany(Book).mappedBy(book => book.author),
    friends: () => p.manyToMany(Author),
    favouriteBook: () => p.manyToOne(Book).nullable(),
    version: p.integer().version(),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Author.ts"
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const Author = defineEntity({
  name: 'Author',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p.datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
    name: p.string(),
    email: p.string(),
    age: p.integer().nullable(),
    termsAccepted: p.boolean(),
    identities: p.array().nullable(),
    born: p.date().nullable(),
    books: () => p.oneToMany(Book).mappedBy(book => book.author),
    friends: () => p.manyToMany(Author),
    favouriteBook: () => p.manyToOne(Book).nullable(),
    version: p.integer().version(),
  },
});

export type IAuthor = InferEntity<typeof Author>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

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

  @Property({ nullable: true })
  age?: number;

  @Property()
  termsAccepted: boolean = false;

  @Property({ nullable: true })
  identities?: string[];

  @Property({ nullable: true })
  born?: string;

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
  born?: string;

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
</Tabs>

More information about modelling relationships can be found on [modelling relationships page](./relationships.md).

For an example of Vanilla JavaScript usage, take a look [here](./usage-with-js.md).

## Optional Properties

With the default `reflect-metadata` provider, you need to mark each optional property as `nullable: true`. When using `ts-morph`, if you define the property as optional (marked with `?`), this will be automatically considered as nullable property (mainly for SQL schema generator).

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
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    favouriteBook: p.manyToOne(Book).nullable(),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Author.ts"
const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    favouriteBook: p.manyToOne(Book).nullable(),
  },
});

export type ISomeEntity = InferEntity<typeof SomeEntity>;
```

  </TabItem>
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
</Tabs>

To make a nullable field required in methods like `em.create()` (i.e. you cannot omit the property), use `RequiredNullable` type. Such property needs to be provided explicitly in the `em.create()` method, but will accept a `null` value.


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

```ts title='./entities/Book.ts'
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    title: p.string().$type<RequiredNullable<string>>(),
  },
});

em.create(Book, { title: "Alice in Wonderland" }); // ok
em.create(Book, { title: null }); // ok
em.create(Book, {}); // compile error: missing title```

  </TabItem>

  <TabItem value="define-entity">

```ts title='./entities/Book.ts'
const Book = defineEntity({
  name: 'Book',
  properties: {
    title: p.string().$type<RequiredNullable<string>>(),
  },
});

em.create(Book, { title: "Alice in Wonderland" }); // ok
em.create(Book, { title: null }); // ok
em.create(Book, {}); // compile error: missing title
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title='./entities/Book.ts'
class Book {
  @Property()
  title!: RequiredNullable<string>;
}

em.create(Book, { title: "Alice in Wonderland" }); // ok
em.create(Book, { title: null }); // ok
em.create(Book, {}); // compile error: missing title
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title='./entities/Book.ts'
class Book {
  @Property()
  title!: RequiredNullable<string>;
}

em.create(Book, { title: "Alice in Wonderland" }); // ok
em.create(Book, { title: null }); // ok
em.create(Book, {}); // compile error: missing title
```

  </TabItem>
</Tabs>

## Default values

You can set default value of a property in 2 ways:

1. Use a property initializer. This approach should be preferred as long as you are not using any native database function like `now()`. With this approach your entities will have the default value set even before it is actually persisted into the database (e.g. when you instantiate new entity via `new Author()` or `em.create(Author, { ... })`).

> This is only possible if you have an actual entity class, not an interface. If you use `defineEntity` without a class, you can use the `onCreate` option to set the default value.

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
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    foo: p.number().onCreate(() => 1),
    bar: p.string().onCreate(() => 'abc'),
    baz: p.datetime().onCreate(() => new Date()),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Author.ts"
const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    foo: p.number().onCreate(() => 1),
    bar: p.string().onCreate(() => 'abc'),
    baz: p.datetime().onCreate(() => new Date()),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@Property()
foo: number & Opt = 1;

@Property()
bar: string & Opt = 'abc';

@Property()
baz: Date & Opt = new Date();
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@Property()
foo: number & Opt = 1;

@Property()
bar: string & Opt = 'abc';

@Property()
baz: Date & Opt = new Date();
```

  </TabItem>
</Tabs>

2. Use `default` parameter of `@Property` decorator. This way the actual default value will be provided by the database, and automatically mapped to the entity property after it is being persisted (after flush). To use SQL functions like `now()`, use `defaultRaw`.

> Use `defaultRaw` for SQL functions, as `default` with string values will be automatically quoted.

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
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    foo: p.number().default(1),
    bar: p.string().default('abc'),
    baz: p.datetime().defaultRaw('now'),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Author.ts"
const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    foo: p.number().default(1),
    bar: p.string().default('abc'),
    baz: p.datetime().defaultRaw('now'),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Author.ts"
@Property({ default: 1 })
foo!: number & Opt;

@Property({ default: 'abc' })
bar!: string & Opt;

@Property({ defaultRaw: 'now' })
baz!: Date & Opt;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Author.ts"
@Property({ default: 1 })
foo!: number & Opt;

@Property({ default: 'abc' })
bar!: string & Opt;

@Property({ defaultRaw: 'now' })
baz!: Date & Opt;
```

  </TabItem>
</Tabs>

Note that the `Opt` type is used to intersect with the property type to tell the ORM (on type level) that the property should be considered optional for input types (e.g. in `em.create()`), but will be present for managed entities (e.g. `EntityDTO` type).

## Enums

To define an enum property, use `@Enum()` decorator. Enums can be either numeric or string values.

For schema generator to work properly in case of string enums, you need to define the enum in the same file as where it is used, so its values can be automatically discovered. If you want to define the enum in another file, you should re-export it also in place where you use it.

You can also provide the reference to the enum implementation in the decorator via `@Enum(() => UserRole)`.

> You can also set enum items manually via `items: string[]` attribute.

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
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    // string enum
    role: p.enum(['admin', 'user']),
    // numeric enum
    status: p.enum(() => UserStatus),
    // string enum defined outside of this file
    outside: p.enum(() => OutsideEnum),
    // string enum defined outside of this file, may be null
    outsideNullable: p.enum(() => OutsideNullableEnum).nullable(),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    // string enum
    role: p.enum(['admin', 'user']),
    // numeric enum
    status: p.enum(() => UserStatus),
    // string enum defined outside of this file
    outside: p.enum(() => OutsideEnum),
    // string enum defined outside of this file, may be null
    outsideNullable: p.enum(() => OutsideNullableEnum).nullable(),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
import { OutsideEnum } from './OutsideEnum.ts';

@Entity()
export class User {

  @Enum(() => UserRole)
  role!: UserRole; // string enum

  @Enum(() => UserStatus)
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

// or you could reexport OutsideEnum
// export { OutsideEnum } from './OutsideEnum.ts';
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
import { OutsideEnum } from './OutsideEnum.ts';

@Entity()
export class User {

  @Enum(() => UserRole)
  role!: UserRole; // string enum

  @Enum(() => UserStatus)
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

// or you could reexport OutsideEnum
// export { OutsideEnum } from './OutsideEnum.ts';
```

  </TabItem>
</Tabs>

### PostgreSQL native enums

By default, the PostgreSQL driver, represents enums as a text columns with check constraints. Since v6, you can opt in for a native enums by setting the `nativeEnumName` option.

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
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    role: p.enum(() => UserRole).nativeEnumName('user_role'),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

export const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    role: p.enum(() => UserRole).nativeEnumName('user_role'),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @Enum({ items: () => UserRole, nativeEnumName: 'user_role' })
  role!: UserRole;

}

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @Enum({ items: () => UserRole, nativeEnumName: 'user_role' })
  role!: UserRole;

}

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}
```

  </TabItem>
</Tabs>

## Enum arrays

You can also use array of values for enum, in that case, `EnumArrayType` type will be used automatically, that will validate items on flush.

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
enum Role {
  User = 'user',
  Admin = 'admin',
}

const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    roles: p.enum(() => Role).array().default([Role.User]),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
enum Role {
  User = 'user',
  Admin = 'admin',
}

export const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    roles: p.enum(() => Role).array().default([Role.User]),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
enum Role {
  User = 'user',
  Admin = 'admin',
}

@Enum({ items: () => Role, array: true, default: [Role.User] })
roles = [Role.User];
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
enum Role {
  User = 'user',
  Admin = 'admin',
}

@Enum({ default: [Role.User] })
roles = [Role.User];
```

  </TabItem>
</Tabs>

## Mapping directly to primary keys

Sometimes you might want to work only with the primary key of a relation. To do that, you can use `mapToPk` option on M:1 and 1:1 relations:

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
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    user: () => p.manyToOne(User).mapToPk(),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    user: () => p.manyToOne(User).mapToPk(),
  },
});
```

  </TabItem>
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
</Tabs>

For composite keys, this will give us ordered tuple representing the raw PKs, which is the internal format of composite PK:

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
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    user: () => p.manyToOne(User).mapToPk(),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    user: () => p.manyToOne(User).mapToPk(),
  },
});
```

  </TabItem>
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
</Tabs>

## Formulas

`@Formula()` decorator can be used to map some SQL snippet to your entity. The SQL fragment can be as complex as you want and even include subselects.

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

```ts title="./entities/Box.ts"
const BoxSchema = defineEntity({
  name: 'Box',
  properties: {
    objectVolume: p.formula<number>('obj_length * obj_height * obj_width'),
  },
});

export class Box extends BoxSchema.class {}
BoxSchema.setClass(Box);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Box.ts"
export const Box = defineEntity({
  name: 'Box',
  properties: {
    objectVolume: p.formula<number>('obj_length * obj_height * obj_width'),
  },
});
```

  </TabItem>
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
</Tabs>

Formulas will be added to the select clause automatically. You can define the formula as a callback that receives a `columns` object mapping property names to their unquoted column references (e.g., `alias.field_name`). Use the `quote` helper for proper identifier quoting across all database platforms:

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

```ts title="./entities/Box.ts"
import { quote } from '@mikro-orm/core';

const BoxSchema = defineEntity({
  name: 'Box',
  properties: {
    objectVolume: p.formula<number>(cols => quote`${cols.objLength} * ${cols.objHeight} * ${cols.objWidth}`),
  },
});

export class Box extends BoxSchema.class {}
BoxSchema.setClass(Box);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Box.ts"
import { quote } from '@mikro-orm/core';

export const Box = defineEntity({
  name: 'Box',
  properties: {
    objectVolume: p.formula<number>(cols => quote`${cols.objLength} * ${cols.objHeight} * ${cols.objWidth}`),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Box.ts"
import { quote } from '@mikro-orm/core';

@Formula(cols => quote`${cols.objLength} * ${cols.objHeight} * ${cols.objWidth}`)
objectVolume?: number;
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Box.ts"
import { quote } from '@mikro-orm/core';

@Formula(cols => quote`${cols.objLength} * ${cols.objHeight} * ${cols.objWidth}`)
objectVolume?: number;
```

  </TabItem>
</Tabs>

The `columns` object:
- Maps property names to fully-qualified `alias.field_name` references
- Works correctly with TPT (Table-Per-Type) inheritance - inherited properties automatically use the parent table's alias
- Has `toString()` returning the table alias for backwards compatibility

For more complex scenarios, you can use an enhanced callback signature that provides access to table metadata:

```ts
@Formula((cols, table) => {
  return `(select count(*) from other_table where other_table.ref_id = ${table.qualifiedName}.${cols.id})`;
})
relatedCount?: number;
```

The `table` parameter provides:
- `alias`: The quoted table alias
- `name`: The table name
- `schema`: The schema name (if applicable)
- `qualifiedName`: The schema-qualified table name (`schema.table` or just `table`)
- `toString()`: Returns the alias for convenience in template literals

## Indexes

You can define indexes via `@Index()` decorator, for unique indexes, you can use `@Unique()` decorator. You can use it either on entity class, or on entity property.

:::tip Comprehensive Index Guide

For advanced index features including column sort order, NULLS ordering, prefix length, covering indexes (INCLUDE), fill factor, invisible indexes, clustered indexes, and database-specific options, see the dedicated [Indexes and Unique Constraints](./indexes.md) guide.

:::

To define complex indexes, you can use index expressions. They allow you to specify the final `create index` query and an index name - this name is then used for index diffing, so the schema generator will only try to create it if it's not there yet, or remove it, if it's no longer defined in the entity. Index expressions are not bound to any property, rather to the entity itself (you can still define them on both entity and property level).

To define an index expression, you can either provide a raw SQL string, or use the expression callback to dynamically build the returned SQL.

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
const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    email: p.string().unique(),
    age: p.number().nullable().index(),
    born: p.date().nullable().index('born_index'),
    title: p.string(),
    country: p.string(),
  },
  indexes: [
    { properties: ['name', 'age'] }, // compound index, with generated name
    { name: 'custom_idx_name', properties: ['name'] }, // simple index, with custom name
    // Custom index using expression callback
    // ${table.schema}, ${table.name}, and ${columns.title} return the unquoted identifiers.
    { name: 'custom_index_country1', expression: (columns, table, indexName) => `create index \`${indexName}\` on \`${table.schema}\`.\`${table.name}\` (\`${columns.country}\`)` },
    // Using quote helper to automatically quote identifiers.
    { name: 'custom_index_country2', expression: (columns, table, indexName) => quote`create index ${indexName} on ${table} (${columns.country})` },
    // Using raw function to automatically quote identifiers.
    { name: 'custom_index_country3', expression: (columns, table, indexName) => raw(`create index ?? on ?? (??)`, [indexName, table, columns.country]) },
  ],
  uniques: [
    { properties: ['name', 'email'] },
  ],
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Author.ts"
export const Author = defineEntity({
  name: 'Author',
  properties: {
    email: p.string().unique(),
    age: p.number().nullable().index(),
    born: p.date().nullable().index('born_index'),
    title: p.string(),
    country: p.string(),
  },
  indexes: [
    { properties: ['name', 'age'] }, // compound index, with generated name
    { name: 'custom_idx_name', properties: ['name'] }, // simple index, with custom name
    // Custom index using expression callback
    // ${table.schema}, ${table.name}, and ${columns.title} return the unquoted identifiers.
    { name: 'custom_index_country1', expression: (columns, table, indexName) => `create index \`${indexName}\` on \`${table.schema}\`.\`${table.name}\` (\`${columns.country}\`)` },
    // Using quote helper to automatically quote identifiers.
    { name: 'custom_index_country2', expression: (columns, table, indexName) => quote`create index ${indexName} on ${table} (${columns.country})` },
    // Using raw function to automatically quote identifiers.
    { name: 'custom_index_country3', expression: (columns, table, indexName) => raw(`create index ?? on ?? (??)`, [indexName, table, columns.country]) },
  ],
  uniques: [
    { properties: ['name', 'email'] },
  ],
});
```

  </TabItem>
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
  born?: string;

  // Custom index using raw SQL string expression
  @Index({ name: 'custom_index_expr', expression: 'alter table `author` add index `custom_index_expr`(`title`)' })
  @Property()
  title!: string;

  // Custom index using expression callback
  // ${table.schema}, ${table.name}, and ${columns.title} return the unquoted identifiers.
  @Index({ name: 'custom_index_country1', expression: (columns, table, indexName) => `create index \`${indexName}\` on \`${table.schema}\`.\`${table.name}\` (\`${columns.country}\`)` })
  // Using quote helper to automatically quote identifiers.
  @Index({ name: 'custom_index_country2', expression: (columns, table, indexName) => quote`create index ${indexName} on ${table} (${columns.country})` })
  // Using raw function to automatically quote identifiers.
  @Index({ name: 'custom_index_country3', expression: (columns, table, indexName) => raw(`create index ?? on ?? (??)`, [indexName, table, columns.country]) })
  @Property()
  country!: string;

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
  born?: string;

  // Custom index using raw SQL string expression
  @Index({ name: 'custom_index_expr', expression: 'alter table `author` add index `custom_index_expr`(`title`)' })
  @Property()
  title!: string;

  // Custom index using expression callback
  // ${table.schema}, ${table.name}, and ${columns.title} return the unquoted identifiers.
  @Index({ name: 'custom_index_country1', expression: (columns, table, indexName) => `create index \`${indexName}\` on \`${table.schema}\`.\`${table.name}\` (\`${columns.country}\`)` })
  // Using quote helper to automatically quote identifiers.
  @Index({ name: 'custom_index_country2', expression: (columns, table, indexName) => quote`create index ${indexName} on ${table} (${columns.country})` })
  // Using raw function to automatically quote identifiers.
  @Index({ name: 'custom_index_country3', expression: (columns, table, indexName) => raw(`create index ?? on ?? (??)`, [indexName, table, columns.country]) })
  @Property()
  country!: string;

}

```

  </TabItem>
</Tabs>

## Check constraints

You can define check constraints via `@Check()` decorator. You can use it either on entity class, or on entity property. It has a required `expression` property, that can be either a string or a callback, that receives map of property names to column names. Note that you need to use the generic type argument if you want TypeScript suggestions for the property names.

> Check constraints are currently supported only in postgres driver.

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.number().primary(),
    price1: p.number(),
    price2: p.number(),
    price3: p.number(),
  },
  checks: [
    { expression: 'price1 >= 0' },
    { name: 'foo', expression: columns => `${columns.price1} >= 0` },
    { expression: columns => `${columns.price1} >= 0` },
    { propertyName: 'price2', expression: 'price2 >= 0' },
    { propertyName: 'price3', expression: columns => `${columns.price3} >= 0` },
  ],
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.number().primary(),
    price1: p.number(),
    price2: p.number(),
    price3: p.number(),
  },
  checks: [
    { expression: 'price1 >= 0' },
    { name: 'foo', expression: columns => `${columns.price1} >= 0` },
    { expression: columns => `${columns.price1} >= 0` },
    { propertyName: 'price2', expression: 'price2 >= 0' },
    { propertyName: 'price3', expression: columns => `${columns.price3} >= 0` },
  ],
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
// with generated name based on the table name
@Check({ expression: 'price1 >= 0' })
// with explicit name
@Check({ name: 'foo', expression: (columns, table) => `${columns.price1} >= 0` })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  price1!: number;

  @Property()
  @Check({ expression: 'price2 >= 0' })
  price2!: number;

  @Property({ check: (columns, table) => `${columns.price3} >= 0` })
  price3!: number;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
@Entity()
// with generated name based on the table name
@Check({ expression: 'price1 >= 0' })
// with explicit name
@Check({ name: 'foo', expression: (columns, table) => `${columns.price1} >= 0` })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  price1!: number;

  @Property()
  @Check({ expression: 'price2 >= 0' })
  price2!: number;

  @Property({ check: (columns, table) => `${columns.price3} >= 0` })
  price3!: number;

}
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

  Converts a value from its JS representation to its serialized JSON form of this type. By default, converts to the database value.

- `getColumnType(prop: EntityProperty, platform: Platform): string`

  Gets the SQL declaration snippet for a field of this type.

More information can be found in [Custom Types](./custom-types.md) section.

## Lazy scalar properties

You can mark any property as `lazy: true` to omit it from the select clause. This can be handy for properties that are too large, and you want to have them available only sometimes, like a full text of an article.

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    text: p.text().lazy(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    text: p.text().lazy(),
  },
});
```

  </TabItem>
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
</Tabs>

You can use `populate` parameter to load them.

```ts
const b1 = await em.find(Book, 1); // this will omit the `text` property
const b2 = await em.find(Book, 1, { populate: ['text'] }); // this will load the `text` property
```

> If the entity is already loaded, and you need to populate a lazy scalar property, you might need to pass `refresh: true` in the `FindOptions`.

### `ScalarReference` wrapper

Similarly to the `Reference` wrapper, you can also wrap lazy scalars with `Ref` into a `ScalarReference` object. The `Ref` type automatically resolves to `ScalarReference` for non-object types, so the below is correct:

```ts
@Property({ lazy: true, ref: true })
passwordHash!: Ref<string>;
```

```ts
const user = await em.findOne(User, 1);
const passwordHash = await user.passwordHash.load();
```

For object-like types, if you choose to use the reference wrappers, you should use the `ScalarRef<T>` type explicitly. For example, you might want to lazily load a large JSON value:

```ts
@Property({ type: 'json', nullable: true, lazy: true, ref: true })
// ReportParameters is an object type, imagine it defined elsewhere.
reportParameters!: ScalarRef<ReportParameters | null>; 
```

Keep in mind that once a scalar value is managed through a `ScalarReference`, accessing it through MikroORM managed objects will always return the `ScalarReference` wrapper. That can be confusing in case the property is also `nullable`, since the `ScalarReference` will always be truthy. In such cases, you should inform the type system of the nullability of the property through `ScalarReference<T>`'s type parameter as demonstrated above. Below is an example of how it all works:

```ts
// Say Report of id "1" has no reportParameters in the Database.
const report = await em.findOne(Report, 1);
if (report.reportParameters) {
  // Logs Ref<?>, not the actual value. **Would always run***.
  console.log(report.reportParameters);
  //@ts-expect-error $/.get() is not available until the reference has been loaded.
  // const mistake = report.reportParameters.$
}
const populatedReport = await em.populate(report, ['reportParameters']);
// Logs `null`
console.log(populatedReport.reportParameters.$); 
```

## Private property accessors

When using a private property backed by a public get/set pair, use the `accessor` option to point to the other side.

> The `fieldName` will be inferred based on the accessor name unless specified explicitly.

If the `accessor` option points to something, the ORM will use the backing property directly:

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
export class User {
  id!: number;
  private _email!: unknown;

  get email(): unknown {
    return this._email;
  }

  set email(email: unknown) {
    this._email = email;
  }
}

export const UserSchema = defineEntity({
  class: User,
  properties: {
    id: p.integer().primary(),
    // the ORM will use the backing field directly
    email: p.string().accessor('_email'),
  },
});
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export class User {
  id!: number;
  private _email!: unknown;

  get email(): unknown {
    return this._email;
  }

  set email(email: unknown) {
    this._email = email;
  }
}

export const UserSchema = defineEntity({
  class: User,
  properties: {
    id: p.integer().primary(),
    // the ORM will use the backing field directly
    email: p.string().accessor('_email'),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  // the ORM will use the backing field directly
  @Property({ accessor: 'email' })
  private _email: string;

  get email() {
    return this._email;
  }

  set email(email: string) {
    return this._email;
  }
}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
export class User {
  @PrimaryKey()
  id!: number;
  
  // the ORM will use the backing field directly
  @Property({ accessor: 'email' })
  private _email: string;

  get email() {
    return this._email;
  }

  set email(email: string) {
    return this._email;
  }
}
```

  </TabItem>
</Tabs>

If you want the ORM to use the accessor internally (e.g. for hydration or change tracking), use `accessor: true` on the get/set property instead. This is handy if you want to use a **native private property** for the backing field. 

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
export class User {
  id!: string;
  #email!: string;

  get email() {
    return this.#email;
  }

  set email(email: string) {
    return this.#email;
  }
}

export const UserSchema = defineEntity({
  class: User,
  // constructors are required for native private fields
  forceConstructor: true,
  properties: {
    id: p.integer().primary(),
    // the ORM will use the accessor internally
    email: p.string().accessor(),
  },
});
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export class User {
  id!: string;
  #email!: string;

  get email() {
    return this.#email;
  }

  set email(email: string) {
    return this.#email;
  }
}

export const UserSchema = defineEntity({
  class: User,
  // constructors are required for native private fields
  forceConstructor: true,
  properties: {
    id: p.integer().primary(),
    // the ORM will use the accessor internally
    email: p.string().accessor(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity({ forceConstructor: true })
export class User {
  @PrimaryKey()
  id!: number;

  #email!: string;

  // the ORM will use the accessor internally
  @Property({ accessor: true })
  get email() {
    return this.#email;
  }

  set email(email: string) {
    return this.#email;
  }
}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity({ forceConstructor: true })
export class User {
  @PrimaryKey()
  id!: number;

  #email!: string;

  // the ORM will use the accessor internally
  @Property({ accessor: true })
  get email() {
    return this.#email;
  }

  set email(email: string) {
    return this.#email;
  }
}
```

  </TabItem>
</Tabs>

## Virtual Properties

You can define your properties as virtual, either as a method, or via JavaScript `get/set`.

Following example defines User entity with `firstName` and `lastName` database fields, that are both hidden from the serialized response, replaced with virtual properties `fullName` (defined as a classic method) and `fullName2` (defined as a JavaScript getter).

> For JavaScript getter you need to provide `{ persist: false }` option otherwise the value would be stored in the database.

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
export class User {

  [HiddenProps]?: 'firstName' | 'lastName';

  firstName!: string;
  lastName!: string;

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get fullName2() {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const UserSchema = defineEntity({
  class: User,
  name: 'User',
  properties: {
    firstName: p.string().hidden(),
    lastName: p.string().hidden(),
    fullName: p.type('method').persist(false).getter().getterName('getFullName'),
    fullName2: p.type('method').persist(false).getter(),
  },
});
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export class User {

  [HiddenProps]?: 'firstName' | 'lastName';

  firstName!: string;
  lastName!: string;

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get fullName2() {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const UserSchema = defineEntity({
  class: User,
  name: 'User',
  properties: {
    firstName: p.string().hidden(),
    lastName: p.string().hidden(),
    fullName: p.type('method').persist(false).getter().getterName('getFullName'),
    fullName2: p.type('method').persist(false).getter(),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
export class User {

  [HiddenProps]?: 'firstName' | 'lastName';

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

  [HiddenProps]?: 'firstName' | 'lastName';

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
</Tabs>

```ts
const repo = em.getRepository(User);
const author = repo.create({ firstName: 'Jon', lastName: 'Snow' });

console.log(author.getFullName()); // 'Jon Snow'
console.log(author.fullName2); // 'Jon Snow'
console.log(wrap(author).toJSON()); // { fullName: 'Jon Snow', fullName2: 'Jon Snow' }
```

## Entity file names

Starting with MikroORM 4.2, there is no limitation for entity file names. It is now also possible to define multiple entities in a single file using folder based discovery.

## Default entity ordering

You can define a default ordering for an entity using the `orderBy` option in `@Entity()`. This ordering is automatically applied when:

- Querying the entity directly via `em.find()`, `em.findAll()`, etc.
- Populating the entity as a relation

All applicable orderings are combined together, with higher-priority orderings taking precedence for the same fields.

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

```ts title="./entities/Comment.ts"
import { defineEntity, p } from '@mikro-orm/core';

const CommentSchema = defineEntity({
  name: 'Comment',
  orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC },
  properties: {
    id: p.number().primary(),
    createdAt: p.datetime(),
    text: p.string(),
    post: () => p.manyToOne(Post),
  },
});

export class Comment extends CommentSchema.class {}
CommentSchema.setClass(Comment);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Comment.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const Comment = defineEntity({
  name: 'Comment',
  orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC },
  properties: {
    id: p.number().primary(),
    createdAt: p.datetime(),
    text: p.string(),
    post: () => p.manyToOne(Post),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Comment.ts"
@Entity({ orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC } })
export class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt!: Date;

  @Property()
  text!: string;

  @ManyToOne(() => Post)
  post!: Post;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Comment.ts"
@Entity({ orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC } })
export class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt!: Date;

  @Property()
  text!: string;

  @ManyToOne()
  post!: Post;

}
```

  </TabItem>
</Tabs>

The ordering precedence (from highest to lowest) is:

1. **Runtime `orderBy`** - Passed to `em.find()`, `collection.init()`, or `collection.matching()`
2. **Relation-level `orderBy`** - Defined on `@OneToMany()` or `@ManyToMany()` decorators
3. **Entity-level `orderBy`** - Defined on the `@Entity()` decorator

All levels are combined together - if you specify `{ name: 'asc' }` at runtime and the entity has `{ createdAt: 'desc' }`, the result will order by `name` first, then by `createdAt`.

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

```ts title="./entities/Post.ts"
import { defineEntity, p } from '@mikro-orm/core';

const PostSchema = defineEntity({
  name: 'Post',
  properties: {
    id: p.number().primary(),
    comments: () => p.oneToMany(Comment).mappedBy('post'),
    commentsAlphabetical: () => p.oneToMany(Comment).mappedBy('post').orderBy({ text: QueryOrder.ASC }),
  },
});

export class Post extends PostSchema.class {}
PostSchema.setClass(Post);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Post.ts"
import { defineEntity, p } from '@mikro-orm/core';

export const Post = defineEntity({
  name: 'Post',
  properties: {
    id: p.number().primary(),
    comments: () => p.oneToMany(Comment).mappedBy('post'),
    commentsAlphabetical: () => p.oneToMany(Comment).mappedBy('post').orderBy({ text: QueryOrder.ASC }),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Post.ts"
@Entity()
export class Post {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Comment, c => c.post)
  comments = new Collection<Comment>(this);

  @OneToMany(() => Comment, c => c.post, { orderBy: { text: QueryOrder.ASC } })
  commentsAlphabetical = new Collection<Comment>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Post.ts"
@Entity()
export class Post {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Comment, c => c.post)
  comments = new Collection<Comment>(this);

  @OneToMany(() => Comment, c => c.post, { orderBy: { text: QueryOrder.ASC } })
  commentsAlphabetical = new Collection<Comment>(this);

}
```

  </TabItem>
</Tabs>

```ts
const comments = await em.find(Comment, {});
// ordered by createdAt DESC (entity-level), then by id DESC

const commentsAsc = await em.find(Comment, {}, { orderBy: { createdAt: QueryOrder.ASC } });
// ordered by createdAt ASC (runtime), then by id DESC (entity-level)

const post = await em.findOne(Post, 1, { populate: ['comments'] });
// post.comments ordered by createdAt DESC, id DESC
```

## Using custom base entity

You can define your own base entity with properties that are required on all entities, like primary key and created/updated time. MikroORM supports two inheritance mapping strategies:

- **Single Table Inheritance (STI)** - All entities in the hierarchy share a single table with a discriminator column
- **Table-Per-Type Inheritance (TPT)** - Each entity has its own table with foreign keys linking child tables to parent tables

Read more about this topic in [Inheritance Mapping](./inheritance-mapping.md) section.

> If you are initializing the ORM via `entities` option, you need to specify all your base entities as well.

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

```ts title="./entities/CustomBaseEntity.ts"
const p = defineEntity.properties;
const CustomBaseProperties = {
  uuid: p.uuid().primary().onCreate(() => v4()),
  createdAt: p.datetime()
    .onCreate(() => new Date())
    .nullable(),
  updatedAt: p.datetime()
    .onCreate(() => new Date())
    .onUpdate(() => new Date())
    .nullable(),
}
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/CustomBaseEntity.ts"
const p = defineEntity.properties;
const CustomBaseProperties = {
  uuid: p.uuid().primary().onCreate(() => v4()),
  createdAt: p.datetime()
    .onCreate(() => new Date())
    .nullable(),
  updatedAt: p.datetime()
    .onCreate(() => new Date())
    .onUpdate(() => new Date())
    .nullable(),
}
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/CustomBaseEntity.ts"
import { v4 } from 'uuid';

export abstract class CustomBaseEntity {

  @PrimaryKey()
  uuid = v4();

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/CustomBaseEntity.ts"
import { v4 } from 'uuid';

export abstract class CustomBaseEntity {

  @PrimaryKey()
  uuid = v4();

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

}
```

  </TabItem>
</Tabs>

There is a special case, when you need to annotate the base entity - if you are using folder based discovery, and the base entity is not using any decorators (e.g. it does not define any decorated property). In that case, you need to mark it as abstract:

```ts
@Entity({ abstract: true })
export abstract class CustomBaseEntity {
  // ...
}
```

## SQL Generated columns

To use generated columns, you can either use the `generated` option, or specify it as part of the `columnType`:

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
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    firstName: p.string().length(50),
    lastName: p.string().length(50),
    fullName: p.string()
      .length(100)
      .generated(cols => `(concat(${cols.firstName}, ' ', ${cols.lastName})) stored`),
    fullName2: p.string()
      .length(100)
      .columnType(`varchar(100) generated always as (concat(first_name, ' ', last_name)) virtual`),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    firstName: p.string().length(50),
    lastName: p.string().length(50),
    fullName: p.string()
      .length(100)
      .generated(cols => `(concat(${cols.firstName}, ' ', ${cols.lastName})) stored`),
    fullName2: p.string()
      .length(100)
      .columnType(`varchar(100) generated always as (concat(first_name, ' ', last_name)) virtual`),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property({ length: 50 })
  firstName!: string;

  @Property({ length: 50 })
  lastName!: string;

  @Property({ length: 100, generated: cols => `(concat(${cols.firstName}, ' ', ${cols.lastName})) stored` })
  fullName!: string & Opt;

  @Property({ columnType: `varchar(100) generated always as (concat(first_name, ' ', last_name)) virtual` })
  fullName2!: string & Opt;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property({ length: 50 })
  firstName!: string;

  @Property({ length: 50 })
  lastName!: string;

  @Property({ length: 100, generated: cols => `(concat(${cols.firstName}, ' ', ${cols.lastName})) stored` })
  fullName!: string & Opt;

  @Property({ columnType: `varchar(100) generated always as (concat(first_name, ' ', last_name)) virtual` })
  fullName2!: string & Opt;

}
```

  </TabItem>
</Tabs>

To use a generated identity column in PostgreSQL, set the `generated` option to `identity`:

> To allow providing the value explicitly, use `generated: 'by default as identity'`.

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
const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().generated('identity'),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/User.ts"
export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary().generated('identity'),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @PrimaryKey({ generated: 'identity' })
  id!: number;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/User.ts"
@Entity()
export class User {

  @PrimaryKey({ generated: 'identity' })
  id!: number;

}
```

  </TabItem>
</Tabs>

## Examples of entity definition with various primary keys

### Using id as primary key (SQL drivers)

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher).nullable(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    publisher: () => p.manyToOne(Publisher).nullable(),
  },
});
```

  </TabItem>
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

  @ManyToOne(() => Publisher, { ref: true, nullable: true })
  publisher?: Ref<Publisher>;

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
  publisher?: Ref<Publisher>;

}
```

  </TabItem>
</Tabs>

### Using UUID as primary key (SQL drivers)

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    uuid: p.uuid().primary().onCreate(() => v4()),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    uuid: p.uuid().primary().onCreate(() => v4()),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { v4 } from 'uuid';

@Entity()
export class Book {

  @PrimaryKey()
  uuid = v4();

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
</Tabs>

### Using PostgreSQL built-in [gen_random_uuid](https://www.postgresql.org/docs/current/functions-uuid.html) function as primary key

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    uuid: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    uuid: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
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

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  uuid: string;

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

}
```

  </TabItem>
</Tabs>

### Using BigInt as primary key (MySQL and PostgreSQL)

Since v6, `bigint`s are represented by the native `BigInt` type, and as such, they don't require explicit type in the decorator options:

```ts
@PrimaryKey()
id: bigint;
```

You can also specify the target type you want your bigints to be mapped to:

```ts
@PrimaryKey({ type: new BigIntType('bigint') })
id1: bigint;

@PrimaryKey({ type: new BigIntType('string') })
id2: string;

@PrimaryKey({ type: new BigIntType('number') })
id3: number;
```

> JavaScript cannot represent all the possible values of a `bigint` when mapping to the `number` type - only values up to `Number.MAX_SAFE_INTEGER` (2^53 - 1) are safely supported.

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

```ts title="./entities/CustomBaseEntity.ts"
const SomeEntitySchema = defineEntity({
  name: 'SomeEntity',
  properties: {
    id: p.bigint().primary(),
  },
});

export class SomeEntity extends SomeEntitySchema.class {}
SomeEntitySchema.setClass(SomeEntity);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/CustomBaseEntity.ts"
const SomeEntity = defineEntity({
  name: 'SomeEntity',
  properties: {
    id: p.bigint().primary(),
  },
});
```

  </TabItem>
<TabItem value="reflect-metadata">

```ts title="./entities/CustomBaseEntity.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id: bigint;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/CustomBaseEntity.ts"
@Entity()
export class Book {

  @PrimaryKey()
  id: bigint;

}
```

  </TabItem>
</Tabs>

If you want to use native `bigint`s, read the following guide: [Using native BigInt PKs](./using-bigint-pks.md).

### Example of Mongo entity

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    title: p.string(),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    title: p.string(),
  },
});
```

  </TabItem>
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
</Tabs>

### Using MikroORM's BaseEntity (previously WrappedEntity)

The `BaseEntity` class is provided with `init`, `isInitialized`, `assign` and other methods that are otherwise available via the `wrap()` helper.

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

Having the entities set up, you can now start [using entity manager](./entity-manager.md) and [repositories](./repositories.md) as described in following sections.
