const { Collection } = require('../../lib');
const { MetadataStorage } = require('../../lib/metadata/MetadataStorage');
const { ReferenceType } = require('../../lib/decorators/Entity');

/**
 * @property {number} id
 */
class BaseEntity4 {

  constructor() {
    const meta = MetadataStorage.getMetadata(this.constructor.name);
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
};

module.exports = { BaseEntity4, schema };
