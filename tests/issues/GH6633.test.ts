import { MikroORM, Opt } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'datetime', columnType: 'timestamp(6)', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Test],
    dbName: '6633',
  });

  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('date hydration', async () => {
  const d = new Test();
  await orm.em.persistAndFlush(d);
  expect(d.createdAt).toBeInstanceOf(Date);

  const d2 = await orm.em.fork().findOneOrFail(Test, d);
  expect(d.createdAt).toBeInstanceOf(Date);
});
