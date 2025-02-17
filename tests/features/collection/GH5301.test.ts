import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class UserLabel {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => User, user => user.labels)
  users = new Collection<User>(this);

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => UserLabel)
  labels = new Collection<UserLabel>(this);

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, UserLabel],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const user1 = orm.em.create(User, {
    id: 1,
    name: 'User 1',
  });

  const user2 = orm.em.create(User, {
    id: 2,
    name: 'User 2',
  });

  orm.em.create(User, {
    id: 3,
    name: 'User 3',
  });

  const label1 = orm.em.create(UserLabel, {
    id: 1,
    name: 'Label 1',
  });

  const label2 = orm.em.create(UserLabel, {
    id: 2,
    name: 'Label 2',
  });

  user1.labels.add(label1, label2);
  user2.labels.add(label1);

  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const count = await orm.em.count(User, {
    labels: { $some: { id: 1 } },
  });
  expect(count).toBe(2);
  expect(mock.mock.calls[0][0]).toMatch('select count(*) as `count` from `user` as `u0` where `u0`.`id` in (select `u0`.`id` from `user` as `u0` left join `user_labels` as `u2` on `u0`.`id` = `u2`.`user_id` inner join `user_label` as `u1` on `u2`.`user_label_id` = `u1`.`id` where `u2`.`user_label_id` = 1)');
});
