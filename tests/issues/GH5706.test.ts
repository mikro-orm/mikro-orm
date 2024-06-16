import { MikroORM, Entity, PrimaryKey, DateTimeType, Property, Opt, raw } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  readonly id!: bigint;

  @Property({ type: DateTimeType })
  createdAt: Opt<Date> = new Date();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'gh-5706',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.schema.dropSchema();
  await orm.close(true);
});

test('put sql parameters in right order', async () => {
  const user = orm.em.create(User, {});
  await orm.em.flush();
  orm.em.clear();

  const query = orm.em.createQueryBuilder(User, 'user')
    .where({
      [raw(`(?? at time zone ? at time zone ?)::date`, ['created_at', 'utc', 'Europe/Bratislava'])]: {
        $nin: [raw(`?::date`, ['2024-06-13'])],
      },
    });

  await expect(query.getResult()).resolves.not.toThrow();
});
