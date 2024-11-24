import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'jsonb', nullable: true })
  meta!: { age: number; sex: string };

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6246',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6246', async () => {
  await orm.em.insert(User, { name: 'Foo', meta: { age: 21, sex: 'M' } });

  const user = await orm.em.findOneOrFail(User, {
    meta: {
      $in: [
        { age: 21, sex: 'M' },
        { age: 21, sex: 'F' },
      ],
    },
  });
  expect(user.name).toBe('Foo');
});
