import { MigrationGenerator } from './MigrationGenerator';

export class JSMigrationGenerator extends MigrationGenerator {

  /**
   * @inheritDoc
   */
  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    if (this.options.multitenancy) { return this.generateMultitenancyMigrationFile(className, diff); }
    return this.generateDefaultMigrationFile(className, diff);
  }

  generateDefaultMigrationFile(className: string, diff: { up: string[]; down: string[] }) {
    let ret = `'use strict';\n`;
    ret += `Object.defineProperty(exports, '__esModule', { value: true });\n`;
    ret += `const { Migration } = require('@mikro-orm/migrations');\n\n`;
    ret += `class ${className} extends Migration {\n\n`;
    ret += `  async up() {\n`;
    diff.up.forEach(sql => ret += this.createStatement(sql, 4));
    ret += `  }\n\n`;
    /* istanbul ignore else */
    if (diff.down.length > 0) {
        ret += `  async down() {\n`;
        diff.down.forEach(sql => ret += this.createStatement(sql, 4));
        ret += `  }\n\n`;
    }
    ret += `}\n`;
    ret += `exports.${className} = ${className};\n`;
    return ret;
  }

  generateMultitenancyMigrationFile(className: string, diff: { up: string[]; down: string[] }) {
    const regExTenantSchemaTag = new RegExp('"\\$\\{tenant\\}"');

    const tenantEntityMetadata = this.driver
      .getMetadata()
      .find(this.options.multitenancy?.tenantEntity || 'Tenant');

    if (!tenantEntityMetadata) { throw new Error(`Multitenancy - Tenant entity '${this.options.multitenancy?.tenantEntity}' not found.`); }

    let tenantUpSql = ``;
    let commonUpSql = ``;
    let includeTenantUpSql = true;
    diff.up.forEach(sql => {
      if (sql) {
        if (sql.match(regExTenantSchemaTag)) {
          tenantUpSql += this.createStatement(sql, 8);
        } else {
          if (sql.match(`create table.+${tenantEntityMetadata.tableName}`)) {
            includeTenantUpSql = false;
          }
          commonUpSql += this.createStatement(sql, 4);
        }
      }
    });
    let tenantDownSql = ``;
    let commonDownSql = ``;
    let includeTenantDownSql = true;
    if (diff.down.length > 0) {
      diff.down.forEach(sql => {
        if (sql) {
          if (sql.match(regExTenantSchemaTag)) {
            tenantDownSql += this.createStatement(sql, 8);
          } else {
            if (sql.match(`drop table.+${tenantEntityMetadata.tableName}`)) {
              includeTenantDownSql = false;
            }
            commonDownSql += this.createStatement(sql, 4);
          }
        }
      });
    }
    const hasTenantUpSql = tenantUpSql !== '' && includeTenantUpSql;
    const hasTenantDownSql = tenantDownSql !== '' && includeTenantDownSql;
    const hasTenantSql = hasTenantUpSql && hasTenantDownSql;

    let ret = `'use strict';\n`;
        ret += `Object.defineProperty(exports, '__esModule', { value: true });\n`;
        ret += `const { Migration } = require('@mikro-orm/migrations');\n`;
    if (hasTenantSql) {
      ret += `const { Configuration, MigrationsOptions } = require('@mikro-orm/core');\n`;
      ret += `const { AbstractSqlDriver } = require('@mikro-orm/knex');\n`;
    }
    ret += `\nclass ${className} extends Migration {\n`;
    if (hasTenantSql) {
      ret += `  constructor(driver, config) {\n`;
      ret += `      super(driver, config);\n`;
      ret += `      this.options = config.get("migrations");\n`;
      ret += `  }\n\n`;
    }
    ret += `  async up() {\n`;
    ret += commonUpSql;
    if (hasTenantUpSql) {
      if (commonUpSql !== '') { ret += '\n'; }
      ret += `    const tenants = await this.options.multitenancy.tenants(this.driver, this.ctx);\n`;
      ret += `    tenants.forEach((tenant) => {\n`;
      ret += tenantUpSql;
      ret += `    });\n`;
    }
    ret += `  }\n\n`;
    ret += `  async down() {\n`;
    if (hasTenantDownSql) {
      ret += `    const tenants = await this.options.multitenancy.tenants(this.driver, this.ctx);\n`;
      ret += `    tenants.forEach((tenant) => {\n`;
      ret += tenantDownSql;
      ret += `    });\n`;
      if (commonDownSql !== '') { ret += '\n'; }
    }
    ret += commonDownSql;
    ret += `  }\n`;
    ret += `}\n`;
    ret += `exports.${className} = ${className};\n`;

    return ret;
  }

}
