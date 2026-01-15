import { defineEntity, InferEntity, BaseEntity, p } from '@mikro-orm/core';
import { FooBaz4, BaseProperties } from './index.js';

export const FooBar4 = defineEntity({
  name: 'FooBar4',
  extends: BaseEntity,
  properties: {
    ...BaseProperties,
    name: p.string().default('asd'),
    baz: () => p.oneToOne(FooBaz4).orphanRemoval().nullable(),
    fooBar: () => p.oneToOne(FooBar4).nullable(),
    version: p.integer().version(),
    blob: p.blob().nullable(),
    blob2: p.uint8array().nullable(),
    array: p.array(i => +i).nullable(),
    object: p.json<any>().nullable(),
    virtual: p.string().persist(false),
  },
});

export interface IFooBar4 extends InferEntity<typeof FooBaz4> {}
