import { IEntity, PrimaryKey, Property } from '../../lib';
import { ObjectID } from 'bson';

export abstract class BaseEntity {

  @PrimaryKey()
  _id: ObjectID;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  foo: string;

}

export interface BaseEntity extends IEntity<string> { }
