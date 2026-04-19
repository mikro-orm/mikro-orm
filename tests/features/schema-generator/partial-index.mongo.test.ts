import { EntitySchema, MikroORM } from '@mikro-orm/mongodb';
import { ObjectId } from 'bson';

class PartialUser {
  _id!: ObjectId;
  email!: string;
  deletedAt?: Date | null;
}

const schema = new EntitySchema<PartialUser>({
  class: PartialUser,
  collection: 'partial_user',
  properties: {
    _id: { primary: true, name: '_id', type: 'ObjectId' },
    email: { name: 'email', type: 'string' },
    deletedAt: { name: 'deletedAt', type: 'Date', nullable: true },
  },
  uniques: [
    {
      name: 'partial_user_email_uniq',
      properties: ['email'],
      where: { deletedAt: null },
    },
  ],
}).init();

describe('partial index [mongo]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [schema],
      dbName: 'mikro_orm_test_partial_index_mongo',
      ensureIndexes: false,
    });

    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('object `where` maps to partialFilterExpression', async () => {
    await orm.schema.ensureIndexes();
    const collection = orm.em.getCollection('partial_user');
    const indexes = (await collection.indexes()) as {
      name: string;
      unique?: boolean;
      partialFilterExpression?: unknown;
    }[];
    const idx = indexes.find(i => i.name === 'partial_user_email_uniq');
    expect(idx).toBeDefined();
    expect(idx!.unique).toBe(true);
    expect(idx!.partialFilterExpression).toEqual({ deletedAt: null });
  });

  test('string `where` is rejected', async () => {
    const meta = orm.getMetadata();
    const broken = new EntitySchema<PartialUser>({
      class: PartialUser,
      collection: 'partial_user',
      properties: {
        _id: { primary: true, name: '_id', type: 'ObjectId' },
        email: { name: 'email', type: 'string' },
        deletedAt: { name: 'deletedAt', type: 'Date', nullable: true },
      },
      uniques: [
        {
          name: 'partial_user_email_uniq_bad',
          properties: ['email'],
          where: 'deletedAt is null',
        },
      ],
    }).init().meta;
    meta.set(broken.class, broken);

    await expect(orm.schema.ensureIndexes()).rejects.toThrow(/string `where` is not supported on MongoDB/);

    // restore good schema
    meta.set(schema.meta.class, schema.meta);
  });
});
