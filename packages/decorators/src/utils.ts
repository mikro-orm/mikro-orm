import {
  type Dictionary,
  type EntityKey,
  EntityManager,
  type EntityMetadata,
  type EntityProperty,
  EntityRepository,
  type MaybePromise,
  MetadataError,
  MetadataStorage,
  MikroORM,
  type ReferenceKind,
  Utils,
} from '@mikro-orm/core';

/**
 * The type of context that the user intends to inject.
 */
export type ContextProvider<T> = MaybePromise<MikroORM> | ((type: T) => MaybePromise<MikroORM | EntityManager | EntityRepository<any> | { getEntityManager(): EntityManager }>);

function getEntityManager(caller: { orm?: MikroORM; em?: EntityManager }, context: unknown): EntityManager | undefined {
  if (context instanceof EntityManager) {
    return context;
  }

  if (context instanceof EntityRepository) {
    return context.getEntityManager();
  }

  if (context instanceof MikroORM) {
    return context.em;
  }

  if (caller.em instanceof EntityManager) {
    return caller.em;
  }

  if (caller.orm instanceof MikroORM) {
    return caller.orm.em;
  }

  return undefined;
}

/**
 * Find `EntityManager` in provided context, or else in instance's `orm` or `em` properties.
 */
export async function resolveContextProvider<T>(caller: T & { orm?: MaybePromise<MikroORM>; em?: MaybePromise<EntityManager> }, provider?: ContextProvider<T>): Promise<EntityManager | undefined> {
  const context = typeof provider === 'function' ? await provider(caller) : await provider;
  return getEntityManager({ orm: await caller.orm, em: await caller.em }, context);
}

/**
 * Relation decorators allow using two signatures
 * - using first parameter as options object
 * - using all parameters
 *
 * This function validates those two ways are not mixed and returns the final options object.
 * If the second way is used, we always consider the last parameter as options object.
 * @internal
 */
export function processDecoratorParameters<T>(params: Dictionary): T {
  const keys = Object.keys(params);
  const values = Object.values(params);

  if (!Utils.isPlainObject(values[0])) {
    const lastKey = keys[keys.length - 1];
    const last = params[lastKey];
    delete params[lastKey];

    return { ...last, ...params };
  }

  // validate only first parameter is used if its an option object
  const empty = (v: unknown) => v == null || (Utils.isPlainObject(v) && !Utils.hasObjectKeys(v));
  if (values.slice(1).some(v => !empty(v))) {
    throw new Error('Mixing first decorator parameter as options object with other parameters is forbidden. ' +
      'If you want to use the options parameter at first position, provide all options inside it.');
  }

  return values[0] as T;
}

/**
 * Validate there is only one property decorator. This disallows using `@Property()` together with e.g. `@ManyToOne()`
 * on the same property. One should use only `@ManyToOne()` in such case.
 * We allow the existence of the property in metadata if the reference kind is the same, this should allow things like HMR to work.
 */
export function validateSingleDecorator(meta: EntityMetadata, propertyName: string, kind: ReferenceKind): void {
  if (meta.properties[propertyName] && meta.properties[propertyName].kind !== kind) {
    throw MetadataError.multipleDecorators(meta.className, propertyName);
  }
}

/**
 * Prepares and returns a metadata context for an entity, ensuring default structure and validating proper usage of a single decorator.
 * We need to use the `Object.hasOwn` here, since the metadata object respects inheritance, and the `properties` object might already
 * exist for some base entity.
 */
export function prepareMetadataContext<T>(context: ClassFieldDecoratorContext<T> | ClassGetterDecoratorContext<T> | ClassMethodDecoratorContext<T>, kind?: ReferenceKind): EntityMetadata<T> {
  const meta = context.metadata as unknown as EntityMetadata<T>;

  if (!Object.hasOwn(meta, 'properties')) {
    meta.properties = { ...meta.properties };
  }

  if (kind) {
    validateSingleDecorator(meta, context.name as string, kind);
  }

  return meta;
}

/**
 * Uses some dark magic to get source path to caller where decorator is used.
 * Analyzes stack trace of error created inside the function call.
 */
export function lookupPathFromDecorator(name: string, stack?: string[]): string {
  // use some dark magic to get source path to caller
  stack = stack || new Error().stack!.split('\n');
  // In some situations (e.g. swc 1.3.4+), the presence of a source map can obscure the call to
  // __decorate(), replacing it with the constructor name. To support these cases we look for
  // Reflect.decorate() as well. Also when babel is used, we need to check
  // the `_applyDecoratedDescriptor` method instead.
  let line = stack.findIndex(line => line.match(/__decorate|Reflect\.decorate|_applyDecoratedDescriptor/));

  // bun does not have those lines at all, only the DecorateProperty/DecorateConstructor,
  // but those are also present in node, so we need to check this only if they weren't found.
  if (line === -1) {
    // here we handle bun which stack is different from nodejs so we search for reflect-metadata
    // Different bun versions might have different stack traces. The "last index" works for both 1.2.6 and 1.2.7.
    const reflectLine = stack.findLastIndex(line => line.replace(/\\/g, '/').includes('node_modules/reflect-metadata/Reflect.js'));

    if (reflectLine === -1 || reflectLine + 2 >= stack.length || !stack[reflectLine + 1].includes('bun:wrap')) {
      return name;
    }

    line = reflectLine + 2;
  }

  if (stack[line].includes('Reflect.decorate')) {
    line++;
  }

  if (stack[line].replace(/\\/g, '/').includes('node_modules/tslib/tslib')) {
    line++;
  }

  try {
    const re = stack[line].match(/\(.+\)/i) ? /\((.*):\d+:\d+\)/ : /at\s*(.*):\d+:\d+$/;
    return stack[line].match(re)![1];
  } catch {
    return name;
  }
}

export function getMetadataFromDecorator<T = any>(target: T & Dictionary & { [MetadataStorage.PATH_SYMBOL]?: string }): EntityMetadata<T> {
  if (!Object.hasOwn(target, MetadataStorage.PATH_SYMBOL)) {
    Object.defineProperty(
      target,
      MetadataStorage.PATH_SYMBOL,
      { value: lookupPathFromDecorator(target.name), writable: true },
    );
  }

  return MetadataStorage.getMetadata(target.name, target[MetadataStorage.PATH_SYMBOL]!);
}
