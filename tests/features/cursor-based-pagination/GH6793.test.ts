import { MikroORM, ScalarRef } from '@mikro-orm/sqlite';
import { Entity, Formula, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Formula(alias => `concat(${alias}.id, ' - ', ${alias}.name)`, {
    type: 'string',
    ref: true,
  })
  nameScalarRef?: ScalarRef<string>;

  constructor(name: string, email: string) {
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
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('cursor ordering by scalar ref', async () => {
  function base64Decode(base64: string): string {
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  const userCount = 5;
  for (let i = 0; i < userCount; i++) {
    orm.em.create(User, { name: 'user', email: `email${i}}@email.com` });
  }
  await orm.em.flush();
  orm.em.clear();

  const firstPage = await orm.em.findByCursor(User, { orderBy: [{ nameScalarRef: 'ASC' }], first: 2 });
  expect(firstPage.length).toBe(2);
  expect(firstPage.totalCount).toBe(userCount);
  expect(firstPage.hasNextPage).toBe(true);
  expect(base64Decode(firstPage.endCursor!)).toBe('["2 - user"]');

  const secondPage = await orm.em.findByCursor(User, {
    orderBy: [{ nameScalarRef: 'ASC' }],
    first: 2,
    after: firstPage,
  });
  expect(secondPage.length).toBe(2);
  expect(secondPage.totalCount).toBe(userCount);
  expect(secondPage.hasNextPage).toBe(true);
  expect(base64Decode(secondPage.endCursor!)).toBe('["4 - user"]');

  const finalPage = await orm.em.findByCursor(User, {
    orderBy: [{ nameScalarRef: 'ASC' }],
    first: 2,
    after: secondPage,
  });
  expect(finalPage.length).toBe(1);
  expect(finalPage.totalCount).toBe(userCount);
  expect(finalPage.hasNextPage).toBe(false);
  expect(base64Decode(finalPage.endCursor!)).toBe('["5 - user"]');
});
