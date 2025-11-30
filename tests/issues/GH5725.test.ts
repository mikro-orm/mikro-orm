import { MikroORM, Ref, sql, Utils } from '@mikro-orm/sqlite';
import { Entity, Index, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
@Index({ properties: ['age'] })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  age!: number;

}

@Entity()
@Index({ properties: ['user'] })
class Apartment {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, {
    fieldName: 'ref_user_id',
    ref: true,
  })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Apartment],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5724/5725', async () => {
  Array.from({ length: 100 }).forEach(() => {
    orm.em.create(User, {
      age: Utils.randomInt(1, 100),
    });
  });

  await orm.em.flush();

  const r1 = await orm.em.fork().find(User, { [sql`age`]: { $gte: 10, $lte: 50 } });
  expect(r1.length).toBeGreaterThan(1);

  const r2 = await orm.em.fork().find(User, {
    [sql`age`]: { $gte: 10 },
    [sql`age`]: { $lte: 50 },
  });
  expect(r2.length).toBeGreaterThan(1);

  const r3 = await orm.em.fork().find(User, { id: { $in: [1, 2, 3] } });
  expect(r3.length).toBeGreaterThan(1);

  const r4 = await orm.em.fork().find(User, { id: { $in: sql`select id from user where age > 10` } });
  expect(r4.length).toBeGreaterThan(1);
});
