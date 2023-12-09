import { Email, Entity, PrimaryKey, Property, SimpleLogger, ValueObject } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  email?: Email;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('should create with Vo', async () => {
  const email = Email.from('test@test.com');
  const mock = mockLogger(orm);
  const user = orm.em.repo(User).create({ email: 'test@test.com' });
  await orm.em.flush();

  expect(email.equals(user.email!)).toBe(true);

  expect(mock.mock.calls).toEqual([
    [
      '[query] begin',
    ],
    [
      "[query] insert into `user` (`email`) values ('test@test.com') returning `id`",
    ],
    [
      '[query] commit',
    ],
  ]);
});

test('should find with Vo', async () => {
  orm.em.repo(User).create({ email: 'test@test.com' });
  const email = Email.from('test@test.com');
  await orm.em.flush();

  const found = await orm.em.findOne(User, {
    email: 'test@test.com',
  });

  expect(found).toBeDefined();
  expect(found!.email!.equals(email)).toBe(true);
});

test('should throw error in Vo', async () => {
  expect(() => {
    orm.em.repo(User).create({ email: 'invalidEmail' });
  }).toThrow('Invalid value for Email');
});

test('should throw error in MaxLength', async () => {
  class TestVo extends ValueObject<string, TestVo> {

    protected validate(value: string): boolean {
      this.max = 5;
      return true;
    }

  }


  expect(() => {
    TestVo.from('123456');
  }).toThrow();
})

test('should throw error in min', async () => {
  class TestVo extends ValueObject<string, TestVo> {

    protected validate(value: string): boolean {
      this.min = 6;
      return true;
    }

  }


  expect(() => {
    TestVo.from('12345');
  }).toThrow();
})

test('should throw error in min number', async () => {
  class TestVo extends ValueObject<number, TestVo> {

    protected validate(value: number): boolean {
      this.min = 6;
      return true;
    }

  }


  expect(() => {
    TestVo.from(5);
  }).toThrow();
})

test('should throw error in max number', async () => {
  class TestVo extends ValueObject<number, TestVo> {

    protected validate(value: number): boolean {
      this.max = 6;
      return true;
    }

  }


  expect(() => {
    TestVo.from(7);
  }).toThrow();
})

test('should throw error in float number precision', async () => {
  class TestVo extends ValueObject<number, TestVo> {

    protected validate(value: number): boolean {
      this.precision = 3;
      this.scale = 2;
      return true;
    }

  }


  expect(() => {
    TestVo.from(123.456);
  }).toThrow();
  expect(() => {
    TestVo.from(1123.56);
  }).toThrow();
})
