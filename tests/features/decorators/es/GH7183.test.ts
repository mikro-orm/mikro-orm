import { MikroORM, type Opt } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
class FooEntity {

  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  firstName!: string;

  @Property({ type: 'string' })
  lastName!: string;

  @Property({ type: 'string', persist: false })
  get fullName(): string & Opt {
    return `${this.firstName} ${this.lastName}`;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    dbName: ':memory:',
    entities: [FooEntity],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7183 - @Property on getter decorator context', async () => {
  const meta = orm.getMetadata().get(FooEntity);
  const fullNameProp = meta.properties.fullName;
  expect(fullNameProp).toBeDefined();
  expect(fullNameProp.getter).toBe(true);
  expect(fullNameProp.setter).toBe(false);
  expect(fullNameProp.persist).toBe(false);

  const foo = new FooEntity();
  foo.firstName = 'John';
  foo.lastName = 'Snow';
  await orm.em.persist(foo).flush();
  orm.em.clear();

  const res = await orm.em.findOneOrFail(FooEntity, foo.id);
  expect(res.firstName).toBe('John');
  expect(res.lastName).toBe('Snow');
  expect(res.fullName).toBe('John Snow');
});
