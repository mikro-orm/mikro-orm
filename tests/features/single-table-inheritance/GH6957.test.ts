import { JsonType, MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'type', abstract: true })
class Being {

  @PrimaryKey()
  id!: number;

  @Property({ type: JsonType, nullable: true })
  data: any;

}

@Entity({ discriminatorValue: 'AKUMA' })
class Akuma extends Being {

  @Property({ type: JsonType, nullable: true })
  declare data: { assigment: number };

}

@Entity({ discriminatorValue: 'ONI' })
class Oni extends Being {}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Being, Oni, Akuma],
    dbName: ':memory:',
    allowGlobalContext: true,
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('GH #6957', async () => {
  const example = orm.em.create(Oni, { data: undefined });
  await orm.em.flush();

  example.data = { test: true };
  await orm.em.flush();

  const refreshed = await orm.em.fork().findOne(Being, example);
  expect(refreshed?.data).toEqual({ test: true });
});
