const { Publisher3 } = require('./Publisher3');
const { Author3 } = require('./Author3');
const { BookTag3 } = require('./BookTag3');
const { BaseEntity4 } = require('./BaseEntity4');
const { Collection } = require('../../lib');

/**
 * @property {number} id
 * @property {string} title
 * @property {Author3} author
 * @property {Publisher3} publisher
 * @property {Collection<BookTag3>} tags
 */
class Book3 extends BaseEntity4 {

  /**
   * @param {string} title
   * @param {Author3} author
   */
  constructor(title, author) {
    super();
    this.title = title;
    this.author = author;
    this.tags = new Collection(this);
  }

}

const schema = {
  name: 'Book3',
  extends: 'BaseEntity4',
  properties: {
    title: {
      type: 'string',
    },
    author: {
      reference: 1,
      type: 'Author3',
      fk: 'id',
    },
    publisher: {
      reference: 1,
      type: 'Publisher3',
      fk: 'id',
    },
    tags: {
      reference: 3,
      owner: true,
      inversedBy: 'books',
      type: 'BookTag3',
    },
  },
};

module.exports = { Book3, schema };
