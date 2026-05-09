import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const PersonSchema = defineEntity({
  name: 'Person',
  abstract: true,
  inheritance: 'tpt',
  filters: {
    excludeDeleted: { name: 'excludeDeleted', cond: { deletedAt: null }, default: true },
  },
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
  },
});

const BadgeSchema = defineEntity({
  name: 'Badge',
  properties: {
    id: p.integer().primary(),
    code: p.string(),
    parentEmployee: () => p.oneToOne(EmployeeSchema).mappedBy('badge').ref().nullable(),
    parentContractor: () => p.oneToOne(ContractorSchema).mappedBy('temporaryBadge').ref().nullable(),
  },
});

const EmployeeSchema = defineEntity({
  name: 'Employee',
  extends: PersonSchema,
  properties: {
    badge: () => p.oneToOne(BadgeSchema).owner().eager(),
  },
});

const ContractorSchema = defineEntity({
  name: 'Contractor',
  extends: PersonSchema,
  properties: {
    temporaryBadge: () => p.oneToOne(BadgeSchema).owner().eager().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [PersonSchema, BadgeSchema, EmployeeSchema, ContractorSchema],
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('eager OneToOne is populated when filter is set on TPT base (#7680)', async () => {
  const badge = orm.em.create(BadgeSchema, { id: 1, code: 'B-001' });
  orm.em.create(EmployeeSchema, { id: 1, name: 'Alice', badge });
  await orm.em.flush();
  orm.em.clear();

  const found = await orm.em.findOneOrFail(EmployeeSchema, { id: 1 }, { populate: ['*'] });
  expect(found.badge).not.toBeNull();
  expect(found.badge!.id).toBe(1);
  expect(found.badge!.code).toBe('B-001');
});
