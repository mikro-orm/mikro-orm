import { MikroORM, Opt, Ref } from '@mikro-orm/sqlite';
import { Entity, Formula, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Formula(alias => `(CONCAT(${alias}.first_name, ' ',${alias}.last_name))`)
  name!: Opt<string>;

}

@Entity()
class Pet {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => User, { nullable: true, ref: true })
  owner!: Opt<Ref<User>> | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Pet],
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('name formula works', async () => {
  orm.em.create(User, { firstName: 'John', lastName: 'Smith' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { firstName: 'John' });
  expect(user.name).toBe('John Smith');
});

test('formula-based filter works when selecting directly from table', async () => {
  orm.em.addFilter({ name: 'name is Jane Smith', cond: { name: 'Jane Smith' }, entity: [User] });

  orm.em.create(User, { firstName: 'John', lastName: 'Smith' });
  orm.em.create(User, { firstName: 'Jane', lastName: 'Smith' });
  await orm.em.flush();
  orm.em.clear();

  const users = await orm.em.findAll(User);
  expect(users.length).toBe(1);
  expect(users[0].name).toBe('Jane Smith');
});

test('formula-based filter works via populate', async () => {
  orm.em.addFilter({ name: 'name is Jane Smith', cond: { name: 'Jane Smith' }, entity: [User] });

  orm.em.create(Pet, {
    name: 'Spot',
    owner: { firstName: 'John', lastName: 'Smith' },
  });
  orm.em.create(Pet, {
    name: 'Buck',
    owner: { firstName: 'Jane', lastName: 'Smith' },
  });

  await orm.em.flush();
  orm.em.clear();

  const pets = await orm.em.findAll(Pet, {
    populate: ['owner'],
  });

  expect(pets.length).toBe(2);

  const spot = pets.find(p => p.name === 'Spot');
  expect(spot?.owner ?? null).toBeNull();

  const buck = pets.find(p => p.name === 'Buck');
  expect(buck?.owner?.$.name).toBe('Jane Smith');
});
