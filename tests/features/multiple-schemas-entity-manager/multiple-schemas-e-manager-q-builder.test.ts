import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity({ schema: 'n2' })
class Domain {

  @PrimaryKey()
  id!: number;

  @Property()
  scope!: string;

  @OneToMany(() => SubDomain, e => e.domain)
  subDomain = new Collection<SubDomain>(this);

}
@Entity({ schema: '*' })
class SubDomain {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Domain, { nullable: true })
  domain?: Domain;

}


@Entity({ schema: '*' })
class Topic {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Category, e => e.topic)
  category = new Collection<Category>(this);

  @OneToOne(() => Domain, { nullable: true })
  domain?: Domain;

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
      entities: [Domain, Topic, Category, SubDomain],
      dbName: `mikro_orm_test_multi_schemas`,
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
    await orm.em.createQueryBuilder(Domain).truncate().execute(); // current schema from config
    await orm.em.createQueryBuilder(Domain).withSchema('n2').truncate().execute();
    orm.em.clear();
  });

  test('with fork schema', async () => {
    const mock = mockLogger(orm);
    mock.mockReset();

    const fork = orm.em.fork({ schema: 'n5' });

    await fork
      .getRepository(Category)
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.topic', 'topic')
      .execute();

    await fork
      .getRepository(Topic)
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.domain', 'domain')
      .execute();

    /**
     * All * entities should use schema set in EntityManager
     * All entities will set schema(domain) should use the set schema
     */
    expect(mock.mock.calls[0][0]).toMatch(
      'select "category".*, "topic"."id" as "topic__id", "topic"."name" as "topic__name", "topic"."domain_id" as "topic__domain_id" from "n5"."category" as "category" left join "n5"."topic" as "topic" on "category"."topic_id" = "topic"."id"',
    );
    expect(mock.mock.calls[1][0]).toMatch(
      'select "topic".*, "category"."id" as "category__id", "category"."topic_id" as "category__topic_id", "domain"."id" as "domain__id", "domain"."scope" as "domain__scope" from "n5"."topic" as "topic" left join "n5"."category" as "category" on "topic"."id" = "category"."topic_id" left join "n2"."domain" as "domain" on "topic"."domain_id" = "domain"."id"',
    );
  });

  test('with schema differ from fork schema', async () => {
    const mock = mockLogger(orm);
    mock.mockReset();

    const fork = orm.em.fork({ schema: 'n5' });

    await fork
      .getRepository(Category)
      .createQueryBuilder('category')
      .withSchema('n2')
      .leftJoinAndSelect('category.topic', 'topic')
      .execute();

    await fork
      .getRepository(Topic)
      .createQueryBuilder('topic')
      .withSchema('n2')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.domain', 'domain')
      .execute();

    /**
     * withSchema triumphs all
     * n2 should be used for all entities
     */
    expect(mock.mock.calls[0][0]).toMatch(
      'select "category".*, "topic"."id" as "topic__id", "topic"."name" as "topic__name", "topic"."domain_id" as "topic__domain_id" from "n2"."category" as "category" left join "n2"."topic" as "topic" on "category"."topic_id" = "topic"."id"',
    );
    expect(mock.mock.calls[1][0]).toMatch(
      'select "topic".*, "category"."id" as "category__id", "category"."topic_id" as "category__topic_id", "domain"."id" as "domain__id", "domain"."scope" as "domain__scope" from "n2"."topic" as "topic" left join "n2"."category" as "category" on "topic"."id" = "category"."topic_id" left join "n2"."domain" as "domain" on "topic"."domain_id" = "domain"."id"',
    );
  });

  test('should default schema on not define schema', async () => {
    const mock = mockLogger(orm);
    mock.mockReset();

    const fork = orm.em.fork();

    await fork
      .getRepository(Category)
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.topic', 'topic')
      .execute();

    await fork
      .getRepository(Topic)
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.category', 'category')
      .leftJoinAndSelect('topic.domain', 'domain')
      .execute();

    /**
     * Nothing set, should default to entities.schema or if * is used, to schema set on orm
     */
    expect(mock.mock.calls[0][0]).toMatch(
      'select "category".*, "topic"."id" as "topic__id", "topic"."name" as "topic__name", "topic"."domain_id" as "topic__domain_id" from "n2"."category" as "category" left join "n2"."topic" as "topic" on "category"."topic_id" = "topic"."id"',
    );
    expect(mock.mock.calls[1][0]).toMatch(
      'select "topic".*, "category"."id" as "category__id", "category"."topic_id" as "category__topic_id", "domain"."id" as "domain__id", "domain"."scope" as "domain__scope" from "n2"."topic" as "topic" left join "n2"."category" as "category" on "topic"."id" = "category"."topic_id" left join "n2"."domain" as "domain" on "topic"."domain_id" = "domain"."id"',
    );
  });

  test('join table in different schema', async () => {
    const mock = mockLogger(orm);
    mock.mockReset();

    await orm.em.fork({ schema: 'n5' })
      .getRepository(Domain)
      .createQueryBuilder('domain')
      .leftJoinAndSelect('domain.subDomain', 'subDomain')
      .execute();

    /**
     * Domain is set to n2 and should join to n2
     * SubDomain is set to * and should default to entityManager.schema (n5)
     */
    expect(mock.mock.calls[0][0]).toMatch(
      'select "domain".*, "subDomain"."id" as "subDomain__id", "subDomain"."name" as "subDomain__name", "subDomain"."domain_id" as "subDomain__domain_id" from "n2"."domain" as "domain" left join "n5"."sub_domain" as "subDomain" on "domain"."id" = "subDomain"."domain_id"',
    );

    orm.config.set('schema', 'n5');
    const fork = orm.em.fork();
    await fork
      .getRepository(Domain)
      .createQueryBuilder('domain')
      .leftJoinAndSelect('domain.subDomain', 'subDomain')
      .execute();

    /**
     * Domain is set to n2 and should join to n2
     * SubDomain is set to * and should default to orm schema (n5)
     */
    expect(mock.mock.calls[1][0]).toMatch(
      'select "domain".*, "subDomain"."id" as "subDomain__id", "subDomain"."name" as "subDomain__name", "subDomain"."domain_id" as "subDomain__domain_id" from "n2"."domain" as "domain" left join "n5"."sub_domain" as "subDomain" on "domain"."id" = "subDomain"."domain_id"',
    );
  });
});
