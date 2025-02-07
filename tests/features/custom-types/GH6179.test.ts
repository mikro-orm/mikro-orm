import { MikroORM, serialize, wrap } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, Ref, Type } from '@mikro-orm/core';


/** String in TS, Integer in DB **/
export class IDStoredAsInteger extends Type<string, number> {

  convertToDatabaseValue(value: string): number {
    return parseInt(value);
  }

  convertToJSValue(value: number): string {
    return `${value}`;
  }

  getColumnType() {
    return `integer`;
  }

}


@Entity()
class User {

  @PrimaryKey({ type: IDStoredAsInteger })
  id!: string;

  @Property({ unique: true })
  email!: string;

  @ManyToOne(() => User, { nullable: true })
  bestFriend?: Ref<User>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('should apply custom type when serializing primary key', async () => {
  const totoUser = orm.em.create(User, {
    email: 'toto@test.com',
  });
  orm.em.create(User, {
    email: 'yolo@test.com',
    bestFriend: totoUser,
  });
  await orm.em.flush();

  const u1 = await orm.em.fork().findOneOrFail(User, { email: 'yolo@test.com' });
  const dto1 = serialize(u1);
  expect(typeof dto1.id).toBe('string');
  expect(dto1.bestFriend).toBeDefined();
  expect(typeof dto1.bestFriend).toBe('string');

  const dto2 = wrap(u1).toObject();
  expect(typeof dto2.id).toBe('string');
  expect(dto2.bestFriend).toBeDefined();
  expect(typeof dto2.bestFriend).toBe('string');
});
