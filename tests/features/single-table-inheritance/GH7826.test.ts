import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'type', abstract: true })
abstract class Animal {
  @PrimaryKey()
  id!: string;
}

@Entity({ discriminatorValue: 'dog' })
class Dog extends Animal {
  @PrimaryKey()
  declare id: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Animal, Dog],
    dbName: 'mikro_orm_test_7826',
  });
});

afterAll(() => orm.close(true));

test('STI primary key is NOT NULL when a child re-declares it', async () => {
  expect(orm.getMetadata().get(Animal).properties.id.nullable).toBe(false);

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).not.toMatch(/"id" varchar\(255\) null/);

  await orm.schema.refresh();
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
});
