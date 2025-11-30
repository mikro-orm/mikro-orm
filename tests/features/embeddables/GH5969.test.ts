import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Embeddable()
class Properties {

  @Property()
  tag: string;

  constructor(tag: string) {
    this.tag = tag;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Embedded({ nullable: true })
  properties?: Properties;

  @Embedded({ nullable: true, object: true })
  properties2?: Properties;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Properties],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

describe.each(['properties', 'properties2'] as const)('%s', propsKey => {
  beforeAll(() => orm.schema.clear());

  test('not updated on conflict with default settings', async () => {
    orm.em.create(User, {
      name: 'Foo',
      email: 'foo',
      [propsKey]: {
        tag: 'foo',
      },
    });
    await orm.em.flush();
    orm.em.clear();

    await orm.em.upsert(User, {
      name: 'Foo',
      email: 'foo',
      [propsKey]: {
        tag: 'foo2',
      },
    });
    orm.em.clear();

    const user = await orm.em.findOneOrFail(User, { email: 'foo' });
    expect(user[propsKey]!.tag).toBe('foo2');
  });

  test('error when specifying embedded property in onConflictMergeFields', async () => {
    orm.em.create(User, {
      name: 'Bar',
      email: 'bar',
      [propsKey]: {
        tag: 'bar',
      },
    });
    await orm.em.flush();
    orm.em.clear();

    await orm.em.upsert(
      User,
      {
        name: 'Bar',
        email: 'bar',
        [propsKey]: {
          tag: 'bar2',
        },
      },
      {
        onConflictFields: ['email'],
        onConflictMergeFields: ['name', propsKey],
      },
    );
    orm.em.clear();

    const user = await orm.em.findOneOrFail(User, { email: 'bar' });
    expect(user[propsKey]!.tag).toBe('bar2');
  });

  test('error when specifying embedded property in onConflictExcludeFields', async () => {
    orm.em.create(User, {
      name: 'Bar',
      email: 'bar1',
      [propsKey]: {
        tag: 'bar1',
      },
    });
    await orm.em.flush();
    orm.em.clear();

    await orm.em.upsert(
      User,
      {
        name: 'Bar',
        email: 'bar1',
        [propsKey]: {
          tag: 'bar12',
        },
      },
      {
        onConflictFields: ['email'],
        onConflictExcludeFields: ['*'],
      },
    );
    await orm.em.upsert(
      User,
      {
        name: 'Bar',
        email: 'bar1',
        [propsKey]: {
          tag: 'bar12',
        },
      },
      {
        onConflictFields: ['email'],
        onConflictExcludeFields: [`${propsKey}.tag`],
      },
    );
    await orm.em.upsert(
      User,
      {
        name: 'Bar',
        email: 'bar1',
        [propsKey]: {
          tag: 'bar12',
        },
      },
      {
        onConflictFields: ['email'],
        onConflictExcludeFields: [`${propsKey}.*`],
      },
    );
    orm.em.clear();

    const user = await orm.em.findOneOrFail(User, { email: 'bar1' });

    // with object embeddables `onConflictExcludeFields` cannot work
    if (propsKey === 'properties') {
      expect(user[propsKey]!.tag).toBe('bar1');
    }
  });

  test('succeeds when specifying full embedded property path in onConflictMergeFields with explicit casting', async () => {
    orm.em.create(User, {
      name: 'Baz',
      email: 'baz',
      [propsKey]: {
        tag: 'baz',
      },
    });
    await orm.em.flush();
    orm.em.clear();

    await orm.em.upsert(
      User,
      {
        name: 'Baz',
        email: 'baz',
        [propsKey]: {
          tag: 'baz2',
        },
      },
      {
        onConflictFields: ['email'],
        onConflictMergeFields: ['name', `${propsKey}.*`],
      },
    );

    await orm.em.upsert(
      User,
      {
        name: 'Baz',
        email: 'baz',
        [propsKey]: {
          tag: 'baz2',
        },
      },
      {
        onConflictFields: ['email'],
        onConflictMergeFields: ['name', `${propsKey}.tag`],
      },
    );
    orm.em.clear();

    const user = await orm.em.findOneOrFail(User, { email: 'baz' });
    expect(user[propsKey]!.tag).toBe('baz2');
  });
});
