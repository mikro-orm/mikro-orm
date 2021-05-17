import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { FooBarSchema2 } from './FooBarSchema2';

@Entity({ schema: 'mikro_orm_test_multi_2' })
export class FooBazSchema2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne(() => FooBarSchema2, 'baz')
  bar?: FooBarSchema2;

  @Property({ version: true })
  version!: Date;

  constructor(name: string) {
    this.name = name;
  }

}
