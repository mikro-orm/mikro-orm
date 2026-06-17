import { Collection, Entity, Enum, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';

enum SchoolGrade {
  GradeOne = '1',
  GradeTwo = '2',
  GradeThree = '3',
  GradeFour = '4',
  GradeFive = '5',
  GradeSix = '6',
}

@Entity({ tableName: 'subtests' })
class SubTestEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Enum({ items: () => SchoolGrade, array: true })
  grades!: SchoolGrade[];

  @OneToMany(() => ExerciseEntity, exercise => exercise.subtest)
  exercises = new Collection<ExerciseEntity>(this);

}

@Entity({ tableName: 'exercises' })
class ExerciseEntity {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => SchoolGrade, array: true })
  grades!: SchoolGrade[];

  @ManyToOne(() => SubTestEntity)
  subtest!: SubTestEntity;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '7899',
    entities: [SubTestEntity, ExerciseEntity],
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

// a multi-element array operator nested under a relation lands in the JOIN-ON
// condition and must serialize as an array literal, not a record tuple
test('multi-element $contains on relation property in populateWhere (m:1 side)', async () => {
  const subtest = new SubTestEntity();
  subtest.title = 'Subtest One';
  subtest.grades = [SchoolGrade.GradeFour, SchoolGrade.GradeFive];

  for (let i = 0; i < 5; i++) {
    const exercise = new ExerciseEntity();
    exercise.subtest = subtest;
    exercise.grades = [SchoolGrade.GradeFour, SchoolGrade.GradeFive];
    subtest.exercises.add(exercise);
  }

  await orm.em.fork().persistAndFlush(subtest);

  const res = await orm.em.fork().find(
    ExerciseEntity,
    {},
    {
      populate: ['subtest'],
      populateWhere: {
        subtest: {
          grades: {
            $contains: [SchoolGrade.GradeFour, SchoolGrade.GradeFive],
          },
        },
      },
    },
  );

  expect(res).toHaveLength(5);
});
