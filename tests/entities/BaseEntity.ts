import { BeforeCreate, IEntity, PrimaryKey, Property } from '../../lib';
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

  @Property({ persist: false })
  hookTest = false;

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}

export interface BaseEntity extends IEntity<string> { }
