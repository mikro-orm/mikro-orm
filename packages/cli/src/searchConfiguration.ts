import {
  type AnyEntity,
  type EntityClass,
  type EntityManager,
  type EntityManagerType,
  type EntitySchema,
  type IDatabaseDriver,
  type Options,
} from '@mikro-orm/core';

/**
 * Search a config file for a given contextName.
 *
 * @param configExports The exports from a config file. Importing is left to the caller.
 * @param contextName The context name to search the config for.
 * @param path Path to display in error messages. Callers can use this to match the path the exports were imported from.
 *
 * @return A promise that resolves with The matching configuration options, as defined in the configExports.
 * The caller is responsible for further adjustments or dependency imports.
 */
export async function searchConfiguration<
  Driver extends IDatabaseDriver = IDatabaseDriver,
  EM extends EntityManager<Driver> & Driver[typeof EntityManagerType] = EntityManager<Driver> &
    Driver[typeof EntityManagerType],
  Entities extends readonly (string | EntityClass<AnyEntity> | EntitySchema)[] = (
    | string
    | EntityClass<AnyEntity>
    | EntitySchema
  )[],
>(configExports: unknown, contextName = 'default', path = ''): Promise<Options<Driver, EM, Entities>> {
  let tmp = configExports as Options<Driver, EM, Entities>;

  // oxfmt-ignore
  const configFinder = (cfg: unknown) => {
    return typeof cfg === 'object' && cfg !== null && ('contextName' in cfg ? cfg.contextName === contextName : contextName === 'default');
  };

  const isValidConfigFactoryResult = (cfg: unknown) => {
    return typeof cfg === 'object' && cfg !== null && (!('contextName' in cfg) || cfg.contextName === contextName);
  };

  if (Array.isArray(tmp)) {
    const tmpFirstIndex = tmp.findIndex(configFinder);
    if (tmpFirstIndex === -1) {
      // Static config not found. Try factory functions
      let configCandidate: Options<Driver, EM, Entities>;
      for (let i = 0, l = tmp.length; i < l; ++i) {
        const f = tmp[i];
        if (typeof f !== 'function') {
          continue;
        }
        configCandidate = await f(contextName);
        if (!isValidConfigFactoryResult(configCandidate)) {
          continue;
        }
        tmp = configCandidate;
        break;
      }
      if (Array.isArray(tmp)) {
        throw new Error(
          `MikroORM config '${contextName}' was not found within the config file '${path}'. Either add a config with this name to the array, or add a function that when given this name will return a configuration object without a name, or with name set to this name.`,
        );
      }
    } else {
      const tmpLastIndex = tmp.findLastIndex(configFinder);
      if (tmpLastIndex !== tmpFirstIndex) {
        throw new Error(
          `MikroORM config '${contextName}' is not unique within the array exported by '${path}' (first occurrence index: ${tmpFirstIndex}; last occurrence index: ${tmpLastIndex})`,
        );
      }
      tmp = tmp[tmpFirstIndex];
    }
  } else {
    if (tmp instanceof Function) {
      tmp = await tmp(contextName);

      if (!isValidConfigFactoryResult(tmp)) {
        throw new Error(
          `MikroORM config '${contextName}' was not what the function exported from '${path}' provided. Ensure it returns a config object with no name, or name matching the requested one.`,
        );
      }
    } else {
      if (!configFinder(tmp)) {
        throw new Error(`MikroORM config '${contextName}' was not what the default export from '${path}' provided.`);
      }
    }
  }
  return tmp;
}
