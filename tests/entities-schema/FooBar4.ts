import { ArrayType, BlobType, EntitySchema, JsonType, Property } from '@mikro-orm/core';
import { FooBaz4, BaseEntity5 } from './index';

export interface FooBar4 extends BaseEntity5 {
  name: string;
  baz?: FooBaz4;
  fooBar?: FooBar4;
  version: number;
  blob?: Buffer;
  array?: number[];
  object?: { foo: string; bar: number } | any;
}

export const schema = new EntitySchema<FooBar4, BaseEntity5>({
  name: 'FooBar4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string', default: 'asd' },
    baz: { reference: '1:1', entity: 'FooBaz4', orphanRemoval: true, nullable: true },
    fooBar: { reference: '1:1', entity: 'FooBar4', nullable: true },
    version: { type: 'number', version: true },
    blob: { type: BlobType, nullable: true },
    array: { customType: new ArrayType(i => +i), nullable: true },
    object: { type: JsonType, nullable: true },
  },
});
