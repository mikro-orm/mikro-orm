---
---

# Using Entity Constructors

Internally, `MikroORM` never calls entity constructor, so you are free to use it as you wish.
The constructor will be called only when you instantiate the class yourself via `new` operator,
so it is a handy place to require your data when creating new entity.

For example following `Book` entity definition will always require to set `title` and `author`, 
but `publisher` will be optional:

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  title: string;

  @ManyToOne()
  author: Author;

  @ManyToOne()
  publisher: Publisher;

  @ManyToMany({ entity: () => BookTag, inversedBy: 'books' })
  tags = new Collection<BookTag>(this);

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity { }
```

[&larr; Back to table of contents](index.md#table-of-contents)
