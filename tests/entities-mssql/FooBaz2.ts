import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { FooBar2 } from './FooBar2';

@Entity()
export class FooBaz2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne(() => FooBar2, 'baz')
  bar?: FooBar2;

  @Property({ version: true })
  version!: Date;

  constructor(name: string) {
    this.name = name;
  }

}
