import { MikroORM, type Rel } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Location {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => LocationPos, pos => pos.location, { nullable: true })
  pos?: Rel<LocationPos>;
}

@Entity()
class LocationPos {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Location, { owner: true })
  location!: Location;

  @Property()
  value!: string;
}

describe.each([true, false])('forceUndefined: %s', forceUndefined => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Location, LocationPos],
      forceUndefined,
    });
    await orm.schema.create();
    const l1 = orm.em.create(Location, { id: 1 });
    orm.em.create(Location, { id: 2 });
    orm.em.create(LocationPos, { id: 1, location: l1, value: 'v' });
    await orm.em.flush();
  });

  afterAll(() => orm.close(true));

  test('empty inverse 1:1 is not re-queried on repeated populate', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);
    const l = await em.findOneOrFail(Location, 2, { populate: ['pos'] });
    expect(l.pos ?? undefined).toBeUndefined();
    expect(mock.mock.calls).toHaveLength(1);
    await em.findOneOrFail(Location, 2, { populate: ['pos'] });
    expect(mock.mock.calls).toHaveLength(1);
  });

  test('empty inverse 1:1 populated after a partial load is not re-queried', async () => {
    const em = orm.em.fork();
    const l: Location = await em.findOneOrFail(Location, 2, { fields: ['id'] });
    await em.populate(l, ['pos']);
    expect(l.pos ?? undefined).toBeUndefined();
    const mock = mockLogger(orm);
    await em.populate(l, ['pos']);
    expect(mock.mock.calls).toHaveLength(0);
  });

  test('inverse 1:1 skipped by a partial load is still populated', async () => {
    const em = orm.em.fork();
    const l: Location = await em.findOneOrFail(Location, 1, { fields: ['id'] });
    expect(l.pos).toBeUndefined();
    await em.populate(l, ['pos']);
    expect(l.pos?.value).toBe('v');
  });

  test.each(['where', 'populateFilter'] as const)(
    'inverse 1:1 filtered out by a populate condition is still populated later (%s)',
    async key => {
      const em = orm.em.fork();
      const l: Location = await em.findOneOrFail(Location, 1, { fields: ['id'] });
      await em.populate(l, ['pos'], { [key]: { pos: { value: 'nope' } } });
      await em.populate(l, ['pos']);
      expect(l.pos?.value).toBe('v');
    },
  );
});
