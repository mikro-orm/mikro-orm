import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { FooBar } from './FooBar';

@Entity()
export class FooBaz {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne(() => FooBar, 'baz')
  bar?: FooBar;

  @Property({ version: true })
  version!: Date;

  constructor(name: string) {
    this.name = name;
  }

}
