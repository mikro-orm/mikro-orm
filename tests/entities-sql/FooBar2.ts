import { ManyToMany, Collection, Entity, Formula, JsonType, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity22 } from './BaseEntity22';
import { FooBaz2 } from './FooBaz2';
import { Test2 } from './Test2';

@Entity()
export class FooBar2 extends BaseEntity22 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({ orphanRemoval: true, nullable: true })
  baz?: FooBaz2;

  @OneToOne({ nullable: true })
  fooBar?: FooBar2;

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

  @ManyToMany(() => Test2, t => t.bars)
  tests = new Collection<Test2>(this);

  static create(name: string) {
    const bar = new FooBar2();
    bar.name = name;

    return bar;
  }

}
