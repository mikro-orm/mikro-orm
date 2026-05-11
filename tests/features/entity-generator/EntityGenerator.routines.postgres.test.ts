import { defineEntity, defineRoutine, MikroORM, p } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const RecordSchema = defineEntity({
  name: 'RoutineEmissionRecord',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string().length(255),
  },
});
class RoutineEmissionRecord extends RecordSchema.class {}
RecordSchema.setClass(RoutineEmissionRecord);

const ComputeSum = defineRoutine({
  name: 'compute_sum',
  type: 'function',
  language: 'sql',
  params: {
    a: { type: 'integer' },
    b: { type: 'integer' },
  },
  returns: { runtimeType: 'number', columnType: 'integer' },
  body: 'select a + b',
});

const RecordInsert = defineRoutine({
  name: 'record_insert',
  type: 'procedure',
  language: 'plpgsql',
  params: {
    p_name: { type: 'varchar(255)' },
    p_id: { type: 'integer', direction: 'out', ref: true },
  },
  body: `
    insert into routine_emission_record (name) values (p_name) returning id into p_id;
  `,
});

describe('EntityGenerator — routine emission (PostgreSQL)', () => {
  let orm: MikroORM;
  const dbName = `mikro_orm_test_routine_emit_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName,
      entities: [RoutineEmissionRecord],
      routines: [ComputeSum, RecordInsert],
      extensions: [EntityGenerator],
    });
    await orm.schema.ensureDatabase();
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  it('emits decorator-style @Routine source for introspected functions', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'decorators', decorators: 'legacy' });
    const computeSumFile = dump.find(content => content.includes('class ComputeSum'));
    expect(computeSumFile).toBeDefined();
    expect(computeSumFile).toContain(`from '@mikro-orm/decorators/legacy'`);
    expect(computeSumFile).toContain(`@Routine(`);
    expect(computeSumFile).toContain(`name: 'compute_sum'`);
    expect(computeSumFile).toContain(`type: 'function'`);
    expect(computeSumFile).toContain(`a: { type: 'integer' }`);
    expect(computeSumFile).toContain(`b: { type: 'integer' }`);
  });

  it('emits a procedure with an OUT param and ref: true', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'defineEntity' });
    const recordInsert = dump.find(content => content.includes('record_insert'));
    expect(recordInsert).toBeDefined();
    expect(recordInsert).toContain(`type: 'procedure'`);
    expect(recordInsert).toContain(`p_name: { type: 'character varying' }`);
    expect(recordInsert).toContain(`direction: 'out'`);
    expect(recordInsert).toContain(`ref: true`);
  });

  it('emits new RoutineSchema() when entityDefinition is entitySchema', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'entitySchema' });
    const schemaSource = dump.find(content => content.includes('compute_sum') && content.includes('RoutineSchema'));
    expect(schemaSource).toBeDefined();
    expect(schemaSource).toContain(`new RoutineSchema(`);
  });
});
