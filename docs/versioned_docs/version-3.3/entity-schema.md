---
title: Defining Entities via EntitySchema
---

With `EntitySchema` helper you define the schema programmatically. 

```typescript title="./entities/Book.ts"
export interface Book extends BaseEntity {
  title: string;
  author: Author;
  publisher: Publisher;
  tags: Collection<BookTag>;
}

export const schema = new EntitySchema<Book, BaseEntity>({
  name: 'Book',
  extends: 'BaseEntity',
  properties: {
    title: { type: 'string' },
    author: { reference: 'm:1', entity: 'Author', inversedBy: 'books' },
    publisher: { reference: 'm:1', entity: 'Publisher', inversedBy: 'books' },
    tags: { reference: 'm:n', entity: 'BookTag', inversedBy: 'books', fixedOrder: true },
  },
});
```

When creating new entity instances, you will need to use `em.create()` method that will
create instance of internally created class. 

```typescript
const repo = em.getRepository<Author>('Author');
const author = repo.create('Author', { name: 'name', email: 'email' }); // instance of internal Author class
await repo.persistAndFlush(author);
```

> Using this approach, metadata caching is automatically disabled as it is not needed.

## Using custom entity classes

You can optionally use custom class for entity instances.  

```typescript title="./entities/Author.ts"
export class Author extends BaseEntity {
  name: string;
  email: string;
  age?: number;
  termsAccepted?: boolean;
  identities?: string[];
  born?: Date;
  books = new Collection<Book>(this);
  favouriteBook?: Book;
  version?: number;
  
  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

export const schema = new EntitySchema<Author, BaseEntity>({
  class: Author,
  properties: {
    name: { type: 'string' },
    email: { type: 'string', unique: true },
    age: { type: 'number', nullable: true },
    termsAccepted: { type: 'boolean', default: 0, onCreate: () => false },
    identities: { type: 'string[]', nullable: true },
    born: { type: DateType, nullable: true, length: 3 },
    books: { reference: '1:m', entity: () => 'Book', mappedBy: book => book.author },
    favouriteBook: { reference: 'm:1', type: 'Book' },
    version: { type: 'number', persist: false },
  },
});
```

Then you can use the entity class as usual:

```typescript
const repo = em.getRepository(Author);
const author = new Author('name', 'email');
await repo.persistAndFlush(author);
```

## Using BaseEntity

Do not forget that base entities needs to be discovered just like normal entities. 

```typescript title="./entities/BaseEntity.ts"
export interface BaseEntity extends IdEntity<BaseEntity> {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export const schema = new EntitySchema<BaseEntity>({
  name: 'BaseEntity',
  abstract: true,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: { type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true },
  },
});
```

## Configuration Reference

The parameter of `EntitySchema` requires to provide either `name` or `class` parameters. 
When using `class`, `extends` will be automatically inferred. You can optionally pass 
these additional parameters:

```typescript
name: string;
class: Constructor<T>;
extends: string;
tableName: string; // alias for `collection: string`
properties: { [K in keyof T & string]: EntityProperty<T[K]> };
indexes: { properties: string | string[]; name?: string; type?: string }[];
uniques: { properties: string | string[]; name?: string }[];
customRepository: () => Constructor<EntityRepository<T>>;
hooks: Partial<Record<HookType, (string & keyof T)[]>>;
abstract: boolean;
```

Every property then needs to contain a type specification - one of `type`/`customType`/`entity`.
Here are some examples of various property types:

```typescript
export enum MyEnum {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const schema = new EntitySchema<FooBar>({
  name: 'FooBar',
  tableName: 'tbl_foo_bar',
  indexes: [{ name: 'idx1', properties: 'name' }],
  uniques: [{ name: 'unq1', properties: ['name', 'email'] }],
  customRepository: () => FooBarRepository,
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
    baz: { reference: '1:1', entity: 'FooBaz', orphanRemoval: true, nullable: true },
    fooBar: { reference: '1:1', entity: 'FooBar', nullable: true },
    publisher: { reference: 'm:1', entity: 'Publisher', inversedBy: 'books' },
    books: { reference: '1:m', entity: () => 'Book', mappedBy: book => book.author },
    tags: { reference: 'm:n', entity: 'BookTag', inversedBy: 'books', fixedOrder: true },
    version: { type: 'Date', version: true, length: 0 },
    type: { enum: true, items: () => MyEnum, default: MyEnum.LOCAL },
  },
});
```

> As a value for `type` you can also use one of `String`/`Number`/`Boolean`/`Date`.

## MongoDB example

```typescript
export class BookTag implements MongoEntity<BookTag> {
  _id!: ObjectId;
  id!: string;
  name: string;
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }
}

export const schema = new EntitySchema<BookTag>({
  class: BookTag,
  properties: {
    _id: { type: 'ObjectId', primary: true },
    id: { type: 'string', serializedPrimaryKey: true },
    name: { type: 'string' },
    books: { reference: 'm:n', entity: () => Book, mappedBy: book => book.tags },
  },
});
```
