import { MikroORM, ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

// ---------------------------------------------------------------------------
// TPT hierarchy: Animal (abstract) -> Dog, Cat (concrete)
// ---------------------------------------------------------------------------

@Entity({ inheritance: 'tpt' })
abstract class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;
}

@Entity()
class Cat extends Animal {
  @Property()
  indoor!: boolean;
}

// Multi-level TPT: GermanShepherd extends Dog extends Animal
@Entity()
class GermanShepherd extends Dog {
  @Property()
  lineage!: string;
}

// ---------------------------------------------------------------------------
// Simple entities used in the polymorphic union
// ---------------------------------------------------------------------------

@Entity()
class Person {
  @PrimaryKey()
  id!: number;

  @Property()
  personName!: string;
}

@Entity()
class Shelter {
  @PrimaryKey()
  id!: number;

  @Property()
  location!: string;
}

// ---------------------------------------------------------------------------
// Entity with a polymorphic manyToOne that includes the abstract TPT root
// ---------------------------------------------------------------------------

@Entity()
class Activity {
  @PrimaryKey()
  id!: number;

  @Property()
  description!: string;

  // Polymorphic relation — subject can be an Animal, Person, or Shelter.
  // Animal is a TPT entity with concrete subclasses Dog and Cat.
  @ManyToOne(() => [Animal, Person, Shelter], { nullable: true })
  subject?: Animal | Person | Shelter | null;
}

describe('polymorphic relations with TPT targets', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Animal, Dog, Cat, GermanShepherd, Person, Shelter, Activity],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  // -------------------------------------------------------------------------
  // Bug 1: INSERT — When assigning a TPT child (Dog) as a polymorphic ref
  // that lists the abstract parent (Animal), MikroORM should resolve the
  // discriminator to the TPT root's table name ('animal'), not null.
  // -------------------------------------------------------------------------

  test('INSERT: discriminator is set correctly for TPT child entities', async () => {
    const mock = mockLogger(orm);

    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'German Shepherd' });
    await orm.em.flush();

    // @ts-expect-error Dog extends Animal which is in the union, but
    // MikroORM's types don't account for TPT subclasses in polymorphic unions.
    orm.em.create(Activity, {
      description: 'Adopted a dog',
      subject: ref(dog),
    });
    await orm.em.flush();
    orm.em.clear();

    // Verify the SQL wrote 'animal' as the discriminator, not null
    const insertActivityQuery = mock.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('insert into `activity`'),
    );
    expect(insertActivityQuery).toBeDefined();
    expect(insertActivityQuery![0]).toContain("'animal'");

    // Verify we can read back the activity with its subject
    const activity = await orm.em.findOneOrFail(Activity, { description: 'Adopted a dog' });
    expect(activity.subject).toBeDefined();
  });

  test('INSERT: discriminator works for non-TPT entities in the same union', async () => {
    const person = orm.em.create(Person, { personName: 'Alice' });
    await orm.em.flush();

    orm.em.create(Activity, {
      description: 'Person volunteered',
      subject: ref(person),
    });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Person volunteered' });
    expect(activity.subject).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Bug 2: SELECT — When populating a polymorphic relation that targets a
  // TPT base class, MikroORM should JOIN the child tables too, so the entity
  // is hydrated as the concrete subclass with all its properties.
  // -------------------------------------------------------------------------

  test('SELECT: polymorphic populate resolves TPT child entities (joined strategy)', async () => {
    // Seed data via raw SQL to bypass the INSERT bug for this test
    const conn = orm.em.getConnection();
    await conn.execute(`insert into \`animal\` (\`name\`) values ('Buddy')`);
    const [{ id: animalId }] = await conn.execute(`select last_insert_rowid() as id`);
    await conn.execute(`insert into \`dog\` (\`id\`, \`breed\`) values (${animalId}, 'Labrador')`);
    await conn.execute(
      `insert into \`activity\` (\`description\`, \`subject_type\`, \`subject_id\`) values ('Walk the dog', 'animal', ${animalId})`,
    );

    // Also insert a Person-linked activity to verify non-TPT types still work
    await conn.execute(`insert into \`person\` (\`person_name\`) values ('Bob')`);
    const [{ id: personId }] = await conn.execute(`select last_insert_rowid() as id`);
    await conn.execute(
      `insert into \`activity\` (\`description\`, \`subject_type\`, \`subject_id\`) values ('Person walked', 'person', ${personId})`,
    );

    const activities = await orm.em.find(
      Activity,
      {},
      { populate: ['subject'] },
    );

    expect(activities.length).toBe(2);

    // The Dog-linked activity should be hydrated as a Dog, not a bare Animal
    const dogActivity = activities.find(a => a.description === 'Walk the dog')!;
    expect(dogActivity).toBeDefined();
    expect(dogActivity.subject).toBeDefined();
    expect(dogActivity.subject).toBeInstanceOf(Dog);
    expect((dogActivity.subject as Dog).breed).toBe('Labrador');
    expect((dogActivity.subject as Dog).name).toBe('Buddy');

    // The Person-linked activity should still work
    const personActivity = activities.find(a => a.description === 'Person walked')!;
    expect(personActivity).toBeDefined();
    expect(personActivity.subject).toBeDefined();
    expect(personActivity.subject).toBeInstanceOf(Person);
    expect((personActivity.subject as Person).personName).toBe('Bob');
  });

  test('SELECT: polymorphic populate with Cat (second TPT child)', async () => {
    const conn = orm.em.getConnection();
    await conn.execute(`insert into \`animal\` (\`name\`) values ('Whiskers')`);
    const [{ id: animalId }] = await conn.execute(`select last_insert_rowid() as id`);
    await conn.execute(`insert into \`cat\` (\`id\`, \`indoor\`) values (${animalId}, 1)`);
    await conn.execute(
      `insert into \`activity\` (\`description\`, \`subject_type\`, \`subject_id\`) values ('Cat adopted', 'animal', ${animalId})`,
    );

    const activities = await orm.em.find(
      Activity,
      {},
      { populate: ['subject'] },
    );

    const catActivity = activities.find(a => a.description === 'Cat adopted')!;
    expect(catActivity).toBeDefined();
    expect(catActivity.subject).toBeDefined();
    expect(catActivity.subject).toBeInstanceOf(Cat);
    expect((catActivity.subject as Cat).indoor).toBe(true);
    expect((catActivity.subject as Cat).name).toBe('Whiskers');
  });

  test('INSERT + SELECT round-trip: TPT child through polymorphic relation', async () => {
    // Create a Dog and assign it to an Activity
    const dog = orm.em.create(Dog, { name: 'Max', breed: 'Poodle' });
    await orm.em.flush();

    // @ts-expect-error Same TS limitation as above
    orm.em.create(Activity, {
      description: 'Walk Max',
      subject: ref(dog),
    });
    await orm.em.flush();
    orm.em.clear();

    // Read back with populate
    const activities = await orm.em.find(
      Activity,
      { description: 'Walk Max' },
      { populate: ['subject'] },
    );

    expect(activities.length).toBe(1);
    expect(activities[0].subject).toBeDefined();
    expect(activities[0].subject).toBeInstanceOf(Dog);
    expect((activities[0].subject as Dog).breed).toBe('Poodle');
    expect((activities[0].subject as Dog).name).toBe('Max');
  });

  test('INSERT: null subject is handled correctly', async () => {
    orm.em.create(Activity, {
      description: 'No subject',
      subject: null,
    });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'No subject' });
    expect(activity.subject).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Nested TPT: GermanShepherd extends Dog extends Animal
  // The polymorphic union lists Animal, so GermanShepherd (two levels deep)
  // must resolve its discriminator and hydrate with all intermediate props.
  // -------------------------------------------------------------------------

  test('INSERT: nested TPT grandchild resolves discriminator correctly', async () => {
    const mock = mockLogger(orm);

    const gs = orm.em.create(GermanShepherd, {
      name: 'Kaiser',
      breed: 'German Shepherd',
      lineage: 'Schutzhund Champion',
    });
    await orm.em.flush();

    // @ts-expect-error GermanShepherd extends Dog extends Animal, Animal is in the union
    orm.em.create(Activity, {
      description: 'Trained a GSD',
      subject: ref(gs),
    });
    await orm.em.flush();
    orm.em.clear();

    // Verify the SQL wrote 'animal' as the discriminator (the TPT root)
    const insertActivityQuery = mock.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('insert into `activity`') && c[0].includes('Trained a GSD'),
    );
    expect(insertActivityQuery).toBeDefined();
    expect(insertActivityQuery![0]).toContain("'animal'");

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Trained a GSD' });
    expect(activity.subject).toBeDefined();
  });

  test('SELECT: nested TPT grandchild is hydrated with all intermediate properties', async () => {
    const conn = orm.em.getConnection();

    // Insert Animal -> Dog -> GermanShepherd via raw SQL
    await conn.execute(`insert into \`animal\` (\`name\`) values ('Kaiser')`);
    const [{ id: animalId }] = await conn.execute(`select last_insert_rowid() as id`);
    await conn.execute(`insert into \`dog\` (\`id\`, \`breed\`) values (${animalId}, 'German Shepherd')`);
    await conn.execute(`insert into \`german_shepherd\` (\`id\`, \`lineage\`) values (${animalId}, 'Schutzhund Champion')`);
    await conn.execute(
      `insert into \`activity\` (\`description\`, \`subject_type\`, \`subject_id\`) values ('GSD activity', 'animal', ${animalId})`,
    );

    const activities = await orm.em.find(
      Activity,
      { description: 'GSD activity' },
      { populate: ['subject'] },
    );

    expect(activities.length).toBe(1);
    const subject = activities[0].subject;
    expect(subject).toBeDefined();
    expect(subject).toBeInstanceOf(GermanShepherd);
    // Properties from Animal (root)
    expect((subject as GermanShepherd).name).toBe('Kaiser');
    // Properties from Dog (intermediate)
    expect((subject as GermanShepherd).breed).toBe('German Shepherd');
    // Properties from GermanShepherd (leaf)
    expect((subject as GermanShepherd).lineage).toBe('Schutzhund Champion');
  });

  test('INSERT + SELECT round-trip: nested TPT grandchild through polymorphic relation', async () => {
    const gs = orm.em.create(GermanShepherd, {
      name: 'Bruno',
      breed: 'German Shepherd',
      lineage: 'Working Line',
    });
    await orm.em.flush();

    // @ts-expect-error Same TS limitation
    orm.em.create(Activity, {
      description: 'Walk Bruno',
      subject: ref(gs),
    });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(
      Activity,
      { description: 'Walk Bruno' },
      { populate: ['subject'] },
    );

    expect(activities.length).toBe(1);
    const subject = activities[0].subject;
    expect(subject).toBeDefined();
    expect(subject).toBeInstanceOf(GermanShepherd);
    expect((subject as GermanShepherd).name).toBe('Bruno');
    expect((subject as GermanShepherd).breed).toBe('German Shepherd');
    expect((subject as GermanShepherd).lineage).toBe('Working Line');
  });
});
