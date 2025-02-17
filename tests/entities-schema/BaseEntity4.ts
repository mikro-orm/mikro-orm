import { BaseEntity, defineEntity, Opt, p } from '@mikro-orm/core';

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

export const BaseEntity4Schema = defineEntity({
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
    id: p.integer().primary(),
    createdAt: p.datetime().onCreate(() => new Date()).nullable(),
    updatedAt: p.datetime().onCreate(() => new Date()).nullable().onUpdate(() => new Date()),
    baseVersion: p.integer().persist(false),
    baseVersionAsString: p.string().persist(false),
  },
  path: import.meta.filename,
});
