import { PrimaryKey, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';

export abstract class BaseEntity3 {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

}
