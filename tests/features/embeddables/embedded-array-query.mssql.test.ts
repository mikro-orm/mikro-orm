import { MikroORM } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { mockLogger } from '../../helpers.js';

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

describe('embedded array query [mssql]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: `mikro_orm_test_embed_arr_${(Math.random() + 1).toString(36).substring(7)}`,
      password: 'Root.Root',
      driver: MsSqlDriver,
    });
    await orm.schema.create();
  }, 120_000);

  afterAll(async () => {
    await orm.schema.dropDatabase();
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
    expect(mock.mock.calls[0][0]).toMatch(
      "select [u0].* from [user] as [u0] where exists (select 1 from openjson([u0].[addresses]) with ([city] nvarchar(max) '$.city') as [__je0] where [__je0].[city] = ?)",
    );

    // operator condition with type casting
    const r2 = await orm.em.fork().find(User, { addresses: { number: { $gt: 5 } } });
    expect(r2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatch(
      "select [u0].* from [user] as [u0] where exists (select 1 from openjson([u0].[addresses]) with ([number] float '$.number') as [__je0] where [__je0].[number] > ?)",
    );

    // multiple conditions on the same element
    mock.mockReset();
    const r3 = await orm.em.fork().find(User, { addresses: { city: 'London 4A', country: 'UK 4A' } });
    expect(r3).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      "select [u0].* from [user] as [u0] where exists (select 1 from openjson([u0].[addresses]) with ([city] nvarchar(max) '$.city', [country] nvarchar(max) '$.country') as [__je0] where [__je0].[city] = ? and [__je0].[country] = ?)",
    );

    // $or within embedded array
    const r4 = await orm.em.fork().find(User, { addresses: { $or: [{ city: 'London 4A' }, { city: 'London 4B' }] } });
    expect(r4).toHaveLength(1);

    // $not generates NOT EXISTS (no element matches)
    mock.mockReset();
    const r5 = await orm.em.fork().find(User, { addresses: { $not: { city: 'Nonexistent' } } });
    expect(r5).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      "select [u0].* from [user] as [u0] where not exists (select 1 from openjson([u0].[addresses]) with ([city] nvarchar(max) '$.city') as [__je0] where [__je0].[city] = ?)",
    );

    // no match returns empty
    const r6 = await orm.em.fork().find(User, { addresses: { city: 'Nonexistent' } });
    expect(r6).toHaveLength(0);

    // multiple conditions must match the same element
    const r7 = await orm.em.fork().find(User, { addresses: { city: 'London 4A', country: 'UK 4B' } });
    expect(r7).toHaveLength(0);
  });
});
