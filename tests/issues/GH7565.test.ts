import { defineEntity, EntityProperty, MikroORM, p, Platform, Type, wrap } from '@mikro-orm/sqlite';

const Status = ['new', 'active', 'deleted'] as const;
const ReverseStatus = Object.fromEntries(Object.entries(Status).map(([k, v]) => [v, Number.parseInt(k)]));

class StatusType extends Type<(typeof Status)[number], number> {
  compareAsType() {
    return 'number';
  }

  convertToDatabaseValue(value: (typeof Status)[number]) {
    return ReverseStatus[value];
  }

  convertToJSValue(value: number) {
    return Status[value];
  }

  ensureComparable() {
    return false;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getIntegerTypeDeclarationSQL(prop);
  }
}

const UserSchema = defineEntity({
  name: 'User7565',
  properties: {
    id: p.integer().primary(),
    status: p.type(StatusType).$type<(typeof Status)[number], number, (typeof Status)[number]>().default('new'),
  },
});

class User extends UserSchema.class {}
UserSchema.setClass(User);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refresh();
});

afterAll(async () => orm.close(true));

// assign with a runtime value for a property backed by a custom type whose
// `compareAsType()` (and thus `runtimeType`) reflects the DB representation
// must not fail validation.
test('GH #7565 assign runtime value to custom type', async () => {
  orm.em.create(User, { id: 1, status: 'new' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { id: 1 });
  wrap(user).assign({ status: 'active' });
  await orm.em.flush();

  orm.em.clear();
  const reloaded = await orm.em.findOneOrFail(User, { id: 1 });
  expect(reloaded.status).toBe('active');
});
