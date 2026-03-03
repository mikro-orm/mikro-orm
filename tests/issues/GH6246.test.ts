import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
    dbName: '6246',
    entities: [User],
  });
  await orm.schema.refresh();
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
