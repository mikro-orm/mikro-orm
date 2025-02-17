import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

abstract class User {

  id!: number;
  name: string;
  email: Email;
  version!: number;

  constructor(name: string, email: Email) {
    this.name = name;
    this.email = email;
  }

}

class Student extends User {}

class Teacher extends User {}

class Email {

  static regExEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  value: string;

  constructor(value: string) {
    if (!Email.regExEmail.test(value)) {
      throw new Error('Invalid email');
    }

    this.value = value;
  }

}

const userSchema = new EntitySchema<User>({
  class: User,
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    id: {
      type: Number,
      primary: true,
    },
    name: {
      type: String,
    },
    email: {
      kind: 'embedded',
      entity: () => Email,
      prefix: false,
    },
    version: {
      type: Number,
      version: true,
    },
  },
});

const studentSchema = new EntitySchema<Student, User>({
  class: Student,
  extends: userSchema,
  discriminatorValue: 'student',
});

const teacherSchema = new EntitySchema<Teacher, User>({
  class: Teacher,
  extends: userSchema,
  discriminatorValue: 'teacher',
});

const emailSchema = new EntitySchema<Email>({
  class: Email,
  embeddable: true,
  properties: {
    value: {
      fieldName: 'email',
      type: String,
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [userSchema, studentSchema, teacherSchema],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});
afterAll(() => orm.close());

test('optimistic locks and STI', async () => {
  const teacher = new Teacher('John', new Email('john@foo.bar'));
  const student = new Student('Eric', new Email('eric@foo.bar'));
  await orm.em.insertMany([teacher, student]);
  const res = await orm.em.find(User, {});

  expect(res[0]).toEqual({
    id: 1,
    name: 'John',
    email: {
      value: 'john@foo.bar',
    },
    version: 1,
  });
  expect(res[1]).toEqual({
    id: 2,
    name: 'Eric',
    email: {
      value: 'eric@foo.bar',
    },
    version: 1,
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();

  res[0].name = 'new name 1';
  res[1].name = 'new name 2';
  await orm.em.flush();
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('select `u0`.`id`, `u0`.`type` from `user` as `u0` where ((`u0`.`id` = 1 and `u0`.`version` = 1) or (`u0`.`id` = 2 and `u0`.`version` = 1))');
  expect(mock.mock.calls[2][0]).toMatch('update `user` set `name` = case when (`id` = 1) then \'new name 1\' when (`id` = 2) then \'new name 2\' else `name` end, `version` = `version` + 1 where `id` in (1, 2) returning `id`, `version`');
  expect(mock.mock.calls[3][0]).toMatch('commit');
});
