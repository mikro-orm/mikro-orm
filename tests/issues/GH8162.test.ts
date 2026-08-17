import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../bootstrap.js';

@Entity({ inheritance: 'tpt' })
abstract class Account {
  @PrimaryKey()
  id!: number;

  @Property()
  email!: string;

  @Property({ type: 'json' })
  name!: Record<string, string>;
}

@Entity()
class Member extends Account {
  @Property({ type: 'json' })
  settings!: Record<string, string>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Account, Member],
  });
  await orm.schema.refresh();

  orm.em.create(Member, { id: 1, email: 'john@example.com', name: { en: 'John' }, settings: { theme: 'dark' } });
  await orm.em.flush();
});

beforeEach(() => orm.em.clear());

afterAll(async () => {
  await orm.close(true);
});

test('where on an inherited scalar property resolves the parent table alias', async () => {
  const member = await orm.em.findOne(Member, { email: 'john@example.com' });
  expect(member).not.toBeNull();
});

test('where on an inherited JSON property resolves the parent table alias', async () => {
  const mock = mockLogger(orm);
  const member = await orm.em.findOne(Member, { name: { en: 'John' } });
  expect(member).not.toBeNull();
  expect(mock.mock.calls[0][0]).toMatch("json_extract(`a1`.`name`, '$.en')");
});

test('where on an own JSON property keeps the child table alias', async () => {
  const mock = mockLogger(orm);
  const member = await orm.em.findOne(Member, { settings: { theme: 'dark' } });
  expect(member).not.toBeNull();
  expect(mock.mock.calls[0][0]).toMatch("json_extract(`m0`.`settings`, '$.theme')");
});
