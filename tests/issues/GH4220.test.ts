import { Entity, ManyToOne, PrimaryKey, Ref, Unique } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

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

test('1', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(Chat, [{ owner: 1, recipient: 3 }, { owner: 2 }]);
  expect(mock.mock.calls[0][0]).toMatch('select `c0`.* from `chat` as `c0` where ((`c0`.`owner_id` = 1 and `c0`.`recipient_id` = 3) or `c0`.`owner_id` = 2)');
});

test('2', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(Chat, [{ owner: 1, recipient: [3, 6] }, { owner: 1, recipient: [4, 5] }]);
  expect(mock.mock.calls[0][0]).toMatch('select `c0`.* from `chat` as `c0` where ((`c0`.`owner_id` = 1 and `c0`.`recipient_id` in (3, 6)) or (`c0`.`owner_id` = 1 and `c0`.`recipient_id` in (4, 5)))');
});
