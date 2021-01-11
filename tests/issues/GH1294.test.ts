import { Collection, Entity, EntityRepository, IdentifiedReference, Logger, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, PrimaryKeyProp, PrimaryKeyType, Property, Reference } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

class ARepository extends EntityRepository<A> { }

describe('GH issue 1294', () => {

  let orm: MikroORM<AbstractSqlDriver>;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_gh_1294`,
      type: 'postgresql',
      cache: { enabled: false },
    });
    const logger = new Logger(log, ['query', 'query-params']);
    Object.assign(orm.config, { logger });

    await new SchemaGenerator(orm.em).ensureDatabase();
  });


  beforeEach(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('doesn\'t remove fields from data model', async () => {
    const dataModel = {
      name: 'this is my name',
    };

    const repository = new ARepository(orm.em, A);

    const entity = repository.create(dataModel);
    expect(dataModel.name).toEqual('this is my name');
  });

});
