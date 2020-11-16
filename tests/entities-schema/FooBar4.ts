import { ArrayType, BlobType, EntitySchema, JsonType } from '@mikro-orm/core';
import { IFooBaz4, IBaseEntity5 } from './index';

export interface IFooBar4 extends IBaseEntity5 {
  name: string;
  baz?: IFooBaz4;
  fooBar?: IFooBar4;
  version: number;
  blob?: Buffer;
  array?: number[];
  object?: { foo: string; bar: number } | any;
  virtual?: string;
}

export const FooBar4 = new EntitySchema<IFooBar4, IBaseEntity5>({
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
    virtual: { type: String, persist: false },
  },
});
