import { ObjectId } from 'bson';
import { BeforeCreate, PrimaryKey, Property } from '../../lib';
import { SerializedPrimaryKey } from '../../lib/decorators';

export abstract class BaseEntity {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property()
  foo?: string;

  @Property({ persist: false })
  hookTest = false;

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}
