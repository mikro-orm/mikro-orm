import { Entity, MikroORM, PrimaryKey, Property, SimpleLogger, Type } from '@mikro-orm/sqlite';
import { parse as uuidParse, stringify as uuidStringify } from 'uuid';
import { mockLogger } from '../../helpers';

export class UuidBinaryType extends Type<string, Buffer> {

  convertToDatabaseValue(value: string): Buffer {
    return Buffer.from(uuidParse(value) as any);
  }

  convertToJSValue(value: Buffer): string {
    return uuidStringify(value as any);
  }

  getColumnType(): string {
    return 'binary(16)';
  }

}

@Entity()
class User {

  @PrimaryKey({ type: UuidBinaryType })
  id!: string;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  const mock = mockLogger(orm);
  await orm.em.insert(User, {
    name: 'Foo',
    email: 'foo',
    id: uuid,
  });

  await orm.em.nativeUpdate('User', { id: uuid }, { name: 'bar', id: uuid });
  const count = await orm.em.count(User, { name: 'bar', id: uuid });
  expect(count).toBe(1);
  await orm.em.nativeDelete('User', { id: uuid });
  const count2 = await orm.em.count(User);
  expect(count2).toBe(0);

  expect(mock.mock.calls).toEqual([
    ['[query] insert into `user` (`name`, `email`, `id`) values (\'Foo\', \'foo\', X\'f47ac10b58cc4372a5670e02b2c3d479\')'],
    ['[query] update `user` set `name` = \'bar\', `id` = X\'f47ac10b58cc4372a5670e02b2c3d479\' where `id` = X\'f47ac10b58cc4372a5670e02b2c3d479\''],
    ['[query] select count(*) as `count` from `user` as `u0` where `u0`.`name` = \'bar\' and `u0`.`id` = X\'f47ac10b58cc4372a5670e02b2c3d479\''],
    ['[query] delete from `user` where `id` = X\'f47ac10b58cc4372a5670e02b2c3d479\''],
    ['[query] select count(*) as `count` from `user` as `u0`'],
  ]);
});
