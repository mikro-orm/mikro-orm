import type { Platform, EntityProperty } from '@mikro-orm/core';
import { Type, ValidationError } from '@mikro-orm/core';
// @ts-expect-error no types available
import SqlString from 'tsqlstring';

export class UnicodeString {

    constructor(public readonly value: string | null) {
    }

    static empty() {
        return new UnicodeString(null);
    }

    escape() {
        if (this.value == null) { return SqlString.escape(this.value); }
        return `N${SqlString.escape(this.value)}`;
    }

}

export class UnicodeStringType extends Type<string | null, UnicodeString> {

    convertToDatabaseValue(value: string | UnicodeString, platform: Platform, fromQuery?: boolean): UnicodeString {
        if (value == null) { return UnicodeString.empty(); }

        if (value instanceof UnicodeString) { return value; }

        if (typeof value === 'string') { return new UnicodeString(value); }

        throw ValidationError.invalidType(UnicodeStringType, value, 'JS');
    }

    convertToJSValue(value: string | UnicodeString, platform: Platform): string | null {
        if (value == null) { return null; }

        if (value instanceof UnicodeString) { return value.value; }

        if (typeof value === 'string') { return value; }

        throw ValidationError.invalidType(UnicodeStringType, value, 'database');
    }

    getColumnType(prop: EntityProperty, platform: Platform) {
        const length = prop.length != null ? prop.length : 256;
        return `nvarchar(${length})`;
    }

}
