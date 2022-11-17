import type { Dictionary, EntityProperty } from '@mikro-orm/core';
import { ReferenceType, Utils } from '@mikro-orm/core';
import { SourceFile } from './SourceFile';

export class EntitySchemaSourceFile extends SourceFile {
	generate(): string {
		this.coreImports.add('EntitySchema');
		let ret = `export class ${this.meta.className} {`;
		const enumDefinitions: string[] = [];

		for (const prop of Object.values(this.meta.properties)) {
			const definition = this.getPropertyDefinition(prop, 2);

			if (!ret.endsWith('\n')) {
				ret += '\n';
			}

			ret += definition;

			if (prop.enum) {
				const enumClassName = this.namingStrategy.getClassName(this.meta.collection + '_' + prop.fieldNames[0], '_');
				enumDefinitions.push(this.getEnumClassDefinition(enumClassName, prop.items as string[], 2));
			}
		}

		ret += '}\n';

		const imports = [`import { ${[...this.coreImports].sort().join(', ')} } from '@mikro-orm/core';`];
		const entityImports = [...this.entityImports].filter((e) => e !== this.meta.className);
		entityImports.sort().forEach((entity) => {
			imports.push(`import { ${entity} } from './${entity}';`);
		});

		ret = `${imports.join('\n')}\n\n${ret}`;
		if (enumDefinitions.length) {
			ret += '\n' + enumDefinitions.join('\n');
		}

		ret += `\n`;
		ret += `export const ${this.meta.className}Schema = new EntitySchema({\n`;
		ret += `  class: ${this.meta.className},\n`;

		if (this.meta.collection !== this.namingStrategy.classToTableName(this.meta.className)) {
			ret += `  tableName: ${this.quote(this.meta.className)},\n`;
		}

		/* istanbul ignore next */
		if (this.meta.schema && this.meta.schema !== this.platform.getDefaultSchemaName()) {
			ret += `  schema: ${this.quote(this.meta.schema)},\n`;
		}

		if (this.meta.indexes.length > 0) {
			ret += `  indexes: [\n`;
			this.meta.indexes.forEach((index) => {
				const properties = Utils.asArray(index.properties).map((prop) => `'${prop}'`);
				ret += `    { name: '${index.name}', properties: [${properties.join(', ')}] },\n`;
			});
			ret += `  ],\n`;
		}

		if (this.meta.indexes.length > 0) {
			ret += `  uniques: [\n`;
			this.meta.uniques.forEach((index) => {
				const properties = Utils.asArray(index.properties).map((prop) => `'${prop}'`);
				ret += `    { name: '${index.name}', properties: [${properties.join(', ')}] },\n`;
			});
			ret += `  ],\n`;
		}

		ret += `  properties: {\n`;
		Object.values(this.meta.properties).forEach((prop) => {
			const options = this.getPropertyOptions(prop);
			let def =
				'{ ' +
				Object.entries(options)
					.map(([opt, val]) => `${opt}: ${val}`)
					.join(', ') +
				' }';

			if (def.length > 80) {
				def =
					'{\n' +
					Object.entries(options)
						.map(([opt, val]) => `      ${opt}: ${val}`)
						.join(',\n') +
					',\n    }';
			}
			//
			ret += `    ${prop.name}: ${def},\n`;
		});
		ret += `  },\n`;
		ret += `});\n`;

		return ret;
	}

	getBaseName() {
		return this.meta.className + '.ts';
	}

	private getPropertyOptions(prop: EntityProperty): Dictionary {
		const options = {} as Dictionary;

		if (prop.primary) {
			options.primary = true;
		}

		if (prop.reference !== ReferenceType.SCALAR) {
			options.reference = this.quote(prop.reference);
		}

		if (prop.reference === ReferenceType.MANY_TO_MANY) {
			this.getManyToManyDecoratorOptions(options, prop);
		} else if (prop.reference === ReferenceType.ONE_TO_MANY) {
			this.getOneToManyDecoratorOptions(options, prop);
		} else if (prop.reference !== ReferenceType.SCALAR) {
			this.getForeignKeyDecoratorOptions(options, prop);
		} else {
			this.getScalarPropertyDecoratorOptions(options, prop);
		}

		if (prop.enum) {
			options.enum = true;
			options.items = `() => ${prop.type}`;
		}

		this.getCommonDecoratorOptions(options, prop);
		this.getPropertyIndexesOptions(prop, options);

		return options;
	}

	protected getPropertyIndexesOptions(prop: EntityProperty, options: Dictionary): void {
		if (prop.reference === ReferenceType.SCALAR) {
			if (prop.index) {
				options.index = this.quote(prop.index as string);
			}

			if (prop.unique) {
				options.unique = this.quote(prop.unique as string);
			}

			return;
		}

		const processIndex = (type: 'index' | 'unique') => {
			if (!prop[type]) {
				return;
			}

			const defaultName = this.platform.getIndexName(this.meta.collection, prop.fieldNames, type);
			/* istanbul ignore next */
			options[type] = defaultName === prop[type] ? 'true' : `'${prop[type]}'`;
			const expected = {
				index: this.platform.indexForeignKeys(),
				unique: prop.reference === ReferenceType.ONE_TO_ONE,
			};

			if (expected[type] && options[type] === 'true') {
				delete options[type];
			}
		};

		processIndex('index');
		processIndex('unique');
	}

	protected override getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
		if (prop.reference === ReferenceType.SCALAR && !prop.enum) {
			options.type = this.quote(prop.type);
		}

		super.getScalarPropertyDecoratorOptions(options, prop);
	}
}
