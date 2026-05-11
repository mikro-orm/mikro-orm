import { type MockInstance } from 'vitest';
import { EntitySchema, MetadataStorage, Utils } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { fs } from '@mikro-orm/core/fs-utils';

// Force win32 semantics so we can reproduce the Windows-only path separator bug on POSIX hosts
vi.mock('node:path', async () => {
  const actual = await vi.importActual<typeof import('node:path')>('node:path');
  return {
    ...actual,
    default: actual,
    relative: actual.win32.relative,
    dirname: actual.win32.dirname,
  };
});

const { DiscoveryExportCommand } = await import('../../../packages/cli/src/commands/DiscoveryExportCommand.js');

const pkg = { type: 'module', 'mikro-orm': {} } as any;

process.env.FORCE_COLOR = '0';

class Author {}

const AuthorSchema = new EntitySchema({
  class: Author,
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
  },
});

describe('DiscoveryExportCommand [windows path separators]', () => {
  let pathExistsMock: MockInstance;
  let dynamicImportMock: MockInstance;
  let dumpSpy: MockInstance;
  let globMock: MockInstance;
  let isKnownEntityMock: MockInstance;

  const command = new DiscoveryExportCommand();
  const config = {
    driver: SqliteDriver,
    dbName: 'foo_bar',
    entities: ['./src/entities'],
  };

  beforeEach(() => {
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
    process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
    process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH = '1';
    pathExistsMock = vi.spyOn(fs, 'pathExists');
    dynamicImportMock = vi.spyOn(fs, 'dynamicImport');
    vi.spyOn(fs, 'getPackageConfig').mockImplementation(() => pkg);
    // oxlint-disable-next-line no-empty-function
    dumpSpy = vi.spyOn(CLIHelper, 'dump').mockImplementation(() => {});
    globMock = vi.spyOn(fs, 'glob');
    isKnownEntityMock = vi.spyOn(MetadataStorage, 'isKnownEntity');
    vi.spyOn(fs, 'readJSONSync').mockImplementation(() => pkg);
    vi.spyOn(Utils, 'tryImport').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.keys(process.env)
      .filter(k => k.startsWith('MIKRO_ORM_'))
      .forEach(k => delete process.env[k]);
  });

  test('generated import paths always use forward slashes (regression #7698)', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author, AuthorSchema };
    });
    globMock.mockReturnValue(['src/entities/author.entity.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: ['./src/entities'],
      dump: true,
      out: undefined,
    } as any);

    const output = dumpSpy.mock.calls[0][0] as string;
    const imports = output.match(/from\s+'[^']+'/g) ?? [];
    for (const imp of imports) {
      expect(imp).not.toContain('\\');
    }
    expect(output).toContain("from './src/entities/author.entity.js'");
  });
});
