# Defining entity

```typescript
@Entity()
export class Book {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  title: string;

  @ManyToOne() // when you provide correct type hint, ORM will read it for you
  author: Author;

  @ManyToOne({ entity: () => Publisher }) // or you can specify the entity as class reference or string name
  publisher: Publisher;

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

export interface Book extends IEntity { }
```

You will need to extend Book's interface with `IEntity` or your entity must extend BaseEntity
which does that for you. `IEntity` interface represents internal methods added to your entity's 
prototype via `@Entity` decorator.

With your entities set up, you can start using entity manager and repositories as described
in following section. For more examples, take a look at
[`tests/EntityManager.mongo.test.ts`](https://github.com/B4nan/mikro-orm/blob/master/tests/EntityManager.mongo.test.ts).

[&larr; Back to table of contents](https://b4nan.github.io/mikro-orm/#table-of-contents)
