import { ObjectId } from 'bson';
import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';

@Entity()
export class Test {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ hidden: true })
  hiddenField? = Date.now();

}
