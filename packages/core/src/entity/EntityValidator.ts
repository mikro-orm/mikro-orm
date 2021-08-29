import type { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, FilterQuery } from '../typings';
import { ReferenceType } from '../enums';
import { Utils } from '../utils/Utils';
import { ValidationError } from '../errors';

export class EntityValidator {

  constructor(private strict: boolean) { }

  validate<T extends AnyEntity<T>>(entity: T, payload: any, meta: EntityMetadata): void {
    meta.props.forEach(prop => {
      if (prop.inherited) {
        return;
      }

      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
        this.validateCollection(entity, prop);
      }

      const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];

      if (prop.reference !== ReferenceType.SCALAR || !SCALAR_TYPES.includes(prop.type)) {
        return;
      }

      const newValue = this.validateProperty(prop, this.getValue(payload, prop), entity);

      if (this.getValue(payload, prop) === newValue) {
        return;
      }

      this.setValue(payload, prop, newValue);

      /* istanbul ignore else */
      if (entity[prop.name]) {
        entity[prop.name] = payload[prop.name];
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

    if (Utils.isPlainObject(params)) {
      Object.keys(params).forEach(k => {
        this.validateParams(params[k], type, k);
      });
    }
  }

  validatePrimaryKey<T extends AnyEntity<T>>(entity: EntityData<T>, meta: EntityMetadata): void {
    const pkExists = meta.primaryKeys.every(pk => Utils.isDefined(entity[pk], true)) || Utils.isDefined(entity[meta.serializedPrimaryKey], true);

    if (!entity || !pkExists) {
      throw ValidationError.fromMergeWithoutPK(meta);
    }
  }

  validateEmptyWhere<T extends AnyEntity<T>>(where: FilterQuery<T>): void {
    if (Utils.isEmpty(where)) {
      throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
    }
  }

  private getValue(o: Dictionary, prop: EntityProperty) {
    if (prop.embedded && prop.embedded[0] in o) {
      return o[prop.embedded[0]][prop.embedded[1]];
    }

    return o[prop.name];
  }

  private setValue(o: Dictionary, prop: EntityProperty, v: any) {
    /* istanbul ignore next */
    if (prop.embedded && prop.embedded[0] in o) {
      return o[prop.embedded[0]][prop.embedded[1]] = v;
    }

    o[prop.name] = v;
  }

  private validateCollection<T extends AnyEntity<T>>(entity: T, prop: EntityProperty): void {
    if (entity.__helper!.__initialized && !entity[prop.name as keyof T]) {
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
