import { ObjectId } from 'mongodb';
import { Entity, MongoEntity, PrimaryKey, Property } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Dup1 implements MongoEntity<Dup1> {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name?: string;

}
