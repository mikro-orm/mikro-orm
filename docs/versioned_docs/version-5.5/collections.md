---
title: Collections
---

`OneToMany` and `ManyToMany` properties are stored in a `Collection` wrapper.

## Working with collections

The `Collection` class implements iterator, so we can use `for of` loop to iterate through it.

Another way to access collection items is to use bracket syntax like when we access array items. Keep in mind that this approach will not check if the collection is initialed, while using `get` method will throw error in this case.

> Note that array access in `Collection` is available only for reading already loaded items, we cannot add new items to `Collection` this way.

To get all entities stored in a `Collection`, we can use `getItems()` method. It will throw in case the `Collection` is not initialized. If we want to disable this validation, we can use `getItems(false)`. This will give us the entity instances managed by the identity map.

Alternatively we can use `toArray()` which will serialize the `Collection` to an array of DTOs. Modifying those will have no effect on the actual entity instances.

```ts
const author = em.findOne(Author, '...', { populate: ['books'] }); // populating books collection

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

// collection needs to be initialized before we can work with it
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

// getting array of the items
console.log(author.books.getItems()); // Book[]

// serializing the collection
console.log(author.books.toArray()); // EntityDTO<Book>[]

const author = em.findOne(Author, '...'); // books collection has not been populated
const count = await author.books.loadCount(); // gets the count of collection items from database instead of counting loaded items
console.log(author.books.getItems()); // throws because the collection has not been initialized
// initialize collection if not already loaded and return its items as array
console.log(await author.books.loadItems()); // Book[]
```

### Removing items from collection

Removing item from collection does not necessarily imply deleting the target entity, it means we are disconnecting the relation - removing items from collection, not removing entities from database - `Collection.remove()` is not the same as `em.remove()`. If we want to delete the entity by removing it from collection, we need to enable `orphanRemoval: true`, which tells the ORM we don't want orphaned entities to exist, so we know those should be removed.

## OneToMany Collections

`OneToMany` collections are inverse side of `ManyToOne` references, to which they need to point via `fk` attribute:

```ts
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

As opposed to them, with MongoDB we do not need to have join tables for `ManyToMany` relations. All references are stored as an array of `ObjectId`s on owning entity.

### Unidirectional

Unidirectional `ManyToMany` relations are defined only on one side, if we define only `entity` attribute, then it will be considered the owning side:

```ts
@ManyToMany(() => Book)
books1 = new Collection<Book>(this);

// or mark it as owner explicitly via options object
@ManyToMany({ entity: () => Book, owner: true })
books2 = new Collection<Book>(this);
```

### Bidirectional

Bidirectional `ManyToMany` relations are defined on both sides, while one is owning side (where references are store), marked by `inversedBy` attribute pointing to the inverse side:

```ts
@ManyToMany(() => BookTag, tag => tag.books, { owner: true })
tags = new Collection<BookTag>(this);

// or via options object
@ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
tags = new Collection<BookTag>(this);
```

And on the inversed side we define it with `mappedBy` attribute pointing back to the owner:

```ts
@ManyToMany(() => Book, book => book.tags)
books = new Collection<Book>(this);

// or via options object
@ManyToMany({ entity: () => Book, mappedBy: 'tags' })
books = new Collection<Book>(this);
```

### Custom pivot table entity

By default, a generated pivot table entity is used under the hood to represent the pivot table. Since v5.1 we can provide our own implementation via `pivotEntity` option.

The pivot table entity needs to have exactly two many-to-one properties, where first one needs to point to the owning entity and the second to the target entity of the many-to-many relation.

```ts
@Entity()
export class Order {

  @ManyToMany({ entity: () => Product, pivotEntity: () => OrderItem })
  products = new Collection<Product>(this);

}
```

If we want to add new items to such M:N collection, we need to have all non-FK properties to define a database level default value.

```ts
@Entity()
export class OrderItem {

  @ManyToOne({ primary: true })
  order: Order;

  @ManyToOne({ primary: true })
  product: Product;

  @Property({ default: 1 })
  amount!: number;

}
```

Alternatively, we can work with the pivot entity directly:

```ts
// create new item
const item = em.create(OrderItem, {
  order: 123,
  product: 321,
  amount: 999,
});
await em.persist(item).flush();

// or remove an item via delete query
const em.nativeDelete(OrderItem, { order: 123, product: 321 });
```

We can as well define the 1:m properties targeting the pivot entity as in the previous example, and use that for modifying the collection, while using the M:N property for easier reading and filtering purposes.

### Forcing fixed order of collection items

> Since v3 many to many collections does not require having auto increment primary key, that was used to ensure fixed order of collection items.

To preserve fixed order of collections, we can use `fixedOrder: true` attribute, which will start ordering by `id` column. Schema generator will convert the pivot table to have auto increment primary key `id`. We can also change the order column name via `fixedOrderColumn: 'order'`.

We can also specify default ordering via `orderBy: { ... }` attribute. This will be used when we fully populate the collection including its items, as it orders by the referenced entity properties instead of pivot table columns (which `fixedOrderColumn` is). On the other hand, `fixedOrder` is used to maintain the insert order of items instead of ordering by some property.

## Propagation of Collection's add() and remove() operations

When we use one of `Collection.add()` method, the item is added to given collection, and this action is also propagated to its counterpart.

```ts
// one to many
const author = new Author(...);
const book = new Book(...);

author.books.add(book);
console.log(book.author); // author will be set thanks to the propagation
```

For M:N this works in both ways, either from owning side, or from inverse side.

```ts
// many to many works both from owning side and from inverse side
const book = new Book(...);
const tag = new BookTag(...);

book.tags.add(tag);
console.log(tag.books.contains(book)); // true

tag.books.add(book);
console.log(book.tags.contains(tag)); // true
```

> Since v5.2.2 propagation of adding new items to inverse side M:N relation also works if the owning collection is not initialized. For propagation of remove operation, both sides still have to be initialized.

> Although this propagation works also for M:N inverse side, we should always use owning side to manipulate the collection.

Same applies for `Collection.remove()`.

## Filtering and ordering of collection items

When initializing collection items via `collection.init()`, we can filter the collection as well as order its items:

```ts
await book.tags.init({ where: { active: true }, orderBy: { name: QueryOrder.DESC } });
```

> We should never modify partially loaded collection.

## Filtering Collections

Collections have a `matching` method that allows to slice parts of data from a collection. By default, it will return the list of entities based on the query. We can use the `store` boolean parameter to save this list into the collection items - this will mark the collection as `readonly`, methods like `add` or `remove` will throw.

```ts
const a = await em.findOneOrFail(Author, 1);

// only loading the list of items
const books = await a.books.matching({ limit: 3, offset: 10, orderBy: { title: 'asc' } });
console.log(books); // [Book, Book, Book]
console.log(a.books.isInitialized()); // false

// storing the items in collection
const tags = await books[0].tags.matching({
  limit: 3,
  offset: 5,
  orderBy: { name: 'asc' },
  store: true,
});
console.log(tags); // [BookTag, BookTag, BookTag]
console.log(books[0].tags.isInitialized()); // true
console.log(books[0].tags.getItems()); // [BookTag, BookTag, BookTag]
```
