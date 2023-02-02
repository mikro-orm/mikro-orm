import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntity, PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity3 extends BaseEntity {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

}
