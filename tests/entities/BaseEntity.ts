import { ObjectId } from 'bson';
import { BeforeCreate, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property()
  foo?: string;

  @Property({ persist: false })
  hookTest = false;

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}
