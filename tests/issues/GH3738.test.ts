import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany, OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';

@Entity()
export class Question {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @PrimaryKey({ length: 6 })
  createdAt: Date = new Date();

  @OneToMany(() => Answer, answer => answer.question)
  answers: Collection<Answer> = new Collection<Answer>(this);

  @Property({ length: 255 })
  name!: string;

}

@Entity()
export class Answer {

  [OptionalProps]?: 'createdAt';

  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @PrimaryKey({ length: 6 })
  createdAt: Date = new Date();

  @ManyToOne({ entity: () => Question })
  question!: Question;

}

describe('GH issue 3738', () => {

  let orm: MikroORM;
  let question: Question;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Answer, Question],
      dbName: ':memory:',
      type: 'sqlite',
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.schema.createSchema();

    question = orm.em.create(Question, { answers: [{}], name: 'test question' });
    await orm.em.flush();
  });

  afterAll(() => orm.close(true));

  test('test with populate', async () => {
    const foundWithPopulate = await orm.em.find(Answer, { question }, { populate: ['question'] });
    expect(foundWithPopulate[0]).toBeDefined();
  });

  test('test without populate', async () => {
    const foundWithoutPopulate = await orm.em.find(Answer, { question });
    expect(foundWithoutPopulate[0]).toBeDefined();
  });

  test('test with query builder 1', async () => {
    const foundWithQb = await orm.em.createQueryBuilder(Answer).where({ question }).getResult();
    expect(foundWithQb).toBeDefined();
    await orm.em.populate(foundWithQb, ['question']);
    expect(foundWithQb[0].question).toBeDefined();
  });

  test('test with query builder 2', async () => {
    const foundWithQb = await orm.em.createQueryBuilder(Answer).leftJoin('question', 'q').where({ question }).getResult();
    expect(foundWithQb).toBeDefined();
    expect(foundWithQb[0].question).toBeDefined();
  });
});
