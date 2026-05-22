import { MikroORM, Entity, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity()
class Document {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;

  @Property()
  version!: number;

  @Property()
  content!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'upsert-where-test',
    entities: [Document],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

describe('upsert with where condition', () => {
  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  test('upsert should only update when version is greater', async () => {
    const mock = mockLogger(orm);

    // Insert initial document with version 1
    await orm.em.insert(Document, { name: 'doc1', version: 1, content: 'initial' });

    // Try to upsert with version 2 - should update
    await orm.em.upsert(Document, {
      name: 'doc1',
      version: 2,
      content: 'updated to v2',
    }, {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 2 } },
    });

    let doc = await orm.em.findOneOrFail(Document, { name: 'doc1' });
    expect(doc.version).toBe(2);
    expect(doc.content).toBe('updated to v2');

    // Try to upsert with version 1 - should NOT update because version is not less than 1
    await orm.em.fork().upsert(Document, {
      name: 'doc1',
      version: 1,
      content: 'attempt to downgrade',
    }, {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 1 } },
    });

    doc = await orm.em.findOneOrFail(Document, { name: 'doc1' });
    expect(doc.version).toBe(2);
    expect(doc.content).toBe('updated to v2');

    // Try to upsert with version 3 - should update
    await orm.em.fork().upsert(Document, {
      name: 'doc1',
      version: 3,
      content: 'updated to v3',
    }, {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 3 } },
    });

    doc = await orm.em.findOneOrFail(Document, { name: 'doc1' });
    expect(doc.version).toBe(3);
    expect(doc.content).toBe('updated to v3');

    // Verify the SQL contains WHERE clause in ON CONFLICT
    const queries = mock.mock.calls.map(call => call[0]);
    const upsertQueries = queries.filter(q => q.includes('on conflict'));
    expect(upsertQueries.some(q => q.includes('where'))).toBe(true);
  });

  test('upsert should insert when entity does not exist, regardless of where condition', async () => {
    // Upsert a document that doesn't exist yet
    await orm.em.upsert(Document, {
      name: 'doc2',
      version: 5,
      content: 'new document',
    }, {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 5 } },
    });

    const doc = await orm.em.findOneOrFail(Document, { name: 'doc2' });
    expect(doc.version).toBe(5);
    expect(doc.content).toBe('new document');
  });

  test('upsertMany should work with where condition', async () => {
    // Insert initial documents
    await orm.em.insertMany(Document, [
      { name: 'doc3', version: 1, content: 'initial 3' },
      { name: 'doc4', version: 1, content: 'initial 4' },
    ]);

    // Upsert multiple documents with version check
    await orm.em.fork().upsertMany(Document, [
      { name: 'doc3', version: 2, content: 'updated 3' },
      { name: 'doc4', version: 3, content: 'updated 4' },
      { name: 'doc5', version: 1, content: 'new 5' },
    ], {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 10 } },
    });

    const doc3 = await orm.em.findOneOrFail(Document, { name: 'doc3' });
    expect(doc3.version).toBe(2);
    expect(doc3.content).toBe('updated 3');

    const doc4 = await orm.em.findOneOrFail(Document, { name: 'doc4' });
    expect(doc4.version).toBe(3);
    expect(doc4.content).toBe('updated 4');

    const doc5 = await orm.em.findOneOrFail(Document, { name: 'doc5' });
    expect(doc5.version).toBe(1);
    expect(doc5.content).toBe('new 5');
  });

  test('upsert should reload a suppressed entity with onConflictMergeFields (GH #7775)', async () => {
    // DB row has version 10 so the onConflictWhere predicate (version < 5) is false → suppressed
    await orm.em.insert(Document, { name: 'doc-single', version: 10, content: 'original' });

    const result = await orm.em.fork().upsert(Document, {
      name: 'doc-single',
      version: 3,
      content: 'stale-loser',
    }, {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 5 } },
      onConflictMergeFields: ['version', 'content'],
    });

    expect(result.version).toBe(10);
    expect(result.content).toBe('original');

    const doc = await orm.em.fork().findOneOrFail(Document, { name: 'doc-single' });
    expect(doc.version).toBe(10);
    expect(doc.content).toBe('original');
  });

  test('upsertMany should reload suppressed entities in a partially-suppressed batch (GH #7775)', async () => {
    // doc-a's DB version (10) fails the onConflictWhere predicate (version < 5) → suppressed
    // doc-b's DB version (2) passes → applied
    await orm.em.insertMany(Document, [
      { name: 'doc-a', version: 10, content: 'original a' },
      { name: 'doc-b', version: 2, content: 'original b' },
    ]);

    const results = await orm.em.fork().upsertMany(Document, [
      { name: 'doc-a', version: 3, content: 'stale-loser' },
      { name: 'doc-b', version: 7, content: 'fresh-winner' },
    ], {
      onConflictFields: ['name'],
      onConflictWhere: { version: { $lt: 5 } },
      onConflictMergeFields: ['version', 'content'],
    });

    expect(results[0].version).toBe(10);
    expect(results[0].content).toBe('original a');
    expect(results[1].version).toBe(7);
    expect(results[1].content).toBe('fresh-winner');

    const docA = await orm.em.fork().findOneOrFail(Document, { name: 'doc-a' });
    expect(docA.version).toBe(10);
    expect(docA.content).toBe('original a');
    const docB = await orm.em.fork().findOneOrFail(Document, { name: 'doc-b' });
    expect(docB.version).toBe(7);
    expect(docB.content).toBe('fresh-winner');
  });
});
