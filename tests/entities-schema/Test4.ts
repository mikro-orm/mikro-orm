import { EntitySchema } from '@mikro-orm/core';
import { BaseEntity5 } from './BaseEntity5';

export interface Test4 extends BaseEntity5 {
  name?: string;
  version: number;
}

export const schema = new EntitySchema<Test4, BaseEntity5>({
  name: 'Test4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string', nullable: true },
    version: { type: 'number', version: true },
  },
});
