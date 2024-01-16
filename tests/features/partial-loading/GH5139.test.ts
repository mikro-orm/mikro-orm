import {
  Entity,
  Ref,
  ManyToOne,
  MikroORM,
  PrimaryKey, OneToMany, Collection,
} from '@mikro-orm/sqlite';

@Entity()
class City  {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => School, s => s.city)
  schools = new Collection<School>(this);

}

@Entity()
class School {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => City, { ref: true })
  city!: Ref<City>;

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [City],
  });
  await orm.schema.createSchema();

  await orm.em.insert(City, { id: 1 });
  await orm.em.insertMany(School, [
    { id: 1, city: 1 },
    { id: 2, city: 1 },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 5139`, async () => {
  const city = await orm.em.find(City, { id: 1 }, { fields: ['*'] });
  expect(city[0].schools.isInitialized()).toBe(false);
});
