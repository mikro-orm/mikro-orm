const { Collection, ReferenceType } = require('../../lib');
const { BaseEntity4 } = require('./index').BaseEntity4;

/**
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} name
 * @property {string} email
 * @property {number} age
 * @property {boolean} termsAccepted
 * @property {string[]} identities
 * @property {Date} born
 * @property {Collection<Book3>} books
 * @property {Book3} favouriteBook
 * @property {number} version
 * @property {string} versionAsString
 */
class Author3 extends BaseEntity4 {

  /**
   * @param {string} name
   * @param {string} email
   */
  constructor(name, email) {
    super();
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.termsAccepted = false;
  }

  beforeCreate() {
    this.version = 1;
  }

  afterCreate() {
    this.versionAsString = 'v' + this.version;
  }

  beforeUpdate() {
    this.version += 1;
  }

  afterUpdate() {
    this.versionAsString = 'v' + this.version;
  }

  beforeDelete() {
    Author3.beforeDestroyCalled += 1;
  }

  afterDelete() {
    Author3.afterDestroyCalled += 1;
  }

}

Author3.beforeDestroyCalled = 0;
Author3.afterDestroyCalled = 0;

const schema = {
  name: 'Author3',
  extends: 'BaseEntity4',
  properties: {
    createdAt: {
      type: 'Date',
      nullable: true,
    },
    updatedAt: {
      type: 'Date',
      nullable: true,
      onUpdate: () => new Date(),
    },
    name: 'string',
    email: {
      type: 'string',
      unique: true,
    },
    age: {
      type: 'number',
      nullable: true,
    },
    termsAccepted: {
      type: 'boolean',
      default: 0,
    },
    identities: {
      type: 'string[]',
      nullable: true,
    },
    born: {
      type: 'Date',
      nullable: true,
    },
    books: {
      reference: ReferenceType.ONE_TO_MANY,
      fk: 'author',
      type: 'Book3',
    },
    favouriteBook: {
      reference: 'm:1',
      type: 'Book3',
      fk: 'id',
    },
  },
  hooks: {
    beforeCreate: ['beforeCreate'],
    afterCreate: ['afterCreate'],
    beforeUpdate: ['beforeUpdate'],
    afterUpdate: ['afterUpdate'],
    beforeDelete: ['beforeDelete'],
    afterDelete: ['afterDelete'],
  },
  path: __filename,
};

module.exports.Author3 = Author3;
module.exports.entity = Author3;
module.exports.schema = schema;
