import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';

abstract class Common {

  @PrimaryKey()
  orgId!: number;

  @PrimaryKey()
  id!: number;

}

@Entity()
class Form extends Common {

  @Property({ nullable: false })
  name!: string;

}

@Entity()
class FormSubmission extends Common {

  @ManyToOne({
    entity: () => Form,
    ref: true,
    nullable: true,
  })
  form?: Ref<Form>;

}

@Entity()
class FormSubmissionField extends Common {

  @ManyToOne({
    entity: () => FormSubmission,
    ref: true,
  })
  submission!: Ref<FormSubmission>;

  @Property({ nullable: false })
  value!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Form, FormSubmission, FormSubmissionField],
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();

  const form1 = orm.em.create(Form, {
    orgId: 1,
    id: 10,
    name: 'Form 1',
  });

  const submission = orm.em.create(FormSubmission, {
    orgId: 1,
    id: 20,
    form: form1,
  });

  const submissionField = orm.em.create(FormSubmissionField, {
    orgId: 1,
    id: 30,
    submission,
    value: 'James',
  });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('Query through nested relationship', async () => {
  const submissionField = await orm.em.findOneOrFail(
    FormSubmissionField,
    { id: 30 },
    { populate: ['submission.form'] },
  );

  expect(submissionField.submission.$.form?.$.name).toBe('Form 1');
  orm.em.clear();

  const submissionFields = await orm.em.find(
    FormSubmissionField,
    {
      submission: {
        form: {
          orgId: 1,
          id: 10,
        },
      },
    },
  );

  expect(submissionFields).toHaveLength(1);
});
