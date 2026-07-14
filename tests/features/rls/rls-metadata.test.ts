import { defineEntity, EntitySchema, MetadataError, MikroORM, p, type Options } from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM, SqlitePlatform, StringType } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

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

  test('rejects invalid policy command at the type level', () => {
    defineEntity({
      name: 'RlsTypeCheck',
      properties: { id: p.integer().primary() },
      policies: [
        // @ts-expect-error 'truncate' is not a valid RLS command
        { command: 'truncate' },
      ],
    });
  });
});
