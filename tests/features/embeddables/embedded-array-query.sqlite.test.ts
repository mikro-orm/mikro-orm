import { MikroORM } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Address {
  @Property()
  street?: string;

  @Property({ type: 'double' })
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

describe('embedded array query in sqlite', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

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
      "select `u0`.* from `user` as `u0` where exists (select 1 from json_each(`u0`.`addresses`) as `__je0` where json_extract(`__je0`.value, '$.city') = ?)",
    );

    // operator condition with type casting
    const r2 = await orm.em.fork().find(User, { addresses: { number: { $gt: 5 } } });
    expect(r2).toHaveLength(1);
    expect(mock.mock.calls[1][0]).toMatch(
      "select `u0`.* from `user` as `u0` where exists (select 1 from json_each(`u0`.`addresses`) as `__je0` where json_extract(`__je0`.value, '$.number') > ?)",
    );

    // multiple conditions on the same element
    mock.mockReset();
    const r3 = await orm.em.fork().find(User, { addresses: { city: 'London 4A', country: 'UK 4A' } });
    expect(r3).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      "select `u0`.* from `user` as `u0` where exists (select 1 from json_each(`u0`.`addresses`) as `__je0` where json_extract(`__je0`.value, '$.city') = ? and json_extract(`__je0`.value, '$.country') = ?)",
    );

    // $or within embedded array
    const r4 = await orm.em.fork().find(User, { addresses: { $or: [{ city: 'London 4A' }, { city: 'London 4B' }] } });
    expect(r4).toHaveLength(1);

    // $not generates NOT EXISTS (no element matches)
    mock.mockReset();
    const r4b = await orm.em.fork().find(User, { addresses: { $not: { city: 'Nonexistent' } } });
    expect(r4b).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      "select `u0`.* from `user` as `u0` where not exists (select 1 from json_each(`u0`.`addresses`) as `__je0` where json_extract(`__je0`.value, '$.city') = ?)",
    );

    // $in operator
    mock.mockReset();
    const r4c = await orm.em.fork().find(User, { addresses: { city: { $in: ['London 4A', 'London 4B'] } } });
    expect(r4c).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(
      "select `u0`.* from `user` as `u0` where exists (select 1 from json_each(`u0`.`addresses`) as `__je0` where json_extract(`__je0`.value, '$.city') in (?, ?))",
    );

    // no match returns empty
    mock.mockReset();
    const r5 = await orm.em.fork().find(User, { addresses: { city: 'Nonexistent' } });
    expect(r5).toHaveLength(0);

    // multiple conditions must match the same element
    const r6 = await orm.em.fork().find(User, { addresses: { city: 'London 4A', country: 'UK 4B' } });
    expect(r6).toHaveLength(0);
  });
});
