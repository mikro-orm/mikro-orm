import { Entity, MongoEntity, PrimaryKey, Property } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Test implements MongoEntity<Test> {

  @PrimaryKey({ type: 'ObjectId' })
  _id: any;

  @SerializedPrimaryKey()
  id: string;

  @Property({ type: 'string' })
  name: any;

}
