import type { OptionalProps } from '@mikro-orm/core';
import { ArrayType, BlobType, EntitySchema, JsonType, Uint8ArrayType } from '@mikro-orm/core';
import type { IFooBaz4, IBaseEntity5 } from './index.js';
import { BaseEntity5 } from './index.js';

export interface IFooBar4 extends Omit<IBaseEntity5, typeof OptionalProps> {
  [OptionalProps]?: 'version' | IBaseEntity5[typeof OptionalProps];
  name: string;
  baz?: IFooBaz4;
  fooBar?: IFooBar4;
  version: number;
  blob?: Buffer;
  blob2?: Uint8Array;
  array?: number[];
  object?: { foo: string; bar: number } | any;
  virtual?: string;
}

export const FooBar4 = new EntitySchema<IFooBar4, IBaseEntity5>({
  name: 'FooBar4',
  extends: BaseEntity5,
  properties: {
    name: { type: 'string', default: 'asd' },
    baz: { kind: '1:1', entity: 'FooBaz4', orphanRemoval: true, nullable: true },
    fooBar: { kind: '1:1', entity: 'FooBar4', nullable: true },
    version: { type: 'number', version: true },
    blob: { type: BlobType, nullable: true },
    blob2: { type: Uint8ArrayType, nullable: true },
    array: { type: new ArrayType(i => +i), nullable: true },
    object: { type: JsonType, nullable: true },
    virtual: { type: String, persist: false },
  },
});
