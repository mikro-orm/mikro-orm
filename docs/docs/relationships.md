---
title: Modeling Entity Relationships
sidebar_label: Modeling Entity Relationships
---

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

```ts
@Entity()
export class Book {

  @ManyToOne() // plain decorator is enough, type will be sniffer via reflection!
  author1!: Author;

  @ManyToOne(() => Author) // you can specify type manually as a callback
  author2!: Author;

  @ManyToOne('Author') // or as a string
  author3!: Author;

  @ManyToOne({ entity: () => Author }) // or use options object
  author4!: Author;

}
```

You can also specify how operations on given entity should [cascade](./cascading.md) to the referred entity.

## OneToMany

> One instance of the current Entity has Many instances (references) to the referred Entity.

Again, all of the following is equivalent:

```ts
@Entity()
export class Author {

  @OneToMany(() => Book, book => book.author)
  books1 = new Collection<Book>(this);

  @OneToMany('Book', 'author')
  books2 = new Collection<Book>(this);

  @OneToMany({ mappedBy: book => book.author }) // referenced entity type can be sniffer too
  books3 = new Collection<Book>(this);

  @OneToMany({ entity: () => Book, mappedBy: 'author', orphanRemoval: true })
  books4 = new Collection<Book>(this);

}
```

As you can see, OneToMany is the inverse side of ManyToOne (which is the owning side). More about how collections work can be found on [collections page](./collections.md).

You can also specify how operations on given entity should [cascade](./cascading.md) to the referred entities. There is also more aggressive remove mode called [Orphan Removal](./cascading.md#orphan-removal) (`books4` example).

## OneToOne

> One instance of the current Entity refers to One instance of the referred Entity.

This is a variant of ManyToOne, where there is always just one entity on both sides. This means that the foreign key column is also unique.

### Owning Side

```ts
@Entity()
export class User {

  // when none of `owner/inverseBy/mappedBy` is provided, it will be considered owning side
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

### Inverse Side

```ts
@Entity()
export class User {

  @OneToOne({ mappedBy: 'bestFriend1', orphanRemoval: true })
  bestFriend1!: User;

  @OneToOne(() => User, user => user.bestFriend2, { orphanRemoval: true })
  bestFriend2!: User;

}
```

As you can see, relationships can be also self-referencing (all of them. OneToOne also supports [Orphan Removal](./cascading.md#orphan-removal)).

## ManyToMany

> Many instances of the current Entity refers to Many instances of the referred Entity.

Here are examples of how you can define ManyToMany relationship:

### Owning Side

```ts
@Entity()
export class Book {

  // when none of `owner/inverseBy/mappedBy` is provided, it will be considered owning side
  @ManyToMany()
  tags1 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags2 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags3 = new Collection<BookTag>(this);

  @ManyToMany(() => BookTag, 'books', { owner: true })
  tags4 = new Collection<BookTag>(this);

  // to define uni-directional many to many, simply provide only
  @ManyToMany(() => Author)
  friends: Collection<Author> = new Collection<Author>(this);

}
```

### Inverse Side

```ts
@Entity()
export class BookTag {

  // inverse side has to point to the owning side via `mappedBy` attribute/parameter
  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

}
```

Again, more information about how collections work can be found on [collections page](./collections.md).

## Relations in ESM projects

If you use ESM in your TypeScript project with `reflect-metadata`, you might fall into issues with circular dependencies, seeing errors like this:

    ReferenceError: Cannot access 'Author' before initialization

To get around them, use the `Rel` mapped type. It is an identity type, which disables the problematic inference from `reflect-metadata`, that causes ESM projects to fail.

```ts
import { Rel } from '@mikro-orm/core';

@Entity()
export class Book {

  @ManyToOne(() => Author)
  author!: Rel<Author>;

}
```

## Custom foreign key constraint name

If you need a greater control on the underlying SQL schema, you can provide a custom name for the foreign key constraint of your relationship on the owning side.

This name overrides the one automatically generated by the current [NamingStrategy](./naming-strategy.md).


```ts
@Entity()
export class Book {

  @ManyToOne(() => Author, { foreignKeyName: 'my_custom_name' })
  author1: Author;

}
```

## Disabling foreign key constraint creation

If you need to disable the creation of the underlying SQL foreign key constraint for a specific relation, you can set `createForeignKeyConstraint` to `false` on the relation on the owning side.

```ts
@Entity()
export class Book {

  @ManyToOne(() => Author, { createForeignKeyConstraint: false })
  author1: Author;

}
```

Note that if you globally disable the creation of all foreign key contraints by setting `createForeignKeyConstraints` to `false`, then no foreign key constraint is created whatsoever on any relation.

```ts
const orm = await MikroORM.init({
  ...
  schemaGenerator: {
    createForeignKeyConstraints: false,
  },
});
```
