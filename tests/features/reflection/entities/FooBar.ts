import { Entity, OneToOne, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';
import type { FooBaz } from './FooBaz.js';

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
