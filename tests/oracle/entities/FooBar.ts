import { ArrayType, BlobType, Entity, Formula, JsonType, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity2 } from './BaseEntity2';
import { FooBaz } from './FooBaz';

@Entity()
export class FooBar extends BaseEntity2 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({ orphanRemoval: true, nullable: true })
  baz?: FooBaz;

  @OneToOne({ nullable: true })
  fooBar?: FooBar;

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

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }

}
