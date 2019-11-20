const { Collection } = require('../../lib');
const { BaseEntity4 } = require('./index').BaseEntity4;

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
      reference: '1:m',
      mappedBy: 'publisher',
      type: 'Book3',
    },
    tests: {
      reference: 'm:n',
      fixedOrder: true,
      type: 'Test3',
    },
    type: {
      type: 'PublisherType',
    },
  },
  path: __filename,
};

module.exports.Publisher3 = Publisher3;
module.exports.entity = Publisher3;
module.exports.schema = schema;
