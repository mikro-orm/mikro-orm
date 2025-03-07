import { Entity, MikroORM, PrimaryKey, Property, raw } from '@mikro-orm/mssql';
import { TYPES } from 'tedious';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [User],
    dbName: `knex-bound-params`,
    password: 'Root.Root',
  });

  await orm.schema.refreshDatabase();

  const users = [
    orm.em.create(User, { id: 1, name: 'John' }),
    orm.em.create(User, { id: 2, name: 'Jane' }),
    orm.em.create(User, { id: 3, name: 'Jack' }),
  ];

  await orm.em.persistAndFlush(users);
  await orm.em.getConnection().execute(`DROP TYPE IF EXISTS IdTvp;`);
  await orm.em.getConnection().execute(`
    CREATE TYPE IdTvp AS TABLE
    (
      id INT
    );
  `);
});

afterAll(async () => {
  await orm.close(true);
});

test('executes raw query with TVP', async () => {
  const users = await orm.em.find(
    User,
    {
      [raw(alias => `${alias}.id`)]: {
        $in: raw('SELECT id FROM :UserIDs', {
          UserIDs: {
            type: TYPES.TVP,
            value: {
              name: 'IdTvp',
              columns: [{ name: 'id', type: TYPES.Int }],
              rows: [[1], [3]],
            },
          },
        }),
      },
    },
    {
      orderBy: {
        id: 'asc',
      },
    },
  );

  expect(users.length).toBe(2);
  expect(users[0].name).toEqual('John');
  expect(users[1].name).toEqual('Jack');
});
