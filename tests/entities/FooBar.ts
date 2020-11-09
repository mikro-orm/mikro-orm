import { ObjectId } from 'mongodb';
import { ArrayType, Entity, JsonType, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { FooBaz } from './FooBaz';

@Entity()
export default class FooBar {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne({ entity: () => FooBaz, eager: true, orphanRemoval: true, nullable: true, serializedName: 'fooBaz', serializer: value => `FooBaz id: ${value.id}` })
  baz!: FooBaz | null;

  @OneToOne(() => FooBar, undefined, { nullable: true })
  fooBar!: FooBar;

  @Property({ nullable: true })
  blob?: Buffer;

  @Property({ type: new ArrayType(i => +i), nullable: true })
  array?: number[];

  @Property()
  num?: number;

  @Property()
  str?: string;

  @Property({ type: JsonType, nullable: true })
  object?: { foo: string; bar: number } | any;

  @Property({ onCreate: (bar: FooBar) => bar.meta.onCreateCalled = true })
  onCreateTest?: boolean;

  @Property({ onCreate: (bar: FooBar) => bar.meta.onUpdateCalled = true })
  onUpdateTest?: boolean;

  readonly meta = { onCreateCalled: false, onUpdateCalled: false };

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }

}
