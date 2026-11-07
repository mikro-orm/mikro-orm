import { EntitySchema, MikroORM, UniqueConstraintViolationException } from '@mikro-orm/mongodb';
import { ObjectId } from 'bson';
import { mockLogger } from '../../helpers.js';

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

class PartialAddress {
  city!: string;
}

const addressSchema = new EntitySchema<PartialAddress>({
  class: PartialAddress,
  embeddable: true,
  properties: {
    city: { type: 'string', fieldName: 'town' },
  },
});

class PartialAccount {
  _id!: ObjectId;
  email!: string;
  status!: string;
  address?: PartialAddress;
}

const accountSchema = new EntitySchema<PartialAccount>({
  class: PartialAccount,
  collection: 'partial_account',
  properties: {
    _id: { primary: true, name: '_id', type: 'ObjectId' },
    email: { name: 'email', type: 'string' },
    status: { name: 'status', type: 'string', fieldName: 'st' },
    address: { kind: 'embedded', entity: () => PartialAddress, object: true, nullable: true },
  },
  indexes: [
    {
      name: 'partial_account_email_idx',
      properties: ['email'],
      where: { status: { $in: ['active', 'pending'] } },
    },
    {
      name: 'partial_account_email_town_idx',
      properties: ['email'],
      where: { address: { city: 'Prague' } },
    },
    {
      name: 'partial_account_email_raw_idx',
      options: [{ email: -1 }, { name: 'partial_account_email_raw_idx' }] as any,
      where: { status: 'pending' },
    },
  ],
  uniques: [
    {
      name: 'partial_account_email_uniq',
      properties: ['email'],
      where: { status: 'active' },
    },
  ],
});

const baseProps = {
  _id: { primary: true, name: '_id', type: 'ObjectId' },
  email: { name: 'email', type: 'string' },
  deletedAt: { name: 'deletedAt', type: 'Date', nullable: true },
} as const;

describe('partial index [mongo]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [schema, accountSchema, addressSchema],
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

  test('non-unique index `where` folds into partialFilterExpression', async () => {
    class PartialEvent {
      _id!: ObjectId;
      email!: string;
      deletedAt?: Date | null;
    }

    const eventSchema = new EntitySchema<PartialEvent>({
      class: PartialEvent,
      collection: 'partial_event',
      properties: baseProps,
      indexes: [
        {
          name: 'partial_event_email_idx',
          properties: ['email'],
          where: { deletedAt: null },
        },
        {
          name: 'partial_event_plain_idx',
          properties: ['deletedAt'],
        },
      ],
    }).init();

    orm.getMetadata().set(PartialEvent, eventSchema.meta);
    await orm.schema.ensureIndexes();

    const indexes = (await orm.em.getCollection('partial_event').indexes()) as {
      name: string;
      unique?: boolean;
      partialFilterExpression?: unknown;
    }[];
    const idx = indexes.find(i => i.name === 'partial_event_email_idx');
    expect(idx).toBeDefined();
    expect(idx!.unique).toBeFalsy();
    expect(idx!.partialFilterExpression).toEqual({ deletedAt: null });
    const plain = indexes.find(i => i.name === 'partial_event_plain_idx');
    expect(plain).toBeDefined();
    expect(plain!.partialFilterExpression).toBeUndefined();
  });

  test('array-form `options: [spec, opts]` escape hatch folds `where` into opts', async () => {
    class PartialMetric {
      _id!: ObjectId;
      email!: string;
      deletedAt?: Date | null;
    }

    const metricSchema = new EntitySchema<PartialMetric>({
      class: PartialMetric,
      collection: 'partial_metric',
      properties: baseProps,
      indexes: [
        {
          name: 'partial_metric_email_idx',
          options: [{ email: 1 }, { name: 'partial_metric_email_idx' }] as any,
          where: { deletedAt: null },
        },
      ],
    }).init();

    orm.getMetadata().set(PartialMetric, metricSchema.meta);
    await orm.schema.ensureIndexes();

    const indexes = (await orm.em.getCollection('partial_metric').indexes()) as {
      name: string;
      partialFilterExpression?: unknown;
    }[];
    const idx = indexes.find(i => i.name === 'partial_metric_email_idx');
    expect(idx).toBeDefined();
    expect(idx!.partialFilterExpression).toEqual({ deletedAt: null });
  });

  test('plain-options escape hatch with `where` warns and drops the predicate', async () => {
    class PartialPlain {
      _id!: ObjectId;
      email!: string;
      deletedAt?: Date | null;
    }

    const plainSchema = new EntitySchema<PartialPlain>({
      class: PartialPlain,
      collection: 'partial_plain',
      properties: baseProps,
      indexes: [
        {
          name: 'partial_plain_idx',
          options: { email: 1 } as any,
          where: { deletedAt: null },
        },
        {
          name: 'partial_plain_plain_idx',
          options: { deletedAt: 1 } as any,
        },
      ],
    }).init();

    orm.getMetadata().set(PartialPlain, plainSchema.meta);
    const mock = mockLogger(orm, ['schema']);
    await orm.schema.ensureIndexes();

    const warned = mock.mock.calls.some(call =>
      /`where` was ignored because `options` is used as the raw index spec/.test(call[0]),
    );
    expect(warned).toBe(true);
  });

  test('explicit `options.partialFilterExpression` wins over `where` with a warning', async () => {
    class PartialConflict {
      _id!: ObjectId;
      email!: string;
      deletedAt?: Date | null;
    }

    const conflictSchema = new EntitySchema<PartialConflict>({
      class: PartialConflict,
      collection: 'partial_conflict',
      properties: baseProps,
      uniques: [
        {
          name: 'partial_conflict_uniq',
          properties: ['email'],
          options: { partialFilterExpression: { email: { $exists: true } } },
          where: { deletedAt: null },
        },
      ],
    }).init();

    orm.getMetadata().set(PartialConflict, conflictSchema.meta);
    const mock = mockLogger(orm, ['schema']);
    await orm.schema.ensureIndexes();

    const warned = mock.mock.calls.some(call =>
      /both `where` and `options.partialFilterExpression` are set/.test(call[0]),
    );
    expect(warned).toBe(true);

    const indexes = (await orm.em.getCollection('partial_conflict').indexes()) as {
      name: string;
      partialFilterExpression?: unknown;
    }[];
    const idx = indexes.find(i => i.name === 'partial_conflict_uniq');
    expect(idx!.partialFilterExpression).toEqual({ email: { $exists: true } });
  });

  test('`where` on a property with a custom `fieldName` or in an object embeddable uses the stored field name', async () => {
    await orm.schema.ensureIndexes();
    const indexes = (await orm.em.getCollection('partial_account').indexes()) as {
      name: string;
      partialFilterExpression?: unknown;
    }[];
    const filters = Object.fromEntries(indexes.map(i => [i.name, i.partialFilterExpression]));
    expect(filters.partial_account_email_uniq).toEqual({ st: 'active' });
    expect(filters.partial_account_email_idx).toEqual({ st: { $in: ['active', 'pending'] } });
    expect(filters.partial_account_email_raw_idx).toEqual({ st: 'pending' });
    expect(filters.partial_account_email_town_idx).toEqual({ 'address.town': 'Prague' });
  });

  test('partial unique index on a property with a custom `fieldName` rejects a duplicate', async () => {
    await orm.schema.ensureIndexes();
    const em = orm.em.fork();
    em.create(PartialAccount, { email: 'a@a.a', status: 'active' });
    em.create(PartialAccount, { email: 'a@a.a', status: 'inactive' });
    await em.flush();

    const em2 = orm.em.fork();
    em2.create(PartialAccount, { email: 'a@a.a', status: 'active' });
    await expect(em2.flush()).rejects.toThrow(UniqueConstraintViolationException);
    expect(await orm.em.fork().count(PartialAccount, { email: 'a@a.a', status: 'active' })).toBe(1);
  });
});
