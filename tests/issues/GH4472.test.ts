import {
  Collection,
  Entity,
  Enum,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity({ schema: '*' })
class Topic {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum({
    nativeEnumName: 'enum_type_local_schema',
    items: ['foo', 'bar'],
  })
  enum1?: 'foo' | 'bar';

  @Enum({
    nativeEnumName: 'n1.enum_type_specific_schema',
    items: ['foo', 'bar'],
  })
  enum2?: 'foo' | 'bar';

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

    for (const ns of ['n1', 'n2', 'n5']) {
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

  test('#5456', async () => {
    await orm.schema.execute(`drop schema if exists n1 cascade`);
    await orm.schema.execute(`drop schema if exists n2 cascade`);

    const sql = await orm.schema.getCreateSchemaSQL({ schema: 'n2', wrap: false });
    expect(sql).toMatch(`create schema if not exists "n1";
create schema if not exists "n2";
create type "n2"."enum_type_local_schema" as enum ('foo', 'bar');
create type "n1"."enum_type_specific_schema" as enum ('foo', 'bar');
create table "n2"."topic" ("id" serial primary key, "name" varchar(255) not null, "enum1" "n2"."enum_type_local_schema" not null, "enum2" "n1"."enum_type_specific_schema" not null);

create table "n2"."category" ("id" serial primary key, "topic_id" int null);

alter table "n2"."category" add constraint "category_topic_id_foreign" foreign key ("topic_id") references "n2"."topic" ("id") on update cascade on delete set null;`);

    const diff = await orm.schema.getUpdateSchemaSQL({ schema: 'n2', wrap: false });
    expect(diff).toMatch(`create schema if not exists "n1";
create schema if not exists "n2";
create type "n2"."enum_type_local_schema" as enum ('foo', 'bar');
create type "n1"."enum_type_specific_schema" as enum ('foo', 'bar');
create table "n2"."topic" ("id" serial primary key, "name" varchar(255) not null, "enum1" "n2"."enum_type_local_schema" not null, "enum2" "n1"."enum_type_specific_schema" not null);

create table "n2"."category" ("id" serial primary key, "topic_id" int null);

alter table "n2"."category" add constraint "category_topic_id_foreign" foreign key ("topic_id") references "n2"."topic" ("id") on update cascade on delete set null;`);

    await orm.schema.updateSchema({ schema: 'n2' });
    const diff2 = await orm.schema.getUpdateSchemaSQL({ schema: 'n2', wrap: false });
    expect(diff2).toBe('');

    orm.getMetadata(Topic).properties.enum1.items!.push('baz');
    // TODO how to handle updates to the n1 enum?
    // orm.getMetadata(Topic).properties.enum2.items!.push('baz');

    const diff4 = await orm.schema.getUpdateSchemaSQL({ schema: 'n2', wrap: false });
    expect(diff4).toBe(`alter type "n2"."enum_type_local_schema" add value if not exists 'baz' after 'bar';\n`);
    await orm.em.execute(diff4);

    const diff5 = await orm.schema.getUpdateSchemaSQL({ schema: 'n2', wrap: false });
    expect(diff5).toBe('');
  });
});
