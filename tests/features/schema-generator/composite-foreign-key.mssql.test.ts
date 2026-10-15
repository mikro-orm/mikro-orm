import { DatabaseSchema, defineEntity, MikroORM, p } from '@mikro-orm/mssql';

const User = defineEntity({
  name: 'User',
  tableName: 'cfk_user',
  properties: {
    id: p.integer().primary(),
  },
});

const Device = defineEntity({
  name: 'Device',
  tableName: 'cfk_device',
  properties: {
    id: p.integer().primary(),
  },
});

const UserDevice = defineEntity({
  name: 'UserDevice',
  tableName: 'cfk_user_device',
  properties: {
    user: () => p.manyToOne(User).primary(),
    device: () => p.manyToOne(Device).primary(),
  },
});

// the FK columns are not in alphabetical order, so their order only comes from the constraint definition
const EmergencyContact = defineEntity({
  name: 'EmergencyContact',
  tableName: 'cfk_emergency_contact',
  properties: {
    id: p.integer().primary(),
    userDevice: () => p.manyToOne(UserDevice).fieldNames('user_id', 'device_id').deleteRule('cascade'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Device, UserDevice, EmergencyContact],
    dbName: 'mikro_orm_test_composite_fk',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('composite foreign key columns keep their pairing after introspection', async () => {
  const schema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
  const fks = Object.values(schema.getTable('cfk_emergency_contact')!.getForeignKeys());

  expect(fks).toHaveLength(1);
  expect(fks[0]).toMatchObject({
    columnNames: ['user_id', 'device_id'],
    referencedTableName: 'dbo.cfk_user_device',
    referencedColumnNames: ['user_id', 'device_id'],
    deleteRule: 'cascade',
    updateRule: 'cascade',
  });
});

test('composite foreign key produces no diff once created', async () => {
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
