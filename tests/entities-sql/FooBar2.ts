import { Entity, PrimaryKey, Property } from '../../lib';
import { BaseEntity22 } from './BaseEntity22';

@Entity()
export class FooBar2 extends BaseEntity22 {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

}
