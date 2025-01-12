import { join, isAbsolute } from 'node:path';

import { tryModule, TryModuleError, requireDefault, Utils } from './Utils';
import type { Settings } from './ConfigurationLoader';
import type { Options } from './Configuration';

type LoaderName = 'ts-node' | 'jiti' | 'tsx' | 'native';

/**
 * A set of supported TypeScript loaders
 */
export type LoaderOption = LoaderName | 'auto' | false | null | undefined;

interface Loader {
  name: LoaderName;
  import(specifier: string): Promise<Options>;
}

type LoaderFactory = (projectRoot: string, cliSettings: Settings) => Promise<Loader>;

const createLoaderFactory = (fn: LoaderFactory): LoaderFactory => fn;

const createNativeLoader = createLoaderFactory(async () => ({
  name: 'native',
  import: async specifier => requireDefault(await import(specifier)), // TODO: Handle module not found errors and report if the specifier is .ts file
}));

/**
 * Creates loader factory for [`ts-node`](https://www.npmjs.com/package/ts-node).
 *
 * Note: Unlike the other loaders, this will *register* ts-node as `require` hook.
 */
const createTsNodeLoader = createLoaderFactory(async (root, settings) => {
  const name = 'ts-node';
  const loader: Loader = {
    name,
    import: async specifier => requireDefault(await import(specifier)),
  };

  // If ts-node is already registered, we can just return the loader
  if (Utils.detectTsNode()) {
    return loader;
  }

  const tsNode = requireDefault(await tryModule(import('ts-node'), {
    specifier: name,
  }));

  const configPath = settings.tsConfigPath || 'tsconfig.json';
  const tsConfigPath = isAbsolute(configPath) ? configPath : join(process.cwd(), configPath);

  const { options } = tsNode.register({
    cwd: root,
    project: tsConfigPath,
    transpileOnly: true,
    compilerOptions: {
      module: 'nodenext',
      moduleResolution: 'nodenext',
    },
  }).config;

  // Register tsconfig-paths to support custom module resolution
  if (Utils.isObject(options.paths) && Object.keys(options.paths).length > 0) {
    const paths = requireDefault(await tryModule(import('tsconfig-paths'), {
      specifier: 'tsconfig-paths',
    }));

    paths.register({
      baseUrl: options.baseUrl ?? '.',
      paths: options.paths,
    });
  }

  return loader;
});

/**
 * Creates loader factory for [`jiti`](https://www.npmjs.com/package/jiti) transpiler
 */
const createJitiLoader = createLoaderFactory(async root => {
  const name = 'jiti';

  const { createJiti } = await tryModule(import('jiti'), {
    specifier: name,
  });

  const jiti = createJiti(root);

  return {
    name,
    import: specifier => jiti.import(specifier, {
      default: true,
    }),
  };
});

/**
 * Creates loader factory for [`tsx`](https://www.npmjs.com/package/tsx) transpiler
 */
const createTsxLoader = createLoaderFactory(async root => {
  const name = 'tsx';

  const { tsImport } = await tryModule(import('tsx/esm/api'), {
    specifier: name,
  });

  return {
    name,
    import: async specifier => requireDefault(await tsImport(specifier, root)),
  };
});

const factories = [createTsNodeLoader, createJitiLoader, createTsxLoader];

/**
 * Auto detects available transpiler by iterating over the internal `factories` array (see above) and creating each loader from the list.
 *
 * If a loader factory throws `TryModuleError` that means there's no transpiler for this package installed.
 *
 * If no loader has been successfully created, it will return native loader and let the runtime to deal with config loading.
 */
export const createAutoLoader = createLoaderFactory(async (root, settings) => {
  for (const createLoader of factories) {
    try {
      return await createLoader(root, settings);
    } catch (error) {
      if (!(error instanceof TryModuleError)) {
        throw error;
      }
    }
  }

  return createNativeLoader(root, settings);
});

/**
 * Creates a loader depending on given `settings.loader` value.
 *
 * If no loader specified, it will auto-detect whatever transpiler is installed within the project's `node_modules` by importing it via `import()`.
 */
export const createLoader = createLoaderFactory((root, settings) => {
  if (settings.alwaysAllowTs || settings.preferTs === false || settings.useTsNode === false) {
    return createNativeLoader(root, settings);
  }

  switch (settings.loader) {
    case 'ts-node':
      return createTsNodeLoader(root, settings);
    case 'jiti':
      return createJitiLoader(root, settings);
    case 'tsx':
      return createTsxLoader(root, settings);
    case 'native':
    case false:
      return createNativeLoader(root, settings);
    default:
      return createAutoLoader(root, settings);
  }
});
