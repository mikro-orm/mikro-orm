import { SCALAR_TYPES } from './EntityFactory';
import { EntityData, EntityMetadata, EntityProperty, FilterQuery, AnyEntity } from '../typings';
import { Utils, ValidationError } from '../utils';
import { ReferenceType } from './enums';
import { wrap } from './EntityHelper';

export class EntityValidator {

  constructor(private strict: boolean) { }

  static validateSingleDecorator(meta: EntityMetadata, propertyName: string): void {
    if (meta.properties[propertyName] && meta.properties[propertyName].reference) {
      throw ValidationError.multipleDecorators(meta.className, propertyName);
    }
  }

  validate<T extends AnyEntity<T>>(entity: T, payload: any, meta: EntityMetadata): void {
    Object.values(meta.properties).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
        this.validateCollection(entity, prop);
      }
    });

    Object.keys(payload).forEach(prop => {
      const property = meta.properties[prop];

      if (!property || property.reference !== ReferenceType.SCALAR || !SCALAR_TYPES.includes(property.type)) {
        return;
      }

      payload[prop] = this.validateProperty(property, payload[prop], entity);

      if (entity[prop]) {
        entity[prop] = payload[prop];
      }
    });
  }

  validateProperty<T extends AnyEntity<T>>(prop: EntityProperty, givenValue: any, entity: T) {
    if (givenValue === null || givenValue === undefined) {
      return givenValue;
    }

    const expectedType = prop.type.toLowerCase();
    let givenType = Utils.getObjectType(givenValue);
    let ret = givenValue;

    if (!this.strict) {
      ret = this.fixTypes(expectedType, givenType, givenValue);
      givenType = Utils.getObjectType(ret);
    }

    if (givenType !== expectedType) {
      throw ValidationError.fromWrongPropertyType(entity, prop.name, expectedType, givenType, givenValue);
    }

    return ret;
  }

  validateParams(params: any, type = 'search condition', field?: string): void {
    if (Utils.isPrimaryKey(params) || Utils.isEntity(params)) {
      return;
    }

    if (Array.isArray(params)) {
      return params.forEach((item: any) => this.validateParams(item, type, field));
    }

    if (Utils.isObject(params)) {
      Object.keys(params).forEach(k => {
        this.validateParams(params[k], type, k);
      });
    }
  }

  validatePrimaryKey<T extends AnyEntity<T>>(entity: EntityData<T>, meta: EntityMetadata): void {
    const pkExists = meta.primaryKeys.every(pk => Utils.isDefined(entity[pk as keyof T], true)) || Utils.isDefined(entity[meta.serializedPrimaryKey], true);

    if (!entity || !pkExists) {
      throw ValidationError.fromMergeWithoutPK(meta);
    }
  }

  validateEmptyWhere<T extends AnyEntity<T>>(where: FilterQuery<T>): void {
    if (Utils.isEmpty(where)) {
      throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    }
  }

  private validateCollection<T extends AnyEntity<T>>(entity: T, prop: EntityProperty): void {
    if (wrap(entity).isInitialized() && !entity[prop.name as keyof T]) {
      throw ValidationError.fromCollectionNotInitialized(entity, prop);
    }
  }

  private fixTypes(expectedType: string, givenType: string, givenValue: any): any {
    if (expectedType === 'date' && ['string', 'number'].includes(givenType)) {
      givenValue = this.fixDateType(givenValue);
    }

    if (expectedType === 'number' && givenType === 'string') {
      givenValue = this.fixNumberType(givenValue);
    }

    if (expectedType === 'boolean' && givenType === 'number') {
      givenValue = this.fixBooleanType(givenValue);
    }

    return givenValue;
  }

  private fixDateType(givenValue: string): Date | string {
    let date: Date;

    if (Utils.isString(givenValue) && givenValue.match(/^-?\d+(\.\d+)?$/)) {
      date = new Date(+givenValue);
    } else {
      date = new Date(givenValue);
    }

    return date.toString() !== 'Invalid Date' ? date : givenValue;
  }

  private fixNumberType(givenValue: string): number | string {
    const num = +givenValue;
    return '' + num === givenValue ? num : givenValue;
  }

  private fixBooleanType(givenValue: number): boolean | number {
    const bool = !!givenValue;
    return +bool === givenValue ? bool : givenValue;
  }

}
