import { DateTimeType, EntitySchema } from '@mikro-orm/core';
import type { IFooBar4, IBaseEntity5 } from './index';
import { BaseEntity5 } from './index';

export interface IFooBaz4 extends IBaseEntity5 {
  name: string;
  bar?: IFooBar4;
  version: Date;
}

export const FooBaz4 = new EntitySchema<IFooBaz4, IBaseEntity5>({
  name: 'FooBaz4',
  extends: BaseEntity5,
  properties: {
    name: { type: 'string' },
    bar: { kind: '1:1', entity: 'FooBar4', mappedBy: 'baz', nullable: true },
    version: { type: DateTimeType, version: true, length: 0 },
  },
});
