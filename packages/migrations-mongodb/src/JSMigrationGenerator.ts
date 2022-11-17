import { MigrationGenerator } from './MigrationGenerator';

export class JSMigrationGenerator extends MigrationGenerator {

  /**
   * @inheritDoc
   */
  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    let ret = `'use strict';\n`;
    ret += `Object.defineProperty(exports, '__esModule', { value: true });\n`;
    ret += `const { Migration } = require('@mikro-orm/migrations-mongodb');\n\n`;
    ret += `class ${className} extends Migration {\n\n`;
    ret += `  async up() {\n`;
    /* istanbul ignore next */
    diff.up.forEach(sql => (ret += this.createStatement(sql, 4)));
    ret += `  }\n\n`;

    /* istanbul ignore next */
    if (diff.down.length > 0) {
      ret += `  async down() {\n`;
      diff.down.forEach(sql => (ret += this.createStatement(sql, 4)));
      ret += `  }\n\n`;
    }

    ret += `}\n`;
    ret += `exports.${className} = ${className};\n`;

    return ret;
  }

}
