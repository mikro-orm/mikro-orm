import { AbstractNamingStrategy, Collection, Entity, EntityRepository, IdentifiedReference, Logger, ManyToMany, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, PrimaryKeyProp, PrimaryKeyType, Property, Reference } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';

class TestNamingStrategy extends AbstractNamingStrategy {

  classToTableName(entityName: string): string {
    throw new Error('Method not implemented.');
  }

  propertyToColumnName(propertyName: string): string {
    return propertyName;
  }

  referenceColumnName(): string {
    throw new Error('Method not implemented.');
  }

  joinColumnName(propertyName: string): string {
    return propertyName;
  }

  joinTableName(
    sourceEntity: string,
    targetEntity: string,
    propertyName?: string | undefined
  ): string {
    throw new Error('Method not implemented.');
  }

  joinKeyColumnName(entityName: string, referencedColumnName?: string | undefined): string {
    return entityName.toLocaleLowerCase();
  }

}


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

  @ManyToMany({ entity: 'Name', pivotTable: 'userNames' })
  names = new Collection<Name>(this);

}

describe('preserve data fields that match pivot field', () => {

  let orm: MikroORM<AbstractSqlDriver>;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Name],
      dbName: `mikro_orm_test_pivot_fields`,
      type: 'postgresql',
      cache: { enabled: false },
      namingStrategy: TestNamingStrategy,
    });

    await new SchemaGenerator(orm.em).ensureDatabase();
  });


  beforeEach(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('preserves data fields', async () => {
    const user = orm.em.create<User>(User, {});
    const name = orm.em.create<Name>(Name, { name: 'this is my name' });
    user.names.add(name);
    await orm.em.persistAndFlush([user, name]);

    // Ensure we don't get the data from the existing identity map.
    orm.em.clear();

    const entity = await orm.em.findOneOrFail<User>(User, user, { populate: ['names'], refresh: true });
    expect(entity.names[0].name).toEqual('this is my name');
  });

});
