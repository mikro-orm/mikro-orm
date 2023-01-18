import {
  ChangeSetType,
  Entity,
  EventSubscriber, FlushEventArgs,
  Index,
  MikroORM,
  PrimaryKey,
  Property,
  Subscriber, wrap,
} from '@mikro-orm/core';
import { FullTextType, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';

@Entity()
export class Test {

  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ nullable: true })
  clientFirstName?: string;

  @Property({ nullable: true })
  clientMiddleName?: string;

  @Property({ nullable: true })
  clientLastName?: string;

  @Index({ type: 'fulltext' })
  @Property({
    type: FullTextType,
    nullable: true,
    onUpdate: (e: Test) =>
      `${e.clientFirstName || ''} ${e.clientMiddleName || ''} ${e.clientLastName || ''}`
        .replace(/\s+/g, ' ')
        .trim(),
  })
  clientNameFull?: string;

}

@Entity()
export class TestHistory {

  @PrimaryKey()
  id!: string;

  @Property({ nullable: true })
  clientFirstName?: string;

  @Property({ nullable: true })
  clientMiddleName?: string;

  @Property({ nullable: true })
  clientLastName?: string;

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, nullable: true })
  clientNameFull?: string;

}

@Subscriber()
export class CaseHistorySubscriber implements EventSubscriber<Test> {

  async onFlush(args: FlushEventArgs): Promise<void> {
    const changeSets = args.uow.getChangeSets();

    for (const cs of changeSets) {
      if ((cs.type === ChangeSetType.UPDATE || cs.type === ChangeSetType.CREATE) && cs.entity instanceof Test) {
        const record = args.em.create(TestHistory, {
          ...cs.entity,
          id: randomUUID(),
        });
        args.uow.computeChangeSet(record);
      }
    }
  }

}

let orm: MikroORM<PostgreSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Test, TestHistory],
    dbName: `mikro_orm_test_3457`,
    driver: PostgreSqlDriver,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('load entities', async () => {
  const test = new Test();
  await orm.em.fork().persistAndFlush(test);

  const testGet = await orm.em.findOneOrFail(Test, 1);

  wrap(testGet).assign({
    clientFirstName: 'Janet?',
    clientLastName: 'Smith',
  });

  await orm.em.flush();

  const testGet2 = await orm.em.fork().findOneOrFail(Test, 1);
});
