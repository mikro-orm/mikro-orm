import { ObjectId } from 'bson';
import { BeforeCreate, PrimaryKey, Property, SerializedPrimaryKey, BaseEntity as MikroBaseEntity, OptionalProps } from '@mikro-orm/core';

export type BaseEntityOptional = 'updatedAt' | 'hookTest';

export abstract class BaseEntity<T extends { id: unknown; _id: unknown }, Optional extends keyof T = never> extends MikroBaseEntity<T, 'id' | '_id'> {

  [OptionalProps]?: BaseEntityOptional | Optional;

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt?: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property()
  foo?: string;

  @Property({ persist: false })
  hookTest = false;

  @BeforeCreate()
  baseBeforeCreate() {
    this.hookTest = true;
  }

}
