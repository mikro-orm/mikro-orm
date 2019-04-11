---
---

# Cascading persist, merge and remove

When persisting or removing entity, all your references are by default cascade persisted. 
This means that by persisting any entity, ORM will automatically persist all of its 
associations. 

You can control this behaviour via `cascade` attribute of `@ManyToOne`, `@ManyToMany`, 
`@OneToMany` and `@OneToOne` fields.

> New entities without primary key will be always persisted, regardless of `cascade` value. 

```typescript
// cascade persist & merge is default value
@OneToMany({ entity: () => Book, fk: 'author' })
books = new Collection<Book>(this);

// same as previous definition
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.PERSIST, Cascade.MERGE] })
books = new Collection<Book>(this);

// only cascade remove
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.REMOVE] })
books = new Collection<Book>(this);

// cascade persist and remove (but not merge)
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.PERSIST, Cascade.REMOVE] })
books = new Collection<Book>(this);

// no cascade
@OneToMany({ entity: () => Book, fk: 'author', cascade: [] })
books = new Collection<Book>(this);

// cascade all (persist, merge and remove)
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.ALL] })
books = new Collection<Book>(this);

// same as previous definition
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.PERSIST, Cascade.MERGE, Cascade.REMOVE] })
books = new Collection<Book>(this);
```

## Cascade persist

Here is example of how cascade persist works:

```typescript
const book = await orm.em.findOne(Book, 'id', ['author', 'tags']);
book.author.name = 'Foo Bar';
book.tags[0].name = 'new name 1';
book.tags[1].name = 'new name 2';
await orm.em.persist(book); // all book tags and author will be persisted too
```

> When cascade persisting collections, keep in mind only fully initialized collections 
> will be cascade persisted.

## Cascade merge

When you want to merge entity and all its associations, you can use `Cascade.MERGE`. This
comes handy when you want to clear identity map (e.g. when importing large number of entities), 
but you also have to keep your parent entities managed (because otherwise they would be considered
as new entities and insert-persisted, which would fail with non-unique identifier).

In following example, without having `Author.favouriteBook` set to cascade merge, you would 
get an error because it would be cascade-inserted with already taken ID. 

```typescript
const a1 = new Author(...);
a1.favouriteBook = new Book('the best', ...);
await orm.em.persistAndFlush(a1); // cascade persists favourite book as well

for (let i = 1; i < 1000; i++) {
  const book = new Book('...', a1);
  orm.em.persistLater(book);
  
  // persist every 100 records
  if (i % 100 === 0) {
    await orm.em.flush();
    orm.em.clear(); // this makes both a1 and his favourite book detached
    orm.em.merge(a1); // so we need to merge them to prevent cascade-inserts
    
    // without cascade merge, you would need to manually merge all his associations
    orm.em.merge(a1.favouriteBook); // not needed with Cascade.MERGE
  }
}

await orm.em.flush();
```

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
