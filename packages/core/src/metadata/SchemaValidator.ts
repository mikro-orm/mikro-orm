import { ReferenceKind } from '../enums';
import { EnumType, Type, TypeMapper } from '../types';
import type { Dictionary, EntityProperty, StandardInput, StandardIssue, StandardOutput } from '../typings';
import type { EntitySchema } from './EntitySchema';


export class SchemaValidator<Entity> extends TypeMapper {

  constructor(protected schema: EntitySchema<Entity, any>) {
    super();
  }

  validate(input: StandardInput, options?: SchemaValidateOptions): StandardOutput<Entity> {
    if (!input.value) {
      return { issues: [{ message: 'input value is empty' }] };
    }
    if (typeof input.value !== 'object') {
      return { issues: [{ message: 'input value is not an object' }] };
    }

    const unknownProperties = new Set(Object.keys(input.value));
    const issues: StandardIssue[] = [];
    const output = {} as Dictionary;
    for (const property of this.schema.meta.props) {
      unknownProperties.delete(property.name);
      const result = this.validateProperty(property, (input.value as Dictionary)[property.name], options);
      if ('value' in result) {
        if (result.value !== undefined) {
          output[property.name] = result.value;
        }
      } else {
        issues.push(...result.issues);
      }
    }

    if (!options?.allowUnknownProperties && unknownProperties.size > 0) {
      for (const key of unknownProperties) {
        issues.push({ message: `unknown property ${key}`, path:[key] });
      }
    }

    if (issues.length > 0) {
      return { issues };
    }

    return { value: output as Entity };
  }

  validateProperty(property: EntityProperty<Entity, any>, value: unknown, options?: SchemaValidateOptions): StandardOutput<unknown> {
    const { mappedType, coercer, isArray, validate } = this.getPropertyType(property);

    const isNullable = property.nullable || property.primary || !(property.persist ?? true);
    const issues: StandardIssue[] = [];

    if (property.kind !== ReferenceKind.SCALAR) {
      // TODO: validate ref
      return { issues };
    }

    const executeValidation = (v: unknown, message: string, path?: StandardIssue['path']): unknown => {
      if (v == null) {
        if (options?.fillWithDefault && property.default !== undefined) {
          v = property.default;
        } else if (!isNullable) {
          issues.push({ message: `${path} is required`, path });
        }
      } else if (options?.coerce && coercer) {
        v = coercer(v);
        isNaN(v as number) && issues.push({ message, path });
      } else if (validate) {
        if (!validate(v)) {
           issues.push({ message, path });
        }
      }
      return v;
    };

    if (isArray) {
      if (!Array.isArray(value)) {
        if (value != null || !isNullable) {
           issues.push({ message: `invalid ${mappedType}[] value`, path: [property.name] });
        }
      } else if (validate) {
        for (let i = 0; i < value.length; i++) {
          value[i] = executeValidation(value[i], `invalid ${mappedType}[] value`, [property.name, i]);
        }
      }
    } else if (validate) {
      executeValidation(value, `invalid ${mappedType} value`, [property.name]);
    }

    if (issues.length > 0) {
      return { issues };
    }
    return { value };
  }

  getPropertyType(property: EntityProperty<Entity, any>): {
    mappedType: string;
    type: Type<unknown, unknown>;
    isArray: boolean;
    validate?: (value: unknown) => boolean;
    coercer?: (value: unknown) => unknown;
  } {
    let isArray = property.array ?? false;

    if (property.enum) {
      return {
        mappedType: 'enum',
        type: Type.getType(EnumType),
        isArray,
        validate: (value: unknown) => property.items ? property.items.includes(value as string) : false,
      };
    }
    let simpleType = property.type;
    while (typeof simpleType === 'string' && simpleType.endsWith('[]')) {
      isArray = true;
      simpleType = simpleType.slice(0, -2);
    }
    const type = typeof simpleType === 'string'
      ? this.getDefaultMappedType(this.extractSimpleType(simpleType))
      : Type.getType(simpleType);

    const mappedType = type.compareAsType();

    const coercer = SchemaValidator.getCoercer(mappedType);

    const validate = SchemaValidator.getValidate(mappedType);

    return { mappedType, type, isArray, coercer, validate };
  }

  static getCoercer(mappedType: string): ((value: unknown) => unknown) | undefined {
    switch (mappedType) {
      case 'string':
        return String;
      case 'number':
        return Number;
      case 'boolean':
        return Boolean;
      case 'date':
        return (value: unknown) => new Date(value as string | number);
      default:
        return undefined;
    }
  }

  static getValidate(mappedType: string): ((value: unknown) => boolean) | undefined {
    switch (mappedType) {
      case 'string':
        return (value: unknown) => typeof value === 'string';
      case 'number':
        return (value: unknown) => typeof value === 'number';
      case 'boolean':
        return (value: unknown) => typeof value === 'boolean';
      case 'date':
        return (value: unknown) => typeof value === 'object' && value instanceof Date;
      default:
        return undefined;
    }
  }

}

export type TSBasicType = typeof String | typeof Number | typeof Boolean | typeof Date;

export interface SchemaValidateOptions {
  /**
   * Should force conversion of properties values
   * @default false
   */
  coerce?: boolean;

  /**
   * Should allow unknown properties
   * @default false
   */
  allowUnknownProperties?: boolean;

  /**
   * Should fill missing properties with default
   * @default false
   */
  fillWithDefault?: boolean;
}
