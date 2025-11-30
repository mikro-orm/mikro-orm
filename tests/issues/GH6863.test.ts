import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id: number;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', nullable: true })
  email: string | null = null;

  constructor(id: number, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('partial loading with nullable property (when null)', async () => {
  // create user with nullable email
  const user = orm.em.create(User, { id: 1, name: 'John', email: null });
  await orm.em.flush();
  orm.em.clear();

  // --- Q1: partial load only id ---
  const q1 = await orm.em.findOneOrFail(User, { id: 1 }, { fields: ['id'] });
  expect(q1.id).toBe(1);
  expect((q1 as any).name).toBe(undefined); // demonstrating that name is not loaded by q1
  expect((q1 as any).email).toBe(undefined); // demonstrating that email is not loaded by q1

  // --- Q2: full load ---
  const q2 = await orm.em.findOneOrFail(User, { id: 1 });
  expect(q2.id).toBe(1);
  expect(q2.name).toBe('John'); // demonstrating that name is loaded by q2
  expect(q2.email).toBeNull(); // fails: email should be auto-merged with name by q2
});
