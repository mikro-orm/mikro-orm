import { Collection, Reference, OptionalProps, raw } from '@mikro-orm/core';
import { EntitySchema, t } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5.js';
import type { Author4 } from './Author4.js';
import type { IPublisher4 } from './Publisher4.js';
import type { IBookTag4 } from './BookTag4.js';
import { BaseEntity5 } from './BaseEntity5.js';

export interface Book4Meta {
  category: string;
  items: number;
  valid?: boolean;
  nested?: { foo: string; bar?: number; deep?: { baz: number; qux: boolean } };
}

export interface IBook4 extends Omit<IBaseEntity5, typeof OptionalProps> {
  [OptionalProps]?: 'meta' | IBaseEntity5[typeof OptionalProps];
  title: string;
  price?: number;
  priceTaxed?: string;
  author?: Author4;
  publisher?: Reference<IPublisher4>;
  tags: Collection<IBookTag4>;
  tagsUnordered: Collection<IBookTag4>;
  meta: Book4Meta;
}

export const Book4 = new EntitySchema<IBook4, IBaseEntity5>({
  name: 'Book4',
  extends: BaseEntity5,
  properties: {
    title: { type: t.string },
    price: { type: t.float, nullable: true },
    priceTaxed: { type: t.float, formula: alias => raw(`${alias}.?? * 1.19`, ['price']), persist: false },
    author: { kind: 'm:1', entity: 'Author4', inversedBy: 'books', nullable: true },
    publisher: { kind: 'm:1', entity: 'Publisher4', inversedBy: 'books', ref: true, nullable: true },
    tags: { kind: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_ordered', fixedOrder: true },
    tagsUnordered: { kind: 'm:n', entity: 'BookTag4', inversedBy: 'books', pivotTable: 'tags_unordered' },
    meta: { type: 'json', nullable: true },
  },
});
