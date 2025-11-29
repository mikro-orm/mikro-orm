import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';

@Entity()
export class Test {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ hidden: true })
  hiddenField? = Date.now();

}
