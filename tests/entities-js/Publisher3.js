const { Collection } = require('../../lib');
const { Book3 } = require('./Book3');
const { Test3 } = require('./Test3');
const { BaseEntity4 } = require('./BaseEntity4');

/**
 * @property {number} id
 * @property {string} name
 * @property {string} type
 * @property {Collection<Book3>} books
 * @property {Collection<Test3>} tests
 */
class Publisher3 extends BaseEntity4 {

  constructor(name = 'asd', type = 'local') {
    super();
    this.name = name;
    this.type = type;
  }

}

const schema = {
  name: 'Publisher3',
  extends: 'BaseEntity4',
  properties: {
    name: {
      type: 'string',
    },
    books: {
      reference: 2,
      fk: 'publisher',
      type: 'Book3',
    },
    tests: {
      reference: 3,
      owner: true,
      type: 'Test3',
    },
    type: {
      type: 'PublisherType',
    },
  },
};

module.exports = { Publisher3, schema };
