import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
class Document {

  @PrimaryKey()
  id!: number;

  @Property()
  rawName!: string;

  @OneToMany(() => DocumentVersion, version => version.document)
  versions = new Collection<DocumentVersion>(this);

}

@Entity()
class DocumentVersion {

  [PrimaryKeyProp]?: ['document', 'versionNumber'];

  @ManyToOne(() => Document, { primary: true })
  document!: Ref<Document>;

  @PrimaryKey()
  versionNumber!: number;

  @OneToMany(() => DocumentVersionReview, review => review.documentVersion)
  reviews = new Collection<DocumentVersionReview>(this);

}

@Entity()
class DocumentVersionReview {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => DocumentVersion, { ref: true })
  documentVersion!: Ref<DocumentVersion>;

  @Property()
  approved!: boolean;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      Document,
      DocumentVersion,
      DocumentVersionReview,
    ],
  });
  await orm.schema.refreshDatabase();

  orm.em.create(Document, {
    id: 1,
    rawName: 'Training Document',
    versions: [{
      versionNumber: 1,
      reviews: [
        { id: 1, approved: true },
        { id: 2, approved: false },
        { id: 3, approved: true },
      ],
    }],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('not updated on conflict with default settings', async () => {
  const doc = await orm.em.findOneOrFail(Document, 1);
  const every = await doc.versions.matching({
    where: { reviews: { $every: { approved: true } } },
    orderBy: { versionNumber: 'DESC' },
  });
  expect(every).toHaveLength(0);

  const none = await doc.versions.matching({
    where: { reviews: { $none: { approved: true } } },
    orderBy: { versionNumber: 'DESC' },
  });
  expect(none).toHaveLength(0);

  const some = await doc.versions.matching({
    where: { reviews: { $some: { approved: true } } },
    orderBy: { versionNumber: 'DESC' },
  });
  expect(some).toHaveLength(1);
});
