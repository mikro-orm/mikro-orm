import { Entity, OneToOne, PrimaryKey, Property } from '../../lib';
import { BaseEntity22 } from './BaseEntity22';
import { FooBaz2 } from './FooBaz2';

@Entity()
export class FooBar2 extends BaseEntity22 {

  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @OneToOne({ inversedBy: 'bar', orphanRemoval: true })
  baz: FooBaz2;

  @OneToOne({ owner: true })
  fooBar: FooBar2;

  static create(name: string) {
    const bar = new FooBar2();
    bar.name = name;

    return bar;
  }

}
