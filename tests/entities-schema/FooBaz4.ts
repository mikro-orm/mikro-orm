import { defineEntity, InferEntity, p } from '@mikro-orm/core';
import { BaseProperties, FooBar4 } from './index';

export const FooBaz4 = defineEntity({
  name: 'FooBaz4',
  properties: {
    ...BaseProperties,
    name: p.string(),
    bar: () => p.oneToOne(FooBar4).mappedBy('baz').nullable(),
    version: p.datetime(0).version(),
  },
});

export interface IFooBaz4 extends InferEntity<typeof FooBaz4> {}
