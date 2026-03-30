import { MikroORM, PrimaryKeyProp, Ref, ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

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
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.refresh());

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
