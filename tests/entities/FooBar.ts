import { ObjectId } from 'bson';
import {
  ArrayType,
  Entity,
  Index,
  EagerProps,
  JsonType,
  OneToOne,
  PrimaryKey,
  Property,
  SerializedPrimaryKey, OptionalProps,
} from '@mikro-orm/core';
import { FooBaz } from './FooBaz.js';

@Entity()
@Index({ options: [
  { name: 'text', str: 'text', baz: 1 },
  { weights: { name: 10, str: 5 } },
] })
export default class FooBar {

  [EagerProps]?: 'baz';
  [OptionalProps]?: 'meta';

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne({ entity: () => FooBaz, eager: true, orphanRemoval: true, nullable: true, serializedName: 'fooBaz', serializer: value => `FooBaz id: ${value.id}` })
  baz!: FooBaz | null;

  @OneToOne(() => FooBar, undefined, { nullable: true })
  fooBar?: FooBar;

  @Property({ nullable: true })
  blob?: Buffer;

  @Property({ nullable: true })
  blob2?: Uint8Array;

  @Property({ type: new ArrayType(i => +i), nullable: true })
  array?: number[];

  @Property({ nullable: true })
  num?: number;

  @Property({ nullable: true })
  str?: string;

  @Property({ type: JsonType, nullable: true })
  object?: { foo: string; bar: number } | any;

  @Property({ onCreate: bar => bar.meta.onCreateCalled = true })
  onCreateTest?: boolean;

  @Property({ onCreate: bar => bar.meta.onUpdateCalled = true })
  onUpdateTest?: boolean;

  @Property({ nullable: true })
  tenant?: number;

  readonly meta = { onCreateCalled: false, onUpdateCalled: false };

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }

}
