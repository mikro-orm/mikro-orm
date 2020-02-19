import { EntitySchema } from '../../lib/schema';
import { FooBar4, BaseEntity5 } from '.';

export interface FooBaz4 extends BaseEntity5 {
  name: string;
  bar?: FooBar4;
  version: Date;
}

export const schema = new EntitySchema<FooBaz4, BaseEntity5>({
  name: 'FooBaz4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string' },
    bar: { reference: '1:1', entity: 'FooBar4', mappedBy: 'baz', nullable: true },
    version: { type: 'Date', version: true, length: 0 },
  },
});
