import { SCALAR_TYPES } from './EntityFactory';
import { EntityMetadata, EntityProperty, IEntity, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';

export class Validator {

  constructor(private strict: boolean) { }

  validate(entity: IEntity, payload: any, meta: EntityMetadata): void {
    Object.keys(payload).forEach(prop => {
      const property = meta.properties[prop];

      if (!property || property.reference !== ReferenceType.SCALAR || !SCALAR_TYPES.includes(property.type)) {
        return;
      }

      payload[prop] = entity[prop] = this.validateProperty(property, payload[prop], entity);
    });
  }

  validateProperty(prop: EntityProperty, givenValue: any, entity: IEntity) {
    if (givenValue === null) {
      return givenValue;
    }

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

    if (!this.strict && expectedType === 'boolean' && givenType === 'number') {
      const bool = !!givenValue;

      if (+bool === givenValue) {
        ret = bool;
        givenType = 'boolean';
      }
    }

    if (givenType !== expectedType) {
      throw new Error(`Validation error: trying to set ${entity.constructor.name}.${prop.name} of type '${expectedType}' to '${givenValue}' of type '${givenType}'`);
    }

    return ret;
  }

  validateParams(params: any, type = 'search condition', field?: string): void {
    if (Utils.isPrimaryKey(params)) {
      return;
    }

    if (Utils.isEntity(params)) {
      if (field) {
        throw new Error(`${params.constructor.name} entity provided in ${type} in field '${field}'. Please provide identifier instead.`);
      } else {
        throw new Error(`${params.constructor.name} entity provided in ${type}. Please provide identifier instead.`);
      }
    }

    if (Array.isArray(params)) {
      return params.forEach((item: any) => this.validateParams(item, type), field);
    }

    if (Utils.isObject(params)) {
      Object.keys(params).forEach(k => {
        this.validateParams(params[k], type, k);
      });
    }
  }

}
