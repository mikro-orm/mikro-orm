---
title: Cascading persist, merge and remove
sidebar_label: Cascading
---

> From v4.2, cascade merging is no longer configurable (and is kept enabled for all relations).

> This section is about application level cascading. For that to work, we need
> to have relations populated. 

When persisting or removing entity, all your references are by default cascade persisted. 
This means that by persisting any entity, ORM will automatically persist all of its 
associations. 

You can control this behaviour via `cascade` attribute of `@ManyToOne`, `@ManyToMany`, 
`@OneToMany` and `@OneToOne` fields.

> New entities without primary key will be always persisted, regardless of `cascade` value. 

```typescript
// cascade persist is default value
@OneToMany({ entity: () => Book, mappedBy: 'author' })
books = new Collection<Book>(this);

// same as previous definition
@OneToMany({ entity: () => Book, mappedBy: 'author', cascade: [Cascade.PERSIST] })
books = new Collection<Book>(this);

// only cascade remove
@OneToMany({ entity: () => Book, mappedBy: 'author', cascade: [Cascade.REMOVE] })
books = new Collection<Book>(this);

// cascade persist and remove (same as `Cascade.ALL`)
@OneToMany({ entity: () => Book, mappedBy: 'author', cascade: [Cascade.PERSIST, Cascade.REMOVE] })
books = new Collection<Book>(this);

// no cascade
@OneToMany({ entity: () => Book, mappedBy: 'author', cascade: [] })
books = new Collection<Book>(this);

// cascade all (persist and remove)
@OneToMany({ entity: () => Book, mappedBy: 'author', cascade: [Cascade.ALL] })
books = new Collection<Book>(this);

// same as previous definition
@OneToMany({ entity: () => Book, mappedBy: 'author', cascade: [Cascade.PERSIST, Cascade.REMOVE] })
books = new Collection<Book>(this);
```

## Cascade persist

Here is example of how cascade persist works:

```typescript
const book = await orm.em.findOne(Book, 'id', ['author', 'tags']);
book.author.name = 'Foo Bar';
book.tags[0].name = 'new name 1';
book.tags[1].name = 'new name 2';
await orm.em.persistAndFlush(book); // all book tags and author will be persisted too
```

> When cascade persisting collections, keep in mind only fully initialized collections 
> will be cascade persisted.

## Cascade remove

Cascade remove works same way as cascade persist, just for removing entities. Following 
example assumes that `Book.publisher` is set to `Cascade.REMOVE`:

> Note that cascade remove for collections can be inefficient as it will fire 1 query
> for each entity in collection.

```typescript
await orm.em.removeEntity(book); // this will also remove book.publisher
```

Keep in mind that cascade remove **can be dangerous** when used on `@ManyToOne` fields, 
as cascade removed entity can stay referenced in another entities that were not removed.

```typescript
const publisher = new Publisher(...);
// all books with same publisher
book1.publisher = book2.publisher = book3.publisher = publisher;
await orm.em.removeEntity(book1); // this will remove book1 and its publisher

// but we still have reference to removed publisher here
console.log(book2.publisher, book3.publisher);
```

## Orphan removal

In addition to `Cascade.REMOVE`, there is also additional and more aggressive remove 
cascading mode which can be specified using the `orphanRemoval` flag of the `@OneToOne`
and `@OneToMany` properties:

```typescript
@Entity()
export class Author {

  @OneToMany({ entity: () => Book, mappedBy: 'author', orphanRemoval: true })
  books = new Collection<Book>(this);

}
```

> `orphanRemoval` flag behaves just like `Cascade.REMOVE` for remove operation, so specifying 
> both is redundant.

With simple `Cascade.REMOVE`, you would need to remove the `Author` entity to cascade 
the operation down to all loaded `Book`s. By enabling orphan removal on the collection, 
`Book`s will be also removed when they get disconnected from the collection (either via 
`remove()`, or by replacing collection items via `set()`):

```typescript
await author.books.set([book1, book2]); // replace whole collection
await author.books.remove(book1); // remove book from collection
await orm.em.persistAndFlush(author); // book1 will be removed, as well as all original items (before we called `set()`)
```

In this example, no `Book` would be removed with simple `Cascade.REMOVE` as no remove operation
was executed. 

## Declarative Referential Integrity

> This is only supported in SQL drivers.

As opposed to the application level cascading controlled by the `cascade` option, we can
also define database level referential integrity actions: `on update` and `on delete`.

Their values are automatically inferred from the `cascade` option value. You can also 
control the value manually via `onUpdateIntegrity` and `onDelete` options. 

```typescript
@Entity()
export class Book {

  @ManyToOne({ onUpdateIntegrity: 'set null', onDelete: 'cascade' })
  author?: Author;

}
```
