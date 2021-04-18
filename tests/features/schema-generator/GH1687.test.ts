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

  @ManyToOne()
  city!: City;

}

describe('adding m:1 with composite PK (FK as PK + scalar PK) (GH 1687, 1695)', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [City, User, Country, State],
      dbName: `mikro_orm_test_gh_1687`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().execute(`
      create table "country" ("id" serial primary key, "name" varchar(255) not null, "currency" varchar(255) not null, "currency_symbol" varchar(255) not null);
      create table "state" ("country_id" int4 not null, "id" int4 not null, "name" varchar(255) not null);
      alter table "state" add constraint "state_pkey" primary key ("country_id", "id");
      create table "city" ("state_country_id" int4 not null, "state_id" int4 not null, "id" int4 not null, "name" varchar(255) not null);
      alter table "city" add constraint "city_pkey" primary key ("state_country_id", "state_id", "id");
      create table "user" ("id" varchar(255) not null, "email" varchar(255) not null, "first_name" varchar(255) null, "last_name" varchar(255) null, "date_of_birth" date null, "created" timestamptz not null, "modified" timestamptz not null, "city_state_country_id" int4 not null, "city_state_id" int4 not null, "city_id" int4 not null);
      alter table "user" add constraint "user_pkey" primary key ("id");
      alter table "state" add constraint "state_country_id_foreign" foreign key ("country_id") references "country" ("id") on update cascade;
      alter table "city" add constraint "city_state_country_id_state_id_foreign" foreign key ("state_country_id", "state_id") references "state" ("country_id", "id") on update cascade;
      alter table "user" add constraint "user_city_state_country_id_city_state_id_city_id_foreign" foreign key ("city_state_country_id", "city_state_id", "city_id") references "city" ("state_country_id", "state_id", "id") on update cascade;
      create index "city_state_country_id_state_id_index" on "city" ("state_country_id", "state_id");
      create index "user_city_state_country_id_city_state_id_city_id_index" on "user" ("city_state_country_id", "city_state_id", "city_id");
    `);
  });

  afterAll(() => orm.close(true));

  test('schema generator adds the m:1 columns and FK properly', async () => {
    const city = new City();
    city.id = 1;
    city.name = 'n';
    city.state = new State();
    city.state.id = 2;
    city.state.name = 's';
    city.state.country = new Country();
    city.state.country.id = 3;
    city.state.country.name = 'c';
    city.state.country.currency = 'c1';
    city.state.country.currencySymbol = 'cs';
    await orm.em.fork().persistAndFlush(city);

    const c = await orm.em.findOneOrFail(City, { id: 1 });
    const u = new User();
    u.id = '1';
    u.city = c;
    u.email = 'e';
    await orm.em.persistAndFlush(u);
    orm.em.clear();

    const c2 = await orm.em.findOneOrFail(City, { id: 1 });
    const u2 = await orm.em.findOneOrFail(User, { city: c2 });
    expect(u2.id).toBe('1');
  });

});
