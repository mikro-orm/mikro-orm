import { EntitySchema } from '@mikro-orm/core';

export interface IBaseEntity5 {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export const BaseEntity5 = new EntitySchema<IBaseEntity5>({
  name: 'BaseEntity5',
  abstract: true,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: { type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true },
  },
});
