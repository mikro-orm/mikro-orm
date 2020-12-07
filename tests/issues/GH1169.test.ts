import {
  Embeddable,
  Embedded,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

@Embeddable()
class Cat {

  @Property({ type: String })
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Profile {

  @PrimaryKey()
  id!: number;

  @Embedded({ prefix: false, nullable: true })
  pet?: Cat;

  name = 'test';

}

describe('GH issue 1165', () => {
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Cat, Profile],
      dbName: `mikro_orm_test_gh1169`,
      type: 'mysql',
      port: 3307,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => {
    orm.em.clear();
  });

  test('should create a profile', async () => {
    const cat = new Cat('lyly');
    const john = new Profile();
    john.pet = cat;
    await orm.em.persistAndFlush([john]);

    expect(john.id).not.toBe(null);
  });

  test('should query by name', async () => {
    const john = await orm.em.findOneOrFail(Profile, { name: 'test' });

    expect(john).not.toBe(null);
    expect(john.pet).toEqual({
      name: 'lyly',
    });
  });

  test('should update cat name', async () => {
    const j1 = await orm.em.findOneOrFail(Profile, { pet: { name: 'lyly' } });
    expect(j1).not.toBe(null);

    if (j1.pet) { j1.pet.name = 'new-lyly'; }
    await orm.em.persistAndFlush(j1);
    orm.em.clear();

    const j2 = await orm.em.findOneOrFail(Profile, { pet: { name: 'new-lyly' } });

    expect(j2.pet?.name).toEqual('new-lyly');
    expect(j2.name).toEqual('test');
  });

});
