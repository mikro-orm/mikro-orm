import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  userId!: string;

  constructor(userId: string) {
    this.userId = userId;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User], dbName: '6083' });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('check schema', async () => {
  await orm.em.insertMany([
    new User('6083-1'),
    new User('6083-2'),
    new User('6083-3'),
  ]);

  await orm.em.createQueryBuilder(User)
      .select('userId')
      .where({ userId: '6083-2' })
      .cache([`6083`, 6083])
      .execute('get');

  const result = await orm.em.createQueryBuilder(User)
      .select('userId')
      .where({ userId: '6083-1' })
      .cache([`6083`, 6083])
      .execute('get');

  expect(result).toEqual({ userId: '6083-2' });
});
