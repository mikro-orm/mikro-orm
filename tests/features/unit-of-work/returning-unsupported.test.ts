import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'ReturningUnsupportedCustomer',
  properties: {
    id: p.integer().primary(),
    name: p.string().trim().returning(),
  },
});
const options = {
  mysql: { dbName: 'mikro_orm_test_returning_unsupported', port: 3308 },
  mariadb: { dbName: 'mikro_orm_test_returning_unsupported', port: 3309 },
};
describe.each(Utils.keys(options))('returning hints without UPDATE RETURNING [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;
  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({ entities: [Customer], driver: PLATFORMS[type], ...options[type] });
    await orm.schema.refresh();
  });
  beforeEach(() => orm.schema.clear());
  afterAll(() => orm.close(true));
  test.each([1, 2])('does not introduce UPDATE syntax or refresh queries (%s entities)', async count => {
    const em = orm.em.fork();
    const customers = Array.from({ length: count }, (_, i) => em.create(Customer, { id: i + 1, name: 'Initial' }));
    await em.flush();
    customers.forEach(c => (c.name = ' Updated '));
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock.mock.calls.some(([q]) => /\b(returning|output|select)\b/.test(q as string))).toBe(false);
    customers.forEach(c => expect(c.name).toBe(' Updated '));
    mock.mockClear();
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    expect((await em.fork().find(Customer, {})).every(c => c.name === 'Updated')).toBe(true);
  });
});
