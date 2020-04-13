import { Entity, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/core';

@Entity()
export class Test {

  @PrimaryKey({ type: 'ObjectId' })
  _id: any;

  @SerializedPrimaryKey()
  id!: string;

  @Property({ type: 'string' })
  name: any;

  @Property({ hidden: true })
  hiddenField?: number = Date.now();

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
