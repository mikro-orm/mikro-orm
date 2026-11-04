import { Collection, MikroORM, type Opt } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ discriminatorColumn: 'type', discriminatorMap: { person: 'Person', company: 'Company' } })
class Party {
  @PrimaryKey()
  id!: number;

  @Property()
  type!: string & Opt;

  @Property()
  name!: string;

  @ManyToMany(() => Party)
  related = new Collection<Party>(this);

  @ManyToMany(() => Company)
  employers = new Collection<Company>(this);
}

@Entity()
class Person extends Party {
  @ManyToMany({ entity: () => Person, inversedBy: 'friendOf' })
  friends = new Collection<Person>(this);

  @ManyToMany({ entity: () => Person, mappedBy: 'friends' })
  friendOf = new Collection<Person>(this);
}

@Entity()
class Company extends Party {}

describe.each([
  ['root first', [Party, Person, Company]],
  ['children first', [Person, Company, Party]],
])('STI self-referencing M:N (%s)', (_, entities) => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities, dbName: ':memory:', metadataProvider: ReflectMetadataProvider });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('pivot join columns are distinct and consistent across the hierarchy', () => {
    for (const cls of [Party, Person, Company]) {
      const meta = orm.getMetadata(cls);
      expect(meta.properties.related.joinColumns).toEqual(['party_1_id']);
      expect(meta.properties.related.inverseJoinColumns).toEqual(['party_2_id']);
      expect(meta.properties.employers.joinColumns).toEqual(['party_1_id']);
      expect(meta.properties.employers.inverseJoinColumns).toEqual(['party_2_id']);
    }

    for (const cls of [Party, Person]) {
      const meta = orm.getMetadata(cls as typeof Person);
      expect(meta.properties.friends.joinColumns).toEqual(['party_1_id']);
      expect(meta.properties.friends.inverseJoinColumns).toEqual(['party_2_id']);
      expect(meta.properties.friendOf.joinColumns).toEqual(['party_2_id']);
      expect(meta.properties.friendOf.inverseJoinColumns).toEqual(['party_1_id']);
    }
  });

  test('persists and loads the collections', async () => {
    const em = orm.em.fork();
    const company = em.create(Company, { name: 'acme' });
    const john = em.create(Person, { name: 'john' });
    const jane = em.create(Person, { name: 'jane' });
    john.related.add(company);
    john.employers.add(company);
    john.friends.add(jane);
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(Person, { name: 'john' }, { populate: ['related', 'employers', 'friends'] });
    expect(loaded.related.getItems().map(p => p.name)).toEqual(['acme']);
    expect(loaded.employers.getItems().map(p => p.name)).toEqual(['acme']);
    expect(loaded.friends.getItems().map(p => p.name)).toEqual(['jane']);
    em.clear();

    const loaded2 = await em.findOneOrFail(Person, { name: 'jane' }, { populate: ['friendOf'] });
    expect(loaded2.friendOf.getItems().map(p => p.name)).toEqual(['john']);
  });
});
