import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';

@Entity({ tableName: 'name' })
class Name {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany({ entity: 'User', pivotTable: 'userNames', mappedBy: 'names' })
  users = new Collection<User>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity({ tableName: 'user' })
class User {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: 'Name', pivotTable: 'userNames', joinColumn: 'name', inverseJoinColumn: 'user' })
  names = new Collection<Name>(this);

}

describe('GH issue 1346', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Name],
      dbName: `mikro_orm_test_pivot_fields`,
      type: 'postgresql',
    });

    await new SchemaGenerator(orm.em).ensureDatabase();
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('preserve data fields that match pivot field', async () => {
    const user = orm.em.create<User>(User, {});
    const name = orm.em.create<Name>(Name, { name: 'this is my name' });
    user.names.add(name);
    await orm.em.persistAndFlush([user, name]);
    orm.em.clear();

    const entity = await orm.em.findOneOrFail<User>(User, user, { populate: ['names'], refresh: true });
    expect(entity.names[0].name).toEqual('this is my name');
  });

});
