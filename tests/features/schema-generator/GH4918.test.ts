import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';

@Entity()
class Two {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => One, { deleteRule: 'cascade' })
  one!: Rel<One>;

}

@Entity({ schema: 'test' })
class One {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Two, { deleteRule: 'cascade' })
  two!: Two;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [One],
    dbName: '4918',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.drop();
});

afterAll(() => orm.close(true));

test('GH #4918', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  await orm.schema.execute(sql);
});
