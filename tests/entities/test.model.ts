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

  @Property({ hidden: true })
  hiddenField = Date.now();

  constructor(props: Partial<Test> = {}) {
    this._id = props._id;
    this.name = props.name;

    if (props.hiddenField) {
      this.hiddenField = props.hiddenField;
    }
  }

  static create(name: string) {
    const t = new Test();
    t.name = name;

    return t;
  }

}
