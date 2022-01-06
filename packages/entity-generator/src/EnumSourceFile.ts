import type { IFile } from './typings';

export class EnumSourceFile implements IFile {

  constructor(private readonly enumClassName: string, private readonly enumValues: string[]) {}

  getBaseName(): string {
    return this.enumClassName + '.ts';
  }

  generate(): string {
    const padding = ' '.repeat(2);
    let ret = `export enum ${this.enumClassName} {\n`;
    this.enumValues.forEach(enumValue => {
      ret += `${padding}${enumValue.toUpperCase()} = '${enumValue}',\n`;
    });
    ret += '}\n';
    return ret;
  }

}
