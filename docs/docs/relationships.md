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

Relations can be unidirectional and bidirectional. Unidirectional are defined only on one side (the owning side). Bidirectional are defined on both sides, while one is owning side (where references are store), marked by `inversedBy` attribute pointing to the inverse side. On the inversed side we define it with `mappedBy` attribute pointing back to the owner:

> When modeling bidirectional relationship, you can also omit the `inversedBy` attribute, defining `mappedBy` on the inverse side is enough as it will be auto-wired.

## ManyToOne

> Many instances of the current Entity refer to One instance of the referred Entity.

There are multiple ways how to define the relationship, all of the following is equivalent:

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  @ManyToOne() // plain decorator is enough, type will be sniffed via reflection!
  author1!: Author;

  @ManyToOne(() => Author) // you can specify type manually as a callback
  author2!: Author;

  @ManyToOne('Author') // or as a string
  author3!: Author;

  @ManyToOne({ entity: () => Author }) // or use options object
  author4!: Author;

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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  }),
});

export interface IBook extends InferEntity<typeof Book> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IBook {
  id: number;
  author: Author;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: 'number', primary: true },
    author: { kind: 'm:1', entity: 'Author' },
  },
});
```

  </TabItem>
</Tabs>

You can also specify how operations on given entity should [cascade](./cascading.md) to the referred entity.

## OneToMany

> One instance of the current Entity has Many instances (references) to the referred Entity.

Again, all of the following is equivalent:

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const Author = defineEntity({
  name: 'Author',
  properties: p => ({
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  }),
});

export interface IAuthor extends InferEntity<typeof Author> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IAuthor {
  id: number;
  books: Collection<Book>;
}

export const Author = new EntitySchema<IAuthor>({
  name: 'Author',
  properties: {
    id: { type: 'number', primary: true },
    books: { kind: '1:m', entity: () => Book, mappedBy: 'author' },
  },
});
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
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: p => ({
    id: p.integer().primary(),
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    bestFriend1: () => p.oneToOne(User),
    // side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
    bestFriend2: () => p.oneToOne(User).inversedBy('bestFriend1'),
    // you need to specifically mark the owning side with `owner: true`
    bestFriend3: () => p.oneToOne(User).owner(),
  }),
});

export interface IUser extends InferEntity<typeof User> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IUser {
  id: number;
  bestFriend1: User;
  bestFriend2: User;
  bestFriend3: User;
}

export const User = new EntitySchema<IUser>({
  name: 'User',
  properties: {
    id: { type: 'number', primary: true },
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    bestFriend1: { kind: '1:1', entity: 'User' },
    // side with `inversedBy` is the owning one, to define inverse side use `mappedBy`
    bestFriend2: { kind: '1:1', entity: 'User', inversedBy: 'bestFriend1' },
    // you need to specifically mark the owning side with `owner: true`
    bestFriend3: { kind: '1:1', entity: 'User', owner: true },
  },
});
```

  </TabItem>
</Tabs>

### Inverse Side

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const User = defineEntity({
  name: 'User',
  properties: p => ({
    id: p.integer().primary(),
    bestFriend1: () => p.oneToOne(User).mappedBy('bestFriend1').orphanRemoval(),
    bestFriend2: () => p.oneToOne(User).mappedBy('bestFriend2').orphanRemoval(),
  }),
});

export interface IUser extends InferEntity<typeof User> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IUser {
  id: number;
  bestFriend1: User;
  bestFriend2: User;
}

export const User = new EntitySchema<IUser>({
  name: 'User',
  properties: {
    id: { type: 'number', primary: true },
    bestFriend1: { kind: '1:1', entity: 'User', mappedBy: 'bestFriend1', orphanRemoval: true },
    bestFriend2: { kind: '1:1', entity: 'User', mappedBy: 'bestFriend2', orphanRemoval: true },
  },
});
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
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
  <TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
  @ManyToMany()
  tags1 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags2 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags3 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags4 = new Collection<BookTag>(this);

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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    id: p.integer().primary(),
    // when none of `owner/inversedBy/mappedBy` is provided, it will be considered owning side
    tags: () => p.manyToMany(BookTag),
    // to define uni-directional many to many, simply omit `mappedBy`
    friends: () => p.manyToMany(Author),
  }),
});

export interface IBook extends InferEntity<typeof Book> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IBook {
  id: number;
  tags: Collection<BookTag>;
  friends: Collection<Author>;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: 'number', primary: true },
    tags: { kind: 'm:n', entity: 'BookTag' },
    // to define uni-directional many to many, simply omit `mappedBy`
    friends: { kind: 'm:n', entity: 'Author' },
  },
});
```

  </TabItem>
</Tabs>

### Inverse Side

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const BookTag = defineEntity({
  name: 'BookTag',
  properties: p => ({
    id: p.integer().primary(),
    // inverse side has to point to the owning side via `mappedBy`
    books: () => p.manyToMany(Book).mappedBy('tags'),
  }),
});

export interface IBookTag extends InferEntity<typeof BookTag> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IBookTag {
  id: number;
  books: Collection<Book>;
}

export const BookTag = new EntitySchema<IBookTag>({
  name: 'BookTag',
  properties: {
    id: { type: 'number', primary: true },
    // inverse side has to point to the owning side via `mappedBy`
    books: { kind: 'm:n', entity: () => Book, mappedBy: 'tags' },
  },
});
```

  </TabItem>
</Tabs>

Again, more information about how collections work can be found on [collections page](./collections.md).

## Relations in ESM projects

If you use ESM in your TypeScript project with `reflect-metadata`, you might fall into issues with circular dependencies, seeing errors like this:

    ReferenceError: Cannot access 'Author' before initialization

To get around them, use the `Rel` mapped type. It is an identity type, which disables the problematic inference from `reflect-metadata`, that causes ESM projects to fail.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  }),
});

export interface IBook extends InferEntity<typeof Book> {}
```

> With `defineEntity`, circular dependencies are handled automatically, no need for `Rel` wrapper.

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IBook {
  id: number;
  author: Author;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: 'number', primary: true },
    author: { kind: 'm:1', entity: () => Author },
  },
});
```

> With `EntitySchema`, circular dependencies are handled automatically via lazy references.

  </TabItem>
</Tabs>

## Custom foreign key constraint name

If you need a greater control on the underlying SQL schema, you can provide a custom name for the foreign key constraint of your relationship on the owning side.

This name overrides the one automatically generated by the current [NamingStrategy](./naming-strategy.md).

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).foreignKeyName('my_custom_name'),
  }),
});

export interface IBook extends InferEntity<typeof Book> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IBook {
  id: number;
  author: Author;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: 'number', primary: true },
    author: { kind: 'm:1', entity: 'Author', foreignKeyName: 'my_custom_name' },
  },
});
```

  </TabItem>
</Tabs>

## Disabling foreign key constraint creation

If you need to disable the creation of the underlying SQL foreign key constraint for a specific relation, you can set `createForeignKeyConstraint` to `false` on the relation on the owning side.

<Tabs
  groupId="entity-def"
  defaultValue="reflect-metadata"
  values={[
    {label: 'reflect-metadata', value: 'reflect-metadata'},
    {label: 'ts-morph', value: 'ts-morph'},
    {label: 'defineEntity', value: 'define-entity'},
    {label: 'EntitySchema', value: 'entity-schema'},
  ]
  }>
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
  <TabItem value="define-entity">

```ts
import { defineEntity, InferEntity } from '@mikro-orm/core';

export const Book = defineEntity({
  name: 'Book',
  properties: p => ({
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).createForeignKeyConstraint(false),
  }),
});

export interface IBook extends InferEntity<typeof Book> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts
export interface IBook {
  id: number;
  author: Author;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: 'number', primary: true },
    author: { kind: 'm:1', entity: 'Author', createForeignKeyConstraint: false },
  },
});
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
