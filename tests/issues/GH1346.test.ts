import { Collection, MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Name],
      dbName: `mikro_orm_test_pivot_fields`,
    });

    await orm.schema.ensureDatabase();
  });

  beforeEach(async () => {
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('preserve data fields that match pivot field', async () => {
    const user = orm.em.create(User, {});
    const name = orm.em.create(Name, { name: 'this is my name' });
    user.names.add(name);
    await orm.em.persistAndFlush([user, name]);
    orm.em.clear();

    const entity = await orm.em.findOneOrFail(User, user, { populate: ['names'] });
    expect(entity.names[0].name).toEqual('this is my name');
  });

});
