import { Entity, ManyToOne, PrimaryKeyType, Property } from '../../lib';
import { FooBar2 } from './FooBar2';
import { FooBaz2 } from './FooBaz2';

@Entity()
export class FooParam2 {

  @ManyToOne(() => FooBar2, { primary: true })
  bar!: FooBar2;

  @ManyToOne(() => FooBaz2, { primary: true })
  baz!: FooBar2;

  @Property()
  value: string;

  [PrimaryKeyType]: [number, number];

  constructor(bar: FooBar2, baz: FooBaz2, value: string) {
    this.bar = bar;
    this.baz = baz;
    this.value = value;
  }

}
