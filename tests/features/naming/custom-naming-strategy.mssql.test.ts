import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { initORMMsSql } from '../../bootstrap.js';

class KeyNamingStrategy extends EntityCaseNamingStrategy {
  override indexName(
    tableName: string,
    columns: string[],
    type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check' | 'default' | 'trigger',
  ): string {
    const prefix = { primary: 'PK', foreign: 'FK', unique: 'UK', index: 'IX', sequence: 'SQ', check: 'CK' }[
      type as string
    ];

    if (!prefix) {
      return super.indexName(tableName, columns, type);
    }

    if (type === 'primary' || columns.length === 0) {
      return `${prefix}__${tableName}`;
    }

    return `${prefix}__${tableName}__${columns.join('_')}`;
  }
}

describe('custom constraint naming [mssql]', () => {
  let orm: Awaited<ReturnType<typeof initORMMsSql>>;

  beforeAll(async () => {
    orm = await initORMMsSql({ namingStrategy: KeyNamingStrategy }, false);
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('uses KeyNamingStrategy names in generated MSSQL schema SQL', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('identity(1,1) not null constraint [PK__Author2] primary key');
    expect(sql).toContain('constraint [PK__FooParam2] primary key ([bar], [baz])');
    expect(sql).toContain('constraint [FK__FooParam2__bar] foreign key ([bar])');
    expect(sql).toContain('create unique index [UK__Author2__name_email] on [Author2] ([name], [email]);');
    expect(sql).toContain('create index [IX__Author2__termsAccepted] on [Author2] ([termsAccepted]);');
    expect(sql).toContain("constraint [CK__Publisher2__type] check ([type] in ('local', 'global'))");
  });
});
