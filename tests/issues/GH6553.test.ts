import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'date', nullable: true })
  at?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6553',
    password: 'Root.Root',
    entities: [Test],
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH #6553', async () => {
  orm.em.create(Test, { at: '2020-01-01' });
  await orm.em.flush();
  orm.em.clear();

  const data = await orm.em.findAll(Test);
  expect(data[0].at).toBe('2020-01-01');
});
