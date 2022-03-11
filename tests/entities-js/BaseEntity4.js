const { Collection, BaseEntity, EntitySchema, ReferenceType, wrap } = require('@mikro-orm/core');

/**
 * @property {number} id
 */
class BaseEntity4 extends BaseEntity {

  constructor() {
    super();
    const props = wrap(this, true).__meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(this);
      }
    });
  }

  async baseBeforeCreate() {
    this.baseVersion = 1;
  }

  async baseAfterCreate() {
    this.baseVersionAsString = 'v' + this.baseVersion;
  }

  baseBeforeUpdate() {
    this.baseVersion += 1;
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

BaseEntity4.beforeDestroyCalled = 0;
BaseEntity4.afterDestroyCalled = 0;

async function beforeUpdate() {
  this.baseVersion += 1;
}

async function afterUpdate() {
  this.baseVersionAsString = 'v' + this.baseVersion;
}

function beforeDelete() {
  BaseEntity4.beforeDestroyCalled += 1;
}

function afterDelete() {
  BaseEntity4.afterDestroyCalled += 1;
}

const schema = new EntitySchema({
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
    id: {
      primary: true,
      type: 'number',
    },
  },
  path: __filename,
});

module.exports.BaseEntity4 = BaseEntity4;
module.exports.entity = BaseEntity4;
module.exports.schema = schema;
