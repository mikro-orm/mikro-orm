import {
  BaseEntity,
  Collection,
  Entity,
  Enum,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/postgresql';

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
class ExerciseEntity extends BaseEntity {

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
    dbName: '6357',
    entities: [SubTestEntity, ExerciseEntity],
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('$contains operator on relation property', async () => {
  const subtest = new SubTestEntity();
  subtest.title = 'Subtest One';
  subtest.grades = [SchoolGrade.GradeFour, SchoolGrade.GradeFive];

  for (let i: number = 0; i < 5; i++) {
    const exercise = new ExerciseEntity();
    exercise.subtest = subtest;
    exercise.grades = [SchoolGrade.GradeFour, SchoolGrade.GradeFive];
    subtest.exercises.add(exercise);
  }

  await orm.em.fork().persistAndFlush(subtest);

  const results = await orm.em.find(SubTestEntity, {
      grades: { $contains: [SchoolGrade.GradeFour] },
    },
    {
      populate: ['exercises'],
      populateWhere: {
        exercises: {
          grades: {
            $contains: [SchoolGrade.GradeFour],
          },
        },
      },
    });

  expect(results.length).toBe(1);
});
