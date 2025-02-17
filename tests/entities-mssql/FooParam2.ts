import { Entity, ManyToOne, PrimaryKeyProp, Property } from '@mikro-orm/core';
import { FooBar2 } from './FooBar2.js';
import { FooBaz2 } from './FooBaz2.js';

@Entity()
export class FooParam2 {

  @ManyToOne(() => FooBar2, { primary: true })
  bar!: FooBar2;

  @ManyToOne(() => FooBaz2, { primary: true, deleteRule: 'no action', updateRule: 'no action' })
  baz!: FooBaz2;

  @Property()
  value: string;

  [PrimaryKeyProp]?: ['bar', 'baz'];

  constructor(bar: FooBar2, baz: FooBaz2, value: string) {
    this.bar = bar;
    this.baz = baz;
    this.value = value;
  }

}
