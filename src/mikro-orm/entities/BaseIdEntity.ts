import {PrimaryKey, Property} from '@mikro-orm/core';

export interface BaseIdEntityConstructor {
  id?: number;
  createdAt?: Date;
}

export abstract class BaseIdEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  constructor({id, createdAt}: BaseIdEntityConstructor = {}) {
    if (id) {
      this.id = id;
    }
    if (createdAt) {
      this.createdAt = createdAt;
    }
  }
}
