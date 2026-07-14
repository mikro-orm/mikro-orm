import { defineEntity, EntitySchema, MetadataError, MikroORM, p, type Options } from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM, SqlitePlatform, StringType } from '@mikro-orm/sqlite';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

const pgOptions = { dbName: 'mikro_orm_test_rls', connect: false } as Options;

@Entity({
  tableName: 'rls_article',
  rowLevelSecurity: 'force',
  policies: [
    {
      name: 'rls_article_tenant',
      command: 'select',
      type: 'restrictive',
      roles: ['app_user'],
      using: `tenant_id = current_setting('app.tenant')::int`,
    },
  ],
})
class Article {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  tenantId!: number;
}

const Document = defineEntity({
  name: 'RlsDocument',
  tableName: 'rls_document',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary(),
    ownerId: p.integer(),
  },
  policies: [
    {
      name: 'rls_document_owner',
      using: columns => `${columns.ownerId} = current_setting('app.user')::int`,
      check: columns => `${columns.ownerId} = current_setting('app.user')::int`,
    },
  ],
});

const Ledger = new EntitySchema({
  name: 'RlsLedger',
  tableName: 'rls_ledger',
  rowLevelSecurity: true,
  policies: [{ name: 'rls_ledger_all', using: 'true' }],
  properties: {
    id: { type: 'number', primary: true },
    amount: { type: 'number' },
  },
});

describe('row level security metadata', () => {
  test('decorators expose policies and rowLevelSecurity on metadata', async () => {
    const orm = await MikroORM.init({ ...pgOptions, entities: [Article] });
    const meta = orm.getMetadata().get(Article);

    expect(meta.rowLevelSecurity).toBe('force');
    expect(meta.policies).toEqual([
      {
        name: 'rls_article_tenant',
        command: 'select',
        type: 'restrictive',
        roles: ['app_user'],
        using: `tenant_id = current_setting('app.tenant')::int`,
      },
    ]);

    await orm.close(true);
  });

  test('defineEntity resolves policy callbacks to column names', async () => {
    const orm = await MikroORM.init({ ...pgOptions, entities: [Document] });
    const meta = orm.getMetadata().get(Document);

    expect(meta.rowLevelSecurity).toBe(true);
    expect(meta.policies).toHaveLength(1);
    expect(meta.policies[0].name).toBe('rls_document_owner');
    expect(meta.policies[0].using).toBe(`owner_id = current_setting('app.user')::int`);
    expect(meta.policies[0].check).toBe(`owner_id = current_setting('app.user')::int`);

    await orm.close(true);
  });

  test('EntitySchema exposes policies and rowLevelSecurity on metadata', async () => {
    const orm = await MikroORM.init({ ...pgOptions, entities: [Ledger] });
    const meta = orm.getMetadata().get(Ledger);

    expect(meta.rowLevelSecurity).toBe(true);
    expect(meta.policies).toEqual([{ name: 'rls_ledger_all', using: 'true' }]);

    await orm.close(true);
  });

  test('abstract base passes policies down to concrete entities', async () => {
    @Entity({ abstract: true, policies: [{ name: 'rls_base_audit', using: 'true' }] })
    abstract class BaseAudited {
      @PrimaryKey({ type: 'number' })
      id!: number;
    }

    @Entity({ tableName: 'rls_concrete' })
    class Concrete extends BaseAudited {
      @Property({ type: 'number' })
      value!: number;
    }

    const orm = await MikroORM.init({ ...pgOptions, entities: [Concrete] });
    const meta = orm.getMetadata().get(Concrete);

    expect(meta.policies).toEqual([{ name: 'rls_base_audit', using: 'true' }]);

    await orm.close(true);
  });

  test('abstract base passes the rowLevelSecurity flag down with its policies', async () => {
    @Entity({ abstract: true, rowLevelSecurity: 'force', policies: [{ name: 'rls_forced_all', using: 'true' }] })
    abstract class ForcedBase {
      @PrimaryKey({ type: 'number' })
      id!: number;
    }

    @Entity({ tableName: 'rls_forced_child' })
    class ForcedChild extends ForcedBase {}

    // deny-all base: the flag alone (no policies) must survive inheritance too
    @Entity({ abstract: true, rowLevelSecurity: true })
    abstract class DenyAllBase {
      @PrimaryKey({ type: 'number' })
      id!: number;
    }

    @Entity({ tableName: 'rls_deny_all_child' })
    class DenyAllChild extends DenyAllBase {}

    const orm = await MikroORM.init({ ...pgOptions, entities: [ForcedChild, DenyAllChild] });

    expect(orm.getMetadata().get(ForcedChild).rowLevelSecurity).toBe('force');
    expect(orm.getMetadata().get(ForcedChild).policies).toEqual([{ name: 'rls_forced_all', using: 'true' }]);
    expect(orm.getMetadata().get(DenyAllChild).rowLevelSecurity).toBe(true);

    await orm.close(true);
  });

  test('an abstract TPT root keeps policies on the root table without copying them to children', async () => {
    const Vehicle = defineEntity({
      name: 'RlsTptVehicle',
      tableName: 'rls_tpt_vehicle',
      abstract: true,
      inheritance: 'tpt',
      rowLevelSecurity: true,
      policies: [{ name: 'rls_tpt_tenant', using: `tenant_id = current_setting('app.tenant')::int` }],
      properties: {
        id: p.integer().primary(),
        tenantId: p.integer(),
      },
    });

    const Car = defineEntity({
      name: 'RlsTptCar',
      tableName: 'rls_tpt_car',
      extends: Vehicle,
      properties: {
        doors: p.integer(),
      },
    });

    const orm = await MikroORM.init({ ...pgOptions, entities: [Vehicle, Car] });

    // the root table owns the base columns the policy references, the child table does not
    expect(orm.getMetadata().get(Vehicle).policies).toHaveLength(1);
    expect(orm.getMetadata().get(Car).policies).toEqual([]);
    expect(orm.getMetadata().get(Car).rowLevelSecurity).toBeUndefined();

    await orm.close(true);
  });

  test('policy callbacks from a shared abstract base resolve per concrete entity', async () => {
    @Entity({
      abstract: true,
      policies: [
        {
          name: 'rls_shared_tenant',
          using: (columns: any, table: unknown) => `${columns.tenantId} = current_setting('app.${table}')::int`,
        },
      ],
    })
    abstract class TenantBase {
      @PrimaryKey({ type: 'number' })
      id!: number;

      @Property({ type: 'number' })
      tenantId!: number;
    }

    @Entity({ tableName: 'rls_child_one' })
    class ChildOne extends TenantBase {}

    @Entity({ tableName: 'rls_child_two' })
    class ChildTwo extends TenantBase {}

    const orm = await MikroORM.init({ ...pgOptions, entities: [ChildOne, ChildTwo] });

    // the base's policy def is shared by reference, so resolution must not bake one child's table into the other's
    expect(orm.getMetadata().get(ChildOne).policies[0].using).toBe(
      `tenant_id = current_setting('app.rls_child_one')::int`,
    );
    expect(orm.getMetadata().get(ChildTwo).policies[0].using).toBe(
      `tenant_id = current_setting('app.rls_child_two')::int`,
    );

    await orm.close(true);
  });

  test('throws when the driver does not support row level security', async () => {
    await expect(
      SqliteMikroORM.init({
        dbName: ':memory:',
        entities: [
          defineEntity({
            name: 'RlsUnsupported',
            properties: {
              id: p.integer().primary(),
              ownerId: p.integer(),
            },
            policies: [{ using: 'true' }],
          }),
        ],
      }),
    ).rejects.toThrow(MetadataError);

    // platforms without RLS support also provide no session variable cast mapping
    expect(new SqlitePlatform().getCurrentSettingCast(new StringType())).toBeNull();
  });

  test("throws when the 'connection' strategy is used on a driver without the reserve hook", async () => {
    const { MikroORM: PgliteMikroORM } = await import('@mikro-orm/pglite');

    await expect(
      PgliteMikroORM.init({ dbName: 'memory://', entities: [Ledger], sessionContext: 'connection' }),
    ).rejects.toThrow(/'connection' session context strategy/);
  });

  test('throws when policies are declared on a non-root STI entity', async () => {
    @Entity({
      tableName: 'rls_animal',
      discriminatorColumn: 'type',
      discriminatorValue: 'animal',
    })
    class Animal {
      @PrimaryKey({ type: 'number' })
      id!: number;
    }

    @Entity({
      discriminatorValue: 'dog',
      policies: [{ using: 'true' }],
    })
    class Dog extends Animal {
      @Property({ type: 'number', nullable: true })
      legs?: number;
    }

    await expect(MikroORM.init({ ...pgOptions, entities: [Animal, Dog] })).rejects.toThrow(/single table inheritance/);
  });

  test('throws when an rls filter is declared on a non-root STI entity, while inherited root filters pass', async () => {
    @Filter({ name: 'tenant', cond: { tenantId: 1 }, rls: true })
    @Entity({
      tableName: 'rls_pet',
      discriminatorColumn: 'type',
      discriminatorValue: 'pet',
    })
    class Pet {
      @PrimaryKey({ type: 'number' })
      id!: number;

      @Property({ type: 'number' })
      tenantId!: number;
    }

    @Entity({ discriminatorValue: 'cat' })
    class Cat extends Pet {}

    // inherited root filter on the child is fine — the policy lands on the shared root table
    const orm = await MikroORM.init({ ...pgOptions, entities: [Pet, Cat] });
    expect(orm.getMetadata().get(Cat).filters.tenant).toBe(orm.getMetadata().get(Pet).filters.tenant);
    await orm.close(true);

    @Entity({
      tableName: 'rls_pet2',
      discriminatorColumn: 'type',
      discriminatorValue: 'pet',
    })
    class Pet2 {
      @PrimaryKey({ type: 'number' })
      id!: number;

      @Property({ type: 'number' })
      tenantId!: number;
    }

    // non-root STI metas never reach the schema generator, so this policy would silently not exist
    @Filter({ name: 'tenant', cond: { tenantId: 1 }, rls: true })
    @Entity({ discriminatorValue: 'cat' })
    class Cat2 extends Pet2 {}

    await expect(MikroORM.init({ ...pgOptions, entities: [Pet2, Cat2] })).rejects.toThrow(
      /Filter 'tenant' on entity Cat2 .* single table inheritance/,
    );
  });

  test('allows policies on the (abstract) root of an STI hierarchy without duplicating onto children', async () => {
    @Entity({
      abstract: true,
      tableName: 'rls_vehicle',
      discriminatorColumn: 'type',
      policies: [{ name: 'rls_vehicle_all', using: 'true' }],
    })
    abstract class Vehicle {
      @PrimaryKey({ type: 'number' })
      id!: number;
    }

    @Entity({ discriminatorValue: 'car' })
    class Car extends Vehicle {
      @Property({ type: 'number', nullable: true })
      wheels?: number;
    }

    const orm = await MikroORM.init({ ...pgOptions, entities: [Vehicle, Car] });

    expect(orm.getMetadata().get(Vehicle).policies).toEqual([{ name: 'rls_vehicle_all', using: 'true' }]);
    expect(orm.getMetadata().get(Car).policies).toEqual([]);

    await orm.close(true);
  });
});
