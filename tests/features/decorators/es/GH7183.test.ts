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

  @Property({ type: 'string', persist: false })
  set nickname(value: string) {
    this.firstName = value;
  }

  @Property({ type: 'string', persist: false })
  accessor displayName: string & Opt = '';

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

test('GH #7183 - @Property on setter decorator context', () => {
  const meta = orm.getMetadata().get(FooEntity);
  const nicknameProp = meta.properties.nickname;
  expect(nicknameProp).toBeDefined();
  expect(nicknameProp.getter).toBe(false);
  expect(nicknameProp.setter).toBe(true);
  expect(nicknameProp.persist).toBe(false);
});

test('GH #7183 - @Property on accessor decorator context', () => {
  const meta = orm.getMetadata().get(FooEntity);
  const displayNameProp = meta.properties.displayName;
  expect(displayNameProp).toBeDefined();
  expect(displayNameProp.getter).toBe(true);
  expect(displayNameProp.setter).toBe(true);
  expect(displayNameProp.persist).toBe(false);
});
