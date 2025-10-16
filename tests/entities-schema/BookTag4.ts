import { p, InferEntity, defineEntity } from '@mikro-orm/core';
import { Book4 } from './Book4';
import { BaseProperties } from './BaseEntity5';

export const BookTag4 = defineEntity({
  name: 'BookTag4',
  properties: {
    ...BaseProperties,
    name: p.string(),
    books: () => p.manyToMany(Book4).mappedBy('tags'),
    version: p.datetime().version(),
  },
});

export interface IBookTag4 extends InferEntity<typeof BookTag4> {}
