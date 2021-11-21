import { ObjectId } from 'bson';
import { Entity, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';
import type { FooBaz } from './FooBaz';

@Entity()
export default class FooBar {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @OneToOne({ eager: true, orphanRemoval: true })
  baz!: FooBaz | null;

  @OneToOne()
  fooBar!: FooBar;

}
