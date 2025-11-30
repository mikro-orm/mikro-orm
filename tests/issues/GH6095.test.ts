import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey({ type: 'bigserial' })
  id!: string;

  constructor(id: string) {
    this.id = id;
  }


}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('6095', async () => {
  const sql = await orm.schema.getUpdateSchemaSQL();
  expect(sql).toBe('');

  await orm.em.persistAndFlush(new User('id'));
  const count = await orm.em.count(User);
  expect(count).toBe(1);
});
