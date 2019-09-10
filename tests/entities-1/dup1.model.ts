import { ObjectId } from 'mongodb';
import { Entity, IEntity, PrimaryKey, Property } from '../../lib';

@Entity()
export class Dup1 {

  @PrimaryKey()
  _id: ObjectId;

  @Property()
  name: string;

}

export interface Dup1 extends IEntity<string> { }
