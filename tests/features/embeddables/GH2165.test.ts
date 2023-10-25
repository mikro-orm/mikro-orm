import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string = '';

  constructor(name: string) {
    this.name = name;
  }

}

@Embeddable()
class FamilyMember {

  @Property()
  relation: string = 'brother';

  @ManyToOne(() => User, { eager: true })
  user!: User;

}

@Entity()
class Family {

  @PrimaryKey()
  id!: number;

  @Embedded(() => FamilyMember, { array: true })
  members: FamilyMember[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [FamilyMember, User, Family],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 2165`, async () => {
  const family = new Family();

  const dad = new FamilyMember();
  dad.relation = 'dad';
  dad.user = new User('John');
  family.members.push(dad);

  const mom = new FamilyMember();
  mom.relation = 'mom';
  mom.user = new User('Jane');
  family.members.push(mom);

  expect(family).toMatchObject({
    members: [
      { relation: 'dad', user: { name: 'John' } },
      { relation: 'mom', user: { name: 'Jane' } },
    ],
  });
  await orm.em.persistAndFlush(family);

  const nativeResults = await orm.em.createQueryBuilder(Family).execute('all', { mapResults: false });
  expect(nativeResults[0].members).toBe('[{"relation":"dad","user_id":1},{"relation":"mom","user_id":2}]');
});
