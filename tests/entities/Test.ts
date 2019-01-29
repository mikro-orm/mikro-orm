import { Entity, PrimaryKey, Property, BaseEntity } from '../../lib';

@Entity()
export class Test extends BaseEntity<string> {

  @PrimaryKey({ type: 'ObjectID' })
  _id;

  @Property({ type: 'string' })
  name;

  static create(name: string) {
    const t = new Test();
    t.name = name;

    return t;
  }

}
