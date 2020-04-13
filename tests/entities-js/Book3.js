const { Collection } = require('@mikro-orm/core');
const { BaseEntity4 } = require('./index').BaseEntity4;

/**
 * @property {number} id
 * @property {Date} createdAt
 * @property {Date} updatedAt
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
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.title = title;
    this.author = author;
    this.tags = new Collection(this);
  }

}

const schema = {
  name: 'Book3',
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
    title: {
      type: 'string',
      default: '',
    },
    author: {
      reference: 'm:1',
      type: 'Author3',
    },
    publisher: {
      reference: 'm:1',
      type: 'Publisher3',
    },
    tags: {
      reference: 'm:n',
      owner: true,
      fixedOrder: true,
      inversedBy: 'books',
      type: 'BookTag3',
    },
  },
  path: __filename,
};

module.exports.Book3 = Book3;
module.exports.entity = Book3;
module.exports.schema = schema;
