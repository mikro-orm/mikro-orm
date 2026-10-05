import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// Without a primary key or a non-null unique value there is no condition to reload the upserted row by.
const Membership = defineEntity({
  name: 'Membership',
  properties: {
    org: p.integer().primary(),
    seq: p.integer().primary().default(7),
    email: p.string().unique().nullable(),
    name: p.string(),
  },
});

const Token = defineEntity({
  name: 'Token',
  properties: {
    id: p.string().primary().defaultRaw('(lower(hex(randomblob(16))))'),
    name: p.string(),
    note: p.string().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Membership, Token], dbName: ':memory:' });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insertMany(Membership, [
    { org: 1, seq: 1, email: null, name: 'old' },
    { org: 2, seq: 1, email: 'a@example.com', name: 'old a' },
  ]);
  // sorts before any generated hex id, so an unconditional reload picks this row
  await orm.em.insert(Token, { id: '!seeded', name: 'old' });
});

afterEach(() => vi.restoreAllMocks());
afterAll(() => orm.close(true));

function withoutReturning() {
  vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(false);
}

async function expectSeededRowsUntouched() {
  const seeded = await orm.em.fork().find(Membership, { seq: 1 }, { orderBy: { org: 'asc' } });
  expect(seeded.map(row => row.name)).toEqual(['old', 'old a']);
}

test('upsert without RETURNING does not reload a row with a partial composite PK from another row', async () => {
  withoutReturning();
  const em = orm.em.fork();

  await expect(
    em.upsert(Membership, { org: 5, email: null, name: 'new' }, { onConflictFields: ['email'] }),
  ).rejects.toThrow('Cannot find the upserted Membership row, as neither its primary key nor a unique value is known');
  expect(em.getUnitOfWork().getIdentityMap().values()).toHaveLength(0);
  expect(await orm.em.fork().count(Membership, { org: 5, name: 'new' })).toBe(1);
  await expectSeededRowsUntouched();
});

test('upsert with onConflictAction ignore does not reload a row with a partial composite PK from another row', async () => {
  withoutReturning();
  const em = orm.em.fork();

  await expect(
    em.upsert(
      Membership,
      { org: 5, email: null, name: 'new' },
      { onConflictFields: ['email'], onConflictAction: 'ignore' },
    ),
  ).rejects.toThrow('Cannot find the upserted Membership row, as neither its primary key nor a unique value is known');
  expect(em.getUnitOfWork().getIdentityMap().values()).toHaveLength(0);
  await expectSeededRowsUntouched();
});

test('upsert does not reload a row with a database generated PK from another row', async () => {
  const em = orm.em.fork();

  await expect(em.upsert(Token, { name: 'new' })).rejects.toThrow(
    'Cannot find the upserted Token row, as neither its primary key nor a unique value is known',
  );
  expect(em.getUnitOfWork().getIdentityMap().values()).toHaveLength(0);
  expect(await orm.em.fork().count(Token)).toBe(2);
});

test('upsert still reloads a row with a database generated PK when it is provided', async () => {
  withoutReturning();
  const token = await orm.em.fork().upsert(Token, { id: 'known', name: 'new' });

  expect(token).toMatchObject({ id: 'known', name: 'new', note: null });
});
