import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

describe('truncate [postgresql]', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: 'truncate',
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close(true));

  test('truncates table and resets identity value', async () => {
    await orm.em.persistAndFlush([
      orm.em.create(User, { name: 'u1' }),
      orm.em.create(User, { name: 'u2' }),
      orm.em.create(User, { name: 'u3' }),
    ]);

    const [{ identitySequence }] = await orm.em
      .execute(`SELECT pg_get_serial_sequence('user', 'id') AS "identitySequence"`);

    const [{ identity: identityBefore }] = await orm.em
      .execute(`SELECT last_value AS "identity" FROM ${identitySequence}`);

    await orm.em.createQueryBuilder(User).truncate().execute();

    const [{ identity: identityAfter }] = await orm.em
      .execute(`SELECT last_value AS "identity" FROM ${identitySequence}`);

    const users = await orm.em.find(User, {});

    expect(users.length).toBe(0);
    expect(+identityBefore).toBe(3);
    expect(+identityAfter).toBe(1);
  });

});
