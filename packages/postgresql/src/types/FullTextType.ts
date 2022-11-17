import { Type } from '@mikro-orm/core';

export class FullTextType extends Type<string, string> {
	compareAsType(): string {
		return 'string';
	}

	getColumnType(): string {
		return 'tsvector';
	}

	convertToDatabaseValueSQL(key: string) {
		return `to_tsvector('simple', ${key})`;
	}
}
