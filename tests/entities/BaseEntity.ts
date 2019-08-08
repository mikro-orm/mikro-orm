import { BeforeCreate, IEntity, PrimaryKey, Property } from '../../lib';
import { ObjectId } from 'bson';

export abstract class BaseEntity {

  @PrimaryKey()
  _id: ObjectId;

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
