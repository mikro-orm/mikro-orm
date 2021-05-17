import { ManyToMany, Collection, Entity, Formula, JsonType, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntitySchema22 } from './BaseEntitySchema22';
import { FooBazSchema2 } from './FooBazSchema2';

@Entity({ schema: 'mikro_orm_test_multi_1' })
export class FooBarSchema2 extends BaseEntitySchema22 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({ orphanRemoval: true, nullable: true, onDelete: 'cascade', onUpdateIntegrity: 'cascade' })
  baz?: FooBazSchema2;

  @OneToOne({ nullable: true })
  fooBar?: FooBarSchema2;

  @Property({ version: true, length: 0 })
  version!: Date;

  @Property({ nullable: true })
  blob?: Buffer;

  @Property({ type: 'number[]', nullable: true })
  array?: number[];

  @Property({ type: JsonType, nullable: true })
  object?: { foo: string; bar: number } | any;

  @Formula(`(select 123)`)
  random?: number;

  @Formula(`(select 456)`, { lazy: true })
  lazyRandom?: number;

  static create(name: string) {
    const bar = new FooBarSchema2();
    bar.name = name;

    return bar;
  }

}
