---
---

# Collections

`OneToMany` and `ManyToMany` collections are stored in a `Collection` wrapper. It implements
iterator so you can use `for of` loop to iterate through it. 

Another way to access collection items is to use bracket syntax like when you access array items.
Keep in mind that this approach will not check if the collection is initialed, while using `get`
method will throw error in this case.

> Note that array access in `Collection` is available only for reading already loaded items, you 
> cannot add new items to `Collection` this way. 

```typescript
const author = orm.em.findOne(Author, '...', ['books']); // populating books collection

// or we could lazy load books collection later via `init()` method
await author.books.init();

for (const book of author.books) {
  console.log(book.title); // initialized
  console.log(book.author.isInitialized()); // true
  console.log(book.author.id);
  console.log(book.author.name); // Jon Snow
  console.log(book.publisher); // just reference
  console.log(book.publisher.isInitialized()); // false
  console.log(book.publisher.id);
  console.log(book.publisher.name); // undefined
}

// collection needs to be initialized before you can work with it
author.books.add(book);
console.log(author.books.contains(book)); // true
author.books.remove(book);
console.log(author.books.contains(book)); // false
author.books.add(book);
console.log(author.books.count()); // 1
author.books.removeAll();
console.log(author.books.contains(book)); // false
console.log(author.books.count()); // 0
console.log(author.books.getItems()); // Book[]
console.log(author.books.getIdentifiers()); // array of string | number
console.log(author.books.getIdentifiers('_id')); // array of ObjectID

// array access works as well
console.log(author.books[1]); // Book
console.log(author.books[12345]); // undefined, even if the collection is not initialized
```

## OneToMany collections

`OneToMany` collections are inverse side of `ManyToOne` references, to which they need to point via `fk` attribute:
 
```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @ManyToOne()
  author: Author;

}

@Entity()
export class Author {

  @PrimaryKey()
  _id: ObjectID;

  @OneToMany({ entity: () => Book, mappedBy: 'author' })
  books = new Collection<Book>(this);

}
```

## ManyToMany collections

As opposed to SQL databases, with MongoDB we do not need to have join tables for `ManyToMany` relations. 
All references are stored as an array of `ObjectID`s on owning entity. 

### Unidirectional

Unidirectional `ManyToMany` relations are defined only on one side, and marked explicitly as `owner`:

```typescript
@ManyToMany({ entity: () => Book, owner: true })
books = new Collection<Book>(this);
```

### Bidirectional

Bidirectional `ManyToMany` relations are defined on both sides, while one is owning side (where references are store), 
marked by `inversedBy` attribute pointing to the inverse side:

```typescript
@ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
tags = new Collection<BookTag>(this);
```

And on the inversed side we define it with `mappedBy` attribute poining back to the owner:

```typescript
@ManyToMany({ entity: () => Book, mappedBy: 'tags' })
books = new Collection<Book>(this);
```

## Propagation of Collection's add() and remove() operations

When you use one of `Collection.add()` method, the item is added to given collection, 
and this action is also propagated to its counterpart. 

```typescript
// one to many
const author = new Author(...);
const book = new Book(...);

author.books.add(book);
console.log(book.author); // author will be set thanks to the propagation
```

For M:N this works in both ways, either from owning side, or from inverse side. 

```typescript
// many to many works both from owning side and from inverse side
const book = new Book(...);
const tag = new BookTag(...);

book.tags.add(tag);
console.log(tag.books.contains(book)); // true

tag.books.add(book);
console.log(book.tags.contains(tag)); // true
``` 

> Collections on both sides have to be initialized, otherwise propagation won't work.

> Although this propagation works also for M:N inverse side, you should always use owning
> side to manipulate the collection.

Same applies for `Collection.remove()`.

[&larr; Back to table of contents](index.md#table-of-contents)
