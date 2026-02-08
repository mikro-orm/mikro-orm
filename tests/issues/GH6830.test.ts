import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

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
    fieldNames: ['org_id', 'workspace_id'],
    ownColumns: ['workspace_id'],
    ref: true,
  })
  workspace!: Ref<Workspace>;
}

@Entity()
@Filter({
  name: 'softDelete',
  cond: { deletedAt: { $eq: null } },
  default: true,
})
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

  @OneToMany({
    entity: () => User,
    mappedBy: u => u.workspace,
    ref: true,
  })
  users = new Collection<User>(this);

  @Property({ nullable: true })
  deletedAt?: Date;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Organisation, User, Request],
  });

  await orm.schema.refresh({ dropDb: true });

  const org = orm.em.create(Organisation, { id: 1, name: 'org1' });

  const workspace = orm.em.create(Workspace, {
    org,
    id: 10,
    name: 'workspace1',
  });

  orm.em.create(User, {
    org,
    id: 12,
    name: 'user1',
    workspace,
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

afterEach(() => {
  orm.em.clear();
});

test('populate 1:m collection via load()', async () => {
  const workspace = await orm.em.findOneOrFail(Workspace, {
    org: 1,
    id: 10,
  });

  const users = await workspace.users.load();

  expect(users).toHaveLength(1);
});

test('populate 1:m collection via em.polulate()', async () => {
  const workspace = await orm.em.findOneOrFail(Workspace, {
    org: 1,
    id: 10,
  });

  await orm.em.populate(workspace, ['users']);

  expect(workspace.users.isInitialized(true)).toBe(true);
});
