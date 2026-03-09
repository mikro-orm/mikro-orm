import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/decorators/legacy';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Tag {
  @Property()
  name!: string;

  @Property()
  priority!: number;

  constructor(name?: string, priority?: number) {
    if (name !== undefined) {
      this.name = name;
    }

    if (priority !== undefined) {
      this.priority = priority;
    }
  }
}

@Entity()
class Event {
  @PrimaryKey({ type: 'ObjectId' })
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property({ type: 'json', nullable: true })
  metadata?: { name: string; priority: number }[];

  @Embedded(() => Tag, { array: true, nullable: true })
  tags?: Tag[];
}

describe('$elemMatch on JSON and embedded arrays in mongo', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Event],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-elem-match',
    });
    await orm.schema.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('$elemMatch on JSON property', async () => {
    orm.em.create(Event, {
      name: 'Conference',
      metadata: [
        { name: 'typescript', priority: 10 },
        { name: 'javascript', priority: 5 },
      ],
    });
    orm.em.create(Event, {
      name: 'Meetup',
      metadata: [
        { name: 'rust', priority: 8 },
        { name: 'wasm', priority: 3 },
      ],
    });
    await orm.em.flush();
    orm.em.clear();
    const mock = mockLogger(orm, ['query']);

    // basic equality
    const r1 = await orm.em.find(Event, { metadata: { $elemMatch: { name: 'typescript' } } });
    expect(r1).toHaveLength(1);
    expect(r1[0].name).toBe('Conference');

    // numeric operator
    mock.mockReset();
    const r2 = await orm.em.fork().find(Event, { metadata: { $elemMatch: { priority: { $gte: 8 } } } });
    expect(r2).toHaveLength(2);

    // multiple conditions — same element must match both
    const r3 = await orm.em
      .fork()
      .find(Event, { metadata: { $elemMatch: { name: 'typescript', priority: { $gt: 5 } } } });
    expect(r3).toHaveLength(1);
    expect(r3[0].name).toBe('Conference');

    // cross-element mismatch — typescript has priority 10, not 3
    const r4 = await orm.em.fork().find(Event, { metadata: { $elemMatch: { name: 'typescript', priority: 3 } } });
    expect(r4).toHaveLength(0);

    // no match
    const r5 = await orm.em.fork().find(Event, { metadata: { $elemMatch: { name: 'python' } } });
    expect(r5).toHaveLength(0);
  });

  test('$elemMatch on embedded array', async () => {
    orm.em.create(Event, {
      name: 'Workshop',
      tags: [new Tag('react', 7), new Tag('node', 4)],
    });
    orm.em.create(Event, {
      name: 'Hackathon',
      tags: [new Tag('go', 9), new Tag('docker', 6)],
    });
    await orm.em.flush();
    orm.em.clear();

    // $elemMatch works on embedded arrays natively in MongoDB
    const r1 = await orm.em.find(Event, { tags: { $elemMatch: { name: 'react' } } });
    expect(r1).toHaveLength(1);
    expect(r1[0].name).toBe('Workshop');

    // numeric condition on embedded array
    const r2 = await orm.em.fork().find(Event, { tags: { $elemMatch: { priority: { $gte: 8 } } } });
    expect(r2).toHaveLength(1);
    expect(r2[0].name).toBe('Hackathon');

    // same-element matching
    const r3 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'react', priority: { $gt: 5 } } } });
    expect(r3).toHaveLength(1);

    // cross-element mismatch
    const r4 = await orm.em.fork().find(Event, { tags: { $elemMatch: { name: 'react', priority: 9 } } });
    expect(r4).toHaveLength(0);
  });
});
