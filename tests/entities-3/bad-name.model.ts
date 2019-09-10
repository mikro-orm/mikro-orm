import { Entity, IEntity, PrimaryKey, Property } from '../../lib';

@Entity()
export class Test {

  @PrimaryKey({ type: 'ObjectId' })
  _id: any;

  @Property({ type: 'string' })
  name: any;

}

export interface Test extends IEntity<string> { }
