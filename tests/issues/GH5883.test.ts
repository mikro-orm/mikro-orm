import { Entity, PrimaryKey, MikroORM, ManyToOne, OneToMany, Collection, Rel, SimpleLogger } from '@mikro-orm/libsql';
import { mockLogger } from '../helpers';

@Entity({ tableName: 'users' })
class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Role, nullable: true })
  role?: Rel<Role>;

}

@Entity({ tableName: 'roles' })
class Role {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => User, user => user.role)
  users = new Collection<User>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
  await orm.em.insert(Role, { id: 1 });
  await orm.em.insert(User, { id: 1, role: 1 });
  await orm.em.insert(User, { id: 2 });
});

afterAll(() => orm.close(true));

test('GH issue 5883', async () => {
  const role = await orm.em.findOneOrFail(Role, 1);
  const users = await orm.em.find(User, { id: { $in: [2] } });
  role.users.set(users);

  const mock = mockLogger(orm);
  await orm.em.flush();

  const queries: string[] = mock.mock.calls.map(c => c[0]);
  expect(queries).toEqual([
    '[query] begin',
    '[query] update `users` set `role_id` = 1 where `id` = 2',
    '[query] update `users` set `role_id` = NULL where `role_id` in (1) and `id` not in (2)',
    '[query] commit',
  ]);
});
