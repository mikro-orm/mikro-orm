import { IEntity, PrimaryKey } from '../../lib';
import { ObjectID } from 'bson';

export abstract class BaseEntity3 {

  @PrimaryKey()
  _id: ObjectID;

}

export interface BaseEntity3 extends IEntity<string> { }
