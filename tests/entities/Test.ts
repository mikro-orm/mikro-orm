import { BaseEntity, Entity, PrimaryKey, Property, ObjectID } from '../../lib';

@Entity()
export class Test extends BaseEntity {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  name: string;

  static create(name: string) {
    const t = new Test();
    t.name = name;

    return t;
  }

}
