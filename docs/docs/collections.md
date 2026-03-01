---
title: Collections
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

`OneToMany` and `ManyToMany` properties are stored in a `Collection` wrapper.

## Working with collections

The `Collection` class implements the iterator protocol, so you can use `for of` loops to iterate through it. You can also access items by index (e.g. `author.books[0]`), but this is read-only and won't check if the collection is initialized.

```ts
const author = await em.findOne(Author, '...', { populate: ['books'] });

for (const book of author.books) {
  console.log(book.title);
}

// array access works too (read-only)
console.log(author.books[0]); // Book
```

### Type-safe `$` access

When a collection is populated, MikroORM types it as `LoadedCollection`, which exposes a `$` accessor (and its alias `get()`). This gives you type-safe access to the collection that TypeScript knows is initialized:

```ts
const author = await em.findOne(Author, '...', { populate: ['books'] });

// `author.books.$` is typed as `Collection<Book>` — TypeScript knows it's loaded
for (const book of author.books.$) {
  console.log(book.title);
}
```

Without the populate hint, accessing `$` is a compile error, preventing you from accidentally working with an uninitialized collection:

```ts
const author = await em.findOne(Author, '...');

// TS Error: Property '$' does not exist on type 'Collection<Book>'
for (const book of author.books.$) { ... }
```

You can also use the `Loaded` type in function signatures to require a populated collection:

```ts
function listBookTitles(author: Loaded<Author, 'books'>): string[] {
  // Type-safe — books is guaranteed to be loaded
  return author.books.$.map(book => book.title);
}
```

See the [Type-Safe Relations](./type-safe-relations.md) guide for full documentation on `Loaded`, `Ref`, and the `$` accessor.

### Loading collections

A collection must be initialized before you can work with its items. There are several ways to load a collection:

```ts
// 1. populate when querying
const author = await em.findOne(Author, '...', { populate: ['books'] });

// 2. load() — initializes the collection if not already loaded (no-op if already initialized)
await author.books.load();

// 3. loadItems() — same as load(), but returns the items directly as an array
const books = await author.books.loadItems(); // Book[]

// 4. init() — always reloads from the database, even if already initialized
await author.books.init();
```

### Getting the count without loading

Use `loadCount()` to get the number of items from the database without loading the entities. The result is cached — pass `{ refresh: true }` to force a reload, or pass a `where` clause to count a subset (uncached):

```ts
const author = await em.findOne(Author, '...');
const count = await author.books.loadCount(); // SELECT COUNT(*) ...
const count2 = await author.books.loadCount(); // cached, no query
const count3 = await author.books.loadCount({ refresh: true }); // forced reload
const activeCount = await author.books.loadCount({ where: { active: true } }); // filtered count, not cached
```

### Adding and removing items

Use `add()` to add items and `remove()` to remove them. Both return the number of items actually added/removed (duplicates are ignored):

```ts
const added = author.books.add(book1, book2); // returns 2
const added2 = author.books.add(book1); // returns 0 (already in collection)

const removed = author.books.remove(book1); // returns 1
```

`remove()` also accepts a predicate callback to remove items matching a condition:

```ts
// remove all books with a specific title prefix
const removed = author.books.remove(book => book.title.startsWith('Draft:'));
```

Use `set()` to replace the entire collection contents, and `removeAll()` to clear it:

```ts
author.books.set([book1, book2]); // replaces all items
author.books.removeAll(); // removes all items
```

### Removing items from collection

Removing items from a collection does not necessarily imply deleting the target entity, it means you are disconnecting the relation — removing items from collection, not removing entities from database — `Collection.remove()` is not the same as `em.remove()`. When you use `em.assign()` to update entities you can also remove/disconnect entities from a collection, they do not get automatically removed from the database. If you want to delete the entity by removing it from collection, you need to enable `orphanRemoval: true`, which tells the ORM you don't want orphaned entities to exist, so those should be removed. Also check the documentation on [Orphan Removal](./cascading.md#orphan-removal).

### Checking collection state

```ts
author.books.contains(book); // true if the item is in the collection
author.books.count(); // number of items (same as author.books.length)
author.books.isEmpty(); // true if no items
author.books.isInitialized(); // true if the collection has been loaded
author.books.isDirty(); // true if the collection was modified since last flush
```

### Getting items out

```ts
author.books.getItems(); // T[] — throws if not initialized
author.books.getItems(false); // T[] — returns items without checking initialization
author.books.toArray(); // EntityDTO<T>[] — serialized DTOs, modifications won't affect entities
author.books.getIdentifiers(); // Primary<T>[] — array of primary keys
author.books.slice(0, 5); // T[] — slice of items (like Array.slice)
```

## OneToMany Collections

`OneToMany` collections are inverse side of `ManyToOne` references, to which they need to point via `mappedBy` attribute:

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
});

export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author),
  },
});

export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

}

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  // or via options object
  @OneToMany({ entity: () => Book, mappedBy: 'author' })
  books2 = new Collection<Book>(this);

}
```

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: Author;

}

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}
```

</TabItem>
</Tabs>

## ManyToMany Collections

For ManyToMany, SQL drivers use pivot table that holds reference to both entities.

As opposed to them, with MongoDB you do not need to have join tables for `ManyToMany` relations. All references are stored as an array of `ObjectId`s on owning entity.

### Unidirectional

Unidirectional `ManyToMany` relations are defined only on one side, if you define only `entity` attribute, then it will be considered the owning side:

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
const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.manyToMany(Book),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.manyToMany(Book),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
@ManyToMany(() => Book)
books = new Collection<Book>(this);

// or mark it as owner explicitly via options object
@ManyToMany({ entity: () => Book, owner: true })
books2 = new Collection<Book>(this);
```

</TabItem>
<TabItem value="ts-morph">

```ts
@ManyToMany()
books = new Collection<Book>(this);
```

</TabItem>
</Tabs>

### Bidirectional

Bidirectional `ManyToMany` relations are defined on both sides, while one is owning side (where references are stored), marked by `inversedBy` attribute pointing to the inverse side:

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
// owning side
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    tags: () => p.manyToMany(BookTag).inversedBy('books'),
  },
});

// inverse side
export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    id: p.integer().primary(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

<TabItem value="define-entity">

```ts
// owning side
export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    tags: () => p.manyToMany(BookTag).inversedBy('books'),
  },
});

// inverse side
export const BookTag = defineEntity({
  name: 'BookTag',
  properties: {
    id: p.integer().primary(),
    books: () => p.manyToMany(Book).mappedBy('tags'),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
// owning side
@ManyToMany(() => BookTag, tag => tag.books, { owner: true })
tags = new Collection<BookTag>(this);

// or via options object
@ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
tags = new Collection<BookTag>(this);

// inverse side
@ManyToMany(() => Book, book => book.tags)
books = new Collection<Book>(this);

// or via options object
@ManyToMany({ entity: () => Book, mappedBy: 'tags' })
books = new Collection<Book>(this);
```

</TabItem>
<TabItem value="ts-morph">

```ts
// owning side
@ManyToMany({ inversedBy: 'books' })
tags = new Collection<BookTag>(this);

// inverse side
@ManyToMany({ mappedBy: 'tags' })
books = new Collection<Book>(this);
```

</TabItem>
</Tabs>

### Custom pivot table entity

By default, a generated pivot table entity is used under the hood to represent the pivot table. You can provide your own implementation via `pivotEntity` option.

The pivot table entity needs to have exactly two many-to-one properties, where first one needs to point to the owning entity and the second to the target entity of the many-to-many relation.

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
const OrderSchema = defineEntity({
  name: 'Order',
  properties: {
    id: p.integer().primary(),
    products: () => p.manyToMany(Product).pivotEntity(() => OrderItem),
  },
});

export const Product = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    orders: () => p.manyToMany(Order).mappedBy('products'),
  },
});

export const OrderItem = defineEntity({
  name: 'OrderItem',
  properties: {
    order: () => p.manyToOne(Order).primary(),
    product: () => p.manyToOne(Product).primary(),
    amount: p.integer().default(1),
  },
});

export class Order extends OrderSchema.class {}
OrderSchema.setClass(Order);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Order = defineEntity({
  name: 'Order',
  properties: {
    id: p.integer().primary(),
    products: () => p.manyToMany(Product).pivotEntity(() => OrderItem),
  },
});

export const Product = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    orders: () => p.manyToMany(Order).mappedBy('products'),
  },
});

export const OrderItem = defineEntity({
  name: 'OrderItem',
  properties: {
    order: () => p.manyToOne(Order).primary(),
    product: () => p.manyToOne(Product).primary(),
    amount: p.integer().default(1),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Product, pivotEntity: () => OrderItem })
  products = new Collection<Product>(this);

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Order, mappedBy: o => o.products })
  orders = new Collection<Order>(this);

}

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

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ pivotEntity: () => OrderItem })
  products = new Collection<Product>(this);

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ mappedBy: 'products' })
  orders = new Collection<Order>(this);

}

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

</TabItem>
</Tabs>

For bidirectional M:N relations, it is enough to specify the `pivotEntity` option only on the owning side. You still need to link the sides via `inversedBy` or `mappedBy` option.

If you want to add new items to such M:N collection, you need to have all non-FK properties to define a database level default value.

Alternatively, you can work with the pivot entity directly:

```ts
// create new item
const item = em.create(OrderItem, {
  order: 123,
  product: 321,
  amount: 999,
});
await em.persist(item).flush();

// or remove an item via delete query
await em.nativeDelete(OrderItem, { order: 123, product: 321 });
```

You can as well define the 1:m properties targeting the pivot entity as in the previous example, and use that for modifying the collection, while using the M:N property for easier reading and filtering purposes.

### Forcing fixed order of collection items

> Many to many collections do not require having auto increment primary key.

To preserve fixed order of collections, you can use `fixedOrder: true` attribute, which will start ordering by `id` column. Schema generator will convert the pivot table to have auto increment primary key `id`. You can also change the order column name via `fixedOrderColumn: 'order'`.

You can also specify default ordering via `orderBy: { ... }` attribute. This will be used when you fully populate the collection including its items, as it orders by the referenced entity properties instead of pivot table columns (which `fixedOrderColumn` is). On the other hand, `fixedOrder` is used to maintain the insert order of items instead of ordering by some property.

## Populating references

Sometimes you might want to know only what items are part of a collection, and you don't care about the values of those items. For this, you can populate the collection only with references:

```ts
const book1 = await em.findOne(Book, 1, { populate: ['tags:ref'] });
console.log(book1.tags.isInitialized()); // true
console.log(wrap(book1.tags[0]).isInitialized()); // false

// or alternatively use `init({ ref: true })`
const book2 = await em.findOne(Book, 1);
await book2.tags.init({ ref: true });
console.log(book2.tags.isInitialized()); // true
console.log(wrap(book2.tags[0]).isInitialized()); // false
```

## Propagation of Collection's add() and remove() operations

When you use one of `Collection.add()` method, the item is added to given collection, and this action is also propagated to its counterpart.

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

> Propagation of adding new items to inverse side M:N relation also works if the owning collection is not initialized. For propagation of remove operation, both sides still have to be initialized.

> Although this propagation works also for M:N inverse side, you should always use owning side to manipulate the collection.

Same applies for `Collection.remove()`.

## Filtering and ordering of collection items

When initializing collection items via `collection.init()`, you can filter the collection as well as order its items:

```ts
await book.tags.init({
  where: { active: true },
  orderBy: { name: QueryOrder.DESC },
});
```

> You should never modify partially loaded collections.

## Entity-level default ordering

You can define a default `orderBy` on the entity itself using `@Entity({ orderBy: ... })`. When populating a collection, all applicable orderings are combined with runtime `orderBy` taking highest priority, followed by relation-level `orderBy`, and finally entity-level `orderBy`.

See [Default Entity Ordering](./defining-entities.md#default-entity-ordering) for full documentation and examples.

## Declarative partial loading

Collections can also represent only a subset of the target entities:

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
const AuthorSchema = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
    favoriteBooks: () => p.oneToMany(Book).mappedBy('author').where({ favorite: true }),
  },
});

export class Author extends AuthorSchema.class {}
AuthorSchema.setClass(Author);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    books: () => p.oneToMany(Book).mappedBy('author'),
    favoriteBooks: () => p.oneToMany(Book).mappedBy('author').where({ favorite: true }),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity()
class Author {

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author, { where: { favorite: true } })
  favoriteBooks = new Collection<Book>(this);

}
```

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity()
class Author {

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author, { where: { favorite: true } })
  favoriteBooks = new Collection<Book>(this);

}
```

</TabItem>
</Tabs>

This works also for M:N relations. Note that if you want to declare more relations mapping to the same pivot table, you need to explicitly specify its name (or use the same pivot entity):

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
const BookSchema = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    tags: () => p.manyToMany(BookTag),
    popularTags: () => p.manyToMany(BookTag).pivotTable('book_tags').where({ popular: true }),
  },
});

export class Book extends BookSchema.class {}
BookSchema.setClass(Book);
```

  </TabItem>

<TabItem value="define-entity">

```ts
export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    tags: () => p.manyToMany(BookTag),
    popularTags: () => p.manyToMany(BookTag).pivotTable('book_tags').where({ popular: true }),
  },
});
```

</TabItem>
<TabItem value="reflect-metadata">

```ts
@Entity()
class Book {

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  @ManyToMany({
    entity: () => BookTag,
    pivotTable: 'book_tags',
    where: { popular: true },
  })
  popularTags = new Collection<BookTag>(this);

}
```

</TabItem>
<TabItem value="ts-morph">

```ts
@Entity()
class Book {

  @ManyToMany()
  tags = new Collection<BookTag>(this);

  @ManyToMany({
    entity: () => BookTag,
    pivotTable: 'book_tags',
    where: { popular: true },
  })
  popularTags = new Collection<BookTag>(this);

}
```

</TabItem>
</Tabs>

## Filtering Collections

Collections have a `matching` method that allows to slice parts of data from a collection. By default, it will return the list of entities based on the query. You can use the `store` boolean parameter to save this list into the collection items - this will mark the collection as `readonly`, methods like `add` or `remove` will throw.

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

## Collection helper methods

The `Collection` class provides array-like helper methods that work on the loaded items. All of these require the collection to be initialized — they will throw otherwise.

### `map`

Maps each item through a callback, same as `Array.map()`:

```ts
const titles = author.books.map(book => book.title); // string[]
```

### `filter`

Returns items matching a predicate, same as `Array.filter()`. Supports type guards:

```ts
const longBooks = author.books.filter(book => book.pageCount > 300); // Book[]
```

### `find`

Returns the first item matching a predicate, same as `Array.find()`. Supports type guards:

```ts
const firstLongBook = author.books.find(book => book.pageCount > 300); // Book | undefined
```

### `exists`

Returns `true` if any item matches the predicate:

```ts
const hasLongBook = author.books.exists(book => book.pageCount > 300); // boolean
```

### `reduce`

Reduces the collection to a single value, same as `Array.reduce()`:

```ts
const totalPages = author.books.reduce((sum, book) => sum + book.pageCount, 0); // number
```

### `indexBy`

Converts the collection to a key-value dictionary, indexed by the given property:

```ts
// given `user.settings` is `Collection<Option>`
const settingsDictionary = user.settings.indexBy('key');
// Record<string, Option>
```

The second argument lets you map to property values instead of the target entity:

```ts
const settingsDictionary = user.settings.indexBy('key', 'value');
// Record<string, string>
```
