import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EntityMetadata, MetadataStorage, ReferenceKind, Utils } from '@mikro-orm/core';
import { Configuration, MetadataDiscovery } from '@mikro-orm/core';
import { fs as fsUtils } from '@mikro-orm/core/fs-utils';
import { CLIHelper } from '@mikro-orm/cli';
import { CompileCommand } from '../../../packages/cli/src/commands/CompileCommand.js';
import { MySqlDriver } from '@mikro-orm/mysql';

let tmpDir: string;
let outPath: string;
let outDtsPath: string;
let defaultOutPath: string;
let defaultOutDtsPath: string;
let configRelativeOutPath: string;
let configRelativeOutDtsPath: string;

class User {
  id!: number;
  name!: string;
}

class Address {
  street!: string;
}

function createSimpleMetadata(): MetadataStorage {
  const storage = new MetadataStorage();
  const meta = new EntityMetadata({
    class: User as any,
    className: 'User',
    name: 'User',
    tableName: 'user',
    primaryKeys: ['id'],
    comparableProps: [],
    hydrateProps: [],
    bidirectionalRelations: [],
  });
  meta.properties = {
    id: {
      name: 'id',
      fieldNames: ['id'],
      columnTypes: ['integer'],
      kind: ReferenceKind.SCALAR,
      primary: true,
      type: 'number',
    },
    name: {
      name: 'name',
      fieldNames: ['name'],
      columnTypes: ['varchar(255)'],
      kind: ReferenceKind.SCALAR,
      type: 'string',
    },
  } as any;
  meta.root = meta;
  meta.props = Object.values(meta.properties);
  meta.comparableProps = [meta.properties.id as any, meta.properties.name as any];
  meta.hydrateProps = meta.props;
  storage.set(User as any, meta);

  const embeddableMeta = new EntityMetadata({
    class: Address as any,
    className: 'Address',
    name: 'Address',
    embeddable: true,
    primaryKeys: [],
    comparableProps: [],
    hydrateProps: [],
    bidirectionalRelations: [],
  });
  embeddableMeta.properties = {
    street: {
      name: 'street',
      fieldNames: ['street'],
      columnTypes: ['varchar(255)'],
      kind: ReferenceKind.SCALAR,
      type: 'string',
    },
  } as any;
  embeddableMeta.root = embeddableMeta;
  embeddableMeta.props = Object.values(embeddableMeta.properties);
  embeddableMeta.comparableProps = [embeddableMeta.properties.street as any];
  embeddableMeta.hydrateProps = embeddableMeta.props;
  storage.set(Address as any, embeddableMeta);

  return storage;
}

describe('CompileCommand', () => {
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'mikro-orm-compile-test-'));
    outPath = join(tmpDir, 'sub', 'compiled-functions.js');
    outDtsPath = join(tmpDir, 'sub', 'compiled-functions.d.ts');
    defaultOutPath = join(tmpDir, 'compiled-functions.js');
    defaultOutDtsPath = join(tmpDir, 'compiled-functions.d.ts');
    configRelativeOutPath = join(tmpDir, 'src', 'compiled-functions.js');
    configRelativeOutDtsPath = join(tmpDir, 'src', 'compiled-functions.d.ts');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('builder', () => {
    const cmd = new CompileCommand();
    const mockOption = vi.fn();
    const args = { option: mockOption };
    cmd.builder(args as any);
    expect(mockOption).toHaveBeenCalledWith('out', {
      type: 'string',
      desc: 'Output path for the generated file (defaults to next to your ORM config)',
    });
  });

  test('handler generates CJS output', async () => {
    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValue(
      new Configuration(
        { driver: MySqlDriver, metadataCache: { enabled: true }, getDriver: () => ({ getPlatform: vi.fn() }) } as any,
        false,
      ),
    );
    const discoverMock = vi.spyOn(MetadataDiscovery.prototype, 'discover').mockResolvedValue(createSimpleMetadata());
    const dumpMock = vi.spyOn(CLIHelper, 'dump').mockImplementation(i => i);
    vi.spyOn(CLIHelper, 'isESM').mockReturnValue(false);

    const cmd = new CompileCommand();

    expect(discoverMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({ out: outPath } as any)).resolves.toBeUndefined();
    expect(discoverMock.mock.calls.length).toBe(1);
    expect(discoverMock.mock.calls[0][0]).toBe(false);

    // Verify a valid CJS file was written with actual function entries
    expect(existsSync(outPath)).toBe(true);
    const content = readFileSync(outPath, 'utf-8');
    expect(content).toMatchSnapshot();

    // Verify .d.ts file was generated with CJS export
    expect(existsSync(outDtsPath)).toBe(true);
    const dts = readFileSync(outDtsPath, 'utf-8');
    expect(dts).toContain('export = compiledFunctions');

    // Verify the output message
    expect(dumpMock).toHaveBeenCalledWith(expect.stringContaining('Compiled functions generated'));
  });

  test('handler generates ESM output when project uses type=module', async () => {
    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValue(
      new Configuration(
        { driver: MySqlDriver, metadataCache: { enabled: true }, getDriver: () => ({ getPlatform: vi.fn() }) } as any,
        false,
      ),
    );
    vi.spyOn(MetadataDiscovery.prototype, 'discover').mockResolvedValue(createSimpleMetadata());
    vi.spyOn(CLIHelper, 'dump').mockImplementation(i => i);
    vi.spyOn(CLIHelper, 'isESM').mockReturnValue(true);

    const cmd = new CompileCommand();
    await cmd.handler({ out: outPath } as any);

    const content = readFileSync(outPath, 'utf-8');
    expect(content).toMatchSnapshot();

    // Verify .d.ts file was generated with ESM export
    expect(existsSync(outDtsPath)).toBe(true);
    const dts = readFileSync(outDtsPath, 'utf-8');
    expect(dts).toContain('export default compiledFunctions');
  });

  test('handler outputs next to ORM config file by default', async () => {
    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValue(
      new Configuration(
        { driver: MySqlDriver, metadataCache: { enabled: true }, getDriver: () => ({ getPlatform: vi.fn() }) } as any,
        false,
      ),
    );
    vi.spyOn(MetadataDiscovery.prototype, 'discover').mockResolvedValue(createSimpleMetadata());
    vi.spyOn(CLIHelper, 'dump').mockImplementation(i => i);
    vi.spyOn(CLIHelper, 'getConfigPaths').mockResolvedValue([join(tmpDir, 'src', 'mikro-orm.config.ts')]);
    vi.spyOn(fsUtils, 'absolutePath').mockImplementation(p => p);
    vi.spyOn(fsUtils, 'pathExists').mockReturnValue(true);

    const cmd = new CompileCommand();
    await cmd.handler({} as any);

    expect(existsSync(configRelativeOutPath)).toBe(true);
  });

  test('handler falls back to cwd when no config file is found', async () => {
    vi.spyOn(CLIHelper, 'getConfiguration').mockResolvedValue(
      new Configuration(
        { driver: MySqlDriver, metadataCache: { enabled: true }, getDriver: () => ({ getPlatform: vi.fn() }) } as any,
        false,
      ),
    );
    vi.spyOn(MetadataDiscovery.prototype, 'discover').mockResolvedValue(createSimpleMetadata());
    vi.spyOn(CLIHelper, 'dump').mockImplementation(i => i);
    vi.spyOn(CLIHelper, 'getConfigPaths').mockResolvedValue([join(tmpDir, 'src', 'mikro-orm.config.ts')]);
    vi.spyOn(fsUtils, 'absolutePath').mockImplementation(p => p);
    vi.spyOn(fsUtils, 'pathExists').mockReturnValue(false);
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);

    const cmd = new CompileCommand();
    await cmd.handler({} as any);

    expect(existsSync(defaultOutPath)).toBe(true);
  });
});
