import { MikroORM, Routine } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

// A function with an unnamed parameter — `pg_get_function_arguments` reports its signature as just
// the bare type (`text`), which used to crash routine introspection.
const echoMessageDdl = `create or replace function echo_message(text) returns text as $$ begin return $1; end; $$ language plpgsql`;

describe('GH issue 7905', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: `mikro_orm_test_gh_7905`,
      schemaGenerator: { ignoreRoutines: true },
    });

    await orm.schema.ensureDatabase();
    await orm.schema.refresh();
    await orm.schema.execute(echoMessageDdl);
  });

  afterAll(async () => {
    await orm.schema.execute(`drop function if exists echo_message(text)`);
    await orm.close(true);
  });

  test('introspects the unnamed parameter into a nameless param def', async () => {
    const helper = orm.em.getPlatform().getSchemaHelper()!;
    const routines = await helper.getAllRoutines(orm.em.getConnection(), ['public']);
    const echo = routines.find(r => r.name === 'echo_message');

    expect(echo).toBeDefined();
    expect(echo!.params).toEqual([{ name: '', type: 'text', direction: 'in' }]);
    expect(echo!.returns?.type).toBe('text');
  });

  test('leaves the unmanaged routine alone (ignoreRoutines enabled, no churn)', async () => {
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');
  });

  test('diffs cleanly against a managed declaration with an unnamed parameter', async () => {
    // An unnamed parameter cannot be keyed by name, so it is declared under an empty key; the
    // routine is created via raw DDL (`expression`) to match the externally created function.
    const EchoMessage = new Routine({
      name: 'echo_message',
      type: 'function',
      language: 'plpgsql',
      params: { '': { type: 'text', runtimeType: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      expression: echoMessageDdl,
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: `mikro_orm_test_gh_7905`,
      routines: [EchoMessage],
    });

    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm2.close(true);
  });

  test('detects a type change on the unnamed parameter (recreates the routine)', async () => {
    // The DB function takes an unnamed `text`; declaring the (still unnamed) parameter as a
    // different type must be picked up by the comparator rather than silently treated as equal.
    const EchoMessage = new Routine({
      name: 'echo_message',
      type: 'function',
      language: 'plpgsql',
      params: { '': { type: 'integer', runtimeType: 'number' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      expression: echoMessageDdl,
    });

    const orm2 = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: `mikro_orm_test_gh_7905`,
      routines: [EchoMessage],
    });

    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatch(/create or replace function echo_message/i);

    await orm2.close(true);
  });
});
