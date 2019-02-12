# Cascading persist and remove

When persisting or removing entity, all your references are by default cascade persisted. 
This means that by persisting any entity, ORM will automatically persist all of its 
associations. 

You can control this behaviour via `cascade` attribute of `@ManyToOne`, `@ManyToMany` and
`@OneToMany` fields.

> New entities without primary key will be always persisted, regardless of `cascade` value. 

```typescript
// cascade persist is default value
@OneToMany({ entity: () => Book, fk: 'author' })
books = new Collection<Book>(this);

// same as previous definition
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.PERSIST] })
books = new Collection<Book>(this);

// only cascade remove
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.REMOVE] })
books = new Collection<Book>(this);

// cascade persist and remove
@OneToMany({ entity: () => Book, fk: 'author', cascade: [Cascade.PERSIST, Cascade.REMOVE] })
books = new Collection<Book>(this);

// no cascade
@OneToMany({ entity: () => Book, fk: 'author', cascade: [] })
books = new Collection<Book>(this);
```

## Cascade persist

Here is example of how cascade persist works:

```typescript
const book = await orm.em.findOne<Book>(Book, 'id', ['author', 'tags']);
book.author.name = 'Foo Bar';
book.tags[0].name = 'new name 1';
book.tags[1].name = 'new name 2';
await orm.em.persist(book); // all book tags and author will be persisted too
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
