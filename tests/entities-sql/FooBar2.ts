import {
  BaseEntity,
  ManyToMany,
  Collection,
  Entity,
  Formula,
  JsonType,
  OneToOne,
  PrimaryKey,
  Property,
  OptionalProps,
} from '@mikro-orm/core';
import { FooBaz2 } from './FooBaz2.js';
import { Test2 } from './Test2.js';

@Entity()
export class FooBar2 extends BaseEntity {

  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ name: 'name with space', nullable: true })
  nameWithSpace?: string;

  @OneToOne({ orphanRemoval: true, nullable: true })
  baz?: FooBaz2;

  @OneToOne({ entity: () => FooBar2, nullable: true })
  fooBar?: FooBar2;

  @Property({ version: true, length: 0 })
  version!: Date;

  @Property({ nullable: true })
  blob?: Buffer;

  @Property({ nullable: true })
  blob2?: Uint8Array;

  @Property({ type: 'number[]', nullable: true })
  array?: number[];

  @Property({ type: JsonType, nullable: true })
  objectProperty?: { foo: string; bar: number } | any;

  @Formula(`(select 123)`)
  random?: number;

  @Formula(`(select 456)`, { lazy: true })
  lazyRandom?: number;

  @ManyToMany(() => Test2, t => t.bars)
  tests = new Collection<Test2>(this);

  static create(name: string) {
    const bar = new FooBar2();
    bar.name = name;

    return bar;
  }

}
