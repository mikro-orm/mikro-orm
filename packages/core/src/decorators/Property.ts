import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import type { Cascade, LoadStrategy } from '../enums';
import { ReferenceType } from '../enums';
import type { EntityName, EntityProperty, Constructor, CheckCallback, Dictionary, AnyString, AnyEntity } from '../typings';
import type { Type, types } from '../types';

export function Property<T>(options: PropertyOptions<T> = {}) {
	return function (target: any, propertyName: string) {
		const meta = MetadataStorage.getMetadataFromDecorator<T>(target.constructor as T & Dictionary);
		const desc = Object.getOwnPropertyDescriptor(target, propertyName) || {};
		MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceType.SCALAR);
		const name = options.name || propertyName;

		if (propertyName !== name && !(desc.value instanceof Function)) {
			Utils.renameKey(options, 'name', 'fieldName');
		}

		options.name = propertyName;
		const { check, ...opts } = options;
		const prop = { reference: ReferenceType.SCALAR, ...opts } as EntityProperty;
		prop.getter = !!desc.get;
		prop.setter = !!desc.set;

		if (desc.value instanceof Function) {
			prop.getter = true;
			prop.persist = false;
			prop.type = 'method';
			prop.getterName = propertyName;
			prop.name = name;
		}

		if (check) {
			meta.checks.push({ property: prop.name, expression: check });
		}

		meta.properties[prop.name] = prop;

		return Utils.propertyDecoratorReturnValue();
	};
}

export type PropertyOptions<T> = {
	name?: string;
	fieldName?: string;
	fieldNames?: string[];
	customType?: Type<any>;
	columnType?: ColumnType | AnyString;
	type?: keyof typeof types | 'ObjectId' | Date | Constructor<AnyEntity> | Constructor<Type<any>> | Type<any> | (() => unknown) | ColumnType | AnyString;
	length?: number;
	precision?: number;
	scale?: number;
	autoincrement?: boolean;
	onCreate?: (entity: T) => any;
	onUpdate?: (entity: T) => any;
	default?: string | string[] | number | number[] | boolean | null;
	defaultRaw?: string;
	formula?: string | ((alias: string) => string);
	nullable?: boolean;
	unsigned?: boolean;
	persist?: boolean;
	trackChanges?: boolean;
	hidden?: boolean;
	version?: boolean;
	concurrencyCheck?: boolean;
	index?: boolean | string;
	unique?: boolean | string;
	check?: string | CheckCallback<T>;
	lazy?: boolean;
	primary?: boolean;
	setter?: boolean;
	getter?: boolean;
	serializedPrimaryKey?: boolean;
	serializer?: (value: any) => any;
	serializedName?: string;
	customOrder?: string[] | number[] | boolean[];
	comment?: string;
	/** mysql only */
	extra?: string;
	ignoreSchemaChanges?: ('type' | 'extra')[];
};

export interface ReferenceOptions<T, O> extends PropertyOptions<O> {
	entity?: string | (() => EntityName<T>);
	cascade?: Cascade[];
	eager?: boolean;
	strategy?: LoadStrategy;
}

/**
 * Inspired by https://github.com/typeorm/typeorm/blob/941b584ba135617e55d6685caef671172ec1dc03/src/driver/types/ColumnTypes.ts
 * @ignore
 */
export type ColumnType =
	| 'int'
	| 'int4'
	| 'integer'
	| 'bigint'
	| 'int8'
	| 'int2'
	| 'tinyint'
	| 'smallint'
	| 'mediumint'
	| 'double'
	| 'double precision'
	| 'real'
	| 'float8'
	| 'decimal'
	| 'numeric'
	| 'float'
	| 'float4'
	| 'datetime'
	| 'time'
	| 'time with time zone'
	| 'timestamp'
	| 'timestamp with time zone'
	| 'timetz'
	| 'timestamptz'
	| 'date'
	| 'interval'
	| 'character varying'
	| 'varchar'
	| 'char'
	| 'character'
	| 'uuid'
	| 'text'
	| 'tinytext'
	| 'mediumtext'
	| 'longtext'
	| 'boolean'
	| 'bool'
	| 'bit'
	| 'enum'
	| 'blob'
	| 'tinyblob'
	| 'mediumblob'
	| 'longblob'
	| 'bytea'
	| 'point'
	| 'line'
	| 'lseg'
	| 'box'
	| 'circle'
	| 'path'
	| 'polygon'
	| 'geometry'
	| 'tsvector'
	| 'tsquery'
	| 'json'
	| 'jsonb';
