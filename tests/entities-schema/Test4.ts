import type { OptionalProps } from '@mikro-orm/core';
import { EntitySchema } from '@mikro-orm/core';
import type { IBaseEntity5 } from './BaseEntity5';
import { BaseEntity5 } from './BaseEntity5';

export interface ITest4 extends Omit<IBaseEntity5, typeof OptionalProps> {
  [OptionalProps]?: 'version' | IBaseEntity5[typeof OptionalProps];
  name?: string;
  version: number;
}

export const Test4 = new EntitySchema<ITest4, IBaseEntity5>({
  name: 'Test4',
  extends: BaseEntity5,
  properties: {
    name: { type: 'string', nullable: true },
    version: { type: 'number', version: true },
  },
});
