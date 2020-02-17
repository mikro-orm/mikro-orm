import { EntitySchema } from '../../lib/schema';
import { IdEntity } from '../../lib';

export interface BaseEntity5 extends IdEntity<BaseEntity5> {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export const schema = new EntitySchema<BaseEntity5>({
  name: 'BaseEntity5',
  abstract: true,
  properties: {
    id: { type: 'number', primary: true },
    createdAt: { type: 'Date', onCreate: () => new Date(), nullable: true },
    updatedAt: { type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true },
  },
});
