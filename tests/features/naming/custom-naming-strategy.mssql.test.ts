import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { initORMMsSql } from '../../bootstrap.js';

class KeyNamingStrategy extends EntityCaseNamingStrategy {
  private normalize(value: string): string {
    return value.replace(/[^A-Za-z0-9_]/g, '');
  }

  private cols(columns: string[]): string {
    return columns.map(c => this.normalize(c)).join('_');
  }

  private inferRefTable(columns: string[]): string | null {
    if (columns.length !== 1) {return null;}

    const col = columns[0] ?? '';
    const match = /^(.+?)Id$/.exec(col);

    if (!match) {return null;}

    const base = match[1] ?? '';
    const singular = base.charAt(0).toUpperCase() + base.slice(1);

    return this.normalize(singular);
  }

  override indexName(
    tableName: string,
    columns: string[],
    type: 'primary' | 'foreign' | 'unique' | 'index' | 'sequence' | 'check',
  ): string {
    const t = this.normalize(tableName);
    const c = this.cols(columns);
    const ref = this.inferRefTable(columns);

    switch (type) {
      case 'primary':
        return `PK__${t}`;
      case 'foreign':
        return ref ? `FK__${t}__${ref}` : (c ? `FK__${t}__${c}` : `FK__${t}`);
      case 'unique':
        return c ? `UK__${t}__${c}` : `UK__${t}`;
      case 'index':
        return c ? `IX__${t}__${c}` : `IX__${t}`;
      case 'sequence':
        return c ? `SQ__${t}__${c}` : `SQ__${t}`;
      case 'check':
        return c ? `CK__${t}__${c}` : `CK__${t}`;
      default:
        return super.indexName(tableName, columns, type);
    }
  }
}

describe('custom constraint naming [mssql]', () => {
  let orm: Awaited<ReturnType<typeof initORMMsSql>>;
  const namingStrategy = new KeyNamingStrategy();

  beforeAll(async () => {
    orm = await initORMMsSql({
      namingStrategy: KeyNamingStrategy,
    }, false);
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('KeyNamingStrategy returns names for all index types', () => {
    expect(namingStrategy.indexName('author2', ['id'], 'primary')).toBe('PK__author2');
    expect(namingStrategy.indexName('author2', ['favouriteBookId'], 'foreign')).toBe('FK__author2__FavouriteBook');
    expect(namingStrategy.indexName('author2', ['email'], 'unique')).toBe('UK__author2__email');
    expect(namingStrategy.indexName('author2', ['name'], 'index')).toBe('IX__author2__name');
    expect(namingStrategy.indexName('author2', ['name'], 'check')).toBe('CK__author2__name');
    expect(namingStrategy.indexName('author2', ['id'], 'sequence')).toBe('SQ__author2__id');
  });

  test('uses KeyNamingStrategy names in generated MSSQL schema SQL', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('constraint [PK__Author2] primary key');
    expect(sql).toContain('create table [FooParam2] ([bar] int not null, [baz] int not null, [value] nvarchar(255) not null, primary key ([bar], [baz]));');
    expect(sql).not.toContain('constraint [PK__FooParam2] primary key');
    expect(sql).toContain('constraint [FK__FooParam2__bar] foreign key ([bar])');
    expect(sql).toContain('create unique index [UK__Author2__name_email] on [Author2] ([name], [email]);');
    expect(sql).toContain('create index [IX__Author2__termsAccepted] on [Author2] ([termsAccepted]);');
    expect(sql).toContain('constraint [CK__Publisher2__type] check ([type] in (\'local\', \'global\'))');
  });
});
