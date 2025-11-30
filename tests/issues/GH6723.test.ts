import { ArrayType, JsonType, MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, type: JsonType })
  children?: any[];

  @Property()
  email!: string;

  @Property({ type: ArrayType, nullable: true, persist: true, hydrate: true })
  get childEmails(): string[] | undefined {
    return this.children?.map(c => c.email.toLowerCase()).filter(e => !!e);
  }

  @Property({ type: ArrayType, nullable: true, persist: true, hydrate: false })
  get childEmails2(): string[] | undefined {
    return this.children?.map(c => c.email.toLowerCase()).filter(e => !!e);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '6723',
    entities: [User],
  });
  await orm.schema.refresh();

  orm.em.create(User, {
    email: 'test@example.com',
    children: [{
      email: 'test@example.com',
    }],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('should not try to persist persisted getter if its value has not changed 1', async () => {
  const r = await orm.em.findAll(User);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();

  r[0].children?.push({ email: 'test2' });
  await orm.em.flush();
  // child_emails is hydrated, and its value didn't change
  expect(mock.mock.calls[1][0]).toMatch('update "user" set "children" = \'[{"email":"test@example.com"},{"email":"test2"}]\', "child_emails2" = \'{test@example.com,test2}\' where "id" = 1');
});

test('should not try to persist persisted getter if its value has not changed 2', async () => {
  await orm.em.findOneOrFail(User, 1);
  await orm.em.findOneOrFail(User, { email: 'test@example.com' });
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
