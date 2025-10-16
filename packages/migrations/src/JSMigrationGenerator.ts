import { MigrationGenerator } from './MigrationGenerator.js';

export class JSMigrationGenerator extends MigrationGenerator {

  /**
   * @inheritDoc
   */
  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    let ret = `'use strict';\n`;
    ret += `Object.defineProperty(exports, '__esModule', { value: true });\n`;
    ret += `const { Migration } = require('@mikro-orm/migrations');\n\n`;
    ret += `class ${className} extends Migration {\n\n`;
    ret += `  async up() {\n`;
    diff.up.forEach(sql => ret += this.createStatement(sql, 4));
    ret += `  }\n\n`;

    /* v8 ignore next 5 */
    if (diff.down.length > 0) {
      ret += `  async down() {\n`;
      diff.down.forEach(sql => ret += this.createStatement(sql, 4));
      ret += `  }\n\n`;
    }

    ret += `}\n`;
    ret += `exports.${className} = ${className};\n`;

    return ret;
  }

}
