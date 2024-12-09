---
title: Type-Safe Relations
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Entity relations are mapped to entity references - instances of the entity that have at least the primary key available. This reference is stored in identity map, so you will get the same object reference when fetching the same document from database.

```ts
@ManyToOne(() => Author)
author!: Author; // the value is always instance of the `Author` entity
```

You can check whether an entity is initialized via `wrap(entity).isInitialized()`, and use `await wrap(entity).init()` to initialize it. This will trigger database call and populate the entity, keeping the same reference in identity map.

```ts
const author = em.getReference(Author, 123);
console.log(author.id); // accessing the id will not trigger any db call
console.log(wrap(author).isInitialized()); // false
console.log(author.name); // undefined

await wrap(author).init(); // this will trigger db call
console.log(wrap(author).isInitialized()); // true
console.log(author.name); // defined
```

The `isInitialized()` method can be used for runtime checks, but that could end up being quite tedious - we can do better! Instead of manual checks for entity state, we can use the `Reference` wrapper.

## `Reference` wrapper

When you define `@ManyToOne` and `@OneToOne` properties on your entity, TypeScript compiler will think that desired entities are always loaded:

```ts
@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author!: Author;

  constructor(author: Author) {
    this.author = author;
  }

}

const book = await em.findOne(Book, 1);
console.log(book.author instanceof Author); // true
console.log(wrap(book.author).isInitialized()); // false
console.log(book.author.name); // undefined as `Author` is not loaded yet
```

You can overcome this issue by using the `Reference` wrapper. It simply wraps the entity, defining `load(): Promise<T>` method that will first lazy load the association if not already available. You can also use `unwrap(): T` method to access the underlying entity without loading it.

You can also use `load<K extends keyof T>(prop: K): Promise<T[K]>`, which works like `load()` but returns the specified property.

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'EntitySchema', value: 'entity-schema'},
]}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
import { Entity, Ref, ManyToOne, PrimaryKey, ref } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  constructor(author: Author) {
    this.author = ref(author);
  }

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
import { Entity, Ref, ManyToOne, PrimaryKey, Reference } from '@mikro-orm/core';

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  author: Ref<Author>;

  constructor(author: Author) {
    this.author = ref(author);
  }

}
```

  </TabItem>
  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer({ primary: true }),
    author: p.manyToOne(() => Author, { ref: true }),
  },
});

export interface IBook extends InferEntity<typeof Book> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export interface IBook {
  id: number;
  author: Ref<Author>;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    id: { type: Number, primary: true },
    author: { entity: () => Author, ref: true },
  },
});
```

  </TabItem>
</Tabs>

```ts
const book1 = await em.findOne(Book, 1);
book.author instanceof Reference; // true
book1.author; // Ref<Author> (instance of `Reference` class)
book1.author.name; // type error, there is no `name` property
book1.author.unwrap().name; // unsafe sync access, undefined as author is not loaded
book1.author.isInitialized(); // false

const book2 = await em.findOne(Book, 1, { populate: ['author'] });
book2.author; // LoadedReference<Author> (instance of `Reference` class)
book2.author.$.name; // type-safe sync access
```

There are also `getEntity()` and `getProperty()` methods that are synchronous getters, that will first check if the wrapped entity is initialized, and if not, it will throw and error.

```ts
const book = await em.findOne(Book, 1);
console.log(book.author instanceof Reference); // true
console.log(wrap(book.author).isInitialized()); // false
console.log(book.author.getEntity()); // Error: Reference<Author> 123 not initialized
console.log(book.author.getProperty('name')); // Error: Reference<Author> 123 not initialized
console.log(await book.author.load('name')); // ok, loading the author first
console.log(book.author.getProperty('name')); // ok, author already loaded
```

If you use different metadata provider than `TsMorphMetadataProvider` (e.g. `ReflectMetadataProvider`), you will also need to explicitly set `ref` parameter:

```ts
@ManyToOne(() => Author, { ref: true })
author!: Ref<Author>;
```

### Using `Reference.load()`

After retrieving a reference, you can load the full entity by utilizing the asynchronous `Reference.load()` method.

```ts
const book1 = await em.findOne(Book, 1);
(await book1.author.load()).name; // async safe access

const book2 = await em.findOne(Book, 2);
const author = await book2.author.load();
author.name;
await book2.author.load(); // no additional query, already loaded
```

> As opposed to `wrap(e).init()` which always refreshes the entity, `Reference.load()` method will query the database only if the entity is not already loaded in Identity Map.

### `ScalarReference` wrapper

Similarly to the `Reference` wrapper, we can also wrap scalars with `Ref` into a `ScalarReference` object. This is handy for lazy scalar properties.

The `Ref` type automatically resolves to `ScalarReference` for non-object types, so the below is correct:

```ts
@Property({ lazy: true, ref: true })
passwordHash!: Ref<string>;
```

```ts
const user = await em.findOne(User, 1);
const passwordHash = await user.passwordHash.load();
```

For object-like types, if you choose to use the reference wrappers, you should use the `ScalarRef<T>` type explicitly. For example, you might want to lazily load a large JSON value:

```ts
@Property({ type: 'json', nullable: true, lazy: true, ref: true })
// ReportParameters is an object type, imagine it defined elsewhere.
reportParameters!: ScalarRef<ReportParameters | null>; 
```

Keep in mind that once a scalar value is managed through a `ScalarReference`, accessing it through MikroORM managed objects will always return the `ScalarReference` wrapper. That can be confusing in case the property is also `nullable`, since the `ScalarReference` will always be truthy. In such cases, you should inform the type system of the nullability of the property through `ScalarReference<T>`'s type parameter as demonstrated above. Below is an example of how it all works:

```ts
// Say Report of id "1" has no reportParameters in the Database.
const report = await em.findOne(Report, 1);
if (report.reportParameters) {
  // Logs Ref<?>, not the actual value. **Would always run***.
  console.log(report.reportParameters); 
  //@ts-expect-error $/.get() is not available until the reference has been loaded.
  // const mistake = report.reportParameters.$
}
const populatedReport = await em.populate(report, ['reportParameters']);
// Logs `null`
console.log(populatedReport.reportParameters.$); 
```

## `Loaded` type

If you check the return type of `em.find` and `em.findOne` methods, you might be a bit confused - instead of the entity, they return `Loaded` type:

```ts
// res1 is of type `Loaded<User, never>[]`
const res1 = await em.find(User, {});

// res2 is of type `Loaded<User, 'identity' | 'friends'>[]`
const res2 = await em.find(User, {}, { populate: ['identity', 'friends'] });
```

The `User` entity is defined as follows:

```ts
import { Entity, PrimaryKey, ManyToOne, OneToOne, Collection, Ref, ref } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Identity)
  identity: Ref<Identity>;

  @ManyToMany(() => User)
  friends = new Collection<User>(this);

  constructor(identity: Identity) {
    this.identity = ref(identity);
  }

}
```

The `Loaded` type will represent what relations of the entity are populated, and will add a special `$` symbol to them, allowing for type-safe synchronous access to the loaded properties. This works great in combination with the `Reference` wrapper:

> If you don't like symbols with magic names like `$`, you can as well use the `get()` method, which is an alias for it.

```ts
// res is of type `Loaded<User, 'identity'>`
const user = await em.findOneOrFail(User, 1, { populate: ['identity'] });

// instead of the async `await user.identity.load()` call that would ensure the relation is loaded
// you can use the dynamically added `$` symbol for synchronous and type-safe access to it:
console.log(user.identity.$.email);
```

> If you'd omit the `populate` hint, type of `user` would be `Loaded<User, never>` and the `user.identity.$` symbol wouldn't be available - such call would end up with compilation error.

```ts
// if we try without the populate hint, the type is `Loaded<User, never>`
const user2 = await em.findOneOrFail(User, 2);

// TS2339: Property '$' does not exist on type '{ id: number; } & Reference'.
console.log(user.identity.$.email);
```

Same works for the `Collection` wrapper, that offers runtime methods `isInitialized`, `loadItems` and `init`, as well as the type-safe `$` symbol.

```ts
// res is of type `Loaded<User, 'friends'>`
const user = await em.findOneOrFail(User, 1, { populate: ['friends'] });

// instead of the async `await user.friends.loadItems()` call that would ensure the collection items are loaded
// you can use the dynamically added `$` symbol for synchronous and type-safe access to it:
for (const friend of user.friends.$) {
  console.log(friend.email);
}
```

You can also use the `Loaded` type in your own methods, to require on type level that some relations will be populated:

```ts
function checkIdentity(user: Loaded<User, 'identity'>) {
  if (!user.identity.$.email.includes('@')) {
    throw new Error(`That's a weird e-mail!`);
  }
}
```

```ts
// works
const u1 = await em.findOneOrFail(User, 2, { populate: ['identity'] });
checkIdentity(u1);

// fails
const u2 = await em.findOneOrFail(User, 2);
checkIdentity(u2);
```

> Keep in mind this is all just a type-level information, you can easily trick it via type assertions.

## Assigning to `Reference` properties

When you define the property as `Reference` wrapper, you will need to assign the `Reference` instance to it instead of the entity. You can convert any entity to a `Reference` wrapper via `ref(entity)`, or use `wrapped` option of `em.getReference()`:

> `ref(e)` is a shortcut for `wrap(e).toReference()`, which is the same as `Reference.create(e)`.

```ts
import { ref } from '@mikro-orm/core';

const book = await em.findOne(Book, 1);
const repo = em.getRepository(Author);

book.author = repo.getReference(2, { wrapped: true });

// same as:
book.author = ref(repo.getReference(2));
await em.flush();
```

Since v5 we can also create entity references without access to `EntityManager`. This can be handy if you want to create a reference from inside entity constructor:

```ts
import { Entity, ManyToOne, Rel, rel } from '@mikro-orm/core';

@Entity()
export class Book {

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

  constructor(authorId: number) {
    this.author = rel(Author, authorId);
  }

}
```

Another way is to use `toReference()` method available as part of [`WrappedEntity` interface](./entity-helper.md#wrappedentity-and-wrap-helper):

```ts
const author = new Author(...)
book.author = wrap(author).toReference();
```

If the reference already exist, you need to re-assign it with a new `Reference` instance - they hold identity just like entities, so you need to replace them:

```ts
article.author = ref(new User(...));
```

## What is `Ref` (`IdentifiedReference`)?

`Ref` is an intersection type that adds primary key property to the `Reference` interface. It allows to get the primary key from `Reference` instance directly.

By default, we try to detect the PK by checking if a property with a known name exists. We check for those in order: `_id`, `uuid`, `id` - with a way to manually set the property name via `PrimaryKeyProp` symbol (`[PrimaryKeyProp]?: 'foo';`).

We can also override this via second generic type argument.

```ts
const book = await em.findOne(Book, 1);
console.log(book.author.id); // ok, returns the PK
```

You can also have non-standard primary key:

```ts
author: Ref<Author, 'myPrimaryKey'>;

const book = await em.findOne(Book, 1);
console.log(book.author.myPrimaryKey); // ok, returns the PK
```

For MongoDB, define the PK generic type argument as `'id' | '_id'` to access both `string` and `ObjectId` PK values:

<Tabs
groupId="entity-def"
defaultValue="reflect-metadata"
values={[
{label: 'reflect-metadata', value: 'reflect-metadata'},
{label: 'ts-morph', value: 'ts-morph'},
{label: 'defineEntity', value: 'define-entity'},
{label: 'EntitySchema', value: 'entity-schema'},
]}>
<TabItem value="reflect-metadata">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author, 'id' | '_id'>;

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/Book.ts"
@Entity()
export class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @ManyToOne()
  author!: Ref<Author, 'id' | '_id'>;

}
```

  </TabItem>
  <TabItem value="define-entity">

```ts title="./entities/Book.ts"
export const Book = defineEntity({
  name: 'Book',
  properties: {
    _id: p.property('ObjectId', { primary: true }),
    id: p.string({ serializedPrimaryKey: true }),
    author: p.manyToOne(() => Author, { ref: true }),
  },
});

export interface IBook extends InferEntity<typeof Book> {}
```

  </TabItem>
  <TabItem value="entity-schema">

```ts title="./entities/Book.ts"
export interface IBook {
  _id: ObjectId;
  id: string;
  author: Ref<IAuthor, 'id' | '_id'>;
}

export const Book = new EntitySchema<IBook>({
  name: 'Book',
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: String, serializedPrimaryKey: true },
    author: { entity: 'Author', ref: true },
  },
});
```

  </TabItem>
</Tabs>

```ts
const book = await em.findOne(Book, 1);
console.log(book.author.id); // ok, returns string PK
console.log(book.author._id); // ok, returns ObjectId PK
```
