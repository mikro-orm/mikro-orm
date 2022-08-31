import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntity, PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity3<T extends object> extends BaseEntity<T, keyof T> {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

}
