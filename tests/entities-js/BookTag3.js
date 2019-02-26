const { Collection } = require('../../lib');
const { Book3 } = require('./Book3');
const { BaseEntity4 } = require('./BaseEntity4');

/**
 * @property {number} id
 * @property {string} name
 * @property {Collection<Book3>} books
 */
class BookTag3 extends BaseEntity4 {

  /**
   * @param {string} name
   */
  constructor(name) {
    super();
    this.name = name;
  }

}

const schema = {
  name: 'BookTag3',
  extends: 'BaseEntity4',
  properties: {
    name: {
      type: 'string',
    },
    books: {
      reference: 'm:n',
      owner: false,
      mappedBy: 'tags',
      type: 'Book3',
    },
  },
};

module.exports = { BookTag3, schema };
