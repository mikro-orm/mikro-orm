import { Entity, ManyToMany, OneToOne, PrimaryKey, Property, Collection, LoadStrategy, MikroORM, Ref } from '@mikro-orm/postgresql';

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Question {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @Property()
  answer!: string;

  @ManyToMany({
    entity: () => Tag,
    pivotTable: 'question_tags',
    joinColumn: 'question_id',
    inverseJoinColumn: 'tag_id',
  })
  tags = new Collection<Tag>(this);

}

@Entity()
class ReferenceMaterial {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @ManyToMany({
    entity: () => Tag,
    pivotTable: 'reference_material_tags',
    joinColumn: 'reference_material_id',
    inverseJoinColumn: 'tag_id',
  })
  tags = new Collection<Tag>(this);

}

@Entity({
  expression: `SELECT
    id as question_id,
    NULL as reference_material_id,
    CONCAT('questions-', id) as id
    FROM question
    UNION ALL
    SELECT
    NULL as question_id,
    id as reference_material_id,
    CONCAT('reference_materials-', id) as id
    FROM reference_material`,
})
class SearchResult {

  @Property({ type: 'text' })
  id!: string;

  @OneToOne({ entity: () => Question, joinColumn: 'question_id', nullable: true, ref: true })
  question?: Ref<Question>;

  @OneToOne({ entity: () => ReferenceMaterial, joinColumn: 'reference_material_id', nullable: true, ref: true })
  referenceMaterial?: Ref<ReferenceMaterial>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh7195',
    entities: [Tag, Question, ReferenceMaterial, SearchResult],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.schema.dropSchema({ dropDb: true });
  await orm.close(true);
});

test('GH #7195 - virtual entity with limit and nested ManyToMany filter', async () => {
  const em = orm.em.fork();

  const geo = em.create(Tag, { name: 'geography' });
  const science = em.create(Tag, { name: 'science' });
  const history = em.create(Tag, { name: 'history' });

  const q1 = em.create(Question, { text: 'What is the capital of France?', answer: 'Paris' });
  const q2 = em.create(Question, { text: 'What is H2O?', answer: 'Water' });
  q1.tags.add(geo, history);
  q2.tags.add(science);

  const r1 = em.create(ReferenceMaterial, { text: 'France is a country in Europe.' });
  const r2 = em.create(ReferenceMaterial, { text: 'The periodic table.' });
  r1.tags.add(geo);
  r2.tags.add(science, history);

  await em.flush();

  // Without limit - balanced strategy
  const [results1, count1] = await em.fork().findAndCount(
    SearchResult,
    {
      $or: [
        { question: { tags: { name: 'geography' } } },
        { referenceMaterial: { tags: { name: 'geography' } } },
      ],
    },
    {
      populate: ['question', 'referenceMaterial', 'question.tags', 'referenceMaterial.tags'],
    },
  );

  expect(results1).toHaveLength(2);
  expect(count1).toBe(2);

  // With limit - balanced strategy (default in v7)
  const [results2, count2] = await em.fork().findAndCount(
    SearchResult,
    {
      $or: [
        { question: { tags: { name: 'geography' } } },
        { referenceMaterial: { tags: { name: 'geography' } } },
      ],
    },
    {
      limit: 10,
      populate: ['question', 'referenceMaterial', 'question.tags', 'referenceMaterial.tags'],
    },
  );

  expect(results2).toHaveLength(2);
  expect(count2).toBe(2);

  // With limit - joined strategy (to-many joins should be forced to balanced for virtual entities)
  const [results3, count3] = await em.fork().findAndCount(
    SearchResult,
    {
      $or: [
        { question: { tags: { name: 'geography' } } },
        { referenceMaterial: { tags: { name: 'geography' } } },
      ],
    },
    {
      limit: 10,
      populate: ['question', 'referenceMaterial', 'question.tags', 'referenceMaterial.tags'],
      strategy: LoadStrategy.JOINED,
    },
  );

  expect(results3).toHaveLength(2);
  expect(count3).toBe(2);

  // With limit and offset - joined strategy
  const [results4, count4] = await em.fork().findAndCount(
    SearchResult,
    {
      $or: [
        { question: { tags: { name: 'geography' } } },
        { referenceMaterial: { tags: { name: 'geography' } } },
      ],
    },
    {
      limit: 1,
      offset: 0,
      populate: ['question', 'referenceMaterial', 'question.tags', 'referenceMaterial.tags'],
      strategy: LoadStrategy.JOINED,
    },
  );

  expect(results4).toHaveLength(1);
  expect(count4).toBe(2);

  // Just em.find with limit and joined strategy
  const results5 = await em.fork().find(
    SearchResult,
    {
      $or: [
        { question: { tags: { name: 'geography' } } },
        { referenceMaterial: { tags: { name: 'geography' } } },
      ],
    },
    {
      limit: 10,
      populate: ['question', 'referenceMaterial', 'question.tags', 'referenceMaterial.tags'],
      strategy: LoadStrategy.JOINED,
    },
  );

  expect(results5).toHaveLength(2);
});
