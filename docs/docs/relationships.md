---
title: Modeling Entity Relationships
sidebar_label: Modeling Entity Relationships
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

There are 4 types of entity relationships in MikroORM:

- ManyToOne
- OneToMany
- OneToOne
- ManyToMany

Relations can be unidirectional and bidirectional. Unidirectional are defined only on one side (the owning side). Bidirectional are defined on both sides, while one is owning side (where references are store), marked by `inversedBy` attribute pointing to the inverse side. On the inversed side you define it with `mappedBy` attribute pointing back to the owner:

> When modeling bidirectional relationship, you can also omit the `inversedBy` attribute, defining `mappedBy` on the inverse side is enough as it will be auto-wired.

## ManyToOne

> Many instances of the current Entity refer to One instance of the referred Entity.

There are multiple ways how to define the relationship, all of the following is equivalent:

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
});

export type IBook = InferEntity<typeof Book>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  @ManyToOne(() => Author) // you need to specify type via callback
  author1!: Author;

  @ManyToOne('Author') // or as a string
  author2!: Author;

  @ManyToOne({ entity: () => Author }) // or use options object
  author3!: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Book {

  @ManyToOne() // plain decorator is enough, type will be sniffed via ts-morph!
  author!: Author;

}
```

  </TabItem>
</Tabs>

You can also specify how operations on given entity should [cascade](./cascading.md) to the referred entity.

## OneToMany

> One instance of the current Entity has Many instances (references) to the referred Entity.

Again, all of the following is equivalent:

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

export type IAuthor = InferEntity<typeof Author>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Author {

  @OneToMany(() => Book, book => book.author)
  books1 = new Collection<Book>(this);

  @OneToMany('Book', 'author')
  books2 = new Collection<Book>(this);

  @OneToMany({ mappedBy: book => book.author }) // referenced entity type can be sniffed too
  books3 = new Collection<Book>(this);

  @OneToMany({ entity: () => Book, mappedBy: 'author', orphanRemoval: true })
  books4 = new Collection<Book>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Author {

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}
```

  </TabItem>
</Tabs>

As you can see, OneToMany is the inverse side of ManyToOne (which is the owning side). More about how collections work can be found on [collections page](./collections.md).

You can also specify how operations on given entity should [cascade](./cascading.md) to the referred entities. There is also more aggressive remove mode called [Orphan Removal](./cascading.md#orphan-removal) (`books4` example).

## OneToOne

> One instance of the current Entity refers to One instance of the referred Entity.

This is a variant of ManyToOne, where there is always just one entity on both sides. This means that the foreign key column is also unique.

### Owning Side

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    bestFriend1: () => p.oneToOne(User),
    // side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
    bestFriend2: () => p.oneToOne(User).inversedBy('bestFriend1'),
    // you need to specifically mark the owning side with `owner: true`
    bestFriend3: () => p.oneToOne(User).owner(),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    bestFriend1: () => p.oneToOne(User),
    // side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
    bestFriend2: () => p.oneToOne(User).inversedBy('bestFriend1'),
    // you need to specifically mark the owning side with `owner: true`
    bestFriend3: () => p.oneToOne(User).owner(),
  },
});

export type IUser = InferEntity<typeof User>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class User {

  // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
  @OneToOne()
  bestFriend1!: User;

  // side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
  @OneToOne({ inversedBy: 'bestFriend1' })
  bestFriend2!: User;

  // when defining it like this, you need to specifically mark the owning side with `owner: true`
  @OneToOne(() => User, user => user.bestFriend2, { owner: true })
  bestFriend3!: User;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class User {

  // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
  @OneToOne()
  bestFriend1!: User;

  // side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
  @OneToOne({ inversedBy: 'bestFriend1' })
  bestFriend2!: User;

  // when defining it like this, you need to specifically mark the owning side with `owner: true`
  @OneToOne(() => User, user => user.bestFriend2, { owner: true })
  bestFriend3!: User;

}
```

  </TabItem>
</Tabs>

### Inverse Side

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const UserSchema = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    bestFriend1: () => p.oneToOne(User).mappedBy('bestFriend1').orphanRemoval(),
    bestFriend2: () => p.oneToOne(User).mappedBy('bestFriend2').orphanRemoval(),
  },
});

export class User extends UserSchema.class {}
UserSchema.setClass(User);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    bestFriend1: () => p.oneToOne(User).mappedBy('bestFriend1').orphanRemoval(),
    bestFriend2: () => p.oneToOne(User).mappedBy('bestFriend2').orphanRemoval(),
  },
});

export type IUser = InferEntity<typeof User>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class User {

  @OneToOne({ mappedBy: 'bestFriend1', orphanRemoval: true })
  bestFriend1!: User;

  @OneToOne(() => User, user => user.bestFriend2, { orphanRemoval: true })
  bestFriend2!: User;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class User {

  @OneToOne({ mappedBy: 'bestFriend1', orphanRemoval: true })
  bestFriend1!: User;

  @OneToOne(() => User, user => user.bestFriend2, { orphanRemoval: true })
  bestFriend2!: User;

}
```

  </TabItem>
</Tabs>

As you can see, relationships can be also self-referencing (all of them. OneToOne also supports [Orphan Removal](./cascading.md#orphan-removal)).

## ManyToMany

> Many instances of the current Entity refers to Many instances of the referred Entity.

Here are examples of how you can define ManyToMany relationship:

### Owning Side

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    tags: () => p.manyToMany(BookTag),
    // to define uni-directional many to many, simply omit `mappedBy`
    friends: () => p.manyToMany(Author),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    tags: () => p.manyToMany(BookTag),
    // to define uni-directional many to many, simply omit `mappedBy`
    friends: () => p.manyToMany(Author),
  },
});

export type IBook = InferEntity<typeof Book>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  @ManyToMany(() => BookTag, 'books')
  tags1 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags2 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags3 = new Collection<BookTag>(this);

  // to define uni-directional many to many
  @ManyToMany(() => Author)
  friends: Collection<Author> = new Collection<Author>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Book {

  @ManyToMany()
  tags = new Collection<BookTag>(this);

  // to define uni-directional many to many
  @ManyToMany()
  friends = new Collection<Author>(this);

}
```

  </TabItem>
</Tabs>

### Inverse Side

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const BookTagSchema = defineEntity({
  name: 'BookTag',
  properties: {
    id: p.integer().primary(),
    // inverse side has to point to the owning side via `mappedBy`
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

export class BookTag extends BookTagSchema.class {}
BookTagSchema.setClass(BookTag);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    id: p.integer().primary(),
    // inverse side has to point to the owning side via `mappedBy`
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

export type IBookTag = InferEntity<typeof BookTag>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class BookTag {

  // inverse side has to point to the owning side via `mappedBy` attribute/parameter
  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class BookTag {

  // inverse side has to point to the owning side via `mappedBy` attribute/parameter
  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

}
```

  </TabItem>
</Tabs>

Again, more information about how collections work can be found on [collections page](./collections.md).

## Referencing Non-Primary Key Columns

By default, ManyToOne and OneToOne relations reference the primary key of the target entity. You can use the `targetKey` option to reference a different unique column instead.

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

```ts
import { defineEntity, InferEntity, p, Collection } from '@mikro-orm/core';

const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    uuid: p.string().unique(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});


export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    // This relation references Author by uuid instead of id (PK)
    author: () => p.manyToOne(Author).targetKey('uuid'),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p, Collection } from '@mikro-orm/core';

export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    uuid: p.string().unique(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

export type IAuthor = InferEntity<typeof Author>;

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    // This relation references Author by uuid instead of id (PK)
    author: () => p.manyToOne(Author).targetKey('uuid'),
  },
});

export type IBook = InferEntity<typeof Book>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  uuid!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  // This relation references Author by uuid instead of id (PK)
  @ManyToOne(() => Author, { targetKey: 'uuid' })
  author!: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  uuid!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  // This relation references Author by uuid instead of id (PK)
  @ManyToOne({ targetKey: 'uuid' })
  author!: Author;

}
```

  </TabItem>
</Tabs>

The target column must have a unique constraint. The FK column type will automatically match the type of the referenced column.

## Relations in ESM projects

If you use ESM in your TypeScript project with `reflect-metadata`, you might fall into issues with circular dependencies, seeing errors like this:

    ReferenceError: Cannot access 'Author' before initialization

To get around them, use the `Rel` mapped type. It is an identity type, which disables the problematic inference from `reflect-metadata`, that causes ESM projects to fail.

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

```ts
import { defineEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

> With `defineEntity`, circular dependencies are handled automatically, no need for `Rel` wrapper.

  </TabItem>
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
});

export type IBook = InferEntity<typeof Book>;
```

> With `defineEntity`, circular dependencies are handled automatically, no need for `Rel` wrapper.

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
import { Rel } from '@mikro-orm/core';

@Entity()
export class Book {

  @ManyToOne(() => Author)
  author!: Rel<Author>;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
import { Rel } from '@mikro-orm/core';

@Entity()
export class Book {

  @ManyToOne()
  author!: Rel<Author>;

}
```

  </TabItem>
</Tabs>

## Custom foreign key constraint name

If you need a greater control on the underlying SQL schema, you can provide a custom name for the foreign key constraint of your relationship on the owning side.

This name overrides the one automatically generated by the current [NamingStrategy](./naming-strategy.md).

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).foreignKeyName('my_custom_name'),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).foreignKeyName('my_custom_name'),
  },
});

export type IBook = InferEntity<typeof Book>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  @ManyToOne(() => Author, { foreignKeyName: 'my_custom_name' })
  author: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Book {

  @ManyToOne({ foreignKeyName: 'my_custom_name' })
  author: Author;

}
```

  </TabItem>
</Tabs>

## Disabling foreign key constraint creation

If you need to disable the creation of the underlying SQL foreign key constraint for a specific relation, you can set `createForeignKeyConstraint` to `false` on the relation on the owning side.

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

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).createForeignKeyConstraint(false),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity, p } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).createForeignKeyConstraint(false),
  },
});

export type IBook = InferEntity<typeof Book>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  @ManyToOne(() => Author, { createForeignKeyConstraint: false })
  author: Author;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Book {

  @ManyToOne({ createForeignKeyConstraint: false })
  author: Author;

}
```

  </TabItem>
</Tabs>

Note that if you globally disable the creation of all foreign key constraints by setting `createForeignKeyConstraints` to `false`, then no foreign key constraint is created whatsoever on any relation.

```ts
const orm = await MikroORM.init({
  ...
  schemaGenerator: {
    createForeignKeyConstraints: false,
  },
});
```

## Polymorphic Relations

Polymorphic relations allow a property to reference entities of multiple different types. This is useful when you have a relationship that can point to various entity types, such as a "like" that can be associated with either a "post" or a "comment".

:::info Polymorphic Relations vs Single Table Inheritance

Polymorphic relations are different from [Single Table Inheritance (STI)](./inheritance-mapping.md#single-table-inheritance):

- **STI**: Multiple entity *classes* stored in a **single table**, sharing a common base class. The discriminator identifies which class to instantiate. Supports native foreign key constraints with referential integrity.
- **Polymorphic Relations**: Each entity type has its **own table**. The discriminator identifies which table the foreign key points to. No inheritance required. **No foreign key constraints** since the column can point to multiple tables, meaning no database-level referential integrity.

Use STI when entities share common fields and behavior (inheritance). Use polymorphic relations when you need flexible relationships between unrelated entity types.

:::

### How it Works

Polymorphic relations use two columns in the database:

1. **Discriminator column** - stores the entity type (e.g., `'post'` or `'comment'`)
2. **ID column(s)** - stores the foreign key value pointing to the target entity

Unlike regular relations, polymorphic relations do not create foreign key constraints since they can point to multiple tables.

### Defining Polymorphic Relations

To define a polymorphic relation, pass an array of entity types to the `@ManyToOne()` decorator:

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

```ts
import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

const PostSchema = defineEntity({
  name: 'Post',
  properties: {
    id: p.number().primary(),
    title: p.string(),
    // Inverse side of polymorphic relation
    likes: () => p.oneToMany(UserLike).mappedBy('likeable'),
  },
});

export interface IPost extends InferEntity<typeof Post> {}

export const Comment = defineEntity({
  name: 'Comment',
  properties: {
    id: p.number().primary(),
    text: p.string(),
    // Inverse side of polymorphic relation
    likes: () => p.oneToMany(UserLike).mappedBy('likeable'),
  },
});

export interface IComment extends InferEntity<typeof Comment> {}

export const UserLike = defineEntity({
  name: 'UserLike',
  properties: {
    id: p.number().primary(),
    // Polymorphic relation - can point to either Post or Comment
    likeable: () => p.manyToOne([Post, Comment]),
  },
});

export interface IUserLike extends InferEntity<typeof UserLike> {}```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

export const Post = defineEntity({
  name: 'Post',
  properties: {
    id: p.number().primary(),
    title: p.string(),
    // Inverse side of polymorphic relation
    likes: () => p.oneToMany(UserLike).mappedBy('likeable'),
  },
});

export interface IPost extends InferEntity<typeof Post> {}

export const Comment = defineEntity({
  name: 'Comment',
  properties: {
    id: p.number().primary(),
    text: p.string(),
    // Inverse side of polymorphic relation
    likes: () => p.oneToMany(UserLike).mappedBy('likeable'),
  },
});

export interface IComment extends InferEntity<typeof Comment> {}

export const UserLike = defineEntity({
  name: 'UserLike',
  properties: {
    id: p.number().primary(),
    // Polymorphic relation - can point to either Post or Comment
    likeable: () => p.manyToOne([Post, Comment]),
  },
});

export interface IUserLike extends InferEntity<typeof UserLike> {}
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // Inverse side of polymorphic relation
  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);

}

@Entity()
export class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  // Inverse side of polymorphic relation
  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);

}

@Entity()
export class UserLike {

  @PrimaryKey()
  id!: number;

  // Polymorphic relation - can point to either Post or Comment
  @ManyToOne(() => [Post, Comment])
  likeable!: Post | Comment;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);

}

@Entity()
export class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);

}

@Entity()
export class UserLike {

  @PrimaryKey()
  id!: number;

  // The type is inferred as Post | Comment
  @ManyToOne(() => [Post, Comment])
  likeable!: Post | Comment;

}
```

  </TabItem>
</Tabs>

### Configuration Options

The `discriminator` option specifies the base name used for the discriminator column. The actual column name is derived using the `discriminatorColumnName()` method from your naming strategy, which by default appends `Type` and converts to column format (e.g., `likeable` becomes `likeable_type` with underscore naming strategy).

If not specified, the discriminator defaults to the property name (e.g., `likeable` for a property named `likeable`).

### Database Schema

For the example above, the `user_like` table will have:

```sql
CREATE TABLE user_like (
  id INTEGER PRIMARY KEY,
  likeable_type VARCHAR(255),  -- discriminator column
  likeable_id INTEGER          -- foreign key column
);
```

Note that no foreign key constraint is created since the `likeable_id` can point to either the `post` or `comment` table.

### Loading Polymorphic Relations

When loading entities with polymorphic relations, MikroORM automatically determines the correct entity type based on the discriminator value:

```ts
// Load a UserLike with its polymorphic relation
const like = await orm.em.findOne(UserLike, { id: 1 });

// The likeable property will be the correct entity type
if (like.likeable instanceof Post) {
  console.log('Liked a post:', like.likeable.title);
} else if (like.likeable instanceof Comment) {
  console.log('Liked a comment:', like.likeable.text);
}
```

### Loading Inverse Side

The inverse side (OneToMany) collections work correctly with polymorphic relations. When populating, MikroORM automatically filters to only include items pointing to the correct entity type:

```ts
// Load a Post with all its likes
const post = await orm.em.findOne(Post, { id: 1 }, { populate: ['likes'] });

// Only likes pointing to this post are included
console.log('This post has', post.likes.length, 'likes');
```

### Persisting Polymorphic Relations

When persisting, MikroORM automatically sets the discriminator value based on the entity type being assigned:

```ts
const post = new Post();
post.title = 'My Post';

const like = new UserLike();
like.likeable = post;  // MikroORM will set likeable_type = 'post'

orm.em.persist([post, like]);
await orm.em.flush();
```

### Discriminator Values

By default, the discriminator value is the table name of the target entity. In the example above:

- Pointing to `Post` entity → discriminator value is `'post'`
- Pointing to `Comment` entity → discriminator value is `'comment'`

### Exposing the Discriminator for Querying

The discriminator column is managed automatically by MikroORM, but you can expose it as a read-only property for querying purposes. Use `persist: false` to prevent it from being persisted (since the relation already handles that):

```ts
@Entity()
class UserLike {

  @PrimaryKey()
  id!: number;

  // Expose discriminator for querying (persist: false since it's managed by the relation)
  @Property({ persist: false })
  likeableType?: string;

  @ManyToOne(() => [Post, Comment])
  likeable!: Post | Comment;

}
```

This allows you to query directly on the discriminator value:

```ts
// Find all likes for posts
const postLikes = await orm.em.find(UserLike, {
  likeableType: 'post',
});
```

### Requirements and Limitations

1. **All target entities must have compatible primary key types** - Since the same ID column stores the foreign key for all target types, they must use the same type (e.g., all integer PKs or all string PKs).

2. **No foreign key constraints** - Polymorphic relations cannot have database-level foreign key constraints since they point to multiple tables.

3. **Composite primary keys** - Polymorphic relations support targets with composite primary keys. Multiple ID columns will be created to store all parts of the composite key.

### Many-to-Many Polymorphic Relations

Polymorphic relations also support many-to-many relationships. This is useful when you have a shared relation like "tags" that can be associated with multiple different entity types (e.g., both posts and videos can have tags).

#### How M:N Polymorphic Works

Unlike regular M:N relations that use a simple pivot table with two foreign keys, polymorphic M:N uses a pivot table with a discriminator column to identify which entity type each row belongs to:

```sql
CREATE TABLE taggables (
  taggable_type VARCHAR(255),  -- discriminator: 'post' or 'video'
  taggable_id INTEGER,          -- FK to post.id or video.id
  tag_id INTEGER,               -- FK to tag.id
  PRIMARY KEY (taggable_type, taggable_id, tag_id)
);
```

Multiple entity types share the same pivot table, distinguished by the discriminator value.

#### Defining M:N Polymorphic Relations

To define a polymorphic M:N relation, use the `discriminator` option on `@ManyToMany()`:

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

```ts
import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

const TagSchema = defineEntity({
  name: 'Tag',
  properties: {
    id: p.number().primary(),
    name: p.string(),
    // Inverse sides - separate collections per entity type
    posts: () => p.manyToMany(Post).mappedBy('tags'),
    videos: () => p.manyToMany(Video).mappedBy('tags'),
  },
});

export interface ITag extends InferEntity<typeof Tag> {}

export const Post = defineEntity({
  name: 'Post',
  properties: {
    id: p.number().primary(),
    title: p.string(),
    // Owner side - polymorphic M:N via shared pivot table
    tags: () => p.manyToMany(Tag).pivotTable('taggables').discriminator('taggable'),
  },
});

export interface IPost extends InferEntity<typeof Post> {}

export const Video = defineEntity({
  name: 'Video',
  properties: {
    id: p.number().primary(),
    url: p.string(),
    // Owner side - same pivot table, different discriminator value
    tags: () => p.manyToMany(Tag).pivotTable('taggables').discriminator('taggable'),
  },
});

export interface IVideo extends InferEntity<typeof Video> {}```

  </TabItem>

  <TabItem value="define-entity">

```ts
import { defineEntity, p, type InferEntity } from '@mikro-orm/core';

export const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.number().primary(),
    name: p.string(),
    // Inverse sides - separate collections per entity type
    posts: () => p.manyToMany(Post).mappedBy('tags'),
    videos: () => p.manyToMany(Video).mappedBy('tags'),
  },
});

export interface ITag extends InferEntity<typeof Tag> {}

export const Post = defineEntity({
  name: 'Post',
  properties: {
    id: p.number().primary(),
    title: p.string(),
    // Owner side - polymorphic M:N via shared pivot table
    tags: () => p.manyToMany(Tag).pivotTable('taggables').discriminator('taggable'),
  },
});

export interface IPost extends InferEntity<typeof Post> {}

export const Video = defineEntity({
  name: 'Video',
  properties: {
    id: p.number().primary(),
    url: p.string(),
    // Owner side - same pivot table, different discriminator value
    tags: () => p.manyToMany(Tag).pivotTable('taggables').discriminator('taggable'),
  },
});

export interface IVideo extends InferEntity<typeof Video> {}
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // Inverse sides - separate collections per entity type
  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Video, video => video.tags)
  videos = new Collection<Video>(this);

}

@Entity()
export class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  // Owner side - polymorphic M:N via shared pivot table
  @ManyToMany(() => Tag, tag => tag.posts, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    owner: true,
  })
  tags = new Collection<Tag>(this);

}

@Entity()
export class Video {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  // Owner side - same pivot table, different discriminator value
  @ManyToMany(() => Tag, tag => tag.videos, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    owner: true,
  })
  tags = new Collection<Tag>(this);

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts
@Entity()
export class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Video, video => video.tags)
  videos = new Collection<Video>(this);

}

@Entity()
export class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Tag, tag => tag.posts, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    owner: true,
  })
  tags = new Collection<Tag>(this);

}

@Entity()
export class Video {

  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToMany(() => Tag, tag => tag.videos, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    owner: true,
  })
  tags = new Collection<Tag>(this);

}
```

  </TabItem>
</Tabs>

#### Configuration Options

| Option | Description |
|--------|-------------|
| `pivotTable` | Name of the shared pivot table. All polymorphic entities using the same discriminator should use the same pivot table name. |
| `discriminator` | Name of the discriminator property. Defaults to the property name. The column name is derived using your naming strategy (e.g., `taggable` → `taggable_type`). |
| `discriminatorMap` | (Optional) Custom mapping of discriminator values to entity classes. See [Custom Discriminator Values](#custom-discriminator-values) below. |
| `owner` | Must be `true` on the polymorphic side. |

#### Discriminator Values

By default, the discriminator value is the table name of the entity:
- `Post` entity → `'post'`
- `Video` entity → `'video'`

The polymorphic FK column name is derived from the discriminator property name (e.g., `taggable` → `taggable_id`).

#### Custom Discriminator Values

You can specify custom discriminator values using the `discriminatorMap` option. This is useful when you want shorter or more meaningful type identifiers:

<Tabs
  groupId="entity-def-style"
  defaultValue="define-entity-class"
  values={[
    {label: 'defineEntity + class', value: 'define-entity-class'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'reflect-metadata', value: 'reflect-metadata'},
]
  }
>
  <TabItem value="define-entity-class">

```ts
const ArticleSchema = defineEntity({
  name: 'Article',
  properties: {
    id: p.number().primary(),
    categories: () => p.manyToMany(Category)
      .inversedBy('articles')
      .pivotTable('categorizables')
      .discriminator('categorizable')
      .discriminatorMap({ art: 'Article', prod: 'Product' })
      .owner(),
  },
});

export const Product = defineEntity({
  name: 'Product',
  properties: {
    id: p.number().primary(),
    categories: () => p.manyToMany(Category)
      .inversedBy('products')
      .pivotTable('categorizables')
      .discriminator('categorizable')
      .discriminatorMap({ art: 'Article', prod: 'Product' })
      .owner(),
  },
});

export class Article extends ArticleSchema.class {}
ArticleSchema.setClass(Article);
```

  </TabItem>

  <TabItem value="define-entity">

```ts
export const Article = defineEntity({
  name: 'Article',
  properties: {
    id: p.number().primary(),
    categories: () => p.manyToMany(Category)
      .inversedBy('articles')
      .pivotTable('categorizables')
      .discriminator('categorizable')
      .discriminatorMap({ art: 'Article', prod: 'Product' })
      .owner(),
  },
});

export const Product = defineEntity({
  name: 'Product',
  properties: {
    id: p.number().primary(),
    categories: () => p.manyToMany(Category)
      .inversedBy('products')
      .pivotTable('categorizables')
      .discriminator('categorizable')
      .discriminatorMap({ art: 'Article', prod: 'Product' })
      .owner(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Article {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Category, cat => cat.articles, {
    pivotTable: 'categorizables',
    discriminator: 'categorizable',
    discriminatorMap: {
      art: 'Article',      // 'art' instead of 'article'
      prod: 'Product',     // 'prod' instead of 'product'
    },
    owner: true,
  })
  categories = new Collection<Category>(this);

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Category, cat => cat.products, {
    pivotTable: 'categorizables',
    discriminator: 'categorizable',
    discriminatorMap: {
      art: 'Article',
      prod: 'Product',
    },
    owner: true,
  })
  categories = new Collection<Category>(this);

}
```

  </TabItem>
</Tabs>

The `discriminatorMap` should be defined identically on all entities sharing the same pivot table. Values must be entity class names (strings) - entity class references cannot be used due to JavaScript circular import limitations.

#### Using M:N Polymorphic Relations

```ts
// Create entities with tags
const tag1 = new Tag('TypeScript');
const tag2 = new Tag('Tutorial');

const post = new Post('Learning MikroORM');
post.tags.add(tag1, tag2);

const video = new Video('https://example.com/video.mp4');
video.tags.add(tag1);  // Same tag can be used by both

await orm.em.persist([post, video]).flush();

// Load with populated tags
const loadedPost = await orm.em.findOne(Post, post.id, { populate: ['tags'] });
console.log(loadedPost.tags.getItems()); // [Tag, Tag]

// Load from inverse side
const loadedTag = await orm.em.findOne(Tag, tag1.id, { populate: ['posts', 'videos'] });
console.log(loadedTag.posts.length);  // 1
console.log(loadedTag.videos.length); // 1
```

#### Differences from Regular M:N

1. **Shared pivot table** - Multiple entity types share the same pivot table, distinguished by the discriminator column.
2. **No FK constraint on polymorphic side** - The pivot table cannot have a foreign key constraint on the polymorphic columns since they point to different tables.
3. **Separate inverse collections** - On the inverse side (Tag), you need separate collections for each entity type (`posts`, `videos`) rather than a single polymorphic collection.
4. **Same discriminator property** - All entities sharing a pivot table must use the same `discriminator` property name.
