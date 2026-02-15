import type { EntityKey, EntityMetadata, EntityProperty, PopulateHintOptions, PopulateOptions } from '../typings.js';
import { LoadStrategy, PopulatePath, ReferenceKind } from '../enums.js';
import { Utils } from '../utils/Utils.js';

/**
 * Expands `books.perex` like populate to use `children` array instead of the dot syntax
 */
function expandNestedPopulate<Entity>(parentProp: EntityProperty, parts: string[], strategy?: LoadStrategy, all?: boolean): PopulateOptions<Entity> {
  const meta = parentProp.targetMeta as EntityMetadata<Entity>;
  const field = parts.shift()! as EntityKey<Entity>;
  const prop = meta.properties[field];
  const ret = { field, strategy, all } as PopulateOptions<Entity>;

  if (parts.length > 0) {
    ret.children = [expandNestedPopulate(prop, parts, strategy)];
  }

  return ret;
}

/**
 * @internal
 */
export function expandDotPaths<Entity>(meta: EntityMetadata<Entity>, populate?: readonly (string | PopulateOptions<Entity>)[], normalized = false) {
  const ret = normalized ? populate as PopulateOptions<Entity>[] : Utils.asArray(populate).map(field => {
    if (typeof field === 'string') {
      return { field } as PopulateOptions<Entity>;
    }

    /* v8 ignore next */
    return typeof field === 'boolean' || field.field === PopulatePath.ALL
      ? { all: !!field, field: meta.primaryKeys[0] } as PopulateOptions<Entity>
      : field;
  });

  for (const p of ret) {
    if (!p.field.includes('.')) {
      continue;
    }

    const [f, ...parts] = p.field.split('.');
    p.field = f as EntityKey<Entity>;
    p.children ??= [];
    const prop = meta.properties[p.field];

    if (parts[0] === PopulatePath.ALL) {
      prop.targetMeta!.props
        .filter(prop => prop.lazy || prop.kind !== ReferenceKind.SCALAR)
        .forEach(prop => p.children!.push({ field: prop.name as EntityKey, strategy: p.strategy }));
    } else if (prop.kind === ReferenceKind.EMBEDDED) {
      const embeddedProp = Object.values(prop.embeddedProps).find(c => c.embedded![1] === parts[0]);
      ret.push({
        ...p,
        field: embeddedProp!.name as EntityKey,
        children: parts.length > 1 ? [expandNestedPopulate(embeddedProp!, parts.slice(1), p.strategy, p.all)] : [],
      });
      p.children.push(expandNestedPopulate(prop, parts, p.strategy, p.all));
    } else {
      p.children.push(expandNestedPopulate(prop, parts, p.strategy, p.all));
    }
  }

  return ret;
}

/**
 * Returns the loading strategy based on the provided hint.
 * If `BALANCED` strategy is used, it will return JOINED if the property is a to-one relation.
 * @internal
 */
export function getLoadingStrategy(strategy: LoadStrategy | `${LoadStrategy}`, kind: ReferenceKind): LoadStrategy.SELECT_IN | LoadStrategy.JOINED {
  if (strategy === LoadStrategy.BALANCED) {
    return [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(kind)
      ? LoadStrategy.JOINED
      : LoadStrategy.SELECT_IN;
  }

  return strategy as LoadStrategy.SELECT_IN | LoadStrategy.JOINED;
}

/**
 * Applies per-relation overrides from `populateHints` to the normalized populate tree.
 * @internal
 */
export function applyPopulateHints<Entity>(
  populate: PopulateOptions<Entity>[],
  hints: Record<string, PopulateHintOptions>,
): void {
  for (const [path, hint] of Object.entries(hints)) {
    const entry = findPopulateEntry(populate, path.split('.'));

    if (!entry) {
      continue;
    }

    if (hint.strategy != null) {
      entry.strategy = hint.strategy as LoadStrategy;
    }

    if (hint.joinType != null) {
      entry.joinType = hint.joinType;
    }
  }
}

function findPopulateEntry<Entity>(populate: PopulateOptions<Entity>[], parts: string[]): PopulateOptions<Entity> | undefined {
  let current = populate;

  for (let i = 0; i < parts.length; i++) {
    const entry = current.find(p => (p.field as string).split(':')[0] === parts[i]);

    if (!entry) {
      return undefined;
    }

    if (i === parts.length - 1) {
      return entry;
    }

    current = (entry.children ?? []) as PopulateOptions<Entity>[];
  }

  /* v8 ignore next */
  return undefined;
}
