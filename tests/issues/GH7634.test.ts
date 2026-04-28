import { defineEntity, MikroORM, p, wrap } from '@mikro-orm/sqlite';

const AddressSchema = defineEntity({
  name: 'Address',
  properties: {
    id: p.integer().primary(),
    street: p.string(),
  },
});

const EmployeeSchema = defineEntity({
  name: 'Employee',
  properties: {
    id: p.integer().primary(),
    name: p.string().hidden(),
    department: p.string(),
    address: () => p.oneToOne(AddressSchema).hidden(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [AddressSchema, EmployeeSchema],
  });
  await orm.schema.refresh();

  orm.em.create(EmployeeSchema, {
    id: 1,
    name: 'John Doe',
    department: 'Engineering',
    address: { id: 1, street: '1 Main Road' },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test(`GH #7634: serialize() with populate: ['*'] respects hidden() unless includeHidden is true`, async () => {
  const employee = await orm.em.findOneOrFail(EmployeeSchema, 1, { populate: ['*'] });
  const dto = wrap(employee).serialize({ populate: ['*'] });

  expect(dto).toEqual({
    id: 1,
    department: 'Engineering',
  });
  expect(dto).not.toHaveProperty('name');
  expect(dto).not.toHaveProperty('address');
});

test(`GH #7634: includeHidden: true still surfaces hidden props with populate: ['*']`, async () => {
  const employee = await orm.em.findOneOrFail(EmployeeSchema, 1, { populate: ['*'] });
  const dto = wrap(employee).serialize({ populate: ['*'], includeHidden: true });

  expect(dto).toMatchObject({
    id: 1,
    name: 'John Doe',
    department: 'Engineering',
    address: { id: 1, street: '1 Main Road' },
  });
});

test(`GH #7634: explicit named populate hint still overrides hidden (whitelist semantics preserved)`, async () => {
  const employee = await orm.em.findOneOrFail(EmployeeSchema, 1, { populate: ['*'] });
  const dto = wrap(employee).serialize({ populate: ['name', 'address'] });

  expect(dto).toMatchObject({
    id: 1,
    name: 'John Doe',
    department: 'Engineering',
    address: { id: 1, street: '1 Main Road' },
  });
});
