import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Team, team => team.owner)
  teams = new Collection<Team>(this);

}

@Entity()
class Team {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  owner?: User;

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Team],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 4578`, async () => {
  orm.em.create(User, {});
  await orm.em.flush();
  orm.em.clear();
  const [u] = await orm.em.find(User, {});

  const mock = mockLogger(orm);
  await orm.em.removeAndFlush(u);

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] delete from `user` where `id` in (1)'],
    ['[query] commit'],
  ]);
});
