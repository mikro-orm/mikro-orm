import { Cascade, Collection, Entity, EntityRepositoryType, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { EntityRepository } from '@mikro-orm/postgresql';

// eslint-disable-next-line @typescript-eslint/no-use-before-define
@Entity({ tableName: 'teachers', customRepository: () => TeacherRepository })
class Teacher {

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  [EntityRepositoryType]?: TeacherRepository;

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @OneToMany({ entity: 'Student', mappedBy: 'teacher', orphanRemoval: true, cascade: [Cascade.ALL] })
  students = new Collection<Student>(this);

}

@Entity({ tableName: 'students' })
class Student {

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @ManyToOne(() => Teacher, { name: 'teacherId' })
  teacher!: Teacher;

}

class TeacherRepository extends EntityRepository<Teacher> {

  async getOneWithStudents(id: number): Promise<Teacher | null> {
    return this.createQueryBuilder('teacher')
      .select('*')
      .leftJoinAndSelect('teacher.students', 'students')
      .where({ id })
      .getSingleResult();
  }

  async getAllWithStudents(): Promise<Teacher[]> {
    return this.createQueryBuilder('teacher')
      .select('*')
      .leftJoinAndSelect('teacher.students', 'students')
      .getResult();
  }

}

describe('one to many relations read with query builder in postgresql (GH issue 1231)', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Teacher, Student],
      dbName: 'mikro_orm_test_1231',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();

    const teacher1 = new Teacher('Jolene', 'Smith');
    teacher1.id = 1;
    teacher1.students.add(new Student('Lina', 'Case'), new Student('Artur', 'Reevs'));
    const teacher2 = new Teacher('Jolene 2', 'Smith');
    teacher2.id = 2;
    teacher2.students.add(new Student('Lina 2', 'Case'), new Student('Artur 2', 'Reevs'));
    await orm.em.persistAndFlush([teacher1, teacher2]);
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('load relations by populate', async () => {
    const repository = orm.em.getRepository(Teacher);
    const teacher = await repository.findOneOrFail(1, { populate: ['students'] });
    expect(teacher).toHaveProperty('students');
    expect(teacher.students).toHaveLength(2);
  });

  test('load relations from parent repository 1', async () => {
    const repository = orm.em.getRepository(Teacher);
    const teacher = await repository.getOneWithStudents(1);
    expect(teacher).toHaveProperty('students');
    expect(teacher!.students).toHaveLength(2);
    expect(teacher!.firstName).toBe('Jolene');
    expect(teacher!.students.length).toBe(2);
    expect(teacher!.students[0].firstName).toBe('Lina');
    expect(teacher!.students[1].firstName).toBe('Artur');
  });

  test('load relations from parent repository 2', async () => {
    const repository = orm.em.getRepository(Teacher);
    const teachers = await repository.getAllWithStudents();
    expect(teachers).toHaveLength(2);
    expect(teachers[0].firstName).toBe('Jolene');
    expect(teachers[0].students.length).toBe(2);
    expect(teachers[0].students[0].firstName).toBe('Lina');
    expect(teachers[0].students[1].firstName).toBe('Artur');
    expect(teachers[1].firstName).toBe('Jolene 2');
    expect(teachers[1].students.length).toBe(2);
    expect(teachers[1].students[0].firstName).toBe('Lina 2');
    expect(teachers[1].students[1].firstName).toBe('Artur 2');
  });

});
