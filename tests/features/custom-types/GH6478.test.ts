import { BigIntType, Entity, ManyToOne, MikroORM, Opt, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class User {

  @PrimaryKey({ type: new BigIntType('string') })
  id!: string;

  @Property()
  name!: string;

  @Property()
  email!: string;

}

@Entity()
class UserInfo {

  @PrimaryKey({ type: new BigIntType('string') })
  id!: string;

  @Property({ type: new BigIntType('string') })
  relationId!: string;

  @ManyToOne(() => User, { nullable: true })
  user!: User & Opt;

}

@Entity()
class Book {

  @PrimaryKey({ type: new BigIntType('string') })
  id!: string;

  @Property()
  name!: string;

  @ManyToOne(() => UserInfo, { nullable: false })
  createdByUserInfo!: UserInfo;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, UserInfo, Book],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #4678', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo' });
  await orm.em.flush();
  const setupUser = await orm.em.findOne(User, {
    id: '1',
  });
  orm.em.create(UserInfo, { relationId: '123', user: setupUser });
  await orm.em.flush();
  const setupUserInfo = await orm.em.findOneOrFail(UserInfo, {
    id: '1',
  });
  orm.em.create(Book, { name: 'MikroORM',  createdByUserInfo: setupUserInfo });
  await orm.em.flush();

  orm.em.clear();

  const book = await orm.em.findOne(Book, {
    id: '1',
  }, {
    populate: ['createdByUserInfo.user'],
    orderBy: {
      id: 'DESC',
    },
  });
  expect(book?.name).toBe('MikroORM');

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
