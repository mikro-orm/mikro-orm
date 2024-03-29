import { ObjectId } from 'bson';
import {
  BeforeCreate,
  PrimaryKey,
  Property,
  SerializedPrimaryKey,
  BaseEntity as MikroBaseEntity,
  OptionalProps,
  PrimaryKeyProp,
} from '@mikro-orm/core';

export type BaseEntityOptional = 'updatedAt' | 'hookTest';

export abstract class BaseEntity<T extends object, Optional extends keyof T = never> extends MikroBaseEntity {

  [OptionalProps]?: BaseEntityOptional | Optional;
  [PrimaryKeyProp]?: 'id' | '_id';

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  createdAt? = new Date();

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
