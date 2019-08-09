const { Collection, ReferenceType } = require('../../lib');

/**
 * @property {number} id
 */
class BaseEntity4 {

  constructor() {
    const meta = this['__em'].getMetadata().get(this.constructor.name);
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(this);
      }
    });
  }

}

const schema = {
  properties: {
    id: {
      primary: true,
      type: 'number',
    },
  },
  path: __filename,
};

module.exports.BaseEntity4 = BaseEntity4;
module.exports.entity = BaseEntity4;
module.exports.schema = schema;
