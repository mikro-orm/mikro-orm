import { Collection, EntitySchema, MikroORM, quote, Ref, wrap, raw, Type, Opt } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

// Base entity with TPT inheritance strategy
@Entity({ inheritance: 'tpt' })
abstract class Integration {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ default: true })
  active?: boolean = true;
}

// Child entity - FooIntegration
@Entity()
class FooIntegration extends Integration {
  @Property()
  fooData!: string;

  // Generated column to test TPT with createSchemaColumnMappingObject
  // Uses table.toString() to cover that code path
  @Property({
    length: 100,
    generated: (cols, table) => `(upper(${cols.fooData}) || ' from ' || '${table}') stored`,
  })
  fooDataUpper!: Opt<string>;
}

// Child entity - BarIntegration
@Entity()
class BarIntegration extends Integration {
  @Property()
  barData!: string;

  @Property({ nullable: true })
  barExtra?: string;
}

// Multi-level TPT: GrandChild extends BarIntegration
@Entity()
class BazIntegration extends BarIntegration {
  @Property()
  bazData!: string;
}

// Entity that references TPT entities
@Entity()
class Project {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Integration, { ref: true, nullable: true })
  integration?: Ref<Integration>;
}

// Entity with collection of TPT entities
@Entity()
class Workspace {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => WorkspaceIntegration, wi => wi.workspace)
  integrations = new Collection<WorkspaceIntegration>(this);
}

@Entity()
class WorkspaceIntegration {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Workspace, { ref: true })
  workspace!: Ref<Workspace>;

  @ManyToOne(() => Integration, { ref: true })
  integration!: Ref<Integration>;
}

describe('TPT (Table-Per-Type) Inheritance', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Integration, FooIntegration, BarIntegration, BazIntegration, Project, Workspace, WorkspaceIntegration],
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  describe('metadata', () => {
    test('TPT metadata is set correctly', () => {
      const integrationMeta = orm.getMetadata().get(Integration);
      const fooMeta = orm.getMetadata().get(FooIntegration);
      const barMeta = orm.getMetadata().get(BarIntegration);
      const bazMeta = orm.getMetadata().get(BazIntegration);

      // Root entity has TPT inheritance type
      expect(integrationMeta.inheritanceType).toBe('tpt');
      expect(integrationMeta.tptParent).toBeUndefined();
      expect(integrationMeta.tptChildren).toContain(fooMeta);
      expect(integrationMeta.tptChildren).toContain(barMeta);

      // FooIntegration is a direct child
      expect(fooMeta.inheritanceType).toBe('tpt');
      expect(fooMeta.tptParent).toBe(integrationMeta);
      expect(fooMeta.tptChildren).toBeUndefined();

      // BarIntegration is a direct child with its own child
      expect(barMeta.inheritanceType).toBe('tpt');
      expect(barMeta.tptParent).toBe(integrationMeta);
      expect(barMeta.tptChildren).toContain(bazMeta);

      // BazIntegration is a grandchild
      expect(bazMeta.inheritanceType).toBe('tpt');
      expect(bazMeta.tptParent).toBe(barMeta);
      expect(bazMeta.tptChildren).toBeUndefined();
    });

    test('ownProps contains only properties defined in the entity', () => {
      const integrationMeta = orm.getMetadata().get(Integration);
      const fooMeta = orm.getMetadata().get(FooIntegration);
      const barMeta = orm.getMetadata().get(BarIntegration);
      const bazMeta = orm.getMetadata().get(BazIntegration);

      // Integration owns id, name, active
      expect(integrationMeta.ownProps?.map(p => p.name).sort()).toEqual(['active', 'id', 'name']);

      // FooIntegration owns fooData, fooDataUpper
      expect(fooMeta.ownProps?.map(p => p.name)).toEqual(['fooData', 'fooDataUpper']);

      // BarIntegration owns barData and barExtra
      expect(barMeta.ownProps?.map(p => p.name).sort()).toEqual(['barData', 'barExtra']);

      // BazIntegration owns only bazData
      expect(bazMeta.ownProps?.map(p => p.name)).toEqual(['bazData']);
    });
  });

  describe('schema', () => {
    test('generates separate tables with FK constraints', async () => {
      const sql = await orm.schema.getCreateSchemaSQL();

      // Each entity has its own table
      expect(sql).toMatch(/create table.*integration/i);
      expect(sql).toMatch(/create table.*foo_integration/i);
      expect(sql).toMatch(/create table.*bar_integration/i);
      expect(sql).toMatch(/create table.*baz_integration/i);

      // Child tables have FK to parent
      expect(sql).toMatch(/foo_integration.*references.*integration/is);
      expect(sql).toMatch(/bar_integration.*references.*integration/is);
      expect(sql).toMatch(/baz_integration.*references.*bar_integration/is);
    });
  });

  describe('persistence', () => {
    test('INSERT creates records in multiple tables', async () => {
      const mock = mockLogger(orm);

      const foo = orm.em.create(FooIntegration, {
        name: 'Foo Integration',
        fooData: 'foo-data',
      });
      await orm.em.flush();

      // Should have INSERT for both integration and foo_integration tables
      const logs = mock.mock.calls.map(c => c[0]);
      expect(logs.some((l: string) => l.includes('insert into `integration`'))).toBe(true);
      expect(logs.some((l: string) => l.includes('insert into `foo_integration`'))).toBe(true);

      orm.em.clear();

      // Verify data was inserted correctly
      const loaded = await orm.em.findOneOrFail(FooIntegration, foo.id);
      expect(loaded.name).toBe('Foo Integration');
      expect(loaded.fooData).toBe('foo-data');
      expect(loaded.active).toBe(true);
    });

    test('INSERT with multi-level inheritance', async () => {
      const mock = mockLogger(orm);

      const baz = orm.em.create(BazIntegration, {
        name: 'Baz Integration',
        barData: 'bar-data',
        bazData: 'baz-data',
      });
      await orm.em.flush();

      // Should have INSERT for integration, bar_integration, and baz_integration
      const logs = mock.mock.calls.map(c => c[0]);
      expect(logs.some((l: string) => l.includes('insert into `integration`'))).toBe(true);
      expect(logs.some((l: string) => l.includes('insert into `bar_integration`'))).toBe(true);
      expect(logs.some((l: string) => l.includes('insert into `baz_integration`'))).toBe(true);

      orm.em.clear();

      // Verify data
      const loaded = await orm.em.findOneOrFail(BazIntegration, baz.id);
      expect(loaded.name).toBe('Baz Integration');
      expect(loaded.barData).toBe('bar-data');
      expect(loaded.bazData).toBe('baz-data');
    });

    test('UPDATE only updates changed tables', async () => {
      const foo = orm.em.create(FooIntegration, {
        name: 'Foo Integration',
        fooData: 'foo-data',
      });
      await orm.em.flush();
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(FooIntegration, foo.id);
      const mock = mockLogger(orm);

      // Update only child property
      loaded.fooData = 'updated-foo-data';
      await orm.em.flush();

      let logs = mock.mock.calls.map(c => c[0]);
      expect(logs.some((l: string) => l.includes('update `foo_integration`'))).toBe(true);
      expect(logs.some((l: string) => l.includes('update `integration`'))).toBe(false);

      mock.mockClear();

      // Update only parent property
      loaded.name = 'Updated Name';
      await orm.em.flush();

      logs = mock.mock.calls.map(c => c[0]);
      expect(logs.some((l: string) => l.includes('update `integration`'))).toBe(true);
      expect(logs.some((l: string) => l.includes('update `foo_integration`'))).toBe(false);
    });

    test('DELETE removes records via cascade', async () => {
      const foo = orm.em.create(FooIntegration, {
        name: 'Foo Integration',
        fooData: 'foo-data',
      });
      await orm.em.flush();
      const fooId = foo.id;
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(FooIntegration, fooId);
      orm.em.remove(loaded);
      await orm.em.flush();

      // Verify both tables are empty
      const integrationCount = await orm.em.count(Integration, { id: fooId });
      expect(integrationCount).toBe(0);
    });
  });

  describe.each(['select-in', 'joined'] as const)('querying (%s strategy)', strategy => {
    beforeEach(async () => {
      // Create test data
      orm.em.create(FooIntegration, { name: 'Foo 1', fooData: 'foo-data-1' });
      orm.em.create(FooIntegration, { name: 'Foo 2', fooData: 'foo-data-2' });
      orm.em.create(BarIntegration, { name: 'Bar 1', barData: 'bar-data-1' });
      orm.em.create(BazIntegration, { name: 'Baz 1', barData: 'bar-data-baz', bazData: 'baz-data-1' });
      await orm.em.flush();
      orm.em.clear();
    });

    test('SELECT joins parent tables', async () => {
      const mock = mockLogger(orm);

      const foos = await orm.em.find(FooIntegration, {}, { strategy });
      expect(foos).toHaveLength(2);

      // Should INNER JOIN the parent table
      const selectLog = mock.mock.calls.find(c => c[0].includes('select'));
      expect(selectLog?.[0]).toMatch(/inner join `integration`/i);

      // All properties should be loaded
      expect(foos[0].name).toBe('Foo 1');
      expect(foos[0].fooData).toBe('foo-data-1');
      expect(foos[0].active).toBe(true);
    });

    test('SELECT with multi-level inheritance', async () => {
      const mock = mockLogger(orm);

      const bazs = await orm.em.find(BazIntegration, {}, { strategy });
      expect(bazs).toHaveLength(1);

      // Should INNER JOIN both parent tables
      const selectLog = mock.mock.calls.find(c => c[0].includes('select'));
      expect(selectLog?.[0]).toMatch(/inner join `bar_integration`/i);
      expect(selectLog?.[0]).toMatch(/inner join `integration`/i);

      // All properties should be loaded
      expect(bazs[0].name).toBe('Baz 1');
      expect(bazs[0].barData).toBe('bar-data-baz');
      expect(bazs[0].bazData).toBe('baz-data-1');
    });

    test('WHERE on inherited properties', async () => {
      const mock = mockLogger(orm);

      const foos = await orm.em.find(FooIntegration, { name: 'Foo 1' }, { strategy });
      expect(foos).toHaveLength(1);
      expect(foos[0].fooData).toBe('foo-data-1');

      // WHERE should reference the correct parent table alias
      const selectLog = mock.mock.calls.find(c => c[0].includes('select'));
      expect(selectLog?.[0]).toMatch(/`name`\s*=\s*'Foo 1'/);
    });

    test('WHERE on own properties', async () => {
      const foos = await orm.em.find(FooIntegration, { fooData: 'foo-data-2' }, { strategy });
      expect(foos).toHaveLength(1);
      expect(foos[0].name).toBe('Foo 2');
    });

    test('ORDER BY on inherited properties', async () => {
      const foos = await orm.em.find(
        FooIntegration,
        {},
        {
          strategy,
          orderBy: { name: 'DESC' },
        },
      );
      expect(foos).toHaveLength(2);
      expect(foos[0].name).toBe('Foo 2');
      expect(foos[1].name).toBe('Foo 1');
    });

    test('ORDER BY on own properties', async () => {
      const foos = await orm.em.find(
        FooIntegration,
        {},
        {
          strategy,
          orderBy: { fooData: 'DESC' },
        },
      );
      expect(foos).toHaveLength(2);
      expect(foos[0].fooData).toBe('foo-data-2');
      expect(foos[1].fooData).toBe('foo-data-1');
    });

    test('partial loading with fields option', async () => {
      const foos = await orm.em.find(
        FooIntegration,
        {},
        {
          strategy,
          fields: ['name', 'fooData'],
        },
      );
      expect(foos).toHaveLength(2);
      expect(wrap(foos[0]).toObject()).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        fooData: expect.any(String),
      });
    });

    test('partial loading with only child fields', async () => {
      const foos = await orm.em.find(
        FooIntegration,
        {},
        {
          strategy,
          fields: ['id', 'fooData'],
        },
      );
      expect(foos).toHaveLength(2);
      expect(foos[0].fooData).toBeDefined();
      expect(foos[0].id).toBeDefined();
    });

    test('partial loading with only inherited fields', async () => {
      const foos = await orm.em.find(
        FooIntegration,
        {},
        {
          strategy,
          fields: ['id', 'name'],
        },
      );
      expect(foos).toHaveLength(2);
      expect(foos[0].name).toBeDefined();
      expect(foos[0].id).toBeDefined();
    });
  });

  describe('relations with TPT entities', () => {
    test('ManyToOne to TPT entity', async () => {
      const foo = orm.em.create(FooIntegration, { name: 'Foo', fooData: 'data' });
      const project = orm.em.create(Project, { title: 'Project 1', integration: foo });
      await orm.em.flush();
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(Project, project.id, {
        populate: ['integration'],
      });

      expect(loaded.integration?.unwrap()).toBeInstanceOf(FooIntegration);
      expect((loaded.integration?.unwrap() as FooIntegration).fooData).toBe('data');
    });

    test('collection of TPT entities', async () => {
      const foo = orm.em.create(FooIntegration, { name: 'Foo', fooData: 'data' });
      const bar = orm.em.create(BarIntegration, { name: 'Bar', barData: 'data' });
      const workspace = orm.em.create(Workspace, { name: 'Workspace 1' });
      const wi1 = orm.em.create(WorkspaceIntegration, { workspace, integration: foo });
      const wi2 = orm.em.create(WorkspaceIntegration, { workspace, integration: bar });
      await orm.em.flush();
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(Workspace, workspace.id, {
        populate: ['integrations.integration'],
      });
      expect(loaded.integrations).toHaveLength(2);
      expect(loaded.integrations[0].integration?.unwrap()).toBeInstanceOf(Integration);
      expect(loaded.integrations[1].integration?.unwrap()).toBeInstanceOf(Integration);
    });
  });
});

describe('TPT validation and edge cases', () => {
  test('throws when mixing STI and TPT', async () => {
    // Entity with both discriminatorColumn (STI) and inheritance: 'tpt'
    @Entity({
      inheritance: 'tpt',
      discriminatorColumn: 'type',
      discriminatorMap: { base: 'MixedBase2', child: 'MixedChild2' },
    })
    abstract class MixedBase2 {
      @PrimaryKey()
      id!: number;

      @Property()
      type!: string;
    }

    @Entity({ discriminatorValue: 'child' })
    class MixedChild2 extends MixedBase2 {
      @Property()
      data!: string;
    }

    await expect(
      MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        dbName: ':memory:',
        entities: [MixedBase2, MixedChild2],
      }),
    ).rejects.toThrow(/cannot mix STI.*and TPT/i);
  });

  test('TPT with non-abstract root entity', async () => {
    // Non-abstract root entity is allowed
    @Entity({ inheritance: 'tpt' })
    class ConcreteRoot {
      @PrimaryKey()
      id!: number;

      @Property()
      rootProp!: string;
    }

    @Entity()
    class ConcreteChild extends ConcreteRoot {
      @Property()
      childProp!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [ConcreteRoot, ConcreteChild],
    });

    await orm.schema.create();

    // Can persist root entity directly
    const root = orm.em.create(ConcreteRoot, { rootProp: 'root-data' });
    await orm.em.flush();
    expect(root.id).toBeDefined();

    orm.em.clear();

    // Can query root entity
    const loaded = await orm.em.findOneOrFail(ConcreteRoot, root.id);
    expect(loaded.rootProp).toBe('root-data');

    await orm.close();
  });

  test('TPT query with complex WHERE conditions', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Base {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @Property({ nullable: true })
      optional?: string;
    }

    @Entity()
    class Child extends Base {
      @Property()
      value!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Base, Child],
    });

    await orm.schema.create();

    // Create test data
    orm.em.create(Child, { name: 'A', value: 10, optional: 'x' });
    orm.em.create(Child, { name: 'B', value: 20 });
    orm.em.create(Child, { name: 'C', value: 30, optional: 'y' });
    await orm.em.flush();
    orm.em.clear();

    // Query with conditions on both parent and child properties
    const results = await orm.em.find(
      Child,
      {
        $or: [{ name: 'A', value: { $gte: 10 } }, { optional: 'y' }],
      },
      { orderBy: { name: 'ASC' } },
    );

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('A');
    expect(results[1].name).toBe('C');

    await orm.close();
  });

  test('TPT with raw query fragments', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class BaseEntity {
      @PrimaryKey()
      id!: number;

      @Property()
      score!: number;
    }

    @Entity()
    class DerivedEntity extends BaseEntity {
      @Property()
      multiplier!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [BaseEntity, DerivedEntity],
    });

    await orm.schema.create();

    orm.em.create(DerivedEntity, { score: 10, multiplier: 2 });
    orm.em.create(DerivedEntity, { score: 20, multiplier: 3 });
    await orm.em.flush();
    orm.em.clear();

    // Query with raw SQL in WHERE
    const results = await orm.em.find(DerivedEntity, {
      [raw('score * multiplier')]: { $gte: 50 },
    });

    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(20);

    await orm.close();
  });

  test('TPT with COUNT queries', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class CountBase {
      @PrimaryKey()
      id!: number;

      @Property()
      category!: string;
    }

    @Entity()
    class CountChild extends CountBase {
      @Property()
      value!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [CountBase, CountChild],
    });

    await orm.schema.create();

    // Create test data
    orm.em.create(CountChild, { category: 'A', value: 10 });
    orm.em.create(CountChild, { category: 'A', value: 20 });
    orm.em.create(CountChild, { category: 'B', value: 30 });
    await orm.em.flush();
    orm.em.clear();

    // Count with condition on inherited property
    const countA = await orm.em.count(CountChild, { category: 'A' });
    expect(countA).toBe(2);

    // Count with condition on own property
    const countHigh = await orm.em.count(CountChild, { value: { $gte: 20 } });
    expect(countHigh).toBe(2);

    // Count all
    const countAll = await orm.em.count(CountChild);
    expect(countAll).toBe(3);

    await orm.close();
  });

  test('TPT with bulk insert (insertMany)', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class BulkBase {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class BulkChild extends BulkBase {
      @Property()
      data!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [BulkBase, BulkChild],
    });

    await orm.schema.create();

    // Create multiple entities at once
    const entities = [
      orm.em.create(BulkChild, { name: 'One', data: 'data-1' }),
      orm.em.create(BulkChild, { name: 'Two', data: 'data-2' }),
      orm.em.create(BulkChild, { name: 'Three', data: 'data-3' }),
    ];

    await orm.em.flush();

    // Verify all were persisted correctly
    expect(entities[0].id).toBeDefined();
    expect(entities[1].id).toBeDefined();
    expect(entities[2].id).toBeDefined();

    orm.em.clear();

    // Reload and verify
    const loaded = await orm.em.find(BulkChild, {}, { orderBy: { name: 'ASC' } });
    expect(loaded).toHaveLength(3);
    expect(loaded[0].name).toBe('One');
    expect(loaded[0].data).toBe('data-1');
    expect(loaded[1].name).toBe('Three');
    expect(loaded[2].name).toBe('Two');

    await orm.close();
  });

  test('TPT with findOne and findOneOrFail', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class FindBase {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class FindChild extends FindBase {
      @Property()
      data!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [FindBase, FindChild],
    });

    await orm.schema.create();

    const entity = orm.em.create(FindChild, { name: 'Test', data: 'test-data' });
    await orm.em.flush();
    orm.em.clear();

    // findOne by primary key
    const found1 = await orm.em.findOne(FindChild, entity.id);
    expect(found1?.name).toBe('Test');
    expect(found1?.data).toBe('test-data');

    orm.em.clear();

    // findOne by inherited property
    const found2 = await orm.em.findOne(FindChild, { name: 'Test' });
    expect(found2?.data).toBe('test-data');

    orm.em.clear();

    // findOneOrFail by own property
    const found3 = await orm.em.findOneOrFail(FindChild, { data: 'test-data' });
    expect(found3.name).toBe('Test');

    await orm.close();
  });

  test('TPT with qb.getCount()', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class QbCountBase {
      @PrimaryKey()
      id!: number;

      @Property()
      status!: string;
    }

    @Entity()
    class QbCountChild extends QbCountBase {
      @Property()
      priority!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [QbCountBase, QbCountChild],
    });

    await orm.schema.create();

    orm.em.create(QbCountChild, { status: 'active', priority: 1 });
    orm.em.create(QbCountChild, { status: 'active', priority: 2 });
    orm.em.create(QbCountChild, { status: 'inactive', priority: 3 });
    await orm.em.flush();
    orm.em.clear();

    // QueryBuilder count with condition on inherited property
    const qb1 = orm.em.createQueryBuilder(QbCountChild).where({ status: 'active' });
    const count1 = await qb1.getCount();
    expect(count1).toBe(2);

    // QueryBuilder count with condition on own property
    const qb2 = orm.em.createQueryBuilder(QbCountChild).where({ priority: { $gte: 2 } });
    const count2 = await qb2.getCount();
    expect(count2).toBe(2);

    await orm.close();
  });

  test('TPT entity only has root metadata when inheritance option not set on child', async () => {
    // When a child extends a TPT root, it automatically becomes TPT
    @Entity({ inheritance: 'tpt' })
    abstract class AutoBase {
      @PrimaryKey()
      id!: number;
    }

    @Entity()
    class AutoChild extends AutoBase {
      @Property()
      data!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [AutoBase, AutoChild],
    });

    const baseMeta = orm.getMetadata().get(AutoBase);
    const childMeta = orm.getMetadata().get(AutoChild);

    // Both should have TPT inheritance type
    expect(baseMeta.inheritanceType).toBe('tpt');
    expect(childMeta.inheritanceType).toBe('tpt');

    // Child should point to parent
    expect(childMeta.tptParent).toBe(baseMeta);

    await orm.close();
  });
});

describe('TPT with EntitySchema', () => {
  test('TPT works with EntitySchema-based entities', async () => {
    // Define entities using EntitySchema instead of decorators
    // Note: Using non-abstract base entity since abstract entities don't have their own table in TPT
    class SchemaBase {
      id!: number;
      baseName!: string;
    }

    class SchemaChild extends SchemaBase {
      childValue!: number;
    }

    const schemaBase = new EntitySchema({
      class: SchemaBase,
      tableName: 'schema_base',
      inheritance: 'tpt',
      properties: {
        id: { type: 'number', primary: true },
        baseName: { type: 'string' },
      },
    });

    const schemaChild = new EntitySchema({
      class: SchemaChild,
      tableName: 'schema_child',
      extends: schemaBase,
      properties: {
        childValue: { type: 'number' },
      },
    });

    const orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [schemaBase, schemaChild],
    });

    await orm.schema.create();

    // Verify TPT metadata
    const childMeta = orm.getMetadata().get(SchemaChild);

    expect(childMeta.inheritanceType).toBe('tpt');
    expect(childMeta.tptParent).toBeDefined();
    expect(childMeta.tptParent?.className).toBe('SchemaBase');

    // Verify ownProps
    expect(childMeta.ownProps?.map(p => p.name)).toEqual(['childValue']);

    // Create and persist entity
    const child = orm.em.create(SchemaChild, { baseName: 'test', childValue: 42 });
    await orm.em.flush();
    orm.em.clear();

    // Load entity
    const loaded = await orm.em.findOneOrFail(SchemaChild, child.id);
    expect(loaded.baseName).toBe('test');
    expect(loaded.childValue).toBe(42);

    await orm.close();
  });
});

describe('TPT with OneToOne owner relation in parent', () => {
  test('TPT parent with OneToOne owner relation', async () => {
    // Target entity for the OneToOne relation
    @Entity()
    class Profile {
      @PrimaryKey()
      id!: number;

      @Property()
      bio!: string;
    }

    // TPT base with OneToOne owner relation
    @Entity({ inheritance: 'tpt' })
    abstract class Person {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @OneToOne(() => Profile, { owner: true, nullable: true, ref: true })
      profile?: Ref<Profile>;
    }

    @Entity()
    class Employee extends Person {
      @Property()
      department!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Profile, Person, Employee],
    });

    await orm.schema.create();

    // Verify the OneToOne relation is in parent's ownProps
    const personMeta = orm.getMetadata().get(Person);
    expect(personMeta.ownProps?.some(p => p.name === 'profile')).toBe(true);

    // Create and persist
    const profile = orm.em.create(Profile, { bio: 'Developer' });
    const employee = orm.em.create(Employee, { name: 'John', department: 'Engineering', profile });
    await orm.em.flush();
    orm.em.clear();

    // First test: Load without populate - just basic select should work with TPT parent columns
    const mock = mockLogger(orm);
    const simpleLoad = await orm.em.findOneOrFail(Employee, employee.id);
    expect(simpleLoad.name).toBe('John');
    expect(simpleLoad.department).toBe('Engineering');

    // Check the SQL generated for simple load
    const selectLog = mock.mock.calls.find(c => c[0].includes('select'));
    // Should select from employee (e0) and join person (p0), with profile_id coming from p0
    expect(selectLog?.[0]).toMatch(/inner join.*person/i);

    orm.em.clear();
    mock.mockReset();

    // Second test: Load with populate - should also work
    const loaded = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['profile'] });

    expect(loaded.name).toBe('John');
    expect(loaded.department).toBe('Engineering');
    expect(loaded.profile?.unwrap().bio).toBe('Developer');

    await orm.close();
  });
});

describe('TPT polymorphic queries', () => {
  test('querying base class returns concrete types', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Animal {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class Dog extends Animal {
      @Property()
      breed!: string;
    }

    @Entity()
    class Cat extends Animal {
      @Property()
      color!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Animal, Dog, Cat],
    });

    await orm.schema.create();

    // Create some animals
    orm.em.create(Dog, { name: 'Buddy', breed: 'Labrador' });
    orm.em.create(Cat, { name: 'Whiskers', color: 'Orange' });
    orm.em.create(Dog, { name: 'Max', breed: 'Poodle' });
    await orm.em.flush();
    orm.em.clear();

    // Query the base class - should return concrete types
    const animals = await orm.em.find(Animal, {}, { orderBy: { name: 'ASC' } });

    expect(animals).toHaveLength(3);

    // Verify concrete types are returned
    expect(animals[0]).toBeInstanceOf(Dog);
    expect(animals[0].name).toBe('Buddy');
    expect((animals[0] as Dog).breed).toBe('Labrador');

    expect(animals[1]).toBeInstanceOf(Dog);
    expect(animals[1].name).toBe('Max');
    expect((animals[1] as Dog).breed).toBe('Poodle');

    expect(animals[2]).toBeInstanceOf(Cat);
    expect(animals[2].name).toBe('Whiskers');
    expect((animals[2] as Cat).color).toBe('Orange');

    await orm.close();
  });
});

describe('TPT UPDATE and DELETE operations', () => {
  test('UPDATE on TPT entity updates only changed columns in correct tables', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class UpdateBase {
      @PrimaryKey()
      id!: number;

      @Property()
      baseProp!: string;
    }

    @Entity()
    class UpdateChild extends UpdateBase {
      @Property()
      childProp!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [UpdateBase, UpdateChild],
    });

    await orm.schema.create();
    const mock = mockLogger(orm);

    const entity = orm.em.create(UpdateChild, { baseProp: 'base-1', childProp: 'child-1' });
    await orm.em.flush();

    // Clear mock to only capture updates
    mock.mockReset();

    // Update only child property
    entity.childProp = 'child-2';
    await orm.em.flush();

    // Verify UPDATE was issued
    const updateLog = mock.mock.calls.find(c => c[0].includes('update'));
    expect(updateLog).toBeDefined();

    orm.em.clear();

    // Reload and verify
    const loaded = await orm.em.findOneOrFail(UpdateChild, entity.id);
    expect(loaded.baseProp).toBe('base-1');
    expect(loaded.childProp).toBe('child-2');

    await orm.close();
  });

  test('DELETE on TPT entity cascades to all tables', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class DeleteBase {
      @PrimaryKey()
      id!: number;

      @Property()
      baseProp!: string;
    }

    @Entity()
    class DeleteChild extends DeleteBase {
      @Property()
      childProp!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [DeleteBase, DeleteChild],
    });

    await orm.schema.create();

    const entity = orm.em.create(DeleteChild, { baseProp: 'base', childProp: 'child' });
    await orm.em.flush();
    const id = entity.id;

    orm.em.remove(entity);
    await orm.em.flush();
    orm.em.clear();

    // Verify entity is deleted
    const found = await orm.em.findOne(DeleteChild, id);
    expect(found).toBeNull();

    await orm.close();
  });
});

describe('TPT loading strategies', () => {
  test('LoadStrategy.JOINED loads TPT entities in single query', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Animal {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class Dog extends Animal {
      @Property()
      breed!: string;
    }

    @Entity()
    class Cat extends Animal {
      @Property()
      color!: string;
    }

    @Entity()
    class Person {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToOne(() => Animal, { ref: true, nullable: true })
      pet?: Ref<Animal>;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Animal, Dog, Cat, Person],
    });

    await orm.schema.create();

    const dog = orm.em.create(Dog, { name: 'Buddy', breed: 'Labrador' });
    const cat = orm.em.create(Cat, { name: 'Whiskers', color: 'Orange' });
    orm.em.create(Person, { name: 'Alice', pet: dog });
    orm.em.create(Person, { name: 'Bob', pet: cat });
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm);

    const { LoadStrategy } = await import('@mikro-orm/core');
    const people = await orm.em.find(
      Person,
      {},
      {
        populate: ['pet'],
        strategy: LoadStrategy.JOINED,
        orderBy: { name: 'ASC' },
      },
    );

    expect(people).toHaveLength(2);

    expect(people[0].name).toBe('Alice');
    expect(people[0].pet?.unwrap()).toBeInstanceOf(Dog);
    expect((people[0].pet?.unwrap() as Dog).breed).toBe('Labrador');

    expect(people[1].name).toBe('Bob');
    expect(people[1].pet?.unwrap()).toBeInstanceOf(Cat);
    expect((people[1].pet?.unwrap() as Cat).color).toBe('Orange');

    // Should use a single SELECT with JOINs
    expect(mock.mock.calls.filter(c => c[0].includes('select'))).toHaveLength(1);

    await orm.close();
  });

  test('LoadStrategy.SELECT_IN loads TPT polymorphic relations', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Animal {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class Dog extends Animal {
      @Property()
      breed!: string;
    }

    @Entity()
    class Cat extends Animal {
      @Property()
      color!: string;
    }

    @Entity()
    class Person {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToOne(() => Animal, { ref: true, nullable: true })
      pet?: Ref<Animal>;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Animal, Dog, Cat, Person],
    });

    await orm.schema.create();

    const dog = orm.em.create(Dog, { name: 'Max', breed: 'Poodle' });
    const cat = orm.em.create(Cat, { name: 'Luna', color: 'Black' });
    orm.em.create(Person, { name: 'Charlie', pet: dog });
    orm.em.create(Person, { name: 'Diana', pet: cat });
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm);

    const { LoadStrategy } = await import('@mikro-orm/core');
    const people = await orm.em.find(
      Person,
      {},
      {
        populate: ['pet'],
        strategy: LoadStrategy.SELECT_IN,
        orderBy: { name: 'ASC' },
      },
    );

    expect(people).toHaveLength(2);
    expect(people[0].pet?.unwrap()).toBeInstanceOf(Dog);
    expect((people[0].pet?.unwrap() as Dog).breed).toBe('Poodle');
    expect(people[1].pet?.unwrap()).toBeInstanceOf(Cat);
    expect((people[1].pet?.unwrap() as Cat).color).toBe('Black');

    // SELECT_IN uses multiple queries
    expect(mock.mock.calls.filter(c => c[0].includes('select')).length).toBeGreaterThan(1);

    await orm.close();
  });
});

describe('TPT nested relations', () => {
  test('deep nesting with TPT at multiple levels', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Content {
      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;
    }

    @Entity()
    class Article extends Content {
      @Property()
      body!: string;
    }

    @Entity()
    class Video extends Content {
      @Property()
      duration!: number;
    }

    @Entity()
    class Category {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @OneToMany(() => ContentItem, ci => ci.category)
      items = new Collection<ContentItem>(this);
    }

    @Entity()
    class ContentItem {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Category, { ref: true })
      category!: Ref<Category>;

      @ManyToOne(() => Content, { ref: true })
      content!: Ref<Content>;

      @Property({ default: 0 })
      sortOrder?: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Content, Article, Video, Category, ContentItem],
    });

    await orm.schema.create();

    const cat1 = orm.em.create(Category, { name: 'Tech' });
    const cat2 = orm.em.create(Category, { name: 'Entertainment' });

    const article1 = orm.em.create(Article, { title: 'TypeScript Tips', body: 'Here are some tips...' });
    const article2 = orm.em.create(Article, { title: 'Node.js Best Practices', body: 'Best practices...' });
    const video1 = orm.em.create(Video, { title: 'React Tutorial', duration: 3600 });
    const video2 = orm.em.create(Video, { title: 'Movie Trailer', duration: 120 });

    orm.em.create(ContentItem, { category: cat1, content: article1, sortOrder: 1 });
    orm.em.create(ContentItem, { category: cat1, content: article2, sortOrder: 2 });
    orm.em.create(ContentItem, { category: cat1, content: video1, sortOrder: 3 });
    orm.em.create(ContentItem, { category: cat2, content: video2, sortOrder: 1 });

    await orm.em.flush();
    orm.em.clear();

    const categories = await orm.em.find(
      Category,
      {},
      {
        populate: ['items.content'],
        orderBy: { name: 'ASC' },
      },
    );

    expect(categories).toHaveLength(2);

    // Entertainment has 1 video
    expect(categories[0].name).toBe('Entertainment');
    expect(categories[0].items).toHaveLength(1);
    expect(categories[0].items[0].content.unwrap()).toBeInstanceOf(Video);

    // Tech has 2 articles and 1 video
    expect(categories[1].name).toBe('Tech');
    expect(categories[1].items).toHaveLength(3);

    const techContent = categories[1].items.getItems().map(i => i.content.unwrap());
    expect(techContent.filter(c => c instanceof Article)).toHaveLength(2);
    expect(techContent.filter(c => c instanceof Video)).toHaveLength(1);

    // Verify article body is loaded
    const articles = techContent.filter(c => c instanceof Article) as Article[];
    expect(articles[0].body).toBeDefined();

    // Verify video duration is loaded
    const videos = techContent.filter(c => c instanceof Video) as Video[];
    expect(videos[0].duration).toBe(3600);

    await orm.close();
  });

  test('bidirectional relations with TPT', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class TeamMember {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToOne(() => Team, { ref: true })
      team!: Ref<Team>;
    }

    @Entity()
    class TeamManager extends TeamMember {
      @Property()
      budget!: number;
    }

    @Entity()
    class TeamDeveloper extends TeamMember {
      @Property()
      programmingLanguage!: string;
    }

    @Entity()
    class Team {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @OneToMany(() => TeamMember, e => e.team)
      members = new Collection<TeamMember>(this);
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [TeamMember, TeamManager, TeamDeveloper, Team],
    });

    await orm.schema.create();

    const engineering = orm.em.create(Team, { name: 'Engineering' });
    const hr = orm.em.create(Team, { name: 'HR' });

    orm.em.create(TeamManager, { name: 'John', team: engineering, budget: 500000 });
    orm.em.create(TeamDeveloper, { name: 'Alice', team: engineering, programmingLanguage: 'TypeScript' });
    orm.em.create(TeamDeveloper, { name: 'Bob', team: engineering, programmingLanguage: 'Python' });
    orm.em.create(TeamManager, { name: 'Carol', team: hr, budget: 200000 });

    await orm.em.flush();
    orm.em.clear();

    const teams = await orm.em.find(
      Team,
      {},
      {
        populate: ['members'],
        orderBy: { name: 'ASC' },
      },
    );

    expect(teams).toHaveLength(2);

    // Engineering has 1 manager and 2 developers
    expect(teams[0].name).toBe('Engineering');
    expect(teams[0].members).toHaveLength(3);

    const engMembers = teams[0].members.getItems();
    expect(engMembers.filter(e => e instanceof TeamManager)).toHaveLength(1);
    expect(engMembers.filter(e => e instanceof TeamDeveloper)).toHaveLength(2);

    const engManager = engMembers.find(e => e instanceof TeamManager) as TeamManager;
    expect(engManager.budget).toBe(500000);

    const developers = engMembers.filter(e => e instanceof TeamDeveloper) as TeamDeveloper[];
    expect(developers.map(d => d.programmingLanguage).sort()).toEqual(['Python', 'TypeScript']);

    // HR has 1 manager
    expect(teams[1].name).toBe('HR');
    expect(teams[1].members).toHaveLength(1);
    expect(teams[1].members[0]).toBeInstanceOf(TeamManager);

    await orm.close();
  });
});

describe('TPT with different primary key types', () => {
  test('TPT with UUID primary key', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class UuidBase {
      @PrimaryKey({ type: 'uuid' })
      id: string = crypto.randomUUID();

      @Property({ default: 'now()' })
      createdAt?: Date = new Date();
    }

    @Entity()
    class UuidUser extends UuidBase {
      @Property()
      username!: string;
    }

    @Entity()
    class UuidAdmin extends UuidUser {
      @Property()
      adminLevel!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [UuidBase, UuidUser, UuidAdmin],
    });

    await orm.schema.create();

    const user = orm.em.create(UuidUser, { username: 'john' });
    const admin = orm.em.create(UuidAdmin, { username: 'admin', adminLevel: 10 });
    await orm.em.flush();

    const userId = user.id;
    const adminId = admin.id;

    orm.em.clear();

    // Query base class
    const entities = await orm.em.find(UuidBase, {}, { orderBy: { createdAt: 'ASC' } });
    expect(entities).toHaveLength(2);

    // Query specific user
    const loadedUser = await orm.em.findOneOrFail(UuidUser, userId);
    expect(loadedUser.username).toBe('john');

    // Query admin
    const loadedAdmin = await orm.em.findOneOrFail(UuidAdmin, adminId);
    expect(loadedAdmin.username).toBe('admin');
    expect(loadedAdmin.adminLevel).toBe(10);

    await orm.close();
  });
});

describe('TPT edge cases', () => {
  test('empty collection with TPT entities', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Item {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class PhysicalItem extends Item {
      @Property()
      weight!: number;
    }

    @Entity()
    class Container {
      @PrimaryKey()
      id!: number;

      @Property()
      label!: string;

      @OneToMany(() => ContainerItem, ci => ci.container)
      items = new Collection<ContainerItem>(this);
    }

    @Entity()
    class ContainerItem {
      @PrimaryKey()
      id!: number;

      @ManyToOne(() => Container, { ref: true })
      container!: Ref<Container>;

      @ManyToOne(() => Item, { ref: true })
      item!: Ref<Item>;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Item, PhysicalItem, Container, ContainerItem],
    });

    await orm.schema.create();

    // Create container without items
    orm.em.create(Container, { label: 'Empty Box' });
    await orm.em.flush();
    orm.em.clear();

    const containers = await orm.em.find(Container, {}, { populate: ['items.item'] });

    expect(containers).toHaveLength(1);
    expect(containers[0].items).toHaveLength(0);

    await orm.close();
  });

  test('null reference to TPT entity', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Vehicle {
      @PrimaryKey()
      id!: number;

      @Property()
      brand!: string;
    }

    @Entity()
    class Car extends Vehicle {
      @Property()
      model!: string;
    }

    @Entity()
    class Driver {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToOne(() => Vehicle, { ref: true, nullable: true })
      vehicle?: Ref<Vehicle>;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Vehicle, Car, Driver],
    });

    await orm.schema.create();

    orm.em.create(Driver, { name: 'No Car Driver' });
    const car = orm.em.create(Car, { brand: 'Toyota', model: 'Camry' });
    orm.em.create(Driver, { name: 'Car Owner', vehicle: car });
    await orm.em.flush();
    orm.em.clear();

    const drivers = await orm.em.find(
      Driver,
      {},
      {
        populate: ['vehicle'],
        orderBy: { name: 'ASC' },
      },
    );

    expect(drivers).toHaveLength(2);
    expect(drivers[0].name).toBe('Car Owner');
    expect(drivers[0].vehicle?.unwrap()).toBeInstanceOf(Car);

    expect(drivers[1].name).toBe('No Car Driver');
    expect(drivers[1].vehicle).toBeNull();

    await orm.close();
  });

  test('querying with orderBy on child property', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Shape {
      @PrimaryKey()
      id!: number;

      @Property()
      color!: string;
    }

    @Entity()
    class Rectangle extends Shape {
      @Property()
      width!: number;

      @Property()
      height!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Shape, Rectangle],
    });

    await orm.schema.create();

    orm.em.create(Rectangle, { color: 'red', width: 10, height: 5 });
    orm.em.create(Rectangle, { color: 'blue', width: 20, height: 10 });
    orm.em.create(Rectangle, { color: 'green', width: 5, height: 15 });
    await orm.em.flush();
    orm.em.clear();

    // Order by child property
    const rectangles = await orm.em.find(Rectangle, {}, { orderBy: { width: 'ASC' } });

    expect(rectangles).toHaveLength(3);
    expect(rectangles[0].width).toBe(5);
    expect(rectangles[1].width).toBe(10);
    expect(rectangles[2].width).toBe(20);

    await orm.close();
  });

  test('querying with WHERE on both parent and child properties', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Appliance {
      @PrimaryKey()
      id!: number;

      @Property()
      brand!: string;

      @Property()
      powerWatts!: number;
    }

    @Entity()
    class WashingMachine extends Appliance {
      @Property()
      capacityKg!: number;

      @Property()
      spinSpeed!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Appliance, WashingMachine],
    });

    await orm.schema.create();

    orm.em.create(WashingMachine, { brand: 'Samsung', powerWatts: 2000, capacityKg: 8, spinSpeed: 1400 });
    orm.em.create(WashingMachine, { brand: 'LG', powerWatts: 1800, capacityKg: 10, spinSpeed: 1200 });
    orm.em.create(WashingMachine, { brand: 'Samsung', powerWatts: 1500, capacityKg: 6, spinSpeed: 1000 });
    await orm.em.flush();
    orm.em.clear();

    // Query with conditions on both parent (brand) and child (capacityKg) properties
    const machines = await orm.em.find(WashingMachine, {
      brand: 'Samsung',
      capacityKg: { $gte: 7 },
    });

    expect(machines).toHaveLength(1);
    expect(machines[0].capacityKg).toBe(8);
    expect(machines[0].spinSpeed).toBe(1400);

    await orm.close();
  });
});

describe('TPT additional coverage', () => {
  test('TPT entity with nullable FK to non-TPT entity', async () => {
    // Tests the findExtraUpdates non-entity check for TPT

    @Entity()
    class Department {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity({ inheritance: 'tpt' })
    abstract class Worker {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @ManyToOne(() => Department, { ref: true, nullable: true })
      department?: Ref<Department>;
    }

    @Entity()
    class Engineer extends Worker {
      @Property()
      specialty!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Department, Worker, Engineer],
    });

    await orm.schema.create();

    // Create department and engineer in same flush
    const dept = orm.em.create(Department, { name: 'R&D' });
    const engineer = orm.em.create(Engineer, { name: 'Alice', specialty: 'Backend', department: dept });

    await orm.em.flush();
    orm.em.clear();

    // Verify the relation
    const loaded = await orm.em.findOneOrFail(Engineer, engineer.id, { populate: ['department'] });
    expect(loaded.name).toBe('Alice');
    expect(loaded.specialty).toBe('Backend');
    expect(loaded.department?.unwrap().name).toBe('R&D');

    await orm.close();
  });

  test('TPT update that only changes child table properties', async () => {
    // Tests that UPDATE skips parent table when only child properties changed

    @Entity({ inheritance: 'tpt' })
    abstract class Shape {
      @PrimaryKey()
      id!: number;

      @Property()
      color!: string;
    }

    @Entity()
    class Rectangle extends Shape {
      @Property()
      width!: number;

      @Property()
      height!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Shape, Rectangle],
    });

    await orm.schema.create();

    const rect = orm.em.create(Rectangle, { color: 'red', width: 10, height: 20 });
    await orm.em.flush();
    const rectId = rect.id;
    orm.em.clear();

    // Load entity fresh before updating
    const loaded = await orm.em.findOneOrFail(Rectangle, rectId);
    const mock = mockLogger(orm, ['query']);

    // Update only child property
    loaded.width = 15;
    await orm.em.flush();

    // Should only update rectangle table, not shape table
    const logs = mock.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('update `rectangle`'))).toBe(true);
    expect(logs.some((l: string) => l.includes('update `shape`'))).toBe(false);

    orm.em.clear();

    // Verify the update
    const verified = await orm.em.findOneOrFail(Rectangle, rectId);
    expect(verified.width).toBe(15);
    expect(verified.color).toBe('red');

    await orm.close();
  });

  test('TPT update that changes both parent and child properties', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Product {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @Property()
      price!: number;
    }

    @Entity()
    class Book extends Product {
      @Property()
      isbn!: string;

      @Property()
      pages!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Product, Book],
    });

    await orm.schema.create();

    const book = orm.em.create(Book, { name: 'Clean Code', price: 39.99, isbn: '978-0132350884', pages: 464 });
    await orm.em.flush();
    const bookId = book.id;
    orm.em.clear();

    // Load entity fresh before updating
    const loaded = await orm.em.findOneOrFail(Book, bookId);
    const mock = mockLogger(orm, ['query']);

    // Update both parent and child properties
    loaded.price = 29.99; // parent property
    loaded.pages = 500; // child property
    await orm.em.flush();

    // Should update both tables
    const logs = mock.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('update `product`'))).toBe(true);
    expect(logs.some((l: string) => l.includes('update `book`'))).toBe(true);

    orm.em.clear();

    const verified = await orm.em.findOneOrFail(Book, bookId);
    expect(verified.price).toBe(29.99);
    expect(verified.pages).toBe(500);

    await orm.close();
  });

  test('TPT delete cascades properly', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Document {
      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;
    }

    @Entity()
    class Report extends Document {
      @Property()
      author!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Document, Report],
    });

    await orm.schema.create();

    const report = orm.em.create(Report, { title: 'Q1 Report', author: 'John' });
    await orm.em.flush();

    const reportId = report.id;

    // Delete the entity
    orm.em.remove(report);
    await orm.em.flush();
    orm.em.clear();

    // Verify deletion
    const loaded = await orm.em.findOne(Report, reportId);
    expect(loaded).toBeNull();

    // Verify parent table row is also deleted (via CASCADE)
    const parentRow = await orm.em.findOne(Document, reportId);
    expect(parentRow).toBeNull();

    await orm.close();
  });

  test('non-abstract TPT root entity', async () => {
    // Tests that non-abstract TPT roots get discriminator value

    @Entity({ inheritance: 'tpt' })
    class Creature {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class Canine extends Creature {
      @Property()
      breed!: string;
    }

    @Entity()
    class Feline extends Creature {
      @Property()
      indoor!: boolean;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Creature, Canine, Feline],
    });

    await orm.schema.create();

    // Create instances of all types including base class
    const creature = orm.em.create(Creature, { name: 'Generic' });
    const canine = orm.em.create(Canine, { name: 'Buddy', breed: 'Labrador' });
    const feline = orm.em.create(Feline, { name: 'Whiskers', indoor: true });
    await orm.em.flush();
    orm.em.clear();

    // Polymorphic query should return all types
    const creatures = await orm.em.find(Creature, {}, { orderBy: { name: 'ASC' } });
    expect(creatures).toHaveLength(3);

    // Check types
    expect(creatures[0].name).toBe('Buddy');
    expect(creatures[0]).toBeInstanceOf(Canine);
    expect((creatures[0] as Canine).breed).toBe('Labrador');

    expect(creatures[1].name).toBe('Generic');
    expect(creatures[1]).toBeInstanceOf(Creature);
    expect(creatures[1]).not.toBeInstanceOf(Canine);
    expect(creatures[1]).not.toBeInstanceOf(Feline);

    expect(creatures[2].name).toBe('Whiskers');
    expect(creatures[2]).toBeInstanceOf(Feline);
    expect((creatures[2] as Feline).indoor).toBe(true);

    await orm.close();
  });

  test('TPT polymorphic query with Date fields in child', async () => {
    // Tests mapTPTChildFields with Date type handling

    @Entity({ inheritance: 'tpt' })
    abstract class Event {
      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;
    }

    @Entity()
    class Meeting extends Event {
      @Property()
      startTime!: Date;

      @Property()
      location!: string;
    }

    @Entity()
    class Reminder extends Event {
      @Property()
      remindAt!: Date;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Event, Meeting, Reminder],
    });

    await orm.schema.create();

    const meetingDate = new Date('2024-01-15T10:00:00Z');
    const reminderDate = new Date('2024-01-20T09:00:00Z');

    orm.em.create(Meeting, { title: 'Team Sync', startTime: meetingDate, location: 'Room A' });
    orm.em.create(Reminder, { title: 'Pay Bills', remindAt: reminderDate });
    await orm.em.flush();
    orm.em.clear();

    // Polymorphic query should load Date fields correctly
    const events = await orm.em.find(Event, {}, { orderBy: { title: 'ASC' } });
    expect(events).toHaveLength(2);

    const payBills = events[0] as Reminder;
    expect(payBills.title).toBe('Pay Bills');
    expect(payBills.remindAt).toBeInstanceOf(Date);

    const teamSync = events[1] as Meeting;
    expect(teamSync.title).toBe('Team Sync');
    expect(teamSync.startTime).toBeInstanceOf(Date);
    expect(teamSync.location).toBe('Room A');

    await orm.close();
  });
});

describe('TPT with advanced properties', () => {
  test('TPT with formula referencing inherited property', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class FormulaDocument {
      @PrimaryKey()
      id!: number;

      @Property({ type: 'string' })
      firstName!: string;

      @Property({ type: 'string' })
      lastName!: string;
    }

    @Entity()
    class FormulaEmployee extends FormulaDocument {
      @Property({ type: 'string' })
      department!: string;

      // Formula that references inherited properties (firstName, lastName)
      // Use the quote helper for proper identifier quoting
      @Property({
        type: 'string',
        persist: false,
        formula: cols => quote`${cols.firstName} || ' ' || ${cols.lastName}`,
      })
      fullName!: Opt<string>;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [FormulaDocument, FormulaEmployee],
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const employee = em.create(FormulaEmployee, {
      firstName: 'John',
      lastName: 'Doe',
      department: 'Engineering',
    });
    await em.flush();
    em.clear();

    // Load the entity - formula should resolve correctly
    const mock = mockLogger(orm);
    const loaded = await em.findOneOrFail(FormulaEmployee, employee.id);
    expect(loaded.firstName).toBe('John');
    expect(loaded.lastName).toBe('Doe');
    expect(loaded.department).toBe('Engineering');
    expect(loaded.fullName).toBe('John Doe');

    // Verify the SQL uses the correct alias for the parent table
    const query = mock.mock.calls[0][0];
    // The formula should reference the parent table alias (f1), not the main table alias (f0)
    // With quote helper, both alias and column are fully quoted (e.g., `f1`.`first_name` for SQLite)
    expect(query).toMatch(/`f1`\.`first_name`/);
    // Verify the formula is correct in the query (with quoted aliases and columns)
    expect(query).toContain("`f1`.`first_name` || ' ' || `f1`.`last_name`");

    await orm.close();
  });

  test('TPT with lazy property', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class LazyDocument {
      @PrimaryKey()
      id!: number;

      @Property({ type: 'string' })
      title!: string;
    }

    @Entity()
    class LazyArticle extends LazyDocument {
      @Property({ type: 'string', lazy: true })
      content!: string;

      @Property({ type: 'string' })
      summary!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [LazyDocument, LazyArticle],
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const article = em.create(LazyArticle, {
      title: 'Test Article',
      content: 'This is the full content of the article...',
      summary: 'A brief summary',
    });
    await em.flush();
    em.clear();

    // Load without lazy property
    const mock = mockLogger(orm);
    const loaded = await em.findOneOrFail(LazyArticle, article.id);
    expect(loaded.title).toBe('Test Article');
    expect(loaded.summary).toBe('A brief summary');
    // Lazy property not loaded initially
    expect(wrap(loaded).isInitialized()).toBe(true);

    // Verify content wasn't in the query
    expect(mock.mock.calls[0][0]).not.toContain('content');

    // Now explicitly load the lazy property
    em.clear();
    const loadedWithContent = await em.findOneOrFail(LazyArticle, article.id, { populate: ['content'] });
    expect(loadedWithContent.content).toBe('This is the full content of the article...');

    await orm.close();
  });

  test('TPT with embedded property in child', async () => {
    @Embeddable()
    class Address {
      @Property({ type: 'string' })
      street!: string;

      @Property({ type: 'string' })
      city!: string;

      @Property({ type: 'string' })
      zipCode!: string;
    }

    @Entity({ inheritance: 'tpt' })
    abstract class Person {
      @PrimaryKey()
      id!: number;

      @Property({ type: 'string' })
      name!: string;
    }

    @Entity()
    class Customer extends Person {
      @Embedded(() => Address)
      address!: Address;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Person, Customer, Address],
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const customer = em.create(Customer, {
      name: 'John Doe',
      address: { street: '123 Main St', city: 'Springfield', zipCode: '12345' },
    });
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(Customer, customer.id);
    expect(loaded.name).toBe('John Doe');
    expect(loaded.address.street).toBe('123 Main St');
    expect(loaded.address.city).toBe('Springfield');
    expect(loaded.address.zipCode).toBe('12345');

    await orm.close();
  });

  test('TPT with custom type', async () => {
    class PointType extends Type<{ x: number; y: number }, string> {
      convertToDatabaseValue(value: { x: number; y: number }): string {
        return `${value.x},${value.y}`;
      }

      convertToJSValue(value: string): { x: number; y: number } {
        const [x, y] = value.split(',').map(Number);
        return { x, y };
      }

      getColumnType(): string {
        return 'text';
      }
    }

    @Entity({ inheritance: 'tpt' })
    abstract class CustomTypeShape {
      @PrimaryKey()
      id!: number;

      @Property({ type: 'string' })
      name!: string;
    }

    @Entity()
    class CustomTypeCircle extends CustomTypeShape {
      @Property({ type: PointType })
      center!: { x: number; y: number };

      @Property({ type: 'number' })
      radius!: number;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [CustomTypeShape, CustomTypeCircle],
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const circle = em.create(CustomTypeCircle, {
      name: 'My Circle',
      center: { x: 10, y: 20 },
      radius: 5,
    });
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(CustomTypeCircle, circle.id);
    expect(loaded.name).toBe('My Circle');
    expect(loaded.center).toEqual({ x: 10, y: 20 });
    expect(loaded.radius).toBe(5);

    await orm.close();
  });

  test('TPT with default values in child', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class Notification {
      @PrimaryKey()
      id!: number;

      @Property({ type: 'string' })
      message!: string;

      @Property({ type: 'boolean', default: false })
      read: boolean & Opt = false;
    }

    @Entity()
    class EmailNotification extends Notification {
      @Property({ type: 'string' })
      emailAddress!: string;

      @Property({ type: 'string', default: 'low' })
      priority: string & Opt = 'low';
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Notification, EmailNotification],
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const notification = em.create(EmailNotification, {
      message: 'Hello',
      emailAddress: 'test@example.com',
    });
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(EmailNotification, notification.id);
    expect(loaded.message).toBe('Hello');
    expect(loaded.read).toBe(false);
    expect(loaded.emailAddress).toBe('test@example.com');
    expect(loaded.priority).toBe('low');

    // Test with custom values
    em.clear();
    const notification2 = em.create(EmailNotification, {
      message: 'Urgent',
      emailAddress: 'urgent@example.com',
      read: true,
      priority: 'high',
    });
    await em.flush();
    em.clear();

    const loaded2 = await em.findOneOrFail(EmailNotification, notification2.id);
    expect(loaded2.read).toBe(true);
    expect(loaded2.priority).toBe('high');

    await orm.close();
  });

  test('TPT with onCreate and onUpdate hooks', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class AuditedEntity {
      @PrimaryKey()
      id!: number;

      @Property({ type: 'Date', onCreate: () => new Date() })
      createdAt!: Date & Opt;

      @Property({ type: 'Date', onCreate: () => new Date(), onUpdate: () => new Date() })
      updatedAt!: Date & Opt;
    }

    @Entity()
    class AuditedPost extends AuditedEntity {
      @Property({ type: 'string' })
      title!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [AuditedEntity, AuditedPost],
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const post = em.create(AuditedPost, { title: 'Test Post' });
    await em.flush();

    expect(post.createdAt).toBeInstanceOf(Date);
    expect(post.updatedAt).toBeInstanceOf(Date);
    const originalUpdatedAt = post.updatedAt;

    // Wait a bit and update
    await new Promise(resolve => setTimeout(resolve, 10));
    post.title = 'Updated Post';
    await em.flush();

    expect(post.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

    em.clear();
    const loaded = await em.findOneOrFail(AuditedPost, post.id);
    expect(loaded.title).toBe('Updated Post');
    expect(loaded.createdAt).toBeInstanceOf(Date);
    expect(loaded.updatedAt).toBeInstanceOf(Date);

    await orm.close();
  });
});

describe('TPT with composite primary key', () => {
  test('TPT with composite PK inserts and queries correctly', async () => {
    @Entity({ inheritance: 'tpt' })
    abstract class CompositeBase {
      @PrimaryKey()
      tenantId!: number;

      @PrimaryKey()
      localId!: number;

      @Property()
      name!: string;
    }

    @Entity()
    class CompositeChild extends CompositeBase {
      @Property()
      childData!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [CompositeBase, CompositeChild],
    });

    await orm.schema.create();

    // Verify schema has FK on composite PK
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatch(/composite_child.*references.*composite_base/is);

    const entity = orm.em.create(CompositeChild, { tenantId: 1, localId: 100, name: 'Test', childData: 'data' });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(CompositeChild, { tenantId: 1, localId: 100 });
    expect(loaded.name).toBe('Test');
    expect(loaded.childData).toBe('data');

    // Update
    loaded.childData = 'updated';
    await orm.em.flush();
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(CompositeChild, { tenantId: 1, localId: 100 });
    expect(reloaded.childData).toBe('updated');

    await orm.close();
  });
});

describe('TPT with filters', () => {
  test('filter on inherited property works with TPT', async () => {
    @Entity({
      inheritance: 'tpt',
    })
    abstract class FilterBase {
      @PrimaryKey()
      id!: number;

      @Property()
      name!: string;

      @Property({ default: true })
      active: boolean & Opt = true;
    }

    @Entity()
    class FilterChild extends FilterBase {
      @Property()
      childProp!: string;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [FilterBase, FilterChild],
    });

    await orm.schema.create();

    orm.em.create(FilterChild, { name: 'Active', childProp: 'a', active: true });
    orm.em.create(FilterChild, { name: 'Inactive', childProp: 'b', active: false });
    await orm.em.flush();
    orm.em.clear();

    // Query with WHERE on inherited property (simulates what a filter would produce)
    const active = await orm.em.find(FilterChild, { active: true });
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Active');

    // Without filter, should return all
    const all = await orm.em.find(FilterChild, {});
    expect(all).toHaveLength(2);

    await orm.close();
  });
});

describe('TPT concurrent flush', () => {
  test('two TPT entities referencing each other in same flush', async () => {
    @Entity()
    class Tag {
      @PrimaryKey()
      id!: number;

      @Property()
      label!: string;
    }

    @Entity({ inheritance: 'tpt' })
    abstract class Node {
      @PrimaryKey()
      id!: number;

      @Property()
      title!: string;
    }

    @Entity()
    class LeafNode extends Node {
      @Property()
      content!: string;

      @ManyToOne(() => Tag, { ref: true, nullable: true })
      tag?: Ref<Tag>;
    }

    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Tag, Node, LeafNode],
    });

    await orm.schema.create();

    // Create both tag and leaf in same flush
    const tag = orm.em.create(Tag, { label: 'Important' });
    const leaf = orm.em.create(LeafNode, { title: 'Note', content: 'text', tag });
    await orm.em.flush();

    expect(tag.id).toBeDefined();
    expect(leaf.id).toBeDefined();

    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(LeafNode, leaf.id, { populate: ['tag'] });
    expect(loaded.title).toBe('Note');
    expect(loaded.content).toBe('text');
    expect(loaded.tag?.unwrap().label).toBe('Important');

    await orm.close();
  });
});

test('createColumnMappingObject warns when accessing old FormulaTable properties', async () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => void 0);

  const testOrm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Integration, FooIntegration, BarIntegration],
    metadataProvider: ReflectMetadataProvider,
  });

  const meta = testOrm.getMetadata().get(FooIntegration);
  const columns = meta.createColumnMappingObject('e0');

  // Accessing normal property should NOT warn
  expect(columns.fooData).toBe('e0.foo_data');
  expect(warnSpy).not.toHaveBeenCalled();

  // Accessing `.alias` (FormulaTable-only property) should warn
  expect((columns as any).alias).toBeUndefined();
  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(warnSpy.mock.calls[0][0]).toMatch(/old formula callback signature/);

  // Accessing `.qualifiedName` should also warn
  warnSpy.mockClear();
  expect((columns as any).qualifiedName).toBeUndefined();
  expect(warnSpy).toHaveBeenCalledTimes(1);

  warnSpy.mockRestore();
  await testOrm.close();
});

describe('TPT MongoDB validation', () => {
  test('MongoPlatform rejects TPT inheritance', async () => {
    const { MongoPlatform } = await import('@mikro-orm/mongodb');
    const platform = new MongoPlatform();
    const meta = { className: 'TestEntity', inheritanceType: 'tpt' } as any;

    expect(() => platform.validateMetadata(meta)).toThrow(/TPT.*not supported by the current driver/);
  });
});

describe('TPT delete operations', () => {
  test('em.remove() on 3-level entity only issues DELETE for leaf table', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Integration, FooIntegration, BarIntegration, BazIntegration],
    });
    await orm.schema.create();

    const baz = orm.em.create(BazIntegration, {
      name: 'Baz',
      barData: 'bar',
      bazData: 'baz',
    });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(BazIntegration, baz.id);
    const mock = mockLogger(orm);
    orm.em.remove(loaded);
    await orm.em.flush();

    // Only one DELETE statement should be issued - the DB cascade handles the rest
    const deletes = mock.mock.calls.map(c => c[0]).filter((l: string) => l.includes('delete from'));
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toContain('`integration`');

    await orm.close();
  });

  test('cascade delete through 3+ levels when deleting root', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Integration, FooIntegration, BarIntegration, BazIntegration],
    });
    await orm.schema.create();

    // Create a foo and a baz (3-level)
    const foo = orm.em.create(FooIntegration, { name: 'Foo', fooData: 'fd' });
    const baz = orm.em.create(BazIntegration, { name: 'Baz', barData: 'bd', bazData: 'bzd' });
    await orm.em.flush();
    orm.em.clear();

    // Delete foo directly - should cascade from integration table
    const loadedFoo = await orm.em.findOneOrFail(FooIntegration, foo.id);
    orm.em.remove(loadedFoo);
    await orm.em.flush();

    // Verify foo is fully deleted (both tables)
    expect(await orm.em.count(Integration, { id: foo.id })).toBe(0);

    orm.em.clear();

    // Baz should still exist
    const loadedBaz = await orm.em.findOneOrFail(BazIntegration, baz.id);
    expect(loadedBaz.bazData).toBe('bzd');

    // Now delete baz - should cascade through bar_integration and integration
    orm.em.remove(loadedBaz);
    await orm.em.flush();

    expect(await orm.em.count(Integration, { id: baz.id })).toBe(0);

    await orm.close();
  });
});

describe('TPT QueryBuilder update/delete', () => {
  test('qb.update() on child entity targets correct table', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Integration, FooIntegration, BarIntegration, BazIntegration],
    });
    await orm.schema.create();

    const foo = orm.em.create(FooIntegration, { name: 'Foo', fooData: 'original' });
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm);
    await orm.em.createQueryBuilder(FooIntegration).update({ fooData: 'updated' }).where({ id: foo.id }).execute();

    const logs = mock.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('update `foo_integration`'))).toBe(true);

    orm.em.clear();
    const loaded = await orm.em.findOneOrFail(FooIntegration, foo.id);
    expect(loaded.fooData).toBe('updated');

    await orm.close();
  });

  test('qb.delete() on child entity targets correct table', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Integration, FooIntegration, BarIntegration, BazIntegration],
    });
    await orm.schema.create();

    const foo = orm.em.create(FooIntegration, { name: 'Foo', fooData: 'data' });
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm);
    await orm.em.createQueryBuilder(FooIntegration).delete().where({ id: foo.id }).execute();

    const logs = mock.mock.calls.map(c => c[0]);
    expect(logs.some((l: string) => l.includes('delete from `foo_integration`'))).toBe(true);

    await orm.close();
  });
});
