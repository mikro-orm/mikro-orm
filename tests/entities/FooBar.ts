import { ObjectId } from 'mongodb';
import { ArrayType, BlobType, Entity, JsonType, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import { FooBaz } from './FooBaz';

@Entity()
export default class FooBar {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne({ entity: () => FooBaz, eager: true, orphanRemoval: true })
  baz!: FooBaz | null;

  @OneToOne(() => FooBar)
  fooBar!: FooBar;

  @Property({ nullable: true })
  blob?: Buffer;

  @Property({ type: new ArrayType(i => +i), nullable: true })
  array?: number[];

  @Property({ type: JsonType, nullable: true })
  object?: { foo: string; bar: number } | any;

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }

}
