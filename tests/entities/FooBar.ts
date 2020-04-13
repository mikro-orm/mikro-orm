import { ObjectId } from 'mongodb';
import { Entity, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
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

  static create(name: string) {
    const bar = new FooBar();
    bar.name = name;

    return bar;
  }

}
