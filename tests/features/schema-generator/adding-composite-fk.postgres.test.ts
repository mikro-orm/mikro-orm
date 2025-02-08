import { Cascade, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class Country {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  currency!: string;

  @Property()
  currencySymbol!: string;

  @OneToMany('State', 'country', { cascade: [Cascade.ALL], nullable: true })
  states = new Collection<State>(this);

}

@Entity()
class State {

  @ManyToOne(() => Country, { primary: true })
  country!: Country;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany('City', 'state', { cascade: [Cascade.ALL], nullable: true })
  cities = new Collection<City>(this);

}

@Entity()
class City {

  @ManyToOne(() => State, { primary: true })
  state!: State;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class User {

  @PrimaryKey()
  id!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  first_name?: string;

  @Property({ nullable: true })
  last_name?: string;

  @Property({ columnType: 'date', nullable: true })
  date_of_birth?: Date;

  @Property({ columnType: 'timestamptz', nullable: false })
  created = new Date();

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date().toISOString() })
  modified = new Date();

}

@Entity({ tableName: 'user' })
class User1 {

  @PrimaryKey()
  id!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  first_name?: string;

  @Property({ nullable: true })
  last_name?: string;

  @Property({ columnType: 'date', nullable: true })
  date_of_birth?: Date;

  @Property({ columnType: 'timestamptz', nullable: false })
  created = new Date();

  @Property({ columnType: 'timestamptz', onUpdate: () => new Date().toISOString() })
  modified = new Date();

  @ManyToOne()
  city!: City;

}

describe('adding m:1 with composite PK (FK as PK + scalar PK) (GH 1687)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [City, User, Country, State],
      dbName: `mikro_orm_test_composite_fks`,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator adds the m:1 columns and FK properly', async () => {
    const diff0 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff0).toMatchSnapshot();
    await orm.schema.execute(diff0.up);

    orm.discoverEntity(User1, 'User');
    const diff1 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1.up);

    // down
    await orm.schema.execute(diff1.down);
    await orm.schema.execute(diff0.down);
  });

});
