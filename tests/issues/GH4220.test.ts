import { Entity, ManyToOne, ObjectQuery, PrimaryKey, Property, Ref, Unique } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  sex!: number;

}

@Unique({ properties: ['owner', 'recipient'] })
@Entity()
export class Chat {

  @ManyToOne(() => User, { primary: true })
  owner!: Ref<User>;

  @ManyToOne(() => User, { primary: true })
  recipient!: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Chat, User],
    dbName: `:memory:`,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('#4220 (1)', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(Chat, [{ owner: 1, recipient: 3 }, { owner: 2 }]);
  expect(mock.mock.calls[0][0]).toMatch('select `c0`.* from `chat` as `c0` where ((`c0`.`owner_id` = 1 and `c0`.`recipient_id` = 3) or `c0`.`owner_id` = 2)');
});

test('#4220 (2)', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(Chat, [{ owner: 1, recipient: [3, 6] }, { owner: 1, recipient: [4, 5] }]);
  expect(mock.mock.calls[0][0]).toMatch('select `c0`.* from `chat` as `c0` where ((`c0`.`owner_id` = 1 and `c0`.`recipient_id` in (3, 6)) or (`c0`.`owner_id` = 1 and `c0`.`recipient_id` in (4, 5)))');
});

test('#4222 (1)', async () => {
  const mock = mockLogger(orm);
  const where = {} as ObjectQuery<User>;
  where.$and = where.$and ? [...where.$and] : [];
  where.$and.push(1);
  where.$and.push({ sex: 0 });
  await orm.em.find(User, where);
  expect(mock.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`id` = 1 and `u0`.`sex` = 0');
});

test('#4222 (2)', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(User, { $and: [[1, 2], { sex: 0 }] });
  expect(mock.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`id` in (1, 2) and `u0`.`sex` = 0');
});

test('#4222 (3)', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(User, { $and: [[1, 2], { sex: 0 }] });
  expect(mock.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` where `u0`.`id` in (1, 2) and `u0`.`sex` = 0');
});
