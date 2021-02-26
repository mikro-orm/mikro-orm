import { ObjectId } from 'mongodb';
import { PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  foo?: string;

  @Property({ persist: false })
  hookTest = false;

}
