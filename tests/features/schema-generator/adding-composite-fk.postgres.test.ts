import { Cascade, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Country {

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
export class State {

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
export class City {

  @ManyToOne(() => State, { primary: true })
  state!: State;

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
export class User {

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
export class User1 {

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

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [City, User, Country, State],
      dbName: `mikro_orm_test_gh_1687`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator adds the m:1 columns and FK properly', async () => {
    const diff0 = await orm.getSchemaGenerator().getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff0).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff0.up);

    orm.getMetadata().reset('User');
    await orm.discoverEntity(User1);
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff1.up);

    // down
    await orm.getSchemaGenerator().execute(diff1.down);
    await orm.getSchemaGenerator().execute(diff0.down);
  });

});
