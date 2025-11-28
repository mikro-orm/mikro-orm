import { EntitySchema, MikroORM, EntityCaseNamingStrategy, Opt } from '@mikro-orm/sqlite';
import { v4 as uuidv4 } from 'uuid';

const Firm = new EntitySchema<IFirm>({
  name: 'Firm',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    head: {
      deleteRule: 'cascade',
      entity: 'Employee',
      kind: 'm:1',
      updateRule: 'no action',
    },
  },
});

const Employee = new EntitySchema<IEmployee>({
  name: 'Employee',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    surname: { type: 'string' },
    name: { type: 'string' },
    label: { formula: alias => `${alias}.surname ||' '|| ${alias}.name`, type: 'string' },
    boss: {
      deleteRule: 'set null',
      entity: 'Employee',
      kind: 'm:1',
      updateRule: 'no action',
    },
  },
});

interface IFirm {
  id: string;
  head: IEmployee;
}

interface IEmployee {
  id: string;
  boss: IEmployee;
  surname: string;
  name: string;
  label: string & Opt;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Firm, Employee],
    namingStrategy: EntityCaseNamingStrategy,
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
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
