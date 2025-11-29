import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Embeddable()
class A {

  @Property()
  foo!: string;

  @Property()
  bar!: number;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Embedded({ entity: () => A, object: false, nullable: true })
  a!: A  | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A, B],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();

  orm.em.create(B, { a: null });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('embedded should be null', async () => {
  const [b] = await orm.em.find(B, {});
  expect(b.a).toBeNull(); // undefined
});

test('get embedded by null', async () => {
  const a = await orm.em.findOne(B, { a: { foo: null } });
  expect(a).not.toBeNull();

  const f = await orm.em.findOne(B, { a: null }); // throws
  expect(f).not.toBeNull();
});
