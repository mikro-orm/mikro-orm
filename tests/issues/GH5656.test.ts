import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, unique: true })
  username?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));
beforeEach(() => orm.schema.clearDatabase());

test('5656 1/2', async () => {
  const userA = new User();
  const userB = new User();
  userB.username = 'test';
  await orm.em.persistAndFlush([userA, userB]);

  userA.username = 'test';
  userB.username = undefined;
  await orm.em.flush();
});

test('5656 2/2', async () => {
  const userA = new User();
  const userB = new User();
  userB.username = 'test';
  await orm.em.persistAndFlush([userB, userA]);

  userA.username = 'test';
  userB.username = undefined;
  await orm.em.flush();
});
