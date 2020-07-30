import { EntitySchema } from '@mikro-orm/core';
import { IBaseEntity5 } from './BaseEntity5';

export interface ITest4 extends IBaseEntity5 {
  name?: string;
  version: number;
}

export const Test4 = new EntitySchema<ITest4, IBaseEntity5>({
  name: 'Test4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string', nullable: true },
    version: { type: 'number', version: true },
  },
});
