import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntity } from '@mikro-orm/core';
import { PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';

export abstract class BaseEntity3 extends BaseEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;
}
