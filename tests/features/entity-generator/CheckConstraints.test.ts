import { MikroORM } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';

describe('check constraints in generated entities', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      discovery: { warnWhenNoEntities: false },
      extensions: [EntityGenerator],
    });
    await orm.em
      .getConnection()
      .execute(
        `create table probe (id integer primary key, code text not null, mode text not null check (mode in ('explicit', 'all-active')), system_key text, price integer not null check (price >= 0), constraint chk_probe_code_format check (code like 'x%'), constraint chk_probe_shape check (mode <> 'all-active' or system_key is not null))`,
      );
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test.each(['decorators', 'entitySchema', 'defineEntity'] as const)('%s', async entityDefinition => {
    const dump = (await orm.entityGenerator.generate({ entityDefinition })).join('\n');
    expect(dump).toContain('chk_probe_code_format');
    expect(dump).toContain('chk_probe_shape');
    expect(dump).toContain('probe_price_check');
    // the `mode in (...)` check is represented by the enum property, the ORM
    // recreates an equivalent check under the same conventional name
    expect(dump).not.toContain('probe_mode_check');
    expect(dump).toMatchSnapshot();
  });
});
