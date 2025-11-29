import { MikroORM } from '@mikro-orm/mysql';

import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class User {

  @PrimaryKey({ autoincrement: false, unsigned: false })
  id!: number;

}

@Entity()
class Message {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5485',
    entities: [User, Message],
    port: 3308,
  });
  await orm.schema.ensureDatabase();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('generate schema migration and migration up fails', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
});
