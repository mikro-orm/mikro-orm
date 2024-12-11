import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/mysql';

@Entity()
class TestEntity {

  @PrimaryKey({ comment: `This
is
a
comment` })
  id!: bigint;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6286',
    port: 3308,
    entities: [TestEntity],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('6286', async () => {
  const sources = await orm.entityGenerator.generate();
  expect(sources[0]).toMatch(`This\nis\na\ncomment`);
});
