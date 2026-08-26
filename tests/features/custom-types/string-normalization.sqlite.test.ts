import { defineEntity, MikroORM, p, StringType } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

const NormalizedStringUser = defineEntity({
  name: 'NormalizedStringUser',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string().trim().uppercase(),
    description: p.text().trim().lowercase(),
    aliases: p.string().trim().lowercase().array(),
  },
});

@Entity()
class DirectStringUser {
  @PrimaryKey()
  id!: number;

  @Property({ type: new StringType({ trim: true, case: 'lower' }) })
  name!: string;
}

describe('string normalization', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [NormalizedStringUser, DirectStringUser],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.clear());

  test('normalizes persistence, query parameters, assignment, and refresh', async () => {
    const user = orm.em.create(NormalizedStringUser, {
      name: '  Alice  ',
      description: '  DESCRIPTION  ',
      aliases: ['  Alice  ', '  A. SMITH  '],
    });
    expect(user.name).toBe('  Alice  ');
    expect(user.description).toBe('  DESCRIPTION  ');
    expect(user.aliases).toEqual(['  Alice  ', '  A. SMITH  ']);

    orm.em.assign(user, { name: '  Alice Smith  ' });
    expect(user.name).toBe('  Alice Smith  ');
    await orm.em.flush();

    const [inserted] = await orm.em
      .getConnection()
      .execute<{ name: string; description: string }[]>(
        'select "name", "description" from "normalized_string_user" where "id" = ?',
        [user.id],
      );
    expect(inserted.name).toBe('ALICE SMITH');
    expect(inserted.description).toBe('description');
    expect(user.name).toBe('  Alice Smith  ');

    orm.em.clear();
    const loaded = await orm.em.findOneOrFail(NormalizedStringUser, { name: '  alice smith  ' });
    expect(loaded.name).toBe('ALICE SMITH');
    expect(loaded.description).toBe('description');
    expect(loaded.aliases).toEqual(['alice', 'a. smith']);

    loaded.name = '  Bob  ';
    await orm.em.flush();
    expect(loaded.name).toBe('  Bob  ');

    const [updated] = await orm.em
      .getConnection()
      .execute<{ name: string }[]>('select "name" from "normalized_string_user" where "id" = ?', [loaded.id]);
    expect(updated.name).toBe('BOB');

    await orm.em.refresh(loaded);
    expect(loaded.name).toBe('BOB');
  });

  test('compares assigned values by their normalized representation', async () => {
    const user = orm.em.create(NormalizedStringUser, {
      name: 'Alice',
      description: 'Description',
      aliases: ['Alias'],
    });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(NormalizedStringUser, user.id);
    loaded.name = '  alice  ';

    const logger = mockLogger(orm);
    logger.mockClear();
    await orm.em.flush();

    expect(loaded.name).toBe('  alice  ');
    expect(logger.mock.calls.filter(([message]) => /update/i.test(String(message)))).toHaveLength(0);
  });

  test('does not normalize externally inserted values during hydration', async () => {
    const aliases = orm.em.getPlatform().marshallArray(['  Alias  ']);
    await orm.em
      .getConnection()
      .execute('insert into "normalized_string_user" ("id", "name", "description", "aliases") values (?, ?, ?, ?)', [
        100,
        '  External  ',
        '  DESCRIPTION  ',
        aliases,
      ]);

    const user = await orm.em.findOneOrFail(NormalizedStringUser, 100);
    expect(user.name).toBe('  External  ');
    expect(user.description).toBe('  DESCRIPTION  ');
    expect(user.aliases).toEqual(['  Alias  ']);

    const logger = mockLogger(orm);
    logger.mockClear();
    await orm.em.flush();

    expect(logger.mock.calls.filter(([message]) => /update/i.test(String(message)))).toHaveLength(0);
  });

  test('supports direct configured StringType metadata', async () => {
    const user = orm.em.create(DirectStringUser, { name: '  Mixed Case  ' });
    await orm.em.flush();
    expect(user.name).toBe('  Mixed Case  ');

    const [inserted] = await orm.em
      .getConnection()
      .execute<{ name: string }[]>('select "name" from "direct_string_user" where "id" = ?', [user.id]);
    expect(inserted.name).toBe('mixed case');

    orm.em.clear();
    const loaded = await orm.em.findOneOrFail(DirectStringUser, { name: '  MIXED CASE  ' });
    expect(loaded.name).toBe('mixed case');
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
