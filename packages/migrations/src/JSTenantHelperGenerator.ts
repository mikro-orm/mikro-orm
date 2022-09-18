import { TenantHelperGenerator } from './TenantHelperGenerator';

export class JSTenantHelperGenerator extends TenantHelperGenerator {

  generateTenantHelperFile(className: string, tenantCreateSql: string[], tenantDropSql: string[]): string {
    let ret = ``;
    ret += `export class ${className} {\n`;
    ret += `  public static GetCreateSql(tenant) {\n`;
    ret += `    return [\n`;
    tenantCreateSql.forEach(sql => ret += `      \`${sql};\`,\n`);
    ret += `    ];\n`;
    ret += `  }\n\n`;
    ret += `  public static GetDropSql(tenant) {\n`;
    ret += `    return [\n`;
    tenantDropSql.forEach(sql => ret += `      \`${sql};\`,\n`);
    ret += `    ];\n`;
    ret += `  }\n`;
    ret += `}`;

    return ret;
  }

}
