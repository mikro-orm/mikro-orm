import { defineEntity, EntitySchema, MikroORM, p, raw } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import {
  Entity,
  Formula,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

interface PartialUser {
  id: number;
  email: string;
  deletedAt: Date | null;
}

@Entity({ tableName: 'tag_rel' })
class TagRel {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'post_rel' })
class PostRel {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => TagRel)
  tag!: TagRel;
}

@Entity({ tableName: 'formula_user' })
class FormulaUser {
  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  @Property()
  status: string = 'active';

  // non-lazy formula, selected by default — its subquery has an inner `where`
  // referencing another table, which must NOT leak into the partial-index predicate
  @Formula(alias => `(select count(*) from post_rel p where p.tag_id = ${alias}.id)`)
  postCount!: number;
}

function makeMeta(opts: { where?: string }) {
  return new EntitySchema<PartialUser>({
    name: 'PartialUser',
    tableName: 'partial_user',
    properties: {
      id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'integer' },
      email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'text' },
      deletedAt: { name: 'deletedAt', type: 'Date', fieldName: 'deleted_at', columnType: 'datetime', nullable: true },
    },
    uniques: [
      {
        name: 'partial_user_email_uniq',
        properties: ['email'],
        ...(opts.where ? { where: opts.where } : {}),
      },
    ],
  }).init().meta;
}

describe('partial index [sqlite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [],
      dbName: ':memory:',
      extensions: [EntityGenerator],
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('end-to-end create / no-op / change / drop / re-add', async () => {
    const meta = orm.getMetadata();

    const created = makeMeta({ where: '"deleted_at" is null' });
    meta.set(created.class, created);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('1-create-with-where');
    expect(diff).toMatch(/where "deleted_at" is null/);
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    const changed = makeMeta({ where: '"deleted_at" is not null' });
    meta.set(changed.class, changed);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('3-change-where');
    expect(diff).toMatch(/where "deleted_at" is not null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    const noWhere = makeMeta({});
    meta.set(noWhere.class, noWhere);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('4-drop-where');
    expect(diff).not.toMatch(/where /);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    const readded = makeMeta({ where: '"deleted_at" is null' });
    meta.set(readded.class, readded);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('5-readd-where');
    expect(diff).toMatch(/where "deleted_at" is null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
  });

  test('object (FilterQuery) `where` renders to a SQL fragment', async () => {
    const meta = orm.getMetadata();
    for (const [, m] of meta.getAll()) {
      meta.reset(m.class);
    }
    const e = new EntitySchema<PartialUser>({
      name: 'PartialObjUser',
      tableName: 'partial_obj_user',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'integer' },
        email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'text' },
        deletedAt: {
          name: 'deletedAt',
          type: 'Date',
          fieldName: 'deleted_at',
          columnType: 'datetime',
          nullable: true,
        },
      },
      uniques: [
        {
          name: 'partial_obj_user_email_uniq',
          properties: ['email'],
          where: { deletedAt: null },
        },
      ],
    }).init().meta;
    meta.set(e.class, e as any);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // FilterQuery `{ deletedAt: null }` renders with the dialect's identifier quoting (backticks on SQLite)
    expect(diff).toMatch(/where `deleted_at` is null/);
    await orm.schema.execute(diff);
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    meta.reset(e.class);
    await orm.schema.execute('drop table if exists `partial_obj_user`');
  });

  test('renderPartialIndexWhere rejects empty and relation-traversing FilterQuery', async () => {
    const meta = orm.getMetadata();
    for (const [, m] of meta.getAll()) {
      meta.reset(m.class);
    }

    // Decorator-based entities wire up relation metadata (EntitySchema's string `entity`
    // reference isn't enough for the QB to resolve join targets).
    const rtOrm = await MikroORM.init({
      entities: [TagRel, PostRel, FormulaUser],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
      discovery: { warnWhenNoEntities: false },
    });

    try {
      const driver = rtOrm.em.getDriver() as unknown as {
        renderPartialIndexWhere: (entity: unknown, where: unknown) => string;
      };

      // strings pass through unchanged
      expect(driver.renderPartialIndexWhere(TagRel, `"name" = 'x'`)).toBe(`"name" = 'x'`);

      // empty object is rejected with a clear error naming the entity
      expect(() => driver.renderPartialIndexWhere(TagRel, {})).toThrow(/entity 'TagRel': `where` is empty/);

      // relation traversal is rejected
      expect(() => driver.renderPartialIndexWhere(PostRel, { tag: { name: 'x' } })).toThrow(
        /`where` may not traverse relations/,
      );

      // a raw fragment that injects a bare `other_table.col` cross-reference is rejected,
      // even though the QB can't see it as a relation-traversal join
      expect(() => driver.renderPartialIndexWhere(TagRel, { name: raw('other_table.col') })).toThrow(
        /references another table or subquery/,
      );

      // object FilterQuery on own columns renders with no alias prefix
      expect(driver.renderPartialIndexWhere(TagRel, { name: 'x' })).toMatch(/`name` = 'x'/);
      // dots inside string literals (e.g. in raw fragments) must not trigger the cross-ref guard
      expect(driver.renderPartialIndexWhere(TagRel, { name: raw(`'a.b'`) })).toMatch(/`name` = 'a\.b'/);
      // schema-qualified function calls are NOT cross-table refs — the guard's `(?!\s*\()`
      // lookahead distinguishes `pg_catalog.lower(name)` (OK) from `other_table.col` (rejected).
      expect(driver.renderPartialIndexWhere(TagRel, { name: raw(`pg_catalog.lower('x')`) })).toMatch(
        /`name` = pg_catalog\.lower\('x'\)/,
      );

      // a clean predicate on an entity with a non-lazy @Formula (whose subquery has its own
      // inner `where` referencing another table) must not false-positive as a cross-table ref
      expect(driver.renderPartialIndexWhere(FormulaUser, { status: { $ne: 'deleted' } })).toMatch(
        /`status` != 'deleted'/,
      );
    } finally {
      await rtOrm.close(true);
    }
  });

  test('splitTopLevelAnd does not treat `[` as a quote outside MSSQL', () => {
    // The MSSQL helper opts into bracket-quoted identifiers; every other dialect must NOT
    // — `[` may legitimately appear in PG array constructors (`ARRAY[1,2]`) etc., and
    // swallowing it as a quoted span would mis-tokenize predicates that follow.
    const helper = (orm.em.getPlatform() as any).getSchemaHelper();
    const split = (s: string): string[] => helper.splitTopLevelAnd(s);
    expect(split('a = 1 and b = 2')).toEqual(['a = 1', 'b = 2']);
    // a literal `[` followed by `and` must split — `[` is NOT a quote here
    expect(split('a = ARRAY[1,2] and b = 3')).toEqual(['a = ARRAY[1,2]', 'b = 3']);
  });

  test('addIndex rejects combining `expression` and `where`', async () => {
    const meta = orm.getMetadata();
    for (const [, m] of meta.getAll()) {
      meta.reset(m.class);
    }

    const e = new EntitySchema<PartialUser>({
      name: 'PartialUserBad',
      tableName: 'partial_user_bad',
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'integer' },
        email: { name: 'email', type: 'string', fieldName: 'email', columnType: 'text' },
        deletedAt: { name: 'deletedAt', type: 'Date', fieldName: 'deleted_at', columnType: 'datetime', nullable: true },
      },
      indexes: [
        {
          name: 'partial_user_bad_idx',
          expression: 'create index partial_user_bad_idx on partial_user_bad (email)',
          where: { deletedAt: null },
        } as any,
      ],
    }).init().meta;
    meta.set(e.class, e as any);

    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).rejects.toThrow(
      /cannot combine `expression` with `where`/,
    );

    meta.reset(e.class);
  });

  test('entity generator round-trips a partial index/unique back into clean `where:` options', async () => {
    const meta = orm.getMetadata();
    // wipe slate before introspecting
    for (const [, m] of meta.getAll()) {
      meta.reset(m.class);
    }
    await orm.schema.execute('drop table if exists `partial_gen_user`');
    await orm.schema.execute(
      'create table `partial_gen_user` (`id` integer not null primary key autoincrement, `email` text not null, `deleted_at` datetime null)',
    );
    await orm.schema.execute(
      'create index `partial_gen_user_active_idx` on `partial_gen_user` (`email`) where "deleted_at" is null',
    );
    await orm.schema.execute(
      'create unique index `partial_gen_user_email_uniq` on `partial_gen_user` (`email`) where "deleted_at" is null',
    );

    const [dump] = await orm.entityGenerator.generate();
    expect(dump).toMatch(/where: '"deleted_at" is null'/);
    expect(dump).toMatch(/partial_gen_user_active_idx/);
    expect(dump).toMatch(/partial_gen_user_email_uniq/);

    await orm.schema.execute('drop table if exists `partial_gen_user`');
  });
});

describe('partial index [sqlite] — defineEntity extends', () => {
  test('`where` (FilterQuery) resolves against properties inherited from a parent defineEntity', async () => {
    const SoftDeleteBase = defineEntity({
      name: 'SoftDeleteBase',
      abstract: true,
      properties: {
        id: p.integer().primary(),
        deletedAt: p.datetime().nullable(),
      },
    });

    const PartialChildSchema = defineEntity({
      extends: SoftDeleteBase,
      name: 'PartialChild',
      tableName: 'partial_child',
      properties: {
        email: p.string(),
      },
      uniques: [
        // `deletedAt` is inherited — the FilterQuery → SQL render must see it
        { properties: ['email'], where: { deletedAt: null } },
      ],
    });

    class PartialChild extends PartialChildSchema.class {}
    PartialChildSchema.setClass(PartialChild);

    const orm2 = await MikroORM.init({
      entities: [PartialChild],
      dbName: ':memory:',
    });

    const create = await orm2.schema.getCreateSchemaSQL({ wrap: false });
    expect(create).toMatch(/where `deleted_at` is null/);
    await orm2.schema.execute(create);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.close(true);
  });
});
