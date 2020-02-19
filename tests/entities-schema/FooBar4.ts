import { EntitySchema } from '../../lib/schema';
import { FooBaz4, BaseEntity5 } from '.';

export interface FooBar4 extends BaseEntity5 {
  name: string;
  baz?: FooBaz4;
  fooBar?: FooBar4;
  version: Date;
}

export const schema = new EntitySchema<FooBar4, BaseEntity5>({
  name: 'FooBar4',
  extends: 'BaseEntity5',
  properties: {
    name: { type: 'string', default: 'asd' },
    baz: { reference: '1:1', entity: 'FooBaz4', orphanRemoval: true, nullable: true },
    fooBar: { reference: '1:1', entity: 'FooBar4', nullable: true },
    version: { type: 'Date', version: true, length: 0 },
  },
});
