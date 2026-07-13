import { MikroORM } from '@mikro-orm/sqlite';
import { Check, Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
@Check({ expression: 'id is not null' })
class Person {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  @Check({ expression: c => `${c.name} <> ''` })
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Person],
    dbName: ':memory:',
  });
});

afterAll(() => orm.close(true));

test('@Check() works on both class and property level (TC39 decorators)', async () => {
  const meta = orm.getMetadata().get(Person);
  expect(meta.checks).toHaveLength(2);

  const classCheck = meta.checks.find(c => c.expression === 'id is not null');
  expect(classCheck).toBeDefined();
  expect(classCheck!.property).toBeUndefined();

  const propCheck = meta.checks.find(c => c.property === 'name');
  expect(propCheck).toBeDefined();

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('id is not null');
});
