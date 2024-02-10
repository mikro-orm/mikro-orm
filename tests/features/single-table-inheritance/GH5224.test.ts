import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

abstract class User {

  id!: number;
  name: string;
  version!: number;

  constructor(name: string) {
    this.name = name;
  }

}

class Student extends User {}

class Teacher extends User {}

const userSchema = new EntitySchema<User>({
  class: User,
  abstract: true,
  discriminatorColumn: 'type' as any,
  properties: {
    id: {
      type: Number,
      primary: true,
    },
    name: {
      type: String,
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
  const teacher = new Teacher('John');
  const student = new Student('Eric');
  await orm.em.insertMany([teacher, student]);
  const res = await orm.em.find(User, {});

  expect(res[0]).toEqual({
    id: 1,
    name: 'John',
    version: 1,
  });
  expect(res[1]).toEqual({
    id: 2,
    name: 'Eric',
    version: 1,
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();

  res[0].name = 'new name 1';
  res[1].name = 'new name 2';
  await orm.em.flush();
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('select `u0`.`id` from `user` as `u0` where ((`u0`.`id` = 1 and `u0`.`version` = 1) or (`u0`.`id` = 2 and `u0`.`version` = 1))');
  expect(mock.mock.calls[2][0]).toMatch('update `user` set `name` = case when (`id` = 1) then \'new name 1\' when (`id` = 2) then \'new name 2\' else `name` end, `version` = `version` + 1 where `id` in (1, 2) returning `version`');
  expect(mock.mock.calls[3][0]).toMatch('commit');
});
