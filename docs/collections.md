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
console.log(author.books.getIdentifiers('_id')); // array of ObjectId

// array access works as well
console.log(author.books[1]); // Book
console.log(author.books[12345]); // undefined, even if the collection is not initialized
```

## OneToMany Collections

`OneToMany` collections are inverse side of `ManyToOne` references, to which they need to point via `fk` attribute:
 
```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @ManyToOne()
  author!: Author;

}

@Entity()
export class Author {

  @PrimaryKey()
  _id!: ObjectId;

  @OneToMany(() => Book, book => book.author)
  books1 = new Collection<Book>(this);

  // or via options object
  @OneToMany({ entity: () => Book, mappedBy: 'author' })
  books2 = new Collection<Book>(this);

}
```

## ManyToMany Collections

For ManyToMany, SQL drivers use pivot table that holds reference to both entities. 

As opposed to them, with MongoDB we do not need to have join tables for `ManyToMany` 
relations. All references are stored as an array of `ObjectId`s on owning entity. 

### Unidirectional

Unidirectional `ManyToMany` relations are defined only on one side, if you define only `entity`
attribute, then it will be considered the owning side:

```typescript
@ManyToMany(() => Book)
books1 = new Collection<Book>(this);

// or mark it as owner explicitly via options object
@ManyToMany({ entity: () => Book, owner: true })
books2 = new Collection<Book>(this);
```

### Bidirectional

Bidirectional `ManyToMany` relations are defined on both sides, while one is owning side (where references are store), 
marked by `inversedBy` attribute pointing to the inverse side:

```typescript
@ManyToMany(() => BookTag, tag => tag.books, { owner: true })
tags = new Collection<BookTag>(this);

// or via options object
@ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
tags = new Collection<BookTag>(this);
```

And on the inversed side we define it with `mappedBy` attribute pointing back to the owner:

```typescript
@ManyToMany(() => Book, book => book.tags)
books = new Collection<Book>(this);

// or via options object
@ManyToMany({ entity: () => Book, mappedBy: 'tags' })
books = new Collection<Book>(this);
```

### Forcing fixed order of collection items

> Since v3 many to many collections does not require having auto increment primary key, that 
> was used to ensure fixed order of collection items.

To preserve fixed order of collections, you can use `fixedOrder: true` attribute, which will 
start ordering by `id` column. Schema generator will convert the pivot table to have auto increment
primary key `id`. You can also change the order column name via `fixedOrderColumn: 'order'`. 

You can also specify default ordering via `orderBy: { ... }` attribute. This will be used when
you fully populate the collection including its items, as it orders by the referenced entity 
properties instead of pivot table columns (which `fixedOrderColumn` is). On the other hand, 
`fixedOrder` is used to maintain the insert order of items instead of ordering by some property. 

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

## Filtering and ordering of collection items

When initializing collection items via `collection.init()`, you can filter the collection
as well as order its items:

```typescript
await book.tags.init({ where: { active: true }, orderBy: { name: QueryOrder.DESC } });
```

> You should never modify partially loaded collection.

[&larr; Back to table of contents](index.md#table-of-contents)
