import { IEntity, PrimaryKey } from '../../lib';
import { ObjectId } from 'bson';

export abstract class BaseEntity3 {

  @PrimaryKey()
  _id: ObjectId;

}

export interface BaseEntity3 extends IEntity<string> { }
