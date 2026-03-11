---
title: Virtual Entities
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Virtual entities don't represent any database table. Instead, they dynamically resolve to an SQL query (or an aggregation in MongoDB), allowing to map any kind of results onto an entity. Such entities are meant for read purposes, they don't have a primary key and therefore cannot be tracked for changes.

> If you need actual database views that are created and managed by the schema generator, see [View Entities](./view-entities.md) instead. View entities create `CREATE VIEW` statements and are tracked in migrations, while virtual entities evaluate their expression at query time.

> Virtual entities can contain scalar properties as well as to-one relations (M:1 and 1:1 owners). Such relations are always populated via `select-in` strategy.

To define a virtual entity, provide an `expression`, either as a string (SQL query):

> You need to use the virtual column names based on current naming strategy. Note the `authorName` property being represented as `author_name` column.

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

```ts title="./entities/BookWithAuthor.ts"
import { defineEntity, p } from '@mikro-orm/core';

const BookWithAuthorSchema = defineEntity({
  name: 'BookWithAuthor',
  expression: `
    select b.title, a.name as author_name,
    (
      select group_concat(distinct t.name)
      from book b 
      join tags_ordered bt on bt.book_id = b.id
      join book_tag t on t.id = bt.book_tag_id
      where b.author_id = a.id
      group by b.author_id
    ) as tags
    from author a
    group by a.id
  `,
  properties: {
    title: p.string(),
    authorName: p.string(),
    tags: p.type('string[]').$type<string[]>(),
  },
});

export class BookWithAuthor extends BookWithAuthorSchema.class {}
BookWithAuthorSchema.setClass(BookWithAuthor);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/BookWithAuthor.ts"
import { type InferEntity, defineEntity, p } from '@mikro-orm/core';

export const BookWithAuthor = defineEntity({
  name: 'BookWithAuthor',
  expression: `
    select b.title, a.name as author_name,
    (
      select group_concat(distinct t.name)
      from book b 
      join tags_ordered bt on bt.book_id = b.id
      join book_tag t on t.id = bt.book_tag_id
      where b.author_id = a.id
      group by b.author_id
    ) as tags
    from author a
    group by a.id
  `,
  properties: {
    title: p.string(),
    authorName: p.string(),
    tags: p.type('string[]').$type<string[]>(),
  },
});

export type IBookWithAuthor = InferEntity<typeof BookWithAuthor>;
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/BookWithAuthor.ts"
@Entity({
  expression: `
    select b.title, a.name as author_name,
    (
      select group_concat(distinct t.name)
      from book b 
      join tags_ordered bt on bt.book_id = b.id
      join book_tag t on t.id = bt.book_tag_id
      where b.author_id = a.id
      group by b.author_id
    ) as tags
    from author a
    group by a.id
  `
})
export class BookWithAuthor {

  @Property()
  title!: string;

  @Property()
  authorName!: string;

  @Property()
  tags!: string[];

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/BookWithAuthor.ts"
@Entity({
  expression: `
    select b.title, a.name as author_name,
    (
      select group_concat(distinct t.name)
      from book b 
      join tags_ordered bt on bt.book_id = b.id
      join book_tag t on t.id = bt.book_tag_id
      where b.author_id = a.id
      group by b.author_id
    ) as tags
    from author a
    group by a.id
  `
})
export class BookWithAuthor {

  @Property()
  title!: string;

  @Property()
  authorName!: string;

  @Property()
  tags!: string[];

}
```

  </TabItem>
</Tabs>

Or as a callback:

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

```ts title="./entities/BookWithAuthor.ts"
const BookWithAuthorSchema = defineEntity({
  name: 'BookWithAuthor',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name', 'group_concat(t.name) as tags'])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.id');
  },
  properties: {
    title: p.string(),
    authorName: p.string(),
    tags: p.type('string[]').$type<string[]>(),
  },
});

export class BookWithAuthor extends BookWithAuthorSchema.class {}
BookWithAuthorSchema.setClass(BookWithAuthor);
```

  </TabItem>

  <TabItem value="define-entity">

```ts title="./entities/BookWithAuthor.ts"
export const BookWithAuthor = defineEntity({
  name: 'BookWithAuthor',
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name', 'group_concat(t.name) as tags'])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.id');
  },
  properties: {
    title: p.string(),
    authorName: p.string(),
    tags: p.type('string[]').$type<string[]>(),
  },
});
```

  </TabItem>
  <TabItem value="reflect-metadata">

```ts title="./entities/BookWithAuthor.ts"
@Entity({
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name', 'group_concat(t.name) as tags'])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.id');
  },
})
export class BookWithAuthor {

  @Property()
  title!: string;

  @Property()
  authorName!: string;

  @Property()
  tags!: string[];

}
```

  </TabItem>
  <TabItem value="ts-morph">

```ts title="./entities/BookWithAuthor.ts"
@Entity({
  expression: (em: EntityManager) => {
    return em.createQueryBuilder(Book, 'b')
      .select(['b.title', 'a.name as author_name', 'group_concat(t.name) as tags'])
      .join('b.author', 'a')
      .join('b.tags', 't')
      .groupBy('b.id');
  },
})
export class BookWithAuthor {

  @Property()
  title!: string;

  @Property()
  authorName!: string;

  @Property()
  tags!: string[];

}
```

  </TabItem>
</Tabs>

In MongoDB, you can use aggregations, although it is not very ergonomic due to their nature. Following example is a rough equivalent of the previous SQL ones.

> The `where` query as well as the options like `orderBy`, `limit` and `offset` needs to be explicitly handled in your pipeline.

```ts
@Entity({
  expression: (em: EntityManager, where, options) => {
    const $sort = { ...options.orderBy } as Dictionary;
    $sort._id = 1;
    const pipeline: Dictionary[] = [
      { $project: { _id: 0, title: 1, author: 1 } },
      { $sort },
      { $match: where ?? {} },
      { $lookup: { from: 'author', localField: 'author', foreignField: '_id', as: 'author', pipeline: [{ $project: { name: 1 } }] } },
      { $unwind: '$author' },
      { $set: { authorName: '$author.name' } },
      { $unset: ['author'] },
    ];

    if (options.offset != null) {
      pipeline.push({ $skip: options.offset });
    }

    if (options.limit != null) {
      pipeline.push({ $limit: options.limit });
    }

    return em.aggregate(Book, pipeline);
  },
})
export class BookWithAuthor {

  @Property()
  title!: string;

  @Property()
  authorName!: string;

}
```
