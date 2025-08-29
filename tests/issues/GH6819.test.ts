import {
  Entity,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

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
    dbName: ':memory:',
    entities: [Organisation, User, Workspace, UserRequest],
  });

  await orm.schema.createSchema();

  const org = orm.em.create(Organisation, { id: 1, name: 'org1' });
  const ws = orm.em.create(Workspace, {
    org,
    id: 1,
    name: 'ws1',
  });
  const user = orm.em.create(User, {
    org,
    id: 1,
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

test('composite foreign key as array', async () => {
  const requests = await orm.em.fork().find(
    UserRequest,
    {
      user: {
        workspace: [1, 1],
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
