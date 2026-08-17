import { defineEntity, MikroORM, p, StringType } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

const NormalizedStringUser = defineEntity({
  name: 'NormalizedStringUser',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string({ trim: true, case: 'upper' }),
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
    const user = orm.em.create(NormalizedStringUser, { name: '  Alice  ' });
    expect(user.name).toBe('  Alice  ');

    orm.em.assign(user, { name: '  Alice Smith  ' });
    expect(user.name).toBe('  Alice Smith  ');
    await orm.em.flush();

    const [inserted] = await orm.em
      .getConnection()
      .execute<{ name: string }[]>('select "name" from "normalized_string_user" where "id" = ?', [user.id]);
    expect(inserted.name).toBe('ALICE SMITH');
    expect(user.name).toBe('  Alice Smith  ');

    orm.em.clear();
    const loaded = await orm.em.findOneOrFail(NormalizedStringUser, { name: '  alice smith  ' });
    expect(loaded.name).toBe('ALICE SMITH');

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

  test('normalizes externally inserted values during hydration without a phantom update', async () => {
    await orm.em
      .getConnection()
      .execute('insert into "normalized_string_user" ("id", "name") values (?, ?)', [100, '  External  ']);

    const user = await orm.em.findOneOrFail(NormalizedStringUser, 100);
    expect(user.name).toBe('EXTERNAL');

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
