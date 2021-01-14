import { Collection, Entity, Logger, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';


@Entity({ tableName: 'very_long_table_name_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })
class ChildEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ type: 'ParentEntity' })
  parent!: any;

}

@Entity()
class ParentEntity {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => ChildEntity, mappedBy: 'parent' })
  children = new Collection<ChildEntity>(this);

}

describe('GH issue 1271', () => {
  let orm: MikroORM<AbstractSqlDriver>;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ParentEntity, ChildEntity],
      dbName: `mikro_orm_test_gh_1271`,
      port: 3307,
      type: 'mysql',
      cache: { enabled: false },
    });
    const logger = new Logger(log, ['query', 'query-params']);
    Object.assign(orm.config, { logger });

    await new SchemaGenerator(orm.em).ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
  });

  afterAll(() => orm.close(true));

  test('Index and FK names should be a max of 64 chars in mysql', async () => {
    const sql = await orm.getSchemaGenerator().getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
    await orm.getSchemaGenerator().createSchema();
  });
});
