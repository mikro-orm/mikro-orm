import { Entity, ManyToOne, MikroORM, OneToOne, PrimaryKey, PrimaryKeyProp, Property, Ref, ref, ReflectMetadataProvider } from '@mikro-orm/sqlite';

@Entity()
class Organization {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Author {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property()
  name!: string;

  @OneToOne({ entity: () => AuthorSync, mappedBy: 'author', nullable: true, orphanRemoval: true })
  sync!: Ref<AuthorSync> | null;

}

@Entity()
class AuthorSync {

  [PrimaryKeyProp]?: ['author', 'organization', 'externalId'];

  @OneToOne({
    entity: () => Author,
    inversedBy: 'sync',
    joinColumns: ['author_id', 'organization_id'],
    primary: true,
  })
  author!: Ref<Author> | null;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ primary: true })
  externalId!: string;

}

describe('GH7436', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Organization, Author, AuthorSync],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.refreshDatabase());

  test('replacing OneToOne with orphanRemoval should delete old entity (composite PK with overlapping FK)', async () => {
    const em = orm.em.fork();

    const org = em.create(Organization, { id: 1, name: 'Org' });
    const author = em.create(Author, { id: 1, organization: org, name: 'Alice' });
    em.create(AuthorSync, { author: ref(author), organization: org, externalId: 'ext-1' });
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(Author, { id: 1 }, { populate: ['sync'] });
    expect(loaded.sync).toBeTruthy();
    expect(loaded.sync!.externalId).toBe('ext-1');

    // Replace sync with a new entity — new entity's inverse already points to author
    const newSync = new AuthorSync();
    em.assign(newSync, {
      author: em.getReference(Author, [1, 1]),
      organization: 1,
      externalId: 'ext-2',
    });
    em.assign(loaded, { sync: newSync });

    await em.flush();
    em.clear();

    const reloaded = await em.findOneOrFail(Author, { id: 1 }, { populate: ['sync'] });
    expect(reloaded.sync!.externalId).toBe('ext-2');

    const allSyncs = await em.find(AuthorSync, {});
    expect(allSyncs).toHaveLength(1);
  });

  test('replacing OneToOne with orphanRemoval should not nullify FK that is part of PK on old entity', async () => {
    const em = orm.em.fork();

    const org = em.create(Organization, { id: 3, name: 'Org3' });
    const author = em.create(Author, { id: 3, organization: org, name: 'Charlie' });
    em.create(AuthorSync, { author: ref(author), organization: org, externalId: 'ext-5' });
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(Author, { id: 3 }, { populate: ['sync'] });
    const oldSync = loaded.sync!;
    expect(oldSync.externalId).toBe('ext-5');

    // Create a new sync entity WITHOUT pre-setting the `author` FK.
    // This means propagateOneToOne will be invoked (not the shortcut path)
    // and will attempt to nullify old.author — which is part of the PK.
    // On PostgreSQL this causes: NotNullConstraintViolationException: SET "author_id" = NULL
    const newSync = em.create(AuthorSync, {
      organization: em.getReference(Organization, 3),
      externalId: 'ext-6',
    } as any);
    em.assign(loaded, { sync: newSync });

    // The old entity's FK should NOT be nullified — it's part of the PK
    // and the entity will be removed via orphan removal anyway.
    expect(oldSync.author).not.toBeNull();

    await em.flush();
    em.clear();

    const reloaded = await em.findOneOrFail(Author, { id: 3 }, { populate: ['sync'] });
    expect(reloaded.sync!.externalId).toBe('ext-6');

    const allSyncs = await em.find(AuthorSync, { organization: 3 });
    expect(allSyncs).toHaveLength(1);
  });

  test('setting OneToOne to null with orphanRemoval should delete old entity (composite PK with overlapping FK)', async () => {
    const em = orm.em.fork();

    const org = em.create(Organization, { id: 2, name: 'Org2' });
    const author = em.create(Author, { id: 2, organization: org, name: 'Bob' });
    em.create(AuthorSync, { author: ref(author), organization: org, externalId: 'ext-3' });
    await em.flush();
    em.clear();

    const loaded = await em.findOneOrFail(Author, { id: 2 }, { populate: ['sync'] });
    expect(loaded.sync).toBeTruthy();

    em.assign(loaded, { sync: null });
    await em.flush();
    em.clear();

    const reloaded = await em.findOneOrFail(Author, { id: 2 }, { populate: ['sync'] });
    expect(reloaded.sync).toBeNull();

    const allSyncs = await em.find(AuthorSync, { organization: 2 });
    expect(allSyncs).toHaveLength(0);
  });
});
