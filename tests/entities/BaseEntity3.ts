import { ObjectId } from 'bson';
import { PrimaryKey } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

export abstract class BaseEntity3 {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

}
