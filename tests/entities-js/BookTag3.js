const { Collection, EntitySchema } = require('@mikro-orm/core');
const { BaseEntity4 } = require('./index').BaseEntity4;

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

const schema = new EntitySchema({
  class: BookTag3,
  extends: 'BaseEntity4',
  properties: {
    name: { type: 'string' },
    books: {
      kind: 'm:n',
      owner: false,
      mappedBy: 'tags',
      type: 'Book3',
    },
    version: {
      version: true,
      type: 'Date',
    },
  },
  path: __filename,
});

module.exports.BookTag3 = BookTag3;
module.exports.entity = BookTag3;
module.exports.schema = schema;
