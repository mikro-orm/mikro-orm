import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class MultiDecorator {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string' })
  @ManyToOne({ type: 'Foo' })
  name: any;
}
