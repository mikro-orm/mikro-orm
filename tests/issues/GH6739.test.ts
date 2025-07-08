import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  ref,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
class Organisation {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

export abstract class OrgEntity {

  [PrimaryKeyProp]?: ['org', 'id'];

  @ManyToOne(() => Organisation, {
    primary: true,
    fieldName: 'org_id',
    deleteRule: 'cascade',
    ref: true,
  })
  org!: Ref<Organisation>;

  @PrimaryKey()
  id!: number;

}

@Entity()
class User extends OrgEntity {

  @Property()
  name!: string;

}

@Entity()
class JobList {

  @ManyToOne(() => Organisation, {
    fieldName: 'org_id',
    deleteRule: 'cascade',
    ref: true,
  })
  org!: Ref<Organisation>;

  @ManyToOne(() => Job, {
    primary: true,
    ref: true,
    fieldNames: ['org_id', 'job_id'],
    ownColumns: ['job_id'],
  })
  job!: Ref<Job>;

  @ManyToOne(() => List, {
    primary: true,
    ref: true,
    fieldNames: ['org_id', 'list_id'],
    ownColumns: ['list_id'],
  })
  list!: Ref<List>;

}

@Entity()
class Job extends OrgEntity {

  @Property()
  name!: string;

  @OneToMany({
    entity: () => JobList,
    mappedBy: tl => tl.job,
    ref: true,
  })
  jobLists = new Collection<JobList>(this);

  @ManyToMany({
    entity: () => List,
    pivotEntity: () => JobList,
  })
  lists = new Collection<List>(this);

}

@Entity()
class ListPet {

  @ManyToOne(() => Organisation, {
    fieldName: 'org_id',
    deleteRule: 'cascade',
    ref: true,
  })
  org!: Ref<Organisation>;

  @ManyToOne(() => List, {
    primary: true,
    ref: true,
    fieldNames: ['org_id', 'list_id'],
    ownColumns: ['list_id'],
  })
  list!: Ref<List>;

  @ManyToOne(() => Pet, {
    primary: true,
    ref: true,
    fieldNames: ['org_id', 'pet_id'],
    ownColumns: ['pet_id'],
  })
  pet!: Ref<Pet>;

}

@Entity()
class List extends OrgEntity {

  @Property()
  name!: string;

  @ManyToMany({ entity: () => Pet, owner: true, pivotEntity: () => ListPet })
  pets = new Collection<Pet>(this);

}

@Entity()
class Pet extends OrgEntity {

  @Property()
  name!: string;

  @ManyToOne(() => User, {
    ref: true,
    fieldNames: ['org_id', 'owner_id'],
    ownColumns: ['owner_id'],
    cascade: [],
  })
  owner!: Ref<User>;

}

let orm: MikroORM;

const createTestData = async () => {
  const organisation = orm.em.create(Organisation, { id: 1, name: 'Org A' });

  const userA = orm.em.create(User, {
    org: organisation,
    id: 1,
    name: 'User A',
  });

  const jobA = orm.em.create(Job, {
    org: organisation,
    id: 1,
    name: 'Job A',
  });

  const listA = orm.em.create(List, {
    org: organisation,
    id: 1,
    name: 'List A',
  });

  jobA.lists.add(listA);

  const petA = orm.em.create(Pet, {
    org: organisation,
    id: 1,
    name: 'Pet A',
    owner: ref(userA),
  });

  listA.pets.add(petA);
  await orm.em.flush();
};

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Organisation, User, Job, List, Pet, JobList],
    debug: ['query', 'query-params'],
  });

  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  await createTestData();
});

afterAll(async () => {
  await orm.close(true);
});

test('TEST1: peforming only select queries should not cause updates', async () => {
  const job = await orm.em.findOneOrFail(Job, {
    org: ref(Organisation, 1),
    id: 1,
  });

  await job.jobLists.load({
    populate: ['list.pets.owner'],
  });

  orm.em.getUnitOfWork().computeChangeSets();
  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});
