import type { EntityMetadata, GenerateOptions, NamingStrategy, Platform } from '@mikro-orm/core';
import { identifierRegex, SourceFile } from './SourceFile.js';

export class NativeEnumSourceFile extends SourceFile {

  constructor(
    meta: EntityMetadata,
    namingStrategy: NamingStrategy,
    platform: Platform,
    options: GenerateOptions,
    protected readonly nativeEnum: { name: string; schema?: string; items: string[] },
  ) {
    super(meta, namingStrategy, platform, options);
  }

  override generate(): string {
    const enumClassName = this.namingStrategy.getEnumClassName(this.nativeEnum.name, undefined, this.nativeEnum.schema);
    const enumTypeName = this.namingStrategy.getEnumTypeName(this.nativeEnum.name, undefined, this.nativeEnum.schema);
    const padding = '  ';
    const enumMode = this.options.enumMode;
    const enumValues = this.nativeEnum.items as string[];

    if (enumMode === 'union-type') {
      return `export type ${enumTypeName} = ${enumValues.map(item => this.quote(item)).join(' | ')};\n`;
    }

    let ret = '';

    if (enumMode === 'dictionary') {
      ret += `export const ${enumClassName} = {\n`;
    } else {
      ret += `export enum ${enumClassName} {\n`;
    }

    for (const enumValue of enumValues) {
      const enumName = this.namingStrategy.enumValueToEnumProperty(enumValue, this.nativeEnum.name, '', this.nativeEnum.schema);

      if (enumMode === 'dictionary') {
        ret += `${padding}${identifierRegex.test(enumName) ? enumName : this.quote(enumName)}: ${this.quote(enumValue)},\n`;
      } else {
        ret += `${padding}${identifierRegex.test(enumName) ? enumName : this.quote(enumName)} = ${this.quote(enumValue)},\n`;
      }
    }

    if (enumMode === 'dictionary') {
      ret += '} as const;\n';
    } else {
      ret += '}\n';
    }

    if (enumMode === 'dictionary') {
      ret += `\nexport type ${enumTypeName} = (typeof ${enumClassName})[keyof typeof ${enumClassName}];\n`;
    }

    return ret;
  }

  override getBaseName(extension = '.ts') {
    return `${this.options.fileName!(this.nativeEnum.name)}${extension}`;
  }

}
