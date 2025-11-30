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

  @Property({ type: 'number', nullable: true, default: 0 })
  age!: number | null;

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

test('should hydrate nullable property without default value when set to null', async () => {
  const user = orm.em.create(User, { id: 1, name: 'John', email: 'test@test.com', age: null });
  await orm.em.flush();
  orm.em.clear();

  expect(user.age).toBeNull();

  const q2 = await orm.em.findOneOrFail(User, { id: 1 });
  expect(q2.id).toBe(1);
  expect(q2.name).toBe('John');
  expect(q2.email).toBe('test@test.com');
  expect(q2.age).toBeNull();
});
