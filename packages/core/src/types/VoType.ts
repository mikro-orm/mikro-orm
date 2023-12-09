import {  Type } from './Type';
import type { Platform } from '../platforms';
import type { ValueObject } from '../value-objects/value-object';

export class VoType<T extends { new(...args: any[]): ValueObject<any, T> }> extends Type<ValueObject<any, any>, any> {
  private readonly vo: T;

  constructor(vo: T) {
    super();
    this.vo = vo;
  }

  override ensureComparable(): boolean {
    return false;
  }

  override convertToJSValue(value: any, platform: Platform): ValueObject<any, any> {
    return new this.vo(value);
  }

  override convertToDatabaseValue(value: ValueObject<any, any>, platform: Platform): ValueObject<any, any> {
    return value.getValue();
  }

}
