import { defineEntity, Routine, MikroORM, p } from '@mikro-orm/postgresql';
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

const ComputeSum = new Routine({
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

const RecordInsert = new Routine({
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

  it('emits `new Routine(...)` const source for introspected functions', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'decorators' });
    const computeSumFile = dump.find(content => content.includes('ComputeSum'));
    expect(computeSumFile).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const ComputeSum = new Routine({
        name: 'compute_sum',
        type: 'function',
        schema: 'public',
        language: 'sql',
        security: 'invoker',
        deterministic: false,
        params: {
          a: { type: 'integer' },
          b: { type: 'integer' },
        },
        returns: { runtimeType: 'number', columnType: 'integer', nullable: true },
        body: 'select a + b',
      });
      "
    `);
  });

  it('emits a procedure with an OUT param and ref: true', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'defineEntity' });
    const recordInsert = dump.find(content => content.includes('record_insert'));
    expect(recordInsert).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const RecordInsert = new Routine({
        name: 'record_insert',
        type: 'procedure',
        schema: 'public',
        language: 'plpgsql',
        security: 'invoker',
        deterministic: false,
        params: {
          p_name: { type: 'character varying' },
          p_id: { type: 'integer', direction: 'out', ref: true },
        },
        body: 'insert into routine_emission_record (name) values (p_name) returning id into p_id',
      });
      "
    `);
  });

  it('emits new Routine() regardless of entityDefinition mode', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'entitySchema' });
    const schemaSource = dump.find(content => content.includes('compute_sum') && content.includes('Routine'));
    expect(schemaSource).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const ComputeSum = new Routine({
        name: 'compute_sum',
        type: 'function',
        schema: 'public',
        language: 'sql',
        security: 'invoker',
        deterministic: false,
        params: {
          a: { type: 'integer' },
          b: { type: 'integer' },
        },
        returns: { runtimeType: 'number', columnType: 'integer', nullable: true },
        body: 'select a + b',
      });
      "
    `);
  });
});
