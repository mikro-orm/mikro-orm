import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Collection, type Opt, type Ref, type RequiredNullable } from '@mikro-orm/core';
import { Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM as MySqlORM } from '@mikro-orm/mysql';
import { MikroORM, type Options } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { TypeScriptApiMetadataProvider } from '@mikro-orm/reflection-typescript';
import * as sqlEntities from '../../entities-sql/index.js';

enum Status {
  First = 'first',
  Second = 'second',
}

enum Priority {
  Low = 1,
  High = 2,
}

@Entity({ abstract: true })
abstract class ApiBase {
  @PrimaryKey()
  id!: number;

  @Property()
  createdAt: Opt<Date> = new Date();

  @Property()
  deletedAt?: Date;
}

@Entity()
class ApiParent extends ApiBase {
  @Property()
  name!: string;

  @Property({ nullable: true })
  nullable!: RequiredNullable<string>;

  @Enum(() => Status)
  status!: Status;

  @Enum({ items: () => Status, array: true })
  statuses!: Status[];

  @Enum({ items: () => Priority, array: true })
  priorities!: Priority[];

  @Property({ type: 'json' })
  attributes!: Record<string, string>;

  @Property({ type: 'json' })
  optionalUnknown?: unknown;

  @Property({ type: 'json' })
  nested!: { first: string | null; second: number | undefined };

  @Property()
  tags!: string[];

  @OneToMany(() => ApiChild, child => child.parent)
  children = new Collection<ApiChild>(this);
}

@Entity()
class ApiChild extends ApiBase {
  @ManyToOne(() => ApiParent, { ref: true })
  parent!: Ref<ApiParent>;
}

// declared inside a function, so the class is not a statement of its source file
function createNestedEntity() {
  @Entity()
  class ApiNested {
    @PrimaryKey()
    id!: number;
  }

  return ApiNested;
}

async function discover(ORM: typeof MikroORM | typeof MySqlORM, options: Options) {
  const cacheDir = await mkdtemp(join(tmpdir(), 'mikro-orm-reflection-'));

  try {
    const orm = await ORM.init({
      ...options,
      connect: false,
      metadataCache: { enabled: true, options: { cacheDir, combined: 'metadata.json' } },
    } as any);
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    await orm.close(true);
    const cache = JSON.parse(await readFile(join(cacheDir, 'metadata.json'), 'utf8'));

    return { cache, sql };
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
}

function isInstalled(specifier: string) {
  try {
    createRequire(import.meta.url).resolve(specifier);
    return true;
  } catch {
    return false;
  }
}

// tsrs is not a dev dependency: once installed, oxlint runs its type-aware rules with `tsrs-lint`
describe.each([
  ['typescript', TypeScriptApiMetadataProvider, true],
  ['tsrs', TypeScriptApiMetadataProvider.withPackage('tsrs'), isInstalled('tsrs/sync')],
] as const)('TypeScriptApiMetadataProvider (%s)', (_, metadataProvider, installed) => {
  beforeEach(ctx => {
    ctx.skip(!installed);
  });

  test('reads the same metadata and schema as ts-morph from TS sources', async () => {
    const options = { entities: [ApiParent, ApiChild], dbName: ':memory:' };
    const expected = await discover(MikroORM, { ...options, metadataProvider: TsMorphMetadataProvider });
    const actual = await discover(MikroORM, { ...options, metadataProvider });

    expect(actual).toEqual(expected);
  });

  test('reads the same metadata and schema as ts-morph from .d.ts files', async () => {
    const options = {
      entities: ['./entities-compiled'],
      preferTs: false,
      baseDir: import.meta.dirname,
      dbName: ':memory:',
    };
    const expected = await discover(MikroORM, { ...options, metadataProvider: TsMorphMetadataProvider });
    const actual = await discover(MikroORM, { ...options, metadataProvider });

    expect(actual).toEqual(expected);
  });

  test('reads the same metadata and schema as ts-morph for the SQL test entities', async () => {
    const options = {
      entities: Object.values(sqlEntities).filter(e => typeof e === 'function'),
      dbName: 'mikro_orm_test',
    };
    const expected = await discover(MySqlORM, { ...options, metadataProvider: TsMorphMetadataProvider });
    const actual = await discover(MySqlORM, { ...options, metadataProvider });

    expect(actual).toEqual(expected);
  });

  test('throws when the .d.ts files are missing', async () => {
    await expect(
      MikroORM.init({
        entities: ['./entities-compiled-error'],
        entitiesTs: ['./entities-compiled-error'],
        preferTs: false,
        baseDir: import.meta.dirname,
        dbName: ':memory:',
        metadataCache: { enabled: false },
        metadataProvider,
      }),
    ).rejects.toThrow(`Source file './entities-compiled-error/FooBar.ts' not found.`);
  });

  test('throws when the entity class is not declared at the top level of its file', async () => {
    await expect(
      MikroORM.init({
        entities: [ApiParent, ApiChild, createNestedEntity()],
        dbName: ':memory:',
        metadataCache: { enabled: false },
        metadataProvider,
      }),
    ).rejects.toThrow('Source class for entity ApiNested not found.');
  });
});

test('throws when the package does not provide the TypeScript 7 API', async () => {
  await expect(
    MikroORM.init({
      entities: [ApiParent, ApiChild],
      dbName: ':memory:',
      metadataCache: { enabled: false },
      metadataProvider: TypeScriptApiMetadataProvider.withPackage('mikro-orm-missing-package'),
    }),
  ).rejects.toThrow(`could not load the TypeScript 7 API from 'mikro-orm-missing-package'`);
});

test('falls back to default compiler options when the tsconfig is missing', async () => {
  const logger = vi.fn();
  const orm = await MikroORM.init({
    entities: [ApiParent, ApiChild],
    dbName: ':memory:',
    metadataCache: { enabled: false },
    metadataProvider: TypeScriptApiMetadataProvider,
    discovery: { tsConfigPath: './missing-tsconfig.json' },
    debug: ['discovery'],
    logger,
  });

  expect(logger).toHaveBeenCalledWith(expect.stringContaining('missing-tsconfig.json'));
  expect(orm.getMetadata().get(ApiParent).properties.statuses.items).toEqual(['first', 'second']);
  await orm.close();
});
