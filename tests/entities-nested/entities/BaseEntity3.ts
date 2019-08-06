import { ObjectID } from 'bson';
import { IEntity, PrimaryKey } from '../../../lib';

export abstract class BaseEntity3 {
  @PrimaryKey()
  _id: ObjectID;
}

export interface BaseEntity3 extends IEntity<string> {}
