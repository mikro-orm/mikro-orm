import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

@Entity({ schema: '*' })
class Topic {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Category, e => e.topic)
  category = new Collection<Category>(this);

}

@Entity({ schema: '*' })
class Category {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Topic, { nullable: true })
  topic?: Topic;

}

describe('multiple connected schemas in postgres', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Topic, Category],
      dbName: `mikro_orm_test_multi_schemas2`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();

    for (const ns of ['n2', 'n5']) {
      await orm.schema.execute(`drop schema if exists ${ns} cascade`);
    }

    // `*` schema will be ignored
    await orm.schema.updateSchema();

    // we need to pass schema for book
    await orm.schema.updateSchema({ schema: 'n2' });
    await orm.schema.updateSchema({ schema: 'n5' });
    orm.config.set('schema', 'n2'); // set the schema so we can work with book entities without options param
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(Topic).truncate().execute(); // current schema from config
    await orm.em.createQueryBuilder(Topic).withSchema('n2').truncate().execute();
    await orm.em.createQueryBuilder(Topic).withSchema('n5').truncate().execute();
    await orm.em.createQueryBuilder(Category).truncate().execute(); // current schema from config
    await orm.em.createQueryBuilder(Category).withSchema('n2').truncate().execute();
    await orm.em.createQueryBuilder(Category).withSchema('n5').truncate().execute();
    orm.em.clear();
  });

  test('should same schema', async () => {
    const mock = mockLogger(orm);
    mock.mockReset();

    const fork = orm.em.fork();
    await fork.find(
      Topic,
      { id: 1 },
      {
        populate: ['category'],
        schema: 'n5',
        strategy: LoadStrategy.JOINED,
        fields: ['id', 'category.id'],
      },
    );

    expect(mock.mock.calls[0][0]).toMatch(
      'select "t0"."id", "c1"."id" as "c1__id" from "n5"."topic" as "t0" left join "n5"."category" as "c1" on "t0"."id" = "c1"."topic_id" where "t0"."id" = 1',
    );
  });

  test('should default schema on not define schema', async () => {
    const mock = mockLogger(orm);
    mock.mockReset();

    const fork = orm.em.fork();
    await fork.find(
      Topic,
      { id: 1 },
      {
        fields: ['id'],
      },
    );

    expect(mock.mock.calls[0][0]).toMatch(
      'select "t0"."id" from "n2"."topic" as "t0" where "t0"."id" = 1',
    );
  });
});
