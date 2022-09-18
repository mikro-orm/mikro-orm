import { ensureDir, writeFile } from 'fs-extra';
import type { Configuration, ITenantHelperGenerator } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';
import type { SchemaGenerator } from '@mikro-orm/knex';

export abstract class TenantHelperGenerator implements ITenantHelperGenerator {

  constructor(
    protected readonly schemaGenerator: SchemaGenerator,
    protected readonly config: Configuration,
  ) {}

  async generate(): Promise<void> {
    const tenantCreateSql = (await this.schemaGenerator.getCreateSchemaSQL({ schema: '${tenant}' }))
      .replace(/\n/g, '')
      .split(';')
      .slice(0, -1);
    const tenantDropSql = (await this.schemaGenerator.getDropSchemaSQL({ schema: '${tenant}' }))
      .replace(/\n/g, '')
      .split(';')
      .slice(0, -1);

    const options = this.config.get('migrations');
    const className = options.multitenancy!.tenantHelperClassName || 'TenantHelper';

    const ret = this.generateTenantHelperFile(
      className,
      tenantCreateSql,
      tenantDropSql);

    const defaultPath = options.emit === 'ts' && options.multitenancy!.tenantHelperPathTs ? options.multitenancy!.tenantHelperPathTs : options.multitenancy!.tenantHelperPath!;
    const path = Utils.normalizePath(this.config.get('baseDir'), defaultPath);
    const fileName = `${className}.${options.emit}`;
    await ensureDir(path);

    await writeFile(path + '/' + fileName, ret);
  }

  abstract generateTenantHelperFile(className: string, tenantCreateSql: string[], tenantDropSql: string[]): string;

}
