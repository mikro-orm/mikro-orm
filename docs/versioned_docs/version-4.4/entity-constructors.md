---
title: Using Entity Constructors
---

Internally, `MikroORM` never calls entity constructor, so you are free to use it as you wish.
The constructor will be called only when you instantiate the class yourself via `new` operator,
so it is a handy place to require your data when creating new entity.

For example following `Book` entity definition will always require to set `title` and `author`, 
but `publisher` will be optional:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne()
  author!: Author;

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

## Using native private properties

If we want to use native private properties inside entities, the default approach of
how MikroORM creates entity instances via `Object.create()` is not viable (more about this
in the [issue](https://github.com/mikro-orm/mikro-orm/issues/1226)). To force usage of entity
constructors, we can use [`forceEntityConstructor`](./configuration.md#using-native-private-properties) toggle.
