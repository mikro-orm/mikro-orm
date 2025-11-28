import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class User {

  @PrimaryKey()
  id!: string;

  @Property({ type: 'json' })
  data!: { id: string };

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3054`, async () => {
  await orm.em.insert(User, { id: '123', data: { id: 'test' } });
  const r = await orm.em.findOneOrFail(User, {
    data: {
      id: 'test',
    },
  });
  expect(r.data.id).toBe('test');
});
