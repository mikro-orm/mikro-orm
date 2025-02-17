import { Embeddable, Embedded, Entity, Enum, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class DueDateEmailData {

  @Property()
  dueDate: Date;

  @Property()
  senderEmail: string;

  constructor(args: { dueDate: Date; senderEmail: string }) {
    this.dueDate = args.dueDate;
    this.senderEmail = args.senderEmail;
  }

}

@Embeddable()
class EmailData {

  @Property()
  sentDate: Date;

  @Property()
  senderEmail: string;

  constructor(args: { sentDate: Date; senderEmail: string }) {
    this.sentDate = args.sentDate;
    this.senderEmail = args.senderEmail;
  }

}

enum WrapperType {
  DUE_DATE = 'DUE_DATE',
  EMAIL = 'EMAIL',
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class PolyEmailDataWrapper {

  @Enum(() => WrapperType)
  type: WrapperType;

  protected constructor(type: WrapperType) {
    this.type = type;
  }

}

@Embeddable({ discriminatorValue: WrapperType.DUE_DATE })
class DueDateEmailDataWrapper extends PolyEmailDataWrapper {

  @Embedded(() => DueDateEmailData)
  sentEmails: DueDateEmailData;

  constructor(args: { sentEmails: DueDateEmailData }) {
    super(WrapperType.DUE_DATE);
    this.sentEmails = args.sentEmails;
  }

}

@Embeddable({ discriminatorValue: WrapperType.EMAIL })
class EmailDataWrapper extends PolyEmailDataWrapper {

  @Embedded(() => EmailData)
  sentEmails: EmailData;

  constructor(args: { sentEmails: EmailData }) {
    super(WrapperType.EMAIL);
    this.sentEmails = args.sentEmails;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => [DueDateEmailDataWrapper, EmailDataWrapper], { nullable: true, object: true })
  email1?: DueDateEmailDataWrapper | EmailDataWrapper;

  @Embedded(() => [DueDateEmailDataWrapper, EmailDataWrapper], { nullable: true, object: false })
  email2?: DueDateEmailDataWrapper | EmailDataWrapper;

  constructor(
    id: number,
    email1: DueDateEmailDataWrapper | EmailDataWrapper,
    email2: DueDateEmailDataWrapper | EmailDataWrapper,
  ) {
    this.id = id;
    this.email1 = email1;
    this.email2 = email2;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      User,
      DueDateEmailData,
      EmailData,
      DueDateEmailDataWrapper,
      EmailDataWrapper,
    ],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('2987', async () => {
  const user1 = new User(
    1,
    new DueDateEmailDataWrapper({
      sentEmails: new DueDateEmailData({
        dueDate: new Date('2024-07-01T20:20:00.000Z'),
        senderEmail: 'foo1',
      }),
    }),
    new DueDateEmailDataWrapper({
      sentEmails: new DueDateEmailData({
        dueDate: new Date('2024-07-01T20:20:00.000Z'),
        senderEmail: 'foo2',
      }),
    }),
  );
  const user2 = new User(
    2,
    new EmailDataWrapper({
      sentEmails: new EmailData({
        sentDate: new Date('2024-07-02T20:20:00.000Z'),
        senderEmail: 'foo3',
      }),
    }),
    new EmailDataWrapper({
      sentEmails: new EmailData({
        sentDate: new Date('2024-07-02T20:20:00.000Z'),
        senderEmail: 'foo4',
      }),
    }),
  );
  const mock = mockLogger(orm);
  await orm.em.persistAndFlush([user1, user2]);
  orm.em.clear();

  const [u1, u2] = await orm.em.findAll(User, { orderBy: { id: 1 } });

  expect(u1.email1).toBeInstanceOf(DueDateEmailDataWrapper);
  expect(u1.email1!.sentEmails).toBeInstanceOf(DueDateEmailData);
  expect(u2.email1).toBeInstanceOf(EmailDataWrapper);
  expect(u2.email1!.sentEmails).toBeInstanceOf(EmailData);
  expect((u1.email1 as DueDateEmailDataWrapper).sentEmails.dueDate).toBeDefined();
  expect((u2.email1 as EmailDataWrapper).sentEmails.sentDate).toBeDefined();
  expect(u1.email2).toBeInstanceOf(DueDateEmailDataWrapper);
  expect(u1.email2!.sentEmails).toBeInstanceOf(DueDateEmailData);
  expect(u2.email2).toBeInstanceOf(EmailDataWrapper);
  expect(u2.email2!.sentEmails).toBeInstanceOf(EmailData);
  expect((u1.email2 as DueDateEmailDataWrapper).sentEmails.dueDate).toBeDefined();
  expect((u2.email2 as EmailDataWrapper).sentEmails.sentDate).toBeDefined();

  (u1.email1 as DueDateEmailDataWrapper).sentEmails.dueDate = new Date('2024-07-03T20:20:00.000Z');
  (u1.email2 as DueDateEmailDataWrapper).sentEmails.dueDate = new Date('2024-07-03T20:20:00.000Z');
  (u2.email1 as EmailDataWrapper).sentEmails.sentDate = new Date('2024-07-04T20:20:00.000Z');
  (u2.email2 as EmailDataWrapper).sentEmails.sentDate = new Date('2024-07-04T20:20:00.000Z');

  await orm.em.flush();
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch(`insert into \`user\` (\`id\`, \`email1\`, \`email2_type\`, \`email2_sent_emails_due_date\`, \`email2_sent_emails_sender_email\`, \`email2_sent_emails_sent_date\`) values (1, '{"type":"DUE_DATE","sent_emails":{"dueDate":"2024-07-01T20:20:00.000Z","sender_email":"foo1"}}', 'DUE_DATE', 1719865200000, 'foo2', NULL), (2, '{"type":"EMAIL","sent_emails":{"sent_date":"2024-07-02T20:20:00.000Z","sender_email":"foo3"}}', 'EMAIL', NULL, 'foo4', 1719951600000)`);
  expect(mock.mock.calls[2][0]).toMatch('commit');
  expect(mock.mock.calls[3][0]).toMatch('select `u0`.* from `user` as `u0` order by `u0`.`id` asc');
  expect(mock.mock.calls[4][0]).toMatch('begin');
  expect(mock.mock.calls[5][0]).toMatch('update `user` set `email1` = case when (`id` = 1) then \'{"type":"DUE_DATE","sent_emails":{"dueDate":"2024-07-03T20:20:00.000Z","sender_email":"foo1"}}\' when (`id` = 2) then \'{"type":"EMAIL","sent_emails":{"sent_date":"2024-07-04T20:20:00.000Z","sender_email":"foo3"}}\' else `email1` end, `email2_sent_emails_due_date` = case when (`id` = 1) then 1720038000000 else `email2_sent_emails_due_date` end, `email2_sent_emails_sent_date` = case when (`id` = 2) then 1720124400000 else `email2_sent_emails_sent_date` end where `id` in (1, 2)');
  expect(mock.mock.calls[6][0]).toMatch('commit');
});
