import { ObjectId } from 'bson';
import { MongoEntity, PrimaryKey } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

export abstract class BaseEntity3 implements MongoEntity<BaseEntity3> {

  @PrimaryKey()
  _id: ObjectId;

  @SerializedPrimaryKey()
  id: string;

}
