import { helper, MikroORM, ref, Ref } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Organisation {

  @PrimaryKey({ fieldName: 'org_id' })
  id!: number;

}

@Entity({ abstract: true })
abstract class OrgEntity {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org: Ref<Organisation> = ref(Organisation, 1);

  @PrimaryKey()
  id!: number;

}

@Entity()
class User extends OrgEntity {

  @Property()
  name!: string;

}

@Entity()
class Book extends OrgEntity {

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => User,
    fieldNames: ['org_id', 'user_id'],
    ownColumns: ['user_id'],
    ref: true,
  })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    contextName: 'admin',
    entities: [Organisation, User, Book],
    dbName: ':memory:',
  });

  await orm.schema.refreshDatabase();

  const org = orm.em.create(Organisation, { id: 1 });
  const user = orm.em.create(User, { org, id: 11, name: 'User 1' });
  const book = orm.em.create(Book, { org, id: 21, name: 'Book 1', user });

  await orm.em.flush();
});

beforeEach(() => {
  orm.em.clear();
});

afterAll(async () => {
  await orm.close();
});

test('GH #6951', async () => {
  const bookQ1 = await orm.em.findOneOrFail(Book, { id: 21 }, { populate: ['user'] });
  expect(helper(bookQ1).__originalEntityData).toEqual({ org: 1, id: 21, name: 'Book 1', user: [ 1, 11 ] });

  const bookQ2 = await orm.em.findOneOrFail(Book, { id: 21 }, { populate: ['user'] });
  expect(helper(bookQ2).__originalEntityData).toEqual({ org: 1, id: 21, name: 'Book 1', user: [ 1, 11 ] });
  expect(bookQ1).toBe(bookQ2);

  orm.em.getUnitOfWork().computeChangeSets();
  const changes = orm.em.getUnitOfWork().getChangeSets();

  expect(changes).toHaveLength(0);
});
