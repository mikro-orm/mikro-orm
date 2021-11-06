import { Entity, PrimaryKey, ManyToOne, IdentifiedReference, Property, MikroORM, wrap, Logger, ObjectBindingPattern } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { SchemaGenerator } from '@mikro-orm/knex';

@Entity()
export class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Test, { nullable: true, wrappedReference: true })
  rootNode?: IdentifiedReference<Test>;

  constructor({ name }: Partial<Test> = {}) {
    this.name = name!;
  }

}

describe('GH issue 610', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Test],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test(`self referencing with Reference wrapper`, async () => {
    const test = new Test();
    test.name = 'hello';
    test.rootNode = wrap(test).toReference();
    orm.em.persist(test);

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `test` (`name`) values (?)');
    expect(mock.mock.calls[2][0]).toMatch('update `test` set `root_node_id` = ? where `id` = ?');
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

  test('GH issue 781', async () => {
    expect(orm.em.getMetadata().get('Test').constructorParams[0]).toBe(ObjectBindingPattern);
    const t1 = orm.em.create(Test, { name: 't1' });
    expect(t1.name).toBe('t1');
  });

});
