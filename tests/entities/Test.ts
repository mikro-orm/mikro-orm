import { Entity, PrimaryKey, Property, IEntity } from '../../lib';

@Entity()
export class Test {

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

export interface Test extends IEntity { }
