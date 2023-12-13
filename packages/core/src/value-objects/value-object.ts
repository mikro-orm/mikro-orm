import { type  ColumnType, ValidationError } from '@mikro-orm/core';

type VoExtended<T, Vo> = Vo extends ValueObject<T, Vo> ? Vo : ValueObject<T, Vo>;
type DatabaseValues = {
  max?: number;
  min?: number;
  precision?: number;
  scale?: number;
  type?: ColumnType;
};


export abstract class ValueObject<T, Vo> {

  /**
   * Validates the value of the Value Object.
   * It is abstract so that each Value Object can implement its own validation.
   * It is protected from being called directly.
   *
   * @param value
   * @protected
   */
  protected abstract validate(value: T): boolean;

  /**
   * The maximum length of the Value Object.
   * Its value is optional and will be used in database if this Value Object is used as a column.
   * If the value is string, it will be the maximum number of characters.
   * If the value is number, it will be the maximum number.
   */
  protected max?: number;

  /**
   * The minimum length of the Value Object.
   * Its value is optional.
   * If the value is string, it will be the minimum number of characters.
   * If the value is number, it will be the minimum number.
   */
  protected min?: number;

  /**
   * The precision of the Value Object.
   * Its value is optional and will be used in database if this Value Object is used as a column.
   * It is the number of digits in a number.
   */
  protected precision?: number;

  /**
   * The scale of the Value Object.
   * Its value is optional and will be used in database if this Value Object is used as a column.
   * It is the number of digits to the right of the decimal point in a number.
   */
  protected scale?: number;

  /**
   * The type of database column.
   *
   */
  protected columnType?: ColumnType = 'varchar';

  /**
   * Value of the Value Object.
   *
   * It is private so that it cannot be changed directly.
   * @private
   */
  private value: T | undefined;

  constructor(value: T, skipValidation = false) {
    if (!skipValidation && (!this.validate(value) || !this.validateDatabase(value))) {
      throw new ValidationError(`Invalid value for ${this.constructor.name}`);
    }

    this.setValue(value);
  }

  /**
   * Creates a Value Object instance from a value.
   *
   * @example
   * Email.from('test@test.com');
   *
   * @param value
   */
  static from<T, Vo>(this: new (value: T) => VoExtended<T, Vo>, value: T): VoExtended<T, Vo> {
    return new this(value);
  }

  /**
   * Returns the scalar value of the Value Object.
   *
   */
  public getValue(): T {
    return this.value!;
  }

  /**
   * Compares the value of the Value Object with another Value Object.
   *
   * @param vo
   */
  public equals(vo: ValueObject<T, Vo>): boolean {
    return this.getValue() === vo.getValue();
  }

  /**
   * Returns the database settings of the Value Object.
   *
   * @returns
   */
  public getDatabaseValues(): DatabaseValues {
    return {
      max: this.max,
      min: this.min,
      type: this.columnType,
      scale: this.scale,
      precision: this.precision,
    };
  }

  /**
   * Sets the value of the Value Object.
   *
   * @param value
   * @private
   */
  private setValue(value: T) {
    this.value = value;
  }

  /**
   * Validates the value of the Value Object.
   * It is private so that it can only be called by the constructor.
   *
   * @param value
   * @returns
   */
  private validateDatabase<T>(value: T): boolean {
    if (typeof value === 'string') {
      if (this.max !== undefined && value.length > this.max) {
        throw new ValidationError(`Value exceeds maximum length of ${this.max}`);
      }

      if (this.min !== undefined && value.length < this.min) {
        throw new ValidationError(`Value is less than minimum length of ${this.min}`);
      }
    } else if (typeof value === 'number') {
      if (this.max !== undefined && value > this.max) {
        throw new ValidationError(`Value exceeds maximum value of ${this.max}`);
      }

      if (this.min !== undefined && value < this.min) {
        throw new ValidationError(`Value is less than minimum value of ${this.min}`);
      }

      if (this.precision !== undefined) {
        const totalDigits = value.toString().replace('.', '').length;
        if (totalDigits > this.precision) {
          throw new ValidationError(`Value exceeds precision of ${this.precision}`);
        }
      }

      if (this.scale !== undefined) {
        const decimalDigits = (value.toString().split('.')[1] || '').length;
        if (decimalDigits > this.scale) {
          throw new ValidationError(`Value exceeds scale of ${this.scale}`);
        }
      }
    }

    return true;
  }

}
