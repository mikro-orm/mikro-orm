import { defineEntity, InferEntity, p } from '@mikro-orm/core';
import { BaseProperties } from './BaseEntity5';

export const Test4 = defineEntity({
  name: 'Test4',
  properties: {
    ...BaseProperties,
    name: p.string().nullable(),
    version: p.integer().version(),
  },
});

export interface ITest4 extends InferEntity<typeof Test4> {}
