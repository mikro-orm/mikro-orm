import { Entity, ManyToOne, PrimaryKey, Property } from '../../lib';

@Entity()
export class MultiDecorator {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string' })
  @ManyToOne({ type: 'Foo' })
  name: any;

}
