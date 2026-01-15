import { p, defineEntity, InferEntity } from '@mikro-orm/core';
import { BaseEntity5 } from './BaseEntity5.js';
import { Author4 } from './Author4.js';
import { Publisher4 } from './Publisher4.js';
import { BookTag4 } from './BookTag4.js';

export interface Book4Meta {
  category: string;
  items: number;
  valid?: boolean;
  nested?: { foo: string; bar?: number; deep?: { baz: number; qux: boolean } };
}

export const Book4 = defineEntity({
  name: 'Book4',
  extends: BaseEntity5,
  properties: {
    title: p.string(),
    price: p.float().nullable(),
    priceTaxed: p.float().formula(a => `${a}.price * 1.19`).persist(false),
    author: () => p.manyToOne(Author4).nullable(),
    publisher: () => p.manyToOne(Publisher4).ref().nullable(),
    tags: () => p.manyToMany(BookTag4).pivotTable('tags_ordered').fixedOrder(true),
    tagsUnordered: () => p.manyToMany(BookTag4).pivotTable('tags_unordered'),
    meta: p.json<Book4Meta>().nullable(),
  },
});

export interface IBook4 extends InferEntity<typeof Book4> {}
