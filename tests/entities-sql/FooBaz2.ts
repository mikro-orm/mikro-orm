import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { FooBar2 } from './FooBar2.js';

@Entity()
export class FooBaz2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ type: 'varchar' })
  code: string;

  @OneToOne(() => FooBar2, 'baz', { nullable: true })
  bar?: FooBar2;

  @Property({ version: true })
  version!: Date;

  constructor(name: string) {
    this.name = name;
    this.code = name;
  }

}
