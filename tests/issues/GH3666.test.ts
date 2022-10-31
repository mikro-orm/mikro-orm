import { Entity, PrimaryKey, ManyToOne, Collection, OneToMany } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

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

}

@Entity()
class Registration {

  @ManyToOne({ primary: true })
  competition!: Competition;

  @ManyToOne({ primary: true })
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Competition, User, Registration],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3666`, async () => {
  const competition = new Competition();
  const user1 = new User();
  const user2 = new User();
  const user3 = new User();
  const registration1 = orm.em.create(Registration, { user: user1, competition });
  const registration2 = orm.em.create(Registration, { user: user2, competition });
  const registration3 = orm.em.create(Registration, { user: user3, competition });
  await orm.em.flush();

  let x = await orm.em.find(Registration, {});
  expect(x).toHaveLength(3);

  competition.registrations.set([registration2, registration3]);
  await orm.em.flush();
  x = await orm.em.find(Registration, {});
  expect(x).toHaveLength(2);

  competition.registrations.set([registration2]);
  await orm.em.flush();
  x = await orm.em.find(Registration, {});
  expect(x).toHaveLength(1);
});
