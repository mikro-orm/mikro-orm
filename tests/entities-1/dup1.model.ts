import { ObjectId } from 'mongodb';
import { Entity, MongoEntity, PrimaryKey, Property } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Dup1 implements MongoEntity<Dup1> {

  @PrimaryKey()
  _id: ObjectId;

  @SerializedPrimaryKey()
  id: string;

  @Property()
  name: string;

}
