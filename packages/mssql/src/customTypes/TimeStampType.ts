import type { EntityProperty, Platform } from '@mikro-orm/core';
import { Type, ValidationError } from '@mikro-orm/core';
// @ts-expect-error no types available
import SqlString from 'tsqlstring';

export class MssqlTimeStamp {

    constructor(private readonly value: Date) {
    }

    escape() {
        return MssqlTimeStamp.format(this.value);
    }

    static format(value: Date) {
        return SqlString.dateToString(value.toISOString(), 'Z');
    }

}

export class TimeStampType extends Type<Date, MssqlTimeStamp | string> {

    convertToDatabaseValue(value: MssqlTimeStamp | Date | string | undefined | null, platform: Platform): MssqlTimeStamp {
        if (value == null) { return SqlString.escape(null); }

        if (typeof value === 'string') { value = new Date(value); }

        if (value instanceof Date) {
            value = new MssqlTimeStamp(value);
        }

        if (value instanceof MssqlTimeStamp) {
            return value;
        }

        throw ValidationError.invalidType(Date, value, 'JS');
    }

    convertToJSValue(value: MssqlTimeStamp | Date | string | undefined | null, platform: Platform): Date {
        if (value == null) { return null as any as Date; }

        if (value instanceof Date) {
            // understand that `current_timestamp` saves as UTC
            // this value here will appear as the local tz (ex. EST)
            // we need to strip the local zone off it to fix it.
            // const offset = value.getTimezoneOffset();
            // if (offset !== 0) {
            //     const utc = Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
            //     value = new Date(utc);
            // }

            return value;
        }

        if (typeof value === 'string') { return new Date(value); }

        throw ValidationError.invalidType(Date, value, 'database');
    }

    getColumnType(prop: EntityProperty, platform: Platform) {
        return `string`;
    }

    toJSON(value: Date, platform: Platform): string {
        return this.convertToDatabaseValue(value, platform).escape();
    }

}
