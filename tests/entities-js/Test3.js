const { BaseEntity4 } = require('./BaseEntity4');

/**
 * @property {number} id
 * @property {string} name
 */
class Test3 extends BaseEntity4 {

  /**
   * @param {string} name
   * @return {Test3}
   */
  static create(name) {
    const t = new Test3();
    t.name = name;

    return t;
  }

}

const schema = {
  name: 'Test3',
  extends: 'BaseEntity4',
  properties: {
    name: {
      type: 'string',
    },
  },
};

module.exports = { Test3, schema };
