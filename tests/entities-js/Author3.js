const { Collection, DateType, TimeType, ReferenceType, EntitySchema, t } = require('@mikro-orm/core');
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
 * @property {string} bornTime
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

  async beforeCreate(args) {
    this.version = 1;
    await args.em.findOne('Book3', { title: { $ne: null } }); // test this won't cause failures (GH #1503)
  }

  async afterCreate(args) {
    this.versionAsString = 'v' + this.version;
    await args.em.findOne('Book3', { title: { $nin: [''] } }); // test this won't cause failures (GH #1503)
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

const schema = new EntitySchema({
  class: Author3,
  properties: {
    createdAt: {
      type: 'Date',
      nullable: true,
    },
    updatedAt: {
      type: t.datetime,
      nullable: true,
      onUpdate: () => new Date(),
    },
    name: { type: 'string' },
    email: {
      type: t.string,
      unique: true,
    },
    age: {
      type: t.tinyint,
      nullable: true,
    },
    termsAccepted: {
      type: t.boolean,
      default: 0,
    },
    identities: {
      type: t.array,
      nullable: true,
    },
    born: {
      type: t.date,
      nullable: true,
      length: 3,
    },
    bornTime: {
      type: t.time,
      nullable: true,
      length: 3,
    },
    books: {
      reference: ReferenceType.ONE_TO_MANY,
      mappedBy: 'author',
      type: 'Book3',
    },
    favouriteBook: {
      reference: 'm:1',
      type: 'Book3',
      nullable: true,
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
  indexes: [{ properties: ['name', 'favouriteBook'] }],
  path: __filename,
});

module.exports.Author3 = Author3;
module.exports.entity = Author3;
module.exports.schema = schema;
