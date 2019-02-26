const { Collection } = require('../../lib');
const { Book3 } = require('./Book3');
const { BaseEntity4 } = require('./BaseEntity4');

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
    },
    updatedAt: {
      type: 'Date',
      onUpdate: () => new Date(),
    },
    name: {
      type: 'string',
    },
    email: {
      type: 'string',
    },
    age: {
      type: 'number',
    },
    termsAccepted: {
      type: 'boolean',
    },
    identities: {
      type: 'string[]',
    },
    born: {
      type: 'Date',
    },
    books: {
      reference: '1:m',
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
};

module.exports = { Author3, schema };
