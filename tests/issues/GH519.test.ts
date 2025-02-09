import { Entity, PrimaryKey, MikroORM, ManyToOne, Collection, OneToMany } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class Competition {

  @PrimaryKey()
  id!: number;

  @OneToMany('Registration', 'competition', { orphanRemoval: true })
  registrations = new Collection<Registration>(this);

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany('Registration', 'user', { orphanRemoval: true })
  registrations = new Collection<Registration>(this);

}

@Entity()
class Registration {

  @ManyToOne({ primary: true })
  competition!: Competition;

  @ManyToOne({ primary: true })
  user!: User;

  constructor(user: User, competition: Competition) {
    this.user = user;
    this.competition = competition;
  }

}

describe('GH issue 519', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Competition, User, Registration],
      dbName: `mikro_orm_test_gh_519`,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 519`, async () => {
    const user1 = new User();
    const user2 = new User();
    const user3 = new User();
    const competition = new Competition();
    const registration1 = new Registration(user1, competition);
    const registration2 = new Registration(user2, competition);
    const registration3 = new Registration(user3, competition);
    orm.em.persist(registration1);
    orm.em.persist(registration2);
    orm.em.persist(registration3);
    await orm.em.flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const [items, count] = await orm.em.getRepository(Registration).findAndCount({ competition });
    expect(items.length).toBe(3);
    expect(count).toBe(3);
    const queries: string[] = mock.mock.calls.map(c => c[0]).sort();
    expect(queries).toHaveLength(2);
    expect(queries[0]).toMatch('select "r0".* from "registration" as "r0" where "r0"."competition_id" = ?');
    expect(queries[1]).toMatch('select count(*) as "count" from "registration" as "r0" where "r0"."competition_id" = ?');
  });

});
