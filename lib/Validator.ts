import { BaseEntity, EntityMetadata, EntityProperty, ReferenceType } from './BaseEntity';

export class Validator {

  constructor(private strict: boolean) { }

  validate(entity: BaseEntity, payload: any, meta: EntityMetadata): void {
    Object.keys(payload).forEach(prop => {
      if (!meta.properties[prop] || meta.properties[prop].reference !== ReferenceType.SCALAR) {
        return;
      }

      payload[prop] = entity[prop] = this.validateProperty(meta.properties[prop], payload[prop], entity);
    });
  }

  validateProperty(prop: EntityProperty, givenValue: any, entity: BaseEntity) {
    const expectedType = prop.type.toLowerCase();
    const objectType = Object.prototype.toString.call(givenValue);
    let givenType = objectType.match(/\[object (\w+)]/)[1].toLowerCase();
    let ret = givenValue;

    if (!this.strict && expectedType === 'date' && givenType === 'string') {
      const date = new Date(givenValue);

      if (date.toString() !== 'Invalid Date') {
        ret = date;
        givenType = 'date';
      }
    }

    if (!this.strict && expectedType === 'number' && givenType === 'string') {
      const num = +givenValue;

      if ('' + num === givenValue) {
        ret = num;
        givenType = 'number';
      }
    }

    if (givenType !== expectedType) {
      throw new Error(`Validation error: trying to set ${entity.constructor.name}.${prop.name} of type '${expectedType}' to '${givenValue}' of type '${givenType}'`);
    }

    return ret;
  }
}
