import { Collection, LoadStrategy, MikroORM, ref, wrap } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

// TPT hierarchy: Animal (abstract) -> Dog, Cat; Dog -> GermanShepherd (nested)
@Entity({ inheritance: 'tpt' })
abstract class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Activity, a => a.subject)
  activities = new Collection<Activity>(this);
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

@Entity()
class GermanShepherd extends Dog {
  @Property()
  lineage!: string;
}

@Entity()
class Person {
  @PrimaryKey()
  id!: number;

  @Property()
  personName!: string;

  @OneToMany(() => Activity, a => a.subject)
  activities = new Collection<Activity>(this);
}

@Entity()
class Shelter {
  @PrimaryKey()
  id!: number;

  @Property()
  location!: string;
}

@Entity()
class Activity {
  @PrimaryKey()
  id!: number;

  @Property()
  description!: string;

  @ManyToOne(() => [Animal, Person, Shelter], { nullable: true })
  subject?: Animal | Person | Shelter | null;
}

describe('polymorphic ManyToOne with TPT targets', () => {
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
  // INSERT — discriminator resolution
  // -------------------------------------------------------------------------

  test('INSERT: discriminator is set correctly for TPT child entities', async () => {
    const mock = mockLogger(orm);

    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'German Shepherd' });
    await orm.em.flush();

    orm.em.create(Activity, {
      description: 'Adopted a dog',
      // @ts-expect-error TS limitation: polymorphic union doesn't accept a single-target ref
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
      // @ts-expect-error
      subject: ref(person),
    });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Person volunteered' });
    expect(activity.subject).toBeDefined();
  });

  test('INSERT: nested TPT grandchild resolves discriminator correctly', async () => {
    const mock = mockLogger(orm);

    const gs = orm.em.create(GermanShepherd, {
      name: 'Kaiser',
      breed: 'German Shepherd',
      lineage: 'Schutzhund Champion',
    });
    await orm.em.flush();

    orm.em.create(Activity, {
      description: 'Trained a GSD',
      // @ts-expect-error
      subject: ref(gs),
    });
    await orm.em.flush();
    orm.em.clear();

    const insertActivityQuery = mock.mock.calls.find(
      c => typeof c[0] === 'string' && c[0].includes('insert into `activity`') && c[0].includes('Trained a GSD'),
    );
    expect(insertActivityQuery).toBeDefined();
    expect(insertActivityQuery![0]).toContain("'animal'");

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Trained a GSD' });
    expect(activity.subject).toBeDefined();
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
  // SELECT — JOINED strategy (default)
  // -------------------------------------------------------------------------

  test('SELECT JOINED: polymorphic populate resolves TPT child entities', async () => {
    const dog = orm.em.create(Dog, { name: 'Buddy', breed: 'Labrador' });
    const person = orm.em.create(Person, { personName: 'Bob' });
    await orm.em.flush();

    // @ts-expect-error TS limitation: polymorphic union doesn't accept a single-target ref
    orm.em.create(Activity, { description: 'Walk the dog', subject: ref(dog) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'Person walked', subject: ref(person) });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(Activity, {}, { populate: ['subject'], strategy: LoadStrategy.JOINED });

    expect(activities.length).toBe(2);

    const dogActivity = activities.find(a => a.description === 'Walk the dog')!;
    expect(dogActivity.subject).toBeDefined();
    expect(dogActivity.subject).toBeInstanceOf(Dog);
    expect((dogActivity.subject as Dog).breed).toBe('Labrador');
    expect((dogActivity.subject as Dog).name).toBe('Buddy');

    const personActivity = activities.find(a => a.description === 'Person walked')!;
    expect(personActivity.subject).toBeDefined();
    expect(personActivity.subject).toBeInstanceOf(Person);
    expect((personActivity.subject as Person).personName).toBe('Bob');
  });

  test('SELECT JOINED: Cat (second TPT child)', async () => {
    const cat = orm.em.create(Cat, { name: 'Whiskers', indoor: true });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Cat adopted', subject: ref(cat) });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(Activity, {}, { populate: ['subject'], strategy: LoadStrategy.JOINED });

    const catActivity = activities.find(a => a.description === 'Cat adopted')!;
    expect(catActivity.subject).toBeInstanceOf(Cat);
    expect((catActivity.subject as Cat).indoor).toBe(true);
    expect((catActivity.subject as Cat).name).toBe('Whiskers');
  });

  test('SELECT JOINED: nested TPT grandchild hydrates all intermediate properties', async () => {
    const gs = orm.em.create(GermanShepherd, {
      name: 'Kaiser',
      breed: 'German Shepherd',
      lineage: 'Schutzhund Champion',
    });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'GSD activity', subject: ref(gs) });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(
      Activity,
      { description: 'GSD activity' },
      { populate: ['subject'], strategy: LoadStrategy.JOINED },
    );

    expect(activities.length).toBe(1);
    const subject = activities[0].subject;
    expect(subject).toBeInstanceOf(GermanShepherd);
    expect((subject as GermanShepherd).name).toBe('Kaiser');
    expect((subject as GermanShepherd).breed).toBe('German Shepherd');
    expect((subject as GermanShepherd).lineage).toBe('Schutzhund Champion');
  });

  // -------------------------------------------------------------------------
  // SELECT — SELECT_IN strategy
  // -------------------------------------------------------------------------

  test('SELECT_IN: polymorphic populate resolves TPT child entities', async () => {
    const dog = orm.em.create(Dog, { name: 'Buddy', breed: 'Labrador' });
    const person = orm.em.create(Person, { personName: 'Bob' });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Walk the dog', subject: ref(dog) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'Person walked', subject: ref(person) });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(Activity, {}, { populate: ['subject'], strategy: LoadStrategy.SELECT_IN });

    expect(activities.length).toBe(2);

    const dogActivity = activities.find(a => a.description === 'Walk the dog')!;
    expect(dogActivity.subject).toBeDefined();
    expect(dogActivity.subject).toBeInstanceOf(Dog);
    expect((dogActivity.subject as Dog).breed).toBe('Labrador');
    expect((dogActivity.subject as Dog).name).toBe('Buddy');

    const personActivity = activities.find(a => a.description === 'Person walked')!;
    expect(personActivity.subject).toBeDefined();
    expect(personActivity.subject).toBeInstanceOf(Person);
    expect((personActivity.subject as Person).personName).toBe('Bob');
  });

  test('SELECT_IN: nested TPT grandchild hydrates correctly', async () => {
    const gs = orm.em.create(GermanShepherd, {
      name: 'Kaiser',
      breed: 'German Shepherd',
      lineage: 'Schutzhund Champion',
    });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'GSD activity', subject: ref(gs) });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(
      Activity,
      { description: 'GSD activity' },
      { populate: ['subject'], strategy: LoadStrategy.SELECT_IN },
    );

    expect(activities.length).toBe(1);
    const subject = activities[0].subject;
    expect(subject).toBeInstanceOf(GermanShepherd);
    expect((subject as GermanShepherd).name).toBe('Kaiser');
    expect((subject as GermanShepherd).breed).toBe('German Shepherd');
    expect((subject as GermanShepherd).lineage).toBe('Schutzhund Champion');
  });

  // -------------------------------------------------------------------------
  // INSERT + SELECT round-trip
  // -------------------------------------------------------------------------

  test('round-trip: TPT child through polymorphic relation', async () => {
    const dog = orm.em.create(Dog, { name: 'Max', breed: 'Poodle' });
    await orm.em.flush();

    orm.em.create(Activity, {
      description: 'Walk Max',
      // @ts-expect-error TS limitation: polymorphic union doesn't accept a single-target ref
      subject: ref(dog),
    });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(Activity, { description: 'Walk Max' }, { populate: ['subject'] });

    expect(activities.length).toBe(1);
    expect(activities[0].subject).toBeInstanceOf(Dog);
    expect((activities[0].subject as Dog).breed).toBe('Poodle');
    expect((activities[0].subject as Dog).name).toBe('Max');
  });

  test('round-trip: nested TPT grandchild through polymorphic relation', async () => {
    const gs = orm.em.create(GermanShepherd, {
      name: 'Bruno',
      breed: 'German Shepherd',
      lineage: 'Working Line',
    });
    await orm.em.flush();

    orm.em.create(Activity, {
      description: 'Walk Bruno',
      // @ts-expect-error
      subject: ref(gs),
    });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(Activity, { description: 'Walk Bruno' }, { populate: ['subject'] });

    expect(activities.length).toBe(1);
    const subject = activities[0].subject;
    expect(subject).toBeInstanceOf(GermanShepherd);
    expect((subject as GermanShepherd).name).toBe('Bruno');
    expect((subject as GermanShepherd).breed).toBe('German Shepherd');
    expect((subject as GermanShepherd).lineage).toBe('Working Line');
  });

  // -------------------------------------------------------------------------
  // UPDATE — changing polymorphic ref between TPT children and across types
  // -------------------------------------------------------------------------

  test('UPDATE: change polymorphic ref from Dog to Cat (same TPT hierarchy)', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'German Shepherd' });
    const cat = orm.em.create(Cat, { name: 'Whiskers', indoor: true });
    await orm.em.flush();

    // @ts-expect-error
    const activity = orm.em.create(Activity, { description: 'Pet care', subject: ref(dog) });
    await orm.em.flush();
    orm.em.clear();

    // Load and update
    const loaded = await orm.em.findOneOrFail(Activity, { description: 'Pet care' });
    const catRef = orm.em.getReference(Cat, cat.id);
    loaded.subject = catRef;
    await orm.em.flush();
    orm.em.clear();

    // Verify the update
    const updated = await orm.em.findOneOrFail(Activity, { description: 'Pet care' }, { populate: ['subject'] });
    expect(updated.subject).toBeDefined();
    expect(updated.subject).toBeInstanceOf(Cat);
    expect((updated.subject as Cat).name).toBe('Whiskers');
    expect((updated.subject as Cat).indoor).toBe(true);
  });

  test('UPDATE: change polymorphic ref from Dog to Person (cross-type)', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'German Shepherd' });
    const person = orm.em.create(Person, { personName: 'Alice' });
    await orm.em.flush();

    // @ts-expect-error
    const activity = orm.em.create(Activity, { description: 'Reassign', subject: ref(dog) });
    await orm.em.flush();
    orm.em.clear();

    // Load and change from Dog to Person
    const loaded = await orm.em.findOneOrFail(Activity, { description: 'Reassign' });
    const personRef = orm.em.getReference(Person, person.id);
    loaded.subject = personRef;
    await orm.em.flush();
    orm.em.clear();

    // Verify the update — discriminator should change from 'animal' to 'person'
    const updated = await orm.em.findOneOrFail(Activity, { description: 'Reassign' }, { populate: ['subject'] });
    expect(updated.subject).toBeDefined();
    expect(updated.subject).toBeInstanceOf(Person);
    expect((updated.subject as Person).personName).toBe('Alice');
  });

  test('UPDATE: change polymorphic ref from Person to Dog (cross-type into TPT)', async () => {
    const person = orm.em.create(Person, { personName: 'Bob' });
    const dog = orm.em.create(Dog, { name: 'Fido', breed: 'Beagle' });
    await orm.em.flush();

    // @ts-expect-error TS limitation: polymorphic union doesn't accept a single-target ref
    const activity = orm.em.create(Activity, { description: 'Switch to dog', subject: ref(person) });
    await orm.em.flush();
    orm.em.clear();

    // Load and change from Person to Dog
    const loaded = await orm.em.findOneOrFail(Activity, { description: 'Switch to dog' });
    const dogRef = orm.em.getReference(Dog, dog.id);
    loaded.subject = dogRef;
    await orm.em.flush();
    orm.em.clear();

    const updated = await orm.em.findOneOrFail(Activity, { description: 'Switch to dog' }, { populate: ['subject'] });
    expect(updated.subject).toBeDefined();
    expect(updated.subject).toBeInstanceOf(Dog);
    expect((updated.subject as Dog).name).toBe('Fido');
    expect((updated.subject as Dog).breed).toBe('Beagle');
  });

  // -------------------------------------------------------------------------
  // Inverse side — OneToMany loading
  // -------------------------------------------------------------------------

  test('inverse side: load activities from a Dog entity', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'German Shepherd' });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Walk', subject: ref(dog) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'Feed', subject: ref(dog) });
    await orm.em.flush();
    orm.em.clear();

    const loadedDog = await orm.em.findOneOrFail(Dog, { name: 'Rex' }, { populate: ['activities'] });
    expect(loadedDog.activities).toHaveLength(2);
    expect(
      loadedDog.activities
        .getItems()
        .map(a => a.description)
        .sort(),
    ).toEqual(['Feed', 'Walk']);
  });

  test('inverse side: load activities from a Person entity', async () => {
    const person = orm.em.create(Person, { personName: 'Alice' });
    await orm.em.flush();

    // @ts-expect-error TS limitation: polymorphic union doesn't accept a single-target ref
    orm.em.create(Activity, { description: 'Volunteer', subject: ref(person) });
    await orm.em.flush();
    orm.em.clear();

    const loadedPerson = await orm.em.findOneOrFail(Person, { personName: 'Alice' }, { populate: ['activities'] });
    expect(loadedPerson.activities).toHaveLength(1);
    expect(loadedPerson.activities[0].description).toBe('Volunteer');
  });

  // -------------------------------------------------------------------------
  // Lazy loading via em.populate()
  // -------------------------------------------------------------------------

  test('em.populate: lazy-load polymorphic ref to TPT entity', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'Husky' });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Lazy walk', subject: ref(dog) });
    await orm.em.flush();
    orm.em.clear();

    // Load without populate first
    const activity = await orm.em.findOneOrFail(Activity, { description: 'Lazy walk' });
    // Subject should be a reference (not initialized)
    expect(activity.subject).toBeDefined();
    expect(wrap(activity.subject!).isInitialized()).toBe(false);

    // Now populate lazily
    await orm.em.populate(activity, ['subject']);
    expect(wrap(activity.subject!).isInitialized()).toBe(true);
    expect(activity.subject).toBeInstanceOf(Dog);
    expect((activity.subject as Dog).breed).toBe('Husky');
    expect((activity.subject as Dog).name).toBe('Rex');
  });

  test('em.populate: lazy-load polymorphic ref to nested TPT grandchild', async () => {
    const gs = orm.em.create(GermanShepherd, {
      name: 'Kaiser',
      breed: 'German Shepherd',
      lineage: 'Working Line',
    });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Lazy GSD', subject: ref(gs) });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Lazy GSD' });
    expect(wrap(activity.subject!).isInitialized()).toBe(false);

    await orm.em.populate(activity, ['subject']);
    expect(wrap(activity.subject!).isInitialized()).toBe(true);
    expect(activity.subject).toBeInstanceOf(GermanShepherd);
    expect((activity.subject as GermanShepherd).name).toBe('Kaiser');
    expect((activity.subject as GermanShepherd).breed).toBe('German Shepherd');
    expect((activity.subject as GermanShepherd).lineage).toBe('Working Line');
  });

  // -------------------------------------------------------------------------
  // Serialization — wrap().toJSON()
  // -------------------------------------------------------------------------

  test('serialization: toJSON with populated TPT child subject', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'Poodle' });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Serialize test', subject: ref(dog) });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Serialize test' }, { populate: ['subject'] });

    const json = wrap(activity).toJSON();
    expect(json.description).toBe('Serialize test');
    expect(json.subject).toBeDefined();
    expect(json.subject).toHaveProperty('name', 'Rex');
    expect(json.subject).toHaveProperty('breed', 'Poodle');
    expect(json.subject).toHaveProperty('id');
  });

  test('serialization: toJSON with populated nested TPT grandchild', async () => {
    const gs = orm.em.create(GermanShepherd, {
      name: 'Kaiser',
      breed: 'German Shepherd',
      lineage: 'Champion',
    });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'Serialize GSD', subject: ref(gs) });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'Serialize GSD' }, { populate: ['subject'] });

    const json = wrap(activity).toJSON();
    expect(json.subject).toHaveProperty('name', 'Kaiser');
    expect(json.subject).toHaveProperty('breed', 'German Shepherd');
    expect(json.subject).toHaveProperty('lineage', 'Champion');
  });

  test('serialization: toJSON with non-populated ref is just the PK', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'Poodle' });
    await orm.em.flush();

    // @ts-expect-error
    orm.em.create(Activity, { description: 'No populate', subject: ref(dog) });
    await orm.em.flush();
    orm.em.clear();

    const activity = await orm.em.findOneOrFail(Activity, { description: 'No populate' });
    const json = wrap(activity).toJSON();
    // When not populated, subject should serialize as the PK value
    expect(json.subject).toBe(dog.id);
  });

  // -------------------------------------------------------------------------
  // Mixed: multiple TPT children + non-TPT entities in one query
  // -------------------------------------------------------------------------

  test('mixed query: Dog, Cat, GermanShepherd, and Person all in one populate', async () => {
    const dog = orm.em.create(Dog, { name: 'Buddy', breed: 'Labrador' });
    const cat = orm.em.create(Cat, { name: 'Whiskers', indoor: true });
    const gsd = orm.em.create(GermanShepherd, { name: 'Kaiser', breed: 'German Shepherd', lineage: 'Champion' });
    const person = orm.em.create(Person, { personName: 'Alice' });
    await orm.em.flush();

    // @ts-expect-error TS limitation: polymorphic union doesn't accept a single-target ref
    orm.em.create(Activity, { description: 'dog activity', subject: ref(dog) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'cat activity', subject: ref(cat) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'gsd activity', subject: ref(gsd) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'person activity', subject: ref(person) });
    orm.em.create(Activity, { description: 'null activity', subject: null });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(Activity, {}, { populate: ['subject'], orderBy: { description: 'asc' } });

    expect(activities).toHaveLength(5);

    // cat activity
    expect(activities[0].subject).toBeInstanceOf(Cat);
    expect((activities[0].subject as Cat).indoor).toBe(true);

    // dog activity
    expect(activities[1].subject).toBeInstanceOf(Dog);
    expect((activities[1].subject as Dog).breed).toBe('Labrador');

    // gsd activity
    expect(activities[2].subject).toBeInstanceOf(GermanShepherd);
    expect((activities[2].subject as GermanShepherd).lineage).toBe('Champion');

    // null activity
    expect(activities[3].subject).toBeNull();

    // person activity
    expect(activities[4].subject).toBeInstanceOf(Person);
    expect((activities[4].subject as Person).personName).toBe('Alice');
  });

  // Deep populate recursion — exercises the polymorphic target bucketing that
  // previously compared className exactly, dropping TPT/STI subclasses. With
  // subjects of different TPT children and a non-TPT target, the inner populate
  // for `activities` must correctly bucket each subject under its polymorph target.
  test('deep populate: polymorphic subject -> inverse activities across TPT/non-TPT targets', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'Labrador' });
    const cat = orm.em.create(Cat, { name: 'Whiskers', indoor: true });
    const person = orm.em.create(Person, { personName: 'Alice' });
    await orm.em.flush();

    // @ts-expect-error TS limitation: Dog/Cat extend Animal which is in the union
    orm.em.create(Activity, { description: 'Walk Rex', subject: ref(dog) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'Pet Whiskers', subject: ref(cat) });
    // @ts-expect-error
    orm.em.create(Activity, { description: 'Call Alice', subject: ref(person) });
    await orm.em.flush();
    orm.em.clear();

    const activities = await orm.em.find(
      Activity,
      {},
      { populate: ['subject.activities'], orderBy: { description: 'asc' } },
    );

    expect(activities).toHaveLength(3);
    expect(activities[0].subject).toBeInstanceOf(Person);
    expect(wrap((activities[0].subject as Person).activities).isInitialized()).toBe(true);
    expect(activities[1].subject).toBeInstanceOf(Cat);
    expect(wrap((activities[1].subject as Cat).activities).isInitialized()).toBe(true);
    expect(activities[2].subject).toBeInstanceOf(Dog);
    expect(wrap((activities[2].subject as Dog).activities).isInitialized()).toBe(true);
  });
});
