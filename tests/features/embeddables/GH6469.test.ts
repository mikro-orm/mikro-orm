import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, Index, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Embeddable()
class Name {

  @Property()
  first!: string;

  @Property()
  last!: string;

}

@Entity()
@Index({ properties: ['name.first'] })
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Name)
  name!: Name;

  @Property({ unique: true })
  email!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('create schema with index on embedded field', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatch('create index `user_name_first_index` on `user` (`name_first`)');
});
