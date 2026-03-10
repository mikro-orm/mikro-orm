import { type IDatabaseDriver, MikroORM, SimpleLogger, Utils } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';
import { PLATFORMS } from '../../bootstrap.js';

@Embeddable()
class Address {
  @Property()
  street?: string;

  @Property({ type: 'double', nullable: true })
  number?: number;

  @Property()
  city?: string;

  @Property()
  country?: string;

  constructor(street?: string, number?: number, city?: string, country?: string) {
    this.street = street;
    this.number = number;
    this.city = city;
    this.country = country;
  }
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Address, { array: true, nullable: true })
  addresses: Address[] | null = [];
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_test_embed_arr', port: 3308 },
  mariadb: { dbName: 'mikro_orm_test_embed_arr', port: 3309 },
  mssql: {
    dbName: `mikro_orm_test_embed_arr_${(Math.random() + 1).toString(36).substring(7)}`,
    password: 'Root.Root',
  },
  oracledb: {
    dbName: 'mikro_orm_test_embed_arr',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  },
};

describe.each(Utils.keys(options))('embedded array query [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });

    if (type === 'mssql') {
      await orm.schema.create();
    } else {
      await orm.schema.refresh();
    }
  }, 120_000);

  afterAll(async () => {
    if (type === 'mssql') {
      await orm.schema.dropDatabase();
    }

    await orm.close(true);
  }, 120_000);

  test('querying embedded array properties', async () => {
    const user = orm.em.create(User, {
      name: 'Alice',
      addresses: [
        { street: 'Downing street 13A', number: 10, city: 'London 4A', country: 'UK 4A' },
        { street: 'Downing street 13B', number: 20, city: 'London 4B', country: 'UK 4B' },
      ],
    });
    await orm.em.persist(user).flush();
    orm.em.clear();
    const mock = mockLogger(orm, ['query']);

    // basic equality
    const r1 = await orm.em.find(User, { addresses: { city: 'London 4A' } });
    expect(r1).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('basic equality');

    // operator condition with type casting
    const r2 = await orm.em.fork().find(User, { addresses: { number: { $gt: 5 } } });
    expect(r2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatchSnapshot('operator with type casting');

    // multiple conditions on the same element
    mock.mockReset();
    const r3 = await orm.em.fork().find(User, { addresses: { city: 'London 4A', country: 'UK 4A' } });
    expect(r3).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('multiple conditions same element');

    // $or within embedded array
    const r4 = await orm.em.fork().find(User, { addresses: { $or: [{ city: 'London 4A' }, { city: 'London 4B' }] } });
    expect(r4).toHaveLength(1);

    // $not generates NOT EXISTS (no element matches)
    mock.mockReset();
    const r5 = await orm.em.fork().find(User, { addresses: { $not: { city: 'Nonexistent' } } });
    expect(r5).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$not generates NOT EXISTS');

    // $in operator
    mock.mockReset();
    const r6 = await orm.em.fork().find(User, { addresses: { city: { $in: ['London 4A', 'London 4B'] } } });
    expect(r6).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$in operator');

    // no match returns empty
    const r7 = await orm.em.fork().find(User, { addresses: { city: 'Nonexistent' } });
    expect(r7).toHaveLength(0);

    // multiple conditions must match the same element
    const r8 = await orm.em.fork().find(User, { addresses: { city: 'London 4A', country: 'UK 4B' } });
    expect(r8).toHaveLength(0);

    // $nin operator
    mock.mockReset();
    const r9 = await orm.em.fork().find(User, { addresses: { city: { $nin: ['Nonexistent'] } } });
    expect(r9).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$nin operator');

    // explicit $and within embedded array
    mock.mockReset();
    const r10 = await orm.em.fork().find(User, { addresses: { $and: [{ city: 'London 4A' }, { country: 'UK 4A' }] } });
    expect(r10).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('explicit $and');

    // $not combined with $or
    mock.mockReset();
    const r11 = await orm.em
      .fork()
      .find(User, { addresses: { $not: { $or: [{ city: 'London 4A' }, { city: 'London 4B' }] } } });
    expect(r11).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$not combined with $or');

    // empty $or produces 1 = 1 (no restriction)
    mock.mockReset();
    const r12 = await orm.em.fork().find(User, { addresses: { $or: [] } } as any);
    expect(r12).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('empty $or');

    // empty $and produces 1 = 1 (no restriction)
    mock.mockReset();
    const r13 = await orm.em.fork().find(User, { addresses: { $and: [] } } as any);
    expect(r13).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('empty $and');

    // $or with empty object items is handled gracefully
    mock.mockReset();
    const r14 = await orm.em.fork().find(User, { addresses: { $or: [{}] } } as any);
    expect(r14).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$or with empty object');

    // $not with empty object is handled gracefully
    mock.mockReset();
    const r15 = await orm.em.fork().find(User, { addresses: { $not: {} } } as any);
    expect(r15).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$not with empty object');

    // null value in element property
    mock.mockReset();
    const r16 = await orm.em.fork().find(User, { addresses: { number: null } });
    expect(r16).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('null value');

    // $in with empty array produces 1 = 0 (no match)
    mock.mockReset();
    const r17 = await orm.em.fork().find(User, { addresses: { city: { $in: [] } } });
    expect(r17).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$in empty array');

    // $nin with empty array produces 1 = 1 (always true)
    mock.mockReset();
    const r18 = await orm.em.fork().find(User, { addresses: { city: { $nin: [] } } });
    expect(r18).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$nin empty array');

    // $exists on element property
    mock.mockReset();
    const r19 = await orm.em.fork().find(User, { addresses: { city: { $exists: true } } });
    expect(r19).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$exists');

    // element-level $not inside $or
    mock.mockReset();
    const r20 = await orm.em.fork().find(User, { addresses: { $or: [{ $not: { city: 'Nonexistent' } }] } } as any);
    expect(r20).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('element-level $not inside $or');

    // element-level $not with empty object inside $or is handled gracefully
    mock.mockReset();
    const r21 = await orm.em.fork().find(User, { addresses: { $or: [{ $not: {} }] } } as any);
    expect(r21).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('element-level $not with empty object');

    // explicit $eq: null generates correct IS NULL
    mock.mockReset();
    const r22 = await orm.em.fork().find(User, { addresses: { number: { $eq: null } } });
    expect(r22).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$eq null');

    // explicit $ne: null generates correct IS NOT NULL
    mock.mockReset();
    const r23 = await orm.em.fork().find(User, { addresses: { number: { $ne: null } } });
    expect(r23).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatchSnapshot('$ne null');

    // unknown property name in embedded array query throws
    await expect(orm.em.fork().find(User, { addresses: { nonExistent: 'value' } } as any)).rejects.toThrow(
      /does not exist in embeddable/,
    );

    // non-operator key inside operator object throws
    await expect(orm.em.fork().find(User, { addresses: { city: { nested: 'value' } } } as any)).rejects.toThrow(
      /does not exist in embeddable/,
    );

    // $in with non-array value throws
    await expect(orm.em.fork().find(User, { addresses: { city: { $in: null as any } } })).rejects.toThrow(
      'Invalid query: $in operator expects an array value',
    );

    // $nin with non-array value throws
    await expect(orm.em.fork().find(User, { addresses: { city: { $nin: 'London' as any } } })).rejects.toThrow(
      'Invalid query: $nin operator expects an array value',
    );

    // $re is not supported in embedded array queries
    await expect(orm.em.fork().find(User, { addresses: { city: { $re: 'London.*' } } } as any)).rejects.toThrow(
      'Operator $re is not supported in embedded array queries',
    );

    // $fulltext is not supported in embedded array queries
    await expect(orm.em.fork().find(User, { addresses: { city: { $fulltext: 'London' } } } as any)).rejects.toThrow(
      'Operator $fulltext is not supported in embedded array queries',
    );
  });
});
