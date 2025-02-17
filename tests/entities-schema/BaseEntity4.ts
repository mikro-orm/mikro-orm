import { BaseEntity, EntitySchema, Opt } from '@mikro-orm/core';

export class BaseEntity4 extends BaseEntity {

  id!: number;
  createdAt: Date & Opt = new Date();
  updatedAt: Date & Opt = new Date();
  baseVersion?: number;
  baseVersionAsString?: string;

  static beforeDestroyCalled = 0;
  static afterDestroyCalled = 0;

  async baseBeforeCreate() {
    this.baseVersion = 1;
  }

  async baseAfterCreate() {
    this.baseVersionAsString = 'v' + this.baseVersion;
  }

  baseBeforeUpdate() {
    this.baseVersion! += 1;
  }

  baseAfterUpdate() {
    this.baseVersionAsString = 'v' + this.baseVersion;
  }

  baseBeforeDelete() {
    BaseEntity4.beforeDestroyCalled += 1;
  }

  baseAfterDelete() {
    BaseEntity4.afterDestroyCalled += 1;
  }

}

async function beforeUpdate(this: BaseEntity4) {
  this.baseVersion! += 1;
}

async function afterUpdate(this: BaseEntity4) {
  this.baseVersionAsString = 'v' + this.baseVersion;
}

function beforeDelete() {
  BaseEntity4.beforeDestroyCalled += 1;
}

function afterDelete() {
  BaseEntity4.afterDestroyCalled += 1;
}

export const schema = new EntitySchema({
  class: BaseEntity4,
  abstract: true,
  hooks: {
    beforeCreate: ['baseBeforeCreate'],
    afterCreate: ['baseAfterCreate'],
    beforeUpdate: ['baseBeforeUpdate', beforeUpdate],
    afterUpdate: ['baseAfterUpdate', afterUpdate],
    beforeDelete: ['baseBeforeDelete', beforeDelete],
    afterDelete: ['baseAfterDelete', afterDelete],
  },
  properties: {
    id: { primary: true, type: 'number' },
    createdAt: { type: 'Date', onCreate: owner => new Date(), nullable: true },
    updatedAt: { type: 'Date', onCreate: owner => new Date(), onUpdate: () => new Date(), nullable: true },
    baseVersion: { persist: false, type: 'number' },
    baseVersionAsString: { persist: false, type: 'string' },
  },
  path: __filename,
});

export const entity = BaseEntity4;
