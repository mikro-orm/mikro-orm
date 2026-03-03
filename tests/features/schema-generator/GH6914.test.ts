import { MikroORM, quote } from '@mikro-orm/postgresql';
import { Check, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'user' })
class User0 {
  @PrimaryKey()
  id!: number;

  @Property()
  @Check({
    name: 'name_max_length',
    expression: c => quote`char_length(${c.name}) <= 123`,
  })
  name!: string;
}

@Entity({ tableName: 'user' })
class User1 {
  @PrimaryKey()
  id!: number;

  @Property()
  @Check({
    name: 'name_max_length',
    expression: c => quote`char_length(${c.name}) <= 123`,
  })
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User0],
    dbName: 'mikro_orm_test_gh_6914',
  });
  await orm.schema.ensureDatabase();
  await orm.schema.drop();
});

afterAll(() => orm.close(true));

test('GH #6914', async () => {
  const testMigration = async (e1: any, e2: any, snap: string) => {
    if (e2) {
      orm.discoverEntity(e2, e1);
    }

    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff).toMatchSnapshot(snap);
    await orm.schema.execute(diff.up);

    return diff.down;
  };

  const down: string[] = [];
  down.push(await testMigration(User0, undefined, '0. create schema'));
  down.push(await testMigration(User0, User1, '1. check no updates'));

  for (const sql of down.reverse()) {
    await orm.schema.execute(sql);
  }
});
