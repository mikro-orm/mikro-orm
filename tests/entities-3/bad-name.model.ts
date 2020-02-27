import { Entity, PrimaryKey, Property } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

@Entity()
export class Test {

  @PrimaryKey({ type: 'ObjectId' })
  _id: any;

  @SerializedPrimaryKey()
  id!: string;

  @Property({ type: 'string' })
  name: any;

}
