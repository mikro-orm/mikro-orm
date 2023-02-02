import { Entity, ManyToOne, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { FooBar2 } from './FooBar2';
import { FooBaz2 } from './FooBaz2';

@Entity()
export class FooParam2 {

  @ManyToOne(() => FooBar2, { primary: true })
  bar!: FooBar2;

  @ManyToOne(() => FooBaz2, { primary: true })
  baz!: FooBaz2;

  @Property()
  value: string;

  @Property({ version: true })
  version!: Date;

  [PrimaryKeyProp]?: ['bar', 'baz'];

  constructor(bar: FooBar2, baz: FooBaz2, value: string) {
    this.bar = bar;
    this.baz = baz;
    this.value = value;
  }

}
