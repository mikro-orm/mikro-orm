import { MikroORM, ref, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Organisation {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class User {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => Workspace,
    ref: true,
    fieldNames: ['org_id', 'workspace_id'],
    ownColumns: ['workspace_id'],
  })
  workspace!: Ref<Workspace>;

}

@Entity()
class Workspace {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class UserRequest {

  @ManyToOne({
    entity: () => Organisation,
    fieldName: 'org_id',
    primary: true,
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({
    entity: () => User,
    ref: true,
    fieldNames: ['org_id', 'user_id'],
    ownColumns: ['user_id'],
  })
  user!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Organisation, User, Workspace, UserRequest],
  });

  await orm.schema.createSchema();

  const org = orm.em.create(Organisation, { id: 1, name: 'org1' });
  const ws = orm.em.create(Workspace, {
    org,
    id: 12,
    name: 'ws1',
  });
  const user = orm.em.create(User, {
    org,
    id: 11,
    name: 'user1',
    workspace: ws,
  });
  orm.em.create(UserRequest, {
    org,
    id: 1,
    name: 'userRequest1',
    user,
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('composite foreign key as array (populateWhere: infer)', async () => {
  const requests = await orm.em.fork().find(
    UserRequest,
    {
      user: {
        workspace: [1, 12],
      },
    },
    {
      populate: ['user'],
      populateWhere: 'infer',
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].name).toBe('userRequest1');
});

test('composite foreign key as array (populateWhere: all)', async () => {
  const requests = await orm.em.fork().find(
    UserRequest,
    {
      user: {
        workspace: [1, 12],
      },
    },
    {
      populate: ['user'],
      populateWhere: 'all',
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].name).toBe('userRequest1');
});

test('composite foreign key as ref', async () => {
  const requests = await orm.em.fork().find(
    UserRequest,
    {
      user: {
        workspace: ref(Workspace, [1, 12]),
      },
    },
    {
      populate: ['user'],
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].name).toBe('userRequest1');
});

test('composite foreign key as object', async () => {
  const requests = await orm.em.fork().find(
    UserRequest,
    {
      user: {
        workspace: { org: 1, id: 12 },
      },
    },
    {
      populate: ['user'],
    },
  );

  expect(requests).toHaveLength(1);
  expect(requests[0].name).toBe('userRequest1');
});
