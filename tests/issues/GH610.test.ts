import { unlinkSync } from 'fs';
import { Entity, PrimaryKey, ManyToOne, IdentifiedReference, Property, MikroORM, wrap, Logger } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Test, { nullable: true, wrappedReference: true })
  rootNode?: IdentifiedReference<Test>;

}

describe('GH issue 610', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Test],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh222.db',
      type: 'sqlite',
      highlight: false,
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`self referencing with Reference wrapper`, async () => {
    const test = new Test();
    test.name = 'hello';
    test.rootNode = wrap(test).toReference();
    orm.em.persist(test);

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `test` (`name`) values (?)');
    expect(mock.mock.calls[2][0]).toMatch('update `test` set `root_node_id` = ? where `id` = ?');
    expect(mock.mock.calls[3][0]).toMatch('commit');
  });

});
