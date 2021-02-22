import { ensureDir, writeFile } from 'fs-extra';
import { MigrationsOptions, NamingStrategy, Utils } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

export class MigrationGenerator {

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly namingStrategy: NamingStrategy,
              protected readonly options: MigrationsOptions) { }

  async generate(diff: string[], path?: string): Promise<[string, string]> {
    path = Utils.normalizePath(path || this.options.path!);
    await ensureDir(path);
    const timestamp = new Date().toISOString().replace(/[-T:]|\.\d{3}z$/ig, '');
    const className = this.namingStrategy.classToMigrationName(timestamp);
    const fileName = `${this.options.fileName!(timestamp)}.${this.options.emit}`;
    let ret: string;

    if (this.options.emit === 'js') {
      ret = this.generateJSMigrationFile(className, diff);
    } else {
      ret = this.generateTSMigrationFile(className, diff);
    }

    await writeFile(path + '/' + fileName, ret);

    return [ret, fileName];
  }

  createStatement(sql: string, padLeft: number): string {
    if (sql) {
      const padding = ' '.repeat(padLeft);
      const schema = this.driver.getConnection().getSchema();
      if (schema) {
        const regex = new RegExp(`"${schema}"`, 'g');
        return `${padding}this.addSql(\`${sql.replace(/['\\]/g, '\\\'')
          .replace(regex, '"${schema}"')}\`);\n`;
      }
      return `${padding}this.addSql('${sql.replace(/['\\]/g, '\\\'')}');\n`;
    }

    return '\n';
  }

  generateJSMigrationFile(className: string, diff: string[]): string {
    let ret = `'use strict';\n`;
    ret += `Object.defineProperty(exports, '__esModule', { value: true });\n`;
    ret += `const Migration = require('@mikro-orm/migrations').Migration;\n\n`;
    ret += `class ${className} extends Migration {\n\n`;
    ret += `  async up() {\n`;
    const schema = this.driver.getConnection().getSchema();
    if (schema) {
      ret += `    const schema = this.config.get('schema');\n`;
    }
    diff.forEach(sql => ret += this.createStatement(sql, 4));
    ret += `  }\n\n`;
    ret += `}\n`;
    ret += `exports.${className} = ${className};\n`;

    return ret;
  }

  generateTSMigrationFile(className: string, diff: string[]): string {
    let ret = `import { Migration } from '@mikro-orm/migrations';\n\n`;
    ret += `export class ${className} extends Migration {\n\n`;
    ret += `  async up(): Promise<void> {\n`;
    const schema = this.driver.getConnection().getSchema();
    if (schema) {
      ret += `    const schema = this.config.get('schema' as any);\n`;
    }
    diff.forEach(sql => ret += this.createStatement(sql, 4));
    ret += `  }\n\n`;
    ret += `}\n`;

    return ret;
  }

}
