---
title: Using Entity Constructors
---

Internally, `MikroORM` never calls entity constructor on managed entities (those loaded via `EntityManager`), so you are free to use it as you wish. The constructor will be called only when you instantiate the class yourself via `new` operator (or when using `em.create()` to create new entity instance), so it is a handy place to require your data when creating new entity.

For example following `Book` entity definition will always require to set `title` and `author`, but `publisher` will be optional:

```ts
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @Property()
  foo!: number;

  @ManyToOne()
  author: Author;

  @ManyToOne()
  publisher?: Publisher;

  @ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}
```

Now you can construct your entity this way:

```ts
const author = new Author();
const book = new Book('Foo', author);
```

The constructor parameters will be automatically detected and respected by `em.create()` too:

```ts
const author = new Author();
const book = em.create(Book, { title: 'Foo', author, foo: 123 });
```

This will extract `title` and `author` from the data and pass it to the constructor, and assign only the rest (so here only the `foo` property) to the created entity.

> Constructor parameter inference works based on the entity property names. In other words, your parameters need to be called exactly the same as entity properties.

## POJO vs entity instance in constructor

It might be tempting to just define your constructor with a DTO as follows:

```ts
constructor(dto: { title: string; author: number }) {
  this.title = dto.title;
  // fails to compile, `number` is assignable not `Author`!
  this.author = dto.author;
}
```

Similar (but more hidden) problem would appear if your `dto.author` was a POJO (so an object, but not an instance of the `Author` entity), as that might type check, although it won't work either. The ORM expects entity instances in relation properties, nothing else.

But worry not, since v5.6 there is an easy way to convert a primary key to the entity reference, the `rel()` helper:

```ts
@ManyToOne({ entity: () => Author })
author: Rel<Author>;

constructor(dto: { title: string; author: number }) {
  this.title = dto.title;
  this.author = rel(Author, dto.author);
}
```

The `rel()` helper will create entity instance that is not yet managed (as we don't pass it any `EntityManager` instance), but it will be considered as existing entity reference once it becomes managed. This is in fact an equivalent to `em.getReference()`, but without having the `EntityManager` instance at hand.

> `rel()` is a shortcut for `Reference.createNakedFromPK()`.

And if you want to be safer and use the `Reference` wrapper, the `ref()` helper also accepts this new signature:

```ts
@ManyToOne({ entity: () => Author, ref: true })
author: Ref<Author>;

constructor(dto: { title: string; author: number }) {
  this.title = dto.title;
  this.author = ref(Author, dto.author);
}
```

The `rel` and `ref` helpers will accept both primary key and entity instance, as well as empty value (`null` or `undefined`).

```ts
book.author = ref(Author, null);
book.author = ref(Author, undefined);
book.author = ref(null);
book.author = ref(undefined);
book.author = ref(Author, 1);
book.author = ref(Author, author);
book.author = ref(author);
```

## Using native private properties

If you want to use native private properties inside entities, the default approach of how MikroORM creates entity instances via `Object.create()` is not viable (more about this in the [issue](https://github.com/mikro-orm/mikro-orm/issues/1226)). To force usage of entity constructors, you can use [`forceEntityConstructor`](./configuration.md#using-native-private-properties) toggle.
