import { fs } from '@mikro-orm/core/fs-utils';
import { discoverEntities } from '../../packages/core/src/metadata/discover-entities.js';
import { Entity } from '@mikro-orm/decorators/legacy';

describe('GH7348', () => {
  const originalNormalizePath = fs.normalizePath;
  const originalAbsolutePath = fs.absolutePath;
  const originalGlob = fs.glob;
  const originalDynamicImport = fs.dynamicImport;

  afterEach(() => {
    fs.normalizePath = originalNormalizePath;
    fs.absolutePath = originalAbsolutePath;
    fs.glob = originalGlob;
    fs.dynamicImport = originalDynamicImport;
  });

  it('should discover entity from direct module export shape', async () => {
    @Entity()
    class Staff {}

    const file = 'dist/entities/staff.entity.js';
    const fullPath = '/app/dist/entities/staff.entity.js';

    fs.normalizePath = ((...args: string[]) =>
      args.filter(Boolean).join('/').replace(/\/+/g, '/')) as typeof fs.normalizePath;
    fs.absolutePath = ((path: string) => path) as typeof fs.absolutePath;
    fs.glob = ((paths: string | string[]) => {
      expect(paths).to.deep.eq(['/app/dist/entities/*.js']);
      return [file];
    }) as typeof fs.glob;
    fs.dynamicImport = (async (path: string) => {
      expect(path).to.eq(fullPath);
      return { Staff };
    }) as typeof fs.dynamicImport;

    const ret = await discoverEntities('/app/dist/entities/*.js', { baseDir: '/app' });
    const entities = [...ret];

    expect(entities).to.have.length(1);
    expect(entities[0]).to.eq(Staff);
  });

  it('should discover entity from CommonJS interop default export shape', async () => {
    @Entity()
    class Staff {}

    const file = 'dist/entities/staff.entity.js';
    const fullPath = '/app/dist/entities/staff.entity.js';

    fs.normalizePath = ((...args: string[]) =>
      args.filter(Boolean).join('/').replace(/\/+/g, '/')) as typeof fs.normalizePath;
    fs.absolutePath = ((path: string) => path) as typeof fs.absolutePath;
    fs.glob = (() => [file]) as typeof fs.glob;
    fs.dynamicImport = (async (path: string) => {
      expect(path).to.eq(fullPath);
      return {
        __esModule: true,
        default: { Staff },
        'module.exports': { Staff },
      };
    }) as typeof fs.dynamicImport;

    const ret = await discoverEntities('/app/dist/entities/*.js', { baseDir: '/app' });
    const entities = [...ret];

    expect(entities).to.have.length(1);
    expect(entities[0]).to.eq(Staff);
  });
});
