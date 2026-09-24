import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Embedding {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'vector(3)', nullable: true })
  vec?: unknown;

  @Property({ columnType: 'halfvec(3)', nullable: true })
  half?: unknown;

  @Property({ columnType: 'sparsevec(5)', nullable: true })
  sparse?: unknown;
}

@Entity({ tableName: 'embedding' })
class Embedding2 {
  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'vector(3)', nullable: true })
  vec?: unknown;

  @Property({ columnType: 'halfvec(4)', nullable: true })
  half?: unknown;

  @Property({ columnType: 'sparsevec(6)', nullable: true })
  sparse?: unknown;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Embedding],
    dbName: 'pgvector-halfvec-sparsevec',
  });
  await orm.schema.execute('create extension if not exists vector');
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('halfvec and sparsevec dimensions survive introspection', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL();
  expect(diff).toMatchObject({ up: '', down: '' });

  orm.discoverEntity(Embedding2, Embedding);
  const diff2 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff2.up).toContain('alter table "embedding" alter column "half" type halfvec(4)');
  expect(diff2.up).toContain('alter table "embedding" alter column "sparse" type sparsevec(6)');
  expect(diff2.up).not.toContain('"vec"');
  expect(diff2.down).toContain('alter table "embedding" alter column "half" type halfvec(3)');
  expect(diff2.down).toContain('alter table "embedding" alter column "sparse" type sparsevec(5)');
});
