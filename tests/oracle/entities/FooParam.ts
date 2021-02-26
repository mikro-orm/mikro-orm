import { Entity, ManyToOne, PrimaryKeyType, Property } from '@mikro-orm/core';
import { FooBar } from './FooBar';
import { FooBaz } from './FooBaz';

@Entity()
export class FooParam {

  @ManyToOne(() => FooBar, { primary: true })
  bar!: FooBar;

  @ManyToOne(() => FooBaz, { primary: true })
  baz!: FooBaz;

  @Property()
  value: string;

  [PrimaryKeyType]: [number, number];

  constructor(bar: FooBar, baz: FooBaz, value: string) {
    this.bar = bar;
    this.baz = baz;
    this.value = value;
  }

}
