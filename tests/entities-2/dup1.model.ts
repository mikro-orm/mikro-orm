import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';

@Entity()
export class Dup1 {

  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name2?: string;

}
