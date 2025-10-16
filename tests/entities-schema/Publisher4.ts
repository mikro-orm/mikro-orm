import { defineEntity, InferEntity, p } from '@mikro-orm/core';
import { Book4 } from './Book4';
import { Test4 } from './Test4';
import { BaseProperties } from './BaseEntity5';

export enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

export const Publisher4 = defineEntity({
  name: 'Publisher4',
  properties: {
    ...BaseProperties,
    name: p.string().default('asd'),
    type: p.enum(() => PublisherType).default(PublisherType.LOCAL),
    enum3: p.enum([1, 2, 3]).nullable(),
    books: () => p.oneToMany(Book4).mappedBy('publisher'),
    tests: () => p.manyToMany(Test4).fixedOrder(),
  },
});

export interface IPublisher4 extends InferEntity<typeof Publisher4> {}
