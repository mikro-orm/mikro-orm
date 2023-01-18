import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { MySqlDriver } from '@mikro-orm/mysql';


@Entity({ tableName: 'very_long_table_name_64_chars_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })
class ChildEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ type: 'ParentEntity' })
  parent!: any;

  @Property({ unique: true })
  key!: string;

}

@Entity()
class ParentEntity {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => ChildEntity, mappedBy: 'parent' })
  children = new Collection<ChildEntity>(this);

}

describe('index and FK names should be a max of 64 chars in mysql (GH 1271)', () => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ParentEntity, ChildEntity],
      dbName: `mikro_orm_test_gh_1271`,
      port: 3308,
      driver: MySqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
  });

  afterAll(() => orm.close(true));

  test('index and FK names should be a max of 64 chars in mysql', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
    await orm.schema.execute(sql);
  });

});
