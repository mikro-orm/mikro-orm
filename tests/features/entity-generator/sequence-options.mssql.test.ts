import { MikroORM } from '@mikro-orm/mssql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_eg_sequence',
    password: 'Root.Root',
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
  });
  await orm.schema.ensureDatabase();
  await orm.schema.execute(`
    drop table if exists [ticket], [counter], [plain];
    create table [ticket] ([id] int identity(1000, 5) not null primary key, [name] nvarchar(255) not null);
    create table [counter] ([id] int identity(50, 1) not null primary key);
    create table [plain] ([id] int identity(1, 1) not null primary key);
  `);
});

afterAll(() => orm.close(true));

test('sequence options are emitted from the identity seed and increment', async () => {
  const decorators = (await orm.entityGenerator.generate({ entityDefinition: 'decorators' })).join('\n');
  expect(decorators).toContain('sequence: { startWith: 1000, incrementBy: 5 }');
  expect(decorators).toContain('sequence: { startWith: 50 }');
  expect(decorators.match(/sequence:/g)).toHaveLength(2);

  const defineEntity = (await orm.entityGenerator.generate({ entityDefinition: 'defineEntity' })).join('\n');
  expect(defineEntity).toContain('.sequence({ startWith: 1000, incrementBy: 5 })');
  expect(defineEntity).toContain('.sequence(50)');
});
