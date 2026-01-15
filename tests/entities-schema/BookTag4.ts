import { p, InferEntity, defineEntity } from '@mikro-orm/core';
import { Book4 } from './Book4.js';
import { BaseEntity5 } from './BaseEntity5.js';

export const BookTag4 = defineEntity({
  name: 'BookTag4',
  extends: BaseEntity5,
  properties: {
    name: p.string(),
    books: () => p.manyToMany(Book4).mappedBy('tags'),
    version: p.datetime().version(),
  },
});

export interface IBookTag4 extends InferEntity<typeof BookTag4> {}
