import { Entity, IEntity, PrimaryKey, Property } from '../../../lib';

@Entity()
export class Test {
  @PrimaryKey({ type: 'ObjectID' })
  _id: any;

  @Property({ type: 'string' })
  name: any;

  @Property({ hidden: true })
  hiddenField = Date.now();

  static create(name: string) {
    const t = new Test();
    t.name = name;

    return t;
  }
}

export interface Test extends IEntity<string> {}
