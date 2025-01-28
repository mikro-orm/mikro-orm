/* eslint @typescript-eslint/consistent-type-imports: ["error", {disallowTypeAnnotations: false}] */
import { join, isAbsolute } from 'node:path';

import { Utils } from './Utils';
import type { Settings } from './ConfigurationLoader';
import type { Options } from './Configuration';

/**
 * @internal
 */
export interface ModuleNotFoundErrorOptions extends ErrorOptions {
  cause: NodeJS.ErrnoException;
}

/**
 * This error is a noop flavor for `ERR_MODULE_NOT_FOUND` error with required `cause` option.
 *
 * @internal
 */

export class ModuleNotFoundError extends Error {

  override readonly cause: NodeJS.ErrnoException;

  /**
   * Module specifier
   */
  readonly specifier: string;

  constructor(specifier: string, options: ModuleNotFoundErrorOptions) {
    const { cause, ...rest } = options;

    super(`Unable to import module "${specifier}"`, rest);

    this.specifier = specifier;
    this.cause = cause;
  }

}

export class ModuleUnknonwnExtensionError extends Error {

  constructor(specifier: string, options?: ErrorOptions) {
    super(`Unable to import "${specifier}" module.\nYou need to install either "ts-node", "jiti", or "tsx" to import TypeScript modules.`, options);
  }

}

/**
 * @internal
 */
export interface TryModuleOptions {
  specifier: string;
}

/**
 * Takes a `promise` returned from an `import()` call, then resolves it to have correct typings, and catches any `ERR_MODULE_NOT_FOUND` error.
 * If such error occurs, then it throws a `ModuleNotFoundError` with the original error as its `cause`.
 *
 * @param promise A promise that resolves the module
 * @param options Extra options
 *
 * @internal
 */
export const tryModule = <TModuleResult>(
  specifier: string,
  options: TryModuleOptions,
): Promise<TModuleResult> => Utils.dynamicImport(specifier).catch((cause): never => {
  if (!(cause instanceof Error) || (cause as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') {
    throw cause;
  }

  throw new ModuleNotFoundError(options.specifier, { cause });
});

/**
 * Returns a value from `default` property of given ES module `value` object.
 *
 * You can use this function to get a value returned from an `import()` call.
 *
 * @param value An ES module object
 *
 * @internal
 */
export const requireDefault = <T>(
  value: T | { default: T },
): T => Utils.isObject(value) && 'default' in value ? value.default : value;

export type LoaderName = 'ts-node' | 'jiti' | 'tsx' | 'native';

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
  import: async specifier => {
    try {
      return requireDefault(await Utils.dynamicImport(specifier));
    } catch (error) {
      if (!(error instanceof Error) || (error as NodeJS.ErrnoException).code !== 'ERR_UNKNOWN_FILE_EXTENSION' || !/.[mc]?tsx?$/.test(specifier)) {
        throw error;
      }

      throw new ModuleUnknonwnExtensionError(specifier, { cause: error });
    }
  },
}));

/**
 * Creates loader factory for [`ts-node`](https://www.npmjs.com/package/ts-node).
 *
 * Note: Unlike the other loaders, this will *register* ts-node as `require` hook.
 *
 * @internal
 */
const createTsNodeLoader = createLoaderFactory(async (root, settings) => {
  const name = 'ts-node';
  const loader: Loader = { ...await createNativeLoader(root, settings), name };

  // If ts-node is already registered, we can just return the loader
  if (Utils.detectTsNode()) {
    return loader;
  }

  const tsNode = requireDefault(await tryModule<typeof import('ts-node')>('ts-node', {
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
    const paths = requireDefault(await tryModule<typeof import('tsconfig-paths')>('tsconfig-paths', {
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
 *
 * @internal
 */
const createJitiLoader = createLoaderFactory(async root => {
  const name = 'jiti';

  const { createJiti } = await tryModule<typeof import('jiti')>('jiti', {
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
 *
 * @internal
 */
const createTsxLoader = createLoaderFactory(async root => {
  const name = 'tsx';

  const tsx = await tryModule<typeof import('tsx/esm/api')>('tsx/esm/api', {
    specifier: name,
  });

  return {
    name,
    import: async specifier => requireDefault(await tsx.tsImport(specifier, root)),
  };
});

const factories = [createTsNodeLoader, createJitiLoader, createTsxLoader];

/**
 * Auto detects available transpiler by iterating over the internal `factories` array (see above) and creating each loader from the list.
 *
 * If a loader factory throws `ModuleNotFoundError` that means there's no transpiler for this package installed.
 *
 * If no loader has been successfully created, it will return native loader and let the runtime to deal with config loading.
 *
 * @internal
 */
const createAutoLoader = createLoaderFactory(async (root, settings) => {
  for (const createLoader of factories) {
    try {
      return await createLoader(root, settings);
    } catch (error) {
      if (!(error instanceof ModuleNotFoundError)) {
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
