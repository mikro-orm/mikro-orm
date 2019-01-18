import { Entity, PrimaryKey, Property, ObjectID, IEntity } from '../../lib';

@Entity()
export class Test {

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

export interface Test extends IEntity { }
