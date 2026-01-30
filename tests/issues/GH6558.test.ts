import { MikroORM, EntityCaseNamingStrategy, defineEntity, p } from '@mikro-orm/sqlite';
import { v4 as uuidv4 } from 'uuid';

const Firm = defineEntity({
  name: 'Firm',
  properties: {
    id: p.uuid().primary().onCreate(() => uuidv4()),
    head: () => p.manyToOne(Employee).deleteRule('cascade').updateRule('no action'),
  },
});

const Employee = defineEntity({
  name: 'Employee',
  properties: {
    id: p.uuid().primary().onCreate(() => uuidv4()),
    surname: p.string(),
    name: p.string(),
    label: p.string().formula(cols => `${cols.surname} ||' '|| ${cols.name}`),
    boss: () => p.manyToOne(Employee).deleteRule('set null').updateRule('no action'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Firm, Employee],
    namingStrategy: EntityCaseNamingStrategy,
    dbName: ':memory:',
  });

  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('nested formula field', async () => {
  const newEmployeeId = uuidv4();

  orm.em.create(Employee, {
    id: newEmployeeId,
    surname: 'Johnson',
    name: 'Piers',
    boss: newEmployeeId,
  });

  orm.em.create(Firm, {
    head: newEmployeeId,
  });

  await orm.em.flush();

  const [firm] = await orm.em.findAll(Firm, {
    fields: ['*', 'head.id', 'head.label', 'head.boss.surname'],
    limit: 10,
  });

  expect(firm.head.label).toEqual('Johnson Piers');
});
