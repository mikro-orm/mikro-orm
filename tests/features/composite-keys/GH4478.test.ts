import { Entity, PrimaryKey, ManyToOne, SimpleLogger, PrimaryKeyProp, wrap } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class School {

  @PrimaryKey()
  schoolCode!: string;

}

@Entity()
class Class {

  [PrimaryKeyProp]?: ['school', 'academicYear', 'classCode'];

  @ManyToOne(() => School, { name: 'school_code', primary: true })
  school!: School;

  @PrimaryKey()
  academicYear!: string;

  @PrimaryKey()
  classCode!: string;

}

@Entity()
class StudentAllocation {

  [PrimaryKeyProp]?: ['studentId', 'academicYear'];

  @PrimaryKey()
  studentId!: string;

  @PrimaryKey()
  academicYear!: string;

  @ManyToOne(() => School, { name: 'school_code' })
  school!: School;

  @ManyToOne(() => Class, { fieldNames: ['school_code', 'academic_year', 'class_code'], nullable: true })
  class?: Class;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [StudentAllocation],
    dbName: `:memory:`,
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test(`GH issue 4478`, async () => {
  expect(await orm.schema.getCreateSchemaSQL()).toMatchSnapshot();

  const school = orm.em.create(School, { schoolCode: 'abc' });
  orm.em.create(StudentAllocation, { studentId: '1', academicYear: '2023', school });
  orm.em.create(StudentAllocation, {
    studentId: '2',
    academicYear: '2023',
    school,
    class: { school, classCode: 'cls', academicYear: '2023' },
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toMatchSnapshot();
  orm.em.clear();

  const sa = await orm.em.find(StudentAllocation, { academicYear: '2023' }, { populate: ['*'] });
  expect(wrap(sa[0]).toObject()).toEqual({
    academicYear: '2023',
    school: {
      schoolCode: 'abc',
    },
    studentId: '1',
  });

  expect(wrap(sa[1]).toObject()).toEqual({
    academicYear: '2023',
    class: {
      academicYear: '2023',
      classCode: 'cls',
      school: {
        schoolCode: 'abc',
      },
    },
    school: {
      schoolCode: 'abc',
    },
    studentId: '2',
  });
});
