import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type MockInstance } from 'vitest';
import { EntitySchema, MetadataStorage, Utils } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { fs } from '@mikro-orm/core/fs-utils';
import { DiscoveryExportCommand } from '../../../packages/cli/src/commands/DiscoveryExportCommand.js';

const pkg = { type: 'module', 'mikro-orm': {} } as any;

process.env.FORCE_COLOR = '0';

class Author {}
class Book {}

const AuthorSchema = new EntitySchema({
  class: Author,
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string' },
  },
});

const BookSchema = new EntitySchema({
  class: Book,
  properties: {
    id: { type: 'number', primary: true },
    title: { type: 'string' },
  },
});

describe('DiscoveryExportCommand', () => {
  let pathExistsMock: MockInstance;
  let dynamicImportMock: MockInstance;
  let getPackageConfigMock: MockInstance;
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
    getPackageConfigMock = vi.spyOn(fs, 'getPackageConfig').mockImplementation(() => pkg);
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
    pkg.type = 'module';
    pkg['mikro-orm'] = {};
  });

  test('has correct command name and description', () => {
    expect(command.command).toBe('discovery:export');
    expect(command.describe).toContain('barrel file');
  });

  test('builder configures yargs options', () => {
    const args = { option: vi.fn() };
    command.builder(args as any);
    expect(args.option).toHaveBeenCalledWith('path', expect.objectContaining({ type: 'string', array: true }));
    expect(args.option).toHaveBeenCalledWith('out', expect.objectContaining({ type: 'string' }));
    expect(args.option).toHaveBeenCalledWith('dump', expect.objectContaining({ type: 'boolean' }));
  });

  test('dumps output to stdout with --dump flag', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author, AuthorSchema };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockReturnValue(false);

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
    expect(output).toMatchSnapshot();
  });

  test('discovers decorator entities via MetadataStorage.isKnownEntity', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).toMatchSnapshot();
  });

  test('skips class implementations linked from EntitySchema', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      // Both the class and schema are exported from the same file
      return { Author, AuthorSchema };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockReturnValue(true);

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
    expect(output).toMatchSnapshot();
  });

  test('uses entitiesTs paths from config when no --path given', async () => {
    const configWithTs = {
      ...config,
      entitiesTs: ['./src/entities-ts'],
    };

    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return configWithTs;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: undefined,
      dump: true,
      out: undefined,
    } as any);

    expect(globMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('entities-ts')]),
      expect.any(String),
    );
  });

  test('falls back to entities paths when entitiesTs has no string paths', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: undefined,
      dump: true,
      out: undefined,
    } as any);

    expect(globMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('entities')]),
      expect.any(String),
    );
  });

  test('throws when no paths available', async () => {
    const configNoPaths = {
      driver: SqliteDriver,
      dbName: 'foo_bar',
      entities: [Author],
    };

    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return configNoPaths;
      }

      return {};
    });

    await expect(
      command.handler({
        _: ['discovery:export'],
        $0: 'mikro-orm',
        contextName: 'default',
        config: undefined,
        path: undefined,
        dump: true,
        out: undefined,
      } as any),
    ).rejects.toThrow('No entity paths found in config. Use --path to specify entity source locations.');
  });

  test('generates ESM imports with .js extension', async () => {
    pkg.type = 'module';
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).toMatchSnapshot();
  });

  test('generates CJS imports without extension', async () => {
    pkg.type = 'commonjs';
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).toMatchSnapshot();
  });

  test('writes to file when --dump is not set', async () => {
    const outPath = resolve(process.cwd(), '.mikro-orm-test-entities.generated.ts');
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: ['./src/entities'],
      dump: false,
      out: outPath,
    } as any);

    expect(existsSync(outPath)).toBe(true);
    const content = readFileSync(outPath, 'utf-8');
    expect(content).toMatchSnapshot();
    unlinkSync(outPath);

    // Should print success message
    expect(dumpSpy).toHaveBeenCalledWith(expect.stringContaining('Entity exports generated'));
  });

  test('shows warning when no entities found', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return {};
    });
    globMock.mockReturnValue([]);

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: ['./src/entities'],
      dump: true,
      out: undefined,
    } as any);

    expect(dumpSpy).toHaveBeenCalledWith(expect.stringContaining('No entities found'));
  });

  test('discovers multiple entities from multiple files', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      if (path.includes('Author')) {
        return { Author };
      }

      if (path.includes('Book')) {
        return { BookSchema };
      }

      return {};
    });
    globMock.mockReturnValue(['Author.ts', 'Book.ts']);
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
    expect(output).toMatchSnapshot();
  });

  test('resolves driver package from config', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    // Mock getConfiguration to return a config with a specific driver
    const getConfigSpy = vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValueOnce({
      get: (key: string, defaultValue?: any) => {
        if (key === 'entities') {
          return ['./src/entities'];
        }
        if (key === 'entitiesTs') {
          return [];
        }
        if (key === 'baseDir') {
          return undefined;
        }
        return defaultValue;
      },
      getDriver: () => ({ constructor: { name: 'PostgreSqlDriver' } }),
    } as any);

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
    expect(output).toMatchSnapshot();
    getConfigSpy.mockRestore();
  });

  test('includes Database type export', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).toMatchSnapshot();
  });

  test('skips .d.ts and non-script files', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts', 'Author.d.ts', 'readme.md']);
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

    // dynamicImport should only be called for config + Author.ts (not .d.ts or .md)
    const importCalls = dynamicImportMock.mock.calls.map((c: any) => c[0]);
    expect(importCalls.filter((c: string) => !c.includes('mikro-orm.config'))).toHaveLength(1);
  });

  test('skips non-entity exports', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      // oxlint-disable-next-line no-empty-function
      return { someHelper: () => {}, CONSTANT: 42, Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).toContain('Author');
    expect(output).not.toContain('someHelper');
    expect(output).not.toContain('CONSTANT');
  });

  test('skips __esModule exports', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { __esModule: true, Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).not.toContain('__esModule');
    expect(output).toContain('Author');
  });

  test('handles default exports', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { default: Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    expect(output).toContain("import Author from './Author.js'");
  });

  test('handles default export of EntitySchema', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { default: AuthorSchema };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockReturnValue(false);

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
    expect(output).toContain("import Author from './Author.js'");
  });

  test('avoids duplicate exports from same file', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      // default and named export of same entity
      return { default: Author, Author };
    });
    globMock.mockReturnValue(['Author.ts']);
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
    // Should only have one Author entry, not duplicates
    expect(output.match(/Author/g)!.length).toBeLessThanOrEqual(4); // import + array + type lines
  });

  test('resolves output path from config when --out is not set', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');
    vi.spyOn(CLIHelper, 'getConfigPaths').mockResolvedValue(['./mikro-orm.config.ts']);

    const outPath = resolve(process.cwd(), 'entities.generated.ts');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: ['./src/entities'],
      dump: false,
      out: undefined,
    } as any);

    expect(existsSync(outPath)).toBe(true);
    unlinkSync(outPath);
    expect(dumpSpy).toHaveBeenCalledWith(expect.stringContaining('Entity exports generated'));
  });

  test('falls back to cwd for output path when no config found', async () => {
    pathExistsMock.mockImplementation(() => false);
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');
    vi.spyOn(CLIHelper, 'getConfigPaths').mockResolvedValue(['./nonexistent.config.ts']);

    // Need to mock getConfiguration to not rely on pathExists for config loading
    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValueOnce({
      get: (key: string, defaultValue?: any) => {
        if (key === 'entities') {
          return ['./src/entities'];
        }
        if (key === 'entitiesTs') {
          return [];
        }
        if (key === 'baseDir') {
          return undefined;
        }
        return defaultValue;
      },
      getDriver: () => ({ constructor: { name: 'SqliteDriver' } }),
    } as any);

    const outPath = resolve(process.cwd(), 'entities.generated.ts');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: ['./src/entities'],
      dump: false,
      out: undefined,
    } as any);

    expect(existsSync(outPath)).toBe(true);
    unlinkSync(outPath);
  });

  test('falls back to @mikro-orm/sql when getDriver throws', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValueOnce({
      get: (key: string, defaultValue?: any) => {
        if (key === 'entities') {
          return ['./src/entities'];
        }
        if (key === 'entitiesTs') {
          return [];
        }
        if (key === 'baseDir') {
          return undefined;
        }
        return defaultValue;
      },
      getDriver: () => {
        throw new Error('no driver');
      },
    } as any);

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
    expect(output).toContain('@mikro-orm/sql');
  });

  test('handles default export with no name (DefaultEntity fallback)', async () => {
    const AnonymousSchema = new EntitySchema({
      name: undefined as any,
      class: undefined as any,
      properties: {
        id: { type: 'number', primary: true },
      },
    });
    // Override meta to clear className and name
    (AnonymousSchema as any).meta.className = undefined;
    (AnonymousSchema as any).meta.name = undefined;

    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { default: AnonymousSchema };
    });
    globMock.mockReturnValue(['Entity.ts']);
    isKnownEntityMock.mockReturnValue(false);

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
    expect(output).toContain('DefaultEntity');
  });

  test('writes CJS output to file', async () => {
    pkg.type = 'commonjs';
    const outPath = resolve(process.cwd(), '.mikro-orm-test-cjs.generated.ts');
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    await command.handler({
      _: ['discovery:export'],
      $0: 'mikro-orm',
      contextName: 'default',
      config: undefined,
      path: ['./src/entities'],
      dump: false,
      out: outPath,
    } as any);

    expect(existsSync(outPath)).toBe(true);
    const content = readFileSync(outPath, 'utf-8');
    expect(content).toContain("from './Author'");
    expect(content).not.toContain('.js');
    unlinkSync(outPath);
  });

  test('falls back to @mikro-orm/sql for unknown driver', async () => {
    pathExistsMock.mockImplementation((path: string) => path.includes('mikro-orm.config'));
    dynamicImportMock.mockImplementation((path: string) => {
      if (path.includes('mikro-orm.config')) {
        return config;
      }

      return { Author };
    });
    globMock.mockReturnValue(['Author.ts']);
    isKnownEntityMock.mockImplementation((name: string) => name === 'Author');

    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValueOnce({
      get: (key: string, defaultValue?: any) => {
        if (key === 'entities') {
          return ['./src/entities'];
        }
        if (key === 'entitiesTs') {
          return [];
        }
        if (key === 'baseDir') {
          return undefined;
        }
        return defaultValue;
      },
      getDriver: () => ({ constructor: { name: 'UnknownDriver' } }),
    } as any);

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
    expect(output).toContain('@mikro-orm/sql');
  });
});
